// lib/auth-options.ts
import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
// SpotifyProvider удален - используем кастомный callback
import { storage } from '@/lib/storage-factory';
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    // SpotifyProvider удален - конфликтовал с кастомным callback
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id || user.email || `user_${Date.now()}`;
        token.email = user.email!;
        token.name = user.name;
        token.image = user.image;
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
      }
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