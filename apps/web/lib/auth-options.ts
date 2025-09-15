// lib/auth-options.ts
import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import SpotifyProvider from 'next-auth/providers/spotify';
import { storage } from '@/lib/storage-factory';

const SPOTIFY_SCOPES = [
  "user-read-email",
  "user-read-private",
  "user-top-read",
  "user-read-recently-played",
  "user-library-read",
  "playlist-read-private",
  "playlist-read-collaborative",
  "streaming",
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing"
].join(" ");

// Функция для обновления Spotify токена
async function refreshSpotifyToken(token: any) {
  try {
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
        ).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: token.spotifyRefreshToken,
      }),
    });

    const refreshed = await response.json() as {
      access_token: string;
      expires_in: number;
      refresh_token?: string;
    };

    if (!response.ok) throw refreshed;

    return {
      ...token,
      spotifyAccessToken: refreshed.access_token,
      spotifyExpiresAt: Math.floor(Date.now() / 1000) + refreshed.expires_in,
      spotifyRefreshToken: refreshed.refresh_token ?? token.spotifyRefreshToken,
    };
  } catch (error) {
    console.error("Error refreshing spotify token", error);
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

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
        url: "https://accounts.spotify.com/authorize",
        params: {
          scope: SPOTIFY_SCOPES,
          show_dialog: true,
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, profile }) {
      // При первом входе сохраняем данные пользователя
      if (user) {
        token.id = user.id || user.email || `user_${Date.now()}`;
        token.email = user.email!;
        token.name = user.name;
        token.image = user.image;
      }
      
      if (account?.provider === 'google') {
        token.id = account.providerAccountId;
      }
      
      // Сохраняем Spotify токены при авторизации через Spotify
      if (account?.provider === "spotify") {
        token.spotifyAccessToken = account.access_token;
        token.spotifyRefreshToken = account.refresh_token;
        token.spotifyExpiresAt = account.expires_at;
        token.spotifyId = (profile as any)?.id;
        token.spotifyEmail = (profile as any)?.email;
        token.spotifyDisplayName = (profile as any)?.display_name;
        
        // Сохраняем флаг что нужно обновить профиль
        token.shouldUpdateSpotifyProfile = true;
      }
      
      // Проверяем не истек ли Spotify токен
      if (token.spotifyExpiresAt && Date.now() > (token.spotifyExpiresAt as number) * 1000) {
        return await refreshSpotifyToken(token);
      }
      
      return token;
    },
    async session({ session, token }) {
      // Обновляем данные пользователя в сессии
      if (session.user) {
        (session.user as any).id = token.id as string || token.sub as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string || session.user.name;
        session.user.image = token.image as string || session.user.image;
        
        // Добавляем флаг о подключении Spotify
        (session.user as any).spotifyConnected = !!token.spotifyAccessToken;
      }
      
      // Добавляем Spotify токены в сессию для использования в API
      (session as any).spotifyAccessToken = token.spotifyAccessToken;
      (session as any).spotifyRefreshToken = token.spotifyRefreshToken;
      (session as any).spotifyExpiresAt = token.spotifyExpiresAt;
      (session as any).spotifyId = token.spotifyId;
      (session as any).shouldUpdateSpotifyProfile = token.shouldUpdateSpotifyProfile;
      
      // Create or update user in storage
      if (session.user?.email) {
        const existingUser = await storage.getUserByEmail(session.user.email);
        if (!existingUser) {
          await storage.createUser({
            id: session.user.id,
            email: session.user.email,
            name: session.user.name || 'User',
            image: session.user.image || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        } else if (existingUser.id !== session.user.id) {
          // Update user ID if it changed (shouldn't happen normally)
          await storage.updateUser(existingUser.id, {
            id: session.user.id,
            name: session.user.name || existingUser.name,
            image: session.user.image || existingUser.image,
            updatedAt: new Date().toISOString()
          });
        }
      }
      
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  
  // ДОБАВЛЕНО: Настройки cookies для production
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true
      }
    },
    callbackUrl: {
      name: `__Secure-next-auth.callback-url`,
      options: {
        sameSite: 'lax',
        path: '/',
        secure: true
      }
    },
    csrfToken: {
      name: `__Host-next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true
      }
    }
  },
  
  debug: process.env.NODE_ENV === 'development',
};