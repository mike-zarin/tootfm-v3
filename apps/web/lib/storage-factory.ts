import { MemoryStorage } from './storage-memory'
import { JsonFileStorage } from './storage'

// Определяем какой storage использовать
function createStorage() {
  // На Vercel ОБЯЗАТЕЛЬНО используем MemoryStorage
  // потому что файловая система read-only
  if (process.env.VERCEL || process.env.VERCEL_ENV) {
    console.log('[Storage] Using MemoryStorage for Vercel deployment')
    return new MemoryStorage()
  }
  
  // В production (но не на Vercel) тоже используем Memory
  // для избежания проблем с правами доступа
  if (process.env.NODE_ENV === 'production') {
    console.log('[Storage] Using MemoryStorage for production')
    return new MemoryStorage()
  }
  
  // Только для локальной разработки используем файлы
  console.log('[Storage] Using JsonFileStorage for development')
  return new JsonFileStorage()
}

// Экспортируем правильный storage
export const storage = createStorage()
export const fileStorage = storage // для обратной совместимости
export const memoryStorage = storage // для обратной совместимости

// Функция для получения storage (если где-то используется)
export function getStorage() {
  return storage
}