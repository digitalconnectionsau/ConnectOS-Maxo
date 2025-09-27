import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Public paths that don't require authentication
  const publicPaths = ['/login', '/api/auth/login', '/api/webhooks', '/setup', '/api/health', '/api/setup'];
  
  // Static file extensions that should be allowed
  const staticFileExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.ico', '.css', '.js', '.woff', '.woff2', '.ttf', '.eot'];
  const isStaticFile = staticFileExtensions.some(ext => request.nextUrl.pathname.toLowerCase().endsWith(ext));
  
  const isPublicPath = publicPaths.some(path => request.nextUrl.pathname.startsWith(path));

  if (isPublicPath || isStaticFile) {
    return NextResponse.next();
  }

  // Check for authentication cookie
  const sessionCookie = request.cookies.get('crm-session');
  const isAuthenticated = sessionCookie?.value?.startsWith('user-');

  if (!isAuthenticated) {
    // Redirect to login page for web requests
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    } else {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:jpg|jpeg|png|gif|svg|ico|css|js|woff|woff2|ttf|eot)$).*)'
  ]
};