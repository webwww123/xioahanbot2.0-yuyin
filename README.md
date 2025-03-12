# 粉色少女心语音聊天前端

一个极简现代、优雅的交互式语音聊天前端，采用粉色系设计风格，充满少女心的UI界面，集成了最新的Google Gemini AI模型。

## 项目特点

- 💕 粉色系少女心设计风格
- 🎨 极简现代的UI界面
- 🔊 中央语音按钮，按住说话
- ⌨️ 支持文字输入功能
- ✨ 丰富的动画效果和交互
- 💬 消息气泡优雅淡入淡出和打字效果
- 🌈 精美的装饰元素和背景
- 💖 流畅的变形动画和粒子效果
- 🤖 集成Google Gemini AI模型的聊天功能
- 🔌 自定义Deno Deploy API代理

## 技术栈

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Framer Motion
- Google Gemini API
- Deno Deploy (后端API代理)
- 百度语音识别API

## 功能介绍

1. **语音输入**：按住中央的粉色按钮进行语音输入，自动调用百度语音识别API
2. **文字输入**：点击按钮右下角的聊天图标，按钮优雅变形为文字输入框
3. **AI对话**：通过Google Gemini AI模型提供智能对话能力
4. **消息显示**：
   - 消息以气泡形式在上方优雅显示
   - 支持打字机效果，逐字显示AI回复
   - 消息气泡会随着内容动态调整大小
5. **精美动画**：
   - 按钮反馈动画和波纹效果
   - 消息气泡平滑过渡动画
   - 背景装饰动画和心形效果
   - 文本框变形动画
   - 心形和粒子特效

## API集成

### Gemini AI集成

项目通过自定义的Deno Deploy服务集成了Google Gemini API，包括：

- 支持gemini-2.0-pro-exp-02-05等最新模型
- 兼容OpenAI API格式的请求和响应
- 支持聊天完成、嵌入向量等功能
- 内置跨域(CORS)解决方案
- 错误处理和日志记录
- 智能请求重试和限速处理

### 语音识别集成

集成了百度语音识别API：

- 支持中文语音识别
- 实时录音和转写
- 错误恢复和重试机制

## 如何使用

1. 克隆本仓库
2. 安装依赖：`npm install`
3. 开发模式运行：`npm run dev`
4. 访问 `http://localhost:3002` 或 `http://localhost:3000`

## API调试工具

项目内置了专业的API调试工具：

- 位于 `/api-debug` 路径
- 支持测试不同的Gemini API端点
- 查看请求和响应详情
- 内置错误处理和友好提示
- 支持直接打开API链接
- 模型快速切换功能

## 组件结构

- **VoiceChat**: 主要组件，集成所有功能
- **VoiceButton**: 中央语音按钮，包含变形文本输入功能
- **MessagesArea**: 消息显示区域，支持动态调整和自动滚动
- **MessageBubble**: 单个消息气泡，支持打字效果和动态大小调整
- **Decorations**: 装饰元素组件

## 优化特性

### 1. 性能优化

- 使用React.memo减少不必要的重渲染
- 优化Framer Motion动画性能
- 消息气泡使用ResizeObserver监控大小变化
- 硬件加速动画效果
- 减少布局抖动

### 2. 用户体验优化

- 消息逐字打字显示，增强互动感
- 根据文本长度自动调整打字速度
- 打字过程中消息气泡平滑扩展
- 自动滚动确保始终显示最新消息
- 录音按钮提供清晰的视觉反馈

### 3. API可靠性

- 实现了API请求失败的自动重试机制
- 添加了双重请求策略（fetch和XMLHttpRequest）
- 解决了跨域请求问题
- 完善的错误处理和用户友好的错误提示
- 智能处理API限速（429错误）
- 自适应重试间隔

## Deno Deploy部署方案

本项目使用Deno Deploy作为后端服务，Deno Deploy是一个全球分布式的无服务器JavaScript应用平台，代码在靠近用户的服务器上运行，提供低延迟和快速响应时间。我们的Gemini API代理服务通过Deno Deploy部署，以下是完整操作指南：

