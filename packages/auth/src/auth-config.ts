// packages/auth/src/auth-config.ts

import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import SpotifyProvider from "next-auth/providers/spotify";

const SPOTIFY_SCOPES = [
  "user-read-email",
  "user-top-read",
  "user-read-recently-played",
  "playlist-modify-public",
  "playlist-modify-private",
  "user-library-read"
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

    const refreshed = await response.json();

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

export const authConfig: NextAuthOptions = {
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
        token.id = user.id;
        token.email = user.email!;
        token.name = user.name;
        token.picture = user.image;
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
        session.user.id = token.id as string || token.sub as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string || session.user.name;
        session.user.image = token.picture as string || session.user.image;
        
        // Добавляем флаг о подключении Spotify
        (session.user as any).spotifyConnected = !!token.spotifyAccessToken;
      }
      
      // Добавляем Spotify токены в сессию для использования в API
      (session as any).spotifyAccessToken = token.spotifyAccessToken;
      (session as any).spotifyRefreshToken = token.spotifyRefreshToken;
      (session as any).spotifyExpiresAt = token.spotifyExpiresAt;
      (session as any).spotifyId = token.spotifyId;
      (session as any).shouldUpdateSpotifyProfile = token.shouldUpdateSpotifyProfile;
      
      return session;
    },
    
    async signIn({ user, account, profile }) {
      // Просто проверяем наличие email
      // Сохранение в storage будет происходить отдельно через API
      return !!user.email;
    },
  },
  
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  
  session: {
    strategy: "jwt",
  },
  
  debug: process.env.NODE_ENV === "development",
};