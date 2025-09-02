import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import SpotifyProvider from 'next-auth/providers/spotify';
import { storage } from '@/lib/storage';

const SPOTIFY_SCOPES = [
  'user-read-email',
  'user-read-private',
  'user-top-read',
  'user-read-recently-played',
  'playlist-read-private',
  'playlist-read-collaborative',
  'user-library-read',
  'user-read-playback-state',
  'user-modify-playback-state',
  'streaming'
].join(' ');

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
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id || user.email || `user_${Date.now()}`;
        token.email = user.email!;
        token.name = user.name;
        token.image = user.image;
      }
      
      if (account?.provider === 'spotify') {
        token.spotifyAccessToken = account.access_token;
        token.spotifyRefreshToken = account.refresh_token;
        token.spotifyExpiresAt = account.expires_at;
        
        if (account.access_token && token.id) {
          await storage.saveMusicProfile({
            id: `spotify_${account.providerAccountId}`,
            service: 'spotify',
            userId: token.id as string,
            accessToken: account.access_token,
            refreshToken: account.refresh_token!,
            expiresAt: new Date(account.expires_at! * 1000).toISOString(),
            spotifyId: account.providerAccountId,
            email: user?.email || '',
            displayName: user?.name || '',
            topTracks: [],
            topArtists: [],
            lastSyncedAt: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      }
      
      if (account?.provider === 'google') {
        token.id = account.providerAccountId;
      }
      
      return token;
    },
    
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.image as string;
        
        if (token.spotifyAccessToken) {
          session.user.spotifyTokens = {
            accessToken: token.spotifyAccessToken as string,
            refreshToken: token.spotifyRefreshToken as string,
            expiresAt: token.spotifyExpiresAt as number,
          };
        }
      }
      
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
    maxAge: 30 * 24 * 60 * 60,
  },
  
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};
