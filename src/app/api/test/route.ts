import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'API测试路由工作正常' });
}

export async function POST() {
  return NextResponse.json({ message: '收到POST请求' });
} 