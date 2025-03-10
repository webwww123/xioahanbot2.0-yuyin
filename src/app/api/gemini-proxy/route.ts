import { NextRequest, NextResponse } from 'next/server';

// 常量定义
const BASE_URL = "https://generativelanguage.googleapis.com";
const API_VERSION = "v1beta";
const API_CLIENT = "genai-js/0.21.0";
const DEFAULT_MODEL = "gemini-1.5-pro-latest";

// HTTP错误类
class HttpError extends Error {
  status: number;
  
  constructor(message: string, status: number) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
  }
}

// 添加CORS头
const fixCors = ({ headers, status, statusText }: any) => {
  headers = new Headers(headers);
  headers.set("Access-Control-Allow-Origin", "*");
  return { headers, status, statusText };
};

// 创建请求头
const makeHeaders = (apiKey: string, more: any = {}) => ({
  "x-goog-api-client": API_CLIENT,
  ...(apiKey && { "x-goog-api-key": apiKey }),
  ...more
});

// 处理OPTIONS请求
export async function OPTIONS() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "*",
      "Access-Control-Allow-Headers": "*",
    }
  });
}

// 处理聊天完成请求
export async function POST(request: NextRequest) {
  try {
    // 从Authorization头中获取API密钥
    const auth = request.headers.get("Authorization");
    const apiKey = auth?.split(" ")[1];
    
    if (!apiKey) {
      return NextResponse.json({ error: "未提供API密钥" }, { status: 401 });
    }
    
    // 解析请求体
    const req = await request.json();
    
    // 转换模型名称
    let model = DEFAULT_MODEL;
    if (typeof req.model === "string") {
      if (req.model.startsWith("models/")) {
        model = req.model.substring(7);
      } else if (req.model.startsWith("gemini-") || req.model.startsWith("learnlm-")) {
        model = req.model;
      }
    }
    
    // 构建请求URL
    let url = `${BASE_URL}/${API_VERSION}/models/${model}:generateContent`;
    
    // 转换请求
    const transformedReq = await transformRequest(req);
    
    console.log('发送请求到Gemini API:', JSON.stringify(transformedReq, null, 2));
    
    // 发送请求到Gemini API
    const response = await fetch(url, {
      method: "POST",
      headers: makeHeaders(apiKey, { "Content-Type": "application/json" }),
      body: JSON.stringify(transformedReq),
    });
    
    // 检查响应
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API错误:', errorText);
      return NextResponse.json(
        { error: `Gemini API错误: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }
    
    // 解析响应
    const responseData = await response.json();
    
    // 生成聊天完成ID
    const id = generateChatcmplId();
    
    // 处理响应数据
    const processedResponse = processCompletionsResponse(responseData, model, id);
    
    return NextResponse.json(processedResponse);
    
  } catch (error) {
    console.error('处理聊天请求出错:', error);
    return NextResponse.json(
      { error: '处理请求时出错: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}

// 转换消息格式
async function transformMessages(messages: any[]) {
  if (!messages) return;
  
  const contents: any[] = [];
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
}

// 转换单个消息
async function transformMsg({ role, content }: { role?: string, content: string }) {
  return { 
    role, 
    parts: [{ text: content }] 
  };
}

// 转换请求配置
function transformConfig(req: any) {
  const config: any = {};
  const fieldsMap: Record<string, string> = {
    max_tokens: "maxOutputTokens",
    temperature: "temperature",
    top_p: "topP",
    top_k: "topK",
    frequency_penalty: "frequencyPenalty",
    presence_penalty: "presencePenalty",
  };
  
  for (const key in req) {
    const matchedKey = fieldsMap[key];
    if (matchedKey) {
      config[matchedKey] = req[key];
    }
  }
  
  return config;
}

// 转换完整请求
async function transformRequest(req: any) {
  // 安全设置
  const safetySettings = [
    "HARM_CATEGORY_HATE_SPEECH",
    "HARM_CATEGORY_SEXUALLY_EXPLICIT",
    "HARM_CATEGORY_DANGEROUS_CONTENT",
    "HARM_CATEGORY_HARASSMENT",
    "HARM_CATEGORY_CIVIC_INTEGRITY",
  ].map(category => ({
    category,
    threshold: "BLOCK_NONE",
  }));
  
  return {
    ...await transformMessages(req.messages),
    safetySettings,
    generationConfig: transformConfig(req),
  };
}

// 生成随机聊天完成ID
function generateChatcmplId() {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const randomChar = () => characters[Math.floor(Math.random() * characters.length)];
  return "chatcmpl-" + Array.from({ length: 29 }, randomChar).join("");
}

// 处理完成响应
function processCompletionsResponse(data: any, model: string, id: string) {
  // 将Gemini的finishReason映射到OpenAI的finish_reason
  const reasonsMap: Record<string, string> = {
    "STOP": "stop",
    "MAX_TOKENS": "length",
    "SAFETY": "content_filter",
    "RECITATION": "content_filter",
  };
  
  // 转换候选回复
  const transformCandidatesMessage = (cand: any) => ({
    index: cand.index || 0,
    message: {
      role: "assistant",
      content: cand.content?.parts.map((p: any) => p.text).join("\n\n"),
    },
    logprobs: null,
    finish_reason: reasonsMap[cand.finishReason] || cand.finishReason,
  });
  
  // 转换使用量
  const transformUsage = (data: any) => ({
    completion_tokens: data.candidatesTokenCount,
    prompt_tokens: data.promptTokenCount,
    total_tokens: data.totalTokenCount
  });
  
  // 返回标准格式的响应
  return {
    id,
    choices: data.candidates.map(transformCandidatesMessage),
    created: Math.floor(Date.now()/1000),
    model,
    object: "chat.completion",
    usage: data.usageMetadata ? transformUsage(data.usageMetadata) : null,
  };
} 