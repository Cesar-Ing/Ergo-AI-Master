import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(process.env.SECRET_KEY || 'supersecretkey_ergoai_2026_secure');

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('ergoai_token')?.value;

  if (!token) {
    console.warn('No token found in cookies (ergoai_token)');
    return NextResponse.json({ error: 'No authenticated session' }, { status: 401 });
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      algorithms: ['HS256']
    });
    return NextResponse.json({
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      name: payload.name,
      department: payload.department
    });
  } catch (error) {
    console.error('Session JWT Verification failed:', error);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}
