# Gemini API 代理服务 - Deno部署指南

本项目提供了一个可以部署在Deno Deploy上的Gemini API代理服务，让您可以在不使用梯子的情况下访问Google的Gemini API。

## 功能特点

- 🌐 无需梯子直接访问Gemini API
- 💬 支持聊天对话 (chat/completions)
- 🔍 支持嵌入向量 (embeddings)
- 📋 支持获取模型列表 (models)
- 🔄 兼容OpenAI API格式
- 🌍 CORS支持，允许从任何域名访问

## 部署步骤

### 1. 准备工作

首先，确保您有：

- [GitHub](https://github.com) 账号
- [Deno Deploy](https://dash.deno.com) 账号(可以直接用GitHub账号登录)
- Gemini API 密钥 (从 [Google AI Studio](https://aistudio.google.com) 获取)

### 2. Fork 或上传代码

您有两种方式部署此代码：

#### 方式1: 通过GitHub仓库部署

1. Fork本项目到您的GitHub账号
2. 登录 [Deno Deploy](https://dash.deno.com)
3. 点击 "New Project"
4. 选择 "Deploy from GitHub"
5. 选择您刚才Fork的仓库
6. 配置:
   - 入口文件: `src/deno_deploy/main.ts`
   - 分支: `main` (或您的默认分支)
7. 点击 "Deploy"

#### 方式2: 直接上传文件

1. 登录 [Deno Deploy](https://dash.deno.com)
2. 点击 "New Project"
3. 选择 "Upload Files"
4. 上传 `main.ts` 和其他必要文件
5. 点击 "Deploy"

### 3. 配置环境变量

如果您想默认使用特定的API密钥，可以在Deno Deploy的项目设置中配置环境变量：

- 变量名: `GEMINI_API_KEY`
- 值: 您的Gemini API密钥

### 4. 绑定自定义域名 (可选)

1. 在Deno Deploy项目设置中，找到 "Domains" 部分
2. 点击 "Add Domain"
3. 输入您的域名
4. 按照指引在您的DNS服务商处添加记录

## 使用方法

### API端点

部署完成后，您可以通过以下端点访问Gemini API:

- 聊天对话: `https://您的域名/v1/chat/completions`
- 嵌入向量: `https://您的域名/v1/embeddings`
- 模型列表: `https://您的域名/v1/models`

### 认证

您可以通过以下方式提供API密钥:

1. 在HTTP请求头中添加: `Authorization: Bearer 您的API密钥`
2. 在URL中添加参数: `?key=您的API密钥`

如果您已在环境变量中设置了默认API密钥，可以省略此步骤。

### 示例请求

#### 聊天对话

```bash
curl --location 'https://您的域名/v1/chat/completions' \
--header 'Authorization: Bearer 您的API密钥' \
--header 'Content-Type: application/json' \
--data '{
    "model": "gemini-1.5-pro-latest",
    "messages": [
        {"role": "system", "content": "你是一个有帮助的AI助手"},
        {"role": "user", "content": "你好，请介绍一下自己"}
    ]
}'
```

## 在前端项目中使用

将您的API URL更新为Deno部署的URL即可。例如:

```javascript
const API_URL = 'https://您的域名/v1';

async function chatWithAI(messages) {
  const response = await fetch(`${API_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gemini-1.5-pro-latest',
      messages: messages
    })
  });
  
  return await response.json();
}
```

## 故障排除

- 如果遇到CORS错误，请确认您的前端发送的请求头是否正确
- 如果API调用失败，请检查API密钥是否有效
- 日志可以在Deno Deploy的项目控制台中查看

## 安全注意事项

- 不要在前端代码中硬编码您的API密钥
- 考虑添加速率限制以防止API滥用
- 定期轮换您的API密钥

## 许可证

MIT 