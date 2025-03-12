// 修改Buffer导入方法
// @ts-ignore - 忽略Deno模块导入错误
// 在Deno Deploy环境中，直接使用node:buffer是可行的
import { Buffer } from "node:buffer";

// 处理CORS的函数
const handleOPTIONS = async () => {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With"
    }
  });
};

// 处理API错误的类
class HttpError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
  }
}

// 设置CORS头
const fixCors = ({ headers, status, statusText }: any) => {
  headers = new Headers(headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  return { headers, status, statusText };
};

// 阿里云百炼API配置
const BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode";
const API_VERSION = "v1";
const API_CLIENT = "bailian-api/1.0.0";
const DEFAULT_MODEL = "qwen-omni-turbo-0119";
const DEFAULT_EMBEDDINGS_MODEL = "text-embedding-v1"; // 阿里云的嵌入模型

// 创建API请求头
const makeHeaders = (apiKey: string, more: any = {}) => ({
  "Content-Type": "application/json",
  ...(apiKey && { "Authorization": `Bearer ${apiKey}` }),
  ...more
});

// 处理模型列表请求
async function handleModels(apiKey: string) {
  try {
    const url = `${BASE_URL}/${API_VERSION}/models`;
    console.log(`请求模型列表: ${url}`);
    
    // 使用带重试的请求
    const response = await fetchWithRetry(
      url, 
      { headers: makeHeaders(apiKey) },
      3,  // 最大重试3次
      2000 // 基础延迟2000ms
    );
    
    if (!response.ok) {
      throw new HttpError(await response.text(), response.status);
    }
    
    // 为了与OpenAI兼容格式一致，我们创建一个固定的模型列表
    const models = [
      {
        id: "qwen-omni-turbo-0119",
        object: "model",
        created: 0,
        owned_by: "aliyun"
      },
      {
        id: "qwen-omni-turbo",
        object: "model",
        created: 0,
        owned_by: "aliyun"
      },
      {
        id: "qwen-omni-turbo-latest",
        object: "model",
        created: 0,
        owned_by: "aliyun"
      },
      {
        id: "text-embedding-v1",
        object: "model",
        created: 0,
        owned_by: "aliyun"
      }
    ];
    
    const responseBody = JSON.stringify({
      object: "list",
      data: models
    });
    
    return new Response(responseBody, {
      ...fixCors(response),
      headers: {
        ...fixCors(response).headers,
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("获取模型列表失败:", error);
    
    // 针对429错误返回友好的错误信息
    if (error instanceof HttpError && error.status === 429) {
      return new Response(
        JSON.stringify({
          error: {
            message: "API调用频率过高，请稍后再试。阿里云百炼API有请求频率限制。",
            type: "RateLimitError",
            code: 429,
            param: null,
          }
        }),
        {
          status: 429,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
            "Content-Type": "application/json",
            "Retry-After": "60"
          }
        }
      );
    }
    
    return createErrorResponse(error);
  }
}

// 处理嵌入向量请求
async function handleEmbeddings(req: any, apiKey: string) {
  try {
    // 构建请求URL和参数
    const model = req.model?.replace("text-embedding-ada-002", DEFAULT_EMBEDDINGS_MODEL) || DEFAULT_EMBEDDINGS_MODEL;
    const url = `${BASE_URL}/${API_VERSION}/embeddings`;
    
    console.log(`处理嵌入请求: ${url}, 模型: ${model}`);
    
    // 转换请求体格式 - 阿里云百炼API使用OpenAI兼容格式
    const requestData = {
      model: model,
      input: req.input
    };
    
    // 使用带重试的请求
    const response = await fetchWithRetry(
      url,
      {
        method: "POST",
        headers: makeHeaders(apiKey),
        body: JSON.stringify(requestData),
      },
      3,  // 最大重试3次
      2000 // 基础延迟2000ms
    );
    
    if (!response.ok) {
      throw new HttpError(await response.text(), response.status);
    }
    
    // 处理响应 - 直接返回响应，因为阿里云百炼API已经是OpenAI兼容格式
    const responseData = await response.json();
    
    return new Response(JSON.stringify(responseData), {
      ...fixCors(response),
      headers: {
        ...fixCors(response).headers,
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("处理嵌入向量请求失败:", error);
    
    // 针对429错误返回友好的错误信息
    if (error instanceof HttpError && error.status === 429) {
      return new Response(
        JSON.stringify({
          error: {
            message: "API调用频率过高，请稍后再试。阿里云百炼API有请求频率限制。",
            type: "RateLimitError",
            code: 429,
            param: null,
          }
        }),
        {
          status: 429,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
            "Content-Type": "application/json",
            "Retry-After": "60"
          }
        }
      );
    }
    
    return createErrorResponse(error);
  }
}

// 添加重试函数
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3, delay = 1000) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`尝试请求 ${url}，第 ${attempt}/${maxRetries} 次...`);
      const response = await fetch(url, options);
      
      // 如果是429错误，等待并重试
      if (response.status === 429) {
        console.log(`遇到限速(429)，等待 ${delay}ms 后重试...`);
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
        continue;
      }
      
      // 对于其他错误，直接返回响应
      return response;
    } catch (error) {
      console.error(`请求失败，尝试 ${attempt}/${maxRetries}:`, error);
      lastError = error;
      
      // 等待一段时间后重试
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  // 如果所有重试都失败，抛出最后的错误
  throw lastError || new Error(`请求 ${url} 失败，已尝试 ${maxRetries} 次`);
}

// 修改handleCompletions函数，使用阿里云百炼API
async function handleCompletions(req: any, apiKey: string) {
  // 确定使用的模型
  let model = DEFAULT_MODEL;
  if (typeof req.model === "string") {
    model = req.model;
  }
  
  const url = `${BASE_URL}/${API_VERSION}/chat/completions`;
  
  try {
    console.log(`发送聊天请求到 ${url}，使用模型 ${model}`);
    
    // 准备请求数据 - 阿里云百炼API使用OpenAI兼容格式
    const requestData = {
      ...req,
      model: model,
      // 如果是流式响应，确保设置stream为true
      stream: req.stream === true
    };
    
    // 使用带重试的请求
    const response = await fetchWithRetry(
      url,
      {
        method: "POST",
        headers: makeHeaders(apiKey),
        body: JSON.stringify(requestData),
      },
      3,  // 最大重试3次
      2000 // 基础延迟2000ms
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new HttpError(`阿里云百炼API错误: ${response.status} ${response.statusText} - ${errorText}`, response.status);
    }
    
    // 处理响应 - 阿里云百炼API已经返回OpenAI兼容格式
    if (req.stream) {
      // 对于流式响应，直接返回原始流
      return new Response(response.body, {
        headers: {
          ...fixCors(response).headers,
          "Content-Type": "text/event-stream"
        }
      });
    } else {
      // 对于非流式响应，直接返回响应数据
      const responseData = await response.json();
      
      return new Response(JSON.stringify(responseData), {
        ...fixCors(response),
        headers: {
          ...fixCors(response).headers,
          "Content-Type": "application/json",
        },
      });
    }
  } catch (error) {
    console.error("处理聊天完成请求失败:", error);
    
    // 针对429错误返回友好的错误信息
    if (error instanceof HttpError && error.status === 429) {
      return new Response(
        JSON.stringify({
          error: {
            message: "API调用频率过高，请稍后再试。阿里云百炼API有请求频率限制。",
            type: "RateLimitError",
            code: 429,
            param: null,
          }
        }),
        {
          status: 429,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
            "Content-Type": "application/json",
            "Retry-After": "60"
          }
        }
      );
    }
    
    return createErrorResponse(error);
  }
}

// 生成聊天完成ID - 仍然保留以备不时之需
const generateChatcmplId = () => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const randomChar = () => characters[Math.floor(Math.random() * characters.length)];
  return "chatcmpl-" + Array.from({ length: 29 }, () => randomChar()).join("");
};

