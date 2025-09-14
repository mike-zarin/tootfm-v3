// apps/web/lib/storage.ts

import { promises as fs } from 'fs';
import path from 'path';
import { User, Party, Track, Membership, Vote, MusicProfile } from '@/types';
import type { SpotifyProfile } from "@/types";

// New interfaces for Apple Music and Music Portraits
export interface AppleMusicProfile {
  userId: string;
  musicUserToken: string;
  connectedAt: string;
  expiresAt: string;
}

export interface MusicPortraitData {
  userId: string;
  portrait: {
    topTracks: any[];
    topArtists: any[];
    topGenres: string[];
    audioFeatures: {
      danceability: number;
      energy: number;
      valence: number;
      tempo: number;
      acousticness: number;
      instrumentalness: number;
    };
    energyCurve: number[];
    stats: {
      totalTracks: number;
      totalArtists: number;
      averagePopularity: number;
      dominantDecade: string;
      musicDiversity: number;
      partyReadiness: number;
    };
    sources: {
      spotify?: boolean;
      apple?: boolean;
      lastfm?: boolean;
    };
    generatedAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface StorageData {
  users: User[];
  parties: Party[];
  tracks: Track[];
  memberships: Membership[];
  votes?: Vote[];
  spotifyProfiles?: SpotifyProfile[];
  appleMusicProfiles?: AppleMusicProfile[];
  musicProfiles?: MusicProfile[];
  musicPortraits?: MusicPortraitData[];
}

class Storage {
  private filePath: string;

  constructor() {
    this.filePath = path.join(process.cwd(), 'data.json');
  }

  async read(): Promise<StorageData> {
    try {
      const data = await fs.readFile(this.filePath, 'utf-8');
      const parsed = JSON.parse(data);
      
      // Initialize arrays if they don't exist
      if (!parsed.votes) parsed.votes = [];
      if (!parsed.musicProfiles) parsed.musicProfiles = [];
      if (!parsed.appleMusicProfiles) parsed.appleMusicProfiles = [];
      if (!parsed.musicPortraits) parsed.musicPortraits = [];
      
      return parsed;
    } catch (_error) {
      const emptyData: StorageData = {
        users: [],
        parties: [],
        tracks: [],
        memberships: [],
        votes: [],
        spotifyProfiles: [],
        appleMusicProfiles: [],
        musicProfiles: [],
        musicPortraits: []
      };
      await this.write(emptyData);
      return emptyData;
    }
  }

  async write(data: StorageData): Promise<void> {
    try {
      await fs.writeFile(this.filePath, JSON.stringify(data, null, 2));
    } catch (_error) {
      throw _error;
    }
  }

  // User methods
  async getUsers(): Promise<User[]> {
    const data = await this.read();
    return data.users || [];
  }

  async getUser(id: string): Promise<User | undefined> {
    const data = await this.read();
    return data.users?.find(u => u.id === id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const data = await this.read();
    return data.users?.find(u => u.email === email);
  }

  async createUser(user: User): Promise<User> {
    const data = await this.read();
    if (!data.users) data.users = [];
    data.users.push(user);
    await this.write(data);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const data = await this.read();
    if (!data.users) return null;
    const index = data.users.findIndex(u => u.id === id);
    if (index === -1) return null;
    
    data.users[index] = { ...data.users[index], ...updates, updatedAt: new Date().toISOString() };
    await this.write(data);
    return data.users[index];
  }

  // Party methods
  async getParties(): Promise<Party[]> {
    const data = await this.read();
    return data.parties || [];
  }

  async getParty(id: string): Promise<Party | undefined> {
    const data = await this.read();
    return data.parties?.find(p => p.id === id);
  }

  async getPartyByCode(code: string): Promise<Party | undefined> {
    const data = await this.read();
    return data.parties?.find(p => p.code === code);
  }

  async createParty(party: Party): Promise<Party> {
    const data = await this.read();
    if (!data.parties) data.parties = [];
    data.parties.push(party);
    
    // Auto-create membership for host
    if (!data.memberships) data.memberships = [];
    data.memberships.push({
      id: `membership_${Date.now()}`,
      userId: party.hostId,
      partyId: party.id,
      role: 'host',
      joinedAt: new Date().toISOString()
    });
    
    await this.write(data);
    return party;
  }

  async updateParty(id: string, updates: Partial<Party>): Promise<Party | null> {
    const data = await this.read();
    if (!data.parties) return null;
    const index = data.parties.findIndex(p => p.id === id);
    if (index === -1) return null;
    
    data.parties[index] = { ...data.parties[index], ...updates, updatedAt: new Date().toISOString() };
    await this.write(data);
    return data.parties[index];
  }

  // Membership methods
  async getMemberships(): Promise<Membership[]> {
    const data = await this.read();
    return data.memberships || [];
  }

  async createMembership(membership: Membership): Promise<Membership> {
    const data = await this.read();
    if (!data.memberships) data.memberships = [];
    data.memberships.push(membership);
    await this.write(data);
    return membership;
  }

  async getMembership(userId: string, partyId: string): Promise<Membership | undefined> {
    const data = await this.read();
    return data.memberships?.find(m => m.userId === userId && m.partyId === partyId);
  }

  // Track methods
  async getTracks(partyId: string): Promise<Track[]> {
    const data = await this.read();
    return data.tracks?.filter(t => t.partyId === partyId) || [];
  }

  async createTrack(track: Track): Promise<Track> {
    const data = await this.read();
    if (!data.tracks) data.tracks = [];
    data.tracks.push(track);
    await this.write(data);
    return track;
  }

  async updateTrack(id: string, updates: Partial<Track>): Promise<Track | null> {
    const data = await this.read();
    if (!data.tracks) return null;
    const index = data.tracks.findIndex(t => t.id === id);
    if (index === -1) return null;
    
    data.tracks[index] = { ...data.tracks[index], ...updates };
    await this.write(data);
    return data.tracks[index];
  }

  async deleteTrack(id: string): Promise<boolean> {
    const data = await this.read();
    if (!data.tracks) return false;
    const index = data.tracks.findIndex(t => t.id === id);
    if (index === -1) return false;
    
    data.tracks.splice(index, 1);
    await this.write(data);
    return true;
  }

  // Vote methods
  async createVote(vote: Vote): Promise<Vote> {
    const data = await this.read();
    if (!data.votes) data.votes = [];
    
    // Remove existing vote from same user for same track
    data.votes = data.votes.filter(v => !(v.userId === vote.userId && v.trackId === vote.trackId));
    data.votes.push(vote);
    
    await this.write(data);
    return vote;
  }

  async getVotes(trackId: string): Promise<Vote[]> {
    const data = await this.read();
    return data.votes?.filter(v => v.trackId === trackId) || [];
  }

  // MusicProfile methods (legacy)
  async getMusicProfile(userId: string, service: string): Promise<MusicProfile | undefined> {
    const data = await this.read();
    return data.musicProfiles?.find(p => p.userId === userId && p.service === service);
  }

  async saveMusicProfile(profile: MusicProfile): Promise<MusicProfile> {
    const data = await this.read();
    if (!data.musicProfiles) data.musicProfiles = [];
    
    // Remove old profile if exists
    data.musicProfiles = data.musicProfiles.filter(
      p => !(p.userId === profile.userId && p.service === profile.service)
    );
    data.musicProfiles.push(profile);
    
    await this.write(data);
    return profile;
  }

  // NEW: Music Portrait methods (full portrait data)
  async saveMusicPortrait(userId: string, portrait: any): Promise<void> {
    const data = await this.read();
    if (!data.musicPortraits) data.musicPortraits = [];
    
    const index = data.musicPortraits.findIndex(p => p.userId === userId);
    const now = new Date().toISOString();
    
    const portraitData: MusicPortraitData = {
      userId,
      portrait,
      createdAt: index >= 0 ? data.musicPortraits[index].createdAt : now,
      updatedAt: now
    };
    
    if (index >= 0) {
      data.musicPortraits[index] = portraitData;
    } else {
      data.musicPortraits.push(portraitData);
    }
    
    await this.write(data);
  }

  async getMusicPortrait(userId: string): Promise<any | null> {
    const data = await this.read();
    const portrait = data.musicPortraits?.find(p => p.userId === userId);
    return portrait?.portrait || null;
  }

  async getAllMusicPortraits(): Promise<MusicPortraitData[]> {
    const data = await this.read();
    return data.musicPortraits || [];
  }

  // Helper methods
  async getUserParties(emailOrId: string): Promise<{ hosted: Party[], joined: Party[] }> {
    const data = await this.read();
    
    const user = data.users?.find(u => u.id === emailOrId || u.email === emailOrId);
    const userId = user?.id || emailOrId;
    
    const memberships = data.memberships?.filter(m => m.userId === userId) || [];
    
    const hosted: Party[] = [];
    const joined: Party[] = [];
    
    for (const membership of memberships) {
      const party = data.parties?.find(p => p.id === membership.partyId);
      if (party) {
        if (membership.role === 'host') {
          hosted.push(party);
        } else {
          joined.push(party);
        }
      }
    }
    
    return { hosted, joined };
  }

  async getPartyMemberCount(partyId: string): Promise<number> {
    const data = await this.read();
    return data.memberships?.filter(m => m.partyId === partyId && !m.leftAt).length || 0;
  }

  async getPartyTrackCount(partyId: string): Promise<number> {
    const data = await this.read();
    return data.tracks?.filter(t => t.partyId === partyId).length || 0;
  }

  // API compatibility methods
  async findPartyById(id: string): Promise<Party | undefined> {
    return this.getParty(id);
  }

  async findPartyByCode(code: string): Promise<Party | undefined> {
    return this.getPartyByCode(code);
  }

  async getPartyMembers(partyId: string): Promise<Membership[]> {
    const data = await this.read();
    return data.memberships?.filter(m => m.partyId === partyId) || [];
  }

  async joinParty(partyId: string, userId: string): Promise<Membership> {
    const existing = await this.getMembership(userId, partyId);
    if (existing) return existing;
    
    return this.createMembership({
      id: `membership_${Date.now()}`,
      userId,
      partyId,
      role: 'guest',
      joinedAt: new Date().toISOString()
    });
  }

  async generateUniquePartyCode(): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code: string;
    let attempts = 0;
    
    do {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
      }
      attempts++;
      if (attempts > 100) throw new Error('Could not generate unique code');
    } while (await this.getPartyByCode(code));
    
    return code;
  }

  async readData(): Promise<StorageData> {
    return this.read();
  }

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
      profile.expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
      profile.updatedAt = new Date().toISOString();
      await this.saveSpotifyProfile(profile);
    }
  }

  async removeSpotifyProfile(userId: string): Promise<void> {
    const data = await this.read();
    if (data.spotifyProfiles) {
      data.spotifyProfiles = data.spotifyProfiles.filter((p: SpotifyProfile) => p.userId !== userId);
      await this.write(data);
    }
  }

  // NEW: Apple Music Integration Methods
  async getAppleMusicProfile(userId: string): Promise<AppleMusicProfile | null> {
    const data = await this.read();
    return data.appleMusicProfiles?.find(p => p.userId === userId) || null;
  }

  async saveAppleMusicProfile(profile: AppleMusicProfile): Promise<AppleMusicProfile> {
    const data = await this.read();
    if (!data.appleMusicProfiles) data.appleMusicProfiles = [];
    
    const existingIndex = data.appleMusicProfiles.findIndex(p => p.userId === profile.userId);
    if (existingIndex >= 0) {
      data.appleMusicProfiles[existingIndex] = profile;
    } else {
      data.appleMusicProfiles.push(profile);
    }
    
    await this.write(data);
    return profile;
  }

  async removeAppleMusicProfile(userId: string): Promise<void> {
    const data = await this.read();
    if (data.appleMusicProfiles) {
      data.appleMusicProfiles = data.appleMusicProfiles.filter(p => p.userId !== userId);
      await this.write(data);
    }
  }

  // Check if user has any music service connected
  async getUserMusicServices(userId: string): Promise<{
    spotify: boolean;
    apple: boolean;
    hasAny: boolean;
  }> {
    const spotifyProfile = await this.getSpotifyProfile(userId);
    const appleProfile = await this.getAppleMusicProfile(userId);
    
    return {
      spotify: !!spotifyProfile,
      apple: !!appleProfile,
      hasAny: !!spotifyProfile || !!appleProfile
    };
  }
}

