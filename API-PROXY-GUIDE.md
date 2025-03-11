# Gemini API 本地代理使用指南

## 问题背景

在使用 Gemini API 时，可能会遇到 CORS (跨源资源共享) 问题，导致浏览器无法直接从前端应用访问远程 API。常见错误信息为 `Failed to fetch`。

## 解决方案

我们已经实现了一个本地 API 代理，通过 Next.js 服务器端路由，解决 CORS 问题。这种方法有以下优势：

1. **避免 CORS 错误**：由于请求由服务器端发出，不受浏览器同源策略限制
2. **简化认证**：API 密钥被安全地存储在服务器端
3. **统一错误处理**：可以在服务器端统一处理错误并提供友好的错误信息

## 使用方法

### 1. API 调试工具

API 调试工具已经更新，添加了使用本地代理的选项：

- 访问 `/api-debug` 页面
- 勾选 "使用本地 API 代理 (解决 CORS 问题)" 选项
- 使用工具正常发送请求

本地代理端点会自动添加 API 密钥和正确的请求头，所以您不需要手动配置这些内容。

### 2. 在代码中使用本地代理

以下是在代码中使用本地代理的示例：

```typescript
// 直接使用 fetch API
const response = await fetch('/api/gemini-local/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'gemini-2.0-pro-exp-02-05',
    messages: [
      { role: 'user', content: '你好，请用中文回复' }
    ],
    temperature: 0.7,
    max_tokens: 800,
  }),
});

// 或者使用 deno-client.ts 中的 GeminiClient
import { createGeminiClient } from '@/lib/deno-client';

// 创建客户端时默认使用本地代理
const client = createGeminiClient();

// 发送聊天请求
const response = await client.chat([
  { role: 'user', content: '你好，请用中文回复' }
]);
```

### 3. 可用的本地代理端点

以下是可用的本地代理端点：

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/gemini-local/models` | GET | 获取可用模型列表 |
| `/api/gemini-local/chat/completions` | POST | 发送聊天请求 |

## 本地代理的实现

本地代理的实现位于 `src/app/api/gemini-local/route.ts`，它使用 Next.js 的 API 路由功能，将请求转发到 Deno Deploy 服务。

如果您需要添加更多端点或自定义代理行为，可以修改该文件。

## 故障排除

如果您仍然遇到问题，请检查以下几点：

1. 确保您正在使用正确的端点
2. 检查请求方法是否正确（GET 或 POST）
3. 检查请求体格式是否正确
4. 查看浏览器控制台是否有错误信息
5. 查看 Next.js 服务器端控制台是否有错误信息

如果问题仍然存在，可以尝试使用 API 调试工具进行测试，以便更好地了解错误原因。 