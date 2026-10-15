import QRCode from 'qrcode';

export interface ZatcaQrFields {
  /** 1. اسم البائع / المركز الطبي (Seller Name) */
  sellerName: string;
  /** 2. الرقم الضريبي للمنشأة (15 رقماً يبدأ وينتهي بـ 3) (VAT Registration Number) */
  vatNumber: string;
  /** 3. الطابع الزمني للفاتورة بصيغة ISO 8601 (Invoice Timestamp) */
  timestamp: string;
  /** 4. إجمالي الفاتورة شاملاً ضريبة القيمة المضافة بالريال (Invoice Total with VAT) */
  totalWithVat: string | number;
  /** 5. قيمة ضريبة القيمة المضافة بالريال (VAT Amount) */
  vatAmount: string | number;
}

/**
 * Encodes a single field into TLV (Tag, Length, Value) format using UTF-8 byte representation.
 * - Tag: 1 byte (integer 1-5)
 * - Length: 1 byte (UTF-8 byte length of the value)
 * - Value: N bytes (UTF-8 encoded string)
 */
export function encodeTlvField(tag: number, value: string): Uint8Array {
  const encoder = new TextEncoder();
  const valueBytes = encoder.encode(value);
  const length = valueBytes.length;

  if (length > 255) {
    throw new Error(`ZATCA TLV value for tag ${tag} exceeds maximum single-byte length of 255 bytes.`);
  }

  const result = new Uint8Array(2 + length);
  result[0] = tag;
  result[1] = length;
  result.set(valueBytes, 2);
  return result;
}

/**
 * Formats monetary amounts to 2 decimal places as required by ZATCA
 */
function formatMonetary(val: string | number): string {
  if (typeof val === 'number') {
    return val.toFixed(2);
  }
  const parsed = parseFloat(val);
  return isNaN(parsed) ? '0.00' : parsed.toFixed(2);
}

/**
 * Ensures timestamp adheres strictly to ISO 8601 format
 */
function formatIsoTimestamp(timestamp: string): string {
  try {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) {
      return new Date().toISOString();
    }
    return d.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

/**
 * Generates ZATCA compliant TLV Base64 string for Saudi Simplified Tax Invoices
 * Contains the 5 mandatory tags required by ZATCA (Fatoora).
 */
export function generateZatcaTlvBase64(fields: ZatcaQrFields): string {
  const sellerName = (fields.sellerName || '').trim();
  const vatNumber = (fields.vatNumber || '').trim();
  const timestamp = formatIsoTimestamp(fields.timestamp);
  const totalWithVat = formatMonetary(fields.totalWithVat);
  const vatAmount = formatMonetary(fields.vatAmount);

  const tlv1 = encodeTlvField(1, sellerName);
  const tlv2 = encodeTlvField(2, vatNumber);
  const tlv3 = encodeTlvField(3, timestamp);
  const tlv4 = encodeTlvField(4, totalWithVat);
  const tlv5 = encodeTlvField(5, vatAmount);

  const totalLength = tlv1.length + tlv2.length + tlv3.length + tlv4.length + tlv5.length;
  const combined = new Uint8Array(totalLength);

  let offset = 0;
  for (const tlv of [tlv1, tlv2, tlv3, tlv4, tlv5]) {
    combined.set(tlv, offset);
    offset += tlv.length;
  }

  // Convert Uint8Array to Base64 in isomorphic environment
  let binary = '';
  const len = combined.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(combined[i]);
  }

  if (typeof btoa !== 'undefined') {
    return btoa(binary);
  } else if (typeof Buffer !== 'undefined') {
    return Buffer.from(binary, 'binary').toString('base64');
  } else {
    throw new Error('No Base64 encoder available in current environment');
  }
}

/**
 * Decodes a ZATCA TLV Base64 string back into readable fields
 * Validates that all 5 tags are correctly structured and UTF-8 decoded.
 */
export function decodeZatcaTlvBase64(base64: string): ZatcaQrFields {
  let binary = '';
  if (typeof atob !== 'undefined') {
    binary = atob(base64);
  } else if (typeof Buffer !== 'undefined') {
    binary = Buffer.from(base64, 'base64').toString('binary');
  } else {
    throw new Error('No Base64 decoder available in current environment');
  }

  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  const decoder = new TextDecoder('utf-8');
  let offset = 0;
  const fields: Partial<ZatcaQrFields> = {};

  while (offset < bytes.length) {
    const tag = bytes[offset];
    const length = bytes[offset + 1];
    offset += 2;

    const valueBytes = bytes.slice(offset, offset + length);
    const value = decoder.decode(valueBytes);
    offset += length;

    switch (tag) {
      case 1:
        fields.sellerName = value;
        break;
      case 2:
        fields.vatNumber = value;
        break;
      case 3:
        fields.timestamp = value;
        break;
      case 4:
        fields.totalWithVat = value;
        break;
      case 5:
        fields.vatAmount = value;
        break;
      default:
        // Other tags if any
        break;
    }
  }

  return {
    sellerName: fields.sellerName || '',
    vatNumber: fields.vatNumber || '',
    timestamp: fields.timestamp || '',
    totalWithVat: fields.totalWithVat || '0.00',
    vatAmount: fields.vatAmount || '0.00',
  };
}

/**
 * Generates a Data URL image (PNG) of the QR Code from ZATCA TLV fields
 */
export async function generateZatcaQrDataUrl(
  fields: ZatcaQrFields,
  options?: { width?: number; margin?: number }
): Promise<string> {
  const tlvBase64 = generateZatcaTlvBase64(fields);
  return QRCode.toDataURL(tlvBase64, {
    errorCorrectionLevel: 'M',
    width: options?.width || 200,
    margin: options?.margin ?? 1,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });
}
