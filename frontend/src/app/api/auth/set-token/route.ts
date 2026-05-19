import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();
    const nextResponse = NextResponse.json({ success: true });
    
    if (token) {
      const cookieStore = await cookies();
      cookieStore.set('ergoai_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 // 24 horas
      });
    }
    
    return nextResponse;
  } catch (error) {
    return NextResponse.json({ error: 'Error setting token' }, { status: 500 });
  }
}
