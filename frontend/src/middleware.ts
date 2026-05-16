import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Solo protegemos el Dashboard
  if (!path.startsWith('/dashboard')) {
    return NextResponse.next();
  }

  // REGLA DE ORO: Si hay CUALQUIER token, lo dejamos pasar.
  // No verificamos la firma aquí para evitar conflictos con el Backend.
  const manualToken = request.cookies.get('ergoai_token')?.value;
  const nextAuthToken = request.cookies.get('next-auth.session-token')?.value || 
                       request.cookies.get('__Secure-next-auth.session-token')?.value;

  if (!manualToken && !nextAuthToken) {
    // Solo redirigimos si no hay absolutamente nada de nada
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
