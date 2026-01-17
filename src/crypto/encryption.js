/**
 * Encryption - Handles encryption and decryption of files and data
 */

class Encryption {
  constructor(keyManager) {
    this.keyManager = keyManager;
  }

  /**
   * Encrypt a file blob
   * @param {Blob} fileBlob - File to encrypt
   * @returns {Promise<Object>} - { encrypted: ArrayBuffer, iv: Uint8Array }
   */
  async encryptFile(fileBlob) {
    const key = this.keyManager.getMasterKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const fileBuffer = await fileBlob.arrayBuffer();

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      fileBuffer
    );

    return { encrypted, iv };
  }

  /**
   * Decrypt a file
   * @param {ArrayBuffer} encryptedData - Encrypted data
   * @param {Uint8Array} iv - Initialization vector
   * @returns {Promise<ArrayBuffer>} - Decrypted data
   */
  async decryptFile(encryptedData, iv) {
    const key = this.keyManager.getMasterKey();

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encryptedData
    );

    return decrypted;
  }

  /**
   * Encrypt a string (for API keys, etc.)
   * @param {string} text - Text to encrypt
   * @returns {Promise<Object>} - { encrypted: string, iv: string }
   */
  async encryptString(text) {
    const key = this.keyManager.getMasterKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encoder = new TextEncoder();
    const data = encoder.encode(text);

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    return {
      encrypted: this.bufferToBase64(encrypted),
      iv: this.bufferToBase64(iv)
    };
  }

  /**
   * Decrypt a string
   * @param {string} encryptedBase64 - Encrypted data in base64
   * @param {string} ivBase64 - IV in base64
   * @returns {Promise<string>} - Decrypted text
   */
  async decryptString(encryptedBase64, ivBase64) {
    const key = this.keyManager.getMasterKey();

    const encrypted = this.base64ToBuffer(encryptedBase64);
    const iv = this.base64ToBuffer(ivBase64);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }

  /**
   * Encrypt a Blob and return as an object suitable for IndexedDB storage
   * @param {Blob} blob - Blob to encrypt
   * @returns {Promise<Object>} - { data: ArrayBuffer, iv: string }
   */
  async encryptBlob(blob) {
    const { encrypted, iv } = await this.encryptFile(blob);
    return {
      data: encrypted,
      iv: this.bufferToBase64(iv)
    };
  }

  /**
   * Decrypt data from IndexedDB and return as Blob
   * @param {ArrayBuffer} encryptedData - Encrypted data
   * @param {string} ivBase64 - IV in base64
   * @param {string} mimeType - MIME type for the blob
   * @returns {Promise<Blob>} - Decrypted blob
   */
  async decryptToBlob(encryptedData, ivBase64, mimeType = 'application/octet-stream') {
    const iv = this.base64ToBuffer(ivBase64);
    const decrypted = await this.decryptFile(encryptedData, iv);
    return new Blob([decrypted], { type: mimeType });
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

export default Encryption;
