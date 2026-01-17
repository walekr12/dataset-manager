/**
 * Key Manager - Handles password-based key derivation and management
 */

class KeyManager {
  constructor() {
    this.masterKey = null;
    this.salt = null;
  }

  /**
   * Initialize or retrieve salt from localStorage
   */
  async initializeSalt() {
    const storedSalt = localStorage.getItem('app_salt');
    if (storedSalt) {
      this.salt = this.base64ToBuffer(storedSalt);
    } else {
      // Generate new salt for first-time setup
      this.salt = crypto.getRandomValues(new Uint8Array(16));
      localStorage.setItem('app_salt', this.bufferToBase64(this.salt));
    }
  }

  /**
   * Check if master password has been set
   */
  isPasswordSet() {
    return localStorage.getItem('app_salt') !== null;
  }

  /**
   * Derive encryption key from password using PBKDF2
   * @param {string} password - User's master password
   * @returns {Promise<CryptoKey>} - Derived encryption key
   */
  async deriveKey(password) {
    if (!this.salt) {
      await this.initializeSalt();
    }

    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveKey']
    );

    // Derive AES-GCM key from password
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: this.salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    this.masterKey = key;
    return key;
  }

  /**
   * Verify password by attempting to decrypt a test value
   * @param {string} password - Password to verify
   * @returns {Promise<boolean>} - True if password is correct
   */
  async verifyPassword(password) {
    const testData = localStorage.getItem('password_test');
    if (!testData) {
      // No test data exists, this is first-time setup
      return true;
    }

    try {
      const key = await this.deriveKey(password);
      const { encrypted, iv } = JSON.parse(testData);

      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: this.base64ToBuffer(iv)
        },
        key,
        this.base64ToBuffer(encrypted)
      );

      const decoder = new TextDecoder();
      const text = decoder.decode(decrypted);
      return text === 'PASSWORD_CORRECT';
    } catch (error) {
      return false;
    }
  }

  /**
   * Set up master password (first-time setup)
   * @param {string} password - New master password
   */
  async setupPassword(password) {
    await this.initializeSalt();
    const key = await this.deriveKey(password);

    // Create test encrypted data to verify password later
    const encoder = new TextEncoder();
    const testData = encoder.encode('PASSWORD_CORRECT');
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      testData
    );

    localStorage.setItem('password_test', JSON.stringify({
      encrypted: this.bufferToBase64(encrypted),
      iv: this.bufferToBase64(iv)
    }));

    return true;
  }

  /**
   * Get the current master key (must be unlocked first)
   */
  getMasterKey() {
    if (!this.masterKey) {
      throw new Error('Application is locked. Please unlock first.');
    }
    return this.masterKey;
  }

  /**
   * Lock the application by clearing the master key from memory
   */
  lock() {
    this.masterKey = null;
  }

  /**
   * Check if application is unlocked
   */
  isUnlocked() {
    return this.masterKey !== null;
  }

  /**
   * Convert ArrayBuffer to Base64 string
   */
  bufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert Base64 string to ArrayBuffer
   */
  base64ToBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

export default KeyManager;
