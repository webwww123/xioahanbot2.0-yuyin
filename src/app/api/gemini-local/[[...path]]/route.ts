import { NextRequest, NextResponse } from 'next/server';

// 常量配置
const DENO_API_URL = 'https://pink-chat-api.deno.dev/v1';
const API_KEY = 'AIzaSyBIDvwIlfUzhQPQQVwPWlAAVv75-E_oxuM';

/**
 * 处理GET请求 - 用于获取模型列表等
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { path?: string[] } }
) {
  // 构建路径
  const pathSegment = params.path ? `/${params.path.join('/')}` : '/models';
  const targetUrl = `${DENO_API_URL}${pathSegment}?key=${API_KEY}`;
  
  console.log(`[API代理] 转发GET请求到: ${targetUrl}`);
  
  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API错误 (${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API代理] GET请求错误:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * 处理POST请求 - 用于聊天等
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { path?: string[] } }
) {
  try {
    // 构建路径
    const pathSegment = params.path ? `/${params.path.join('/')}` : '/chat/completions';
    const targetUrl = `${DENO_API_URL}${pathSegment}`;
    
    console.log(`[API代理] 转发POST请求到: ${targetUrl}`);
    
    // 获取请求体
    const body = await request.json();
    console.log('[API代理] 请求体:', JSON.stringify(body));
    
    // 转发请求
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API错误 (${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    console.log('[API代理] 收到响应:', JSON.stringify(data).substring(0, 200) + '...');
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API代理] POST请求错误:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * 处理OPTIONS请求（CORS预检请求）
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
} 