# Deno Deploy 部署指南

本文档提供了将Deno应用部署到Deno Deploy平台的完整指南，包括环境设置、项目准备和部署步骤。

## 1. 安装Deno运行时

### Windows (PowerShell)
```powershell
irm https://deno.land/install.ps1 | iex
```

### macOS / Linux
```bash
curl -fsSL https://deno.land/install.sh | sh
```

### 设置环境变量
Windows (PowerShell):
```powershell
$env:PATH += ";$env:USERPROFILE\.deno\bin"
```

macOS / Linux:
```bash
echo 'export PATH="$HOME/.deno/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

### 验证安装
```bash
deno --version
```

## 2. 安装deployctl工具

```bash
deno install -A -f jsr:@deno/deployctl --global
```

### 验证安装
```bash
deployctl --version
```

## 3. 准备项目文件

确保您的项目结构如下：

```
my-deno-app/
├── main.ts        # 主入口文件
├── deno.json      # 可选配置文件
└── README.md      # 文档
```

## 4. 创建基本配置文件

创建`deno.json`：

```bash
echo '{
  "tasks": {
    "start": "deno run --allow-net --allow-read main.ts"
  }
}' > deno.json
```

## 5. 本地测试

```bash
# 进入项目目录
cd my-deno-app

# 使用deno任务运行
deno task start

# 或直接运行
deno run --allow-net --allow-read main.ts
```

## 6. 部署到Deno Deploy

### 方法一: 使用Web界面

1. 访问 https://dash.deno.com/
2. 使用GitHub账号登录
3. 点击"New Project"
4. 为项目取一个名称（只允许小写字母、数字和连字符，且长度为3-26个字符）

### 方法二: 使用命令行 (推荐)

```bash
# 首次部署时自动创建项目
deployctl deploy --project=your-project-name --prod main.ts
```

> **重要备注**：请将 `your-project-name` 替换为您想要的项目名称。项目名称必须遵循以下规则：
> - 只能使用英文字符（小写字母a-z）、数字(0-9)和连字符(-)
> - 长度必须在3-26个字符之间
> - 不能以连字符开头或结尾
> - 连字符后的字符数不能为8或12个

例如：
```bash
deployctl deploy --project=pink-chat-api --prod main.ts
```

### 部署整个目录

如果需要部署包含多个文件的项目：

```bash
# 部署当前目录下的所有文件
deployctl deploy --project=your-project-name --prod .
```

## 7. 设置环境变量

### 方法一：使用Web界面
1. 访问 https://dash.deno.com/
2. 选择您的项目
3. 点击"Settings" > "Environment Variables"
4. 添加键值对

### 方法二：使用命令行
```bash
deployctl env set --project=your-project-name API_KEY=your-secret-key
```

## 8. 常见问题与解决方案

### 404 Not Found (模块未找到)
```
error: The deployment failed: HTTP status client error (404 Not Found) for url (...)
```

**解决方案**:
1. 更新导入URL到最新版本
2. 对于Deno标准库，使用node:模块（如`import { Buffer } from "node:buffer";`）

### API错误（如CORS问题）
**解决方案**:
添加以下CORS处理：

```typescript
const handleOPTIONS = async () => {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With"
    }
  });
};
```

### 项目名称无效
```
Names must be between 3 and 26 characters, only contain a-z, 0-9 and -, must not start or end with a hyphen (-)...
```

**解决方案**:
使用符合要求的名称（见方法二的备注）

### 类型错误
修复常见的返回类型错误：
```typescript
return new Response(JSON.stringify(result), {
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*"
  }
});
```

## 9. 实用命令

### 本地开发与调试
```bash
# 启用监视模式，自动重载
deno run --allow-net --allow-read --watch main.ts
```

### 检查部署状态
```bash
deployctl deployments list --project=your-project-name
```

### 获取部署日志
```bash
deployctl logs --project=your-project-name
```

## 10. 部署示例流程

以下是一个完整的部署流程示例：

```bash
# 安装Deno和deployctl
irm https://deno.land/install.ps1 | iex
$env:PATH += ";$env:USERPROFILE\.deno\bin"
deno install -A -f jsr:@deno/deployctl --global

# 创建并进入项目目录
mkdir my-api-proxy
cd my-api-proxy

# 创建main.ts文件
echo 'Deno.serve(() => new Response("Hello, world!"));' > main.ts

# 本地测试
deno run --allow-net main.ts

# 部署到Deno Deploy (方法二)
deployctl deploy --project=my-api-proxy --prod main.ts

# 设置环境变量
deployctl env set --project=my-api-proxy API_KEY=your-secret-key
```

---

© 2025 粉色少女心语音聊天前端项目 