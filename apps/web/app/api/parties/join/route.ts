// apps/web/app/api/parties/join/route.ts
// ИСПРАВЛЕННАЯ ВЕРСИЯ с правильной обработкой user ID
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth-config';
import { storage } from '@/lib/storage-factory';
import { z } from 'zod';
import { triggerMemberJoined, triggerPlaylistUpdated } from '@/lib/pusher-server';
const joinPartySchema = z.object({
  code: z.string().length(8).transform(val => val.toUpperCase())
});
// Generate unified portrait for all party members
async function generateUnifiedPartyPortrait(partyId: string): Promise<any> {
  try {
    // Получаем всех участников party
    const members = await storage.getPartyMembers(partyId);
    if (members.length === 0) {
      return null;
    }
    // Получаем портреты всех участников
    const memberPortraits = [];
    for (const member of members) {
      const portrait = await storage.getMusicPortrait(member.userId);
      if (portrait) {
        memberPortraits.push(portrait);
      }
    }
    if (memberPortraits.length === 0) {
      return null;
    }
    // Вызываем unified portrait API для создания общего портрета
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/music/unified-portrait`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      console.error('[ERROR]' + ' ' + 'Failed to generate unified party portrait');
      return null;
    }
    const data = await response.json();
    return data.portrait;
  } catch (error) {
    console.error('[ERROR]' + ' ' + 'Error generating unified party portrait:', error);
    return null;
  }
}
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
    // Генерируем unified portrait для всех участников party
    const unifiedPortrait = await generateUnifiedPartyPortrait(party.id);
    // Обновляем party.playlist с новым unified портретом
    let updatedPlaylist: any = null;
    if (unifiedPortrait) {
      updatedPlaylist = {
        tracks: unifiedPortrait.topTracks.slice(0, 30).map((track: any) => ({
          id: track.id,
          name: track.name,
          artist: track.artist,
          imageUrl: track.imageUrl,
          sources: track.sources,
          popularity: track.popularity
        })),
        generatedAt: unifiedPortrait.generatedAt,
        partyReadiness: unifiedPortrait.partyReadiness
      };
      // Обновляем party с новым плейлистом
      await storage.updateParty(party.id, {
        playlist: updatedPlaylist,
        updatedAt: new Date().toISOString()
      });
    }
    // Отправляем Pusher события
    try {
      // Уведомляем о новом участнике
      await triggerMemberJoined(party.id, {
        id: user.id,
        name: user.name,
        image: user.image
      });
      // Уведомляем об обновлении плейлиста
      if (updatedPlaylist) {
        const members = await storage.getPartyMembers(party.id);
        await triggerPlaylistUpdated(party.id, updatedPlaylist);
      }
    } catch (error) {
      console.error('[ERROR]' + ' ' + 'Failed to send Pusher events:', error);
      // Не блокируем основную логику
    }
    // console.log(`User ${user.email} (${user.id}) joined party ${party.name} (${party.id})`);
    return NextResponse.json({
      success: true,
      id: party.id,
      message: `Successfully joined "${party.name}"`,
      playlist: unifiedPortrait ? {
        tracks: unifiedPortrait.topTracks.slice(0, 30).map((track: any) => ({
          id: track.id,
          name: track.name,
          artist: track.artist,
          imageUrl: track.imageUrl,
          sources: track.sources,
          popularity: track.popularity
        })),
        generatedAt: unifiedPortrait.generatedAt,
        partyReadiness: unifiedPortrait.partyReadiness
      } : null
    });
  } catch (_error) {
    if (_error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid party code format' },
        { status: 400 }
      );
    }
    // console.error('[ERROR]' + ' ' + 'Join party error:', error);
    return NextResponse.json(
      { error: 'Failed to join party. Please try again.' },
      { status: 500 }
    );
  }
}