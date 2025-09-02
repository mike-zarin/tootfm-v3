#!/usr/bin/env node

/**
 * Smart Spotify Integration Script for tootFM
 * This script safely adds Spotify integration to the existing project
 * Run: node scripts/add-spotify-integration.js
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m'
};

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.blue}═══ ${msg} ═══${colors.reset}\n`)
};

// Project paths
const PROJECT_ROOT = process.cwd();
const WEB_ROOT = path.join(PROJECT_ROOT, 'apps/web');
const API_ROOT = path.join(WEB_ROOT, 'app/api');
const LIB_ROOT = path.join(WEB_ROOT, 'lib');
const TYPES_ROOT = path.join(WEB_ROOT, 'types');
const COMPONENTS_ROOT = path.join(WEB_ROOT, 'components');

// Step 1: Analyze current project structure
async function analyzeProject() {
  log.header('ANALYZING PROJECT STRUCTURE');
  
  const checks = {
    hasStorageLib: false,
    hasAuthConfig: false,
    hasTypesIndex: false,
    hasSpotifyPackage: false,
    hasDataJson: false,
    existingSpotifyFiles: []
  };

  try {
    // Check critical files
    checks.hasStorageLib = await fileExists(path.join(LIB_ROOT, 'storage.ts'));
    checks.hasAuthConfig = await fileExists(path.join(LIB_ROOT, 'auth-config.ts'));
    checks.hasTypesIndex = await fileExists(path.join(TYPES_ROOT, 'index.ts'));
    checks.hasDataJson = await fileExists(path.join(WEB_ROOT, 'data.json'));

    // Check package.json for spotify dependency
    const packageJson = JSON.parse(await fs.readFile(path.join(WEB_ROOT, 'package.json'), 'utf8'));
    checks.hasSpotifyPackage = !!packageJson.dependencies?.['spotify-web-api-node'];

    // Find existing Spotify-related files
    const spotifyFiles = await findFiles(WEB_ROOT, 'spotify');
    checks.existingSpotifyFiles = spotifyFiles;

    // Report findings
    log.success(`Storage system: ${checks.hasStorageLib ? 'JSON Storage' : 'Not found'}`);
    log.success(`Auth config: ${checks.hasAuthConfig ? 'Found' : 'Missing'}`);
    log.success(`Types: ${checks.hasTypesIndex ? 'Found' : 'Missing'}`);
    log.success(`Spotify package: ${checks.hasSpotifyPackage ? 'Installed' : 'Not installed'}`);
    
    if (checks.existingSpotifyFiles.length > 0) {
      log.warning(`Found ${checks.existingSpotifyFiles.length} existing Spotify files`);
    }

    return checks;
  } catch (error) {
    log.error(`Analysis failed: ${error.message}`);
    process.exit(1);
  }
}

// Step 2: Update Types
async function updateTypes(checks) {
  log.header('UPDATING TYPE DEFINITIONS');

  const typesFile = path.join(TYPES_ROOT, 'index.ts');
  let typesContent = '';

  if (checks.hasTypesIndex) {
    typesContent = await fs.readFile(typesFile, 'utf8');
  }

  // Check if SpotifyProfile already exists
  if (!typesContent.includes('SpotifyProfile')) {
    const spotifyTypes = `
// Spotify Integration Types
export interface SpotifyProfile {
  id: string;
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  spotifyId: string;
  displayName?: string;
  email?: string;
  product?: string;
  country?: string;
  images?: { url: string }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SpotifyTrack {
  id: string;
  uri: string;
  name: string;
  artists: { id: string; name: string }[];
  album: {
    id: string;
    name: string;
    images: { url: string; width?: number; height?: number }[];
  };
  duration_ms: number;
  explicit: boolean;
  preview_url?: string;
  popularity?: number;
  isrc?: string;
}

export interface SpotifyPlayerState {
  partyId: string;
  isPlaying: boolean;
  currentTrack?: SpotifyTrack;
  position: number;
  deviceId?: string;
  volume: number;
  shuffle: boolean;
  repeat: 'off' | 'context' | 'track';
}
`;

    typesContent += spotifyTypes;
    await fs.writeFile(typesFile, typesContent);
    log.success('Added Spotify type definitions');
  } else {
    log.info('Spotify types already exist');
  }
}

// Step 3: Update Storage
async function updateStorage(checks) {
  log.header('UPDATING STORAGE SYSTEM');

  if (!checks.hasStorageLib) {
    log.error('Storage system not found!');
    return;
  }

  const storageFile = path.join(LIB_ROOT, 'storage.ts');
  let storageContent = await fs.readFile(storageFile, 'utf8');

  // Check if Spotify methods already exist
  if (!storageContent.includes('spotifyProfiles')) {
    log.info('Adding Spotify storage methods...');

    // Find the class definition
    const classMatch = storageContent.match(/class\s+Storage\s*{[^}]*}/s);
    if (!classMatch) {
      log.error('Could not find Storage class');
      return;
    }

    // Add Spotify methods before the last closing brace of the class
    const spotifyMethods = `
  // Spotify Integration Methods
  async getSpotifyProfile(userId: string): Promise<SpotifyProfile | null> {
    const data = await this.read();
    return data.spotifyProfiles?.find((p: SpotifyProfile) => p.userId === userId) || null;
  }

  async saveSpotifyProfile(profile: SpotifyProfile): Promise<SpotifyProfile> {
    const data = await this.read();
    if (!data.spotifyProfiles) data.spotifyProfiles = [];
    
    const existingIndex = data.spotifyProfiles.findIndex((p: SpotifyProfile) => p.userId === profile.userId);
    if (existingIndex >= 0) {
      data.spotifyProfiles[existingIndex] = profile;
    } else {
      data.spotifyProfiles.push(profile);
    }
    
    await this.write(data);
    return profile;
  }

  async updateSpotifyTokens(userId: string, accessToken: string, refreshToken: string, expiresIn: number): Promise<void> {
    const profile = await this.getSpotifyProfile(userId);
    if (profile) {
      profile.accessToken = accessToken;
      profile.refreshToken = refreshToken;
      profile.expiresAt = new Date(Date.now() + expiresIn * 1000);
      profile.updatedAt = new Date();
      await this.saveSpotifyProfile(profile);
    }
  }

  async removeSpotifyProfile(userId: string): Promise<void> {
    const data = await this.read();
    if (data.spotifyProfiles) {
      data.spotifyProfiles = data.spotifyProfiles.filter((p: SpotifyProfile) => p.userId !== userId);
      await this.write(data);
    }
  }`;

    // Insert methods before the last brace
    const lastBraceIndex = storageContent.lastIndexOf('}');
    storageContent = storageContent.slice(0, lastBraceIndex) + spotifyMethods + '\n' + storageContent.slice(lastBraceIndex);

    // Add SpotifyProfile import if not present
    if (!storageContent.includes('SpotifyProfile')) {
      storageContent = storageContent.replace(
        /import\s+{([^}]+)}\s+from\s+['"]@\/types['"]/,
        (match, imports) => {
          const importList = imports.split(',').map(s => s.trim());
          if (!importList.includes('SpotifyProfile')) {
            importList.push('SpotifyProfile');
          }
          return `import { ${importList.join(', ')} } from '@/types'`;
        }
      );
    }

    await fs.writeFile(storageFile, storageContent);
    log.success('Updated storage with Spotify methods');
  } else {
    log.info('Spotify storage methods already exist');
  }

  // Update data.json structure
  const dataFile = path.join(WEB_ROOT, 'data.json');
  if (checks.hasDataJson) {
    const data = JSON.parse(await fs.readFile(dataFile, 'utf8'));
    if (!data.spotifyProfiles) {
      data.spotifyProfiles = [];
      await fs.writeFile(dataFile, JSON.stringify(data, null, 2));
      log.success('Added spotifyProfiles to data.json');
    }
  }
}

// Step 4: Create Spotify API files
async function createSpotifyFiles() {
  log.header('CREATING SPOTIFY API FILES');

  // 1. Create callback route
  const callbackDir = path.join(API_ROOT, 'auth/spotify/callback');
  await fs.mkdir(callbackDir, { recursive: true });
  
  const callbackRoute = `import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth-config';
import { storage } from '@/lib/storage';
import { spotifyApi, exchangeCodeForTokens } from '@/lib/spotify';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(\`\${process.env.NEXTAUTH_URL}/party?error=spotify_denied\`);
    }

    if (!code || !state) {
      return NextResponse.redirect(\`\${process.env.NEXTAUTH_URL}/party?error=invalid_callback\`);
    }

    const session = await getServerSession(authConfig);
    if (!session?.user?.email) {
      return NextResponse.redirect(\`\${process.env.NEXTAUTH_URL}/auth/signin\`);
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);
    
    // Get Spotify user profile
    spotifyApi.setAccessToken(tokens.access_token);
    const me = await spotifyApi.getMe();

    // Save to storage
    const user = await storage.getUserByEmail(session.user.email);
    if (user) {
      await storage.saveSpotifyProfile({
        id: \`spotify_\${user.id}\`,
        userId: user.id,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        spotifyId: me.body.id,
        displayName: me.body.display_name,
        email: me.body.email,
        product: me.body.product,
        country: me.body.country,
        images: me.body.images,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Redirect based on state (party ID or default)
    const redirectUrl = state !== 'default' 
      ? \`\${process.env.NEXTAUTH_URL}/party/\${state}\`
      : \`\${process.env.NEXTAUTH_URL}/party\`;

    return NextResponse.redirect(\`\${redirectUrl}?spotify=connected\`);
  } catch (error) {
    console.error('Spotify callback error:', error);
    return NextResponse.redirect(\`\${process.env.NEXTAUTH_URL}/party?error=spotify_error\`);
  }
}`;

  await fs.writeFile(path.join(callbackDir, 'route.ts'), callbackRoute);
  log.success('Created Spotify callback route');

  // 2. Create connect route
  const connectDir = path.join(API_ROOT, 'auth/spotify/connect');
  await fs.mkdir(connectDir, { recursive: true });

  const connectRoute = `import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth-config';
import { getSpotifyAuthUrl } from '@/lib/spotify';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authConfig);
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const state = searchParams.get('state') || 'default';
  
  const authUrl = getSpotifyAuthUrl(state);
  return NextResponse.json({ url: authUrl });
}`;

  await fs.writeFile(path.join(connectDir, 'route.ts'), connectRoute);
  log.success('Created Spotify connect route');

  // 3. Create token refresh route
  const refreshDir = path.join(API_ROOT, 'auth/spotify/refresh');
  await fs.mkdir(refreshDir, { recursive: true });

  const refreshRoute = `import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth-config';
import { storage } from '@/lib/storage';
import { refreshSpotifyToken } from '@/lib/spotify';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await storage.getUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const spotifyProfile = await storage.getSpotifyProfile(user.id);
    if (!spotifyProfile) {
      return NextResponse.json({ error: 'Spotify not connected' }, { status: 404 });
    }

    const tokens = await refreshSpotifyToken(spotifyProfile.refreshToken);
    
    await storage.updateSpotifyTokens(
      user.id,
      tokens.access_token,
      spotifyProfile.refreshToken,
      tokens.expires_in
    );

    return NextResponse.json({
      accessToken: tokens.access_token,
      expiresIn: tokens.expires_in
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json({ error: 'Failed to refresh token' }, { status: 500 });
  }
}`;

  await fs.writeFile(path.join(refreshDir, 'route.ts'), refreshRoute);
  log.success('Created Spotify refresh route');

  // 4. Create player control routes
  const playerDir = path.join(API_ROOT, 'spotify/player');
  await fs.mkdir(playerDir, { recursive: true });

  const playerRoute = `import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth-config';
import { storage } from '@/lib/storage';
import { getSpotifyClient } from '@/lib/spotify';

// Play/Resume
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { deviceId, uris, position_ms = 0 } = body;

    const user = await storage.getUserByEmail(session.user.email);
    const spotifyProfile = await storage.getSpotifyProfile(user!.id);
    
    if (!spotifyProfile) {
      return NextResponse.json({ error: 'Spotify not connected' }, { status: 404 });
    }

    const spotify = await getSpotifyClient(user!.id);
    
    if (uris && uris.length > 0) {
      // Play specific tracks
      await spotify.play({
        device_id: deviceId,
        uris: uris,
        position_ms: position_ms
      });
    } else {
      // Resume playback
      await spotify.play({ device_id: deviceId });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Player error:', error);
    return NextResponse.json({ error: 'Playback failed' }, { status: 500 });
  }
}

// Pause
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await storage.getUserByEmail(session.user.email);
    const spotify = await getSpotifyClient(user!.id);
    
    await spotify.pause();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Pause error:', error);
    return NextResponse.json({ error: 'Pause failed' }, { status: 500 });
  }
}

// Get player state
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await storage.getUserByEmail(session.user.email);
    const spotify = await getSpotifyClient(user!.id);
    
    const state = await spotify.getMyCurrentPlaybackState();
    return NextResponse.json(state.body);
  } catch (error) {
    console.error('Get state error:', error);
    return NextResponse.json({ error: 'Failed to get player state' }, { status: 500 });
  }
}`;

  await fs.writeFile(path.join(playerDir, 'route.ts'), playerRoute);
  log.success('Created Spotify player routes');
}

// Step 5: Create Spotify lib
async function createSpotifyLib() {
  log.header('CREATING SPOTIFY LIBRARY');

  const spotifyLib = `import SpotifyWebApi from 'spotify-web-api-node';
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
        \`\${process.env.SPOTIFY_CLIENT_ID}:\${process.env.SPOTIFY_CLIENT_SECRET}\`
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
        \`\${process.env.SPOTIFY_CLIENT_ID}:\${process.env.SPOTIFY_CLIENT_SECRET}\`
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
}`;

  await fs.writeFile(path.join(LIB_ROOT, 'spotify.ts'), spotifyLib);
  log.success('Created Spotify library');
}

// Step 6: Create Spotify React components
async function createSpotifyComponents() {
  log.header('CREATING SPOTIFY COMPONENTS');

  const spotifyDir = path.join(COMPONENTS_ROOT, 'spotify');
  await fs.mkdir(spotifyDir, { recursive: true });

  // 1. SpotifyConnect component
  const spotifyConnect = `'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

interface SpotifyConnectProps {
  partyId?: string;
  onConnected?: () => void;
}

export function SpotifyConnect({ partyId, onConnected }: SpotifyConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      
      const response = await fetch(\`/api/auth/spotify/connect\${partyId ? \`?state=\${partyId}\` : ''}\`);
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Failed to get auth URL');
      }
    } catch (error) {
      console.error('Spotify connect error:', error);
      toast({
        title: 'Connection Failed',
        description: 'Could not connect to Spotify. Please try again.',
        variant: 'destructive',
      });
      setIsConnecting(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Connect Spotify</h3>
            <p className="text-sm text-muted-foreground">
              Link your Spotify account to play music
            </p>
          </div>
        </div>
        <Button 
          onClick={handleConnect}
          disabled={isConnecting}
          className="w-full bg-green-500 hover:bg-green-600"
        >
          {isConnecting ? 'Connecting...' : 'Connect Spotify'}
        </Button>
      </div>
    </Card>
  );
}`;

  await fs.writeFile(path.join(spotifyDir, 'SpotifyConnect.tsx'), spotifyConnect);
  log.success('Created SpotifyConnect component');

  // 2. SpotifyPlayer component
  const spotifyPlayer = `'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/components/ui/use-toast';

interface SpotifyPlayerProps {
  partyId: string;
  isHost: boolean;
}

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: any;
  }
}

export function SpotifyPlayer({ partyId, isHost }: SpotifyPlayerProps) {
  const [player, setPlayer] = useState<any>(null);
  const [deviceId, setDeviceId] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(50);
  const { toast } = useToast();

  const initializePlayer = useCallback(async () => {
    // Get access token
    const tokenResponse = await fetch('/api/auth/spotify/refresh', { method: 'POST' });
    const { accessToken } = await tokenResponse.json();

    if (!accessToken) {
      toast({
        title: 'Spotify Not Connected',
        description: 'Please connect your Spotify account first.',
        variant: 'destructive',
      });
      return;
    }

    const player = new window.Spotify.Player({
      name: 'tootFM Web Player',
      getOAuthToken: async (cb: (token: string) => void) => {
        // Refresh token if needed
        const response = await fetch('/api/auth/spotify/refresh', { method: 'POST' });
        const data = await response.json();
        cb(data.accessToken);
      },
      volume: volume / 100,
    });

    // Ready
    player.addListener('ready', ({ device_id }: { device_id: string }) => {
      console.log('Ready with Device ID', device_id);
      setDeviceId(device_id);
      toast({
        title: 'Player Ready',
        description: 'Spotify player is ready to play music!',
      });
    });

    // Not Ready
    player.addListener('not_ready', ({ device_id }: { device_id: string }) => {
      console.log('Device ID has gone offline', device_id);
    });

    // Player state changed
    player.addListener('player_state_changed', (state: any) => {
      if (!state) return;

      setCurrentTrack(state.track_window.current_track);
      setPosition(state.position);
      setDuration(state.duration);
      setIsPlaying(!state.paused);
    });

    // Connect to the player
    player.connect();
    setPlayer(player);
  }, [volume, toast]);

  // Load Spotify SDK
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;

    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      initializePlayer();
    };

    return () => {
      if (player) {
        player.disconnect();
      }
    };
  }, []);

  const handlePlayPause = async () => {
    if (!player) return;

    if (isPlaying) {
      await fetch('/api/spotify/player', { method: 'POST' });
    } else {
      await fetch('/api/spotify/player', { 
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId })
      });
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (player) {
      player.setVolume(newVolume / 100);
    }
  };

  const handleSkip = async () => {
    if (!player) return;
    player.nextTrack();
  };

  const handlePrevious = async () => {
    if (!player) return;
    player.previousTrack();
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / 1000 / 60) % 60);
    return \`\${minutes}:\${seconds.toString().padStart(2, '0')}\`;
  };

  if (!deviceId) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Initializing Spotify Player...</p>
          <p className="text-sm text-muted-foreground">
            Make sure you have Spotify Premium and the web player is allowed in your browser.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {currentTrack ? (
          <div className="flex items-center gap-4">
            <img 
              src={currentTrack.album.images[0]?.url} 
              alt={currentTrack.album.name}
              className="w-16 h-16 rounded"
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{currentTrack.name}</p>
              <p className="text-sm text-muted-foreground truncate">
                {currentTrack.artists.map((a: any) => a.name).join(', ')}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No track playing</p>
          </div>
        )}

        <div className="space-y-2">
          <Slider
            value={[position]}
            max={duration}
            step={1000}
            className="w-full"
            disabled={!isHost}
            onValueChange={(value) => {
              if (player && isHost) {
                player.seek(value[0]);
              }
            }}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(position)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {isHost && (
          <div className="flex items-center justify-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={handlePrevious}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.445 14.832A1 1 0 0010 14v-8a1 1 0 00-1.555-.832L3 9.168a1 1 0 000 1.664l5.445 4z"/>
                <path d="M1 10a1 1 0 011-1h.01a1 1 0 110 2H2a1 1 0 01-1-1z"/>
              </svg>
            </Button>
            
            <Button
              size="icon"
              onClick={handlePlayPause}
              className="w-12 h-12"
            >
              {isPlaying ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"/>
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"/>
                </svg>
              )}
            </Button>
            
            <Button
              size="icon"
              variant="ghost"
              onClick={handleSkip}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M11.555 5.168a1 1 0 00-1.555.832v8a1 1 0 001.555.832L17 10.832a1 1 0 000-1.664l-5.445-4z"/>
                <path d="M19 10a1 1 0 00-1-1h-.01a1 1 0 100 2H18a1 1 0 001-1z"/>
              </svg>
            </Button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z"/>
          </svg>
          <Slider
            value={[volume]}
            max={100}
            step={1}
            className="w-24"
            onValueChange={handleVolumeChange}
          />
        </div>
      </div>
    </Card>
  );
}`;

  await fs.writeFile(path.join(spotifyDir, 'SpotifyPlayer.tsx'), spotifyPlayer);
  log.success('Created SpotifyPlayer component');

  // 3. Update exports
  const indexFile = `export { SpotifyConnect } from './SpotifyConnect';
export { SpotifyPlayer } from './SpotifyPlayer';`;

  await fs.writeFile(path.join(spotifyDir, 'index.ts'), indexFile);
  log.success('Created Spotify components index');
}

// Step 7: Check environment variables
async function checkEnvVariables() {
  log.header('CHECKING ENVIRONMENT VARIABLES');

  const envFile = path.join(WEB_ROOT, '.env.local');
  let envContent = '';
  let hasEnvFile = false;

  try {
    envContent = await fs.readFile(envFile, 'utf8');
    hasEnvFile = true;
  } catch {
    log.warning('.env.local not found, creating template...');
  }

  const requiredVars = [
    'SPOTIFY_CLIENT_ID',
    'SPOTIFY_CLIENT_SECRET',
    'SPOTIFY_REDIRECT_URI'
  ];

  const missingVars = [];
  for (const varName of requiredVars) {
    if (!envContent.includes(varName)) {
      missingVars.push(varName);
    }
  }

  if (missingVars.length > 0) {
    log.warning(`Missing environment variables: ${missingVars.join(', ')}`);
    
    const template = `
# Spotify Integration (added by script)
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/auth/spotify/callback
`;

    if (hasEnvFile) {
      envContent += template;
    } else {
      envContent = template;
    }

    await fs.writeFile(envFile, envContent);
    log.success('Added Spotify env variables template to .env.local');
    log.warning('Please update the Spotify credentials in .env.local');
  } else {
    log.success('All required Spotify env variables are configured');
  }
}

// Helper functions
async function fileExists(filepath) {
  try {
    await fs.access(filepath);
    return true;
  } catch {
    return false;
  }
}

async function findFiles(dir, pattern) {
  const files = [];
  
  async function walk(currentDir) {
    try {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          await walk(fullPath);
        } else if (entry.isFile() && entry.name.toLowerCase().includes(pattern)) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }
  
  await walk(dir);
  return files;
}

// Main execution
async function main() {
  console.log(`
${colors.bright}${colors.cyan}
╔══════════════════════════════════════════════╗
║     tootFM Spotify Integration Installer     ║
║              Smart & Safe Update              ║
╚══════════════════════════════════════════════╝
${colors.reset}`);

  try {
    // Step 1: Analyze
    const projectState = await analyzeProject();
    
    if (!projectState.hasStorageLib) {
      log.error('Storage system not found! This script requires the JSON storage to be set up.');
      process.exit(1);
    }

    // Step 2: Update types
    await updateTypes(projectState);

    // Step 3: Update storage
    await updateStorage(projectState);

    // Step 4: Create API routes
    await createSpotifyFiles();

    // Step 5: Create lib
    await createSpotifyLib();

    // Step 6: Create components
    await createSpotifyComponents();

    // Step 7: Check env
    await checkEnvVariables();

    // Final report
    log.header('INSTALLATION COMPLETE');
    
    console.log(`
${colors.green}✅ Spotify integration has been successfully added!${colors.reset}

${colors.bright}What was added:${colors.reset}
  • API Routes:
    - /api/auth/spotify/callback
    - /api/auth/spotify/connect
    - /api/auth/spotify/refresh
    - /api/spotify/player
  
  • Library:
    - /lib/spotify.ts (auth & API helpers)
  
  • Components:
    - SpotifyConnect (OAuth flow)
    - SpotifyPlayer (Web Playback SDK)
  
  • Storage:
    - SpotifyProfile type & methods
    - Token refresh logic

${colors.bright}Next Steps:${colors.reset}
  1. ${colors.yellow}Update .env.local with your Spotify app credentials${colors.reset}
  2. Run: ${colors.cyan}npm run dev${colors.reset}
  3. Test the connection at /party page
  4. The player requires Spotify Premium

${colors.bright}Spotify App Setup:${colors.reset}
  1. Go to https://developer.spotify.com/dashboard
  2. Create a new app
  3. Add redirect URI: http://localhost:3000/api/auth/spotify/callback
  4. Copy Client ID and Client Secret to .env.local

${colors.green}Happy coding! 🎵${colors.reset}
`);

  } catch (error) {
    log.error(`Installation failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);
