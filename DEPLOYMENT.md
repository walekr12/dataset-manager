# 部署指南

## 🌐 部署方式

### 方式 1: 本地运行（推荐用于开发和个人使用）

#### 步骤：
1. **克隆或下载项目**
   ```bash
   cd datasetmanager
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **启动开发服务器**
   ```bash
   npm run dev
   ```
   应用将在 `http://localhost:8080` 启动

4. **访问应用**
   - 浏览器会自动打开
   - 或手动访问 `http://localhost:8080`

### 方式 2: 静态文件服务器部署

任何静态文件服务器都可以托管此应用。

#### 使用 Python 内置服务器
```bash
cd datasetmanager
python -m http.server 8080
```

#### 使用 Node.js http-server
```bash
npx http-server -p 8080
```

#### 使用 Nginx
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/datasetmanager;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 方式 3: GitHub Pages 部署

1. **创建 GitHub 仓库**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/datasetmanager.git
   git push -u origin main
   ```

2. **配置 GitHub Pages**
   - 进入仓库 Settings
   - 找到 Pages 设置
   - Source 选择 main 分支
   - 保存后等待部署完成

3. **访问**
   - `https://yourusername.github.io/datasetmanager/`

### 方式 4: Vercel 部署

1. **安装 Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **部署**
   ```bash
   cd datasetmanager
   vercel
   ```

3. **按提示完成配置**
   - 项目名称
   - 部署设置
   - 域名配置

### 方式 5: Netlify 部署

1. **拖拽部署**
   - 访问 [Netlify Drop](https://app.netlify.com/drop)
   - 将整个项目文件夹拖拽到页面
   - 等待部署完成

2. **Git 部署**
   - 连接 GitHub 仓库
   - 自动部署

## 🔒 安全建议

### 本地使用
- ✅ **推荐**: 完全安全，数据不离开本地
- 最适合敏感内容管理

### 公网部署
- ⚠️ **注意**:
  - 数据仍存储在用户浏览器本地
  - 建议使用 HTTPS
  - 建议添加基础认证

#### 添加 HTTPS（Nginx 示例）
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    root /path/to/datasetmanager;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

#### 添加基础认证（Nginx 示例）
```nginx
location / {
    auth_basic "Restricted Access";
    auth_basic_user_file /etc/nginx/.htpasswd;
    try_files $uri $uri/ /index.html;
}
```

## 🐳 Docker 部署

### 创建 Dockerfile
```dockerfile
FROM nginx:alpine

COPY . /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 构建镜像
```bash
docker build -t datasetmanager .
```

### 运行容器
```bash
docker run -d -p 8080:80 datasetmanager
```

### 使用 docker-compose
创建 `docker-compose.yml`:
```yaml
version: '3'
services:
  app:
    build: .
    ports:
      - "8080:80"
    restart: unless-stopped
```

运行：
```bash
docker-compose up -d
```

## ☁️ 云平台部署

### AWS S3 + CloudFront
1. 创建 S3 bucket
2. 启用静态网站托管
3. 上传所有文件
4. 配置 CloudFront 分发
5. 设置 HTTPS

### Google Cloud Storage
1. 创建 bucket
2. 设置为公开访问
3. 上传文件
4. 配置自定义域名

### Azure Static Web Apps
1. 连接 GitHub 仓库
2. 自动部署
3. 配置域名和 HTTPS

## 📱 移动端访问

### Progressive Web App (PWA)
添加 `manifest.json` 以支持 PWA：

```json
{
  "name": "Dataset Manager",
  "short_name": "DatasetMgr",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3498db",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

在 `index.html` 中引用：
```html
<link rel="manifest" href="/manifest.json">
```

## 🖥️ Electron 桌面应用（未来）

### 计划中的桌面版本
1. 更好的文件系统访问
2. 系统托盘集成
3. 自动更新
4. 原生性能

### 基础 Electron 配置
```javascript
// main.js
const { app, BrowserWindow } = require('electron');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);
```

## 🔧 环境变量配置

### 可选配置
创建 `.env` 文件（如需要）：
```env
DEFAULT_API_URL=https://api.openai.com/v1
MAX_FILE_SIZE=524288000
THUMBNAIL_QUALITY=0.7
```

## 📊 监控和分析

### 添加简单的使用统计
如果需要跟踪使用情况（完全匿名）：

```javascript
// 在 app.js 中添加
const logEvent = (eventName) => {
  console.log(`Event: ${eventName}, Time: ${new Date().toISOString()}`);
  // 可以发送到自己的分析服务器
};
```

## 🔄 更新和维护

### 版本更新
1. **检查更新**
   - 定期查看 GitHub 仓库
   - 查看 CHANGELOG

2. **更新步骤**
   ```bash
   git pull origin main
   npm install
   npm run dev
   ```

3. **数据迁移**
   - 导出现有数据（如需要）
   - 更新应用
   - 重新导入数据

### 备份建议
- 定期使用"导出数据"功能
- 保存导出的 JSON 文件
- 注意：导出不包含实际文件内容

## 🚨 故障排除

### 部署后无法访问
1. 检查服务器日志
2. 验证端口是否开放
3. 检查防火墙设置
4. 验证文件权限

### 模块加载错误
1. 确保服务器支持 ES6 模块
2. 检查 MIME 类型设置
3. Nginx 需要：
   ```nginx
   types {
       application/javascript js mjs;
   }
   ```

### IndexedDB 错误
1. 清除浏览器数据
2. 检查浏览器版本
3. 确认浏览器支持 IndexedDB

## ✅ 部署检查清单

部署前确认：
- [ ] 所有文件已复制到服务器
- [ ] 服务器支持 HTTPS（推荐）
- [ ] 跨域设置正确（如需要）
- [ ] 文件权限正确
- [ ] 服务器可访问
- [ ] 浏览器兼容性测试通过
- [ ] 应用功能测试通过

部署后验证：
- [ ] 可以访问主页
- [ ] CSS 样式加载正确
- [ ] JavaScript 模块加载成功
- [ ] 可以设置密码
- [ ] 可以导入文件
- [ ] IndexedDB 工作正常
- [ ] AI 配置可保存

---

**享受您的加密数据集管理应用！** 🎉
