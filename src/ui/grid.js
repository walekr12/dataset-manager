/**
 * Grid View - Handles media grid rendering and interactions
 */

class GridView {
  constructor(fileHandler) {
    this.fileHandler = fileHandler;
    this.gridContainer = document.getElementById('gridContainer');
    this.emptyState = document.getElementById('emptyState');
    this.mediaItems = [];
    this.selectedItems = new Set();
    this.onItemClick = null;
  }

  /**
   * Render media items in grid
   * @param {Array} items - Media items to render
   */
  async render(items) {
    this.mediaItems = items;
    this.gridContainer.innerHTML = '';

    if (items.length === 0) {
      this.showEmptyState();
      return;
    }

    this.hideEmptyState();

    // Render each item
    for (const item of items) {
      const gridItem = await this.createGridItem(item);
      this.gridContainer.appendChild(gridItem);
    }
  }

  /**
   * Create a grid item element
   * @param {Object} item - Media item
   * @returns {Promise<HTMLElement>} - Grid item element
   */
  async createGridItem(item) {
    const gridItem = document.createElement('div');
    gridItem.className = 'grid-item';
    gridItem.dataset.id = item.id;

    // Create thumbnail container
    const thumbnailContainer = document.createElement('div');
    thumbnailContainer.className = `grid-item-thumbnail ${item.type}`;

    // Load and display thumbnail
    try {
      const thumbnailUrl = await this.fileHandler.getDecryptedThumbnail(item);
      const img = document.createElement('img');
      img.src = thumbnailUrl;
      img.alt = item.fileName;
      thumbnailContainer.appendChild(img);
    } catch (error) {
      console.error('Failed to load thumbnail:', error);
      thumbnailContainer.innerHTML = '<div style="padding: 2rem; text-align: center; color: #999;">加载失败</div>';
    }

    // Add resolution overlay
    const resolution = document.createElement('div');
    resolution.className = 'grid-item-resolution';
    resolution.textContent = `${item.width}×${item.height}`;
    thumbnailContainer.appendChild(resolution);

    // Add status badges
    const badges = document.createElement('div');
    badges.className = 'grid-item-badges';

    if (item.aiTags && item.aiTags.length > 0) {
      const aiTaggedBadge = document.createElement('span');
      aiTaggedBadge.className = 'badge ai-tagged';
      aiTaggedBadge.innerHTML = '✓ AI已标注';
      badges.appendChild(aiTaggedBadge);
    }

    if (item.type === 'video') {
      const videoBadge = document.createElement('span');
      videoBadge.className = 'badge video';
      videoBadge.innerHTML = '📹 视频';
      badges.appendChild(videoBadge);
    }

    thumbnailContainer.appendChild(badges);

    // Create info footer
    const info = document.createElement('div');
    info.className = 'grid-item-info';

    const fileName = document.createElement('div');
    fileName.className = 'grid-item-filename';
    fileName.textContent = item.fileName;
    fileName.title = item.fileName;

    const meta = document.createElement('div');
    meta.className = 'grid-item-meta';

    const fileSize = document.createElement('span');
    fileSize.textContent = this.fileHandler.formatFileSize(item.fileSize);

    meta.appendChild(fileSize);

    if (item.type === 'video' && item.duration) {
      const duration = document.createElement('span');
      duration.textContent = this.formatDuration(item.duration);
      meta.appendChild(duration);
    }

    info.appendChild(fileName);
    info.appendChild(meta);

    // Assemble grid item
    gridItem.appendChild(thumbnailContainer);
    gridItem.appendChild(info);

    // Add click event
    gridItem.addEventListener('click', (e) => {
      if (e.ctrlKey || e.metaKey) {
        this.toggleSelection(item.id);
      } else {
        if (this.onItemClick) {
          this.onItemClick(item);
        }
      }
    });

    return gridItem;
  }

  /**
   * Toggle item selection
   * @param {string} itemId - Item ID
   */
  toggleSelection(itemId) {
    const gridItem = this.gridContainer.querySelector(`[data-id="${itemId}"]`);
    if (!gridItem) return;

    if (this.selectedItems.has(itemId)) {
      this.selectedItems.delete(itemId);
      gridItem.classList.remove('selected');
    } else {
      this.selectedItems.add(itemId);
      gridItem.classList.add('selected');
    }

    this.updateSelectionInfo();
  }

  /**
   * Clear all selections
   */
  clearSelection() {
    this.selectedItems.clear();
    this.gridContainer.querySelectorAll('.grid-item.selected').forEach(item => {
      item.classList.remove('selected');
    });
    this.updateSelectionInfo();
  }

  /**
   * Get selected items
   * @returns {Array} - Selected media items
   */
  getSelectedItems() {
    return this.mediaItems.filter(item => this.selectedItems.has(item.id));
  }

  /**
   * Update selection info bar
   */
  updateSelectionInfo() {
    // This would update a selection info bar if implemented
    console.log(`${this.selectedItems.size} items selected`);
  }

  /**
   * Show empty state
   */
  showEmptyState() {
    this.gridContainer.style.display = 'none';
    this.emptyState.style.display = 'block';
  }

  /**
   * Hide empty state
   */
  hideEmptyState() {
    this.gridContainer.style.display = 'grid';
    this.emptyState.style.display = 'none';
  }

  /**
   * Add a single item to grid
   * @param {Object} item - Media item to add
   */
  async addItem(item) {
    this.mediaItems.push(item);
    this.hideEmptyState();

    const gridItem = await this.createGridItem(item);
    this.gridContainer.appendChild(gridItem);
  }

  /**
   * Remove item from grid
   * @param {string} itemId - Item ID to remove
   */
  removeItem(itemId) {
    const index = this.mediaItems.findIndex(item => item.id === itemId);
    if (index !== -1) {
      this.mediaItems.splice(index, 1);
    }

    const gridItem = this.gridContainer.querySelector(`[data-id="${itemId}"]`);
    if (gridItem) {
      gridItem.remove();
    }

    this.selectedItems.delete(itemId);

    if (this.mediaItems.length === 0) {
      this.showEmptyState();
    }
  }

  /**
   * Update item in grid
   * @param {Object} updatedItem - Updated media item
   */
  async updateItem(updatedItem) {
    const index = this.mediaItems.findIndex(item => item.id === updatedItem.id);
    if (index !== -1) {
      this.mediaItems[index] = updatedItem;
    }

    const oldGridItem = this.gridContainer.querySelector(`[data-id="${updatedItem.id}"]`);
    if (oldGridItem) {
      const newGridItem = await this.createGridItem(updatedItem);
      oldGridItem.replaceWith(newGridItem);
    }
  }

  /**
   * Format duration for display
   * @param {number} seconds - Duration in seconds
   * @returns {string} - Formatted duration
   */
  formatDuration(seconds) {
    if (!seconds || isNaN(seconds)) return '00:00';

    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${String(secs).padStart(2, '0')}`;
  }

  /**
   * Filter items by category
   * @param {string} categoryId - Category ID ('all' for all items)
   */
  filterByCategory(categoryId) {
    if (categoryId === 'all') {
      this.gridContainer.querySelectorAll('.grid-item').forEach(item => {
        item.style.display = '';
      });
    } else {
      this.mediaItems.forEach(item => {
        const gridItem = this.gridContainer.querySelector(`[data-id="${item.id}"]`);
        if (gridItem) {
          gridItem.style.display = item.categoryId === categoryId ? '' : 'none';
        }
      });
    }
  }
}

export default GridView;
