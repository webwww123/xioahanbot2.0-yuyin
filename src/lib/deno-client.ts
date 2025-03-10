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
 * GeminiClient类 - 与Deno部署的Gemini API代理通信
 */
export class GeminiClient {
  private baseUrl: string;
  private apiKey: string;
  
  /**
   * 创建GeminiClient实例
   * @param {string} baseUrl - Deno部署的API基础URL，例如: "https://your-deno-deploy.deno.dev/v1"
   * @param {string} apiKey - Gemini API密钥
   */
  constructor(baseUrl: string, apiKey: string) {
    // 确保baseUrl末尾没有斜杠
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    this.apiKey = apiKey;
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
    const url = `${this.baseUrl}/chat/completions`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: options.model || 'gemini-1.5-pro-latest',
          messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.max_tokens || 800
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API错误 (${response.status}): ${errorText}`);
      }
      
      return await response.json() as ChatCompletionResponse;
    } catch (error) {
      console.error('与Gemini API通信失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取可用模型列表
   * @returns {Promise<{object: string, data: Array<{id: string, object: string}>}>} 模型列表
   */
  async getModels() {
    const url = `${this.baseUrl}/models`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API错误 (${response.status}): ${errorText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('获取模型列表失败:', error);
      throw error;
    }
  }
}

/**
 * 创建GeminiClient实例的工厂函数
 * @param {string} url - Deno部署的API URL
 * @param {string} apiKey - Gemini API密钥
 * @returns {GeminiClient} GeminiClient实例
 */
export function createGeminiClient(url: string, apiKey: string): GeminiClient {
  return new GeminiClient(url, apiKey);
}

// 导出默认实例，可以使用默认URL和密钥
export default createGeminiClient; 