/**
 * Category Manager - Handles category management UI and operations
 */

class CategoryManager {
  constructor(db) {
    this.db = db;
    this.categoryList = document.getElementById('categoryList');
    this.categoryFilter = document.getElementById('categoryFilter');
    this.newCategoryBtn = document.getElementById('newCategoryBtn');
    this.categoryModal = document.getElementById('categoryModal');
    this.categories = [];
    this.activeCategory = 'all';
    this.onCategoryChange = null;

    this.initializeEventListeners();
  }

  /**
   * Initialize event listeners
   */
  initializeEventListeners() {
    this.newCategoryBtn.addEventListener('click', () => {
      this.showCategoryModal();
    });

    document.getElementById('saveCategoryBtn').addEventListener('click', () => {
      this.saveCategory();
    });
  }

  /**
   * Load and render categories
   */
  async loadCategories() {
    try {
      this.categories = await this.db.getAllCategories();
      this.renderCategories();
      this.updateCategoryFilter();
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }

  /**
   * Render categories in sidebar
   */
  async renderCategories() {
    // Clear existing categories (except "All")
    const existingItems = this.categoryList.querySelectorAll('.category-item:not([data-id="all"])');
    existingItems.forEach(item => item.remove());

    // Get counts for each category
    const allItems = await this.db.getAllMediaItems();
    const counts = this.calculateCategoryCounts(allItems);

    // Update "All" count
    const allItem = this.categoryList.querySelector('[data-id="all"]');
    if (allItem) {
      allItem.querySelector('.category-count').textContent = allItems.length;
    }

    // Render each category
    for (const category of this.categories) {
      const categoryItem = this.createCategoryItem(category, counts[category.id] || 0);
      this.categoryList.appendChild(categoryItem);
    }
  }

  /**
   * Create category item element
   * @param {Object} category - Category object
   * @param {number} count - Number of items in category
   * @returns {HTMLElement} - Category item element
   */
  createCategoryItem(category, count) {
    const li = document.createElement('li');
    li.className = 'category-item';
    li.dataset.id = category.id;

    const icon = document.createElement('span');
    icon.className = 'category-icon';
    icon.textContent = '📁';
    icon.style.color = category.color || '#3498db';

    const name = document.createElement('span');
    name.className = 'category-name';
    name.textContent = category.name;

    const countSpan = document.createElement('span');
    countSpan.className = 'category-count';
    countSpan.textContent = count;

    li.appendChild(icon);
    li.appendChild(name);
    li.appendChild(countSpan);

    // Click handler
    li.addEventListener('click', () => {
      this.setActiveCategory(category.id);
    });

    // Right-click context menu (edit/delete)
    li.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.showCategoryContextMenu(category, e.clientX, e.clientY);
    });

