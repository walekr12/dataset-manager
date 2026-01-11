import 'package:flutter/material.dart';
import 'package:hive_flutter/hive_flutter.dart';
import '../models/category.dart';
import '../models/media_item.dart';
import '../models/settings.dart';

class AppState extends ChangeNotifier {
  bool _isUnlocked = false;
  String _pin = '123456';
  List<Category> _categories = [];
  Category? _currentCategory;
  MediaItem? _currentMedia;
  List<MediaItem> _mediaItems = [];
  AppSettings _settings = AppSettings();
  DateTime? _lastBackup;
  bool _isLoading = true;
  String? _loadError;
  
  // Hive box
  Box? _settingsBox;
  
  // Getters
  bool get isUnlocked => _isUnlocked;
  String get pin => _pin;
  List<Category> get categories => _categories;
  Category? get currentCategory => _currentCategory;
  MediaItem? get currentMedia => _currentMedia;
  List<MediaItem> get mediaItems => _mediaItems;
  AppSettings get settings => _settings;
  DateTime? get lastBackup => _lastBackup;
  bool get isLoading => _isLoading;
  String? get loadError => _loadError;
  
  AppState() {
    // 使用Future.microtask确保在构造函数完成后再执行异步操作
    Future.microtask(() => _loadData());
  }
  
  Future<void> _loadData() async {
    try {
      _isLoading = true;
      _loadError = null;
      
      // 获取已经在main.dart中打开的Hive box
      try {
        if (Hive.isBoxOpen('settings')) {
          _settingsBox = Hive.box('settings');
          debugPrint('Using already opened settings box');
        } else {
          // 如果box未打开（异常情况），尝试打开它
          _settingsBox = await Hive.openBox('settings');
          debugPrint('Opened settings box in AppState');
        }
      } catch (e) {
        debugPrint('Hive box error: $e');
        // 如果Hive完全失败，使用null并在后续操作中检查
        _settingsBox = null;
      }
      
      // 加载PIN
      _pin = _settingsBox?.get('pin', defaultValue: '123456') ?? '123456';
      
      // 加载设置
      try {
        final savedSettings = _settingsBox?.get('appSettings');
        if (savedSettings != null && savedSettings is Map) {
          _settings = AppSettings(
            apiEndpoint: savedSettings['apiEndpoint'] ?? '',
            apiKey: savedSettings['apiKey'] ?? '',
            customPrompt: savedSettings['customPrompt'] ?? '',
            useBiometric: savedSettings['useBiometric'] ?? false,
            backupReminder: savedSettings['backupReminder'] ?? true,
            backupReminderDays: savedSettings['backupReminderDays'] ?? 7,
          );
        }
      } catch (e) {
        debugPrint('Error loading settings: $e');
      }
      
      // 加载类别
      try {
        final savedCategories = _settingsBox?.get('categories');
        if (savedCategories != null && savedCategories is List) {
          _categories = [];
          for (var c in savedCategories) {
            try {
              if (c is Map) {
                _categories.add(Category(
                  id: c['id']?.toString() ?? '',
                  name: c['name']?.toString() ?? '',
                  createdAt: DateTime.tryParse(c['createdAt']?.toString() ?? '') ?? DateTime.now(),
                  imageCount: (c['imageCount'] as num?)?.toInt() ?? 0,
                  videoCount: (c['videoCount'] as num?)?.toInt() ?? 0,
                  taggedCount: (c['taggedCount'] as num?)?.toInt() ?? 0,
                ));
              }
            } catch (e) {
              debugPrint('Error parsing category: $e');
            }
          }
        }
      } catch (e) {
        debugPrint('Error loading categories: $e');
      }
      
      // 加载媒体项
      try {
        final savedMedia = _settingsBox?.get('mediaItems');
        if (savedMedia != null && savedMedia is List) {
          _mediaItems = [];
          for (var m in savedMedia) {
            try {
              if (m is Map) {
                _mediaItems.add(MediaItem(
                  id: m['id']?.toString() ?? '',
                  categoryId: m['categoryId']?.toString() ?? '',
                  originalPath: m['originalPath']?.toString() ?? '',
                  encryptedPath: m['encryptedPath']?.toString() ?? '',
                  type: m['type'] == 'video' ? MediaType.video : MediaType.image,
                  width: (m['width'] as num?)?.toInt() ?? 0,
                  height: (m['height'] as num?)?.toInt() ?? 0,
                  aiTag: m['aiTag']?.toString(),
                  createdAt: DateTime.tryParse(m['createdAt']?.toString() ?? '') ?? DateTime.now(),
                ));
              }
            } catch (e) {
              debugPrint('Error parsing media item: $e');
            }
          }
        }
      } catch (e) {
        debugPrint('Error loading media items: $e');
      }
      
      // 加载备份日期
      try {
        final backupStr = _settingsBox?.get('lastBackup');
        if (backupStr != null) {
          _lastBackup = DateTime.tryParse(backupStr.toString());
        }
      } catch (e) {
        debugPrint('Error loading backup date: $e');
      }
      
      _isLoading = false;
      notifyListeners();
    } catch (e, s) {
      debugPrint('Error loading data: $e');
      debugPrint('Stack trace: $s');
      _loadError = e.toString();
      _isLoading = false;
      notifyListeners();
    }
  }
  
