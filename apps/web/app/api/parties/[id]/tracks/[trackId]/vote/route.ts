// app/api/parties/[id]/tracks/[trackId]/vote/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { storage } from '@/lib/storage-factory';
import { triggerTrackVoted } from '@/lib/pusher-server';
import { z } from 'zod';
const voteSchema = z.object({
  type: z.enum(['up', 'down', 'skip'])
});
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; trackId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    const body = await request.json();
    const { type } = voteSchema.parse(body);
    const vote = await storage.createVote({
      id: `vote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: session.user.id,
      trackId: params.trackId,
      type,
      createdAt: new Date().toISOString()
    });
    // Отправляем Pusher событие о голосовании
    try {
      await triggerTrackVoted(
        params.id,
        params.trackId,
        { type, userId: session.user.id, userName: session.user.name || 'Anonymous' }
      );
    } catch (error) {
      console.error('[ERROR]' + ' ' + 'Failed to send Pusher vote event:', error);
      // Не блокируем основную логику
    }
    return NextResponse.json(vote);
  } catch (_error) {
    if (_error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid vote type' },
        { status: 400 }
      );
    }
    // console.error('[ERROR]' + ' ' + 'Vote error:', error);
    return NextResponse.json(
      { error: 'Failed to register vote' },
      { status: 500 }
    );
  }
}