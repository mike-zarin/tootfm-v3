# Production Deployment Guide for tootfm.world

## Critical Environment Variables for Vercel

Set these environment variables in your Vercel dashboard:

### NextAuth Configuration
```
NEXTAUTH_URL=https://tootfm.world
NEXTAUTH_SECRET=your-production-secret-here
```

### Google OAuth
```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Spotify API
```
SPOTIFY_CLIENT_ID=your-spotify-client-id
SPOTIFY_CLIENT_SECRET=your-spotify-client-secret
SPOTIFY_REDIRECT_URI=https://tootfm.world/api/auth/spotify/callback
```

### Apple Music
```
APPLE_TEAM_ID=your-apple-team-id
APPLE_KEY_ID=your-apple-key-id
APPLE_PRIVATE_KEY=your-apple-private-key
```

### Pusher (Real-time features)
```
PUSHER_APP_ID=your-pusher-app-id
PUSHER_KEY=your-pusher-key
PUSHER_SECRET=your-pusher-secret
PUSHER_CLUSTER=your-pusher-cluster
```

### Feature Flags
```
ENABLE_SPOTIFY=true
ENABLE_APPLE_MUSIC=true
ENABLE_LASTFM=false
NODE_ENV=production
```

## Spotify App Configuration

Update your Spotify app settings to include these redirect URIs:
- `https://tootfm.world/api/auth/spotify/callback`
- `https://tootfm.vercel.app/api/auth/spotify/callback` (backup)
- `http://localhost:3000/api/auth/spotify/callback` (development)

## Vercel Configuration

1. **Root Directory**: `apps/web`
2. **Build Command**: `npm run build`
3. **Output Directory**: `.next`
4. **Install Command**: `npm install`

## Fixed Issues

✅ **Spotify Connect CORS Error**: Fixed - now returns redirect instead of JSON
✅ **Party 404 Error**: Fixed - party page exists and works correctly
✅ **Apple Music "Coming Soon"**: Fixed - now shows real integration
✅ **Music Portrait UI**: Fixed - added to main page when music services connected

## Testing Checklist

After deployment, test these features:
- [ ] Google OAuth login
- [ ] Spotify connection
- [ ] Apple Music connection
- [ ] Party creation
- [ ] Party joining
- [ ] Music portrait generation
- [ ] Real-time features (Pusher)

## Storage Strategy

Currently using in-memory storage (data lost on restart).
For production, consider migrating to:
- Vercel KV (Redis)
- Vercel Postgres
- Supabase
