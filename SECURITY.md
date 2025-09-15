# 🔒 TootFM Security Guide

## Environment Variables Security

### ❌ НЕ ДЕЛАЙТЕ:
- НЕ коммитьте `.env.local` в git
- НЕ коммитьте `.env.production` в git
- НЕ публикуйте реальные credentials в коде

### ✅ ПРАВИЛЬНО:

#### 1. Локальная разработка:
```bash
# Скопируйте template
cp apps/web/.env.example apps/web/.env.local

# Отредактируйте с реальными значениями
nano apps/web/.env.local
```

#### 2. Production (Vercel):
- Добавьте переменные в Vercel Dashboard
- НЕ добавляйте в git

#### 3. Проверка безопасности:
```bash
# Проверьте что .env файлы в .gitignore
cat apps/web/.gitignore | grep env

# Проверьте что файлы не в git
git status | grep env
```

## 🔑 Required Environment Variables

### Development (.env.local):
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
SPOTIFY_CLIENT_ID=68a7ea6587af43cc893cc0994a584eff
SPOTIFY_CLIENT_SECRET=your-spotify-client-secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/auth/spotify/callback
```

### Production (Vercel Environment Variables):
```env
NEXTAUTH_URL=https://tootfm.world
NEXTAUTH_SECRET=your-production-secret
GOOGLE_CLIENT_ID=your-production-google-client-id
GOOGLE_CLIENT_SECRET=your-production-google-client-secret
SPOTIFY_CLIENT_ID=68a7ea6587af43cc893cc0994a584eff
SPOTIFY_CLIENT_SECRET=your-production-spotify-client-secret
SPOTIFY_REDIRECT_URI=https://tootfm.world/api/auth/spotify/callback
```

## 🚨 Security Checklist

- [ ] `.env.local` в `.gitignore`
- [ ] `.env.production` в `.gitignore`
- [ ] Реальные credentials НЕ в коде
- [ ] Production credentials в Vercel Dashboard
- [ ] NEXTAUTH_SECRET достаточно сложный
- [ ] Spotify Client Secret защищен
- [ ] Google Client Secret защищен

## 🔧 Quick Setup

```bash
# 1. Скопируйте template
cp apps/web/.env.example apps/web/.env.local

# 2. Заполните реальные значения
nano apps/web/.env.local

# 3. Проверьте что файл не в git
git status

# 4. Запустите проект
npm run dev
```
