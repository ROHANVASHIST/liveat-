import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
  GenerateRegistrationOptionsOpts,
  GenerateAuthenticationOptionsOpts,
  VerifyRegistrationResponseOpts,
  VerifyAuthenticationResponseOpts,
} from '@simplewebauthn/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

// WebAuthn configuration
const rpName = 'ChatApp';
const rpID = process.env.RP_ID || 'localhost';
const origin = process.env.ORIGIN || `http://localhost:5173`;

export interface PasskeyRegistrationOptions {
  challenge: string;
  options: any;
}

export interface PasskeyAuthenticationOptions {
  challenge: string;
  options: any;
}

class PasskeyService {
  /**
   * Generate registration options for new passkey
   */
  async generateRegistrationOptions(userId: string, userName: string, userEmail: string): Promise<PasskeyRegistrationOptions> {
    // Get user's existing authenticators
    const { data: existingAuthenticators } = await supabase
      .from('user_authenticators')
      .select('*')
      .eq('user_id', userId);

    const opts: GenerateRegistrationOptionsOpts = {
      rpName,
      rpID,
      userID: Buffer.from(userId),
      userName: userEmail,
      userDisplayName: userName,
      timeout: 60000,
      attestationType: 'none',
      excludeCredentials: (existingAuthenticators || []).map(auth => ({
        id: auth.credential_id,
        transports: auth.transports || [],
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
        authenticatorAttachment: 'platform', // Prefer platform authenticators (biometrics)
      },
    };

    const options = await generateRegistrationOptions(opts);

    // Store challenge temporarily
    await supabase
      .from('passkey_challenges')
      .insert({
        user_id: userId,
        challenge: options.challenge,
        type: 'registration',
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
      });

    return {
      challenge: options.challenge,
      options,
    };
  }

  /**
   * Verify passkey registration response
   */
  async verifyRegistrationResponse(userId: string, response: any): Promise<boolean> {
    // Get challenge
    const { data: challengeData, error: challengeError } = await supabase
      .from('passkey_challenges')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'registration')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (challengeError || !challengeData) {
      throw new Error('Challenge not found or expired');
    }

    // Check if challenge is expired
    if (new Date(challengeData.expires_at) < new Date()) {
      throw new Error('Challenge expired');
    }

    const opts: VerifyRegistrationResponseOpts = {
      response,
      expectedChallenge: challengeData.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    };

    try {
      const verification = await verifyRegistrationResponse(opts);

      if (verification.verified && verification.registrationInfo) {
        const { credential, credentialBackedUp, credentialDeviceType } = verification.registrationInfo;

        // Store authenticator
        await supabase
          .from('user_authenticators')
          .insert({
            user_id: userId,
            credential_id: Buffer.from(credential.id).toString('base64'),
            credential_public_key: Buffer.from(credential.publicKey).toString('base64'),
            counter: credential.counter,
            transports: response.response.transports || [],
            created_at: new Date().toISOString(),
          });

        // Delete used challenge
        await supabase
          .from('passkey_challenges')
          .delete()
          .eq('id', challengeData.id);

        return true;
      }

      return false;
    } catch (error) {
      console.error('Passkey registration verification error:', error);
      return false;
    }
  }

  /**
   * Generate authentication options for passkey login
   */
  async generateAuthenticationOptions(userId?: string): Promise<PasskeyAuthenticationOptions> {
    let allowCredentials;

    if (userId) {
      // Get user's authenticators
      const { data: authenticators } = await supabase
        .from('user_authenticators')
        .select('*')
        .eq('user_id', userId);

      if (authenticators && authenticators.length > 0) {
        allowCredentials = authenticators.map(auth => ({
          id: auth.credential_id,
          transports: auth.transports || [],
        }));
      }
    }

    const opts: GenerateAuthenticationOptionsOpts = {
      timeout: 60000,
      allowCredentials,
      userVerification: 'preferred',
      rpID,
    };

    const options = await generateAuthenticationOptions(opts);

    // Store challenge temporarily (without user_id for usernameless flow)
    const challengeId = crypto.randomUUID();
    await supabase
      .from('passkey_challenges')
      .insert({
        id: challengeId,
        user_id: userId || null,
        challenge: options.challenge,
        type: 'authentication',
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      });

    return {
      challenge: options.challenge,
      options,
    };
  }

  /**
   * Verify passkey authentication response
   */
  async verifyAuthenticationResponse(response: any): Promise<{ verified: boolean; userId?: string }> {
    const credentialId = Buffer.from(response.id, 'base64url').toString('base64');

    // Get authenticator
    const { data: authenticator, error: authError } = await supabase
      .from('user_authenticators')
      .select('*')
      .eq('credential_id', credentialId)
      .single();

    if (authError || !authenticator) {
      throw new Error('Authenticator not found');
    }

    // Get challenge
    const { data: challengeData, error: challengeError } = await supabase
      .from('passkey_challenges')
      .select('*')
      .eq('challenge', response.response.challenge || '')
      .eq('type', 'authentication')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (challengeError || !challengeData) {
      throw new Error('Challenge not found or expired');
    }

    if (new Date(challengeData.expires_at) < new Date()) {
      throw new Error('Challenge expired');
    }

    const opts: VerifyAuthenticationResponseOpts = {
      response,
      expectedChallenge: challengeData.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: authenticator.credential_id,
        publicKey: Buffer.from(authenticator.credential_public_key, 'base64'),
        counter: authenticator.counter,
      },
    };

    try {
      const verification = await verifyAuthenticationResponse(opts);

      if (verification.verified) {
        // Update counter
        await supabase
          .from('user_authenticators')
          .update({ counter: verification.authenticationInfo.credentialDeviceType ? verification.authenticationInfo.newCounter : authenticator.counter + 1 })
          .eq('credential_id', credentialId);

        // Delete used challenge
        await supabase
          .from('passkey_challenges')
          .delete()
          .eq('id', challengeData.id);

        return {
          verified: true,
          userId: authenticator.user_id,
        };
      }

      return { verified: false };
    } catch (error) {
      console.error('Passkey authentication verification error:', error);
      return { verified: false };
    }
  }

  /**
   * Get user's registered passkeys
   */
  async getUserPasskeys(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('user_authenticators')
      .select('id, created_at, transports')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error('Failed to fetch passkeys');
    }

    return data || [];
  }

  /**
   * Delete a passkey
   */
  async deletePasskey(userId: string, authenticatorId: string): Promise<void> {
    const { error } = await supabase
      .from('user_authenticators')
      .delete()
      .eq('user_id', userId)
      .eq('id', authenticatorId);

    if (error) {
      throw new Error('Failed to delete passkey');
    }
  }
}

export const passkeyService = new PasskeyService();
