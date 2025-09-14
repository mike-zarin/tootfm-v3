// app/api/auth/apple-music/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateAppleMusicToken } from '@/lib/apple-music-jwt';
export async function GET(request: NextRequest) {
  try {
    const developerToken = generateAppleMusicToken();
    // Вместо JSON возвращаем HTML страницу с MusicKit
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Connect Apple Music - TootFM</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <script src="https://js-cdn.music.apple.com/musickit/v3/musickit.js"></script>
        <style>
          body {
            margin: 0;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #9333ea 0%, #6b21a8 50%, #4c1d95 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .container {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px;
            max-width: 400px;
            text-align: center;
            color: white;
          }
          h1 { margin-bottom: 10px; }
          .subtitle { 
            color: #e9d5ff; 
            margin-bottom: 30px;
          }
          .button {
            background: #000;
            color: white;
            padding: 14px 32px;
            border-radius: 50px;
            border: none;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s;
          }
          .button:hover {
            transform: scale(1.05);
          }
          .button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          .status {
            margin-top: 20px;
            padding: 15px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            display: none;
          }
          .status.show { display: block; }
          .error { background: rgba(239, 68, 68, 0.2); }
          .success { background: rgba(34, 197, 94, 0.2); }
          .back-link {
            color: #e9d5ff;
            text-decoration: none;
            margin-top: 20px;
            display: inline-block;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🎵 Connect Apple Music</h1>
          <p class="subtitle">Sign in to sync your music library with TootFM</p>
          <button id="connectBtn" class="button" onclick="connectAppleMusic()">
            Connect with Apple Music
          </button>
          <div id="status" class="status"></div>
          <a href="/" class="back-link">← Back to Home</a>
        </div>
        <script>
          async function connectAppleMusic() {
            const button = document.getElementById('connectBtn');
            const status = document.getElementById('status');
            button.disabled = true;
            button.textContent = 'Connecting...';
            try {
              // Initialize MusicKit
              await MusicKit.configure({
                developerToken: '${developerToken}',
                app: {
                  name: 'TootFM',
                  build: '1.0.0'
                }
              });
              const music = MusicKit.getInstance();
              // Request authorization
              const userToken = await music.authorize();
              if (userToken) {
                // Save the token to backend
                const response = await fetch('/api/auth/apple-music/callback', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    userToken,
                    developerToken: '${developerToken}'
                  })
                });
                if (response.ok) {
                  status.className = 'status success show';
                  status.textContent = '✓ Successfully connected! Redirecting...';
                  setTimeout(() => window.location.href = '/api/auth/apple-music/success', 1000);
                } else {
                  throw new Error('Failed to save connection');
                }
              }
            } catch (error) {
              console.error('[ERROR]' + ' ' + 'Apple Music connection error:', error);
              status.className = 'status error show';
              status.textContent = 'Failed to connect. Please try again.';
              button.disabled = false;
              button.textContent = 'Connect with Apple Music';
            }
          }
        </script>
      </body>
      </html>
    `;
    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    console.error('[ERROR]' + ' ' + 'Apple Music token generation failed:', error);
    // Если токен не генерируется, показываем страницу с ошибкой
    const errorHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Apple Music Error - TootFM</title>
        <style>
          body {
            background: linear-gradient(135deg, #9333ea 0%, #6b21a8 100%);
            color: white;
            font-family: system-ui;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
          }
          .container {
            text-align: center;
            padding: 40px;
            background: rgba(255,255,255,0.1);
            border-radius: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>⚠️ Configuration Error</h1>
          <p>Apple Music is not properly configured.</p>
          <p>Please check your environment variables.</p>
          <a href="/" style="color: #e9d5ff;">← Back to Home</a>
        </div>
      </body>
      </html>
    `;
    return new NextResponse(errorHtml, {
      headers: { 'Content-Type': 'text/html' },
      status: 500
    });
  }
}