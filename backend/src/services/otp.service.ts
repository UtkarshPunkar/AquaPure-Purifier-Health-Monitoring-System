interface OtpRecord {
  email: string;
  otp: string;
  expiresAt: Date;
  verified: boolean;
  purpose: 'signup' | 'forgot-password';
}

// In-memory OTP storage
const otpStore = new Map<string, OtpRecord>();

export function generateOtp(email: string, purpose: 'signup' | 'forgot-password' = 'signup'): { otp: string; expiresAt: Date } {
  const cleanEmail = email.trim().toLowerCase();
  
  // Generate random 6-digit numerical OTP code
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes validity

  otpStore.set(cleanEmail, {
    email: cleanEmail,
    otp,
    expiresAt,
    verified: false,
    purpose,
  });

  console.log(`================================================================`);
  console.log(`[AquaPure OTP Security Grid]`);
  console.log(`📧 Recipient: ${cleanEmail}`);
  console.log(`🔐 6-Digit OTP Code: ${otp}`);
  console.log(`⏰ Expiration: 10 Minutes (${expiresAt.toLocaleTimeString()})`);
  console.log(`🎯 Purpose: ${purpose.toUpperCase()}`);
  console.log(`================================================================`);

  return { otp, expiresAt };
}

export function verifyOtp(email: string, enteredOtp: string): { success: boolean; message: string } {
  const cleanEmail = email.trim().toLowerCase();
  const record = otpStore.get(cleanEmail);

  if (!record) {
    return { success: false, message: 'No verification code requested for this email. Please request a new code.' };
  }

  if (new Date() > record.expiresAt) {
    otpStore.delete(cleanEmail);
    return { success: false, message: 'Verification code has expired. Please request a new code.' };
  }

  if (record.otp !== String(enteredOtp).trim()) {
    return { success: false, message: 'Invalid 6-digit verification code. Please check and try again.' };
  }

  record.verified = true;
  return { success: true, message: 'Email address verified successfully!' };
}

export function isOtpVerified(email: string): boolean {
  const cleanEmail = email.trim().toLowerCase();
  const record = otpStore.get(cleanEmail);
  if (!record) return false;
  if (new Date() > record.expiresAt) {
    otpStore.delete(cleanEmail);
    return false;
  }
  return record.verified;
}

export function consumeOtp(email: string): void {
  const cleanEmail = email.trim().toLowerCase();
  otpStore.delete(cleanEmail);
}
