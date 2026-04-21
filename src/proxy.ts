import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/session';

// Public API routes that don't require authentication
const PUBLIC_API_ROUTES = [
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/me',
  '/api/auth/reset-request',
  '/api/auth/reset-confirm',
];

// Public page routes (no redirect needed)
const PUBLIC_PAGES = ['/', '/login'];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // For API routes: enforce JWT authentication
  if (pathname.startsWith('/api/')) {
    // Allow public auth routes
    if (PUBLIC_API_ROUTES.some(route => pathname === route)) {
      return NextResponse.next();
    }

    // Verify JWT from cookie
    const token = request.cookies.get('unitech-session')?.value;
    const session = await decrypt(token);

    if (!session?.userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Attach user info via headers for downstream routes
    const response = NextResponse.next();
    response.headers.set('x-user-id', session.userId);
    response.headers.set('x-user-role', session.role);
    response.headers.set('x-user-name', session.username);
    return response;
  }

  // For pages: redirect unauthenticated users to login
  if (!PUBLIC_PAGES.includes(pathname) && !pathname.startsWith('/_next') && !pathname.includes('.')) {
    const token = request.cookies.get('unitech-session')?.value;
    const session = await decrypt(token);

    if (!session?.userId) {
      return NextResponse.redirect(new URL('/login', request.nextUrl));
    }
  }

  // Redirect authenticated users from login page to dashboard
  if (pathname === '/login' || pathname === '/') {
    const token = request.cookies.get('unitech-session')?.value;
    const session = await decrypt(token);

    if (session?.userId) {
      return NextResponse.redirect(new URL('/dashboard', request.nextUrl));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$|.*\\.ico$).*)',
  ],
};
