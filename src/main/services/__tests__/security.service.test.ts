/**
 * TAG-TEST-001: SecurityService Tests
 *
 * Test suite for SecurityService implementing REQ-001 (Credential Storage):
 * - Store credentials in OS keychain
 * - Retrieve credentials from keychain
 * - Delete credentials from keychain
 * - Encrypt sensitive data at rest
 * - No plaintext secrets in memory
 *
 * Technical Constraints:
 * - Mock keytar for testing
 * - Test secure memory handling
 * - Validate encryption/decryption
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SecurityService } from '../security.service';

// Mock keytar - must be before imports
vi.mock('keytar', () => ({
  getPassword: vi.fn(),
  setPassword: vi.fn(),
  deletePassword: vi.fn(),
}));

import * as keytar from 'keytar';

describe('SecurityService', () => {
  let service: SecurityService;
  const mockService = 'claude-parallel-runner';
  const testAccount = 'test-api-key';
  const testPassword = 'sk-ant-api03-secret-key-12345';

  beforeEach(() => {
    vi.clearAllMocks();
    service = new SecurityService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('storeCredential', () => {
    it('should store credential in keychain', async () => {
      vi.mocked(keytar.setPassword).mockResolvedValueOnce(true);

      await service.storeCredential(testAccount, testPassword);

      expect(keytar.setPassword).toHaveBeenCalledWith(
        mockService,
        testAccount,
        testPassword
      );
    });

    it('should throw error if keytar fails', async () => {
      vi.mocked(keytar.setPassword).mockRejectedValueOnce(
        new Error('Keychain unavailable')
      );

      await expect(
        service.storeCredential(testAccount, testPassword)
      ).rejects.toThrow('Failed to store credential');
    });

    it('should validate account name is not empty', async () => {
      await expect(service.storeCredential('', testPassword)).rejects.toThrow(
        'Account name cannot be empty'
      );
    });

    it('should validate password is not empty', async () => {
      await expect(
        service.storeCredential(testAccount, '')
      ).rejects.toThrow('Password cannot be empty');
    });
  });

  describe('getCredential', () => {
    it('should retrieve credential from keychain', async () => {
      vi.mocked(keytar.getPassword).mockResolvedValueOnce(testPassword);

      const result = await service.getCredential(testAccount);

      expect(result).toBe(testPassword);
      expect(keytar.getPassword).toHaveBeenCalledWith(mockService, testAccount);
    });

    it('should return null if credential not found', async () => {
      vi.mocked(keytar.getPassword).mockResolvedValueOnce(null);

      const result = await service.getCredential(testAccount);

      expect(result).toBeNull();
    });

    it('should throw error if keytar fails', async () => {
      vi.mocked(keytar.getPassword).mockRejectedValueOnce(
        new Error('Keychain unavailable')
      );

      await expect(service.getCredential(testAccount)).rejects.toThrow(
        'Failed to retrieve credential'
      );
    });

    it('should validate account name is not empty', async () => {
      await expect(service.getCredential('')).rejects.toThrow(
        'Account name cannot be empty'
      );
    });
  });

  describe('deleteCredential', () => {
    it('should delete credential from keychain', async () => {
      vi.mocked(keytar.deletePassword).mockResolvedValueOnce(true);

      await service.deleteCredential(testAccount);

      expect(keytar.deletePassword).toHaveBeenCalledWith(mockService, testAccount);
    });

    it('should throw error if keytar fails', async () => {
      vi.mocked(keytar.deletePassword).mockRejectedValueOnce(
        new Error('Keychain unavailable')
      );

      await expect(service.deleteCredential(testAccount)).rejects.toThrow(
        'Failed to delete credential'
      );
    });

    it('should validate account name is not empty', async () => {
      await expect(service.deleteCredential('')).rejects.toThrow(
        'Account name cannot be empty'
      );
    });
  });

  describe('encryptSensitiveData', () => {
    it('should encrypt sensitive data', async () => {
      const plaintext = 'sensitive-data-123';

      const encrypted = await service.encryptSensitiveData(plaintext);

      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(plaintext);
      expect(typeof encrypted).toBe('string');
      expect(encrypted.length).toBeGreaterThan(0);
    });

    it('should produce different ciphertext for same plaintext', async () => {
      const plaintext = 'sensitive-data-123';

      const encrypted1 = await service.encryptSensitiveData(plaintext);
      const encrypted2 = await service.encryptSensitiveData(plaintext);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should validate input is not empty', async () => {
      await expect(service.encryptSensitiveData('')).rejects.toThrow(
        'Data to encrypt cannot be empty'
      );
    });
  });

  describe('decryptSensitiveData', () => {
    it('should decrypt encrypted data', async () => {
      const plaintext = 'sensitive-data-123';
      const encrypted = await service.encryptSensitiveData(plaintext);

      const decrypted = await service.decryptSensitiveData(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should throw error for invalid encrypted data', async () => {
      await expect(
        service.decryptSensitiveData('invalid-encrypted-data')
      ).rejects.toThrow('Failed to decrypt data');
    });

    it('should validate input is not empty', async () => {
      await expect(service.decryptSensitiveData('')).rejects.toThrow(
        'Encrypted data cannot be empty'
      );
    });
  });

  describe('secureMemoryClear', () => {
    it('should clear sensitive data from memory', () => {
      const sensitiveData = Buffer.from('secret-password-123', 'utf-8');

      service.secureMemoryClear(sensitiveData);

      // Verify buffer is zeroed out
      expect(sensitiveData.toString()).not.toBe('secret-password-123');
      expect(sensitiveData.every((byte) => byte === 0)).toBe(true);
    });

    it('should handle empty buffer', () => {
      const emptyBuffer = Buffer.from('');

      expect(() => service.secureMemoryClear(emptyBuffer)).not.toThrow();
    });
  });

  describe('credentialExists', () => {
    it('should return true if credential exists', async () => {
      vi.mocked(keytar.getPassword).mockResolvedValueOnce(testPassword);

      const exists = await service.credentialExists(testAccount);

      expect(exists).toBe(true);
    });

    it('should return false if credential does not exist', async () => {
      vi.mocked(keytar.getPassword).mockResolvedValueOnce(null);

      const exists = await service.credentialExists(testAccount);

      expect(exists).toBe(false);
    });

    it('should validate account name is not empty', async () => {
      await expect(service.credentialExists('')).rejects.toThrow(
        'Account name cannot be empty'
      );
    });
  });

  describe('listAllAccounts', () => {
    it('should return list of accounts with stored credentials', async () => {
      // Note: keytar doesn't provide a native way to list all accounts
      // This test verifies the behavior when implemented
      const accounts = await service.listAllAccounts();

      expect(Array.isArray(accounts)).toBe(true);
    });
  });
});
