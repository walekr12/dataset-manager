/// Category model for organizing media items
class Category {
  final String id;
  final String name;
  int imageCount;
  int videoCount;
  int taggedCount;
  final DateTime createdAt;

  Category({
    required this.id,
    required this.name,
    this.imageCount = 0,
    this.videoCount = 0,
    this.taggedCount = 0,
    required this.createdAt,
  });

  int get totalCount => imageCount + videoCount;
  
  double get taggedPercent => totalCount == 0 ? 0 : (taggedCount / totalCount) * 100;

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'imageCount': imageCount,
    'videoCount': videoCount,
    'taggedCount': taggedCount,
    'createdAt': createdAt.toIso8601String(),
  };

  factory Category.fromJson(Map<String, dynamic> json) => Category(
    id: json['id'],
    name: json['name'],
    imageCount: json['imageCount'] ?? 0,
    videoCount: json['videoCount'] ?? 0,
    taggedCount: json['taggedCount'] ?? 0,
    createdAt: DateTime.parse(json['createdAt']),
  );
}
