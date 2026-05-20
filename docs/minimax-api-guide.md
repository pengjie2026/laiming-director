# 籁鸣导演 — MiniMax API 集成指南

## 概述

籁鸣导演平台使用 **Cloudflare Worker** 作为 API 代理层，前端通过 `fetch()` 调用 Worker，Worker 再转发到 MiniMax API。这样做有两个好处：

1. **CORS 问题**：浏览器直接调用 MiniMax API 会遇到跨域限制，Worker 解决
2. **API Key 安全**：MiniMax Token 不暴露在前端代码中

## 快速部署

### 第一步：进入 AI 功能目录

```bash
cd /Users/pengjie/WorkBuddy/2026-05-15-task-11/laiming-director/ai-features
```

### 第二步：登录 Cloudflare

```bash
wrangler login
# 浏览器会自动打开，按提示授权
```

### 第三步：设置 API Key Secret

```bash
wrangler secret put MINIMAX_API_KEY
# 粘贴 MiniMax API Key 后回车
```

**MiniMax Token Plan API Key 示例：**
```
sk-api-8nLy5uA1JRaYlF9xTtU3O8JKCA3qovzlsCbtrg8SoaTbpgzFFGOq-jt-TR6gkzI684WDHzdgbLueoU8W7IfhXIPGgfeSL1q6FuUuNJ73k9Q3v7xOkM9Fn2s
```

### 第四步：部署 Worker

```bash
wrangler deploy
```

部署成功后会输出 Worker URL，例如：
```
https://laiming-director-ai.你的账号.workers.dev
```

### 第五步：更新前端配置

打开 `scripts/main.js`，将 `API_CONFIG.workerUrl` 替换为你的 Worker URL：

```javascript
const API_CONFIG = {
  workerUrl: 'https://laiming-director-ai.your-subdomain.workers.dev',  // ← 替换这里
};
```

---

## API 端点说明

部署后，所有端点均通过 `https://你的-worker-地址.workers.dev/端点` 访问。

| 端点 | 方法 | 功能 | MiniMax 模型 |
|------|------|------|-------------|
| `/health` | GET | 健康检测 | — |
| `/version` | GET | 版本信息 | — |
| `/script` | POST | 剧本生成 | `MiniMax-M2.7-highspeed` |
| `/storyboard` | POST | 分镜规划 | `MiniMax-M2.7-highspeed` |
| `/image` | POST | 图像生成 | `image-01` |
| `/video` | POST | 视频生成 | `video-01` |
| `/review` | POST | 内容审核 | `MiniMax-M2.7-highspeed` |
| `/tts` | POST | TTS 配音 | `speech-2.8-hd` |

---

## 请求示例

### 剧本生成 `/script`

```bash
curl -X POST https://你的地址.workers.dev/script \
  -H "Content-Type: application/json" \
  -d '{"theme": "小兔子寻找彩虹花", "ageGroup": "3-6"}'
```

### 图像生成 `/image`

```bash
curl -X POST https://你的地址.workers.dev/image \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Q版可爱小兔子在森林里", "count": 4, "style": "cartoon"}'
```

### TTS 配音 `/tts`

```bash
curl -X POST https://你的地址.workers.dev/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "从前有一只可爱的小兔子住在森林边的小木屋里", "voice_id": "Chinese (Mandarin)_Lyrical_Voice"}'
```

### 健康检测

```bash
curl https://你的地址.workers.dev/health
# 返回: {"status":"ok","service":"laiming-director-ai","version":"1.0.0"}
```

---

## 前端调用方式

前端通过 `apiCall(endpoint, body)` 函数调用：

```javascript
// scripts/main.js 中
async function generateScript() {
  const result = await apiCall('/script', {
    theme: '小兔子寻找彩虹花',
    ageGroup: '3-6'
  });
  // result 包含 MiniMax 返回的数据
}
```

---

## 常见问题

### Q: 部署后显示 "API 错误"？

检查：
1. `wrangler secret put MINIMAX_API_KEY` 是否执行成功
2. `API_CONFIG.workerUrl` 是否填写正确
3. Worker 是否已启用（访问 `/health` 测试）

### Q: 剧本生成返回空白？

MiniMax M2.7 返回格式可能为 `choices[0].messages[0].content`，已在 Worker 中处理。如仍有问题，打开浏览器控制台查看返回的原始 JSON。

### Q: TTS 返回的是文本不是音频？

TTS 端点正确时会直接返回 `audio/mpeg` 二进制流。如返回 JSON，检查 `voice_id` 是否在允许列表中。

### Q: Token Plan 额度用完？

MiniMax Token Plan 有使用限制。当前 Worker 未实现用量统计，需登录 MiniMax 仪表盘查看。

---

## 文件结构

```
laiming-director/
├── ai-features/
│   ├── worker.js          # Cloudflare Worker 主代码
│   └── wrangler.toml      # Worker 配置
├── scripts/
│   └── main.js            # 前端逻辑（含 API_CONFIG）
├── index.html             # 主页面
├── docs/
│   ├── product-specification.md   # 产品方案
│   └── minimax-api-guide.md       # 本文档
└── README.md
```

---

## 版本历史

| 版本 | 日期 | 更新内容 |
|------|------|---------|
| 1.0.0 | 2026-05-19 | 初始版本，支持剧本/分镜/生图/视频/审核/TTS 六大功能 |
