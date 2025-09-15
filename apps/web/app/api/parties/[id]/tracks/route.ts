export const dynamic = 'force-dynamic';
export const revalidate = 0;

// app/api/parties/[id]/tracks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  storage,
  findPartyById,
  getPartyMembers,
  createTrack,
  getTracks,
  deleteTrack
} from '@/lib/storage';
import { AddTrackRequest } from '@/types';
import { z } from 'zod';
const addTrackSchema = z.object({
  spotifyId: z.string(),
  title: z.string(),
  artist: z.string(),
  album: z.string().optional(),
  duration: z.number().optional(),
  imageUrl: z.string().optional(),
  previewUrl: z.string().optional()
});
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    const party = await findPartyById(params.id);
    if (!party) {
      return NextResponse.json(
        { error: 'Party not found' },
        { status: 404 }
      );
    }
    const tracks = await getTracks(party.id);
    return NextResponse.json({ tracks });
  } catch (_error) {
    // console.error('[ERROR]' + ' ' + 'Get tracks error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tracks' },
      { status: 500 }
    );
  }
}
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    const party = await findPartyById(params.id);
    if (!party) {
      return NextResponse.json(
        { error: 'Party not found' },
        { status: 404 }
      );
    }
    const members = await getPartyMembers(party.id);
    const isMember = members.some(m => m.userId === session.user.id);
    if (!isMember && party.hostId !== session.user.id) {
      return NextResponse.json(
        { error: 'You must be a member to add tracks' },
        { status: 403 }
      );
    }
    const body: AddTrackRequest = await request.json();
    const data = addTrackSchema.parse(body);
    const existingTracks = await getTracks(party.id);
    const existingTrack = existingTracks.find(t => t.spotifyId === data.spotifyId);
    if (existingTrack) {
      // Вместо ошибки, возвращаем успех без дублирования
      return NextResponse.json({ 
        success: true, 
        track: existingTrack,
        message: "Track already in queue" 
      });
    }
    if (party.settings.maxTracks && existingTracks.length >= party.settings.maxTracks) {
      return NextResponse.json(
        { error: `Party has reached maximum of ${party.settings.maxTracks} tracks` },
        { status: 400 }
      );
    }
    const track = await createTrack({
      id: `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      partyId: party.id,
      position: existingTracks.length,
      title: data.title,
      artist: data.artist,
      album: data.album,
      duration: data.duration,
      spotifyId: data.spotifyId,
      imageUrl: data.imageUrl,
      previewUrl: data.previewUrl,
      addedById: session.user.id,
      addedByName: session.user.name || session.user.email,
      createdAt: new Date().toISOString()
    });
    return NextResponse.json(track, { status: 201 });
  } catch (_error) {
    if (_error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid track data', details: _error.errors },
        { status: 400 }
      );
    }
    // console.error('[ERROR]' + ' ' + 'Add track error:', error);
    return NextResponse.json(
      { error: 'Failed to add track' },
      { status: 500 }
    );
  }
}