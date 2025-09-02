#!/bin/bash
echo "Step 4 will create auth and music packages..."
echo "Run: chmod +x step4-auth-packages.sh && ./step4-auth-packages.sh"


#!/bin/bash

# step4-auth-packages.sh - Auth Package Setup
# CTO: Настройка NextAuth с Google OAuth и подготовка к музыкальным сервисам

set -e

echo "🔐 Step 4: Setting up Auth Package"
echo "=================================="

# Create auth package directory
mkdir -p packages/auth/src

# 1. Auth package.json
echo "📦 Creating auth package.json..."
cat > packages/auth/package.json << 'EOF'
{
  "name": "@tootfm/auth",
  "version": "0.1.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next-auth": "^4.24.7",
    "@auth/prisma-adapter": "^1.0.12",
    "@tootfm/database": "*"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "typescript": "^5.3.3"
  }
}
EOF

# 2. Auth configuration
echo "🔧 Creating auth-config.ts..."
cat > packages/auth/src/auth-config.ts << 'EOF'
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@tootfm/database";

export const authConfig: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    })
  ],
  
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      return token;
    },
    
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
      }
      return session;
    },
    
    async signIn({ user, account, profile }) {
      if (!user.email) {
        return false;
      }
      
      try {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email }
        });
        
        if (!existingUser) {
          await prisma.user.create({
            data: {
              email: user.email,
              name: user.name || profile?.name || "User",
              image: user.image || null,
            }
          });
        }
        
        return true;
      } catch (error) {
        console.error("Error during sign in:", error);
        return false;
      }
    },
  },
  
  events: {
    async signIn({ user }) {
      console.log(`User signed in: ${user.email}`);
    },
    async signOut({ session }) {
      console.log(`User signed out: ${session?.user?.email}`);
    }
  },
  
  debug: process.env.NODE_ENV === "development",
};

// Type augmentation
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
    }
  }
  
  interface User {
    id: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    name?: string;
    picture?: string;
  }
}
EOF

# 3. Auth index export
echo "📄 Creating auth index.ts..."
cat > packages/auth/src/index.ts << 'EOF'
export { authConfig } from './auth-config';
export { getServerAuth } from './get-server-auth';
export { withAuth } from './middleware';
EOF

# 4. Server auth helper
echo "🔧 Creating get-server-auth.ts..."
cat > packages/auth/src/get-server-auth.ts << 'EOF'
import { getServerSession } from "next-auth";
import { authConfig } from "./auth-config";
import { redirect } from "next/navigation";

export async function getServerAuth() {
  const session = await getServerSession(authConfig);
  return session;
}

export async function requireAuth() {
  const session = await getServerSession(authConfig);
  
  if (!session?.user) {
    redirect("/auth/signin");
  }
  
  return session;
}

export async function requireHost(partyId: string) {
  const session = await requireAuth();
  const { prisma } = await import("@tootfm/database");
  
  const party = await prisma.party.findUnique({
    where: { id: partyId },
    select: { hostId: true }
  });
  
  if (!party || party.hostId !== session.user.id) {
    redirect("/");
  }
  
  return session;
}
EOF

# 5. Auth middleware
echo "🛡️ Creating middleware.ts..."
cat > packages/auth/src/middleware.ts << 'EOF'
import { withAuth as nextAuthMiddleware } from "next-auth/middleware";

export const withAuth = nextAuthMiddleware({
  callbacks: {
    authorized({ req, token }) {
      // Protected routes
      const protectedPaths = [
        '/api/parties',
        '/api/music',
        '/party',
        '/profile'
      ];
      
      const isProtected = protectedPaths.some(path => 
        req.nextUrl.pathname.startsWith(path)
      );
      
      if (isProtected) {
        return !!token;
      }
      
      return true;
    },
  },
});

export const config = {
  matcher: [
    '/api/:path*',
    '/party/:path*',
    '/profile/:path*',
  ]
};
EOF

# 6. tsconfig for auth package
echo "⚙️ Creating auth tsconfig.json..."
cat > packages/auth/tsconfig.json << 'EOF'
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

# 7. NextAuth API route
echo "📝 Creating NextAuth API route..."
mkdir -p apps/web/app/api/auth/\[...nextauth\]
cat > apps/web/app/api/auth/\[...nextauth\]/route.ts << 'EOF'
import NextAuth from "next-auth";
import { authConfig } from "@tootfm/auth";

