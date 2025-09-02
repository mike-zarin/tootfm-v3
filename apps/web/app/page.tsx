// apps/web/app/page.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { storage } from "@/lib/storage";
import { Party } from "@/types";

export default async function HomePage() {
  const session = await getServerSession();

  if (!session?.user?.email) {
    redirect("/auth/signin");
  }

  // Получаем данные пользователя из storage - ВАЖНО: getUserByEmail это async функция!
  const user = await storage.getUserByEmail(session.user.email);
  
  // Получаем партии пользователя
  // storage использует методы, а не прямой доступ к data
  const userParties: Party[] = [];

  // Проверяем статус подключений
  const hasSpotify = !!(user?.spotifyProfile?.accessToken);
  const hasAppleMusic = !!(user?.appleMusicProfile);
  const hasPortrait = !!(user?.musicPortrait);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-white mb-2">tootFM</h1>
          <p className="text-xl text-purple-200">Democratic DJ for your parties</p>
        </div>

        {/* Welcome Section */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            Welcome, {session.user.name || "Music Lover"}!
          </h2>
          <p className="text-purple-200">
            {hasSpotify 
              ? "Your Spotify is connected. Ready to party!" 
              : "Connect your music service to get started"}
          </p>
        </div>

        {/* Music Services */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Spotify Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🎵</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">Spotify</h3>
                  <p className="text-sm text-purple-200">
                    {hasSpotify 
                      ? `Connected as ${user?.spotifyProfile?.displayName}` 
                      : "Not connected"}
                  </p>
                </div>
              </div>
            </div>
            {!hasSpotify && (
              <Link
                href="/api/auth/spotify/connect"
                className="block w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg text-center transition-colors"
              >
                Connect Spotify
              </Link>
            )}
            {hasSpotify && (
              <div className="space-y-2">
                <p className="text-sm text-purple-200">
                  Premium: {user?.spotifyProfile?.product === 'premium' ? '✓' : '✗'}
                </p>
                {!hasPortrait && (
                  <Link
                    href="/api/music/portrait"
                    className="block w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg text-center transition-colors text-sm"
                  >
                    Generate Music Portrait
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Apple Music Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🎵</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">Apple Music</h3>
                  <p className="text-sm text-purple-200">
                    {hasAppleMusic ? "Connected" : "Not connected"}
                  </p>
                </div>
              </div>
            </div>
            {!hasAppleMusic && (
              <Link
                href="/api/auth/apple-music/login"
                className="block w-full bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg text-center transition-colors"
              >
                Connect Apple Music
              </Link>
            )}
            {hasAppleMusic && (
              <div className="space-y-2">
                <p className="text-sm text-purple-200">
                  Connected ✓
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Link
            href="/party/create"
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-6 rounded-xl text-center transition-colors"
          >
            🎉 Create Party
          </Link>
          <Link
            href="/party/join"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-6 rounded-xl text-center transition-colors"
          >
            🎊 Join Party
          </Link>
          <button
            disabled
            className="bg-gray-600 text-gray-300 font-semibold py-4 px-6 rounded-xl text-center cursor-not-allowed"
          >
            👤 My Profile (Coming Soon)
          </button>
        </div>

        {/* Your Parties */}
        {userParties.length > 0 && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
            <h3 className="text-2xl font-bold text-white mb-4">Your Parties</h3>
            <div className="grid gap-4">
              {userParties.map((party) => (
                <Link
                  key={party.id}
                  href={`/party/${party.id}`}
                  className="bg-white/10 hover:bg-white/20 rounded-lg p-4 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-lg font-semibold text-white">{party.name}</h4>
                      <p className="text-sm text-purple-200">Code: {party.code}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-purple-200">{party.status}</p>
                      <p className="text-xs text-purple-300">
                        Members: N/A
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}