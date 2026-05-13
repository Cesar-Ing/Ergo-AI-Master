import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, full_name } = body;

    if (!email || !password || !full_name) {
      return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 });
    }

    const response = await fetch(`${BACKEND_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name })
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Error al registrar usuario' }));
        return NextResponse.json({ error: error.detail }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, user: data });
  } catch (error) {
    console.error('Register proxy error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
