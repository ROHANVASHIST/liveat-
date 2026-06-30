import CryptoJS from 'crypto-js';

// We implement strict AES-256 encryption. 
// In a live production environment with multiple independent rooms, you would use 
// Diffie-Hellman key exchanges and per-session keys, but for global tight encryption
// we establish a secure core kernel key.
const SECRET_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'Concierge-Core-Secure-V1-Protocol-Key-7749';

export const encryptMessage = (text: string): string => {
  if (!text) return text;
  return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
};

export const decryptMessage = (cipherText: string): string => {
  if (!cipherText) return cipherText;
  
  // Quick heuristic: If it doesn't look like a standard crypto-js base64 AES output, 
  // return plain (this supports legacy messages that were stored unencrypted).
  if (!cipherText.startsWith('U2FsdGVkX1')) {
    return cipherText;
  }

  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    return originalText || cipherText; 
  } catch (err) {
    return cipherText;
  }
};
