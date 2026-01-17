/**
 * Database Schema - Defines the structure for IndexedDB
 */

const DB_NAME = 'DatasetManagerDB';
const DB_VERSION = 1;

const STORES = {
  CATEGORIES: 'categories',
  MEDIA_ITEMS: 'mediaItems',
  AI_CONFIGS: 'aiConfigs'
};

/**
 * Database schema definition
 */
const schema = {
  categories: {
    keyPath: 'id',
    indexes: [
      { name: 'name', keyPath: 'name', unique: true },
      { name: 'createdAt', keyPath: 'createdAt', unique: false }
    ]
  },
  mediaItems: {
    keyPath: 'id',
    indexes: [
      { name: 'categoryId', keyPath: 'categoryId', unique: false },
      { name: 'type', keyPath: 'type', unique: false },
      { name: 'createdAt', keyPath: 'createdAt', unique: false },
      { name: 'fileName', keyPath: 'fileName', unique: false }
    ]
  },
  aiConfigs: {
    keyPath: 'id',
    indexes: [
      { name: 'name', keyPath: 'name', unique: true },
      { name: 'isActive', keyPath: 'isActive', unique: false }
    ]
  }
};

export { DB_NAME, DB_VERSION, STORES, schema };
