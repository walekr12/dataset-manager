# Dataset Manager - 加密数据集管理应用

<div align="center">

🔒 一个支持加密存储的图片/视频数据集管理应用，支持分类管理、AI打标、网格预览等功能。

</div>

## ✨ 特性

- 🔐 **端到端加密** - 使用 AES-256-GCM 加密存储所有数据
- 🏷️ **AI 智能打标** - 支持 OpenAI 兼容 API 进行图片/视频内容分析
- 📁 **分类管理** - 灵活的类别组织系统
- 🖼️ **网格预览** - 直观的缩略图网格视图
- 🎬 **视频支持** - 自动提取视频关键帧用于预览和分析
- 💾 **本地存储** - 所有数据存储在浏览器 IndexedDB 中
- 🚀 **纯前端应用** - 无需后端服务器，完全本地运行

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

应用将在 `http://localhost:8080` 启动并自动打开浏览器。

### 生产环境部署

```bash
npm start
```

或者直接使用任何静态文件服务器托管项目根目录。

## 📖 使用指南

### 首次使用

1. **设置主密码**
   - 首次打开应用时，系统会要求设置一个主密码
   - 密码至少 8 个字符，用于加密所有数据
   - ⚠️ **请务必记住密码，遗失后无法恢复数据**

2. **配置 AI 服务**（可选）
   - 点击右上角 "⚙️ 设置" 按钮
   - 在 "AI配置" 标签页填写：
     - API URL（如：`https://api.openai.com/v1`）
     - API Key
     - 模型名称（如：`gpt-4o`）
   - 点击 "测试连接" 验证配置
   - 点击 "保存配置"

### 基本操作

#### 导入文件

1. 点击 "📁 导入文件" 按钮
2. 选择图片或视频文件（支持批量选择）
3. 等待文件加密和导入完成

支持的格式：
- **图片**: JPEG, PNG, GIF, WebP
- **视频**: MP4, WebM, OGG, MOV, AVI, MKV

#### 创建类别

1. 点击侧边栏的 "+" 按钮
2. 输入类别名称和描述
3. 选择标识颜色
4. 点击 "保存"

#### AI 打标

**单个文件打标：**
1. 点击网格中的文件打开详情
2. 点击 "🏷️ AI打标" 按钮
3. 等待 AI 分析完成

**批量打标：**
1. 选择一个类别（或 "全部"）
2. 点击侧边栏的 "🏷️ AI批量打标" 按钮
3. 确认后，系统将自动对所有未打标的文件进行分析

#### 查看和编辑

- **查看详情**: 点击网格中的任意文件
- **批量选择**: 按住 `Ctrl/Cmd` 点击多个文件
- **批量删除**: 选择文件后，点击 "🗑️ 批量删除"

#### 锁定应用

- 点击右上角 "🔒 锁定" 按钮
- 或使用快捷键 `Ctrl/Cmd + L`
- 再次解锁需要输入主密码

## 🏗️ 项目结构

```
datasetmanager/
├── index.html              # 主入口页面
├── package.json            # 项目配置
├── src/
│   ├── app.js             # 主应用逻辑
│   ├── crypto/            # 加密模块
│   │   ├── encryption.js  # 加密/解密功能
│   │   └── keyManager.js  # 密钥管理
│   ├── db/                # 数据库模块
│   │   ├── indexedDB.js   # IndexedDB 操作
│   │   └── schema.js      # 数据结构定义
│   ├── ai/                # AI 模块
│   │   ├── apiClient.js   # AI API 客户端
│   │   └── tagProcessor.js # 标签处理
│   ├── ui/                # UI 组件
│   │   ├── grid.js        # 网格视图
│   │   ├── modal.js       # 模态框管理
│   │   ├── settings.js    # 设置管理
│   │   └── categoryManager.js # 类别管理
│   ├── media/             # 媒体处理
│   │   ├── imageProcessor.js # 图片处理
│   │   └── videoProcessor.js # 视频处理
│   └── utils/
│       └── fileHandler.js # 文件操作工具
└── styles/
    ├── main.css           # 主样式
    ├── grid.css           # 网格样式
    └── modal.css          # 模态框样式
```

