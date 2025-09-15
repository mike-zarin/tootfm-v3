import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Публичные пути, которые НЕ требуют авторизации
  const publicPaths = [
    '/auth/signin',
    '/auth/error', 
    '/auth/callback',
    '/api/auth',
    '/_next',
    '/favicon.ico',
    '/test', // Тестовая страница
    '/party', // Страницы вечеринок
  ]
  
  // Проверяем, является ли путь публичным
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))
  
  // Для публичных путей - пропускаем без проверки
  if (isPublicPath) {
    return NextResponse.next()
  }
  
  // Для API routes (кроме auth) - тоже пропускаем
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }
  
  // Получаем токен сессии
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    // ВАЖНО: для production
    secureCookie: process.env.NODE_ENV === 'production',
  })
  
  // Для главной страницы разрешаем доступ всем (редирект обрабатывается в page.tsx)
  if (pathname === '/') {
    return NextResponse.next()
  }
  
  // Если нет токена и путь требует авторизации
  if (!token) {
    const signInUrl = new URL('/auth/signin', request.url)
    signInUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(signInUrl)
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)  
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg).*)',
  ],
}