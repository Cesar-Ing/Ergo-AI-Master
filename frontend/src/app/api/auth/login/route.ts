import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña son requeridos' }, { status: 400 });
    }

    // Llamada al backend real
    const response = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
        return NextResponse.json(
          { error: data.detail || 'Credenciales inválidas' }, 
          { status: response.status }
        );
    }

    const token = data.access_token;

    // Crear la respuesta y configurar la cookie HttpOnly
    const nextResponse = NextResponse.json({ 
      success: true, 
      id: data.id,
      role: data.role, 
      email: data.email,
      token: token // Devolvemos el token también para localStorage por compatibilidad
    });
    
    if (token) {
      nextResponse.cookies.set({
        name: 'ergoai_token',
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 // 24 horas
      });
    }

    return nextResponse;
  } catch (error) {
    console.error('Login proxy error:', error);
    return NextResponse.json(
      { error: 'Error de conexión con el servidor backend' }, 
      { status: 500 }
    );
  }
}