  // 保存类别到Hive
  Future<void> _saveCategories() async {
    try {
      final categoriesData = _categories.map((c) => {
        'id': c.id,
        'name': c.name,
        'createdAt': c.createdAt.toIso8601String(),
        'imageCount': c.imageCount,
        'videoCount': c.videoCount,
        'taggedCount': c.taggedCount,
      }).toList();
      await _settingsBox?.put('categories', categoriesData);
    } catch (e) {
      debugPrint('Error saving categories: $e');
    }
  }
  
  // 保存媒体项到Hive
  Future<void> _saveMediaItems() async {
    try {
      final mediaData = _mediaItems.map((m) => {
        'id': m.id,
        'categoryId': m.categoryId,
        'originalPath': m.originalPath,
        'encryptedPath': m.encryptedPath,
        'type': m.type == MediaType.video ? 'video' : 'image',
        'width': m.width,
        'height': m.height,
        'aiTag': m.aiTag,
        'createdAt': m.createdAt.toIso8601String(),
      }).toList();
      await _settingsBox?.put('mediaItems', mediaData);
    } catch (e) {
      debugPrint('Error saving media items: $e');
    }
  }
  
  // 保存设置到Hive
  Future<void> _saveSettings() async {
    try {
      await _settingsBox?.put('appSettings', {
        'apiEndpoint': _settings.apiEndpoint,
        'apiKey': _settings.apiKey,
        'customPrompt': _settings.customPrompt,
        'useBiometric': _settings.useBiometric,
        'backupReminder': _settings.backupReminder,
        'backupReminderDays': _settings.backupReminderDays,
      });
    } catch (e) {
      debugPrint('Error saving settings: $e');
    }
  }
  
  // PIN验证
  bool verifyPin(String inputPin) {
    if (inputPin == _pin) {
      _isUnlocked = true;
      notifyListeners();
      return true;
    }
    return false;
  }
  
  void lock() {
    _isUnlocked = false;
    notifyListeners();
  }
  
  // 设置新PIN
  Future<void> setPin(String newPin) async {
    _pin = newPin;
    try {
      await _settingsBox?.put('pin', newPin);
    } catch (e) {
      debugPrint('Error saving PIN: $e');
    }
    notifyListeners();
  }
  
  Future<void> changePin(String newPin) async {
    await setPin(newPin);
  }
  
  // 类别管理
  Future<void> addCategory(String name) async {
    final category = Category(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      name: name,
      createdAt: DateTime.now(),
    );
    _categories.add(category);
    await _saveCategories();
    notifyListeners();
  }
  
  Future<void> renameCategory(String id, String newName) async {
    final index = _categories.indexWhere((c) => c.id == id);
    if (index != -1) {
      _categories[index] = Category(
        id: _categories[index].id,
        name: newName,
        createdAt: _categories[index].createdAt,
        imageCount: _categories[index].imageCount,
        videoCount: _categories[index].videoCount,
        taggedCount: _categories[index].taggedCount,
      );
      await _saveCategories();
      notifyListeners();
    }
  }
  
  Future<void> deleteCategory(String id) async {
    _categories.removeWhere((c) => c.id == id);
    // 同时删除该类别下的所有媒体文件
    _mediaItems.removeWhere((m) => m.categoryId == id);
    await _saveCategories();
    await _saveMediaItems();
    notifyListeners();
  }
  
  void setCurrentCategory(Category category) {
    _currentCategory = category;
    notifyListeners();
  }
  
  // 获取指定类别的媒体项
  List<MediaItem> getMediaItemsByCategory(String categoryId) {
    return _mediaItems.where((m) => m.categoryId == categoryId).toList();
  }
  
