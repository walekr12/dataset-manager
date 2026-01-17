/**
 * Modal Manager - Handles modal dialogs and UI interactions
 */

class ModalManager {
  constructor() {
    this.modals = {};
    this.initializeModals();
    this.setupEventListeners();
  }

  /**
   * Initialize all modals
   */
  initializeModals() {
    const modalElements = document.querySelectorAll('.modal');
    modalElements.forEach(modal => {
      this.modals[modal.id] = modal;
    });
  }

  /**
   * Setup event listeners for modal controls
   */
  setupEventListeners() {
    // Close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modalId = e.target.dataset.modal;
        if (modalId) {
          this.close(modalId);
        } else {
          // Find parent modal
          const modal = e.target.closest('.modal');
          if (modal) {
            this.close(modal.id);
          }
        }
      });
    });

    // Cancel buttons with data-modal attribute
    document.querySelectorAll('[data-modal]').forEach(btn => {
      if (!btn.classList.contains('modal-close')) {
        btn.addEventListener('click', (e) => {
          const modalId = e.target.dataset.modal;
          if (modalId) {
            this.close(modalId);
          }
        });
      }
    });

    // Click outside to close
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.close(modal.id);
        }
      });
    });

    // ESC key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeTopmost();
      }
    });

    // Tab settings
    this.setupTabSwitching();

    // Password visibility toggle
    this.setupPasswordToggles();
  }

  /**
   * Open a modal
   * @param {string} modalId - Modal ID
   */
  open(modalId) {
    const modal = this.modals[modalId];
    if (modal) {
      modal.classList.add('active');

      // Focus first input
      const firstInput = modal.querySelector('input:not([type="hidden"])');
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
      }
    }
  }

  /**
   * Close a modal
   * @param {string} modalId - Modal ID
   */
  close(modalId) {
    const modal = this.modals[modalId];
    if (modal) {
      modal.classList.remove('active');
    }
  }

  /**
   * Close the topmost (active) modal
   */
  closeTopmost() {
    const activeModals = document.querySelectorAll('.modal.active');
    if (activeModals.length > 0) {
      const topModal = activeModals[activeModals.length - 1];
      this.close(topModal.id);
    }
  }

  /**
   * Setup tab switching in settings modal
   */
  setupTabSwitching() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.dataset.tab;

        // Remove active class from all tabs
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        // Add active class to clicked tab
        btn.classList.add('active');
        const targetContent = document.getElementById(tabId + 'Tab');
        if (targetContent) {
          targetContent.classList.add('active');
        }
      });
    });
  }

  /**
   * Setup password visibility toggles
   */
  setupPasswordToggles() {
    document.querySelectorAll('.toggle-visibility').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.target;
        const input = document.getElementById(targetId);

        if (input) {
          if (input.type === 'password') {
            input.type = 'text';
            btn.textContent = '🙈';
          } else {
            input.type = 'password';
            btn.textContent = '👁️';
          }
        }
      });
    });
  }

  /**
   * Show confirmation dialog
   * @param {Object} options - { title, message, confirmText, cancelText, onConfirm }
   * @returns {Promise<boolean>} - True if confirmed
   */
  confirm(options) {
    return new Promise((resolve) => {
      const {
        title = '确认',
        message = '确定要执行此操作吗？',
        confirmText = '确认',
        cancelText = '取消',
        icon = '⚠️',
        onConfirm = null
      } = options;

      // Create temporary modal
      const modalId = 'confirmModal_' + Date.now();
      const modal = document.createElement('div');
      modal.id = modalId;
      modal.className = 'modal active';
      modal.innerHTML = `
        <div class="modal-content modal-confirm">
          <div class="modal-body">
            <div class="icon warning">${icon}</div>
            <h3>${title}</h3>
            <p>${message}</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary confirm-cancel">${cancelText}</button>
            <button class="btn btn-primary confirm-ok">${confirmText}</button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      const okBtn = modal.querySelector('.confirm-ok');
      const cancelBtn = modal.querySelector('.confirm-cancel');

      const cleanup = () => {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
      };

      okBtn.addEventListener('click', () => {
        cleanup();
        if (onConfirm) onConfirm();
        resolve(true);
      });

      cancelBtn.addEventListener('click', () => {
        cleanup();
        resolve(false);
      });

      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          cleanup();
          resolve(false);
        }
      });
    });
  }

  /**
   * Show loading overlay
   * @param {string} message - Loading message
   */
  showLoading(message = '处理中...') {
    const overlay = document.getElementById('loadingOverlay');
    const text = document.getElementById('loadingText');

    if (overlay && text) {
      text.textContent = message;
      overlay.style.display = 'flex';
    }
  }

  /**
   * Hide loading overlay
   */
  hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
      overlay.style.display = 'none';
    }
  }

  /**
   * Show progress modal
   * @param {Object} options - { title, message, onCancel }
   * @returns {Object} - { update, close } functions
   */
  showProgress(options) {
    const {
      title = '处理中',
      message = '正在处理...',
      onCancel = null
    } = options;

    const modalId = 'progressModal_' + Date.now();
    const modal = document.createElement('div');
    modal.id = modalId;
    modal.className = 'modal active';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>${title}</h2>
        </div>
        <div class="modal-body">
          <p>${message}</p>
          <div class="progress-container">
            <div class="progress-bar-wrapper">
              <div class="progress-bar" style="width: 0%"></div>
            </div>
            <div class="progress-text">0%</div>
          </div>
          <div class="progress-status"></div>
        </div>
        <div class="modal-footer">
          ${onCancel ? '<button class="btn btn-secondary progress-cancel">取消</button>' : ''}
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const progressBar = modal.querySelector('.progress-bar');
    const progressText = modal.querySelector('.progress-text');
    const progressStatus = modal.querySelector('.progress-status');
    const cancelBtn = modal.querySelector('.progress-cancel');

    if (cancelBtn && onCancel) {
      cancelBtn.addEventListener('click', onCancel);
    }

    return {
      update: (current, total, status = '') => {
        const percentage = Math.round((current / total) * 100);
        progressBar.style.width = percentage + '%';
        progressText.textContent = `${percentage}% (${current}/${total})`;

        if (status) {
          const statusItem = document.createElement('div');
          statusItem.className = 'item';
          statusItem.textContent = status;
          progressStatus.appendChild(statusItem);
          progressStatus.scrollTop = progressStatus.scrollHeight;
        }
      },
      close: () => {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
      }
    };
  }

  /**
   * Show alert message
   * @param {string} message - Alert message
   * @param {string} type - Type: 'success', 'error', 'info'
   */
  alert(message, type = 'info') {
    const icons = {
      success: '✓',
      error: '✗',
      info: 'ℹ'
    };

    this.confirm({
      title: type === 'error' ? '错误' : type === 'success' ? '成功' : '提示',
      message: message,
      icon: icons[type] || icons.info,
      confirmText: '确定',
      cancelText: ''
    });
  }
}

export default ModalManager;
