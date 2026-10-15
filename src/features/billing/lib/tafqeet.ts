/**
 * Arabic number to currency words (تفقيط المبالغ بالريال السعودي والهللات)
 */

const ONES = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة', 'عشرة'];
const TEENS = ['أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
const TENS = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
const HUNDREDS = ['', 'مائة', 'مئتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];

function convertGroup(n: number): string {
  if (n === 0) return '';
  const parts: string[] = [];

  const h = Math.floor(n / 100);
  const rem = n % 100;

  if (h > 0) {
    parts.push(HUNDREDS[h]);
  }

  if (rem > 0) {
    if (rem <= 10) {
      parts.push(ONES[rem]);
    } else if (rem < 20) {
      parts.push(TEENS[rem - 11]);
    } else {
      const o = rem % 10;
      const t = Math.floor(rem / 10);
      if (o > 0) {
        parts.push(`${ONES[o]} و${TENS[t]}`);
      } else {
        parts.push(TENS[t]);
      }
    }
  }

  return parts.join(' و');
}

export function tafqeetRiyals(halalas: number): string {
  if (halalas === 0) return 'صفر ريال سعودي لا غير';

  const isNegative = halalas < 0;
  const absHalalas = Math.abs(Math.round(halalas));
  const riyals = Math.floor(absHalalas / 100);
  const remainingHalalas = absHalalas % 100;

  const parts: string[] = [];

  if (riyals > 0) {
    if (riyals >= 1000000) {
      const millions = Math.floor(riyals / 1000000);
      const remM = riyals % 1000000;
      if (millions === 1) parts.push('مليون');
      else if (millions === 2) parts.push('مليونان');
      else parts.push(`${convertGroup(millions)} ملايين`);
      if (remM > 0) {
        parts.push(convertThousands(remM));
      }
    } else {
      parts.push(convertThousands(riyals));
    }

    if (riyals === 1) {
      parts[parts.length - 1] = 'ريال سعودي واحد';
    } else if (riyals === 2) {
      parts[parts.length - 1] = 'ريالان سعوديان';
    } else if (riyals >= 3 && riyals <= 10) {
      parts.push('ريالات سعودية');
    } else {
      parts.push('ريالاً سعودياً');
    }
  }

  if (remainingHalalas > 0) {
    const halalaText = convertGroup(remainingHalalas);
    if (remainingHalalas === 1) {
      parts.push('وهللة واحدة');
    } else if (remainingHalalas === 2) {
      parts.push('وهللتان');
    } else if (remainingHalalas >= 3 && remainingHalalas <= 10) {
      parts.push(`و${halalaText} هللات`);
    } else {
      parts.push(`و${halalaText} هللة`);
    }
  }

  const result = parts.filter(Boolean).join(' ');
  return `${isNegative ? 'سالب ' : 'فقط '}${result} لا غير`;
}

function convertThousands(n: number): string {
  if (n < 1000) return convertGroup(n);
  const thousands = Math.floor(n / 1000);
  const rem = n % 1000;
  const parts: string[] = [];

  if (thousands === 1) parts.push('ألف');
  else if (thousands === 2) parts.push('ألفان');
  else if (thousands >= 3 && thousands <= 10) parts.push(`${convertGroup(thousands)} آلاف`);
  else parts.push(`${convertGroup(thousands)} ألف`);

  if (rem > 0) {
    parts.push(`و${convertGroup(rem)}`);
  }

  return parts.join(' ');
}