// 获取文件扩展名对应的MIME类型
function getMimeType(path: string): string {
  const extension = path.split('.').pop() || '';
  return mimeTypes['.' + extension] || 'application/octet-stream';
}

// 静态文件MIME类型映射
const mimeTypes: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'font/otf',
  '.ico': 'image/x-icon'
};

// 创建静态文件处理器
const staticFiles = new Map();

// 处理请求的主函数
async function handleRequest(request: Request) {
  try {
    // 处理CORS预检请求
    if (request.method === "OPTIONS") {
      return handleOPTIONS();
    }
    
    const url = new URL(request.url);
    const { pathname } = url;
    
    // 获取API密钥，优先使用Authorization头，其次使用URL参数
    let apiKey = "";
    const authHeader = request.headers.get("Authorization");
    if (authHeader) {
      apiKey = authHeader.split(" ")[1];
    } else if (url.searchParams.has("key")) {
      apiKey = url.searchParams.get("key") || "";
    }
    
    // 处理不同API端点
    switch (true) {
      // 聊天完成API
      case pathname.endsWith("/chat/completions"):
        if (request.method !== "POST") {
          throw new HttpError("Method not allowed", 405);
        }
        return handleCompletions(await request.json(), apiKey);
      
      // 嵌入向量API
      case pathname.endsWith("/embeddings"):
        if (request.method !== "POST") {
          throw new HttpError("Method not allowed", 405);
        }
        return handleEmbeddings(await request.json(), apiKey);
      
      // 模型列表API
      case pathname.endsWith("/models"):
        if (request.method !== "GET") {
          throw new HttpError("Method not allowed", 405);
        }
        return handleModels(apiKey);
      
      // 根路径 - 返回HTML首页
      case pathname === "/" || pathname === "/index.html":
        return new Response("阿里云百炼API代理服务正在运行 - 基于Deno Deploy", {
          headers: {
            "Content-Type": "text/html;charset=UTF-8",
          },
        });
      
      // 处理其他静态资源
      default:
        const staticPath = pathname.startsWith("/") ? pathname.slice(1) : pathname;
        
        if (staticFiles.has(staticPath)) {
          return new Response(staticFiles.get(staticPath), {
            headers: {
              "Content-Type": getMimeType(staticPath),
            },
          });
        }
        
        // 404 - 未找到资源
        return new Response("Not found", { status: 404 });
    }
  } catch (err: any) {
    console.error("请求处理错误:", err);
    return new Response(err.message, fixCors({ 
      status: err.status || 500, 
      headers: new Headers({ "Content-Type": "text/plain;charset=UTF-8" })
    }));
  }
}

// 创建错误响应的辅助函数
function createErrorResponse(error: any) {
  const status = error instanceof HttpError ? error.status : 500;
  const message = error instanceof Error ? error.message : String(error);
  
  return new Response(
    JSON.stringify({
      error: {
        message,
        type: error.name || "UnknownError",
        code: status
      }
    }),
    {
      status,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
        "Content-Type": "application/json"
      }
    }
  );
}

// 使用Deno的服务函数直接启动服务
console.log(`HTTP服务器已启动...`);
// @ts-ignore - 忽略Deno全局对象错误
Deno.serve(handleRequest); 