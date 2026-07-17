# meme-pack Resource Pack API

免费托管的 GitHub Releases 资源包直链下载 API。

## API 端点

| 端点 | 说明 |
|------|------|
| `/` | 首页，列出所有可用端点 |
| `/api/latest` | **直接返回文件**（浏览器访问即下载最新 Release 的第一个资产） |
| `/api/latest/json` | 返回 JSON 元数据（包含所有镜像源直链） |

### 使用示例

**直接下载文件：**
```
GET https://your-worker.workers.dev/api/latest
```
浏览器访问会直接触发下载，也可用于 `<img>`、`<iframe>`、`<a href>` 等。

**获取元数据：**
```
GET https://your-worker.workers.dev/api/latest/json
```

```json
{
  "name": "resource-pack.zip",
  "downloadUrl": "https://github.com/.../releases/download/v1.0/resource-pack.zip",
  "proxyUrls": [
    {"mirror": "https://ghfile.geekertao.top/", "url": "https://ghfile.geekertao.top/..."},
    {"mirror": "https://gh.geekertao.top/", "url": "https://gh.geekertao.top/..."},
    {"mirror": "https://github.dpik.top/", "url": "https://github.dpik.top/..."},
    {"mirror": "https://gh.felicity.ac.cn/", "url": "https://gh.felicity.ac.cn/..."}
  ],
  "size": 1234567,
  "tag": "v1.0"
}
```

## 部署步骤 (Cloudflare Workers 免费托管)

### 方法一：Cloudflare Dashboard (推荐)

1. 注册/登录 [Cloudflare](https://dash.cloudflare.com/sign-up)
2. 进入 **Workers & Pages** → **Create Application** → **Worker**
3. 创建新项目，点击 **Create Worker**
4. 进入编辑模式，粘贴 `worker.js` 的全部内容
5. 确认第一行 `GITHUB_REPO` 是你自己的仓库名
6. 点击 **Deploy**
7. 访问 `https://your-project.workers.dev/api/latest` 测试

### 方法二：Wrangler CLI

```bash
npm install -g wrangler
wrangler login
wrangler deploy
```

## 缓存策略

- 文件和 JSON 响应均缓存 10 分钟，减少 GitHub API 请求
- 多个镜像源自动轮询，第一个失败则尝试下一个

## CORS

已启用跨域请求，可直接在前端使用。
