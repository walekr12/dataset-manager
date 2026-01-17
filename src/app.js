/**
 * Main Application - Dataset Manager
 * Integrates all components and manages application state
 */

import KeyManager from './crypto/keyManager.js';
import Encryption from './crypto/encryption.js';
import IndexedDBManager from './db/indexedDB.js';
import FileHandler from './utils/fileHandler.js';
import GridView from './ui/grid.js';
import CategoryManager from './ui/categoryManager.js';
import ModalManager from './ui/modal.js';
import SettingsManager from './ui/settings.js';
import AIAPIClient from './ai/apiClient.js';
import TagProcessor from './ai/tagProcessor.js';

class App {
  constructor() {
    this.keyManager = new KeyManager();
    this.encryption = null;
    this.db = new IndexedDBManager();
    this.fileHandler = null;
    this.gridView = null;
    this.categoryManager = null;
    this.modalManager = new ModalManager();
    this.settingsManager = null;
    this.aiClient = null;
    this.tagProcessor = null;

    this.isLocked = true;
    this.currentMediaItem = null;
  }

  /**
   * Initialize application
   */
  async init() {
    try {
      // Check if password is set
      const isPasswordSet = this.keyManager.isPasswordSet();

      if (isPasswordSet) {
        this.showLoginModal();
      } else {
        this.showSetupModal();
      }
    } catch (error) {
      console.error('Initialization error:', error);
      alert('应用初始化失败: ' + error.message);
    }
  }

  /**
   * Show password setup modal
   */
  showSetupModal() {
    const modal = document.getElementById('passwordModal');
    const title = document.getElementById('passwordModalTitle');
    const desc = document.getElementById('passwordModalDesc');
    const confirmInput = document.getElementById('passwordConfirmInput');
    const submitBtn = document.getElementById('passwordSubmitBtn');

    title.textContent = '设置主密码';
    desc.textContent = '请设置一个强密码来保护您的数据集';
    confirmInput.style.display = 'block';
    submitBtn.textContent = '设置密码';

    modal.classList.add('active');

    submitBtn.onclick = () => this.handlePasswordSetup();
  }

  /**
   * Show login modal
   */
  showLoginModal() {
    const modal = document.getElementById('passwordModal');
    const title = document.getElementById('passwordModalTitle');
    const desc = document.getElementById('passwordModalDesc');
    const confirmInput = document.getElementById('passwordConfirmInput');
    const submitBtn = document.getElementById('passwordSubmitBtn');

    title.textContent = '解锁应用';
    desc.textContent = '请输入主密码以解锁应用';
    confirmInput.style.display = 'none';
    submitBtn.textContent = '解锁';

    modal.classList.add('active');

    submitBtn.onclick = () => this.handlePasswordLogin();
  }

  /**
   * Handle password setup
   */
  async handlePasswordSetup() {
    const passwordInput = document.getElementById('passwordInput');
    const confirmInput = document.getElementById('passwordConfirmInput');
    const errorDiv = document.getElementById('passwordError');

    const password = passwordInput.value;
    const confirm = confirmInput.value;

    // Validate
    if (!password || password.length < 8) {
      errorDiv.textContent = '密码至少需要8个字符';
      return;
    }

    if (password !== confirm) {
      errorDiv.textContent = '两次输入的密码不一致';
      return;
    }

    try {
      errorDiv.textContent = '';
      await this.keyManager.setupPassword(password);
      await this.unlockApplication(password);

      // Close modal
      document.getElementById('passwordModal').classList.remove('active');
      passwordInput.value = '';
      confirmInput.value = '';
    } catch (error) {
      errorDiv.textContent = '设置失败: ' + error.message;
      console.error('Password setup error:', error);
    }
  }

  /**
   * Handle password login
   */
  async handlePasswordLogin() {
    const passwordInput = document.getElementById('passwordInput');
    const errorDiv = document.getElementById('passwordError');

    const password = passwordInput.value;

    if (!password) {
      errorDiv.textContent = '请输入密码';
      return;
    }

    try {
      errorDiv.textContent = '';
      const isValid = await this.keyManager.verifyPassword(password);

      if (!isValid) {
        errorDiv.textContent = '密码错误';
        return;
      }

      await this.unlockApplication(password);

      // Close modal
      document.getElementById('passwordModal').classList.remove('active');
      passwordInput.value = '';
    } catch (error) {
      errorDiv.textContent = '解锁失败: ' + error.message;
      console.error('Login error:', error);
    }
  }

