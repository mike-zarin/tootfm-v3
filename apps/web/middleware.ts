// apps/web/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
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
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};