import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

async function proxyRequest(request: Request) {
  const { pathname, search } = new URL(request.url);
  const targetPath = pathname.replace('/api/', '/');
  const targetUrl = `${BACKEND_URL}${targetPath}${search}`;

  try {
    const method = request.method;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    let body = null;
    if (method !== 'GET' && method !== 'HEAD') {
      body = await request.text();
    }

    const res = await fetch(targetUrl, {
      method,
      headers,
      body: body || undefined,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return NextResponse.json({ error: 'Backend Error', details: errorData }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Stats Proxy Error]', error);
    return NextResponse.json({ error: 'Connection Failed' }, { status: 500 });
  }
}

export async function GET(request: Request) { return proxyRequest(request); }
export async function POST(request: Request) { return proxyRequest(request); }
export async function PUT(request: Request) { return proxyRequest(request); }
export async function DELETE(request: Request) { return proxyRequest(request); }
