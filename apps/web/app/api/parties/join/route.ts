// apps/web/app/api/parties/join/route.ts
// ИСПРАВЛЕННАЯ ВЕРСИЯ с правильной обработкой user ID

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth-config';
import { storage } from '@/lib/storage';
import { z } from 'zod';

const joinPartySchema = z.object({
  code: z.string().length(6).transform(val => val.toUpperCase())
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }
    
    // Получаем или создаём пользователя
    let user = await storage.getUserByEmail(session.user.email);
    
    if (!user) {
      const newUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      user = await storage.createUser({
        id: newUserId,
        email: session.user.email,
        name: session.user.name || 'Anonymous',
        image: session.user.image || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    const body = await request.json();
    const { code } = joinPartySchema.parse(body);
    
    const party = await storage.getPartyByCode(code);
    
    if (!party) {
      return NextResponse.json(
        { error: 'Party not found. Please check the code.' },
        { status: 404 }
      );
    }
    
    if (party.status === 'ENDED') {
      return NextResponse.json(
        { error: 'This party has already ended.' },
        { status: 400 }
      );
    }
    
    // Проверяем, не является ли пользователь уже участником
    const membership = await storage.getMembership(user.id, party.id);
    
    if (membership) {
      return NextResponse.json({
        success: true,
        id: party.id,
        message: 'You are already a member of this party'
      });
    }
    
    // Добавляем как участника
    await storage.createMembership({
      id: `membership_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      partyId: party.id,
      role: party.hostId === user.id ? 'host' : 'guest',
      joinedAt: new Date().toISOString()
    });
    
    // console.log(`User ${user.email} (${user.id}) joined party ${party.name} (${party.id})`);
    
    return NextResponse.json({
      success: true,
      id: party.id,
      message: `Successfully joined "${party.name}"`
    });
    
  } catch (_error) {
    if (_error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid party code format' },
        { status: 400 }
      );
    }
    
    // console.error('Join party error:', error);
    return NextResponse.json(
      { error: 'Failed to join party. Please try again.' },
      { status: 500 }
    );
  }
}