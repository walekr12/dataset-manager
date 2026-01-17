/**
 * File Handler - Handles file import, validation, and processing
 */

import ImageProcessor from '../media/imageProcessor.js';
import VideoProcessor from '../media/videoProcessor.js';

class FileHandler {
  constructor(encryption, db) {
    this.encryption = encryption;
    this.db = db;
    this.imageProcessor = new ImageProcessor();
    this.videoProcessor = new VideoProcessor();
  }

  /**
   * Process and import files
   * @param {FileList} files - Files to import
   * @param {string} categoryId - Category ID to assign
   * @param {Function} progressCallback - Progress callback (current, total, fileName)
   * @returns {Promise<Array>} - Array of imported media items
   */
  async importFiles(files, categoryId, progressCallback = null) {
    const results = [];
    const totalFiles = files.length;

    for (let i = 0; i < totalFiles; i++) {
      const file = files[i];

      if (progressCallback) {
        progressCallback(i + 1, totalFiles, file.name);
      }

      try {
        const mediaItem = await this.processFile(file, categoryId);
        results.push({ success: true, item: mediaItem, fileName: file.name });
      } catch (error) {
        console.error(`Failed to import ${file.name}:`, error);
        results.push({ success: false, error: error.message, fileName: file.name });
      }
    }

    return results;
  }

  /**
   * Process a single file
   * @param {File} file - File to process
   * @param {string} categoryId - Category ID
   * @returns {Promise<Object>} - Media item object
   */
  async processFile(file, categoryId) {
    // Determine file type
    const isImage = this.imageProcessor.isValidImage(file);
    const isVideo = this.videoProcessor.isValidVideo(file);

    if (!isImage && !isVideo) {
      throw new Error('Unsupported file type');
    }

    const type = isImage ? 'image' : 'video';
    const processor = isImage ? this.imageProcessor : this.videoProcessor;

    // Extract metadata
    const metadata = await processor.extractMetadata(file);

    // Generate thumbnail
    const thumbnailBlob = await processor.generateThumbnail(file);

    // Encrypt thumbnail
    const encryptedThumbnail = await this.encryption.encryptBlob(thumbnailBlob);

    // Encrypt original file
    const encryptedFile = await this.encryption.encryptBlob(file);

    // Create media item object
    const mediaItem = {
      id: this.generateUUID(),
      categoryId: categoryId,
      type: type,
      fileName: metadata.fileName,
      fileSize: metadata.size,
      width: metadata.width,
      height: metadata.height,
      duration: metadata.duration || 0,
      thumbnailData: encryptedThumbnail.data,
      thumbnailIv: encryptedThumbnail.iv,
      fileData: encryptedFile.data,
      fileIv: encryptedFile.iv,
      mimeType: file.type,
      aiTags: [],
      aiPrompt: '',
      aiModel: '',
      createdAt: Date.now(),
      deletedOriginal: false
    };

    // Save to database
    await this.db.addMediaItem(mediaItem);

    return mediaItem;
  }

  /**
   * Delete original file (requires File System Access API)
   * Note: This is a placeholder - actual implementation would need user permission
   * @param {string} fileName - File name to delete
   */
  async deleteOriginalFile(fileName) {
    // This would require File System Access API and user permission
    // For now, we just mark it as deleted in the database
    console.log(`Marking ${fileName} as original deleted`);
    return true;
  }

  /**
   * Get decrypted thumbnail
   * @param {Object} mediaItem - Media item with encrypted thumbnail
   * @returns {Promise<string>} - Object URL for thumbnail
   */
  async getDecryptedThumbnail(mediaItem) {
    try {
      const blob = await this.encryption.decryptToBlob(
        mediaItem.thumbnailData,
        mediaItem.thumbnailIv,
        'image/jpeg'
      );
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Failed to decrypt thumbnail:', error);
      throw error;
    }
  }

  /**
   * Get decrypted original file
   * @param {Object} mediaItem - Media item with encrypted file
   * @returns {Promise<string>} - Object URL for original file
   */
  async getDecryptedFile(mediaItem) {
    try {
      const blob = await this.encryption.decryptToBlob(
        mediaItem.fileData,
        mediaItem.fileIv,
        mediaItem.mimeType
      );
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Failed to decrypt file:', error);
      throw error;
    }
  }

  /**
   * Get decrypted file as blob (for AI processing)
   * @param {Object} mediaItem - Media item
   * @returns {Promise<Blob>} - Decrypted file blob
   */
  async getDecryptedBlob(mediaItem) {
    try {
      const blob = await this.encryption.decryptToBlob(
        mediaItem.fileData,
        mediaItem.fileIv,
        mediaItem.mimeType
      );
      return blob;
    } catch (error) {
      console.error('Failed to decrypt file:', error);
      throw error;
    }
  }

  /**
   * Validate file size (max 500MB)
   * @param {File} file - File to validate
   * @returns {boolean} - True if size is acceptable
   */
  validateFileSize(file) {
    const maxSize = 500 * 1024 * 1024; // 500MB
    return file.size <= maxSize;
  }

  /**
   * Generate UUID v4
   * @returns {string} - UUID
   */
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Format file size for display
   * @param {number} bytes - Size in bytes
   * @returns {string} - Formatted size
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Format date for display
   * @param {number} timestamp - Timestamp
   * @returns {string} - Formatted date
   */
  formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

export default FileHandler;
