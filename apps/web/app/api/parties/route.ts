// apps/web/app/api/parties/route.ts
// ИСПРАВЛЕННАЯ ВЕРСИЯ с правильной обработкой user ID

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth-config';
import { storage } from '@/lib/storage';
import { z } from 'zod';

const createPartySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  settings: z.object({
    maxTracks: z.number().min(10).max(200).optional(),
    autoPlay: z.boolean().optional(),
    votingEnabled: z.boolean().optional(),
    skipThreshold: z.number().min(0.1).max(1).optional()
  }).optional()
});

// POST /api/parties - Create new party
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // ВАЖНО: Используем email для поиска или создания пользователя
    let user = await storage.getUserByEmail(session.user.email);
    
    // Если пользователя нет - создаём с правильным ID
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
    const data = createPartySchema.parse(body);
    
    const code = await storage.generateUniquePartyCode();
    const partyId = `party_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const party = await storage.createParty({
      id: partyId,
      code,
      name: data.name,
      description: data.description,
      hostId: user.id, // Используем ID из нашей базы, а не Google ID
      hostName: user.name || session.user.name || 'Anonymous',
      hostImage: user.image || session.user.image || null,
      settings: {
        maxTracks: data.settings?.maxTracks || 50,
        autoPlay: data.settings?.autoPlay !== false,
        votingEnabled: data.settings?.votingEnabled !== false,
        skipThreshold: data.settings?.skipThreshold || 0.5
      },
      status: 'WAITING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    
    return NextResponse.json({
      ...party,
      members: 1,
      tracks: 0
    });
    
  } catch (_error) {
    if (_error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid party data', details: _error.errors },
        { status: 400 }
      );
    }
    
    // console.error('Error creating party:', error);
    return NextResponse.json(
      { error: 'Failed to create party' },
      { status: 500 }
    );
  }
}

// GET /api/parties - Get user's parties
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Получаем пользователя по email
    const user = await storage.getUserByEmail(session.user.email);
    
    if (!user) {
      return NextResponse.json([]);
    }
    
    const { hosted, joined } = await storage.getUserParties(user.id);
    
    // Добавляем счётчики
    const partiesWithCounts = [];
    for (const party of [...hosted, ...joined]) {
      const members = await storage.getPartyMemberCount(party.id);
      const tracks = await storage.getPartyTrackCount(party.id);
      
      partiesWithCounts.push({
        ...party,
        members,
        tracks,
        isHost: party.hostId === user.id
      });
    }
    
    return NextResponse.json(partiesWithCounts);
  } catch (_error) {
    // console.error('Error fetching parties:', error);
    return NextResponse.json(
      { error: 'Failed to fetch parties' },
      { status: 500 }
    );
  }
}