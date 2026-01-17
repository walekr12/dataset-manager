/**
 * Settings Manager - Handles application settings and configuration UI
 */

class SettingsManager {
  constructor(aiClient, db, encryption, modalManager) {
    this.aiClient = aiClient;
    this.db = db;
    this.encryption = encryption;
    this.modalManager = modalManager;

    this.initializeEventListeners();
  }

  /**
   * Initialize event listeners for settings
   */
  initializeEventListeners() {
    // AI Config save button
    document.getElementById('saveAIConfigBtn').addEventListener('click', () => {
      this.saveAIConfig();
    });

    // AI Config test button
    document.getElementById('testAIConnectionBtn').addEventListener('click', () => {
      this.testAIConnection();
    });

    // Thumbnail quality slider
    const qualitySlider = document.getElementById('thumbnailQuality');
    const qualityValue = document.getElementById('thumbnailQualityValue');
    if (qualitySlider && qualityValue) {
      qualitySlider.addEventListener('input', (e) => {
        qualityValue.textContent = e.target.value;
      });
    }

    // Clear all data button
    document.getElementById('clearAllDataBtn').addEventListener('click', () => {
      this.clearAllData();
    });

    // Export data button
    document.getElementById('exportDataBtn').addEventListener('click', () => {
      this.exportData();
    });
  }

