# meme-pack Resource Pack API

免费托管的 GitHub Releases 资源包下载链接 API。

## API 端点

| 端点 | 说明 |
|------|------|
| `/` | 首页，列出所有可用端点 |
| `/api/latest` | 获取最新 Release 的下载直链 |
| `/api/releases` | 获取所有 Release 列表 |

### 示例响应 (`/api/latest`)

```json
{
  "name": "resource-pack.zip",
  "downloadUrl": "https://github.com/FrostReverie093/meme-pack/releases/download/v1.0/resource-pack.zip",
  "size": 1234567,
  "createdAt": "2026-07-17T12:00:00Z",
  "publishedAt": "2026-07-17T12:00:00Z",
  "tag": "v1.0",
  "prerelease": false
}
```

## 部署步骤 (Cloudflare Workers 免费托管)

### 方法一：Cloudflare Dashboard (推荐)

1. 注册/登录 [Cloudflare](https://dash.cloudflare.com/sign-up)
2. 进入 **Workers & Pages** → **Create Application** → **Worker** → **Start using Projects**
3. 创建新项目（如 `meme-pack-api`）
4. 点击 **Create Worker**
5. 进入编辑模式，将 `worker.js` 的内容粘贴进去
6. 修改第一行的 `GITHUB_REPO` 为你的实际仓库名（如果不同）
7. 点击 **Deploy**
8. 访问 `https://your-project.workers.dev/api/latest` 测试

### 方法二：Wrangler CLI (本地部署)

```bash
# 安装 Wrangler
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 初始化项目
wrangler init meme-pack-api

# 将 worker.js 内容复制到 src/index.ts 或 worker.js

# 部署
wrangler deploy
```

### 自定义域名 (可选)

在 Cloudflare Dashboard → Workers → 你的 Worker → **Triggers** → **Custom Domains** 添加自定义域名。

## 缓存策略

- 默认缓存 10 分钟
- 修改 `CACHE_TTL` 变量调整缓存时间
- 清除缓存：Dashboard → **Environment Variables** → 修改值触发重新部署

## CORS

已启用跨域请求，可直接在前端 JavaScript 中调用。
