import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';

// Generates a fresh TOTP secret and a scannable QR code (as a data URL)
// for setting up Google Authenticator, Authy, or any compatible app.
// The secret is returned so the caller can store it (not yet enabled)
// until the person confirms they've scanned it by entering a valid code.
export async function generateTotpSetup(accountLabel: string) {
  const secret = new OTPAuth.Secret({ size: 20 });
  const totp = new OTPAuth.TOTP({
    issuer: 'TradeEase',
    label: accountLabel,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret,
  });
  const otpauthUrl = totp.toString();
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
  return { secretBase32: secret.base32, otpauthUrl, qrCodeDataUrl };
}

// Verifies a 6-digit code against a stored base32 secret. Allows one step
// of clock drift either side (±30s) since phone clocks aren't always
// perfectly in sync with the server.
export function verifyTotpCode(secretBase32: string, code: string): boolean {
  if (!secretBase32 || !code) return false;
  const totp = new OTPAuth.TOTP({
    issuer: 'TradeEase',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secretBase32),
  });
  const delta = totp.validate({ token: code.trim(), window: 1 });
  return delta !== null;
}
