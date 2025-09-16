-- tootFM Database Schema for Vercel Postgres
-- This schema supports the current memory storage structure

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  spotify_profile JSONB,
  apple_music_profile JSONB,
  music_portrait JSONB,
  unified_music_portrait JSONB
);

-- Parties table
CREATE TABLE IF NOT EXISTS parties (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  host_id TEXT NOT NULL REFERENCES users(id),
  host_name TEXT,
  host_image TEXT,
  status TEXT NOT NULL DEFAULT 'WAITING',
  settings JSONB DEFAULT '{}',
  current_track_id TEXT,
  is_playing BOOLEAN DEFAULT FALSE,
  position INTEGER DEFAULT 0,
  last_position_update TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Memberships table
CREATE TABLE IF NOT EXISTS memberships (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  party_id TEXT NOT NULL REFERENCES parties(id),
  role TEXT NOT NULL DEFAULT 'guest',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  left_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, party_id)
);

-- Tracks table
CREATE TABLE IF NOT EXISTS tracks (
  id TEXT PRIMARY KEY,
  party_id TEXT NOT NULL REFERENCES parties(id),
  position INTEGER NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  album TEXT,
  duration INTEGER,
  isrc TEXT,
  spotify_id TEXT,
  apple_music_id TEXT,
  image_url TEXT,
  preview_url TEXT,
  added_by_id TEXT REFERENCES users(id),
  added_by_name TEXT,
  played_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  votes INTEGER DEFAULT 0,
  is_generated BOOLEAN DEFAULT FALSE
);

-- Votes table
CREATE TABLE IF NOT EXISTS votes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  track_id TEXT NOT NULL REFERENCES tracks(id),
  type TEXT NOT NULL CHECK (type IN ('up', 'down', 'skip')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, track_id)
);

-- Spotify profiles table
CREATE TABLE IF NOT EXISTS spotify_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  display_name TEXT,
  email TEXT,
  product TEXT,
  country TEXT,
  images JSONB,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  spotify_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Apple Music profiles table
CREATE TABLE IF NOT EXISTS apple_music_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  music_user_token TEXT NOT NULL,
  storefront TEXT,
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Music portraits table
CREATE TABLE IF NOT EXISTS music_portraits (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  source TEXT NOT NULL CHECK (source IN ('spotify', 'apple-music', 'unified')),
  top_genres TEXT[],
  top_artists JSONB,
  top_tracks JSONB,
  audio_features JSONB,
  party_readiness INTEGER,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, source)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_parties_code ON parties(code);
CREATE INDEX IF NOT EXISTS idx_parties_host_id ON parties(host_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_party_id ON memberships(party_id);
CREATE INDEX IF NOT EXISTS idx_tracks_party_id ON tracks(party_id);
CREATE INDEX IF NOT EXISTS idx_tracks_position ON tracks(party_id, position);
CREATE INDEX IF NOT EXISTS idx_votes_track_id ON votes(track_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);
CREATE INDEX IF NOT EXISTS idx_spotify_profiles_user_id ON spotify_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_apple_music_profiles_user_id ON apple_music_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_music_portraits_user_id ON music_portraits(user_id);

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parties_updated_at BEFORE UPDATE ON parties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_spotify_profiles_updated_at BEFORE UPDATE ON spotify_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