// Create singleton instance
export const storage = new Storage();

// Export all methods for backwards compatibility
export const getUsers = storage.getUsers.bind(storage);
export const getUser = storage.getUser.bind(storage);
export const getUserByEmail = storage.getUserByEmail.bind(storage);
export const createUser = storage.createUser.bind(storage);
export const updateUser = storage.updateUser.bind(storage);

export const getParties = storage.getParties.bind(storage);
export const getParty = storage.getParty.bind(storage);
export const getPartyByCode = storage.getPartyByCode.bind(storage);
export const createParty = storage.createParty.bind(storage);
export const updateParty = storage.updateParty.bind(storage);

export const getMemberships = storage.getMemberships.bind(storage);
export const createMembership = storage.createMembership.bind(storage);
export const getMembership = storage.getMembership.bind(storage);

export const getTracks = storage.getTracks.bind(storage);
export const createTrack = storage.createTrack.bind(storage);
export const updateTrack = storage.updateTrack.bind(storage);
export const deleteTrack = storage.deleteTrack.bind(storage);

export const createVote = storage.createVote.bind(storage);
export const getVotes = storage.getVotes.bind(storage);

export const getMusicProfile = storage.getMusicProfile.bind(storage);
export const saveMusicProfile = storage.saveMusicProfile.bind(storage);

