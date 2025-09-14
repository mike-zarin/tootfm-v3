import { DefaultSession, DefaultUser } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      spotifyTokens?: {
        accessToken: string;
        refreshToken: string;
        expiresAt: number;
      };
    } & DefaultSession["user"];
  }
  interface User extends DefaultUser {
    id: string;
    email: string;
    spotifyTokens?: {
      accessToken: string;
      refreshToken: string;
      expiresAt: number;
    };
  }
}
declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    email: string;
    spotifyTokens?: {
      accessToken: string;
      refreshToken: string;
      expiresAt: number;
    };
  }
}