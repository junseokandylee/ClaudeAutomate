/**
 * TAG-FUNC-001: Security Service
 *
 * Implements REQ-001 (Credential Storage) for secure credential management:
 * - OS keychain integration via keytar
 * - Encryption/decryption of sensitive data
 * - Secure memory handling
 * - No plaintext secrets in config files
 *
 * Technical Constraints:
 * - keytar for cross-platform keychain access
 * - AES-256-GCM for encryption
 * - Secure memory clearing
 * - Input validation
 *
 * @example
 * ```typescript
 * const service = new SecurityService();
 * await service.storeCredential('api-key', 'sk-ant-xxx');
 * const key = await service.getCredential('api-key');
 * ```
 */

import * as keytar from 'keytar';
import * as crypto from 'crypto';

/**
 * Security Service Configuration
 */
interface SecurityServiceConfig {
  serviceName?: string;
  encryptionAlgorithm?: string;
  keyLength?: number;
  ivLength?: number;
  authTagLength?: number;
}

/**
 * Security Service
 *
 * Provides secure credential storage and encryption capabilities.
 * Uses OS keychain for credential persistence and AES-256-GCM for encryption.
 */
export class SecurityService {
  private readonly serviceName: string;
  private readonly algorithm: string;
  private readonly keyLength: number;
  private readonly ivLength: number;
  private readonly authTagLength: number;
  private encryptionKey: Buffer | null = null;

  constructor(config: SecurityServiceConfig = {}) {
    this.serviceName = config.serviceName || 'claude-parallel-runner';
    this.algorithm = config.encryptionAlgorithm || 'aes-256-gcm';
    this.keyLength = config.keyLength || 32;
    this.ivLength = config.ivLength || 16;
    this.authTagLength = config.authTagLength || 16;

    // Initialize encryption key from environment or generate
    this.initializeEncryptionKey();
  }

  /**
   * Initialize encryption key
   *
   * Uses environment variable or generates a key for the session.
   * In production, this should use a proper key management system.
   */
  private initializeEncryptionKey(): void {
    const envKey = process.env.ENCRYPTION_KEY;

    if (envKey) {
      // Use key from environment
      this.encryptionKey = Buffer.from(envKey, 'base64');
    } else {
      // Generate a session key (not ideal for production)
      // TODO: Implement proper key derivation in production
      this.encryptionKey = crypto.randomBytes(this.keyLength);
    }
  }

