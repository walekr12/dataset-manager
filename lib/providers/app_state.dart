import 'package:flutter/material.dart';
import '../models/category.dart';
import '../models/media_item.dart';
import '../models/settings.dart';
import '../services/storage_service.dart';
import '../services/encryption_service.dart';

class AppState extends ChangeNotifier {
  bool _isUnlocked = false;
  String _pin = '123456';
  List<Category> _categories = [];
  Category? _currentCategory;
  MediaItem? _currentMedia;
  List<MediaItem> _mediaItems = [];
  AppSettings _settings = AppSettings();
  DateTime? _lastBackup;
  
  // Getters
  bool get isUnlocked => _isUnlocked;
  String get pin => _pin;
  List<Category> get categories => _categories;
  Category? get currentCategory => _currentCategory;
  MediaItem? get currentMedia => _currentMedia;
  List<MediaItem> get mediaItems => _mediaItems;
  AppSettings get settings => _settings;
  DateTime? get lastBackup => _lastBackup;
  
  AppState() {
    _loadData();
  }
  
  Future<void> _loadData() async {
    // 从本地存储加载数据
    _pin = await StorageService.getPin() ?? '123456';
    _categories = await StorageService.getCategories();
    _settings = await StorageService.getSettings();
    _lastBackup = await StorageService.getLastBackupDate();
    notifyListeners();
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
  
  Future<void> changePin(String newPin) async {
    _pin = newPin;
    await StorageService.savePin(newPin);
    notifyListeners();
  }
  
  // 类别管理
  Future<void> addCategory(String name) async {
    final category = Category(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      name: name,
      createdAt: DateTime.now(),
    );
    _categories.add(category);
    await StorageService.saveCategories(_categories);
    notifyListeners();
  }
  
  Future<void> deleteCategory(String id) async {
    _categories.removeWhere((c) => c.id == id);
    await StorageService.saveCategories(_categories);
    // 同时删除该类别下的所有媒体文件
    await StorageService.deleteMediaByCategory(id);
    notifyListeners();
  }
  
  void setCurrentCategory(Category category) {
    _currentCategory = category;
    _loadMediaItems(category.id);
    notifyListeners();
  }
  
  // 媒体管理
  Future<void> _loadMediaItems(String categoryId) async {
    _mediaItems = await StorageService.getMediaItems(categoryId);
    notifyListeners();
  }
  
  void setCurrentMedia(MediaItem media) {
    _currentMedia = media;
    notifyListeners();
  }
  
  Future<void> addMediaItem(MediaItem item) async {
    _mediaItems.insert(0, item);
    await StorageService.saveMediaItem(item);
    
    // 更新类别计数
    if (_currentCategory != null) {
      final index = _categories.indexWhere((c) => c.id == _currentCategory!.id);
      if (index != -1) {
        if (item.type == MediaType.image) {
          _categories[index].imageCount++;
        } else {
          _categories[index].videoCount++;
        }
        await StorageService.saveCategories(_categories);
      }
    }
    notifyListeners();
  }
  
  Future<void> deleteMediaItem(String id) async {
    final item = _mediaItems.firstWhere((m) => m.id == id);
    _mediaItems.removeWhere((m) => m.id == id);
    await StorageService.deleteMediaItem(id);
    
    // 更新类别计数
    if (_currentCategory != null) {
      final index = _categories.indexWhere((c) => c.id == _currentCategory!.id);
      if (index != -1) {
        if (item.type == MediaType.image) {
          _categories[index].imageCount--;
        } else {
          _categories[index].videoCount--;
        }
        await StorageService.saveCategories(_categories);
      }
    }
    notifyListeners();
  }
  
  Future<void> updateMediaTag(String id, String tag) async {
    final index = _mediaItems.indexWhere((m) => m.id == id);
    if (index != -1) {
      _mediaItems[index].tag = tag;
      _mediaItems[index].isTagged = true;
      await StorageService.saveMediaItem(_mediaItems[index]);
      
      // 更新类别打标计数
      if (_currentCategory != null) {
        final catIndex = _categories.indexWhere((c) => c.id == _currentCategory!.id);
        if (catIndex != -1) {
          _categories[catIndex].taggedCount++;
          await StorageService.saveCategories(_categories);
        }
      }
    }
    notifyListeners();
  }
  
  // 设置管理
  Future<void> updateSettings(AppSettings newSettings) async {
    _settings = newSettings;
    await StorageService.saveSettings(newSettings);
    notifyListeners();
  }
  
  // 备份管理
  Future<void> updateLastBackup() async {
    _lastBackup = DateTime.now();
    await StorageService.saveLastBackupDate(_lastBackup!);
    notifyListeners();
  }
  
  bool shouldShowBackupReminder() {
    if (_settings.backupReminderDays == 0) return false;
    if (_lastBackup == null) return true;
    
    final daysSinceBackup = DateTime.now().difference(_lastBackup!).inDays;
    return daysSinceBackup >= _settings.backupReminderDays;
  }
}
