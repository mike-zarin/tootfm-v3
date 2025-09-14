import fs from 'fs/promises';
import path from 'path';

async function clearPartyTracks(partyId: string) {
  const dataPath = path.join(process.cwd(), 'apps/web/data.json');
  
  // Читаем данные
  const dataStr = await fs.readFile(dataPath, 'utf-8');
  const data = JSON.parse(dataStr);
  
  // Считаем сколько было треков
  const before = data.tracks.length;
  
  // Удаляем треки этой party
  data.tracks = data.tracks.filter((t: any) => t.partyId !== partyId);
  
  const after = data.tracks.length;
  
  // Сохраняем обратно
  await fs.writeFile(dataPath, JSON.stringify(data, null, 2));
  
  console.log(`Cleared ${before - after} tracks for party ${partyId}`);
  console.log(`Total tracks remaining: ${after}`);
}

// Очищаем треки для твоей party
clearPartyTracks('party_1757766482711_6ycjbfmp5')
  .catch(console.error);
