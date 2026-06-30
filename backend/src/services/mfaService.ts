import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export interface MFASetupResult {
  secret: string;
  qrCodeDataUrl: string;
  backupCodes: string[];
}

export interface MFAVerificationResult {
  verified: boolean;
  backupCodes?: string[];
}

class MFAService {
  /**
   * Generate TOTP secret and QR code for MFA setup
   */
  async setupMFA(userId: string, userEmail: string): Promise<MFASetupResult> {
    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `ChatApp (${userEmail})`,
      issuer: 'ChatApp',
      length: 32,
    });

    // Generate backup codes (10 codes)
    const backupCodes = this.generateBackupCodes(10);
    
    // Hash backup codes before storing
    const hashedBackupCodes = backupCodes.map(code => 
      crypto.createHash('sha256').update(code).digest('hex')
    );

    // Store secret and backup codes in database (not yet verified)
    const { error } = await supabase
      .from('user_mfa_settings')
      .upsert({
        user_id: userId,
        totp_secret: secret.base32,
        backup_codes: hashedBackupCodes,
        mfa_enabled: false, // Only enable after verification
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error storing MFA setup:', error);
      throw new Error('Failed to setup MFA');
    }

    // Generate QR code
    const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url!);

    return {
      secret: secret.base32,
      qrCodeDataUrl,
      backupCodes,
    };
  }

  /**
   * Verify TOTP code and enable MFA
   */
  async verifyAndEnableMFA(userId: string, token: string): Promise<MFAVerificationResult> {
    // Get user's MFA settings
    const { data: mfaSettings, error } = await supabase
      .from('user_mfa_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !mfaSettings) {
      throw new Error('MFA not set up for this user');
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: mfaSettings.totp_secret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 time steps before/after for clock skew
    });

    if (!verified) {
      throw new Error('Invalid verification code');
    }

    // Enable MFA
    const { error: updateError } = await supabase
      .from('user_mfa_settings')
      .update({ 
        mfa_enabled: true,
        verified_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (updateError) {
      throw new Error('Failed to enable MFA');
    }

    return { verified: true };
  }

  /**
   * Verify TOTP code during login
   */
  async verifyMFAToken(userId: string, token: string): Promise<boolean> {
    const { data: mfaSettings, error } = await supabase
      .from('user_mfa_settings')
      .select('*')
      .eq('user_id', userId)
      .eq('mfa_enabled', true)
      .single();

    if (error || !mfaSettings) {
      return false;
    }

    // Try TOTP verification first
    const totpVerified = speakeasy.totp.verify({
      secret: mfaSettings.totp_secret,
      encoding: 'base32',
      token,
      window: 2,
    });

    if (totpVerified) {
      return true;
    }

    // Try backup code verification
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const backupCodes: string[] = mfaSettings.backup_codes || [];
    
    if (backupCodes.includes(hashedToken)) {
      // Remove used backup code
      const updatedCodes = backupCodes.filter(code => code !== hashedToken);
      
      await supabase
        .from('user_mfa_settings')
        .update({ backup_codes: updatedCodes })
        .eq('user_id', userId);

      return true;
    }

    return false;
  }

  /**
   * Check if user has MFA enabled
   */
  async isMFAEnabled(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('user_mfa_settings')
      .select('mfa_enabled')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return false;
    }

    return data.mfa_enabled === true;
  }

  /**
   * Disable MFA (requires verification)
   */
  async disableMFA(userId: string, token: string): Promise<void> {
    // Verify token before disabling
    const verified = await this.verifyMFAToken(userId, token);
    
    if (!verified) {
      throw new Error('Invalid verification code');
    }

    const { error } = await supabase
      .from('user_mfa_settings')
      .update({ 
        mfa_enabled: false,
        disabled_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      throw new Error('Failed to disable MFA');
    }
  }

  /**
   * Regenerate backup codes
   */
  async regenerateBackupCodes(userId: string, token: string): Promise<string[]> {
    // Verify token before regenerating
    const verified = await this.verifyMFAToken(userId, token);
    
    if (!verified) {
      throw new Error('Invalid verification code');
    }

    const backupCodes = this.generateBackupCodes(10);
    const hashedBackupCodes = backupCodes.map(code => 
      crypto.createHash('sha256').update(code).digest('hex')
    );

    const { error } = await supabase
      .from('user_mfa_settings')
      .update({ backup_codes: hashedBackupCodes })
      .eq('user_id', userId);

    if (error) {
      throw new Error('Failed to regenerate backup codes');
    }

    return backupCodes;
  }

  /**
   * Generate random backup codes
   */
  private generateBackupCodes(count: number): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric code
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }
    return codes;
  }
}

export const mfaService = new MFAService();