  /**
   * Unlock application and initialize components
   */
  async unlockApplication(password) {
    try {
      this.modalManager.showLoading('初始化应用...');

      // Derive key
      await this.keyManager.deriveKey(password);

      // Initialize encryption
      this.encryption = new Encryption(this.keyManager);

      // Initialize database
      await this.db.init();

      // Initialize components
      this.fileHandler = new FileHandler(this.encryption, this.db);
      this.gridView = new GridView(this.fileHandler);
      this.categoryManager = new CategoryManager(this.db);
      this.aiClient = new AIAPIClient(this.encryption);
      this.tagProcessor = new TagProcessor(this.aiClient, this.fileHandler, this.db);
      this.settingsManager = new SettingsManager(
        this.aiClient,
        this.db,
        this.encryption,
        this.modalManager
      );

      // Load AI config
      await this.aiClient.loadConfig(this.db);

      // Load settings
      await this.settingsManager.loadSettings();

      // Load categories
      await this.categoryManager.loadCategories();

      // Load media items
      await this.loadMediaItems();

      // Setup event handlers
      this.setupEventHandlers();

      // Show app
      document.getElementById('app').style.display = 'flex';
      this.isLocked = false;

      this.modalManager.hideLoading();
    } catch (error) {
      this.modalManager.hideLoading();
      throw error;
    }
  }

  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    // Import files button
    document.getElementById('importBtn').addEventListener('click', () => {
      this.importFiles();
    });

    // Settings button
    document.getElementById('settingsBtn').addEventListener('click', () => {
      this.modalManager.open('settingsModal');
    });

    // Lock button
    document.getElementById('lockBtn').addEventListener('click', () => {
      this.lockApplication();
    });

    // Category change
    this.categoryManager.onCategoryChange = (categoryId) => {
      this.filterByCategory(categoryId);
    };

    // Grid item click
    this.gridView.onItemClick = (item) => {
      this.showMediaDetail(item);
    };

    // AI batch tag button
    document.getElementById('aiBatchTagBtn').addEventListener('click', () => {
      this.batchTagItems();
    });

    // Batch delete button
    document.getElementById('batchDeleteBtn').addEventListener('click', () => {
      this.batchDeleteItems();
    });

    // Media detail modal buttons
    document.getElementById('aiTagThisBtn').addEventListener('click', () => {
      this.tagCurrentItem();
    });

    document.getElementById('deleteThisBtn').addEventListener('click', () => {
      this.deleteCurrentItem();
    });

