import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  encodeTlvField,
  generateZatcaTlvBase64,
  decodeZatcaTlvBase64,
  type ZatcaQrFields,
} from './zatcaQr';

describe('ZATCA TLV Encoding & Decoding for Simplified Tax Invoices', () => {
  it('correctly encodes a single TLV tag with UTF-8 byte length (Arabic support)', () => {
    const arabicText = 'عيادات أفق لطب الأسنان';
    const tlv = encodeTlvField(1, arabicText);

    // Tag should be 1
    assert.equal(tlv[0], 1);

    // Length should match UTF-8 byte length
    const utf8Bytes = new TextEncoder().encode(arabicText);
    assert.equal(tlv[1], utf8Bytes.length);

    // Value matches UTF-8 bytes
    const decodedVal = new TextDecoder().decode(tlv.slice(2));
    assert.equal(decodedVal, arabicText);
  });

  it('correctly encodes all 5 mandatory ZATCA tags into Base64 TLV', () => {
    const sampleInvoice: ZatcaQrFields = {
      sellerName: 'مجمع عيادات أفق لطب الأسنان',
      vatNumber: '310123456700003',
      timestamp: '2026-09-24T12:00:00.000Z',
      totalWithVat: '1150.00',
      vatAmount: '150.00',
    };

    const base64 = generateZatcaTlvBase64(sampleInvoice);
    assert.ok(base64);
    assert.equal(typeof base64, 'string');
    assert.ok(base64.length > 50);

    // Verify round-trip decoding matches the original 5 tags
    const decoded = decodeZatcaTlvBase64(base64);
    assert.equal(decoded.sellerName, sampleInvoice.sellerName);
    assert.equal(decoded.vatNumber, sampleInvoice.vatNumber);
    assert.equal(decoded.timestamp, sampleInvoice.timestamp);
    assert.equal(decoded.totalWithVat, '1150.00');
    assert.equal(decoded.vatAmount, '150.00');
  });

  it('correctly handles numeric inputs for totalWithVat and vatAmount', () => {
    const sampleInvoice: ZatcaQrFields = {
      sellerName: 'عيادة ابتسامة النخبة',
      vatNumber: '300000000000003',
      timestamp: '2026-09-24T15:30:00Z',
      totalWithVat: 500.5,
      vatAmount: 65.28,
    };

    const base64 = generateZatcaTlvBase64(sampleInvoice);
    const decoded = decodeZatcaTlvBase64(base64);

    assert.equal(decoded.sellerName, 'عيادة ابتسامة النخبة');
    assert.equal(decoded.vatNumber, '300000000000003');
    assert.equal(decoded.totalWithVat, '500.50');
    assert.equal(decoded.vatAmount, '65.28');
  });

  it('conforms to TLV byte-structure specification', () => {
    const fields: ZatcaQrFields = {
      sellerName: 'Test Clinic',
      vatNumber: '312345678901233',
      timestamp: '2026-09-24T00:00:00.000Z',
      totalWithVat: '100.00',
      vatAmount: '15.00',
    };

    const base64 = generateZatcaTlvBase64(fields);
    const binary = Buffer.from(base64, 'base64');

    // First byte is Tag 1 (0x01)
    assert.equal(binary[0], 1);
    const len1 = binary[1];
    assert.equal(len1, Buffer.from('Test Clinic').length);

    // Second tag offset
    const tag2Offset = 2 + len1;
    assert.equal(binary[tag2Offset], 2);
    const len2 = binary[tag2Offset + 1];
    assert.equal(len2, 15); // 15-digit VAT
  });
});
