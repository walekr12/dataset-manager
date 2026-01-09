import 'dart:io';
import 'package:archive/archive.dart';
import 'package:path/path.dart' as path;
import 'package:path_provider/path_provider.dart';
import '../models/category.dart';
import '../models/media_item.dart';

/// Service for exporting datasets as ZIP files
class ExportService {
  static ExportService? _instance;

  ExportService._();

  static ExportService getInstance() {
    _instance ??= ExportService._();
    return _instance!;
  }

  /// Export dataset to a ZIP file
  /// Returns the path to the created ZIP file
  /// 
  /// Export structure:
  /// dataset.zip
  /// ├── images/
  /// │   ├── category1/
  /// │   │   ├── image1.jpg
  /// │   │   └── image1.txt (AI tag)
  /// │   └── category2/
  /// └── videos/
  ///     └── category1/
  Future<String> exportDataset({
    required List<Category> categories,
    required List<MediaItem> items,
    required String Function(String categoryId) getCategoryName,
    Function(int current, int total, String message)? onProgress,
  }) async {
    final archive = Archive();
    int processedCount = 0;
    final totalCount = items.length;

    // Group items by category and type
    final imagesByCategory = <String, List<MediaItem>>{};
    final videosByCategory = <String, List<MediaItem>>{};

    for (final item in items) {
      if (item.type == MediaType.image) {
        imagesByCategory.putIfAbsent(item.categoryId, () => []);
        imagesByCategory[item.categoryId]!.add(item);
      } else {
        videosByCategory.putIfAbsent(item.categoryId, () => []);
        videosByCategory[item.categoryId]!.add(item);
      }
    }

    // Process images
    for (final categoryId in imagesByCategory.keys) {
      final categoryName = getCategoryName(categoryId);
      final categoryItems = imagesByCategory[categoryId]!;

      for (int i = 0; i < categoryItems.length; i++) {
        final item = categoryItems[i];
        final file = File(item.encryptedPath);

        if (await file.exists()) {
          // Get file extension
          final ext = path.extension(item.originalPath);
          final baseName = 'image_${i + 1}';
          
          // Add image file
          final imageBytes = await file.readAsBytes();
          archive.addFile(ArchiveFile(
            'images/$categoryName/$baseName$ext',
            imageBytes.length,
            imageBytes,
          ));

          // Add tag file if exists
          if (item.aiTag != null && item.aiTag!.isNotEmpty) {
            final tagBytes = item.aiTag!.codeUnits;
            archive.addFile(ArchiveFile(
              'images/$categoryName/$baseName.txt',
              tagBytes.length,
              tagBytes,
            ));
          }
        }

        processedCount++;
        onProgress?.call(processedCount, totalCount, 'Processing images...');
      }
    }

    // Process videos
    for (final categoryId in videosByCategory.keys) {
      final categoryName = getCategoryName(categoryId);
      final categoryItems = videosByCategory[categoryId]!;

      for (int i = 0; i < categoryItems.length; i++) {
        final item = categoryItems[i];
        final file = File(item.encryptedPath);

        if (await file.exists()) {
          // Get file extension
          final ext = path.extension(item.originalPath);
          final baseName = 'video_${i + 1}';
          
          // Add video file
          final videoBytes = await file.readAsBytes();
          archive.addFile(ArchiveFile(
            'videos/$categoryName/$baseName$ext',
            videoBytes.length,
            videoBytes,
          ));

          // Add tag file if exists
          if (item.aiTag != null && item.aiTag!.isNotEmpty) {
            final tagBytes = item.aiTag!.codeUnits;
            archive.addFile(ArchiveFile(
              'videos/$categoryName/$baseName.txt',
              tagBytes.length,
              tagBytes,
            ));
          }
        }

        processedCount++;
        onProgress?.call(processedCount, totalCount, 'Processing videos...');
      }
    }

    // Add metadata file
    final metadata = _generateMetadata(categories, items);
    final metadataBytes = metadata.codeUnits;
    archive.addFile(ArchiveFile(
      'metadata.json',
      metadataBytes.length,
      metadataBytes,
    ));

    // Create ZIP file
    onProgress?.call(totalCount, totalCount, 'Creating ZIP file...');
    
    final encoder = ZipEncoder();
    final zipData = encoder.encode(archive);
    
    if (zipData == null) {
      throw Exception('Failed to create ZIP archive');
    }

    // Save to downloads or documents directory
    final directory = await _getExportDirectory();
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final zipPath = path.join(directory.path, 'dataset_$timestamp.zip');
    
    final zipFile = File(zipPath);
    await zipFile.writeAsBytes(zipData);

    return zipPath;
  }

