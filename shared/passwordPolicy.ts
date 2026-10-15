// سياسة كلمات المرور المعتمدة لنظام عيادتي (تُستخدم في الإعداد الأولي وتغيير كلمات المرور)

export const COMMON_WEAK_PASSWORDS: readonly string[] = [
  '12345678',
  '123456789',
  '1234567890',
  '0123456789',
  'password',
  'password123',
  'admin',
  'admin123',
  'admin2026',
  'qwerty',
  'qwerty123',
  'welcome',
  'welcome123',
  'letmein',
  'letmein123',
  'iloveyou',
  'eyadati',
  'eyadati123',
  'dental2026',
  'clinic123',
];

export interface PasswordValidationResult {
  valid: boolean;
  error?: string;
}

export function validatePasswordPolicy(
  password: string,
  username?: string
): PasswordValidationResult {
  if (!password || password.length < 10) {
    return {
      valid: false,
      error: 'كلمة المرور يجب أن تتكون من 10 أحرف أو أكثر',
    };
  }

  // حرف واحد على الأقل (عربي أو إنجليزي)
  if (!/[a-zA-Z\u0600-\u06FF]/.test(password)) {
    return {
      valid: false,
      error: 'كلمة المرور يجب أن تحتوي على حرف واحد على الأقل',
    };
  }

  // رقم واحد على الأقل
  if (!/[0-9]/.test(password)) {
    return {
      valid: false,
      error: 'كلمة المرور يجب أن تحتوي على رقم واحد على الأقل',
    };
  }

  if (username) {
    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.toLowerCase();

    if (cleanPassword === cleanUsername) {
      return {
        valid: false,
        error: 'كلمة المرور لا يجوز أن تطابق اسم المستخدم',
      };
    }

    if (cleanUsername.length >= 3 && cleanPassword.includes(cleanUsername)) {
      return {
        valid: false,
        error: 'كلمة المرور لا يجوز أن تحتوي على اسم المستخدم',
      };
    }
  }

  const lowerPwd = password.toLowerCase();
  if (COMMON_WEAK_PASSWORDS.some((weak) => lowerPwd === weak || lowerPwd.startsWith(weak))) {
    return {
      valid: false,
      error: 'كلمة المرور شائعة جداً وسهلة التخمين، يرجى اختيار كلمة مرور أكثر تعقيداً',
    };
  }

  return { valid: true };
}
