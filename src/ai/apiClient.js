/**
 * AI API Client - Handles communication with OpenAI-compatible APIs
 */

class AIAPIClient {
  constructor(encryption) {
    this.encryption = encryption;
    this.apiUrl = '';
    this.apiKey = '';
    this.model = 'gpt-4o';
    this.defaultPrompt = '请详细描述这张图片/视频帧中的内容，包括主要对象、场景、颜色、氛围和任何值得注意的细节。';
  }

  /**
   * Load AI configuration from database
   * @param {Object} db - Database instance
   */
  async loadConfig(db) {
    try {
      const config = await db.getActiveAIConfig();
      if (config) {
        this.apiUrl = config.apiUrl;
        this.model = config.model;

        // Decrypt API key
        if (config.apiKeyEncrypted && config.apiKeyIv) {
          this.apiKey = await this.encryption.decryptString(
            config.apiKeyEncrypted,
            config.apiKeyIv
          );
        }

        if (config.defaultPrompt) {
          this.defaultPrompt = config.defaultPrompt;
        }
      }
    } catch (error) {
      console.error('Failed to load AI config:', error);
    }
  }

  /**
   * Save AI configuration to database
   * @param {Object} db - Database instance
   * @param {Object} config - Configuration object
   */
  async saveConfig(db, config) {
    try {
      // Encrypt API key
      const { encrypted, iv } = await this.encryption.encryptString(config.apiKey);

      const configData = {
        id: config.id || this.generateUUID(),
        name: config.name || 'Default Config',
        apiUrl: config.apiUrl,
        apiKeyEncrypted: encrypted,
        apiKeyIv: iv,
        model: config.model,
        defaultPrompt: config.defaultPrompt || this.defaultPrompt,
        isActive: true,
        lastTested: Date.now()
      };

      // Deactivate other configs
      const allConfigs = await db.getAllAIConfigs();
      for (const oldConfig of allConfigs) {
        if (oldConfig.id !== configData.id) {
          oldConfig.isActive = false;
          await db.updateAIConfig(oldConfig);
        }
      }

      // Save new config
      const existingConfig = await db.getAIConfig(configData.id);
      if (existingConfig) {
        await db.updateAIConfig(configData);
      } else {
        await db.addAIConfig(configData);
      }

      // Update current instance
      this.apiUrl = config.apiUrl;
      this.apiKey = config.apiKey;
      this.model = config.model;
      this.defaultPrompt = config.defaultPrompt || this.defaultPrompt;

      return configData;
    } catch (error) {
      console.error('Failed to save AI config:', error);
      throw error;
    }
  }

  /**
   * Test API connection
   * @returns {Promise<Object>} - { success: boolean, message: string, models?: Array }
   */
  async testConnection() {
    if (!this.apiUrl || !this.apiKey) {
      return {
        success: false,
        message: '请先配置 API URL 和 API Key'
      };
    }

    try {
      // Try to list models
      const modelsUrl = `${this.apiUrl}/models`;
      const response = await fetch(modelsUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          message: `连接失败: ${response.status} - ${errorData.error?.message || response.statusText}`
        };
      }

      const data = await response.json();
      const models = data.data?.map(m => m.id) || [];

      return {
        success: true,
        message: '连接成功！',
        models: models
      };
    } catch (error) {
      return {
        success: false,
        message: `连接错误: ${error.message}`
      };
    }
  }

  /**
   * Analyze image with AI
   * @param {string} base64Image - Base64 encoded image (with data URI prefix)
   * @param {string} customPrompt - Custom prompt (optional)
   * @returns {Promise<Object>} - { success: boolean, tags: Array, fullResponse: string, error?: string }
   */
  async analyzeImage(base64Image, customPrompt = null) {
    if (!this.apiUrl || !this.apiKey) {
      throw new Error('AI API not configured');
    }

    const prompt = customPrompt || this.defaultPrompt;

    try {
      const response = await fetch(`${this.apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: base64Image
                  }
                }
              ]
            }
          ],
          max_tokens: 500
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API Error: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const fullResponse = data.choices?.[0]?.message?.content || '';

      // Extract tags from response (simple implementation)
      const tags = this.extractTags(fullResponse);

      return {
        success: true,
        tags: tags,
        fullResponse: fullResponse
      };
    } catch (error) {
      console.error('AI analysis failed:', error);
      return {
        success: false,
        tags: [],
        fullResponse: '',
        error: error.message
      };
    }
  }

  /**
   * Extract tags from AI response
   * @param {string} response - AI response text
   * @returns {Array} - Array of tags
   */
  extractTags(response) {
    // Simple tag extraction - split by common delimiters
    // This can be enhanced with better NLP
    const tags = [];

    // Look for comma-separated or line-separated items
    const lines = response.split(/[,\n;]/);

    for (const line of lines) {
      const cleaned = line.trim()
        .replace(/^[-•*]\s*/, '') // Remove bullet points
        .replace(/^\d+\.\s*/, '') // Remove numbered lists
        .substring(0, 50); // Limit tag length

      if (cleaned.length > 2 && cleaned.length < 100) {
        tags.push(cleaned);
      }
    }

    // Limit to first 10 tags
    return tags.slice(0, 10);
  }

  /**
   * Batch analyze images
   * @param {Array} items - Array of { item: mediaItem, base64Image: string }
   * @param {Function} progressCallback - Progress callback (current, total, item)
   * @param {string} customPrompt - Custom prompt (optional)
   * @returns {Promise<Array>} - Array of results
   */
  async batchAnalyze(items, progressCallback = null, customPrompt = null) {
    const results = [];
    const total = items.length;

    for (let i = 0; i < total; i++) {
      const { item, base64Image } = items[i];

      if (progressCallback) {
        progressCallback(i + 1, total, item);
      }

      try {
        const result = await this.analyzeImage(base64Image, customPrompt);
        results.push({
          item: item,
          success: result.success,
          tags: result.tags,
          fullResponse: result.fullResponse,
          error: result.error
        });

        // Add small delay to avoid rate limiting
        await this.delay(1000);
      } catch (error) {
        console.error(`Failed to analyze ${item.fileName}:`, error);
        results.push({
          item: item,
          success: false,
          tags: [],
          fullResponse: '',
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Delay helper
   * @param {number} ms - Milliseconds to delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate UUID v4
   */
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

export default AIAPIClient;