  // 媒体管理
  void setCurrentMedia(MediaItem media) {
    _currentMedia = media;
    notifyListeners();
  }
  
  Future<void> addMediaItem({
    required String categoryId,
    required String originalPath,
    required String encryptedPath,
    required MediaType type,
    int width = 0,
    int height = 0,
  }) async {
    final item = MediaItem(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      categoryId: categoryId,
      originalPath: originalPath,
      encryptedPath: encryptedPath,
      type: type,
      width: width,
      height: height,
      createdAt: DateTime.now(),
    );
    
    _mediaItems.insert(0, item);
    
    // 更新类别计数
    final catIndex = _categories.indexWhere((c) => c.id == categoryId);
    if (catIndex != -1) {
      if (type == MediaType.image) {
        _categories[catIndex].imageCount++;
      } else {
        _categories[catIndex].videoCount++;
      }
      await _saveCategories();
    }
    
    await _saveMediaItems();
    notifyListeners();
  }
  
  Future<void> deleteMediaItem(String id) async {
    final itemIndex = _mediaItems.indexWhere((m) => m.id == id);
    if (itemIndex == -1) return;
    
    final item = _mediaItems[itemIndex];
    _mediaItems.removeAt(itemIndex);
    
    // 更新类别计数
    final catIndex = _categories.indexWhere((c) => c.id == item.categoryId);
    if (catIndex != -1) {
      if (item.type == MediaType.image) {
        _categories[catIndex].imageCount--;
      } else {
        _categories[catIndex].videoCount--;
      }
      await _saveCategories();
    }
    
    await _saveMediaItems();
    notifyListeners();
  }
  
  Future<void> updateMediaItemTag(String id, String tag) async {
    final index = _mediaItems.indexWhere((m) => m.id == id);
    if (index != -1) {
      // 创建新的MediaItem替换旧的（因为字段可能是final）
      final oldItem = _mediaItems[index];
      _mediaItems[index] = MediaItem(
        id: oldItem.id,
        categoryId: oldItem.categoryId,
        originalPath: oldItem.originalPath,
        encryptedPath: oldItem.encryptedPath,
        type: oldItem.type,
        width: oldItem.width,
        height: oldItem.height,
        aiTag: tag,
        createdAt: oldItem.createdAt,
      );
      
      // 如果之前没有tag，更新类别打标计数
      if (oldItem.aiTag == null || oldItem.aiTag!.isEmpty) {
        final catIndex = _categories.indexWhere((c) => c.id == oldItem.categoryId);
        if (catIndex != -1) {
          _categories[catIndex].taggedCount++;
          await _saveCategories();
        }
      }
      
      await _saveMediaItems();
      notifyListeners();
    }
  }
  
  // 设置管理 - 支持命名参数
  Future<void> updateSettings({
    String? apiEndpoint,
    String? apiKey,
    String? customPrompt,
    bool? useBiometric,
    bool? backupReminder,
    int? backupReminderDays,
  }) async {
    _settings = AppSettings(
      apiEndpoint: apiEndpoint ?? _settings.apiEndpoint,
      apiKey: apiKey ?? _settings.apiKey,
      customPrompt: customPrompt ?? _settings.customPrompt,
      useBiometric: useBiometric ?? _settings.useBiometric,
      backupReminder: backupReminder ?? _settings.backupReminder,
      backupReminderDays: backupReminderDays ?? _settings.backupReminderDays,
    );
    await _saveSettings();
    notifyListeners();
  }
  
  // 备份管理
  Future<void> updateLastBackup() async {
    _lastBackup = DateTime.now();
    try {
      await _settingsBox?.put('lastBackup', _lastBackup!.toIso8601String());
    } catch (e) {
      debugPrint('Error saving backup date: $e');
    }
    notifyListeners();
  }
  
  bool shouldShowBackupReminder() {
    if (_settings.backupReminderDays == 0) return false;
    if (_lastBackup == null) return true;
    
    final daysSinceBackup = DateTime.now().difference(_lastBackup!).inDays;
    return daysSinceBackup >= _settings.backupReminderDays;
  }
  
  // 清除所有数据
  Future<void> clearAllData() async {
    _categories.clear();
    _mediaItems.clear();
    _settings = AppSettings();
    _lastBackup = null;
    _pin = '123456';
    
    try {
      await _settingsBox?.clear();
      await _settingsBox?.put('pin', '123456');
    } catch (e) {
      debugPrint('Error clearing data: $e');
    }
    
    notifyListeners();
  }
}
