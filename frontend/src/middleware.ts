import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.SECRET_KEY || 'supersecretkey_ergoai_2026_secure');

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (!path.startsWith('/dashboard')) {
    return NextResponse.next();
  }

  // REGLA: Aceptar cualquiera de los dos tokens (Manual o Social)
  const manualToken = request.cookies.get('ergoai_token')?.value;
  const nextAuthToken = request.cookies.get('next-auth.session-token')?.value || 
                       request.cookies.get('__Secure-next-auth.session-token')?.value;

  // Si no hay ningún token, al login
  if (!manualToken && !nextAuthToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Si hay token manual, verificarlo
  if (manualToken) {
    try {
      const { payload } = await jwtVerify(manualToken, JWT_SECRET, { algorithms: ['HS256'] });
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-role', payload.role as string);
      return NextResponse.next({ request: { headers: requestHeaders } });
    } catch (e) {
      // Si el token manual es inválido pero hay social, seguimos. Si no, al login.
      if (!nextAuthToken) return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
