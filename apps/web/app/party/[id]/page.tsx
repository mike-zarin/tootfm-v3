// apps/web/app/party/[id]/page.tsx
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { storage } from '@/lib/storage-factory';
import Link from 'next/link';
import { SpotifyPlayer } from '@/components/spotify/SpotifyPlayer';
import { SpotifyConnect } from '@/components/spotify/SpotifyConnect';
import { TrackQueue } from '@/components/music/TrackQueue';
import TrackSearch from '@/components/music/TrackSearch';
import { CopyCodeButton } from '@/components/party/CopyCodeButton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import type { Track } from '@/types';
export default async function PartyPage({
  params
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    notFound();
  }
  const party = await storage.getParty(params.id);
  if (!party) {
    notFound();
  }
  const user = await storage.getUserByEmail(session.user.email);
  if (!user) {
    notFound();
  }
  const isHost = party.hostId === user.id;
  const members = await storage.getPartyMembers(params.id);
  const tracks = await storage.getTracks(params.id);
  // Проверяем подключен ли Spotify
  const spotifyProfile = user.spotifyProfile || await storage.getSpotifyProfile(user.id);
  const hasSpotify = !!(spotifyProfile?.accessToken);
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
        <div className="container mx-auto px-4 py-8">
          <Link 
            href="/"
            className="inline-flex items-center text-purple-200 hover:text-white mb-6 transition-colors"
          >
            <span className="mr-2">←</span> Back to Home
          </Link>
          <div className="max-w-7xl mx-auto space-y-6">
          {/* Party Header Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-white/20">
            <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
              <div className="flex-1">
                <div className="flex items-start gap-4 mb-4">
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                      {party.name}
                    </h1>
                    {party.description && (
                      <p className="text-purple-200 text-lg">{party.description}</p>
                    )}
                  </div>
                  {isHost && (
                    <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      HOST
                    </span>
                  )}
                </div>
                {/* Status Indicator */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-purple-300">Status:</span>
                  <span className={`font-bold text-lg ${
                    party.status === 'ACTIVE' ? 'text-green-400' : 
                    party.status === 'WAITING' ? 'text-yellow-400' : 
                    party.status === 'PAUSED' ? 'text-orange-400' : 'text-gray-400'
                  }`}>
                    {party.status === 'WAITING' ? '⏳ Waiting to Start' :
                     party.status === 'ACTIVE' ? '🎵 Playing' :
                     party.status === 'PAUSED' ? '⏸ Paused' : '⏹ Ended'}
                  </span>
                </div>
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white/10 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-white">{members?.length || 0}</p>
                    <p className="text-purple-300 text-sm">Members</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-white">{tracks?.length || 0}</p>
                    <p className="text-purple-300 text-sm">Tracks</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-white">
                      {tracks?.filter((t: Track) => t.playedAt).length || 0}
                    </p>
                    <p className="text-purple-300 text-sm">Played</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-white">
                      {hasSpotify ? '✅' : '❌'}
                    </p>
                    <p className="text-purple-300 text-sm">Spotify</p>
                  </div>
                </div>
              </div>
              {/* Party Code Section */}
              <div className="lg:text-center">
                <p className="text-purple-300 text-sm mb-2">Share this code:</p>
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-1 rounded-xl">
                  <div className="bg-purple-900 rounded-lg px-8 py-4">
                    <p className="text-4xl md:text-5xl font-mono font-bold text-white tracking-wider">
                      {party.code}
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  <CopyCodeButton code={party.code} />
                </div>
              </div>
            </div>
          </div>
          {/* Spotify Connection Status */}
          {!hasSpotify && (
            <div className="bg-yellow-500/20 border-2 border-yellow-500/50 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-yellow-200 font-semibold text-lg mb-1">
                    🎵 Connect Spotify to unlock all features
                  </h3>
                  <p className="text-yellow-100/80 text-sm">
                    Add music, control playback, and see what's playing
                  </p>
                </div>
                <SpotifyConnect />
              </div>
            </div>
          )}
          {/* Now Playing Section - Always visible for all participants */}
          <div className="sticky top-4 z-10">
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Currently Playing</CardTitle>
                <CardDescription className="text-purple-200">
                  {party.currentTrackId ? 
                    `Track ID: ${party.currentTrackId}` : 
                    'No track currently playing'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🎵</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold">
                      {party.currentTrackId ? 'Track is playing' : 'No track selected'}
                    </p>
                    <p className="text-purple-300 text-sm">
                      {party.isPlaying ? '▶️ Playing' : '⏸️ Paused'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          {/* Spotify Player - Only for host when Spotify is connected */}
          {hasSpotify && isHost && party.status === 'ACTIVE' && tracks.length > 0 && (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-4">Player Controls</h2>
              <SpotifyPlayer 
                partyId={params.id}
                isHost={isHost}
              />
            </div>
          )}
          {/* Main Content Tabs */}
          <Tabs defaultValue="tracks" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-white/10">
              <TabsTrigger value="tracks" className="text-white data-[state=active]:bg-purple-600">
                Tracks ({tracks?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="members" className="text-white data-[state=active]:bg-purple-600">
                Members ({members?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="search" className="text-white data-[state=active]:bg-purple-600">
                Add Music
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="tracks" className="mt-6">
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Track Queue</CardTitle>
                  <CardDescription className="text-purple-200">
                    Current playlist for this party
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TrackQueue 
                    partyId={params.id}
                    isHost={isHost}
                    currentUserId={user.id}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="members" className="mt-6">
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Party Members</CardTitle>
                  <CardDescription className="text-purple-200">
                    People who joined this party
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {members?.map((member: any) => (
                      <div key={member.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                        <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold">
                            {member.name?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-medium">{member.name || 'Unknown User'}</p>
                          <p className="text-purple-300 text-sm">{member.email}</p>
                        </div>
                        <Badge variant={member.role === 'host' ? 'default' : 'secondary'}>
                          {member.role}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="search" className="mt-6">
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Add Music</CardTitle>
                  <CardDescription className="text-purple-200">
                    Search and add tracks to the party
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {hasSpotify ? (
                    <TrackSearch partyId={params.id} />
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-purple-200 mb-4">Connect Spotify to add music</p>
                      <SpotifyConnect />
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
