import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:hive_flutter/hive_flutter.dart';

import 'providers/app_state.dart';
import 'screens/lock_screen.dart';
import 'screens/home_screen.dart';
import 'screens/settings_screen.dart';
import 'theme/app_theme.dart';

void main() async {
  // 确保Flutter绑定在任何异步操作之前初始化
  WidgetsFlutterBinding.ensureInitialized();
  
  // 捕获Flutter框架错误
  FlutterError.onError = (FlutterErrorDetails details) {
    FlutterError.presentError(details);
    debugPrint('FlutterError: ${details.exception}');
  };
  
  // 使用runZonedGuarded捕获所有未处理的异常
  runZonedGuarded(() async {
    await _initializeApp();
    runApp(const SecureDatasetApp());
  }, (error, stackTrace) {
    debugPrint('Uncaught error: $error');
    debugPrint('Stack trace: $stackTrace');
  });
}

Future<void> _initializeApp() async {
  try {
    // 初始化Hive - 必须在runApp之前完成
    await Hive.initFlutter();
    debugPrint('Hive initialized successfully');
    
    // 预先打开settings box，确保后续使用时已经就绪
    if (!Hive.isBoxOpen('settings')) {
      await Hive.openBox('settings');
      debugPrint('Settings box opened successfully');
    }
  } catch (e, s) {
    debugPrint('Hive init error: $e');
    debugPrint('Hive init stack: $s');
    // 即使Hive失败也继续运行应用
  }
  
  // 设置状态栏样式
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.light,
  ));
}

class SecureDatasetApp extends StatelessWidget {
  const SecureDatasetApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => AppState(),
      child: MaterialApp(
        title: 'SecureDataset',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.darkTheme,
        initialRoute: '/lock',
        routes: {
          '/lock': (context) => const LockScreen(),
          '/home': (context) => const HomeScreen(),
          '/settings': (context) => const SettingsScreen(),
        },
      ),
    );
  }
}
