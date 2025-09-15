// apps/web/lib/storage-memory.ts
// In-memory storage for Vercel production deployment
// Data will be lost on server restart - OK for MVP demo

import { User, Party, Track, Membership, Vote, SpotifyProfile, AppleMusicProfile, MusicPortrait } from '@/types';
import { randomBytes } from 'crypto';

export interface StorageData {
  users: User[];
  parties: Party[];
  tracks: Track[];
  memberships: Membership[];
  votes: Vote[];
  spotifyProfiles: SpotifyProfile[];
  appleMusicProfiles: AppleMusicProfile[];
  musicPortraits: MusicPortrait[];
}

// Global in-memory data storage
const memoryData: StorageData = {
  users: [],
  parties: [],
  tracks: [],
  memberships: [],
  votes: [],
  spotifyProfiles: [],
  appleMusicProfiles: [],
  musicPortraits: []
};

// Secure party code generation with higher entropy
function generateSecurePartyCode(): string {
  const randomData = randomBytes(4);
  const code = randomData.toString('hex').toUpperCase().substring(0, 8);
  return code;
}

class MemoryStorage {
  private data: StorageData = memoryData;

  async getData(): Promise<StorageData> {
    return this.data;
  }

  async saveData(data: StorageData): Promise<void> {
    // In memory storage - just update the reference
    this.data = data;
  }

  async getAllData(): Promise<StorageData> {
    return this.getData();
  }

  // USER METHODS
  async createUser(userData: Partial<User>): Promise<User> {
    const user: User = {
      id: userData.id || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: userData.email!,
      name: userData.name || '',
      image: userData.image || null,
      createdAt: userData.createdAt || new Date().toISOString(),
      updatedAt: userData.updatedAt || new Date().toISOString()
    };
    this.data.users.push(user);
    return user;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.data.users.find(u => u.email === email) || null;
  }

