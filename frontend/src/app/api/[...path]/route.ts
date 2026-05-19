import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

/**
 * Proxy universal para redirigir peticiones al backend de FastAPI.
 * Maneja automáticamente la inclusión del token de autenticación desde las cookies.
 */
async function handleRequest(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path: pathSegments } = await context.params;
  let path = pathSegments.join('/');
  
  // Evitar redirecciones 307/308 en el backend de FastAPI que convierten POST/PUT a GET
  if (path === 'breaks' || path === 'config' || path === 'pediatric-guidelines' || path === 'users' || path === 'prescriptions') {
    path = `${path}/`;
  }
  
  const { search } = new URL(request.url);
  const targetUrl = `${BACKEND_URL}/${path}${search}`;

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('ergoai_token')?.value;

    const method = request.method;
    const headers = new Headers(request.headers);
    
    // Configurar el encabezado de autorización si hay un token
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    // El host debe ser el del backend
    headers.delete('host');
    headers.delete('connection');

    let body = undefined;
    if (!['GET', 'HEAD'].includes(method)) {
      body = await request.text();
    }

    const response = await fetch(targetUrl, {
      method,
      headers,
      body: body || undefined,
      cache: 'no-store'
    });

    const contentType = response.headers.get('content-type');
    let responseData;

    if (contentType?.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    return new NextResponse(
      typeof responseData === 'string' ? responseData : JSON.stringify(responseData),
      {
        status: response.status,
        headers: {
          'Content-Type': contentType || 'application/json',
        },
      }
    );
  } catch (error) {
    console.error(`[Proxy Error] ${request.method} /api/${path}:`, error);
    return NextResponse.json(
      { error: 'Connection to backend failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request, context: any) { return handleRequest(request, context); }
export async function POST(request: Request, context: any) { return handleRequest(request, context); }
export async function PUT(request: Request, context: any) { return handleRequest(request, context); }
export async function PATCH(request: Request, context: any) { return handleRequest(request, context); }
export async function DELETE(request: Request, context: any) { return handleRequest(request, context); }
