// lib/apple-music-jwt.ts
import jwt from 'jsonwebtoken';
export function generateAppleMusicToken(): string {
  const privateKey = process.env.APPLE_PRIVATE_KEY;
  const teamId = process.env.APPLE_TEAM_ID;
  const keyId = process.env.APPLE_KEY_ID;
  // Отладка
  if (!privateKey || !teamId || !keyId) {
    throw new Error(
      `Apple Music credentials missing: ` +
      `TeamID: ${!!teamId}, KeyID: ${!!keyId}, PrivateKey: ${!!privateKey}`
    );
  }
  try {
    const token = jwt.sign({}, privateKey, {
      algorithm: 'ES256',
      expiresIn: '180d',
      issuer: teamId,
      header: {
        alg: 'ES256',
        kid: keyId
      }
    });
    return token;
  } catch (error) {
    console.error('[ERROR]' + ' ' + 'JWT generation error:', error);
    throw error;
  }
}