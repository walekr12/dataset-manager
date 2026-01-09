import 'package:hive/hive.dart';

part 'media_item.g.dart';

enum MediaType { image, video }

@HiveType(typeId: 1)
class MediaItem extends HiveObject {
  @HiveField(0)
  final String id;
  
  @HiveField(1)
  final String name;
  
  @HiveField(2)
  final String categoryId;
  
  @HiveField(3)
  final MediaType type;
  
  @HiveField(4)
  final String filePath;
  
  @HiveField(5)
  final String? thumbnailPath;
  
  @HiveField(6)
  final String resolution;
  
  @HiveField(7)
  bool isTagged;
  
  @HiveField(8)
  String? tag;
  
  @HiveField(9)
  final DateTime createdAt;
  
  @HiveField(10)
  final int fileSize;

  MediaItem({
    required this.id,
    required this.name,
    required this.categoryId,
    required this.type,
    required this.filePath,
    this.thumbnailPath,
    required this.resolution,
    this.isTagged = false,
    this.tag,
    required this.createdAt,
    this.fileSize = 0,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'categoryId': categoryId,
    'type': type.index,
    'filePath': filePath,
    'thumbnailPath': thumbnailPath,
    'resolution': resolution,
    'isTagged': isTagged,
    'tag': tag,
    'createdAt': createdAt.toIso8601String(),
    'fileSize': fileSize,
  };

  factory MediaItem.fromJson(Map<String, dynamic> json) => MediaItem(
    id: json['id'],
    name: json['name'],
    categoryId: json['categoryId'],
    type: MediaType.values[json['type']],
    filePath: json['filePath'],
    thumbnailPath: json['thumbnailPath'],
    resolution: json['resolution'],
    isTagged: json['isTagged'] ?? false,
    tag: json['tag'],
    createdAt: DateTime.parse(json['createdAt']),
    fileSize: json['fileSize'] ?? 0,
  );
}