    return li;
  }

  /**
   * Calculate counts for each category
   * @param {Array} items - All media items
   * @returns {Object} - Map of category ID to count
   */
  calculateCategoryCounts(items) {
    const counts = {};
    items.forEach(item => {
      counts[item.categoryId] = (counts[item.categoryId] || 0) + 1;
    });
    return counts;
  }

  /**
   * Set active category
   * @param {string} categoryId - Category ID to activate
   */
  setActiveCategory(categoryId) {
    this.activeCategory = categoryId;

    // Update UI
    this.categoryList.querySelectorAll('.category-item').forEach(item => {
      item.classList.remove('active');
    });

    const activeItem = this.categoryList.querySelector(`[data-id="${categoryId}"]`);
    if (activeItem) {
      activeItem.classList.add('active');
    }

    // Update dropdown
    this.categoryFilter.value = categoryId;

    // Trigger callback
    if (this.onCategoryChange) {
      this.onCategoryChange(categoryId);
    }
  }

  /**
   * Get active category
   * @returns {string} - Active category ID
   */
  getActiveCategory() {
    return this.activeCategory;
  }

  /**
   * Update category filter dropdown
   */
  updateCategoryFilter() {
    // Clear existing options except "All"
    const existingOptions = this.categoryFilter.querySelectorAll('option:not([value="all"])');
    existingOptions.forEach(option => option.remove());

    // Add category options
    this.categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category.id;
      option.textContent = category.name;
      this.categoryFilter.appendChild(option);
    });

    // Add change listener
    this.categoryFilter.addEventListener('change', (e) => {
      this.setActiveCategory(e.target.value);
    });
  }

  /**
   * Show category creation/edit modal
   * @param {Object} category - Category to edit (null for new)
   */
  showCategoryModal(category = null) {
    const modal = this.categoryModal;
    const title = document.getElementById('categoryModalTitle');
    const nameInput = document.getElementById('categoryNameInput');
    const descInput = document.getElementById('categoryDescInput');
    const colorInput = document.getElementById('categoryColorInput');

    if (category) {
      title.textContent = '编辑类别';
      nameInput.value = category.name;
      descInput.value = category.description || '';
      colorInput.value = category.color || '#3498db';
      modal.dataset.editId = category.id;
    } else {
      title.textContent = '新建类别';
      nameInput.value = '';
      descInput.value = '';
      colorInput.value = '#3498db';
      delete modal.dataset.editId;
    }

    modal.classList.add('active');
  }

  /**
   * Save category (create or update)
   */
  async saveCategory() {
    const modal = this.categoryModal;
    const nameInput = document.getElementById('categoryNameInput');
    const descInput = document.getElementById('categoryDescInput');
    const colorInput = document.getElementById('categoryColorInput');

    const name = nameInput.value.trim();
    if (!name) {
      alert('请输入类别名称');
      return;
    }

    const categoryData = {
      name: name,
      description: descInput.value.trim(),
      color: colorInput.value,
      createdAt: Date.now()
    };

    try {
      if (modal.dataset.editId) {
        // Update existing category
        categoryData.id = modal.dataset.editId;
        await this.db.updateCategory(categoryData);
      } else {
        // Create new category
        categoryData.id = this.generateUUID();
        await this.db.addCategory(categoryData);
      }

      // Reload and close
      await this.loadCategories();
      this.closeModal(modal);
    } catch (error) {
      console.error('Failed to save category:', error);
      alert('保存失败: ' + error.message);
    }
  }

  /**
   * Delete category
   * @param {string} categoryId - Category ID to delete
   */
  async deleteCategory(categoryId) {
    if (!confirm('确定要删除此类别吗？该类别下的所有文件将移至未分类。')) {
      return;
    }

    try {
      // Move all items to "all" category or create an "uncategorized" category
      const items = await this.db.getMediaItemsByCategory(categoryId);
      for (const item of items) {
        item.categoryId = 'uncategorized';
        await this.db.updateMediaItem(item);
      }

      // Delete category
      await this.db.deleteCategory(categoryId);

      // Reload
      await this.loadCategories();

      // Switch to "All" if deleted category was active
      if (this.activeCategory === categoryId) {
        this.setActiveCategory('all');
      }
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert('删除失败: ' + error.message);
    }
  }

  /**
   * Show category context menu
   * @param {Object} category - Category object
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  showCategoryContextMenu(category, x, y) {
    // Simple implementation - could be enhanced with a proper context menu component
    const action = confirm('编辑此类别？（取消则删除）');
    if (action) {
      this.showCategoryModal(category);
    } else {
      this.deleteCategory(category.id);
    }
  }

  /**
   * Close modal
   * @param {HTMLElement} modal - Modal element
   */
  closeModal(modal) {
    modal.classList.remove('active');
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
   * Get category by ID
   * @param {string} categoryId - Category ID
   * @returns {Object|null} - Category object or null
   */
  getCategoryById(categoryId) {
    return this.categories.find(cat => cat.id === categoryId) || null;
  }

  /**
   * Refresh category counts
   */
  async refreshCounts() {
    await this.renderCategories();
  }
}

export default CategoryManager;