## 🔒 安全特性

### 加密方案

- **算法**: AES-256-GCM（Galois/Counter Mode）
- **密钥派生**: PBKDF2 (100,000 次迭代, SHA-256)
- **加密内容**:
  - 原始文件数据
  - 缩略图
  - API Key
- **盐值**: 随机生成并存储在 localStorage

### 数据存储

- **IndexedDB**: 存储加密后的文件和元数据
- **localStorage**: 存储盐值和密码验证数据
- **会话管理**: 锁定后密钥从内存清除

### 隐私保护

- ✅ 所有数据完全本地存储
- ✅ 不上传任何文件到云端
- ✅ AI 分析仅发送图片内容（可选）
- ✅ API Key 加密存储

## ⚙️ 配置选项

### 通用设置

- **导入后自动删除原文件**: 导入完成后提示是否删除源文件
- **加密存储文件内容**: 是否加密存储文件（默认开启）
- **缩略图质量**: 0.1-1.0，控制缩略图压缩质量

### AI 配置

- **API URL**: OpenAI 兼容 API 的端点地址
- **API Key**: API 访问密钥
- **模型名称**: 使用的视觉模型（如 `gpt-4o`, `gpt-4-vision-preview`）
- **默认提示词**: 自定义 AI 分析时使用的提示词

## 🎯 使用场景

- 📸 **摄影作品管理** - 加密存储私密照片，AI 自动生成描述
- 🎬 **视频素材库** - 管理视频片段，快速预览关键帧
- 🎨 **设计资源** - 分类整理设计素材，AI 打标便于搜索
- 🔞 **敏感内容** - 安全存储 NSFW 内容，完全本地加密
- 🤖 **AI 训练数据集** - 准备机器学习数据集，自动标注

## 🔧 技术栈

- **前端框架**: Vanilla JavaScript (ES6 模块)
- **加密**: Web Crypto API
- **数据库**: IndexedDB
- **媒体处理**: Canvas API, HTML5 Video
- **AI 集成**: Fetch API (OpenAI 兼容)
- **样式**: CSS3 (Grid, Flexbox)

## 📝 开发计划

### Phase 1: 基础框架 ✅
- [x] 加密系统
- [x] IndexedDB 存储
- [x] 基础 UI 框架

### Phase 2: 媒体管理 ✅
- [x] 文件导入
- [x] 缩略图生成
- [x] 网格预览
- [x] 类别管理

### Phase 3: AI 打标 ✅
- [x] AI 配置
- [x] 单个打标
- [x] 批量打标

### Phase 4: 增强功能 🚧
- [ ] 标签搜索
- [ ] 导出数据集
- [ ] 数据备份/恢复
- [ ] 批量编辑标签
- [ ] 自定义提示词模板

### Phase 5: 桌面应用 📋
- [ ] Electron 打包
- [ ] 系统托盘集成
- [ ] 更好的文件系统访问

## ⚠️ 注意事项

1. **密码安全**
   - 主密码一旦设置无法找回
   - 建议使用强密码并妥善保管
   - 遗失密码将导致所有数据无法解密

2. **浏览器兼容性**
   - 需要现代浏览器支持：
     - Web Crypto API
     - IndexedDB
     - ES6 Modules
   - 推荐使用 Chrome, Edge, Firefox 最新版本

3. **性能考虑**
   - 大量文件可能影响浏览器性能
   - 建议单次导入不超过 100 个文件
   - 单个文件建议不超过 500MB

4. **AI 使用成本**
   - AI 打标会消耗 API 调用配额
   - 批量打标前请注意成本
   - 建议设置合理的提示词以优化效果

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🔗 相关资源

- [Web Crypto API 文档](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [IndexedDB 指南](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [OpenAI Vision API](https://platform.openai.com/docs/guides/vision)

---

<div align="center">

**⚡ 由 Claude Code 实现**

</div>
