# Dataset Manager

一个加密的数据集管理应用，用于安全存储和管理图片/视频素材，并支持AI自动打标。

## 功能特性

### 🔒 安全性
- **PIN码锁定** - 4-6位数字PIN保护应用访问
- **生物识别** - 支持指纹/面部识别解锁
- **AES-256加密** - 所有媒体文件使用AES-256加密存储

### 📁 分类管理
- 创建自定义分类（建议使用英文命名）
- 支持重命名和删除分类
- 搜索筛选分类

### 🖼️ 媒体管理
- 导入图片和视频
- 网格预览，显示分辨率信息
- 支持多选批量操作
- 长按进入选择模式

### 🤖 AI打标
- 支持OpenAI兼容API（OpenAI、Claude、本地模型等）
- 自定义提示词
- 批量AI打标
- 手动编辑标签

### 📦 导出功能
- 导出为训练数据集格式的ZIP
- 结构：`images/类别/图片.jpg` + `图片.txt`（标签）
- 包含元数据JSON

### 💾 数据管理
- 导入后可删除原文件（移动到App私有目录）
- 定期备份提醒（可关闭）
- 清除所有数据选项

## 项目结构

```
lib/
├── main.dart                 # 应用入口
├── theme/
│   └── app_theme.dart        # 深色主题定义
├── models/
│   ├── category.dart         # 分类模型
│   ├── media_item.dart       # 媒体项模型
│   └── settings.dart         # 设置模型
├── providers/
│   └── app_state.dart        # 全局状态管理
├── screens/
│   ├── lock_screen.dart      # 锁屏界面
│   ├── home_screen.dart      # 主页（分类列表）
│   ├── category_detail_screen.dart  # 分类详情（媒体网格）
│   ├── image_view_screen.dart       # 图片查看和标签编辑
│   └── settings_screen.dart  # 设置界面
└── services/
    ├── storage_service.dart  # 文件存储服务
    ├── encryption_service.dart  # AES加密服务
    ├── api_service.dart      # AI API调用服务
    └── export_service.dart   # ZIP导出服务
```

## 技术栈

- **Flutter 3.24+** - 跨平台UI框架
- **Provider** - 状态管理
- **Hive** - 本地NoSQL数据库
- **AES-256** - 文件加密
- **Dio** - HTTP客户端

## 构建和运行

### 前置要求
- Flutter SDK 3.24+
- Android SDK (API 24+)

### 本地开发
```bash
# 获取依赖
flutter pub get

# 生成Hive适配器
flutter pub run build_runner build

# 运行应用
flutter run

# 构建APK
flutter build apk --release
```

### GitHub Actions 自动构建

项目配置了GitHub Actions，会在以下情况自动构建：
- Push到`main`分支时自动构建APK
- 推送版本标签（如`v1.0.0`）时自动发布到GitHub Releases

## 导出格式

导出的ZIP文件结构：
```
dataset_[timestamp].zip
├── images/
│   ├── category1/
│   │   ├── image_1.jpg
│   │   ├── image_1.txt    # AI标签
│   │   ├── image_2.png
│   │   └── image_2.txt
│   └── category2/
│       └── ...
├── videos/
│   └── category1/
│       ├── video_1.mp4
│       └── video_1.txt
└── metadata.json          # 元数据
```

## API配置

支持OpenAI兼容格式的API：
- OpenAI (gpt-4-vision-preview)
- Claude (claude-3-sonnet)
- 本地部署模型 (Ollama, vLLM等)

在设置中配置：
- **API Endpoint**: `https://api.openai.com/v1`
- **API Key**: 你的API密钥

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request！
