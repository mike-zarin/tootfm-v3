// apps/web/lib/storage-postgres.ts
// PostgreSQL storage implementation for production

import { sql } from '@vercel/postgres';
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

// Secure party code generation
function generateSecurePartyCode(): string {
  const randomData = randomBytes(4);
  const code = randomData.toString('hex').toUpperCase().substring(0, 8);
  return code;
}

class PostgresStorage {
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

    await sql`
      INSERT INTO users (id, email, name, image, created_at, updated_at)
      VALUES (${user.id}, ${user.email}, ${user.name}, ${user.image}, ${user.createdAt}, ${user.updatedAt})
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        image = EXCLUDED.image,
        updated_at = EXCLUDED.updated_at
    `;

    return user;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const result = await sql`
      SELECT id, email, name, image, created_at, updated_at,
             spotify_profile, apple_music_profile, music_portrait, unified_music_portrait
      FROM users WHERE email = ${email}
    `;

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      image: row.image,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      spotifyProfile: row.spotify_profile,
      appleMusicProfile: row.apple_music_profile,
      musicPortrait: row.music_portrait,
      unifiedMusicPortrait: row.unified_music_portrait
    };
  }

  async getUserById(id: string): Promise<User | null> {
    const result = await sql`
      SELECT id, email, name, image, created_at, updated_at,
             spotify_profile, apple_music_profile, music_portrait, unified_music_portrait
      FROM users WHERE id = ${id}
    `;

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      image: row.image,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      spotifyProfile: row.spotify_profile,
      appleMusicProfile: row.apple_music_profile,
      musicPortrait: row.music_portrait,
      unifiedMusicPortrait: row.unified_music_portrait
    };
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const setClause = [];
    const values = [];

    if (updates.name !== undefined) {
      setClause.push(`name = $${values.length + 1}`);
      values.push(updates.name);
    }
    if (updates.image !== undefined) {
      setClause.push(`image = $${values.length + 1}`);
      values.push(updates.image);
    }
    if (updates.spotifyProfile !== undefined) {
      setClause.push(`spotify_profile = $${values.length + 1}`);
      values.push(JSON.stringify(updates.spotifyProfile));
    }
    if (updates.appleMusicProfile !== undefined) {
      setClause.push(`apple_music_profile = $${values.length + 1}`);
      values.push(JSON.stringify(updates.appleMusicProfile));
    }
    if (updates.musicPortrait !== undefined) {
      setClause.push(`music_portrait = $${values.length + 1}`);
      values.push(JSON.stringify(updates.musicPortrait));
    }
    if (updates.unifiedMusicPortrait !== undefined) {
      setClause.push(`unified_music_portrait = $${values.length + 1}`);
      values.push(JSON.stringify(updates.unifiedMusicPortrait));
    }

    if (setClause.length === 0) return null;

    setClause.push(`updated_at = NOW()`);
    values.push(id);

    await sql.query(`
      UPDATE users 
      SET ${setClause.join(', ')}
      WHERE id = $${values.length}
    `, values);

    return this.getUserById(id);
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

    await sql`
      INSERT INTO parties (id, code, name, description, host_id, host_name, status, settings, created_at, updated_at)
      VALUES (${party.id}, ${party.code}, ${party.name}, ${party.description}, ${party.hostId}, ${party.hostName}, ${party.status}, ${JSON.stringify(party.settings)}, ${party.createdAt}, ${party.updatedAt})
    `;

    return party;
  }

  async getParty(id: string): Promise<Party | null> {
    const result = await sql`
      SELECT id, code, name, description, host_id, host_name, status, settings,
             current_track_id, is_playing, position, last_position_update, created_at, updated_at
      FROM parties WHERE id = ${id}
    `;

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description,
      hostId: row.host_id,
      hostName: row.host_name,
      status: row.status,
      settings: row.settings || {},
      currentTrackId: row.current_track_id,
      isPlaying: row.is_playing,
      position: row.position,
      lastPositionUpdate: row.last_position_update,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  async getPartyByCode(code: string): Promise<Party | null> {
    const result = await sql`
      SELECT id, code, name, description, host_id, host_name, status, settings,
             current_track_id, is_playing, position, last_position_update, created_at, updated_at
      FROM parties WHERE code = ${code.toUpperCase()}
    `;

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description,
      hostId: row.host_id,
      hostName: row.host_name,
      status: row.status,
      settings: row.settings || {},
      currentTrackId: row.current_track_id,
      isPlaying: row.is_playing,
      position: row.position,
      lastPositionUpdate: row.last_position_update,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  async getAllParties(): Promise<Party[]> {
    const result = await sql`
      SELECT id, code, name, description, host_id, host_name, status, settings,
             current_track_id, is_playing, position, last_position_update, created_at, updated_at
      FROM parties ORDER BY created_at DESC
    `;

    return result.rows.map(row => ({
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description,
      hostId: row.host_id,
      hostName: row.host_name,
      status: row.status,
      settings: row.settings || {},
      currentTrackId: row.current_track_id,
      isPlaying: row.is_playing,
      position: row.position,
      lastPositionUpdate: row.last_position_update,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  async updateParty(id: string, updates: Partial<Party>): Promise<Party | null> {
    const setClause = [];
    const values = [];

    if (updates.name !== undefined) {
      setClause.push(`name = $${values.length + 1}`);
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      setClause.push(`description = $${values.length + 1}`);
      values.push(updates.description);
    }
    if (updates.status !== undefined) {
      setClause.push(`status = $${values.length + 1}`);
      values.push(updates.status);
    }
    if (updates.settings !== undefined) {
      setClause.push(`settings = $${values.length + 1}`);
      values.push(JSON.stringify(updates.settings));
    }
    if (updates.currentTrackId !== undefined) {
      setClause.push(`current_track_id = $${values.length + 1}`);
      values.push(updates.currentTrackId);
    }
    if (updates.isPlaying !== undefined) {
      setClause.push(`is_playing = $${values.length + 1}`);
      values.push(updates.isPlaying);
    }
    if (updates.position !== undefined) {
      setClause.push(`position = $${values.length + 1}`);
      values.push(updates.position);
    }
    if (updates.lastPositionUpdate !== undefined) {
      setClause.push(`last_position_update = $${values.length + 1}`);
      values.push(updates.lastPositionUpdate);
    }

    if (setClause.length === 0) return null;

    setClause.push(`updated_at = NOW()`);
    values.push(id);

    await sql.query(`
      UPDATE parties 
      SET ${setClause.join(', ')}
      WHERE id = $${values.length}
    `, values);

    return this.getParty(id);
  }

  async getUserParties(email: string): Promise<Party[]> {
    const result = await sql`
      SELECT DISTINCT p.id, p.code, p.name, p.description, p.host_id, p.host_name, p.status, p.settings,
             p.current_track_id, p.is_playing, p.position, p.last_position_update, p.created_at, p.updated_at
      FROM parties p
      LEFT JOIN memberships m ON p.id = m.party_id
      LEFT JOIN users u ON m.user_id = u.id OR p.host_id = u.id
      WHERE u.email = ${email}
      ORDER BY p.created_at DESC
    `;

    return result.rows.map(row => ({
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description,
      hostId: row.host_id,
      hostName: row.host_name,
      status: row.status,
      settings: row.settings || {},
      currentTrackId: row.current_track_id,
      isPlaying: row.is_playing,
      position: row.position,
      lastPositionUpdate: row.last_position_update,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
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

    await sql`
      INSERT INTO memberships (id, user_id, party_id, role, joined_at)
      VALUES (${membership.id}, ${membership.userId}, ${membership.partyId}, ${membership.role}, ${membership.joinedAt})
      ON CONFLICT (user_id, party_id) DO UPDATE SET
        role = EXCLUDED.role,
        joined_at = EXCLUDED.joined_at
    `;

    return membership;
  }

  async getMembership(userId: string, partyId: string): Promise<Membership | null> {
    const result = await sql`
      SELECT id, user_id, party_id, role, joined_at, left_at
      FROM memberships 
      WHERE user_id = ${userId} AND party_id = ${partyId}
    `;

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      partyId: row.party_id,
      role: row.role,
      joinedAt: row.joined_at,
      leftAt: row.left_at
    };
  }

  async getPartyMembers(partyId: string): Promise<any[]> {
    const result = await sql`
      SELECT m.id, m.user_id, m.party_id, m.role, m.joined_at, m.left_at,
             u.name as user_name, u.email as user_email, u.image as user_image
      FROM memberships m
      JOIN users u ON m.user_id = u.id
      WHERE m.party_id = ${partyId}
      ORDER BY m.joined_at ASC
    `;

    return result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      partyId: row.party_id,
      role: row.role,
      joinedAt: row.joined_at,
      leftAt: row.left_at,
      userName: row.user_name,
      userEmail: row.user_email,
      userImage: row.user_image
    }));
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

    await sql`
      INSERT INTO tracks (id, party_id, spotify_id, apple_music_id, title, artist, album, duration, 
                         image_url, preview_url, added_by_id, added_by_name, position, played_at, created_at)
      VALUES (${track.id}, ${track.partyId}, ${track.spotifyId}, ${track.appleMusicId}, ${track.title}, 
              ${track.artist}, ${track.album}, ${track.duration}, ${track.imageUrl}, ${track.previewUrl}, 
              ${track.addedById}, ${track.addedByName}, ${track.position}, ${track.playedAt}, ${track.createdAt})
    `;

    return track;
  }

  async getTracks(partyId: string): Promise<Track[]> {
    const result = await sql`
      SELECT id, party_id, spotify_id, apple_music_id, title, artist, album, duration,
             image_url, preview_url, added_by_id, added_by_name, position, played_at, created_at, votes, is_generated
      FROM tracks 
      WHERE party_id = ${partyId}
      ORDER BY position ASC, created_at ASC
    `;

    return result.rows.map(row => ({
      id: row.id,
      partyId: row.party_id,
      spotifyId: row.spotify_id,
      appleMusicId: row.apple_music_id,
      title: row.title,
      artist: row.artist,
      album: row.album,
      duration: row.duration,
      imageUrl: row.image_url,
      previewUrl: row.preview_url,
      addedById: row.added_by_id,
      addedByName: row.added_by_name,
      position: row.position,
      playedAt: row.played_at,
      createdAt: row.created_at,
      votes: row.votes,
      isGenerated: row.is_generated
    }));
  }

  async updateTrack(id: string, updates: Partial<Track>): Promise<Track | null> {
    const setClause = [];
    const values = [];

    if (updates.title !== undefined) {
      setClause.push(`title = $${values.length + 1}`);
      values.push(updates.title);
    }
    if (updates.artist !== undefined) {
      setClause.push(`artist = $${values.length + 1}`);
      values.push(updates.artist);
    }
    if (updates.position !== undefined) {
      setClause.push(`position = $${values.length + 1}`);
      values.push(updates.position);
    }
    if (updates.playedAt !== undefined) {
      setClause.push(`played_at = $${values.length + 1}`);
      values.push(updates.playedAt);
    }
    if (updates.votes !== undefined) {
      setClause.push(`votes = $${values.length + 1}`);
      values.push(updates.votes);
    }

    if (setClause.length === 0) return null;

    values.push(id);

    await sql.query(`
      UPDATE tracks 
      SET ${setClause.join(', ')}
      WHERE id = $${values.length}
    `, values);

    return this.getTrack(id);
  }

  async deleteTrack(id: string): Promise<boolean> {
    const result = await sql`DELETE FROM tracks WHERE id = ${id}`;
    return (result.rowCount ?? 0) > 0;
  }

  async getTrack(trackId: string): Promise<Track | null> {
    const result = await sql`
      SELECT id, party_id, spotify_id, apple_music_id, title, artist, album, duration,
             image_url, preview_url, added_by_id, added_by_name, position, played_at, created_at, votes, is_generated
      FROM tracks WHERE id = ${trackId}
    `;

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id,
      partyId: row.party_id,
      spotifyId: row.spotify_id,
      appleMusicId: row.apple_music_id,
      title: row.title,
      artist: row.artist,
      album: row.album,
      duration: row.duration,
      imageUrl: row.image_url,
      previewUrl: row.preview_url,
      addedById: row.added_by_id,
      addedByName: row.added_by_name,
      position: row.position,
      playedAt: row.played_at,
      createdAt: row.created_at,
      votes: row.votes,
      isGenerated: row.is_generated
    };
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

    await sql`
      INSERT INTO votes (id, user_id, track_id, type, created_at)
      VALUES (${vote.id}, ${vote.userId}, ${vote.trackId}, ${vote.type}, ${vote.createdAt})
      ON CONFLICT (user_id, track_id) DO UPDATE SET
        type = EXCLUDED.type,
        created_at = EXCLUDED.created_at
    `;

    return vote;
  }

  async getVotes(trackId: string): Promise<Vote[]> {
    const result = await sql`
      SELECT id, user_id, track_id, type, created_at
      FROM votes WHERE track_id = ${trackId}
    `;

    return result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      trackId: row.track_id,
      type: row.type,
      createdAt: row.created_at
    }));
  }

  // SPOTIFY METHODS
  async saveSpotifyProfile(profile: SpotifyProfile): Promise<void> {
    await sql`
      INSERT INTO spotify_profiles (id, user_id, display_name, email, product, country, images, 
                                   access_token, refresh_token, expires_at, spotify_id, created_at, updated_at)
      VALUES (${profile.id || `spotify_${Date.now()}`}, ${profile.userId || profile.email}, 
              ${profile.displayName}, ${profile.email}, ${profile.product}, ${profile.country}, 
              ${JSON.stringify(profile.images)}, ${profile.accessToken}, ${profile.refreshToken}, 
              ${profile.expiresAt}, ${profile.spotifyId}, NOW(), NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        email = EXCLUDED.email,
        product = EXCLUDED.product,
        country = EXCLUDED.country,
        images = EXCLUDED.images,
        access_token = EXCLUDED.access_token,
        refresh_token = EXCLUDED.refresh_token,
        expires_at = EXCLUDED.expires_at,
        spotify_id = EXCLUDED.spotify_id,
        updated_at = NOW()
    `;
  }

  async getSpotifyProfile(userId: string): Promise<SpotifyProfile | null> {
    const result = await sql`
      SELECT id, user_id, display_name, email, product, country, images,
             access_token, refresh_token, expires_at, spotify_id, created_at, updated_at
      FROM spotify_profiles WHERE user_id = ${userId}
    `;

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      displayName: row.display_name,
      email: row.email,
      product: row.product,
      country: row.country,
      images: row.images,
      accessToken: row.access_token,
      refreshToken: row.refresh_token,
      expiresAt: row.expires_at,
      spotifyId: row.spotify_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  async removeSpotifyProfile(userId: string): Promise<void> {
    await sql`DELETE FROM spotify_profiles WHERE user_id = ${userId}`;
  }

  async updateSpotifyTokens(
    userId: string, 
    accessToken: string, 
    refreshToken: string, 
    expiresIn: number
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + (expiresIn * 1000)).toISOString();
    
    await sql`
      UPDATE spotify_profiles 
      SET access_token = ${accessToken}, 
          refresh_token = ${refreshToken}, 
          expires_at = ${expiresAt},
          updated_at = NOW()
      WHERE user_id = ${userId}
    `;
  }

  async disconnectSpotify(userId: string): Promise<void> {
    await this.removeSpotifyProfile(userId);
    
    // Also remove from user's spotify_profile field
    await sql`
      UPDATE users 
      SET spotify_profile = NULL, updated_at = NOW()
      WHERE id = ${userId}
    `;
  }

  // APPLE MUSIC METHODS
  async saveAppleMusicProfile(profile: AppleMusicProfile): Promise<void> {
    await sql`
      INSERT INTO apple_music_profiles (id, user_id, music_user_token, storefront, connected_at, expires_at)
      VALUES (${profile.userId}, ${profile.userId}, ${profile.musicUserToken}, 
              ${profile.storefront}, ${profile.connectedAt}, ${profile.expiresAt})
      ON CONFLICT (user_id) DO UPDATE SET
        music_user_token = EXCLUDED.music_user_token,
        storefront = EXCLUDED.storefront,
        connected_at = EXCLUDED.connected_at,
        expires_at = EXCLUDED.expires_at
    `;
  }

  async getAppleMusicProfile(userId: string): Promise<AppleMusicProfile | null> {
    const result = await sql`
      SELECT user_id, music_user_token, storefront, connected_at, expires_at
      FROM apple_music_profiles WHERE user_id = ${userId}
    `;

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      userId: row.user_id,
      musicUserToken: row.music_user_token,
      storefront: row.storefront,
      connectedAt: row.connected_at,
      expiresAt: row.expires_at
    };
  }

  async removeAppleMusicProfile(userId: string): Promise<void> {
    await sql`DELETE FROM apple_music_profiles WHERE user_id = ${userId}`;
  }

  async disconnectAppleMusic(userId: string): Promise<void> {
    await this.removeAppleMusicProfile(userId);
    
    // Also remove from user's apple_music_profile field
    await sql`
      UPDATE users 
      SET apple_music_profile = NULL, updated_at = NOW()
      WHERE id = ${userId}
    `;
  }

  async disconnectAllMusicServices(userId: string): Promise<void> {
    await this.disconnectSpotify(userId);
    await this.disconnectAppleMusic(userId);
  }

  // MUSIC PORTRAIT METHODS
  async saveMusicPortrait(portrait: MusicPortrait): Promise<void> {
    await sql`
      INSERT INTO music_portraits (id, user_id, source, top_genres, top_artists, top_tracks, 
                                  audio_features, party_readiness, generated_at)
      VALUES (${portrait.userId}, ${portrait.userId}, ${portrait.source}, 
              ${JSON.stringify(portrait.topGenres)}, ${JSON.stringify(portrait.topArtists)}, 
              ${JSON.stringify(portrait.topTracks)}, ${JSON.stringify(portrait.audioFeatures)}, 
              ${portrait.partyReadiness}, ${portrait.generatedAt})
      ON CONFLICT (user_id, source) DO UPDATE SET
        top_genres = EXCLUDED.top_genres,
        top_artists = EXCLUDED.top_artists,
        top_tracks = EXCLUDED.top_tracks,
        audio_features = EXCLUDED.audio_features,
        party_readiness = EXCLUDED.party_readiness,
        generated_at = EXCLUDED.generated_at
    `;
  }

  async getMusicPortrait(userId: string): Promise<MusicPortrait | null> {
    const result = await sql`
      SELECT user_id, source, top_genres, top_artists, top_tracks, audio_features, 
             party_readiness, generated_at
      FROM music_portraits WHERE user_id = ${userId} AND source = 'spotify'
    `;

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      userId: row.user_id,
      source: row.source,
      topGenres: row.top_genres,
      topArtists: row.top_artists,
      topTracks: row.top_tracks,
      audioFeatures: row.audio_features,
      partyReadiness: row.party_readiness,
      generatedAt: row.generated_at
    };
  }

  async getUnifiedMusicPortrait(userId: string): Promise<any | null> {
    const result = await sql`
      SELECT unified_music_portrait FROM users WHERE id = ${userId}
    `;

    if (result.rows.length === 0) return null;
    return result.rows[0].unified_music_portrait;
  }

  async getSpotifyPortrait(userId: string): Promise<any | null> {
    const result = await sql`
      SELECT top_genres, top_artists, top_tracks, audio_features
      FROM music_portraits WHERE user_id = ${userId} AND source = 'spotify'
    `;

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      topTracks: row.top_tracks || [],
      topGenres: row.top_genres || [],
      audioFeatures: row.audio_features
    };
  }

  async getAppleMusicPortrait(userId: string): Promise<any | null> {
    const result = await sql`
      SELECT top_genres, top_artists, top_tracks, audio_features
      FROM music_portraits WHERE user_id = ${userId} AND source = 'apple-music'
    `;

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      topTracks: row.top_tracks || [],
      topGenres: row.top_genres || [],
      audioFeatures: row.audio_features
    };
  }

  // Legacy methods for compatibility
  async getData(): Promise<StorageData> {
    // This method is not needed for PostgreSQL storage
    // but kept for compatibility
    return {
      users: [],
      parties: [],
      tracks: [],
      memberships: [],
      votes: [],
      spotifyProfiles: [],
      appleMusicProfiles: [],
      musicPortraits: []
    };
  }

  async saveData(data: StorageData): Promise<void> {
    // This method is not needed for PostgreSQL storage
    // but kept for compatibility
  }

  async getAllData(): Promise<StorageData> {
    // This method is not needed for PostgreSQL storage
    // but kept for compatibility
    return {
      users: [],
      parties: [],
      tracks: [],
      memberships: [],
      votes: [],
      spotifyProfiles: [],
      appleMusicProfiles: [],
      musicPortraits: []
    };
  }
}

// Export singleton instance
export const postgresStorage = new PostgresStorage();