  async getUserById(id: string): Promise<User | null> {
    return this.data.users.find(u => u.id === id) || null;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const index = this.data.users.findIndex(u => u.id === id);
    if (index === -1) return null;
    this.data.users[index] = {
      ...this.data.users[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    return this.data.users[index];
  }

  // PARTY METHODS
  async createParty(partyData: Partial<Party>): Promise<Party> {
    const party: Party = {
      id: partyData.id || `party_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: partyData.name!,
      description: partyData.description || '',
      code: partyData.code || generateSecurePartyCode(),
      hostId: partyData.hostId!,
      hostName: partyData.hostName || '',
      status: partyData.status || 'WAITING',
      settings: partyData.settings || {
        maxMembers: 50,
        votingEnabled: true,
        skipThreshold: 3,
        maxTracks: 10
      },
      createdAt: partyData.createdAt || new Date().toISOString(),
      updatedAt: partyData.updatedAt || new Date().toISOString()
    };
    this.data.parties.push(party);
    return party;
  }

  async getParty(id: string): Promise<Party | null> {
    return this.data.parties.find(p => p.id === id) || null;
  }

  async getPartyByCode(code: string): Promise<Party | null> {
    return this.data.parties.find(p => p.code === code.toUpperCase()) || null;
  }

  async getAllParties(): Promise<Party[]> {
    return this.data.parties;
  }

  async updateParty(id: string, updates: Partial<Party>): Promise<Party | null> {
    const index = this.data.parties.findIndex(p => p.id === id);
    if (index === -1) return null;
    this.data.parties[index] = {
      ...this.data.parties[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    return this.data.parties[index];
  }

  async getUserParties(email: string): Promise<Party[]> {
    const user = this.data.users.find(u => u.email === email);
    if (!user) return [];
    
    const hostedParties = this.data.parties.filter(p => p.hostId === user.id);
    const memberParties = this.data.memberships
      .filter(m => m.userId === user.id)
      .map(m => this.data.parties.find(p => p.id === m.partyId))
      .filter(p => p && p.hostId !== user.id) as Party[];
    
    return [...hostedParties, ...memberParties];
  }

  // MEMBERSHIP METHODS
  async createMembership(membershipData: Partial<Membership>): Promise<Membership> {
    const membership: Membership = {
      id: membershipData.id || `membership_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: membershipData.userId!,
      partyId: membershipData.partyId!,
      role: membershipData.role || 'guest',
      joinedAt: membershipData.joinedAt || new Date().toISOString()
    };
    this.data.memberships.push(membership);
    return membership;
  }

  async getMembership(userId: string, partyId: string): Promise<Membership | null> {
    return this.data.memberships.find(m => 
      m.userId === userId && m.partyId === partyId
    ) || null;
  }

  async getPartyMembers(partyId: string): Promise<any[]> {
    const memberships = this.data.memberships.filter(m => m.partyId === partyId);
    return memberships.map(m => {
      const user = this.data.users.find(u => u.id === m.userId);
      return {
        ...m,
        userName: user?.name,
        userEmail: user?.email,
        userImage: user?.image
      };
    });
  }

  // TRACK METHODS
  async createTrack(trackData: Partial<Track>): Promise<Track> {
    const track: Track = {
      id: trackData.id || `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      partyId: trackData.partyId!,
      spotifyId: trackData.spotifyId,
      appleMusicId: trackData.appleMusicId,
      title: trackData.title!,
      artist: trackData.artist!,
      album: trackData.album,
      duration: trackData.duration,
      imageUrl: trackData.imageUrl,
      previewUrl: trackData.previewUrl,
      addedById: trackData.addedById!,
      addedByName: trackData.addedByName!,
      position: trackData.position || 0,
      playedAt: trackData.playedAt || undefined,
      createdAt: trackData.createdAt || new Date().toISOString()
    };
    this.data.tracks.push(track);
    return track;
  }

  async getTracks(partyId: string): Promise<Track[]> {
    return this.data.tracks
      .filter(t => t.partyId === partyId)
      .sort((a, b) => a.position - b.position);
  }

  async updateTrack(id: string, updates: Partial<Track>): Promise<Track | null> {
    const index = this.data.tracks.findIndex(t => t.id === id);
    if (index === -1) return null;
    this.data.tracks[index] = {
      ...this.data.tracks[index],
      ...updates
    };
    return this.data.tracks[index];
  }

  async deleteTrack(id: string): Promise<boolean> {
    const index = this.data.tracks.findIndex(t => t.id === id);
    if (index === -1) return false;
    this.data.tracks.splice(index, 1);
    return true;
  }

  async getTrack(trackId: string): Promise<Track | null> {
    return this.data.tracks.find(t => t.id === trackId) || null;
  }

  // VOTE METHODS
  async createVote(voteData: Partial<Vote>): Promise<Vote> {
    const vote: Vote = {
      id: voteData.id || `vote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: voteData.userId!,
      trackId: voteData.trackId!,
      type: voteData.type!,
      createdAt: voteData.createdAt || new Date().toISOString()
    };
    this.data.votes.push(vote);
    return vote;
  }

  async getVotes(trackId: string): Promise<Vote[]> {
    return this.data.votes.filter(v => v.trackId === trackId);
  }

  // SPOTIFY METHODS
  async saveSpotifyProfile(profile: SpotifyProfile): Promise<void> {
    const index = this.data.spotifyProfiles.findIndex(p => p.userId === profile.userId);
    if (index >= 0) {
      this.data.spotifyProfiles[index] = profile;
    } else {
      this.data.spotifyProfiles.push(profile);
    }
  }

  async getSpotifyProfile(userId: string): Promise<SpotifyProfile | null> {
    return this.data.spotifyProfiles.find(p => p.userId === userId) || null;
  }

  async removeSpotifyProfile(userId: string): Promise<void> {
    this.data.spotifyProfiles = this.data.spotifyProfiles.filter(p => p.userId !== userId);
  }

  async updateSpotifyTokens(
    userId: string, 
    accessToken: string, 
    refreshToken: string, 
    expiresIn: number
  ): Promise<void> {
    const profile = this.data.spotifyProfiles.find(p => p.userId === userId);
    if (profile) {
      profile.accessToken = accessToken;
      profile.refreshToken = refreshToken;
      profile.expiresAt = new Date(Date.now() + (expiresIn * 1000)).toISOString();
      profile.updatedAt = new Date().toISOString();
    }
  }

  async disconnectSpotify(userId: string): Promise<void> {
    this.data.spotifyProfiles = this.data.spotifyProfiles.filter(p => p.userId !== userId);
    const userIndex = this.data.users.findIndex(u => u.id === userId);
    if (userIndex >= 0) {
      const user = this.data.users[userIndex];
      if (user.spotifyProfile) {
        delete user.spotifyProfile;
        this.data.users[userIndex] = user;
      }
    }
  }

  // APPLE MUSIC METHODS
  async saveAppleMusicProfile(profile: AppleMusicProfile): Promise<void> {
    const index = this.data.appleMusicProfiles.findIndex(p => p.userId === profile.userId);
    if (index >= 0) {
      this.data.appleMusicProfiles[index] = profile;
    } else {
      this.data.appleMusicProfiles.push(profile);
    }
  }

  async getAppleMusicProfile(userId: string): Promise<AppleMusicProfile | null> {
    return this.data.appleMusicProfiles.find(p => p.userId === userId) || null;
  }

  async removeAppleMusicProfile(userId: string): Promise<void> {
    this.data.appleMusicProfiles = this.data.appleMusicProfiles.filter(p => p.userId !== userId);
  }

  async disconnectAppleMusic(userId: string): Promise<void> {
    this.data.appleMusicProfiles = this.data.appleMusicProfiles.filter(p => p.userId !== userId);
    const userIndex = this.data.users.findIndex(u => u.id === userId);
    if (userIndex >= 0) {
      const user = this.data.users[userIndex];
      if (user.appleMusicProfile) {
        delete user.appleMusicProfile;
        this.data.users[userIndex] = user;
      }
    }
  }

  async disconnectAllMusicServices(userId: string): Promise<void> {
    await this.disconnectSpotify(userId);
    await this.disconnectAppleMusic(userId);
  }

  // MUSIC PORTRAIT METHODS
  async saveMusicPortrait(portrait: MusicPortrait): Promise<void> {
    const index = this.data.musicPortraits.findIndex(p => p.userId === portrait.userId);
    if (index >= 0) {
      this.data.musicPortraits[index] = portrait;
    } else {
      this.data.musicPortraits.push(portrait);
    }
  }

  async getMusicPortrait(userId: string): Promise<MusicPortrait | null> {
    return this.data.musicPortraits.find(p => p.userId === userId) || null;
  }

  async getUnifiedMusicPortrait(userId: string): Promise<any | null> {
    const user = this.data.users.find(u => u.id === userId);
    return user?.unifiedMusicPortrait || null;
  }

  async getSpotifyPortrait(userId: string): Promise<any | null> {
    const user = this.data.users.find(u => u.id === userId);
    if (!user?.spotifyProfile) return null;
    return {
      topTracks: [],
      topGenres: [],
      audioFeatures: undefined
    };
  }

  async getAppleMusicPortrait(userId: string): Promise<any | null> {
    const user = this.data.users.find(u => u.id === userId);
    if (!user?.appleMusicProfile) return null;
    return {
      topTracks: [],
      topGenres: [],
      audioFeatures: undefined
    };
  }
}

// Export singleton instance
export const memoryStorage = new MemoryStorage();

// Export additional functions for backwards compatibility
export const findPartyById = (id: string) => memoryStorage.getParty(id);
export const getPartyMembers = (partyId: string) => memoryStorage.getPartyMembers(partyId);
export const createTrack = (trackData: Partial<Track>) => memoryStorage.createTrack(trackData);
export const getTracks = (partyId: string) => memoryStorage.getTracks(partyId);
export const deleteTrack = (id: string) => memoryStorage.deleteTrack(id);
export const createVote = (voteData: Partial<Vote>) => memoryStorage.createVote(voteData);
export const saveSpotifyProfile = (profile: SpotifyProfile) => memoryStorage.saveSpotifyProfile(profile);
export const getSpotifyProfile = (userId: string) => memoryStorage.getSpotifyProfile(userId);
export const removeSpotifyProfile = (userId: string) => memoryStorage.removeSpotifyProfile(userId);
export const saveAppleMusicProfile = (profile: AppleMusicProfile) => memoryStorage.saveAppleMusicProfile(profile);
export const getAppleMusicProfile = (userId: string) => memoryStorage.getAppleMusicProfile(userId);
export const removeAppleMusicProfile = (userId: string) => memoryStorage.removeAppleMusicProfile(userId);
export const getMusicPortrait = (userId: string) => memoryStorage.getMusicPortrait(userId);
export const getUnifiedMusicPortrait = (userId: string) => memoryStorage.getUnifiedMusicPortrait(userId);
export const getSpotifyPortrait = (userId: string) => memoryStorage.getSpotifyPortrait(userId);
export const getAppleMusicPortrait = (userId: string) => memoryStorage.getAppleMusicPortrait(userId);
