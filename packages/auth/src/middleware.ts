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
