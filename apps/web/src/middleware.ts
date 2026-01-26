import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/', '/login', '/auth/callback', '/auth/error', '/auth/extension-callback', '/auth/extension-logout', '/design'];

// Routes that are only accessible when NOT authenticated
const AUTH_ROUTES = ['/login'];

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Check maintenance mode
  if (process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true') {
    if (pathname !== '/' && !pathname.startsWith('/api')) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Allow public routes
  if (
    PUBLIC_ROUTES.some(
      (route) =>
        pathname === route || pathname.startsWith(route + '/') || pathname.startsWith('/api')
    )
  ) {
    // Redirect authenticated users away from auth routes
    if (user && AUTH_ROUTES.includes(pathname)) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return supabaseResponse;
  }

  // Protected routes - require authentication
  if (!user) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