  /// Export a single category
  Future<String> exportCategory({
    required Category category,
    required List<MediaItem> items,
    Function(int current, int total, String message)? onProgress,
  }) async {
    return exportDataset(
      categories: [category],
      items: items.where((item) => item.categoryId == category.id).toList(),
      getCategoryName: (_) => category.name,
      onProgress: onProgress,
    );
  }

  /// Generate metadata JSON
  String _generateMetadata(List<Category> categories, List<MediaItem> items) {
    final data = {
      'exportDate': DateTime.now().toIso8601String(),
      'totalCategories': categories.length,
      'totalItems': items.length,
      'categories': categories.map((c) => {
        'id': c.id,
        'name': c.name,
        'itemCount': items.where((i) => i.categoryId == c.id).length,
      }).toList(),
      'stats': {
        'images': items.where((i) => i.type == MediaType.image).length,
        'videos': items.where((i) => i.type == MediaType.video).length,
        'tagged': items.where((i) => i.aiTag != null && i.aiTag!.isNotEmpty).length,
      },
    };
    
    // Simple JSON encoding without dart:convert for cleaner output
    return _jsonEncode(data);
  }

  String _jsonEncode(dynamic data, [int indent = 0]) {
    final spaces = '  ' * indent;
    final nextSpaces = '  ' * (indent + 1);
    
    if (data == null) return 'null';
    if (data is bool) return data.toString();
    if (data is num) return data.toString();
    if (data is String) return '"${data.replaceAll('"', '\\"')}"';
    
    if (data is List) {
      if (data.isEmpty) return '[]';
      final items = data.map((e) => '$nextSpaces${_jsonEncode(e, indent + 1)}').join(',\n');
      return '[\n$items\n$spaces]';
    }
    
    if (data is Map) {
      if (data.isEmpty) return '{}';
      final items = data.entries.map((e) => 
        '$nextSpaces"${e.key}": ${_jsonEncode(e.value, indent + 1)}'
      ).join(',\n');
      return '{\n$items\n$spaces}';
    }
    
    return data.toString();
  }

  /// Get the directory for exporting files
  Future<Directory> _getExportDirectory() async {
    Directory? directory;
    
    if (Platform.isAndroid) {
      // Try external storage first
      directory = await getExternalStorageDirectory();
      if (directory != null) {
        // Navigate to Downloads folder
        final downloadsPath = directory.path.replaceAll(
          RegExp(r'/Android/data/[^/]+/files'),
          '/Download',
        );
        directory = Directory(downloadsPath);
        if (!await directory.exists()) {
          await directory.create(recursive: true);
        }
        return directory;
      }
    }
    
    // Fallback to documents directory
    directory = await getApplicationDocumentsDirectory();
    final exportDir = Directory(path.join(directory.path, 'exports'));
    if (!await exportDir.exists()) {
      await exportDir.create(recursive: true);
    }
    return exportDir;
  }

  /// Get the size of a potential export
  Future<int> estimateExportSize(List<MediaItem> items) async {
    int totalSize = 0;
    
    for (final item in items) {
      final file = File(item.encryptedPath);
      if (await file.exists()) {
        totalSize += await file.length();
      }
      // Add estimated size for tag files
      if (item.aiTag != null) {
        totalSize += item.aiTag!.length;
      }
    }
    
    return totalSize;
  }
}
