import SpotifyWebApi from 'spotify-web-api-node';
import { storage } from './storage';
// Initialize Spotify API
export const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID!,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI!,
});
// Scopes needed for the app
export const SPOTIFY_SCOPES = [
  'user-read-email',
  'user-read-private',
  'user-top-read',
  'user-read-recently-played',
  'user-library-read',
  'playlist-read-private',
  'playlist-read-collaborative',
  'streaming',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
];
// Generate auth URL
export function getSpotifyAuthUrl(state: string = 'default'): string {
  return spotifyApi.createAuthorizeURL(SPOTIFY_SCOPES, state);
}
// Exchange authorization code for tokens
export async function exchangeCodeForTokens(code: string) {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(
        `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
      ).toString('base64')
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: process.env.SPOTIFY_REDIRECT_URI!,
    }),
  });
  if (!response.ok) {
    throw new Error('Failed to exchange code for tokens');
  }
  return response.json();
}
// Refresh access token
export async function refreshSpotifyToken(refreshToken: string) {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(
        `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
      ).toString('base64')
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });
  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }
  return response.json();
}
// Get authenticated Spotify client for a user
export async function getSpotifyClient(userId: string): Promise<SpotifyWebApi> {
  const profile = await storage.getSpotifyProfile(userId);
  if (!profile) {
    throw new Error('Spotify not connected');
  }
  // Check if token needs refresh (expires in less than 5 minutes)
  const now = new Date();
  const expiresAt = new Date(profile.expiresAt);
  const needsRefresh = expiresAt.getTime() - now.getTime() < 5 * 60 * 1000;
  if (needsRefresh) {
    const tokens = await refreshSpotifyToken(profile.refreshToken);
    await storage.updateSpotifyTokens(
      userId,
      tokens.access_token,
      profile.refreshToken,
      tokens.expires_in
    );
    const client = new SpotifyWebApi({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      redirectUri: process.env.SPOTIFY_REDIRECT_URI!,
      accessToken: tokens.access_token,
    });
    return client;
  }
  const client = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID!,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI!,
    accessToken: profile.accessToken,
  });
  return client;
}
// Search tracks
export async function searchTracks(userId: string, query: string, limit: number = 20) {
  const spotify = await getSpotifyClient(userId);
  const results = await spotify.searchTracks(query, { limit });
  return results.body.tracks?.items || [];
}
// Get user's top tracks
export async function getUserTopTracks(userId: string, timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term') {
  const spotify = await getSpotifyClient(userId);
  const results = await spotify.getMyTopTracks({ time_range: timeRange, limit: 50 });
  return results.body.items;
}
// Get user's top artists
export async function getUserTopArtists(userId: string, timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term') {
  const spotify = await getSpotifyClient(userId);
  const results = await spotify.getMyTopArtists({ time_range: timeRange, limit: 50 });
  return results.body.items;
}
// Get audio features for tracks
export async function getAudioFeatures(userId: string, trackIds: string[]) {
  const spotify = await getSpotifyClient(userId);
  const results = await spotify.getAudioFeaturesForTracks(trackIds);
  return results.body.audio_features;
}