  /**
   * Load settings into UI
   */
  async loadSettings() {
    try {
      // Load AI config
      const aiConfig = await this.db.getActiveAIConfig();
      if (aiConfig) {
        document.getElementById('aiApiUrl').value = aiConfig.apiUrl || '';
        document.getElementById('aiModel').value = aiConfig.model || 'gpt-4o';
        document.getElementById('aiDefaultPrompt').value = aiConfig.defaultPrompt || '';

        // Decrypt and show API key
        if (aiConfig.apiKeyEncrypted && aiConfig.apiKeyIv) {
          const apiKey = await this.encryption.decryptString(
            aiConfig.apiKeyEncrypted,
            aiConfig.apiKeyIv
          );
          document.getElementById('aiApiKey').value = apiKey;
        }
      }

      // Load general settings from localStorage
      const autoDelete = localStorage.getItem('autoDeleteOriginal') === 'true';
      const encryptFiles = localStorage.getItem('encryptFiles') !== 'false'; // Default true
      const thumbnailQuality = parseFloat(localStorage.getItem('thumbnailQuality') || '0.7');

      document.getElementById('autoDeleteOriginal').checked = autoDelete;
      document.getElementById('encryptFiles').checked = encryptFiles;
      document.getElementById('thumbnailQuality').value = thumbnailQuality;
      document.getElementById('thumbnailQualityValue').textContent = thumbnailQuality;
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  /**
   * Save AI configuration
   */
  async saveAIConfig() {
    const apiUrl = document.getElementById('aiApiUrl').value.trim();
    const apiKey = document.getElementById('aiApiKey').value.trim();
    const model = document.getElementById('aiModel').value.trim();
    const defaultPrompt = document.getElementById('aiDefaultPrompt').value.trim();

    if (!apiUrl || !apiKey || !model) {
      this.showStatus('aiConfigStatus', '请填写所有必填字段', 'error');
      return;
    }

    try {
      this.modalManager.showLoading('保存配置中...');

      await this.aiClient.saveConfig(this.db, {
        apiUrl: apiUrl,
        apiKey: apiKey,
        model: model,
        defaultPrompt: defaultPrompt,
        name: 'Default Config'
      });

      this.modalManager.hideLoading();
      this.showStatus('aiConfigStatus', '配置已保存！', 'success');
    } catch (error) {
      this.modalManager.hideLoading();
      this.showStatus('aiConfigStatus', '保存失败: ' + error.message, 'error');
      console.error('Failed to save AI config:', error);
    }
  }

  /**
   * Test AI connection
   */
  async testAIConnection() {
    const apiUrl = document.getElementById('aiApiUrl').value.trim();
    const apiKey = document.getElementById('aiApiKey').value.trim();

    if (!apiUrl || !apiKey) {
      this.showStatus('aiConfigStatus', '请先输入 API URL 和 API Key', 'error');
      return;
    }

    try {
      this.modalManager.showLoading('测试连接中...');

      // Temporarily set config for test
      const originalUrl = this.aiClient.apiUrl;
      const originalKey = this.aiClient.apiKey;

      this.aiClient.apiUrl = apiUrl;
      this.aiClient.apiKey = apiKey;

      const result = await this.aiClient.testConnection();

      // Restore original config
      this.aiClient.apiUrl = originalUrl;
      this.aiClient.apiKey = originalKey;

      this.modalManager.hideLoading();

      if (result.success) {
        let message = result.message;
        if (result.models && result.models.length > 0) {
          message += `<br>可用模型: ${result.models.slice(0, 5).join(', ')}`;
          if (result.models.length > 5) {
            message += ` 等 ${result.models.length} 个`;
          }
        }
        this.showStatus('aiConfigStatus', message, 'success');
      } else {
        this.showStatus('aiConfigStatus', result.message, 'error');
      }
    } catch (error) {
      this.modalManager.hideLoading();
      this.showStatus('aiConfigStatus', '测试失败: ' + error.message, 'error');
      console.error('Connection test failed:', error);
    }
  }

  /**
   * Save general settings
   */
  saveGeneralSettings() {
    const autoDelete = document.getElementById('autoDeleteOriginal').checked;
    const encryptFiles = document.getElementById('encryptFiles').checked;
    const thumbnailQuality = document.getElementById('thumbnailQuality').value;

    localStorage.setItem('autoDeleteOriginal', autoDelete.toString());
    localStorage.setItem('encryptFiles', encryptFiles.toString());
    localStorage.setItem('thumbnailQuality', thumbnailQuality);

    this.modalManager.alert('设置已保存', 'success');
  }

  /**
   * Clear all data
   */
  async clearAllData() {
    const confirmed = await this.modalManager.confirm({
      title: '清除所有数据',
      message: '此操作将删除所有类别、媒体文件和AI配置。此操作不可恢复！',
      confirmText: '确认删除',
      cancelText: '取消',
      icon: '🗑️'
    });

    if (!confirmed) return;

    try {
      this.modalManager.showLoading('清除数据中...');
      await this.db.clearAll();
      this.modalManager.hideLoading();

      this.modalManager.alert('所有数据已清除', 'success');

      // Reload page after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      this.modalManager.hideLoading();
      this.modalManager.alert('清除失败: ' + error.message, 'error');
      console.error('Failed to clear data:', error);
    }
  }

  /**
   * Export data (placeholder - could be enhanced)
   */
  async exportData() {
    try {
      this.modalManager.showLoading('准备导出数据...');

      const categories = await this.db.getAllCategories();
      const mediaItems = await this.db.getAllMediaItems();

      // Create export object (without encrypted file data for size reasons)
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        categories: categories,
        mediaItems: mediaItems.map(item => ({
          id: item.id,
          categoryId: item.categoryId,
          type: item.type,
          fileName: item.fileName,
          fileSize: item.fileSize,
          width: item.width,
          height: item.height,
          duration: item.duration,
          aiTags: item.aiTags,
          aiPrompt: item.aiPrompt,
          aiModel: item.aiModel,
          aiResponse: item.aiResponse,
          createdAt: item.createdAt
          // Note: File data is NOT exported for security/size reasons
        }))
      };

      // Download as JSON
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dataset-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);

      this.modalManager.hideLoading();
      this.modalManager.alert('元数据已导出（不包含文件内容）', 'success');
    } catch (error) {
      this.modalManager.hideLoading();
      this.modalManager.alert('导出失败: ' + error.message, 'error');
      console.error('Failed to export data:', error);
    }
  }

  /**
   * Show status message in settings
   * @param {string} elementId - Status element ID
   * @param {string} message - Message to show
   * @param {string} type - Type: 'success', 'error', 'info'
   */
  showStatus(elementId, message, type = 'info') {
    const element = document.getElementById(elementId);
    if (!element) return;

    element.className = `status-message ${type}`;
    element.innerHTML = message;

    // Clear after 5 seconds
    setTimeout(() => {
      element.className = 'status-message';
      element.innerHTML = '';
    }, 5000);
  }

  /**
   * Get setting value
   * @param {string} key - Setting key
   * @param {*} defaultValue - Default value
   * @returns {*} - Setting value
   */
  getSetting(key, defaultValue = null) {
    const value = localStorage.getItem(key);
    if (value === null) return defaultValue;

    // Try to parse as JSON
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  /**
   * Set setting value
   * @param {string} key - Setting key
   * @param {*} value - Setting value
   */
  setSetting(key, value) {
    if (typeof value === 'object') {
      localStorage.setItem(key, JSON.stringify(value));
    } else {
      localStorage.setItem(key, value.toString());
    }
  }
}

export default SettingsManager;