    // File input change
    document.getElementById('fileInput').addEventListener('change', (e) => {
      this.handleFileSelect(e.target.files);
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'i') {
          e.preventDefault();
          this.importFiles();
        } else if (e.key === 'l') {
          e.preventDefault();
          this.lockApplication();
        }
      }
    });
  }

  /**
   * Load media items
   */
  async loadMediaItems() {
    try {
      const items = await this.db.getAllMediaItems();
      await this.gridView.render(items);
      await this.categoryManager.refreshCounts();
    } catch (error) {
      console.error('Failed to load media items:', error);
      this.modalManager.alert('加载数据失败: ' + error.message, 'error');
    }
  }

  /**
   * Import files
   */
  importFiles() {
    const fileInput = document.getElementById('fileInput');
    fileInput.click();
  }

  /**
   * Handle file selection
   */
  async handleFileSelect(files) {
    if (!files || files.length === 0) return;

    const categoryId = this.categoryManager.getActiveCategory();
    const targetCategory = categoryId === 'all' ? 'uncategorized' : categoryId;

    const progress = this.modalManager.showProgress({
      title: '导入文件',
      message: '正在导入文件...'
    });

    try {
      const results = await this.fileHandler.importFiles(
        files,
        targetCategory,
        (current, total, fileName) => {
          progress.update(current, total, `正在处理: ${fileName}`);
        }
      );

      progress.close();

      // Show results
      const successCount = results.filter(r => r.success).length;
      const failedCount = results.filter(r => !r.success).length;

      let message = `成功导入 ${successCount} 个文件`;
      if (failedCount > 0) {
        message += `，${failedCount} 个失败`;
      }

      this.modalManager.alert(message, failedCount > 0 ? 'error' : 'success');

      // Reload grid
      await this.loadMediaItems();

      // Clear file input
      document.getElementById('fileInput').value = '';
    } catch (error) {
      progress.close();
      this.modalManager.alert('导入失败: ' + error.message, 'error');
      console.error('Import error:', error);
    }
  }

  /**
   * Filter by category
   */
  async filterByCategory(categoryId) {
    try {
      let items;
      if (categoryId === 'all') {
        items = await this.db.getAllMediaItems();
      } else {
        items = await this.db.getMediaItemsByCategory(categoryId);
      }
      await this.gridView.render(items);
    } catch (error) {
      console.error('Failed to filter items:', error);
    }
  }

  /**
   * Show media detail modal
   */
  async showMediaDetail(item) {
    this.currentMediaItem = item;

    const modal = document.getElementById('mediaDetailModal');
    const title = document.getElementById('mediaDetailTitle');
    const image = document.getElementById('mediaDetailImage');
    const video = document.getElementById('mediaDetailVideo');

    title.textContent = item.fileName;

    // Load media
    try {
      const url = await this.fileHandler.getDecryptedFile(item);

      if (item.type === 'image') {
        image.src = url;
        image.style.display = 'block';
        video.style.display = 'none';
      } else {
        video.src = url;
        video.style.display = 'block';
        image.style.display = 'none';
      }

      // Fill in details
      document.getElementById('detailFileName').textContent = item.fileName;
      document.getElementById('detailResolution').textContent = `${item.width} × ${item.height}`;
      document.getElementById('detailFileSize').textContent = this.fileHandler.formatFileSize(item.fileSize);
      document.getElementById('detailCreatedAt').textContent = this.fileHandler.formatDate(item.createdAt);

      // Show tags
      const tagsContainer = document.getElementById('detailAITags');
      tagsContainer.innerHTML = '';

      if (item.aiTags && item.aiTags.length > 0) {
        item.aiTags.forEach(tag => {
          const tagSpan = document.createElement('span');
          tagSpan.className = 'tag';
          tagSpan.textContent = tag;
          tagsContainer.appendChild(tagSpan);
        });
      } else {
        tagsContainer.innerHTML = '<span class="no-tags">暂无标签</span>';
      }

      this.modalManager.open('mediaDetailModal');
    } catch (error) {
      console.error('Failed to load media:', error);
      this.modalManager.alert('加载失败: ' + error.message, 'error');
    }
  }

  /**
   * Tag current item
   */
  async tagCurrentItem() {
    if (!this.currentMediaItem) return;

    try {
      this.modalManager.showLoading('AI打标中...');

      const result = await this.tagProcessor.tagItem(this.currentMediaItem);

      this.modalManager.hideLoading();

      if (result.success) {
        this.modalManager.alert('打标成功！', 'success');
        this.currentMediaItem = result.item;
        await this.showMediaDetail(result.item);
        await this.gridView.updateItem(result.item);
      } else {
        this.modalManager.alert('打标失败: ' + result.error, 'error');
      }
    } catch (error) {
      this.modalManager.hideLoading();
      this.modalManager.alert('打标失败: ' + error.message, 'error');
    }
  }

  /**
   * Delete current item
   */
  async deleteCurrentItem() {
    if (!this.currentMediaItem) return;

    const confirmed = await this.modalManager.confirm({
      title: '删除文件',
      message: '确定要删除此文件吗？此操作不可恢复。',
      icon: '🗑️'
    });

    if (!confirmed) return;

    try {
      await this.db.deleteMediaItem(this.currentMediaItem.id);
      this.modalManager.close('mediaDetailModal');
      this.gridView.removeItem(this.currentMediaItem.id);
      await this.categoryManager.refreshCounts();
      this.currentMediaItem = null;
      this.modalManager.alert('文件已删除', 'success');
    } catch (error) {
      this.modalManager.alert('删除失败: ' + error.message, 'error');
    }
  }

  /**
   * Batch tag items
   */
  async batchTagItems() {
    const categoryId = this.categoryManager.getActiveCategory();
    const untaggedItems = await this.tagProcessor.getUntaggedItems(categoryId);

    if (untaggedItems.length === 0) {
      this.modalManager.alert('当前类别没有未打标的文件', 'info');
      return;
    }

    const confirmed = await this.modalManager.confirm({
      title: 'AI批量打标',
      message: `将对 ${untaggedItems.length} 个未打标的文件进行AI打标，确认继续？`,
      icon: '🏷️'
    });

    if (!confirmed) return;

    const progress = this.modalManager.showProgress({
      title: 'AI批量打标',
      message: '正在进行AI打标...'
    });

    try {
      const results = await this.tagProcessor.batchTag(
        untaggedItems,
        (current, total, item) => {
          progress.update(current, total, `正在打标: ${item.fileName}`);
        }
      );

      progress.close();

      this.modalManager.alert(
        `打标完成！成功: ${results.success}，失败: ${results.failed}`,
        results.failed > 0 ? 'error' : 'success'
      );

      await this.loadMediaItems();
    } catch (error) {
      progress.close();
      this.modalManager.alert('批量打标失败: ' + error.message, 'error');
    }
  }

  /**
   * Batch delete items
   */
  async batchDeleteItems() {
    const selectedItems = this.gridView.getSelectedItems();

    if (selectedItems.length === 0) {
      this.modalManager.alert('请先选择要删除的文件（按住Ctrl点击选择）', 'info');
      return;
    }

    const confirmed = await this.modalManager.confirm({
      title: '批量删除',
      message: `确定要删除选中的 ${selectedItems.length} 个文件吗？此操作不可恢复。`,
      icon: '🗑️'
    });

    if (!confirmed) return;

    try {
      this.modalManager.showLoading(`删除中...`);

      for (const item of selectedItems) {
        await this.db.deleteMediaItem(item.id);
        this.gridView.removeItem(item.id);
      }

      this.modalManager.hideLoading();
      this.gridView.clearSelection();
      await this.categoryManager.refreshCounts();

      this.modalManager.alert(`成功删除 ${selectedItems.length} 个文件`, 'success');
    } catch (error) {
      this.modalManager.hideLoading();
      this.modalManager.alert('批量删除失败: ' + error.message, 'error');
    }
  }

  /**
   * Lock application
   */
  lockApplication() {
    this.keyManager.lock();
    this.isLocked = true;

    // Hide app
    document.getElementById('app').style.display = 'none';

    // Show login modal
    this.showLoginModal();

    // Clear sensitive data
    this.currentMediaItem = null;
    this.gridView.clearSelection();
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});

export default App;
