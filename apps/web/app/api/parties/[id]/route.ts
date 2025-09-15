// apps/web/app/api/parties/[id]/route.ts
// ИСПРАВЛЕННАЯ ВЕРСИЯ с правильной обработкой user ID
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth-config';
import { storage } from '@/lib/storage-factory';
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    // Получаем пользователя
    const user = await storage.getUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    const party = await storage.getParty(params.id);
    if (!party) {
      return NextResponse.json(
        { error: 'Party not found' },
        { status: 404 }
      );
    }
    // Проверяем, является ли пользователь участником
    const membership = await storage.getMembership(user.id, party.id);
    if (!membership && party.hostId !== user.id) {
      return NextResponse.json(
        { error: 'Access denied. You are not a member of this party.' },
        { status: 403 }
      );
    }
    // Получаем дополнительную информацию
    const members = await storage.getPartyMembers(party.id);
    const tracks = await storage.getTracks(party.id);
    return NextResponse.json({
      ...party,
      isHost: party.hostId === user.id,
      currentUserId: user.id,
      members: members.length,
      tracks: tracks.length,
      membersList: members,
      tracksList: tracks
    });
  } catch (_error) {
    // console.error('[ERROR]' + ' ' + 'Error fetching party:', error);
    return NextResponse.json(
      { error: 'Failed to fetch party' },
      { status: 500 }
    );
  }
}
// DELETE /api/parties/[id] - End party (host only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    const user = await storage.getUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    const party = await storage.getParty(params.id);
    if (!party) {
      return NextResponse.json(
        { error: 'Party not found' },
        { status: 404 }
      );
    }
    // Только хост может закрыть партию
    if (party.hostId !== user.id) {
      return NextResponse.json(
        { error: 'Only the host can end the party' },
        { status: 403 }
      );
    }
    // Обновляем статус партии
    await storage.updateParty(party.id, {
      status: 'ENDED',
      updatedAt: new Date().toISOString()
    });
    return NextResponse.json({
      success: true,
      message: 'Party ended successfully'
    });
  } catch (_error) {
    // console.error('[ERROR]' + ' ' + 'Error ending party:', error);
    return NextResponse.json(
      { error: 'Failed to end party' },
      { status: 500 }
    );
  }
}
// PATCH /api/parties/[id] - Update party settings (host only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    const user = await storage.getUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    const party = await storage.getParty(params.id);
    if (!party) {
      return NextResponse.json(
        { error: 'Party not found' },
        { status: 404 }
      );
    }
    // Только хост может изменять настройки
    if (party.hostId !== user.id) {
      return NextResponse.json(
        { error: 'Only the host can update party settings' },
        { status: 403 }
      );
    }
    const body = await request.json();
    const updates = {
      ...(body.name && { name: body.name }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.status && { status: body.status }),
      ...(body.settings && { settings: { ...party.settings, ...body.settings } }),
      updatedAt: new Date().toISOString()
    };
    const updatedParty = await storage.updateParty(party.id, updates);
    return NextResponse.json(updatedParty);
  } catch (_error) {
    // console.error('[ERROR]' + ' ' + 'Error updating party:', error);
    return NextResponse.json(
      { error: 'Failed to update party' },
      { status: 500 }
    );
  }
}
export const revalidate = 60 // Cache for 1 minute