const handler = NextAuth(authConfig);

export { handler as GET, handler as POST };
EOF

# 8. Auth pages - Sign In
echo "🎨 Creating auth pages..."
mkdir -p apps/web/app/auth/signin
cat > apps/web/app/auth/signin/page.tsx << 'EOF'
'use client';

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Music, Loader2 } from "lucide-react";

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const error = searchParams.get("error");
  
  const handleSignIn = async (provider: string) => {
    setIsLoading(true);
    await signIn(provider, { callbackUrl });
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-black flex items-center justify-center p-4">
      <div className="bg-gray-900/90 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Music className="w-16 h-16 text-purple-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to tootFM</h1>
          <p className="text-gray-400">Sign in to start your music party</p>
        </div>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-6">
            <p className="text-red-400 text-sm">
              {error === "OAuthAccountNotLinked" 
                ? "This email is already associated with another account."
                : "An error occurred during sign in. Please try again."}
            </p>
          </div>
        )}
        
        <div className="space-y-3">
          <button
            onClick={() => handleSignIn("google")}
            disabled={isLoading}
            className="w-full bg-white hover:bg-gray-100 text-gray-900 font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-3 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </>
            )}
          </button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-900 text-gray-500">More options coming soon</span>
            </div>
          </div>
          
          <button
            disabled
            className="w-full bg-gray-800 text-gray-500 font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-3 cursor-not-allowed opacity-50"
          >
            <Music className="w-5 h-5" />
            Continue with Spotify
          </button>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            By signing in, you agree to our{" "}
            <a href="/terms" className="text-purple-400 hover:text-purple-300">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/privacy" className="text-purple-400 hover:text-purple-300">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
EOF

# 9. Auth Error Page
echo "❌ Creating auth error page..."
mkdir -p apps/web/app/auth/error
cat > apps/web/app/auth/error/page.tsx << 'EOF'
'use client';

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  
  const errorMessages: Record<string, string> = {
    Configuration: "There is a problem with the server configuration.",
    AccessDenied: "You do not have permission to sign in.",
    Verification: "The verification token has expired or has already been used.",
    OAuthSignin: "Error occurred during OAuth sign in.",
    OAuthCallback: "Error occurred during OAuth callback.",
    OAuthCreateAccount: "Could not create OAuth account.",
    EmailCreateAccount: "Could not create email account.",
    Callback: "Error occurred during callback.",
    OAuthAccountNotLinked: "Email is already linked to another account.",
    Default: "An unexpected error occurred.",
  };
  
  const message = errorMessages[error || "Default"] || errorMessages.Default;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-black flex items-center justify-center p-4">
      <div className="bg-gray-900/90 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-red-500/20 p-4 rounded-full">
              <AlertCircle className="w-12 h-12 text-red-500" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Authentication Error</h1>
          <p className="text-gray-400">{message}</p>
        </div>
        
        <div className="space-y-3">
          <Link
            href="/auth/signin"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition"
          >
            Try Again
          </Link>
          
          <Link
            href="/"
            className="w-full bg-gray-800 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
EOF

# 10. Session Provider wrapper
echo "🎯 Creating SessionProvider wrapper..."
cat > apps/web/app/providers.tsx << 'EOF'
'use client';

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider refetchInterval={0}>
      {children}
    </SessionProvider>
  );
}
EOF

# 11. Update root layout to include providers
echo "📝 Updating root layout..."
cat > apps/web/app/layout.tsx << 'EOF'
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "tootFM - Democratic DJ for Your Party",
  description: "AI-powered music mixing that reads the room",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
EOF

# 12. Middleware file for auth protection
echo "🔒 Creating middleware.ts..."
cat > apps/web/middleware.ts << 'EOF'
export { withAuth as middleware, config } from "@tootfm/auth";
EOF

echo ""
echo "✅ Step 4 Complete: Auth package configured!"
echo ""
echo "📋 Created files:"
echo "  - packages/auth/ (NextAuth config)"
echo "  - Auth API route & pages"
echo "  - SessionProvider setup"
echo "  - Middleware for protection"
echo ""
echo "🔑 Next steps:"
echo "  1. Add Google OAuth credentials to .env.local"
echo "  2. Run: npm install"
echo "  3. Run: npx prisma generate"
echo "  4. Test auth at http://localhost:3000/auth/signin"
echo ""
echo "Ready for Step 5: Music API Package"
