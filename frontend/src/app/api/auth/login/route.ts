import { NextResponse } from 'next/server';

const BACKEND_URL = 'http://localhost:8000';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña son requeridos' }, { status: 400 });
    }

    const response = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Credenciales inválidas' }));
        return NextResponse.json({ error: error.detail }, { status: response.status });
    }

    const data = await response.json();
    const token = data.access_token;
    const user = data.user;

    // Configurar cookie httpOnly
    const nextResponse = NextResponse.json({ 
      success: true, 
      role: user.role, 
      email: user.email
    });
    
    nextResponse.cookies.set({
      name: 'ergoai_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 24 horas
    });

    return nextResponse;
  } catch (error) {
    console.error('Login proxy error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
