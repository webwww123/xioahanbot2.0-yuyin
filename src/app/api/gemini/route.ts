import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Gemini API endpoint' });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return NextResponse.json({ message: 'Success', data: body });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process request' }, { status: 400 });
  }
} 