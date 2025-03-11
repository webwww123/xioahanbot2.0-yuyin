/**
 * Gemini API Deno部署客户端
 * 
 * 用于与部署在Deno上的Gemini API代理进行通信
 */

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export type ChatCompletionResponse = {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

/**
 * Gemini API 客户端类
 * 可以通过远程 API 调用或本地代理调用
 */
export class GeminiClient {
  private baseUrl: string;
  private apiKey: string;
  private useLocalProxy: boolean;
  
  /**
   * 创建 Gemini API 客户端实例
   * @param baseUrl API 基础 URL
   * @param apiKey API 密钥
   * @param useLocalProxy 是否使用本地代理
   */
  constructor(baseUrl: string, apiKey: string, useLocalProxy: boolean = true) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.useLocalProxy = useLocalProxy;
  }
  
  /**
   * 发送聊天请求
   * @param {ChatMessage[]} messages - 聊天消息数组
   * @param {Object} options - 请求选项
   * @returns {Promise<ChatCompletionResponse>} 聊天完成响应
   */
  async chat(
    messages: ChatMessage[],
    options: {
      model?: string;
      temperature?: number;
      max_tokens?: number;
    } = {}
  ): Promise<ChatCompletionResponse> {
    const model = options.model || 'gemini-2.0-pro-exp-02-05';
    const temperature = options.temperature !== undefined ? options.temperature : 0.7;
    const max_tokens = options.max_tokens || 800;

    const payload = {
      model,
      messages,
      temperature,
      max_tokens,
    };

    let response;
    
    if (this.useLocalProxy) {
      // 使用本地代理
      console.log('使用本地代理发送请求到: /api/gemini-local/chat/completions');
      
      response = await fetch(`/api/gemini-local/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } else {
      // 使用远程 API
      console.log(`使用远程 API 发送请求到: ${this.baseUrl}/chat/completions`);
      
      response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
        mode: 'cors',
        credentials: 'omit',
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API 请求失败 (${response.status}): ${errorText}`);
    }

    return response.json();
  }
  
  /**
   * 获取可用模型列表
   * @returns {Promise<{object: string, data: Array<{id: string, object: string}>}>} 模型列表
   */
  async getModels() {
    let response;
    
    if (this.useLocalProxy) {
      // 使用本地代理
      console.log('使用本地代理发送请求到: /api/gemini-local/models');
      
      response = await fetch(`/api/gemini-local/models`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } else {
      // 使用远程 API
      console.log(`使用远程 API 发送请求到: ${this.baseUrl}/models`);
      
      response = await fetch(`${this.baseUrl}/models?key=${this.apiKey}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        mode: 'cors',
        credentials: 'omit',
      });
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`获取模型列表失败 (${response.status}): ${errorText}`);
    }

    return response.json();
  }
}

/**
 * 创建 Gemini API 客户端
 * @param url API 基础 URL
 * @param apiKey API 密钥
 * @param useLocalProxy 是否使用本地代理
 * @returns GeminiClient 实例
 */
export function createGeminiClient(
  url: string = 'https://pink-chat-api.deno.dev/v1',
  apiKey: string = 'AIzaSyBIDvwIlfUzhQPQQVwPWlAAVv75-E_oxuM',
  useLocalProxy: boolean = true
): GeminiClient {
  return new GeminiClient(url, apiKey, useLocalProxy);
}

// 导出默认实例，可以使用默认URL和密钥
export default createGeminiClient; 