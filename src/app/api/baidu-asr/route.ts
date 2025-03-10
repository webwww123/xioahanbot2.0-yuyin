import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: Request) {
  try {
    console.log('API路由: 正在处理语音识别请求...');
    
    // 解析请求体
    const body = await request.json();
    const { token, audio, format, len } = body;
    
    if (!token || !audio) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }
    
    console.log(`API路由: 发送语音识别请求，格式=${format}, 长度=${len || audio.length}`);
    
    // 调用百度API
    const response = await axios.post(
      'https://vop.baidu.com/server_api',
      {
        format: format || 'pcm',
        rate: 16000,
        channel: 1,
        cuid: 'nextjs_app',
        token,
        speech: audio,
        len: len || audio.length
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    console.log('API路由: 语音识别响应状态码:', response.status);
    console.log('API路由: 语音识别结果:', response.data);
    
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('API路由: 语音识别失败:', error);
    
    // 安全地提取错误信息
    let errorDetails = {
      message: 'Unknown error',
      status: 500,
      data: null
    };
    
    if (error && typeof error === 'object') {
      const err = error as any;
      
      if (err.message) {
        errorDetails.message = err.message;
      }
      
      if (err.response) {
        if (err.response.status) {
          errorDetails.status = err.response.status;
        }
        if (err.response.data) {
          errorDetails.data = err.response.data;
        }
      }
    }
    
    console.error('错误详情:', errorDetails);
    
    return NextResponse.json(
      { 
        error: '语音识别请求失败', 
        details: errorDetails.message,
        response: errorDetails.data
      },
      { status: errorDetails.status }
    );
  }
} 