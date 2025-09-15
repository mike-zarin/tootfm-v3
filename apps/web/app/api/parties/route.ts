export const dynamic = 'force-dynamic';
export const revalidate = 0;

// apps/web/app/api/parties/route.ts
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { storage } from "@/lib/storage-factory";
import { randomBytes } from "crypto";
import { triggerMemberJoined, triggerPlaylistUpdated } from "@/lib/pusher-server";
// Secure party code generation with higher entropy
function generateSecurePartyCode(): string {
  // Generate 8 random bytes and convert to hex for better readability
  const randomData = randomBytes(4);
  const code = randomData.toString('hex').toUpperCase().substring(0, 8);
  return code;
}
// Generate unified portrait for party creator
async function generatePartyCreatorPortrait(userId: string): Promise<any> {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/music/unified-portrait`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    return data.portrait;
  } catch (error) {
    return null;
  }
}
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const parties = await storage.getUserParties(session.user.email);
    return NextResponse.json(parties);
  } catch (error) {
    console.error('[ERROR]' + ' ' + "[ERROR] Error fetching parties:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const { name, description } = body;
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    // Получаем или создаём пользователя
    let user = await storage.getUserByEmail(session.user.email);
    if (!user) {
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      user = await storage.createUser({
        id: userId,
        email: session.user.email,
        name: session.user.name || 'Anonymous',
        image: session.user.image || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    // Генерируем ID и код для party
    const partyId = `party_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const code = generateSecurePartyCode();
    // Генерируем музыкальный портрет создателя party
    const creatorPortrait = await generatePartyCreatorPortrait(user.id);
    // Создаем начальный плейлист из портрета создателя
    let initialPlaylist: any = null;
    if (creatorPortrait) {
      initialPlaylist = {
        tracks: creatorPortrait.topTracks.slice(0, 20).map((track: any) => ({
          id: track.id,
          name: track.name,
          artist: track.artist,
          imageUrl: track.imageUrl,
          sources: track.sources,
          popularity: track.popularity
        })),
        generatedAt: creatorPortrait.generatedAt,
        partyReadiness: creatorPortrait.partyReadiness
      };
    }
    const party = await storage.createParty({
      id: partyId,
      name,
      description: description || "",
      code,
      hostId: user.id,
      hostName: session.user.name || 'Anonymous',
      status: "WAITING",
      playlist: initialPlaylist || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      settings: {
        maxMembers: 50,
        votingEnabled: true,
        skipThreshold: 3,
        maxTracks: 10
      }
    });
    // Отправляем Pusher события для создания party
    try {
      // Уведомляем о создании party (хост автоматически присоединяется)
      await triggerMemberJoined(party.id, {
        id: user.id,
        name: user.name,
        image: user.image
      });
      // Уведомляем о начальном плейлисте
      if (initialPlaylist) {
        await triggerPlaylistUpdated(party.id, initialPlaylist);
      }
    } catch (error) {
      // Не блокируем основную логику
    }
    return NextResponse.json(party);
  } catch (error) {
    console.error('[ERROR]' + ' ' + "[ERROR] Error creating party:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}