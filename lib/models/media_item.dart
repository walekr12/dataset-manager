import 'package:hive/hive.dart';

part 'media_item.g.dart';

@HiveType(typeId: 1)
enum MediaType {
  @HiveField(0)
  image,
  @HiveField(1)
  video,
}

@HiveType(typeId: 2)
class MediaItem extends HiveObject {
  @HiveField(0)
  final String id;

  @HiveField(1)
  final String categoryId;

  @HiveField(2)
  final String originalPath;

  @HiveField(3)
  final String encryptedPath;

  @HiveField(4)
  final MediaType type;

  @HiveField(5)
  final int width;

  @HiveField(6)
  final int height;

  @HiveField(7)
  String? aiTag;

  @HiveField(8)
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
