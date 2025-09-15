// apps/web/app/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import Link from "next/link";
import { redirect } from "next/navigation";
import { storage } from "@/lib/storage-factory";
import { Party } from "@/types";
import { PartyPopper, Users, User, LogOut } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AppleMusicConnect } from '@/components/apple-music/AppleMusicConnect';
import { EnhancedMusicPortrait } from '@/components/music/MusicPortraitDisplay';
import { SignOutButton } from '@/components/auth/SignOutButton';

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/auth/signin");
  }

  // Get user data
  const user = await storage.getUserByEmail(session.user.email);
  
  // Get user's parties
  const allParties = await storage.getAllParties();
  const userParties = allParties.filter((party: Party) => 
    party.hostId === user?.id || party.memberIds?.includes(user?.id || '')
  );

  const hostedParties = userParties.filter((party: Party) => party.hostId === user?.id);
  const joinedParties = userParties.filter((party: Party) => party.hostId !== user?.id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">TootFM</h1>
            <p className="text-purple-200">Democratic DJ for your parties</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-200">
              {session.user?.email}
            </span>
            <SignOutButton />
          </div>
        </header>

        {/* Music Services Status */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Spotify Card */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Spotify</CardTitle>
              <CardDescription className="text-purple-200">
                {user?.spotifyProfile ? 
                  `Connected as ${user.spotifyProfile.displayName}` : 
                  "Not connected"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!user?.spotifyProfile && (
                <Link href="/api/auth/spotify/connect">
                  <Button className="w-full bg-green-500 hover:bg-green-600">
                    Connect Spotify
                  </Button>
                </Link>
              )}
              {user?.spotifyProfile && (
                <div className="space-y-2">
                  <p className="text-sm text-purple-200">
                    Premium: {user.spotifyProfile.product === 'premium' ? '✓' : '✗'}
                  </p>
                  <Link href="/api/music/portrait">
                    <Button variant="secondary" className="w-full">
                      Generate Music Portrait
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Apple Music Card */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Apple Music</CardTitle>
              <CardDescription className="text-purple-200">
                {user?.appleMusicProfile ? "Connected" : "Not connected"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!user?.appleMusicProfile ? (
                <AppleMusicConnect />
              ) : (
                <div className="flex items-center gap-2 text-green-600">
                  <span>✅ Apple Music Connected</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Music Portrait Section */}
        {(user?.spotifyProfile || user?.appleMusicProfile) && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Your Music Portrait</h2>
            <EnhancedMusicPortrait />
          </div>
        )}

        {/* Party Actions */}
        <div className="flex gap-4 mb-8">
          <Link href="/party/create" className="flex-1">
            <Button className="w-full bg-purple-600 hover:bg-purple-700">
              <PartyPopper className="w-4 h-4 mr-2" />
              Create Party
            </Button>
          </Link>
          <Link href="/party/join" className="flex-1">
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
              <Users className="w-4 h-4 mr-2" />
              Join Party
            </Button>
          </Link>
        </div>

        {/* User's Parties */}
        <div className="space-y-6">
          {/* Hosted Parties */}
          {hostedParties.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Your Parties</h2>
              <div className="grid gap-4">
                {hostedParties.map((party: Party) => (
                  <Link key={party.id} href={`/party/${party.id}`}>
                    <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20 transition-colors cursor-pointer">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-white">{party.name}</CardTitle>
                            <CardDescription className="text-purple-200">
                              Code: {party.code} • {party.memberIds?.length || 0} members
                            </CardDescription>
                          </div>
                          <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded">
                            Host
                          </span>
                        </div>
                      </CardHeader>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Joined Parties */}
          {joinedParties.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Joined Parties</h2>
              <div className="grid gap-4">
                {joinedParties.map((party: Party) => (
                  <Link key={party.id} href={`/party/${party.id}`}>
                    <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20 transition-colors cursor-pointer">
                      <CardHeader>
                        <CardTitle className="text-white">{party.name}</CardTitle>
                        <CardDescription className="text-purple-200">
                          Code: {party.code} • {party.memberIds?.length || 0} members
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* No Parties */}
          {userParties.length === 0 && (
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardContent className="text-center py-12">
                <PartyPopper className="w-16 h-16 mx-auto mb-4 text-purple-300" />
                <p className="text-xl text-white mb-2">No parties yet</p>
                <p className="text-purple-200">Create or join a party to get started!</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}