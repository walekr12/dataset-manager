/**
 * Video Processor - Handles video file processing and thumbnail generation
 */

class VideoProcessor {
  constructor() {
    this.maxThumbnailSize = 400;
    this.thumbnailQuality = 0.7;
    this.keyframeTime = 1; // Extract frame at 1 second
  }

  /**
   * Set thumbnail quality (0.1 - 1.0)
   */
  setThumbnailQuality(quality) {
    this.thumbnailQuality = Math.max(0.1, Math.min(1.0, quality));
  }

  /**
   * Extract metadata from video file
   * @param {File} file - Video file
   * @returns {Promise<Object>} - { width, height, duration, size, type }
   */
  async extractMetadata(file) {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const url = URL.createObjectURL(file);

      video.preload = 'metadata';

      video.onloadedmetadata = () => {
        const metadata = {
          width: video.videoWidth,
          height: video.videoHeight,
          duration: video.duration,
          size: file.size,
          type: file.type,
          fileName: file.name
        };
        URL.revokeObjectURL(url);
        resolve(metadata);
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load video metadata'));
      };

      video.src = url;
    });
  }

  /**
   * Generate thumbnail from video
   * @param {File} file - Video file
   * @returns {Promise<Blob>} - Thumbnail blob
   */
  async generateThumbnail(file) {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const url = URL.createObjectURL(file);

      video.preload = 'metadata';
      video.muted = true;

      video.onloadedmetadata = () => {
        // Seek to keyframe time or 10% of duration
        const seekTime = Math.min(this.keyframeTime, video.duration * 0.1);
        video.currentTime = seekTime;
      };

      video.onseeked = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          // Calculate thumbnail dimensions
          let { width, height } = this.calculateThumbnailSize(
            video.videoWidth,
            video.videoHeight
          );

          canvas.width = width;
          canvas.height = height;

          // Draw video frame to canvas
          ctx.drawImage(video, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              URL.revokeObjectURL(url);
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to generate video thumbnail'));
              }
            },
            'image/jpeg',
            this.thumbnailQuality
          );
        } catch (error) {
          URL.revokeObjectURL(url);
          reject(error);
        }
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load video'));
      };

      video.src = url;
    });
  }

  /**
   * Calculate thumbnail dimensions maintaining aspect ratio
   */
  calculateThumbnailSize(width, height) {
    const maxSize = this.maxThumbnailSize;

    if (width <= maxSize && height <= maxSize) {
      return { width, height };
    }

    const ratio = width / height;

    if (width > height) {
      return {
        width: maxSize,
        height: Math.round(maxSize / ratio)
      };
    } else {
      return {
        width: Math.round(maxSize * ratio),
        height: maxSize
      };
    }
  }

  /**
   * Extract frame for AI analysis
   * @param {File|Blob} file - Video file or blob
   * @param {number} timeInSeconds - Time to extract frame (default 1s)
   * @returns {Promise<string>} - Base64 encoded frame
   */
  async extractFrameForAI(file, timeInSeconds = 1) {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const url = URL.createObjectURL(file);

      video.preload = 'metadata';
      video.muted = true;

      video.onloadedmetadata = () => {
        const seekTime = Math.min(timeInSeconds, video.duration * 0.1);
        video.currentTime = seekTime;
      };

      video.onseeked = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          // Use reasonable size for AI processing
          let width = video.videoWidth;
          let height = video.videoHeight;
          const maxSize = 2048;

          if (width > maxSize || height > maxSize) {
            const ratio = width / height;
            if (width > height) {
              width = maxSize;
              height = Math.round(maxSize / ratio);
            } else {
              height = maxSize;
              width = Math.round(maxSize * ratio);
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(video, 0, 0, width, height);

          const base64 = canvas.toDataURL('image/jpeg', 0.9);
          URL.revokeObjectURL(url);
          resolve(base64);
        } catch (error) {
          URL.revokeObjectURL(url);
          reject(error);
        }
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load video'));
      };

      video.src = url;
    });
  }

  /**
   * Validate video file
   * @param {File} file - File to validate
   * @returns {boolean} - True if valid video
   */
  isValidVideo(file) {
    const validTypes = [
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/quicktime',
      'video/x-msvideo',
      'video/x-matroska'
    ];
    return validTypes.includes(file.type);
  }

  /**
   * Format duration for display
   * @param {number} seconds - Duration in seconds
   * @returns {string} - Formatted duration string (HH:MM:SS or MM:SS)
   */
  formatDuration(seconds) {
    if (!seconds || isNaN(seconds)) return '00:00';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    } else {
      return `${minutes}:${String(secs).padStart(2, '0')}`;
    }
  }

  /**
   * Format file size for display
   * @param {number} bytes - File size in bytes
   * @returns {string} - Formatted size string
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}

export default VideoProcessor;
