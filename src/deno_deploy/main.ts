// 引入buffer模块
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

// 处理Gemini API错误的类
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

// Gemini API配置
const BASE_URL = "https://generativelanguage.googleapis.com";
const API_VERSION = "v1beta";
const API_CLIENT = "genai-js/0.21.0"; // npm view @google/generative-ai version
const DEFAULT_MODEL = "gemini-2.0-pro-exp-02-05";
const DEFAULT_EMBEDDINGS_MODEL = "text-embedding-004";

// 创建API请求头
const makeHeaders = (apiKey: string, more: any = {}) => ({
  "x-goog-api-client": API_CLIENT,
  ...(apiKey && { "x-goog-api-key": apiKey }),
  ...more
});

// 处理模型列表请求
async function handleModels(apiKey: string) {
  try {
    const url = `${BASE_URL}/${API_VERSION}/models`;
    console.log(`请求模型列表: ${url}`);
    
    const response = await fetch(url, {
      headers: makeHeaders(apiKey)
    });
    
    if (!response.ok) {
      throw new HttpError(await response.text(), response.status);
    }
    
    const data = await response.json();
    const { models } = data;
    const responseBody = JSON.stringify({
      object: "list",
      data: models.map(({ name }: any) => ({
        id: name.replace("models/", ""),
        object: "model",
        created: 0,
        owned_by: ""
      }))
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
    return createErrorResponse(error);
  }
}

// 处理嵌入向量请求
async function handleEmbeddings(req: any, apiKey: string) {
  try {
    // 构建请求URL和参数
    const model = req.model?.replace("text-embedding-ada-002", DEFAULT_EMBEDDINGS_MODEL) || DEFAULT_EMBEDDINGS_MODEL;
    const url = `${BASE_URL}/${API_VERSION}/models/${model}:embedContent`;
    
    console.log(`处理嵌入请求: ${url}, 模型: ${model}`);
    
    // 转换请求体格式
    const content = Array.isArray(req.input) ? req.input[0] : req.input;
    const requestData = {
      model: `models/${model}`,
      content: { parts: [{ text: content }] },
    };
    
    // 发送请求到Gemini API
    const response = await fetch(url, {
      method: "POST",
      headers: makeHeaders(apiKey, { "Content-Type": "application/json" }),
      body: JSON.stringify(requestData),
    });
    
    if (!response.ok) {
      throw new HttpError(await response.text(), response.status);
    }
    
    // 处理响应
    const { embeddings } = await response.json();
    const responseBody = JSON.stringify({
      object: "list",
      data: embeddings.map(({ values }: any, index: number) => ({
        object: "embedding",
        embedding: values,
        index
      })),
      model,
    });
    
    return new Response(responseBody, {
      ...fixCors(response),
      headers: {
        ...fixCors(response).headers,
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("处理嵌入向量请求失败:", error);
    return createErrorResponse(error);
  }
}

// 处理聊天完成请求
async function handleCompletions(req: any, apiKey: string) {
  let model = DEFAULT_MODEL;
  switch(true) {
    case typeof req.model !== "string":
      break;
    case req.model.startsWith("models/"):
      model = req.model.substring(7);
      break;
    case req.model.startsWith("gemini-"):
    case req.model.startsWith("learnlm-"):
      model = req.model;
  }
  
  const task = req.stream ? "streamGenerateContent" : "generateContent";
  let url = `${BASE_URL}/${API_VERSION}/models/${model}:${task}`;
  if (req.stream) { url += "?alt=sse"; }
  
  const response = await fetch(url, {
    method: "POST",
    headers: makeHeaders(apiKey, { "Content-Type": "application/json" }),
    body: JSON.stringify(await transformRequest(req)),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new HttpError(`Gemini API错误: ${response.status} ${response.statusText} - ${errorText}`, response.status);
  }
  
  let body = response.body;
  let id = generateChatcmplId();
  
  if (req.stream) {
    // 流式响应处理暂不支持，Deno Deploy不支持直接的TransformStream转发
    // 对于流式响应，直接返回原始流
    return new Response(body, fixCors(response));
  } else {
    // 非流式响应处理
    const data = await response.json();
    const processedData = processCompletionsResponse(data, model, id);
    return new Response(JSON.stringify(processedData), {
      ...fixCors(response),
      headers: {
        ...fixCors(response).headers,
        "Content-Type": "application/json",
      },
    });
  }
}

// 安全设置配置
const harmCategory = [
  "HARM_CATEGORY_HATE_SPEECH",
  "HARM_CATEGORY_SEXUALLY_EXPLICIT",
  "HARM_CATEGORY_DANGEROUS_CONTENT",
  "HARM_CATEGORY_HARASSMENT",
  "HARM_CATEGORY_CIVIC_INTEGRITY",
];

const safetySettings = harmCategory.map(category => ({
  category,
  threshold: "BLOCK_NONE",
}));

// 转换OpenAI请求参数为Gemini参数
const fieldsMap: Record<string, string> = {
  stop: "stopSequences",
  n: "candidateCount",
  max_tokens: "maxOutputTokens",
  max_completion_tokens: "maxOutputTokens",
  temperature: "temperature",
  top_p: "topP",
  top_k: "topK",
  frequency_penalty: "frequencyPenalty",
  presence_penalty: "presencePenalty",
};

// 转换配置
const transformConfig = (req: any) => {
  let cfg: Record<string, any> = {};
  
  for (let key in req) {
    const matchedKey = fieldsMap[key];
    if (matchedKey) {
      cfg[matchedKey] = req[key];
    }
  }
  
  if (req.response_format) {
    switch(req.response_format.type) {
      case "json_schema":
        cfg.responseSchema = req.response_format.json_schema?.schema;
        if (cfg.responseSchema && "enum" in cfg.responseSchema) {
          cfg.responseMimeType = "text/x.enum";
          break;
        }
        // eslint-disable-next-line no-fallthrough
      case "json_object":
        cfg.responseMimeType = "application/json";
        break;
      case "text":
        cfg.responseMimeType = "text/plain";
        break;
      default:
        throw new HttpError("Unsupported response_format.type", 400);
    }
  }
  
  return cfg;
};

// 转换单条消息
const transformMsg = async ({ role, content }: { role?: string, content: string | Array<any> }) => {
  const parts = [];
  
  if (!Array.isArray(content)) {
    parts.push({ text: content });
    return { role, parts };
  }
  
  for (const item of content) {
    if (typeof item === "string") {
      parts.push({ text: item });
    } else if (typeof item === "object") {
      if (item.type === "text") {
        parts.push({ text: item.text });
      } else {
        // 其他类型的内容（如图像）在本示例中不处理
        console.warn("不支持的内容类型:", item.type);
      }
    }
  }
  
  return { role, parts };
};

// 转换消息数组
const transformMessages = async (messages: any[]) => {
  if (!messages) { return; }
  
  const contents = [];
  let system_instruction;
  
  for (const item of messages) {
    if (item.role === "system") {
      delete item.role;
      system_instruction = await transformMsg(item);
    } else {
      item.role = item.role === "assistant" ? "model" : "user";
      contents.push(await transformMsg(item));
    }
  }
  
  if (system_instruction && contents.length === 0) {
    contents.push({ role: "model", parts: [{ text: " " }] });
  }
  
  return { system_instruction, contents };
};

// 转换完整请求
const transformRequest = async (req: any) => ({
  ...await transformMessages(req.messages),
  safetySettings,
  generationConfig: transformConfig(req),
});

// 生成聊天完成ID
const generateChatcmplId = () => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const randomChar = () => characters[Math.floor(Math.random() * characters.length)];
  return "chatcmpl-" + Array.from({ length: 29 }, () => randomChar()).join("");
};

// 完成原因映射
const reasonsMap: Record<string, string> = {
  "STOP": "stop",
  "MAX_TOKENS": "length",
  "SAFETY": "content_filter",
  "RECITATION": "content_filter",
};

// 转换候选回复
const transformCandidates = (key: string, cand: any) => ({
  index: cand.index || 0,
  [key]: {
    role: "assistant",
    content: cand.content?.parts.map((p: any) => p.text).join("\n\n") 
  },
  logprobs: null,
  finish_reason: reasonsMap[cand.finishReason] || cand.finishReason,
});

const transformCandidatesMessage = (cand: any) => transformCandidates("message", cand);

// 转换使用量数据
const transformUsage = (data: any) => ({
  completion_tokens: data.candidatesTokenCount,
  prompt_tokens: data.promptTokenCount,
  total_tokens: data.totalTokenCount
});

// 处理完成响应
const processCompletionsResponse = (data: any, model: string, id: string) => {
  return {
    id,
    choices: data.candidates.map(transformCandidatesMessage),
    created: Math.floor(Date.now()/1000),
    model,
    object: "chat.completion",
    usage: data.usageMetadata ? transformUsage(data.usageMetadata) : undefined,
  };
};

// 创建静态文件处理器
const staticFiles = new Map();

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

// 获取文件扩展名对应的MIME类型
function getMimeType(path: string): string {
  const extension = path.split('.').pop() || '';
  return mimeTypes['.' + extension] || 'application/octet-stream';
}

// 在生产环境中，添加静态资源支持
// 这里暂时省略静态资源处理的代码

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
        return new Response("Gemini API代理服务正在运行 - 基于Deno Deploy", {
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

// 仅在 Deno 环境中运行的部分
try {
  // 仅在 Deno 环境中使用的命名空间
  interface DenoNamespace {
    env: {
      get(key: string): string | undefined;
    };
    serve(options: { port: number }, handler: (request: Request) => Promise<Response>): void;
  }
  
  // 检查是否在 Deno 环境
  const isDeno = typeof (globalThis as any).Deno !== 'undefined';
  
  if (isDeno) {
    const Deno = (globalThis as any).Deno as DenoNamespace;
    const port = parseInt(Deno.env.get("PORT") || "8000");
    console.log(`HTTP服务器在端口 ${port} 上运行...`);
    Deno.serve({ port }, handleRequest);
  } else {
    console.log("不在Deno环境中，跳过服务器启动");
  }
} catch (e) {
  console.error("启动服务器时出错:", e);
} 