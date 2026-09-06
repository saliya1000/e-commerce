import crypto from 'crypto';

// The encryption key should be exactly 32 bytes (256 bits) for AES-256-GCM.
const getEncryptionKey = (): Buffer => {
  const keyStr = process.env.ENCRYPTION_KEY;
  if (!keyStr) {
    // For tests or if strictly missing, we can fallback or throw. Throwing in prod is safer.
    if (process.env.NODE_ENV === 'test') {
      return Buffer.from('12345678901234567890123456789012', 'utf8'); // 32 chars mock key
    }
    throw new Error('ENCRYPTION_KEY environment variable is missing.');
  }
  
  const key = Buffer.from(keyStr, 'utf8');
  if (key.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be exactly 32 bytes long for AES-256-GCM.');
  }
  return key;
};

const ALGORITHM = 'aes-256-gcm';

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * The output format is: iv:authTag:encryptedData (Base64 encoded)
 */
export const encrypt = (text: string): string => {
  if (!text) return text;
  
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12); // Recommended 96 bits for GCM
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  const authTag = cipher.getAuthTag().toString('base64');
  
  // Format: iv:authTag:encrypted
  return `${iv.toString('base64')}:${authTag}:${encrypted}`;
};

/**
 * Decrypts a ciphertext string back to plaintext.
 * Expects input format: iv:authTag:encryptedData (Base64 encoded)
 */
export const decrypt = (encryptedText: string): string => {
  if (!encryptedText) return encryptedText;
  
  // If it doesn't look like our ciphertext format (e.g., legacy unencrypted data in DB),
  // we could optionally return it as-is, but it's safer to attempt decrypt and fail, or check strictly.
  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    // Attempting to handle legacy unencrypted data gracefully.
    // Warning: this could expose data if a real string accidentally lacks colons, 
    // but typically encrypted payload always has exactly 2 colons.
    return encryptedText;
  }
  
  try {
    const [ivBase64, authTagBase64, encryptedData] = parts;
    const key = getEncryptionKey();
    
    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    // Decryption failed. Could be invalid key, tampered data, or just not encrypted data.
    console.error('Decryption failed for data:', error);
    return encryptedText; // Fallback to returning raw data for legacy plaintext support
  }
};

/**
 * Encrypts a JSON object into a ciphertext string.
 */
export const encryptJson = (obj: any): string => {
  if (!obj) return obj;
  return encrypt(JSON.stringify(obj));
};

/**
 * Decrypts a ciphertext string into a JSON object.
 */
export const decryptJson = (encryptedText: string): any => {
  if (!encryptedText) return encryptedText;
  const decryptedStr = decrypt(encryptedText);
  try {
    return JSON.parse(decryptedStr);
  } catch (e) {
    // If it fails to parse, it might be an unencrypted JSON object stored as string,
    // or just corrupted data.
    return decryptedStr;
  }
};
