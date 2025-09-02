// apps/web/app/party/[id]/page.tsx

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { storage } from '@/lib/storage';
import { notFound, redirect } from 'next/navigation';
import  TrackSearch from '@/components/music/TrackSearch';
import { TrackQueue } from '@/components/music/TrackQueue';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Music, Share2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CopyCodeButton } from '@/components/party/CopyCodeButton';
import { SpotifyConnect } from '@/components/spotify/SpotifyConnect';
import { SpotifyPlayer } from '@/components/spotify/SpotifyPlayer';
export default async function PartyPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const party = await storage.getParty(params.id);
  
  if (!party) {
    notFound();
  }

  // Check if user is a member
  const members = await storage.getPartyMembers(params.id);
  const membership = members.find(m => m.userId === session.user.id);
  const isHost = party.hostId === session.user.id;
  const isMember = !!membership || isHost;

  if (!isMember) {
    redirect(`/party/join?code=${party.code}`);
  }

  const memberCount = await storage.getPartyMemberCount(params.id);
  const trackCount = await storage.getPartyTrackCount(params.id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-bold text-white">{party.name}</h1>
            <Badge className="text-lg px-4 py-2" variant="secondary">
              {party.code}
            </Badge>
          </div>
          
          {party.description && (
            <p className="text-purple-200 mb-4">{party.description}</p>
          )}

          {/* Stats */}
          <div className="flex gap-4 text-purple-300">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{memberCount} members</span>
            </div>
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4" />
              <span>{trackCount} tracks</span>
            </div>
            {isHost && (
              <Badge variant="outline" className="text-purple-300 border-purple-300">
                Host
              </Badge>
            )}
          </div>
        </div>

        {/* Share Card */}
        <Card className="mb-8 bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Invite Friends
            </CardTitle>
            <CardDescription className="text-purple-200">
              Share this code with friends to let them join the party
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-4xl font-mono font-bold text-white bg-purple-600 px-6 py-3 rounded-lg">
                {party.code}
              </div>
              <CopyCodeButton code={party.code} />
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        {/* Spotify Integration */}
        <div className="mb-8">
          <SpotifyConnect partyId={params.id} />
        </div>

        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="p-6">
            <Tabs defaultValue="queue" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="queue">Queue ({trackCount})</TabsTrigger>
                <TabsTrigger value="search">Add Tracks</TabsTrigger>
              </TabsList>
              
              <TabsContent value="queue">
                <TrackQueue 
                  partyId={params.id} 
                  isHost={isHost}
                  currentUserId={session.user.id}
                />
              </TabsContent>
              
              <TabsContent value="search">
                <TrackSearch partyId={params.id} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}