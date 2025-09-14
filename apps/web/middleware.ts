// apps/web/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Simple in-memory rate limiting
const rateLimit = new Map();

export async function middleware(request: NextRequest) {
  // Basic rate limiting for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const ip = request.ip ?? '127.0.0.1';
    const windowMs = 60 * 1000; // 1 minute
    const limit = 100; // requests per minute
    
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!rateLimit.has(ip)) {
      rateLimit.set(ip, []);
    }
    
    const requests = rateLimit.get(ip).filter((time: number) => time > windowStart);
    requests.push(now);
    rateLimit.set(ip, requests);
    
    if (requests.length > limit) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }
  }

  // Auth logic
  const token = await getToken({ req: request });
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth');
  
  // После авторизации Spotify сохраняем профиль
  if (request.nextUrl.pathname === '/' && token?.spotifyAccessToken) {
    const session = token as any;
    if (session.shouldUpdateSpotifyProfile) {
      // Вызываем callback для сохранения
      return NextResponse.redirect(new URL('/api/auth/spotify/callback', request.url));
    }
  }
  
  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }
  
  if (token && isAuthPage && request.nextUrl.pathname !== '/auth/signout') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Add security headers
  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  return response;
}
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};