/**
 * Validators - Input validation utilities
 */

class Validators {
  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} - True if valid
   */
  static isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  /**
   * Validate URL format
   * @param {string} url - URL to validate
   * @returns {boolean} - True if valid
   */
  static isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @returns {Object} - { valid: boolean, message: string, strength: number }
   */
  static validatePassword(password) {
    if (!password || password.length < 8) {
      return {
        valid: false,
        message: '密码至少需要8个字符',
        strength: 0
      };
    }

    let strength = 0;

    // Length
    if (password.length >= 12) strength++;
    if (password.length >= 16) strength++;

    // Complexity
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    return {
      valid: true,
      message: strength >= 3 ? '强密码' : strength >= 2 ? '中等密码' : '弱密码',
      strength: Math.min(strength, 5)
    };
  }

  /**
   * Sanitize filename
   * @param {string} filename - Filename to sanitize
   * @returns {string} - Sanitized filename
   */
  static sanitizeFilename(filename) {
    return filename
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
      .substring(0, 255);
  }

  /**
   * Validate file size
   * @param {number} size - File size in bytes
   * @param {number} maxSize - Maximum size in bytes
   * @returns {boolean} - True if valid
   */
  static isValidFileSize(size, maxSize = 500 * 1024 * 1024) {
    return size > 0 && size <= maxSize;
  }

  /**
   * Validate MIME type
   * @param {string} mimeType - MIME type to validate
   * @param {Array} allowedTypes - Array of allowed MIME types
   * @returns {boolean} - True if valid
   */
  static isValidMimeType(mimeType, allowedTypes) {
    return allowedTypes.includes(mimeType);
  }

  /**
   * Escape HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} - Escaped text
   */
  static escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  /**
   * Validate API key format (basic check)
   * @param {string} apiKey - API key to validate
   * @returns {boolean} - True if valid format
   */
  static isValidApiKey(apiKey) {
    return apiKey && apiKey.length >= 20 && /^[a-zA-Z0-9_-]+$/.test(apiKey);
  }

  /**
   * Validate category name
   * @param {string} name - Category name
   * @returns {Object} - { valid: boolean, message: string }
   */
  static validateCategoryName(name) {
    if (!name || name.trim().length === 0) {
      return { valid: false, message: '类别名称不能为空' };
    }

    if (name.length > 50) {
      return { valid: false, message: '类别名称不能超过50个字符' };
    }

    return { valid: true, message: '' };
  }

  /**
   * Validate tag
   * @param {string} tag - Tag to validate
   * @returns {boolean} - True if valid
   */
  static isValidTag(tag) {
    return tag && tag.trim().length > 0 && tag.length <= 100;
  }
}

export default Validators;
