import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Clave secreta para verificar los tokens
const JWT_SECRET = new TextEncoder().encode(process.env.SECRET_KEY || 'supersecretkey_ergoai_2026_secure');

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Solo proteger rutas bajo /dashboard
  if (!path.startsWith('/dashboard')) {
    return NextResponse.next();
  }

  const token = request.cookies.get('ergoai_token')?.value;

  if (!token) {
    // Redirigir a login si no hay token
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // Verificar token con el algoritmo explícito HS256
    const { payload } = await jwtVerify(token, JWT_SECRET, { algorithms: ['HS256'] });
    const role = payload.role as string;

    // Control de acceso por roles
    if (path.startsWith('/dashboard/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    if (path.startsWith('/dashboard/reports') && role !== 'specialist' && role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Clonar los headers de la petición para pasar los datos del usuario a los componentes
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-role', role);
    requestHeaders.set('x-user-email', payload.email as string);
    requestHeaders.set('x-user-name', payload.name as string);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

  } catch (error) {
    // Token inválido o expirado
    console.error('JWT Verification failed:', error);
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('ergoai_token');
    return response;
  }
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