export const getUserParties = storage.getUserParties.bind(storage);
export const getPartyMemberCount = storage.getPartyMemberCount.bind(storage);
export const getPartyTrackCount = storage.getPartyTrackCount.bind(storage);

export const findPartyById = storage.findPartyById.bind(storage);
export const findPartyByCode = storage.findPartyByCode.bind(storage);
export const getPartyMembers = storage.getPartyMembers.bind(storage);
export const joinParty = storage.joinParty.bind(storage);
export const generateUniquePartyCode = storage.generateUniquePartyCode.bind(storage);
export const readData = storage.readData.bind(storage);

// Spotify exports
export const getSpotifyProfile = storage.getSpotifyProfile.bind(storage);
export const saveSpotifyProfile = storage.saveSpotifyProfile.bind(storage);
export const updateSpotifyTokens = storage.updateSpotifyTokens.bind(storage);
export const removeSpotifyProfile = storage.removeSpotifyProfile.bind(storage);

// NEW: Apple Music exports
export const getAppleMusicProfile = storage.getAppleMusicProfile.bind(storage);
export const saveAppleMusicProfile = storage.saveAppleMusicProfile.bind(storage);
export const removeAppleMusicProfile = storage.removeAppleMusicProfile.bind(storage);

// NEW: Music Portrait exports
export const saveMusicPortrait = storage.saveMusicPortrait.bind(storage);
export const getMusicPortrait = storage.getMusicPortrait.bind(storage);
export const getAllMusicPortraits = storage.getAllMusicPortraits.bind(storage);

// NEW: Helper export
export const getUserMusicServices = storage.getUserMusicServices.bind(storage);