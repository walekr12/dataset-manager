/**
 * Tag Processor - Handles AI tagging operations and management
 */

import ImageProcessor from '../media/imageProcessor.js';
import VideoProcessor from '../media/videoProcessor.js';

class TagProcessor {
  constructor(aiClient, fileHandler, db) {
    this.aiClient = aiClient;
    this.fileHandler = fileHandler;
    this.db = db;
    this.imageProcessor = new ImageProcessor();
    this.videoProcessor = new VideoProcessor();
  }

  /**
   * Tag a single media item
   * @param {Object} mediaItem - Media item to tag
   * @param {string} customPrompt - Custom prompt (optional)
   * @returns {Promise<Object>} - Updated media item
   */
  async tagItem(mediaItem, customPrompt = null) {
    try {
      // Get decrypted file
      const blob = await this.fileHandler.getDecryptedBlob(mediaItem);

      // Convert to base64 for AI
      let base64Image;
      if (mediaItem.type === 'image') {
        base64Image = await this.imageProcessor.toBase64ForAI(blob);
      } else if (mediaItem.type === 'video') {
        base64Image = await this.videoProcessor.extractFrameForAI(blob);
      } else {
        throw new Error('Unsupported media type');
      }

      // Analyze with AI
      const result = await this.aiClient.analyzeImage(base64Image, customPrompt);

      if (!result.success) {
        throw new Error(result.error || 'AI analysis failed');
      }

      // Update media item
      mediaItem.aiTags = result.tags;
      mediaItem.aiPrompt = customPrompt || this.aiClient.defaultPrompt;
      mediaItem.aiModel = this.aiClient.model;
      mediaItem.aiResponse = result.fullResponse;
      mediaItem.lastTagged = Date.now();

      // Save to database
      await this.db.updateMediaItem(mediaItem);

      return {
        success: true,
        item: mediaItem,
        tags: result.tags
      };
    } catch (error) {
      console.error('Failed to tag item:', error);
      return {
        success: false,
        item: mediaItem,
        error: error.message
      };
    }
  }

  /**
   * Batch tag multiple items
   * @param {Array} mediaItems - Array of media items
   * @param {Function} progressCallback - Progress callback
   * @param {string} customPrompt - Custom prompt (optional)
   * @returns {Promise<Object>} - { success: number, failed: number, results: Array }
   */
  async batchTag(mediaItems, progressCallback = null, customPrompt = null) {
    const results = [];
    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < mediaItems.length; i++) {
      const item = mediaItems[i];

      if (progressCallback) {
        progressCallback(i + 1, mediaItems.length, item);
      }

      const result = await this.tagItem(item, customPrompt);

      if (result.success) {
        successCount++;
      } else {
        failedCount++;
      }

      results.push(result);

      // Small delay to avoid rate limiting
      if (i < mediaItems.length - 1) {
        await this.delay(1000);
      }
    }

    return {
      success: successCount,
      failed: failedCount,
      results: results
    };
  }

  /**
   * Re-tag items that failed
   * @param {Array} failedResults - Array of failed results from batchTag
   * @param {Function} progressCallback - Progress callback
   * @param {string} customPrompt - Custom prompt (optional)
   * @returns {Promise<Object>} - Retry results
   */
  async retryFailed(failedResults, progressCallback = null, customPrompt = null) {
    const itemsToRetry = failedResults
      .filter(r => !r.success)
      .map(r => r.item);

    return await this.batchTag(itemsToRetry, progressCallback, customPrompt);
  }

  /**
   * Get untagged items
   * @param {string} categoryId - Category ID ('all' for all categories)
   * @returns {Promise<Array>} - Untagged media items
   */
  async getUntaggedItems(categoryId = 'all') {
    try {
      let items;
      if (categoryId === 'all') {
        items = await this.db.getAllMediaItems();
      } else {
        items = await this.db.getMediaItemsByCategory(categoryId);
      }

      return items.filter(item => !item.aiTags || item.aiTags.length === 0);
    } catch (error) {
      console.error('Failed to get untagged items:', error);
      return [];
    }
  }

  /**
   * Search items by tags
   * @param {string} query - Search query
   * @returns {Promise<Array>} - Matching media items
   */
  async searchByTags(query) {
    try {
      const allItems = await this.db.getAllMediaItems();
      const lowerQuery = query.toLowerCase();

      return allItems.filter(item => {
        if (!item.aiTags || item.aiTags.length === 0) {
          return false;
        }

        return item.aiTags.some(tag =>
          tag.toLowerCase().includes(lowerQuery)
        ) || (item.aiResponse && item.aiResponse.toLowerCase().includes(lowerQuery));
      });
    } catch (error) {
      console.error('Failed to search by tags:', error);
      return [];
    }
  }

  /**
   * Get all unique tags
   * @returns {Promise<Array>} - Array of unique tags with counts
   */
  async getAllTags() {
    try {
      const allItems = await this.db.getAllMediaItems();
      const tagCounts = {};

      allItems.forEach(item => {
        if (item.aiTags && item.aiTags.length > 0) {
          item.aiTags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        }
      });

      return Object.entries(tagCounts)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count);
    } catch (error) {
      console.error('Failed to get all tags:', error);
      return [];
    }
  }

  /**
   * Clear tags from item
   * @param {Object} mediaItem - Media item
   * @returns {Promise<Object>} - Updated media item
   */
  async clearTags(mediaItem) {
    mediaItem.aiTags = [];
    mediaItem.aiPrompt = '';
    mediaItem.aiModel = '';
    mediaItem.aiResponse = '';
    delete mediaItem.lastTagged;

    await this.db.updateMediaItem(mediaItem);
    return mediaItem;
  }

  /**
   * Add manual tag to item
   * @param {Object} mediaItem - Media item
   * @param {string} tag - Tag to add
   * @returns {Promise<Object>} - Updated media item
   */
  async addManualTag(mediaItem, tag) {
    if (!mediaItem.aiTags) {
      mediaItem.aiTags = [];
    }

    const trimmedTag = tag.trim();
    if (trimmedTag && !mediaItem.aiTags.includes(trimmedTag)) {
      mediaItem.aiTags.push(trimmedTag);
      await this.db.updateMediaItem(mediaItem);
    }

    return mediaItem;
  }

  /**
   * Remove tag from item
   * @param {Object} mediaItem - Media item
   * @param {string} tag - Tag to remove
   * @returns {Promise<Object>} - Updated media item
   */
  async removeTag(mediaItem, tag) {
    if (mediaItem.aiTags) {
      mediaItem.aiTags = mediaItem.aiTags.filter(t => t !== tag);
      await this.db.updateMediaItem(mediaItem);
    }

    return mediaItem;
  }

  /**
   * Delay helper
   * @param {number} ms - Milliseconds
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default TagProcessor;
