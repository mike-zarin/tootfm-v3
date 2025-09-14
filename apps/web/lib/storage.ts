// apps/web/lib/storage.ts
// ПОЛНАЯ ВЕРСИЯ с добавленными методами getPartyByCode, createMembership, getMembership
import fs from 'fs/promises';
import path from 'path';
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
// Secure party code generation with higher entropy
function generateSecurePartyCode(): string {
  // Generate 8 random bytes and convert to hex for better readability
  const randomData = randomBytes(4);
  const code = randomData.toString('hex').toUpperCase().substring(0, 8);
  return code;
}
class Storage {
  private dataPath: string;
  private data: StorageData | null = null;
  constructor() {
    // Определяем путь к файлу данных относительно корня проекта
    const cwd = process.cwd();
    if (cwd.endsWith('tootfm-v3')) {
      this.dataPath = path.join(cwd, 'apps/web/data.json');
    } else if (cwd.endsWith('web')) {
      this.dataPath = path.join(cwd, 'data.json');
    } else {
      this.dataPath = path.join(cwd, 'apps/web/data.json');
    }
  }
  private async ensureDataFile(): Promise<void> {
    try {
      await fs.access(this.dataPath);
    } catch {
      const initialData: StorageData = {
        users: [],
        parties: [],
        tracks: [],
        memberships: [],
        votes: [],
        spotifyProfiles: [],
        appleMusicProfiles: [],
        musicPortraits: []
      };
      await fs.writeFile(this.dataPath, JSON.stringify(initialData, null, 2));
    }
  }
  async getData(): Promise<StorageData> {
    await this.ensureDataFile();
    const content = await fs.readFile(this.dataPath, 'utf-8');
    this.data = JSON.parse(content);
    return this.data!;
  }
  async saveData(data: StorageData): Promise<void> {
    await fs.writeFile(this.dataPath, JSON.stringify(data, null, 2));
    this.data = data;
  }
  async getAllData(): Promise<StorageData> {
    return this.getData();
  }
  // USER METHODS
  async createUser(userData: Partial<User>): Promise<User> {
    const data = await this.getData();
    const user: User = {
      id: userData.id || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: userData.email!,
      name: userData.name || '',
      image: userData.image || null,
      createdAt: userData.createdAt || new Date().toISOString(),
      updatedAt: userData.updatedAt || new Date().toISOString()
    };
    data.users.push(user);
    await this.saveData(data);
    return user;
  }
  async getUserByEmail(email: string): Promise<User | null> {
    const data = await this.getData();
    return data.users.find(u => u.email === email) || null;
  }
  async getUserById(id: string): Promise<User | null> {
    const data = await this.getData();
    return data.users.find(u => u.id === id) || null;
  }
  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const data = await this.getData();
    const index = data.users.findIndex(u => u.id === id);
    if (index === -1) return null;
    data.users[index] = {
      ...data.users[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    await this.saveData(data);
    return data.users[index];
  }
  // PARTY METHODS
  async createParty(partyData: Partial<Party>): Promise<Party> {
    const data = await this.getData();
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
    data.parties.push(party);
    await this.saveData(data);
    return party;
  }
  async getParty(id: string): Promise<Party | null> {
    const data = await this.getData();
    return data.parties.find(p => p.id === id) || null;
  }
  async getPartyByCode(code: string): Promise<Party | null> {
    const data = await this.getData();
    return data.parties.find(p => p.code === code.toUpperCase()) || null;
  }

  async getAllParties(): Promise<Party[]> {
    const data = await this.getData();
    return data.parties;
  }
  async updateParty(id: string, updates: Partial<Party>): Promise<Party | null> {
    const data = await this.getData();
    const index = data.parties.findIndex(p => p.id === id);
    if (index === -1) return null;
    data.parties[index] = {
      ...data.parties[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    await this.saveData(data);
    return data.parties[index];
  }
  async getUserParties(email: string): Promise<Party[]> {
    const data = await this.getData();
    const user = data.users.find(u => u.email === email);
    if (!user) return [];
    // Найти партии где пользователь хост
    const hostedParties = data.parties.filter(p => p.hostId === user.id);
    // Найти партии где пользователь участник
    const memberParties = data.memberships
      .filter(m => m.userId === user.id)
      .map(m => data.parties.find(p => p.id === m.partyId))
      .filter(p => p && p.hostId !== user.id) as Party[];
    return [...hostedParties, ...memberParties];
  }
  // MEMBERSHIP METHODS
  async createMembership(membershipData: Partial<Membership>): Promise<Membership> {
    const data = await this.getData();
    const membership: Membership = {
      id: membershipData.id || `membership_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: membershipData.userId!,
      partyId: membershipData.partyId!,
      role: membershipData.role || 'guest',
      joinedAt: membershipData.joinedAt || new Date().toISOString()
    };
    if (!data.memberships) {
      data.memberships = [];
    }
    data.memberships.push(membership);
    await this.saveData(data);
    return membership;
  }
  async getMembership(userId: string, partyId: string): Promise<Membership | null> {
    const data = await this.getData();
    return data.memberships?.find(m => 
      m.userId === userId && m.partyId === partyId
    ) || null;
  }
  async getPartyMembers(partyId: string): Promise<any[]> {
    const data = await this.getData();
    const memberships = data.memberships?.filter(m => m.partyId === partyId) || [];
    return memberships.map(m => {
      const user = data.users.find(u => u.id === m.userId);
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
    const data = await this.getData();
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
    data.tracks.push(track);
    await this.saveData(data);
    return track;
  }
  async getTracks(partyId: string): Promise<Track[]> {
    const data = await this.getData();
    return data.tracks
      .filter(t => t.partyId === partyId)
      .sort((a, b) => a.position - b.position);
  }
  async updateTrack(id: string, updates: Partial<Track>): Promise<Track | null> {
    const data = await this.getData();
    const index = data.tracks.findIndex(t => t.id === id);
    if (index === -1) return null;
    data.tracks[index] = {
      ...data.tracks[index],
      ...updates
    };
    await this.saveData(data);
    return data.tracks[index];
  }
  async deleteTrack(id: string): Promise<boolean> {
    const data = await this.getData();
    const index = data.tracks.findIndex(t => t.id === id);
    if (index === -1) return false;
    data.tracks.splice(index, 1);
    await this.saveData(data);
    return true;
  }
  // VOTE METHODS
  async createVote(voteData: Partial<Vote>): Promise<Vote> {
    const data = await this.getData();
    const vote: Vote = {
      id: voteData.id || `vote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: voteData.userId!,
      trackId: voteData.trackId!,
      type: voteData.type!,
      createdAt: voteData.createdAt || new Date().toISOString()
    };
    data.votes.push(vote);
    await this.saveData(data);
    return vote;
  }
  async getVotes(trackId: string): Promise<Vote[]> {
    const data = await this.getData();
    return data.votes.filter(v => v.trackId === trackId);
  }
  // SPOTIFY METHODS
  async saveSpotifyProfile(profile: SpotifyProfile): Promise<void> {
    const data = await this.getData();
    const index = data.spotifyProfiles.findIndex(p => p.userId === profile.userId);
    if (index >= 0) {
      data.spotifyProfiles[index] = profile;
    } else {
      data.spotifyProfiles.push(profile);
    }
    await this.saveData(data);
  }
  async getSpotifyProfile(userId: string): Promise<SpotifyProfile | null> {
    const data = await this.getData();
    return data.spotifyProfiles.find(p => p.userId === userId) || null;
  }
  async removeSpotifyProfile(userId: string): Promise<void> {
    const data = await this.getData();
    data.spotifyProfiles = data.spotifyProfiles.filter(p => p.userId !== userId);
    await this.saveData(data);
  }
  // APPLE MUSIC METHODS
  async saveAppleMusicProfile(profile: AppleMusicProfile): Promise<void> {
    const data = await this.getData();
    const index = data.appleMusicProfiles.findIndex(p => p.userId === profile.userId);
    if (index >= 0) {
      data.appleMusicProfiles[index] = profile;
    } else {
      data.appleMusicProfiles.push(profile);
    }
    await this.saveData(data);
  }
  async getAppleMusicProfile(userId: string): Promise<AppleMusicProfile | null> {
    const data = await this.getData();
    return data.appleMusicProfiles.find(p => p.userId === userId) || null;
  }
  async removeAppleMusicProfile(userId: string): Promise<void> {
    const data = await this.getData();
    data.appleMusicProfiles = data.appleMusicProfiles.filter(p => p.userId !== userId);
    await this.saveData(data);
  }
  // ДОПОЛНИТЕЛЬНЫЕ МЕТОДЫ ДЛЯ УПРАВЛЕНИЯ ТОКЕНАМИ
  async updateSpotifyTokens(
    userId: string, 
    accessToken: string, 
    refreshToken: string, 
    expiresIn: number
  ): Promise<void> {
    const data = await this.getData();
    const profile = data.spotifyProfiles.find(p => p.userId === userId);
    if (profile) {
      profile.accessToken = accessToken;
      profile.refreshToken = refreshToken;
      profile.expiresAt = new Date(Date.now() + (expiresIn * 1000)).toISOString();
      profile.updatedAt = new Date().toISOString();
      await this.saveData(data);
    }
  }
  // МЕТОДЫ ДЛЯ LOGOUT
  async disconnectSpotify(userId: string): Promise<void> {
    const data = await this.getData();
    // Удаляем из spotifyProfiles[]
    data.spotifyProfiles = data.spotifyProfiles.filter(p => p.userId !== userId);
    // Удаляем user.spotifyProfile (если есть)
    const userIndex = data.users.findIndex(u => u.id === userId);
    if (userIndex >= 0) {
      const user = data.users[userIndex];
      if (user.spotifyProfile) {
        delete user.spotifyProfile;
        data.users[userIndex] = user;
      }
    }
    await this.saveData(data);
  }
  async disconnectAppleMusic(userId: string): Promise<void> {
    const data = await this.getData();
    // Удаляем из appleMusicProfiles[]
    data.appleMusicProfiles = data.appleMusicProfiles.filter(p => p.userId !== userId);
    // Удаляем user.appleMusicProfile (если есть)
    const userIndex = data.users.findIndex(u => u.id === userId);
    if (userIndex >= 0) {
      const user = data.users[userIndex];
      if (user.appleMusicProfile) {
        delete user.appleMusicProfile;
        data.users[userIndex] = user;
      }
    }
    await this.saveData(data);
  }
  async disconnectAllMusicServices(userId: string): Promise<void> {
    await this.disconnectSpotify(userId);
    await this.disconnectAppleMusic(userId);
  }
  // MUSIC PORTRAIT METHODS
  async saveMusicPortrait(portrait: MusicPortrait): Promise<void> {
    const data = await this.getData();
    const index = data.musicPortraits.findIndex(p => p.userId === portrait.userId);
    if (index >= 0) {
      data.musicPortraits[index] = portrait;
    } else {
      data.musicPortraits.push(portrait);
    }
    await this.saveData(data);
  }
  async getMusicPortrait(userId: string): Promise<MusicPortrait | null> {
    const data = await this.getData();
    return data.musicPortraits.find(p => p.userId === userId) || null;
  }
  async getUnifiedMusicPortrait(userId: string): Promise<any | null> {
    const data = await this.getData();
    const user = data.users.find(u => u.id === userId);
    return user?.unifiedMusicPortrait || null;
  }
  async getSpotifyPortrait(userId: string): Promise<any | null> {
    const data = await this.getData();
    const user = data.users.find(u => u.id === userId);
    if (!user?.spotifyProfile) return null;
    // Return a simplified portrait structure for Smart Mixing
    return {
      topTracks: [], // Will be populated by API call
      topGenres: [],
      audioFeatures: undefined
    };
  }
  async getAppleMusicPortrait(userId: string): Promise<any | null> {
    const data = await this.getData();
    const user = data.users.find(u => u.id === userId);
    if (!user?.appleMusicProfile) return null;
    // Return a simplified portrait structure for Smart Mixing
    return {
      topTracks: [], // Will be populated by API call
      topGenres: [],
      audioFeatures: undefined
    };
  }
  // Track management methods
  async getTrack(trackId: string): Promise<Track | null> {
    const data = await this.getData();
    return data.tracks.find(t => t.id === trackId) || null;
  }
}
// Export singleton instance
export const storage = new Storage();
// Export additional functions for backwards compatibility
export const findPartyById = (id: string) => storage.getParty(id);
export const getPartyMembers = (partyId: string) => storage.getPartyMembers(partyId);
export const createTrack = (trackData: Partial<Track>) => storage.createTrack(trackData);
export const getTracks = (partyId: string) => storage.getTracks(partyId);
export const deleteTrack = (id: string) => storage.deleteTrack(id);
export const createVote = (voteData: Partial<Vote>) => storage.createVote(voteData);
export const saveSpotifyProfile = (profile: SpotifyProfile) => storage.saveSpotifyProfile(profile);
export const getSpotifyProfile = (userId: string) => storage.getSpotifyProfile(userId);
export const removeSpotifyProfile = (userId: string) => storage.removeSpotifyProfile(userId);
export const saveAppleMusicProfile = (profile: AppleMusicProfile) => storage.saveAppleMusicProfile(profile);
export const getAppleMusicProfile = (userId: string) => storage.getAppleMusicProfile(userId);
export const removeAppleMusicProfile = (userId: string) => storage.removeAppleMusicProfile(userId);
// Music portrait methods
export const getMusicPortrait = (userId: string) => storage.getMusicPortrait(userId);
export const getUnifiedMusicPortrait = (userId: string) => storage.getUnifiedMusicPortrait(userId);
export const getSpotifyPortrait = (userId: string) => storage.getSpotifyPortrait(userId);
export const getAppleMusicPortrait = (userId: string) => storage.getAppleMusicPortrait(userId);
