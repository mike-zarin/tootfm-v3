import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import SpotifyProvider from 'next-auth/providers/spotify'
import { getStorage } from './storage-factory'

const storage = getStorage()

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'user-read-email user-read-private user-top-read user-read-recently-played playlist-read-private playlist-read-collaborative user-modify-playback-state user-read-playback-state streaming',
        },
      },
    }),
  ],
  
  // Одна секция pages (была дублирована)
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Простая логика без циклов
      if (url.startsWith("/")) return `${baseUrl}${url}`
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
    
    async signIn({ user, account, profile }) {
      if (!user.email) return false
      
      try {
        // Проверяем/создаем пользователя
        const existingUser = await storage.getUserByEmail(user.email).catch(() => null)
        
        if (!existingUser) {
          await storage.createUser({
            email: user.email,
            name: user.name || '',
            image: user.image || '',
          }).catch((err: unknown) => {
            console.error('[AUTH] Failed to create user:', err)
            // Не блокируем вход если storage недоступен
          })
        }

        // Сохраняем Spotify токены если есть
        if (account?.provider === 'spotify' && account.access_token) {
          await storage.saveSpotifyProfile({
            email: user.email,
            spotifyId: (profile as any)?.id as string,
            accessToken: account.access_token,
            refreshToken: account.refresh_token || '',
            expiresAt: account.expires_at ? new Date(account.expires_at * 1000).toISOString() : new Date().toISOString(),
          }).catch((err: unknown) => {
            console.error('[AUTH] Failed to save Spotify profile:', err)
            // Не блокируем вход если storage недоступен
          })
        }

        return true
      } catch (error) {
        console.error('[AUTH] Sign in error:', error)
        // Разрешаем вход даже если storage не работает
        return true
      }
    },
    
    async session({ session, token }) {
      if (session.user?.email) {
        try {
          const user = await storage.getUserByEmail(session.user.email).catch(() => null)
          if (user) {
            session.user.id = user.id
          }

          const spotifyProfile = await storage.getSpotifyProfile(session.user.email).catch(() => null)
          if (spotifyProfile) {
            (session as any).spotify = {
              connected: true,
              expiresAt: spotifyProfile.expiresAt,
            }
          }
        } catch (error) {
          console.error('[AUTH] Session callback error:', error)
          // Продолжаем работу даже если storage недоступен
        }
      }
      return session
    },
    
    async jwt({ token, account, user }) {
      if (account && user) {
        token.userId = user.id
        token.email = user.email
      }
      return token
    },
  },
  
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
  
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
}