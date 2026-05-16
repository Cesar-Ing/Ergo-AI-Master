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
    return NextResponse.next();
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, { algorithms: ['HS256'] });
    const role = payload.role as string;

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
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