  /**
   * Store credential in OS keychain
   *
   * @param account - Account/credential identifier
   * @param password - Password/secret to store
   * @throws Error if account or password is empty
   * @throws Error if keytar operation fails
   */
  async storeCredential(account: string, password: string): Promise<boolean> {
    // Validate inputs
    if (!account || account.trim().length === 0) {
      throw new Error('Account name cannot be empty');
    }

    if (!password || password.trim().length === 0) {
      throw new Error('Password cannot be empty');
    }

    try {
      const result = await keytar.setPassword(this.serviceName, account, password);
      return result ?? false;
    } catch (error) {
      throw new Error(
        `Failed to store credential: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Retrieve credential from OS keychain
   *
   * @param account - Account/credential identifier
   * @returns Password if found, null otherwise
   * @throws Error if account is empty
   * @throws Error if keytar operation fails
   */
  async getCredential(account: string): Promise<string | null> {
    // Validate input
    if (!account || account.trim().length === 0) {
      throw new Error('Account name cannot be empty');
    }

    try {
      const password = await keytar.getPassword(this.serviceName, account);
      return password;
    } catch (error) {
      throw new Error(
        `Failed to retrieve credential: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Delete credential from OS keychain
   *
   * @param account - Account/credential identifier
   * @returns true if deleted, false if not found
   * @throws Error if account is empty
   * @throws Error if keytar operation fails
   */
  async deleteCredential(account: string): Promise<boolean> {
    // Validate input
    if (!account || account.trim().length === 0) {
      throw new Error('Account name cannot be empty');
    }

    try {
      const result = await keytar.deletePassword(this.serviceName, account);
      return result ?? false;
    } catch (error) {
      throw new Error(
        `Failed to delete credential: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Check if credential exists
   *
   * @param account - Account/credential identifier
   * @returns true if exists, false otherwise
   */
  async credentialExists(account: string): Promise<boolean> {
    // Validate input
    if (!account || account.trim().length === 0) {
      throw new Error('Account name cannot be empty');
    }

    try {
      const password = await keytar.getPassword(this.serviceName, account);
      return password !== null;
    } catch (error) {
      throw new Error(
        `Failed to check credential: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * List all accounts with stored credentials
   *
   * Note: keytar doesn't provide a native way to list all accounts.
   * This is a placeholder for future implementation.
   *
   * @returns Array of account names
   */
  async listAllAccounts(): Promise<string[]> {
    // TODO: Implement account listing
    // keytar doesn't provide a native way to do this
    // We would need to maintain a separate index
    return [];
  }

  /**
   * Encrypt sensitive data
   *
   * Uses AES-256-GCM for authenticated encryption.
   * Each encryption uses a random IV for semantic security.
   *
   * @param plaintext - Data to encrypt
   * @returns Base64-encoded encrypted data (IV + ciphertext + auth tag)
   * @throws Error if data is empty
   */
  async encryptSensitiveData(plaintext: string): Promise<string> {
    // Validate input
    if (!plaintext || plaintext.trim().length === 0) {
      throw new Error('Data to encrypt cannot be empty');
    }

    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized');
    }

    try {
      // Generate random IV
      const iv = crypto.randomBytes(this.ivLength);

      // Create cipher
      const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);

      // Encrypt data
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Get auth tag
      const authTag = cipher.getAuthTag();

      // Combine: IV + auth tag + encrypted data
      const combined = Buffer.concat([iv, authTag, Buffer.from(encrypted, 'hex')]);

      // Return as base64
      return combined.toString('base64');
    } catch (error) {
      throw new Error(
        `Failed to encrypt data: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Decrypt sensitive data
   *
   * @param encryptedData - Base64-encoded encrypted data
   * @returns Decrypted plaintext
   * @throws Error if data is empty or invalid
   */
  async decryptSensitiveData(encryptedData: string): Promise<string> {
    // Validate input
    if (!encryptedData || encryptedData.trim().length === 0) {
      throw new Error('Encrypted data cannot be empty');
    }

    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized');
    }

    try {
      // Decode base64
      const combined = Buffer.from(encryptedData, 'base64');

      // Extract components
      const iv = combined.subarray(0, this.ivLength);
      const authTag = combined.subarray(this.ivLength, this.ivLength + this.authTagLength);
      const ciphertext = combined.subarray(this.ivLength + this.authTagLength);

      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
      decipher.setAuthTag(authTag);

      // Decrypt data
      let decrypted = decipher.update(ciphertext);
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      return decrypted.toString('utf8');
    } catch (error) {
      throw new Error(
        `Failed to decrypt data: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Securely clear sensitive data from memory
   *
   * Overwrites buffer content with zeros before freeing.
   * This is a best-effort approach in JavaScript/V8.
   *
   * @param buffer - Buffer to clear
   */
  secureMemoryClear(buffer: Buffer): void {
    if (!buffer || buffer.length === 0) {
      return;
    }

    try {
      // Overwrite buffer with zeros
      buffer.fill(0);

      // In V8, we can also force garbage collection (if --expose-gc is set)
      // This is not reliable in all environments
      if (global.gc) {
        global.gc();
      }
    } catch (error) {
      console.warn('Failed to securely clear memory:', error);
    }
  }

  /**
   * Generate a secure random string
   *
   * @param length - Length of random string
   * @returns Secure random string
   */
  generateSecureRandom(length: number = 32): string {
    return crypto.randomBytes(length).toString('base64').slice(0, length);
  }

  /**
   * Hash sensitive data (one-way)
   *
   * Uses SHA-256 for irreversible hashing.
   *
   * @param data - Data to hash
   * @returns Hex-encoded hash
   */
  hashData(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Verify data against hash
   *
   * @param data - Data to verify
   * @param hash - Hash to compare against
   * @returns true if hash matches
   */
  verifyHash(data: string, hash: string): boolean {
    const computedHash = this.hashData(data);
    return computedHash === hash;
  }
}
