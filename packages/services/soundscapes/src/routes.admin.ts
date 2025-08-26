import { NextRequest, NextResponse } from 'next/server'
import type { AuthHelpers, DatabaseHelpers, Logger, RouteHandler } from '../../../../src/lib/plugins/types'

interface RouteDependencies {
  db: DatabaseHelpers
  logger: Logger
  auth: AuthHelpers
  config?: any
}

export function createAdminRoutes({ db, logger, auth, config }: RouteDependencies): Record<string, RouteHandler> {
  return {
    // Admin soundscapes management page
    'GET:/': auth.requireAuth(auth.withRoles(['super_admin', 'admin'])(async (request: NextRequest) => {
      logger.info('Soundscapes admin route accessed')
      
      // Return admin interface HTML
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Soundscapes Admin - Familying</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
            .container { max-width: 1200px; margin: 0 auto; }
            .header { display: flex; justify-content: between; align-items: center; margin-bottom: 30px; }
            .btn { padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; }
            .btn-primary { background: #007bff; color: white; }
            .btn-primary:hover { background: #0056b3; }
            .btn-danger { background: #dc3545; color: white; }
            .btn-success { background: #28a745; color: white; }
            .table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid #e0e0e0; }
            .table th { background: #f8f9fa; font-weight: 600; }
            .status-published { color: #28a745; font-weight: 600; }
            .status-draft { color: #ffc107; font-weight: 600; }
            .modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; }
            .modal-content { background: white; margin: 5% auto; padding: 20px; width: 90%; max-width: 600px; border-radius: 8px; }
            .form-group { margin-bottom: 15px; }
            .form-group label { display: block; margin-bottom: 5px; font-weight: 600; }
            .form-group input, .form-group select, .form-group textarea { width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
            .form-group textarea { height: 80px; resize: vertical; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎵 Soundscapes Management</h1>
              <button class="btn btn-primary" onclick="openCreateModal()">Add Soundscape</button>
            </div>
            
            <table class="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Sort Order</th>
                  <th>Duration</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="soundscapes-table">
                <tr><td colspan="6" style="text-align: center; padding: 40px;">Loading...</td></tr>
              </tbody>
            </table>
          </div>
          
          <!-- Create/Edit Modal -->
          <div id="soundscape-modal" class="modal">
            <div class="modal-content">
              <h2 id="modal-title">Add Soundscape</h2>
              <form id="soundscape-form">
                <input type="hidden" id="soundscape-id">
                
                <div class="form-group">
                  <label for="title">Title *</label>
                  <input type="text" id="title" required>
                </div>
                
                <div class="form-group">
                  <label for="description">Description</label>
                  <textarea id="description"></textarea>
                </div>
                
                <div class="form-group">
                  <label for="category">Category *</label>
                  <select id="category" required>
                    <option value="">Select Category</option>
                    <option value="Sleep">Sleep</option>
                    <option value="Nature">Nature</option>
                    <option value="White Noise">White Noise</option>
                    <option value="Focus">Focus</option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label for="audio_url">Audio URL *</label>
                  <input type="url" id="audio_url" required>
                </div>
                
                <div class="form-group">
                  <label for="thumbnail_url">Thumbnail URL *</label>
                  <input type="url" id="thumbnail_url" required>
                </div>
                
                <div class="form-group">
                  <label for="duration_seconds">Duration (seconds)</label>
                  <input type="number" id="duration_seconds" min="0">
                </div>
                
                <div class="form-group">
                  <label for="sort_order">Sort Order</label>
                  <input type="number" id="sort_order" value="0">
                </div>
                
                <div class="form-group">
                  <label>
                    <input type="checkbox" id="is_published" checked> Published
                  </label>
                </div>
                
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                  <button type="button" class="btn" onclick="closeModal()">Cancel</button>
                  <button type="submit" class="btn btn-primary">Save</button>
                </div>
              </form>
            </div>
          </div>
          
          <script>
            let soundscapes = [];
            
            async function loadSoundscapes() {
              try {
                const response = await fetch('/api/soundscapes/admin/soundscapes');
                const result = await response.json();
                
                if (result.success) {
                  soundscapes = result.data;
                  renderSoundscapesTable();
                } else {
                  document.getElementById('soundscapes-table').innerHTML = 
                    '<tr><td colspan="6" style="text-align: center; color: red;">Failed to load soundscapes</td></tr>';
                }
              } catch (error) {
                document.getElementById('soundscapes-table').innerHTML = 
                  '<tr><td colspan="6" style="text-align: center; color: red;">Error loading soundscapes</td></tr>';
              }
            }
            
            function renderSoundscapesTable() {
              const tbody = document.getElementById('soundscapes-table');
              
              if (soundscapes.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #666;">No soundscapes found</td></tr>';
                return;
              }
              
              tbody.innerHTML = soundscapes.map(sound => \`
                <tr>
                  <td>\${sound.title}</td>
                  <td>\${sound.category}</td>
                  <td><span class="status-\${sound.is_published ? 'published' : 'draft'}">\${sound.is_published ? 'Published' : 'Draft'}</span></td>
                  <td>\${sound.sort_order}</td>
                  <td>\${sound.duration_seconds ? Math.floor(sound.duration_seconds / 60) + 'm' : '-'}</td>
                  <td>
                    <button class="btn btn-primary" onclick="editSoundscape('\${sound.id}')">Edit</button>
                    <button class="btn btn-danger" onclick="deleteSoundscape('\${sound.id}')">Delete</button>
                  </td>
                </tr>
              \`).join('');
            }
            
            function openCreateModal() {
              document.getElementById('modal-title').textContent = 'Add Soundscape';
              document.getElementById('soundscape-form').reset();
              document.getElementById('soundscape-id').value = '';
              document.getElementById('is_published').checked = true;
              document.getElementById('soundscape-modal').style.display = 'block';
            }
            
            function editSoundscape(id) {
              const sound = soundscapes.find(s => s.id === id);
              if (!sound) return;
              
              document.getElementById('modal-title').textContent = 'Edit Soundscape';
              document.getElementById('soundscape-id').value = id;
              document.getElementById('title').value = sound.title;
              document.getElementById('description').value = sound.description || '';
              document.getElementById('category').value = sound.category;
              document.getElementById('audio_url').value = sound.audio_url;
              document.getElementById('thumbnail_url').value = sound.thumbnail_url;
              document.getElementById('duration_seconds').value = sound.duration_seconds || '';
              document.getElementById('sort_order').value = sound.sort_order;
              document.getElementById('is_published').checked = sound.is_published;
              document.getElementById('soundscape-modal').style.display = 'block';
            }
            
            function closeModal() {
              document.getElementById('soundscape-modal').style.display = 'none';
            }
            
            async function deleteSoundscape(id) {
              if (!confirm('Are you sure you want to delete this soundscape?')) return;
              
              try {
                const response = await fetch(\`/api/soundscapes/admin/soundscapes/\${id}\`, {
                  method: 'DELETE'
                });
                
                if (response.ok) {
                  loadSoundscapes();
                } else {
                  alert('Failed to delete soundscape');
                }
              } catch (error) {
                alert('Error deleting soundscape');
              }
            }
            
            document.getElementById('soundscape-form').addEventListener('submit', async (e) => {
              e.preventDefault();
              
              const id = document.getElementById('soundscape-id').value;
              const data = {
                title: document.getElementById('title').value,
                description: document.getElementById('description').value,
                category: document.getElementById('category').value,
                audio_url: document.getElementById('audio_url').value,
                thumbnail_url: document.getElementById('thumbnail_url').value,
                duration_seconds: parseInt(document.getElementById('duration_seconds').value) || null,
                sort_order: parseInt(document.getElementById('sort_order').value) || 0,
                is_published: document.getElementById('is_published').checked
              };
              
              try {
                const response = await fetch(
                  id ? \`/api/soundscapes/admin/soundscapes/\${id}\` : '/api/soundscapes/admin/soundscapes',
                  {
                    method: id ? 'PUT' : 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                  }
                );
                
                if (response.ok) {
                  closeModal();
                  loadSoundscapes();
                } else {
                  alert('Failed to save soundscape');
                }
              } catch (error) {
                alert('Error saving soundscape');
              }
            });
            
            // Close modal when clicking outside
            window.onclick = function(event) {
              const modal = document.getElementById('soundscape-modal');
              if (event.target === modal) {
                closeModal();
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
    }))
  }
}
