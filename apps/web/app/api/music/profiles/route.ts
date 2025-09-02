// apps/web/app/api/music/profiles/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { storage } from '@/lib/storage';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // TODO: Получить музыкальные профили пользователя из storage
  const profiles = [];
  
  // Проверяем есть ли Spotify в сессии
  if ((session as any).spotify) {
    profiles.push({
      service: 'spotify',
      connected: true,
      email: session.user.email,
      displayName: session.user.name
    });
  }
  
  return NextResponse.json({ profiles });
}