import { memoryStorage as memoryStorageInstance } from './storage-memory'
import { storage as jsonFileStorageInstance } from './storage'
import { postgresStorage } from './storage-postgres'

// Определяем какой storage использовать
function createStorage() {
  // В production используем PostgreSQL если доступен
  if (process.env.NODE_ENV === 'production' && process.env.POSTGRES_URL) {
    console.log('[Storage] Using PostgreSQL for production')
    return postgresStorage
  }
  
  // На Vercel без PostgreSQL используем MemoryStorage
  if (process.env.VERCEL || process.env.VERCEL_ENV) {
    console.log('[Storage] Using MemoryStorage for Vercel deployment')
    return memoryStorageInstance
  }
  
  // Только для локальной разработки используем файлы
  console.log('[Storage] Using JsonFileStorage for development')
  return jsonFileStorageInstance
}

// Экспортируем правильный storage
export const storage = createStorage()
export const fileStorage = storage // для обратной совместимости
export const memoryStorage = storage // для обратной совместимости

// Функция для получения storage (если где-то используется)
export function getStorage() {
  return storage
}