// End-to-End Encryption using Web Crypto API
// Implements ECDH key exchange and AES-256-GCM encryption
// Keys are generated per conversation and never leave the client

interface KeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}

interface EncryptedPayload {
  iv: string;           // Initialization vector (base64)
  ciphertext: string;   // Encrypted data (base64)
  tag: string;          // Authentication tag (base64)
  keyId: string;        // ID of the public key used
}

interface KeyExchangeData {
  keyId: string;
  publicKey: string;    // JWK format (base64)
  userId: string;
  roomId: string;
  timestamp: number;
}

class E2EEncryption {
  private keyPairs: Map<string, KeyPair> = new Map();
  private sharedKeys: Map<string, CryptoKey> = new Map();
  private keyExchangeQueue: Map<string, KeyExchangeData[]> = new Map();

  // Generate a new key pair for a conversation
  async generateKeyPair(conversationId: string): Promise<KeyExchangeData> {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'ECDH',
        namedCurve: 'P-256',
      },
      true,
      ['deriveKey', 'deriveBits']
    );

    // Export public key to share
    const publicKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
    
    const keyData: KeyExchangeData = {
      keyId: this.generateKeyId(),
      publicKey: btoa(JSON.stringify(publicKeyJwk)),
      userId: '', // Will be set when sending
      roomId: conversationId,
      timestamp: Date.now(),
    };

    this.keyPairs.set(`${conversationId}:${keyData.keyId}`, keyPair);
    
    return keyData;
  }

  // Generate a random key ID
  private generateKeyId(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Import a public key from JWK
  async importPublicKey(jwkJson: string): Promise<CryptoKey> {
    const jwk = JSON.parse(atob(jwkJson));
    return await crypto.subtle.importKey(
      'jwk',
      jwk,
      {
        name: 'ECDH',
        namedCurve: 'P-256',
      },
      true,
      []
    );
  }

  // Derive shared secret key from own private key and peer's public key
  async deriveSharedKey(
    conversationId: string,
    ownPrivateKeyId: string,
    peerPublicKeyJwk: string
  ): Promise<CryptoKey> {
    const keyMapKey = `${conversationId}:${ownPrivateKeyId}`;
    const keyPair = this.keyPairs.get(keyMapKey);
    
    if (!keyPair) {
      throw new Error(`Key pair not found: ${ownPrivateKeyId}`);
    }

    const peerPublicKey = await this.importPublicKey(peerPublicKeyJwk);
    
    const sharedKey = await crypto.subtle.deriveKey(
      {
        name: 'ECDH',
        public: peerPublicKey,
      },
      keyPair.privateKey,
      {
        name: 'AES-GCM',
        length: 256,
      },
      false,
      ['encrypt', 'decrypt']
    );

    const sharedKeyId = `${conversationId}:${ownPrivateKeyId}:${await this.getKeyFingerprint(peerPublicKey)}`;
    this.sharedKeys.set(sharedKeyId, sharedKey);
    
    return sharedKey;
  }

  // Get a fingerprint of a key for identification
  async getKeyFingerprint(publicKey: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey('raw', publicKey);
    const hash = await crypto.subtle.digest('SHA-256', exported);
    return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Encrypt a message using AES-256-GCM
  async encryptMessage(
    conversationId: string,
    message: string,
    senderKeyId: string
  ): Promise<EncryptedPayload> {
    const keyMapKey = `${conversationId}:${senderKeyId}`;
    let sharedKey = this.sharedKeys.get(keyMapKey);
    
    if (!sharedKey) {
      throw new Error('Shared key not found. Complete key exchange first.');
    }

    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Encode message
    const encoder = new TextEncoder();
    const messageData = encoder.encode(message);

    // Encrypt
    const ciphertext = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
        tagLength: 128,
      },
      sharedKey,
      messageData
    );

    // Extract tag from the end of ciphertext
    const ciphertextArray = new Uint8Array(ciphertext);
    const tagStart = ciphertextArray.length - 16;
    const encryptedData = ciphertextArray.slice(0, tagStart);
    const tag = ciphertextArray.slice(tagStart);

    return {
      iv: this.arrayBufferToBase64(iv),
      ciphertext: this.arrayBufferToBase64(encryptedData),
      tag: this.arrayBufferToBase64(tag),
      keyId: senderKeyId,
    };
  }

  // Decrypt a message
  async decryptMessage(
    conversationId: string,
    encryptedPayload: EncryptedPayload,
    recipientPrivateKeyId: string
  ): Promise<string> {
    const keyMapKey = `${conversationId}:${recipientPrivateKeyId}`;
    
    // Try to find the correct shared key
    let sharedKey = this.findSharedKey(conversationId, encryptedPayload.keyId);
    
    if (!sharedKey) {
      throw new Error('Shared key not found for decryption');
    }

    // Decrypt
    const iv = this.base64ToArrayBuffer(encryptedPayload.iv);
    const ciphertext = this.base64ToArrayBuffer(encryptedPayload.ciphertext);
    const tag = this.base64ToArrayBuffer(encryptedPayload.tag);
    
    // Combine ciphertext and tag
    const combined = new Uint8Array(ciphertext.byteLength + tag.byteLength);
    combined.set(new Uint8Array(ciphertext), 0);
    combined.set(new Uint8Array(tag), ciphertext.byteLength);

    try {
      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv,
          tagLength: 128,
        },
        sharedKey,
        combined
      );

      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      throw new Error('Decryption failed. Keys may have been rotated.');
    }
  }

  // Find shared key by key ID
  private findSharedKey(conversationId: string, peerKeyId: string): CryptoKey | undefined {
    for (const [key, value] of this.sharedKeys.entries()) {
      if (key.startsWith(`${conversationId}:`) && key.includes(`:${peerKeyId}:`)) {
        return value;
      }
    }
    return undefined;
  }

  // Utility functions
  private arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  // Clear keys for a conversation (on leave/delete)
  async clearConversationKeys(conversationId: string): Promise<void> {
    // Remove all keys related to this conversation
    for (const [key] of this.keyPairs.entries()) {
      if (key.startsWith(`${conversationId}:`)) {
        this.keyPairs.delete(key);
      }
    }
    
    for (const [key] of this.sharedKeys.entries()) {
      if (key.startsWith(`${conversationId}:`)) {
        this.sharedKeys.delete(key);
      }
    }
    
    this.keyExchangeQueue.delete(conversationId);
  }

  // Get all public keys for a conversation (for key rotation)
  async getAllPublicKeys(conversationId: string): Promise<KeyExchangeData[]> {
    const keys: KeyExchangeData[] = [];
    
    for (const [key, keyPair] of this.keyPairs.entries()) {
      if (key.startsWith(`${conversationId}:`)) {
        const keyId = key.split(':')[1];
        const publicKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
        keys.push({
          keyId,
          publicKey: btoa(JSON.stringify(publicKeyJwk)),
          userId: '',
          roomId: conversationId,
          timestamp: Date.now(),
        });
      }
    }
    
    return keys;
  }

  // Generate encryption keys for media
  async generateMediaKey(): Promise<{ key: CryptoKey; keyBase64: string }> {
    const key = await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt']
    );

    const exported = await crypto.subtle.exportKey('raw', key);
    const keyBase64 = this.arrayBufferToBase64(exported);
    
    return { key, keyBase64 };
  }

  // Encrypt media file
  async encryptMedia(
    file: ArrayBuffer,
    mediaKey: CryptoKey
  ): Promise<{ encrypted: ArrayBuffer; iv: Uint8Array }> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
        tagLength: 128,
      },
      mediaKey,
      file
    );

    return {
      encrypted: encrypted as ArrayBuffer,
      iv,
    };
  }

  // Decrypt media file
  async decryptMedia(
    encryptedData: ArrayBuffer,
    mediaKey: CryptoKey,
    iv: ArrayBuffer
  ): Promise<ArrayBuffer> {
    return await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
        tagLength: 128,
      },
      mediaKey,
      encryptedData
    ) as ArrayBuffer;
  }
}

// Export singleton instance
export const e2eEncryption = new E2EEncryption();

// Helper function to generate secure random strings
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Helper function to hash passwords securely
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + process.env.ENCRYPTION_KEY);
  const hashBuffer = await crypto.subtle.digest('SHA-512', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
}

// Verify password hash
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const newHash = await hashPassword(password);
  return newHash === hash;
}