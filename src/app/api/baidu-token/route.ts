import { NextResponse } from 'next/server';
import axios from 'axios';

// 百度语音识别API配置
const BAIDU_API_KEY = 'lTIvxWNpSHUuNBGD3tqfdiqC';
const BAIDU_SECRET_KEY = 'hq5HnLN5ieAhGg0eBLFFuiUmz7NRpupz';

export async function GET() {
  try {
    console.log('API路由: 正在获取百度访问令牌...');
    
    const response = await axios.get(
      `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${BAIDU_API_KEY}&client_secret=${BAIDU_SECRET_KEY}`
    );
    
    console.log('API路由: 成功获取令牌');
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('API路由: 获取百度token失败:', error);
    
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
        error: '获取token失败', 
        details: errorDetails.message,
        response: errorDetails.data
      },
      { status: errorDetails.status }
    );
  }
} 