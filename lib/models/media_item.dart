// 媒体类型枚举
enum MediaType {
  image,
  video,
}

// 媒体项模型（无Hive依赖）
class MediaItem {
  final String id;
  final String categoryId;
  final String originalPath;
  final String encryptedPath;
  final MediaType type;
  final int width;
  final int height;
  final String? aiTag;
  final DateTime createdAt;

  MediaItem({
    required this.id,
    required this.categoryId,
    required this.originalPath,
    required this.encryptedPath,
    required this.type,
    this.width = 0,
    this.height = 0,
    this.aiTag,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  MediaItem copyWith({
    String? id,
    String? categoryId,
    String? originalPath,
    String? encryptedPath,
    MediaType? type,
    int? width,
    int? height,
    String? aiTag,
    DateTime? createdAt,
  }) {
    return MediaItem(
      id: id ?? this.id,
      categoryId: categoryId ?? this.categoryId,
      originalPath: originalPath ?? this.originalPath,
      encryptedPath: encryptedPath ?? this.encryptedPath,
      type: type ?? this.type,
      width: width ?? this.width,
      height: height ?? this.height,
      aiTag: aiTag ?? this.aiTag,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
