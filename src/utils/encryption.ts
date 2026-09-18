import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getKey(): Buffer {
  const keyStr = process.env.ENCRYPTION_KEY || '';
  if (keyStr.length !== 64) {
    console.warn("WARNING: ENCRYPTION_KEY is not set or invalid length. Encryption will fail in production.");
    // Return a dummy key for test environments if missing
    return Buffer.alloc(32, 'a');
  }
  return Buffer.from(keyStr, 'hex');
}

export function encrypt(text: string): string {
  if (!text) return text;
  
  // Don't encrypt if already encrypted
  if (text.split(':').length === 3) return text;
  
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decrypt(text: string): string {
  if (!text) return text;
  
  const parts = text.split(':');
  if (parts.length !== 3) {
    // Return as is (useful for existing plaintext data)
    return text;
  }
  
  try {
    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error("Decryption failed. Returning raw text.", error);
    return text;
  }
}

export function encryptJson(obj: any): string {
  if (!obj) return '';
  return encrypt(JSON.stringify(obj));
}

export function decryptJson(text: string): any {
  if (!text) return null;
  const decrypted = decrypt(text);
  try {
    return JSON.parse(decrypted);
  } catch (e) {
    return decrypted; // Fallback if it wasn't JSON
  }
}
