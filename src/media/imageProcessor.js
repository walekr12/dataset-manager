/**
 * Image Processor - Handles image file processing and thumbnail generation
 */

class ImageProcessor {
  constructor() {
    this.maxThumbnailSize = 400;
    this.thumbnailQuality = 0.7;
  }

  /**
   * Set thumbnail quality (0.1 - 1.0)
   */
  setThumbnailQuality(quality) {
    this.thumbnailQuality = Math.max(0.1, Math.min(1.0, quality));
  }

  /**
   * Extract metadata from image file
   * @param {File} file - Image file
   * @returns {Promise<Object>} - { width, height, size, type }
   */
  async extractMetadata(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        const metadata = {
          width: img.naturalWidth,
          height: img.naturalHeight,
          size: file.size,
          type: file.type,
          fileName: file.name
        };
        URL.revokeObjectURL(url);
        resolve(metadata);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };

      img.src = url;
    });
  }

  /**
   * Generate thumbnail for image
   * @param {File} file - Image file
   * @returns {Promise<Blob>} - Thumbnail blob
   */
  async generateThumbnail(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          // Calculate thumbnail dimensions
          let { width, height } = this.calculateThumbnailSize(
            img.naturalWidth,
            img.naturalHeight
          );

          canvas.width = width;
          canvas.height = height;

          // Draw and compress image
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              URL.revokeObjectURL(url);
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to generate thumbnail'));
              }
            },
            'image/jpeg',
            this.thumbnailQuality
          );
        } catch (error) {
          URL.revokeObjectURL(url);
          reject(error);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image for thumbnail'));
      };

      img.src = url;
    });
  }

  /**
   * Calculate thumbnail dimensions maintaining aspect ratio
   */
  calculateThumbnailSize(width, height) {
    const maxSize = this.maxThumbnailSize;

    if (width <= maxSize && height <= maxSize) {
      return { width, height };
    }

    const ratio = width / height;

    if (width > height) {
      return {
        width: maxSize,
        height: Math.round(maxSize / ratio)
      };
    } else {
      return {
        width: Math.round(maxSize * ratio),
        height: maxSize
      };
    }
  }

  /**
   * Convert image to base64 for AI processing
   * @param {File|Blob} file - Image file or blob
   * @param {number} maxSize - Maximum dimension for AI processing (default 2048)
   * @returns {Promise<string>} - Base64 encoded image
   */
  async toBase64ForAI(file, maxSize = 2048) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          // Calculate dimensions for AI processing
          let width = img.naturalWidth;
          let height = img.naturalHeight;

          if (width > maxSize || height > maxSize) {
            const ratio = width / height;
            if (width > height) {
              width = maxSize;
              height = Math.round(maxSize / ratio);
            } else {
              height = maxSize;
              width = Math.round(maxSize * ratio);
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          const base64 = canvas.toDataURL('image/jpeg', 0.9);
          URL.revokeObjectURL(url);
          resolve(base64);
        } catch (error) {
          URL.revokeObjectURL(url);
          reject(error);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };

      img.src = url;
    });
  }

  /**
   * Validate image file
   * @param {File} file - File to validate
   * @returns {boolean} - True if valid image
   */
  isValidImage(file) {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    return validTypes.includes(file.type);
  }

  /**
   * Format file size for display
   * @param {number} bytes - File size in bytes
   * @returns {string} - Formatted size string
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}

export default ImageProcessor;
