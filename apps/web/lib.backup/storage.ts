// apps/web/lib/storage.ts
import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';
import { User, Party, Track, Membership, Vote } from '@/types';

interface StorageData {
  users: User[];
  parties: Party[];
  tracks: Track[];
  memberships: Membership[];
  votes?: Vote[];
}

class Storage {
  private filePath: string;
  private _data: StorageData | null = null;

  constructor() {
    this.filePath = path.join(process.cwd(), 'data.json');
    this.ensureLoaded();
  }

  private ensureLoaded(): void {
    if (!this._data) {
      this.loadData();
    }
  }

  private loadData(): void {
    try {
      if (existsSync(this.filePath)) {
        const content = readFileSync(this.filePath, 'utf-8');
        this._data = JSON.parse(content);
        
        // Ensure all arrays exist
        if (!this._data!.users) this._data!.users = [];
        if (!this._data!.parties) this._data!.parties = [];
        if (!this._data!.tracks) this._data!.tracks = [];
        if (!this._data!.memberships) this._data!.memberships = [];
        if (!this._data!.votes) this._data!.votes = [];
      } else {
        this._data = {
          users: [],
          parties: [],
          tracks: [],
          memberships: [],
          votes: []
        };
        this.saveData();
      }
    } catch (error) {
      console.error('Error loading data:', error);
      this._data = {
        users: [],
        parties: [],
        tracks: [],
        memberships: [],
        votes: []
      };
    }
  }

  private saveData(): void {
    if (!this._data) return;
    try {
      writeFileSync(this.filePath, JSON.stringify(this._data, null, 2));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }

  // Getter for direct data access (for page.tsx)
  get data(): StorageData {
    this.ensureLoaded();
    return this._data!;
  }

  // User methods (синхронные)
  getUser(id: string): User | undefined {
    this.ensureLoaded();
    return this._data!.users.find(u => u.id === id);
  }

  getUserByEmail(email: string): User | undefined {
    this.ensureLoaded();
    return this._data!.users.find(u => u.email === email);
  }

  createUser(user: User): User {
    this.ensureLoaded();
    this._data!.users.push(user);
    this.saveData();
    return user;
  }

  updateUser(id: string, updates: Partial<User>): User | null {
    this.ensureLoaded();
    const index = this._data!.users.findIndex(u => u.id === id);
    if (index === -1) return null;
    
    this._data!.users[index] = { 
      ...this._data!.users[index], 
      ...updates, 
      updatedAt: new Date().toISOString() 
    };
    this.saveData();
    return this._data!.users[index];
  }

  // Party methods (синхронные)
  getParty(id: string): Party | undefined {
    this.ensureLoaded();
    return this._data!.parties.find(p => p.id === id);
  }

  getPartyByCode(code: string): Party | undefined {
    this.ensureLoaded();
    return this._data!.parties.find(p => p.code === code);
  }

  getAllParties(): Party[] {
    this.ensureLoaded();
    return this._data!.parties || [];
  }

  createParty(party: Party): Party {
    this.ensureLoaded();
    this._data!.parties.push(party);
    
    // Auto-create membership for host
    this._data!.memberships.push({
      id: `membership_${Date.now()}`,
      userId: party.hostId,
      partyId: party.id,
      role: 'host',
      joinedAt: new Date().toISOString()
    });
    
    this.saveData();
    return party;
  }

  updateParty(id: string, updates: Partial<Party>): Party | null {
    this.ensureLoaded();
    const index = this._data!.parties.findIndex(p => p.id === id);
    if (index === -1) return null;
    
    this._data!.parties[index] = { 
      ...this._data!.parties[index], 
      ...updates, 
      updatedAt: new Date().toISOString() 
    };
    this.saveData();
    return this._data!.parties[index];
  }

  // Membership methods (синхронные)
  getMembership(userId: string, partyId: string): Membership | undefined {
    this.ensureLoaded();
    return this._data!.memberships.find(m => m.userId === userId && m.partyId === partyId);
  }

  createMembership(membership: Membership): Membership {
    this.ensureLoaded();
    this._data!.memberships.push(membership);
    this.saveData();
    return membership;
  }

  getPartyMembers(partyId: string): Membership[] {
    this.ensureLoaded();
    return this._data!.memberships.filter(m => m.partyId === partyId) || [];
  }

  // Track methods (синхронные)
  getTracks(partyId: string): Track[] {
    this.ensureLoaded();
    return this._data!.tracks.filter(t => t.partyId === partyId) || [];
  }

  createTrack(track: Track): Track {
    this.ensureLoaded();
    this._data!.tracks.push(track);
    this.saveData();
    return track;
  }

  updateTrack(id: string, updates: Partial<Track>): Track | null {
    this.ensureLoaded();
    const index = this._data!.tracks.findIndex(t => t.id === id);
    if (index === -1) return null;
    
    this._data!.tracks[index] = { ...this._data!.tracks[index], ...updates };
    this.saveData();
    return this._data!.tracks[index];
  }

  deleteTrack(id: string): boolean {
    this.ensureLoaded();
    const index = this._data!.tracks.findIndex(t => t.id === id);
    if (index === -1) return false;
    
    this._data!.tracks.splice(index, 1);
    this.saveData();
    return true;
  }

  // Vote methods (синхронные)
  createVote(vote: Vote): Vote {
    this.ensureLoaded();
    if (!this._data!.votes) this._data!.votes = [];
    
    // Remove existing vote from same user for same track
    this._data!.votes = this._data!.votes.filter(
      v => !(v.userId === vote.userId && v.trackId === vote.trackId)
    );
    this._data!.votes.push(vote);
    
    this.saveData();
    return vote;
  }

  getVotes(trackId: string): Vote[] {
    this.ensureLoaded();
    return this._data!.votes?.filter(v => v.trackId === trackId) || [];
  }

  // Helper methods (синхронные)
  getUserParties(userId: string): { hosted: Party[], joined: Party[] } {
    this.ensureLoaded();
    
    const memberships = this._data!.memberships.filter(m => m.userId === userId) || [];
    const hosted: Party[] = [];
    const joined: Party[] = [];
    
    for (const membership of memberships) {
      const party = this._data!.parties.find(p => p.id === membership.partyId);
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

  getPartyMemberCount(partyId: string): number {
    this.ensureLoaded();
    return this._data!.memberships.filter(m => m.partyId === partyId && !m.leftAt).length || 0;
  }

  getPartyTrackCount(partyId: string): number {
    this.ensureLoaded();
    return this._data!.tracks.filter(t => t.partyId === partyId).length || 0;
  }

  // Party code generation
  generateUniquePartyCode(): string {
    this.ensureLoaded();
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
    } while (this.getPartyByCode(code));
    
    return code;
  }

  // Join party helper
  joinParty(partyId: string, userId: string): Membership {
    const existing = this.getMembership(userId, partyId);
    if (existing) return existing;
    
    return this.createMembership({
      id: `membership_${Date.now()}`,
      userId,
      partyId,
      role: 'guest',
      joinedAt: new Date().toISOString()
    });
  }
}

// Create singleton instance
export const storage = new Storage();