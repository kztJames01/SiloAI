import crypto from 'crypto';
import { IntegrationCredentials } from '@silo/shared/types/integration';
import { logger } from '../../utils/logger';

/**
 * Credential manager for secure storage and retrieval of integration credentials
 * Uses AES-256-GCM encryption for credential storage
 */
export class CredentialManager {
  private readonly ALGORITHM = 'aes-256-gcm';
  private readonly KEY_LENGTH = 32;
  private readonly IV_LENGTH = 16;
  private readonly AUTH_TAG_LENGTH = 16;

  private encryptionKey: Buffer;

  constructor() {
    // Get encryption key from environment
    const keyBase = process.env.INTEGRATION_ENCRYPTION_KEY || this.generateFallbackKey();
    this.encryptionKey = this.deriveKey(keyBase);
  }

  /**
   * Generate a fallback key (only for development - use strong key in production)
   */
  private generateFallbackKey(): string {
    logger.warn('Using fallback encryption key - set INTEGRATION_ENCRYPTION_KEY in production!');
    return process.env.JWT_SECRET || 'change-me-in-production-this-is-not-secure';
  }

  /**
   * Derive encryption key using PBKDF2
   */
  private deriveKey(keyBase: string, salt?: Buffer): Buffer {
    const keySalt = salt || Buffer.from('silo-integration-salt-v1'); // Static salt for consistent key derivation
    return crypto.pbkdf2Sync(keyBase, keySalt, 100000, this.KEY_LENGTH, 'sha512');
  }

  /**
   * Encrypt credentials
   */
  encrypt(credentials: IntegrationCredentials): string {
    try {
      // Serialize credentials to JSON
      const plaintext = JSON.stringify(credentials);

      // Generate random IV
      const iv = crypto.randomBytes(this.IV_LENGTH);

      // Create cipher
      const cipher = crypto.createCipheriv(this.ALGORITHM, this.encryptionKey, iv);

      // Encrypt
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Get auth tag
      const authTag = cipher.getAuthTag();

      // Combine IV + auth tag + encrypted data
      const combined = Buffer.concat([
        iv,
        authTag,
        Buffer.from(encrypted, 'hex'),
      ]);

      // Return as base64
      return combined.toString('base64');
    } catch (error: any) {
      logger.error('Failed to encrypt credentials', { error: error.message });
      throw new Error('Credential encryption failed');
    }
  }

  /**
   * Decrypt credentials
   */
  decrypt(encryptedData: string): IntegrationCredentials {
    try {
      // Decode from base64
      const combined = Buffer.from(encryptedData, 'base64');

      // Extract components
      const iv = combined.subarray(0, this.IV_LENGTH);
      const authTag = combined.subarray(this.IV_LENGTH, this.IV_LENGTH + this.AUTH_TAG_LENGTH);
      const encrypted = combined.subarray(this.IV_LENGTH + this.AUTH_TAG_LENGTH);

      // Create decipher
      const decipher = crypto.createDecipheriv(this.ALGORITHM, this.encryptionKey, iv);
      decipher.setAuthTag(authTag);

      // Decrypt
      let decrypted = decipher.update(encrypted);
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      // Parse JSON
      const credentials = JSON.parse(decrypted.toString('utf8'));

      // Convert date strings back to Date objects
      if (credentials.expiresAt) {
        credentials.expiresAt = new Date(credentials.expiresAt);
      }

      return credentials;
    } catch (error: any) {
      logger.error('Failed to decrypt credentials', { error: error.message });
      throw new Error('Credential decryption failed');
    }
  }

  /**
   * Hash credential for equality checks (without decryption)
   */
  hash(credentials: IntegrationCredentials): string {
    const plaintext = JSON.stringify(credentials);
    return crypto.createHash('sha256').update(plaintext).digest('hex');
  }

  /**
   * Mask sensitive credential fields for logging
   */
  mask(credentials: IntegrationCredentials): Partial<IntegrationCredentials> {
    const masked: any = { ...credentials };

    if (masked.accessToken) {
      masked.accessToken = this.maskString(masked.accessToken);
    }

    if (masked.refreshToken) {
      masked.refreshToken = this.maskString(masked.refreshToken);
    }

    if (masked.apiKey) {
      masked.apiKey = this.maskString(masked.apiKey);
    }

    if (masked.apiSecret) {
      masked.apiSecret = this.maskString(masked.apiSecret);
    }

    if (masked.password) {
      masked.password = '***MASKED***';
    }

    return masked;
  }

  /**
   * Mask string (show first 4 and last 4 characters)
   */
  private maskString(str: string): string {
    if (str.length <= 8) return '***';
    return `${str.substring(0, 4)}...${str.substring(str.length - 4)}`;
  }

  /**
   * Validate credential structure
   */
  validate(credentials: IntegrationCredentials): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check if credentials object exists
    if (!credentials || typeof credentials !== 'object') {
      errors.push('Credentials must be an object');
      return { valid: false, errors };
    }

    // At least one credential type must be present
    const hasOAuth = credentials.accessToken || credentials.refreshToken;
    const hasApiKey = credentials.apiKey || credentials.apiSecret;
    const hasBasicAuth = credentials.username && credentials.password;

    if (!hasOAuth && !hasApiKey && !hasBasicAuth) {
      errors.push('At least one credential type must be provided (OAuth, API Key, or Basic Auth)');
    }

    // Validate token expiry
    if (credentials.expiresAt) {
      if (!(credentials.expiresAt instanceof Date)) {
        try {
          new Date(credentials.expiresAt);
        } catch {
          errors.push('expiresAt must be a valid date');
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Generate a secure random API key
   */
  generateApiKey(length = 32): string {
    return crypto.randomBytes(length).toString('base64url');
  }

  /**
   * Rotate encryption key (re-encrypt all credentials with new key)
   */
  async rotateKey(
    oldKeyBase: string,
    newKeyBase: string,
    encryptedCredentialsList: string[]
  ): Promise<string[]> {
    const oldKey = this.deriveKey(oldKeyBase);
    const newManager = new CredentialManager();
    newManager.encryptionKey = this.deriveKey(newKeyBase);

    const rotated: string[] = [];

    for (const encrypted of encryptedCredentialsList) {
      try {
        // Decrypt with old key
        const tempKey = this.encryptionKey;
        this.encryptionKey = oldKey;
        const credentials = this.decrypt(encrypted);

        // Encrypt with new key
        this.encryptionKey = tempKey;
        const reEncrypted = newManager.encrypt(credentials);

        rotated.push(reEncrypted);
      } catch (error: any) {
        logger.error('Failed to rotate credential', { error: error.message });
        throw new Error('Key rotation failed');
      }
    }

    return rotated;
  }
}

// Singleton instance
export const credentialManager = new CredentialManager();
