# tootFM Logout & Disconnect Implementation

## Реализованный функционал

### 1. Компонент SignOutButton
**Путь:** `/apps/web/components/auth/SignOutButton.tsx`

- Использует `signOut` из `next-auth/react`
- Стилизован как красная кнопка
- При клике выходит с редиректом на главную страницу

### 2. Компонент MusicProfileManager
**Путь:** `/apps/web/components/music/MusicProfileManager.tsx`

- Показывает статус подключения Spotify/Apple Music
- Кнопки "Disconnect" для каждого сервиса
- Вызывает соответствующие API endpoints
- Автоматически обновляет статус после disconnect

### 3. API Endpoints

#### Spotify Disconnect
**Путь:** `/apps/web/app/api/auth/spotify/disconnect/route.ts`
- `POST` - отвязка Spotify
- `GET` - проверка статуса подключения

#### Apple Music Disconnect
**Путь:** `/apps/web/app/api/auth/apple-music/disconnect/route.ts`
- `POST` - отвязка Apple Music
- `GET` - проверка статуса подключения

#### Logout
**Путь:** `/apps/web/app/api/auth/logout/route.ts`
- `POST` - полный выход из системы с отвязкой всех сервисов

### 4. Обновленные методы в storage.ts

```typescript
async disconnectSpotify(userId: string): Promise<void>
async disconnectAppleMusic(userId: string): Promise<void>
async disconnectAllMusicServices(userId: string): Promise<void>
```

**Важно:** Методы удаляют данные из ОБОИХ мест:
- Из массивов `spotifyProfiles[]` и `appleMusicProfiles[]`
- Из объектов `user.spotifyProfile` и `user.appleMusicProfile`

### 5. Обновленные страницы

#### Главная страница (`/apps/web/app/page.tsx`)
- Добавлена кнопка Sign Out в правом верхнем углу
- Добавлена секция "Connected Music Services" с MusicProfileManager

#### Страница профиля (`/apps/web/app/profile/page.tsx`)
- Добавлена кнопка Sign Out
- Добавлена кнопка "Back to Home"
- Добавлена секция управления музыкальными сервисами

## Как использовать

### 1. Выход из системы
- Нажмите кнопку "Sign Out" на любой странице
- Система автоматически отключит все музыкальные сервисы
- Произойдет редирект на главную страницу

### 2. Отвязка музыкальных сервисов
- Перейдите на главную страницу или страницу профиля
- В секции "Connected Music Services" нажмите "Disconnect"
- Система удалит все данные сервиса из обеих локаций

### 3. Проверка статуса
- Компонент MusicProfileManager автоматически проверяет статус подключения
- Показывает актуальную информацию о подключенных сервисах

## Технические детали

### Обработка дублирования данных
Система корректно обрабатывает дублирование данных:
- `spotifyProfiles[]` - основной массив профилей
- `user.spotifyProfile` - дублирование для обратной совместимости

При disconnect удаляются данные из обеих локаций.

### Безопасность
- Все API endpoints проверяют аутентификацию
- Используется NextAuth для управления сессиями
- Токены и чувствительные данные не передаются в UI

### Обратная совместимость
- Сохранена существующая структура данных
- Не изменена схема `user.id` (остается Google ID)
- Все существующие функции продолжают работать

## Тестирование

Запустите тестовый скрипт:
```bash
node test-logout-disconnect.js
```

Проверьте:
1. ✅ Кнопка Sign Out выходит из системы
2. ✅ Disconnect Spotify удаляет токены и профиль
3. ✅ После disconnect поиск музыки перестает работать
4. ✅ Можно переподключить Spotify заново
5. ✅ Данные удаляются из обеих локаций

## Файлы изменены

- ✅ `/apps/web/components/auth/SignOutButton.tsx` (новый)
- ✅ `/apps/web/components/music/MusicProfileManager.tsx` (новый)
- ✅ `/apps/web/lib/storage.ts` (обновлен)
- ✅ `/apps/web/app/page.tsx` (обновлен)
- ✅ `/apps/web/app/profile/page.tsx` (обновлен)
- ✅ `/apps/web/app/api/auth/spotify/disconnect/route.ts` (обновлен)
- ✅ `/apps/web/app/api/auth/apple-music/disconnect/route.ts` (уже существовал)
- ✅ `/apps/web/app/api/auth/logout/route.ts` (уже существовал)
