import { NextResponse } from 'next/server';

const BACKEND_URL = 'http://localhost:8000';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }

  try {
    const response = await fetch(`${BACKEND_URL}/breaks/user/${userId}`);
    if (!response.ok) {
        return NextResponse.json({ error: 'Backend Error' }, { status: response.status });
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API/breaks GET Proxy]', error);
    return NextResponse.json({ error: 'Connection Failed' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${BACKEND_URL}/breaks/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
        return NextResponse.json({ error: 'Backend Error' }, { status: response.status });
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API/breaks POST Proxy]', error);
    return NextResponse.json({ error: 'Connection Failed' }, { status: 500 });
  }
}
