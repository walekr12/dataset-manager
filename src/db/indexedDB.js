/**
 * IndexedDB Manager - Handles all database operations
 */

import { DB_NAME, DB_VERSION, STORES, schema } from './schema.js';

class IndexedDBManager {
  constructor() {
    this.db = null;
  }

  /**
   * Initialize the database
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open database'));
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create categories store
        if (!db.objectStoreNames.contains(STORES.CATEGORIES)) {
          const categoryStore = db.createObjectStore(STORES.CATEGORIES, {
            keyPath: schema.categories.keyPath
          });
          schema.categories.indexes.forEach(index => {
            categoryStore.createIndex(index.name, index.keyPath, { unique: index.unique });
          });
        }

        // Create media items store
        if (!db.objectStoreNames.contains(STORES.MEDIA_ITEMS)) {
          const mediaStore = db.createObjectStore(STORES.MEDIA_ITEMS, {
            keyPath: schema.mediaItems.keyPath
          });
          schema.mediaItems.indexes.forEach(index => {
            mediaStore.createIndex(index.name, index.keyPath, { unique: index.unique });
          });
        }

        // Create AI configs store
        if (!db.objectStoreNames.contains(STORES.AI_CONFIGS)) {
          const aiConfigStore = db.createObjectStore(STORES.AI_CONFIGS, {
            keyPath: schema.aiConfigs.keyPath
          });
          schema.aiConfigs.indexes.forEach(index => {
            aiConfigStore.createIndex(index.name, index.keyPath, { unique: index.unique });
          });
        }
      };
    });
  }

  /**
   * Generic add method
   */
  async add(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Generic get method
   */
  async get(storeName, id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Generic getAll method
   */
  async getAll(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Generic update method
   */
  async update(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Generic delete method
   */
  async delete(storeName, id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Query by index
   */
  async getByIndex(storeName, indexName, value) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Category-specific methods
  async addCategory(category) {
    return this.add(STORES.CATEGORIES, category);
  }

  async getCategory(id) {
    return this.get(STORES.CATEGORIES, id);
  }

  async getAllCategories() {
    return this.getAll(STORES.CATEGORIES);
  }

  async updateCategory(category) {
    return this.update(STORES.CATEGORIES, category);
  }

  async deleteCategory(id) {
    return this.delete(STORES.CATEGORIES, id);
  }

  // Media item-specific methods
  async addMediaItem(item) {
    return this.add(STORES.MEDIA_ITEMS, item);
  }

  async getMediaItem(id) {
    return this.get(STORES.MEDIA_ITEMS, id);
  }

  async getAllMediaItems() {
    return this.getAll(STORES.MEDIA_ITEMS);
  }

  async getMediaItemsByCategory(categoryId) {
    return this.getByIndex(STORES.MEDIA_ITEMS, 'categoryId', categoryId);
  }

  async updateMediaItem(item) {
    return this.update(STORES.MEDIA_ITEMS, item);
  }

  async deleteMediaItem(id) {
    return this.delete(STORES.MEDIA_ITEMS, id);
  }

  // AI config-specific methods
  async addAIConfig(config) {
    return this.add(STORES.AI_CONFIGS, config);
  }

  async getAIConfig(id) {
    return this.get(STORES.AI_CONFIGS, id);
  }

  async getAllAIConfigs() {
    return this.getAll(STORES.AI_CONFIGS);
  }

  async getActiveAIConfig() {
    const configs = await this.getByIndex(STORES.AI_CONFIGS, 'isActive', true);
    return configs.length > 0 ? configs[0] : null;
  }

  async updateAIConfig(config) {
    return this.update(STORES.AI_CONFIGS, config);
  }

  async deleteAIConfig(id) {
    return this.delete(STORES.AI_CONFIGS, id);
  }

  /**
   * Clear all data (for testing or reset)
   */
  async clearAll() {
    const stores = [STORES.CATEGORIES, STORES.MEDIA_ITEMS, STORES.AI_CONFIGS];
    for (const storeName of stores) {
      await new Promise((resolve, reject) => {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  }
}

export default IndexedDBManager;
