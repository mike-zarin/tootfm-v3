export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const runtime = 'nodejs';

import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth-options';
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
