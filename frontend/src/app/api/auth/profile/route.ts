import { NextResponse } from 'next/server';

const BACKEND_URL = 'http://localhost:8000';

export async function PUT(request: Request) {
  try {
    const token = request.headers.get('cookie')?.split('ergoai_token=')[1]?.split(';')[0];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name, email, department, password } = await request.json();

    const response = await fetch(`${BACKEND_URL}/users/me`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
        full_name: name, 
        email, 
        department, 
        password: password && password.trim() ? password : undefined 
      })
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Error actualizando perfil' }));
        return NextResponse.json({ error: error.detail }, { status: response.status });
    }

    const updatedUser = await response.json();

    // Nota: El token JWT en la cookie debería idealmente ser refrescado por el backend
    // o simplemente el frontend debería confiar en el token original si los datos
    // se cargan de nuevo desde 'me'. 
    // Para simplificar y no romper nada, devolvemos success.
    
    return NextResponse.json({ success: true, message: 'Perfil actualizado' });

  } catch (error) {
    console.error('Profile update proxy error:', error);
    return NextResponse.json({ error: 'Error actualizando perfil' }, { status: 500 });
  }
}