### 1. 安装Deno和deployctl

首先，安装Deno运行时和deployctl工具：

```bash
# 安装Deno
# Windows
irm https://deno.land/install.ps1 | iex

# macOS/Linux
curl -fsSL https://deno.land/install.sh | sh

# 安装deployctl
deno install -A jsr:@deno/deployctl --global
```

### 2. 部署步骤

我们的API代理服务部署流程：

```bash
# 进入Deno部署代码目录
cd src/deno_deploy

# 部署到生产环境
deployctl deploy --project=pink-chat-api --prod main.ts
```

### 3. 现有部署

项目当前的API代理服务已部署在以下端点：

- **基础URL**: `https://pink-chat-api.deno.dev`
- **端点列表**:
  - 模型列表: `https://pink-chat-api.deno.dev/v1/models?key=YOUR_API_KEY`
  - 聊天完成: `https://pink-chat-api.deno.dev/v1/chat/completions`
  - 嵌入向量: `https://pink-chat-api.deno.dev/v1/embeddings`

### 4. 监控与调试

Deno Deploy提供了多种监控和调试工具：

```bash
# 列出项目所有部署
deployctl deployments list --project=pink-chat-api

# 查看实时日志
deployctl logs --project=pink-chat-api
```

另外，还可以通过Deno Deploy的仪表板查看详细的部署状态、日志和性能指标。

### 5. 环境变量与自定义域名

如需配置环境变量或设置自定义域名，可通过Deno Deploy仪表板进行设置，或使用deployctl命令：

```bash
# 设置环境变量
deployctl variables set --project=pink-chat-api KEY=value

# 获取环境变量列表
deployctl variables list --project=pink-chat-api
```

### 6. 资源和限制

Deno Deploy提供了不同的定价层级，从免费层到企业级，本项目目前使用免费层级，每天有10万请求的限额。如需更高的配额，可以升级到付费计划。

### 7. 错误处理与限速

Gemini API有请求频率限制，我们的代理服务实现了：

- **自动重试机制**：遇到限速（429）错误时，自动等待并重试
- **指数退避算法**：每次重试间隔逐渐增加
- **友好错误提示**：向客户端返回详细的错误信息
- **完整日志记录**：记录所有请求和错误信息以便调试

### 8. 最新更新 (2025年3月11日)

- 修复了Deno Deploy兼容性问题
- 优化了Buffer导入方式
- 简化了服务器启动代码
- 添加了智能请求重试逻辑
- 增强了错误处理，特别是对429错误的处理
- 实现了指数退避算法优化重试间隔

更多详情请参考[Deno Deploy官方文档](https://docs.deno.com/deploy/manual/)。

## 自定义配置

- 可在`tailwind.config.js`中调整颜色配置
- 打字速度和效果可在`MessageBubble.tsx`中调整
- API配置可在`VoiceChatContext.tsx`中修改
- 动画效果和时长可在各组件的Framer Motion配置中调整
- Deno API配置可在`src/deno_deploy/main.ts`中修改

## 后续扩展

- 多模型切换支持
- 历史对话保存
- 图像生成功能
- 语音合成（文字转语音）
- 主题切换功能
- 多语言支持
- 表情和贴纸支持

## 项目状态

**当前版本**: v1.2.1  
**最近更新**: 2025年3月11日

### 最近改进:
- ✅ 修复了Deno API部署问题
- ✅ 添加了API请求重试和智能限速处理
- ✅ 优化了消息气泡的打字效果
- ✅ 修复了消息中第一个字符不显示的问题
- ✅ 改进了长文本的打字速度
- ✅ 解决了消息气泡闪烁问题
- ✅ 优化了聊天区域的布局和限位
- ✅ 更新至最新的gemini-2.0-pro-exp-02-05模型
- ✅ 增强了API请求的可靠性和错误处理

---

✨ **大黄出品** ✨ 