# APK闪退问题修复报告 v2

## 问题描述
APK虽然打包成功，但是安装后打开会闪退。

---

## 第二次诊断发现的问题 (2026/1/11)

### 1. main.dart 异步初始化顺序问题
**问题**: `runZonedGuarded` 中调用异步函数 `_runApp()` 时没有正确等待，导致初始化顺序混乱。

**修复**: 
- 将 `WidgetsFlutterBinding.ensureInitialized()` 移到 `runZonedGuarded` 之前
- 在 `main()` 中预先打开 Hive settings box
- 简化初始化流程，确保顺序执行

```dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  FlutterError.onError = ...;
  
  runZonedGuarded(() async {
    await _initializeApp();  // 初始化Hive并打开box
    runApp(const SecureDatasetApp());
  }, ...);
}
```

### 2. AppState 与 Hive Box 竞争条件
**问题**: `AppState` 在构造函数中尝试打开 Hive box，但此时 box 可能尚未在 main.dart 中打开完成，导致竞争条件。

**修复**: 
- `main.dart` 中预先打开 settings box
- `AppState._loadData()` 中优先使用已打开的 box，而不是重新打开
- 添加更多防护性检查

```dart
// 获取已经在main.dart中打开的Hive box
if (Hive.isBoxOpen('settings')) {
  _settingsBox = Hive.box('settings');
} else {
  _settingsBox = await Hive.openBox('settings');
}
```

### 3. LockScreen 生物识别初始化时机
**问题**: `_checkBiometrics()` 在 `initState()` 中直接调用，可能在 widget 完全构建之前执行异步操作。

**修复**: 使用 `addPostFrameCallback` 延迟执行生物识别检查，并添加多层 try-catch 防护。

```dart
@override
void initState() {
  super.initState();
  WidgetsBinding.instance.addPostFrameCallback((_) {
    _checkBiometrics();
  });
}
```

---

## 之前的修复 (保留)

### 4. 缺少 `path` 依赖包 ✅ 已修复
### 5. ProGuard混淆规则完善 ✅ 已修复
### 6. 代码混淆已禁用 ✅ 已修复

---

## 修改的文件

1. `lib/main.dart` - 修复异步初始化顺序
2. `lib/providers/app_state.dart` - 修复Hive box竞争条件
3. `lib/screens/lock_screen.dart` - 修复生物识别初始化时机

---

## 下一步

提交代码到GitHub，触发Actions重新构建APK。
