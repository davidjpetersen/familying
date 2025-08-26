import { NextRequest, NextResponse } from 'next/server'
import type { AuthHelpers, DatabaseHelpers, Logger, RouteHandler } from '../../../../src/lib/plugins/types'

interface RouteDependencies {
  db: DatabaseHelpers
  logger: Logger
  auth: AuthHelpers
}

export function createUserRoutes({ db, logger, auth }: RouteDependencies): Record<string, RouteHandler> {
  return {
    // Main soundscapes page - returns the React component as HTML
    'GET:/': auth.requireAuth(async (request: NextRequest) => {
      logger.info('Soundscapes user route accessed')
      
      // For user routes, we need to return the actual page HTML
      // This is a temporary solution - in a full implementation,
      // we'd render the React component server-side
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Soundscapes - Familying</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; }
            .container { max-width: 1200px; margin: 0 auto; }
            .hero { text-align: center; margin-bottom: 40px; }
            .category-section { margin-bottom: 40px; }
            .category-title { font-size: 1.5rem; font-weight: 600; margin-bottom: 20px; }
            .soundscapes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
            .soundscape-card { border: 1px solid #e0e0e0; border-radius: 12px; padding: 20px; background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .soundscape-title { font-weight: 600; margin-bottom: 8px; }
            .soundscape-description { color: #666; font-size: 0.9rem; margin-bottom: 16px; }
            .audio-controls { display: flex; align-items: center; gap: 10px; }
            button { padding: 8px 16px; border: none; border-radius: 6px; background: #007bff; color: white; cursor: pointer; }
            button:hover { background: #0056b3; }
            .loading { text-align: center; padding: 40px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="hero">
              <h1>🎵 Soundscapes</h1>
              <p>Discover calming sounds for your family's wellbeing</p>
            </div>
            
            <div id="soundscapes-container">
              <div class="loading">Loading soundscapes...</div>
            </div>
          </div>
          
          <script>
            async function loadSoundscapes() {
              try {
                const response = await fetch('/api/soundscapes/soundscapes');
                const result = await response.json();
                
                if (result.success) {
                  renderSoundscapes(result.data, result.categories);
                } else {
                  document.getElementById('soundscapes-container').innerHTML = 
                    '<div class="loading">Failed to load soundscapes</div>';
                }
              } catch (error) {
                document.getElementById('soundscapes-container').innerHTML = 
                  '<div class="loading">Error loading soundscapes</div>';
              }
            }
            
            function renderSoundscapes(soundscapes, categories) {
              const container = document.getElementById('soundscapes-container');
              const categorizedSounds = {};
              
              categories.forEach(cat => categorizedSounds[cat] = []);
              soundscapes.forEach(sound => {
                if (categorizedSounds[sound.category]) {
                  categorizedSounds[sound.category].push(sound);
                }
              });
              
              let html = '';
              categories.forEach(category => {
                if (categorizedSounds[category].length > 0) {
                  html += \`
                    <div class="category-section">
                      <h2 class="category-title">\${category}</h2>
                      <div class="soundscapes-grid">
                        \${categorizedSounds[category].map(sound => \`
                          <div class="soundscape-card">
                            <div class="soundscape-title">\${sound.title}</div>
                            \${sound.description ? \`<div class="soundscape-description">\${sound.description}</div>\` : ''}
                            <div class="audio-controls">
                              <button onclick="playSound('\${sound.audio_url}', this)">▶ Play</button>
                              <span id="duration-\${sound.id}">\${sound.duration_seconds ? Math.floor(sound.duration_seconds / 60) + 'm' : ''}</span>
                            </div>
                          </div>
                        \`).join('')}
                      </div>
                    </div>
                  \`;
                }
              });
              
              container.innerHTML = html;
            }
            
            let currentAudio = null;
            let currentButton = null;
            
            function playSound(audioUrl, button) {
              if (currentAudio && !currentAudio.paused) {
                currentAudio.pause();
                if (currentButton) currentButton.textContent = '▶ Play';
              }
              
              if (button.textContent === '▶ Play') {
                currentAudio = new Audio(audioUrl);
                currentAudio.loop = true;
                currentAudio.play();
                button.textContent = '⏸ Pause';
                currentButton = button;
                
                currentAudio.onended = () => {
                  button.textContent = '▶ Play';
                };
              } else {
                if (currentAudio) currentAudio.pause();
                button.textContent = '▶ Play';
                currentButton = null;
              }
            }
            
            loadSoundscapes();
          </script>
        </body>
        </html>
      `
      
      return new NextResponse(html, {
        headers: { 'Content-Type': 'text/html' }
      })
    })
  }
}
