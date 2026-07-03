export const phoneRegex = /^[6-9]\d{9}$/;

export function validatePhone(phone: string): string | null {
  if (!phone) return 'फ़ोन नंबर दर्ज करें';
  if (!phoneRegex.test(phone)) return 'गलत फ़ोन नंबर';
  return null;
}

export function validateOtp(otp: string): string | null {
  if (!otp) return 'OTP दर्ज करें';
  if (otp.length !== 6) return 'OTP 6 अंकों का होना चाहिए';
  return null;
}

export function validateAddressLine(value: string, label: string): string | null {
  if (!value.trim()) return `${label} दर्ज करें`;
  return null;
}
