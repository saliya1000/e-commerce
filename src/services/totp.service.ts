import speakeasy from 'speakeasy';
import qrcode from 'qrcode';

export class TotpService {
  /**
   * Generates a new TOTP secret and corresponding QR code URL
   */
  static async generateSecret(email: string) {
    const secret = speakeasy.generateSecret({
      name: `ILoveShopping (${email})`,
    });

    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url!);

    return {
      secret: secret.base32,
      qrCodeUrl,
    };
  }

  /**
   * Verifies a TOTP token against a secret
   */
  static verifyToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 1, // Allow 1 step before/after (30 seconds total drift)
    });
  }
}
