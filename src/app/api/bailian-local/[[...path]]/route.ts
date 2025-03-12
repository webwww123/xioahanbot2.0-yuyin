import { NextRequest, NextResponse } from 'next/server';

// 常量配置
const DENO_API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1';
const DENO_API_KEY = 'sk-68cc7ab559d4429889c6eda358b05763';
const DEFAULT_MODEL = 'qwen-omni-turbo';

/**
 * 处理GET请求 - 用于获取模型列表等
 */
export async function GET(request: NextRequest) {
  try {
    const models = [
      {
        id: 'qwen-omni-turbo',
        name: 'qwen-omni-turbo',
        description: 'Qwen Omni Turbo - Fast and efficient model for general tasks',
        pricing: { prompt: 0.002, completion: 0.002 }
      },
      {
        id: 'qwen-omni-plus',
        name: 'qwen-omni-plus',
        description: 'Qwen Omni Plus - More powerful model for complex tasks',
        pricing: { prompt: 0.004, completion: 0.004 }
      }
    ]
    
    return NextResponse.json({ data: models })
  } catch (error: any) {
    console.error('Error in GET request:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * 处理POST请求 - 用于聊天等
 */
export async function POST(request: NextRequest) {
  try {
    const path = request.nextUrl.pathname.replace('/api/bailian-local', '')
    const targetUrl = `${DENO_API_URL}${path}`
    
    const body = await request.json()
    
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DENO_API_KEY}`,
        'X-DashScope-SSE': body.stream ? 'enable' : 'disable'
      },
      body: JSON.stringify(body)
    })
    
    if (!response.ok) {
      const error = await response.text()
      console.error('API Error:', error)
      return NextResponse.json({ error }, { status: response.status })
    }
    
    if (body.stream) {
      const headers = new Headers(response.headers)
      headers.set('Content-Type', 'text/event-stream')
      headers.set('Cache-Control', 'no-cache')
      headers.set('Connection', 'keep-alive')
      
      return new NextResponse(response.body, {
        status: 200,
        headers
      })
    }
    
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error in POST request:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * 处理OPTIONS请求（CORS预检请求）
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-DashScope-SSE'
    }
  })
} 