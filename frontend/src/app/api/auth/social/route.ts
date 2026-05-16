import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, name, provider, provider_id } = body;

    if (!email || !provider || !provider_id) {
      return NextResponse.json({ error: 'Faltan datos de autenticación social' }, { status: 400 });
    }

    const res = await fetch(`${BACKEND_URL}/auth/social-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, provider, provider_id }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || 'Error de autenticación social' },
        { status: res.status }
      );
    }

    const data = await res.json();
    
    const response = NextResponse.json({ 
      success: true, 
      role: data.role, 
      email: data.email, 
      is_new: data.is_new 
    });
    
    if (data.access_token) {
      response.cookies.set({
        name: 'ergoai_token',
        value: data.access_token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 // 24 horas
      });
    }

    return response;
  } catch (error) {
    console.error('Social login proxy error:', error);
    return NextResponse.json({ error: 'Error de conexión con el servidor' }, { status: 500 });
  }
}
