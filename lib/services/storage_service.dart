import 'dart:io';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as path;

/// Service for managing file storage in app's private directory
class StorageService {
  static StorageService? _instance;
  late Directory _appDir;
  late Directory _mediaDir;
  late Directory _tempDir;

  StorageService._();

  static Future<StorageService> getInstance() async {
    if (_instance == null) {
      _instance = StorageService._();
      await _instance!._init();
    }
    return _instance!;
  }

  Future<void> _init() async {
    _appDir = await getApplicationDocumentsDirectory();
    _mediaDir = Directory(path.join(_appDir.path, 'media'));
    _tempDir = Directory(path.join(_appDir.path, 'temp'));

    // Create directories if they don't exist
    if (!await _mediaDir.exists()) {
      await _mediaDir.create(recursive: true);
    }
    if (!await _tempDir.exists()) {
      await _tempDir.create(recursive: true);
    }
  }

  /// Get the media storage directory
  Directory get mediaDirectory => _mediaDir;

  /// Get the temp directory for processing
  Directory get tempDirectory => _tempDir;

  /// Copy a file to the app's private media directory
  /// Returns the path to the copied file
  Future<String> copyToMediaDir(String sourcePath, String categoryId) async {
    final sourceFile = File(sourcePath);
    if (!await sourceFile.exists()) {
      throw Exception('Source file does not exist: $sourcePath');
    }

    // Create category subdirectory
    final categoryDir = Directory(path.join(_mediaDir.path, categoryId));
    if (!await categoryDir.exists()) {
      await categoryDir.create(recursive: true);
    }

    // Generate unique filename
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final extension = path.extension(sourcePath);
    final newFileName = '${timestamp}$extension';
    final destPath = path.join(categoryDir.path, newFileName);

    // Copy file
    await sourceFile.copy(destPath);
    return destPath;
  }

  /// Move a file to the app's private media directory (copy + delete original)
  /// Returns the path to the new file
  Future<String> moveToMediaDir(String sourcePath, String categoryId) async {
    final destPath = await copyToMediaDir(sourcePath, categoryId);
    
    // Delete original file
    final sourceFile = File(sourcePath);
    if (await sourceFile.exists()) {
      await sourceFile.delete();
    }
    
    return destPath;
  }

  /// Delete a media file
  Future<void> deleteMediaFile(String filePath) async {
    final file = File(filePath);
    if (await file.exists()) {
      await file.delete();
    }
  }

  /// Delete all files in a category folder
  Future<void> deleteCategoryFolder(String categoryId) async {
    final categoryDir = Directory(path.join(_mediaDir.path, categoryId));
    if (await categoryDir.exists()) {
      await categoryDir.delete(recursive: true);
    }
  }

  /// Get total size of stored media in bytes
  Future<int> getStorageUsage() async {
    int totalSize = 0;
    
    if (await _mediaDir.exists()) {
      await for (final entity in _mediaDir.list(recursive: true)) {
        if (entity is File) {
          totalSize += await entity.length();
        }
      }
    }
    
    return totalSize;
  }

  /// Format bytes to human readable string
  static String formatBytes(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    if (bytes < 1024 * 1024 * 1024) {
      return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
    }
    return '${(bytes / (1024 * 1024 * 1024)).toStringAsFixed(1)} GB';
  }

  /// Clear temp directory
  Future<void> clearTemp() async {
    if (await _tempDir.exists()) {
      await for (final entity in _tempDir.list()) {
        await entity.delete(recursive: true);
      }
    }
  }

  /// Clear all stored media
  Future<void> clearAllMedia() async {
    if (await _mediaDir.exists()) {
      await _mediaDir.delete(recursive: true);
      await _mediaDir.create(recursive: true);
    }
  }
}
