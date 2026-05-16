import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { jwtVerify } from 'jose';

export async function GET(request: Request) {
  try {
    // 1. Intentar obtener sesión de NextAuth (Google/Outlook)
    const session = await getServerSession(authOptions);
    
    if (session) {
      return NextResponse.json({
        id: (session as any).id,
        name: session.user?.name,
        email: session.user?.email,
        role: (session as any).role || 'user',
        department: (session as any).department || 'General',
        provider: 'next-auth'
      });
    }

    // 2. Si no hay NextAuth, intentar leer la cookie manual (Login tradicional)
    const cookieToken = request.headers.get('cookie')
      ?.split('; ')
      .find(row => row.startsWith('ergoai_token='))
      ?.split('=')[1];

    if (cookieToken) {
      // Decodificar el token sin verificar (confiamos en él para el frontend, 
      // el backend verificará de nuevo en cada petición sensible)
      const payload = JSON.parse(atob(cookieToken.split('.')[1]));
      
      return NextResponse.json({
        id: payload.sub,
        name: payload.name,
        email: payload.email,
        role: payload.role,
        department: payload.department || 'General',
        provider: 'custom'
      });
    }

    return NextResponse.json({ error: "No session found" }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
