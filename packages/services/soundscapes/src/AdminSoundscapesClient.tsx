'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Upload, 
  Play, 
  Pause,
  Moon, 
  TreePine, 
  Radio, 
  Brain,
  Eye,
  EyeOff
} from 'lucide-react';

interface Soundscape {
  id: string;
  title: string;
  description?: string;
  category: 'Sleep' | 'Nature' | 'White Noise' | 'Focus';
  audio_url: string;
  thumbnail_url: string;
  is_published: boolean;
  sort_order: number;
  duration_seconds?: number;
  created_at: string;
  updated_at: string;
}

interface SoundscapeForm {
  title: string;
  description: string;
  category: 'Sleep' | 'Nature' | 'White Noise' | 'Focus';
  audio_url: string;
  thumbnail_url: string;
  is_published: boolean;
  sort_order: number;
}

const categories = ['Sleep', 'Nature', 'White Noise', 'Focus'] as const;

const categoryIcons: Record<string, any> = {
  'Sleep': Moon,
  'Nature': TreePine,
  'White Noise': Radio,
  'Focus': Brain
};

export default function AdminSoundscapesClient() {
  const [soundscapes, setSoundscapes] = useState<Soundscape[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [operationLoading, setOperationLoading] = useState<string | null>(null);
  
  const [form, setForm] = useState<SoundscapeForm>({
    title: '',
    description: '',
    category: 'Sleep',
    audio_url: '',
    thumbnail_url: '',
    is_published: true,
    sort_order: 0
  });

  useEffect(() => {
    fetchSoundscapes();
  }, []);

  const fetchSoundscapes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/soundscapes/soundscapes');
      const data = await response.json();
      
      if (data.success) {
        setSoundscapes(data.data.sort((a: Soundscape, b: Soundscape) => a.sort_order - b.sort_order));
      } else {
        setError('Failed to load soundscapes');
      }
    } catch (err) {
      setError('Failed to load soundscapes');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      category: 'Sleep',
      audio_url: '',
      thumbnail_url: '',
      is_published: true,
      sort_order: 0
    });
    setEditingId(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (soundscape: Soundscape) => {
    setForm({
      title: soundscape.title,
      description: soundscape.description || '',
      category: soundscape.category,
      audio_url: soundscape.audio_url,
      thumbnail_url: soundscape.thumbnail_url,
      is_published: soundscape.is_published,
      sort_order: soundscape.sort_order
    });
    setEditingId(soundscape.id);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.title || !form.audio_url || !form.thumbnail_url) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setOperationLoading(editingId ? 'update' : 'create');
      
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/api/soundscapes/admin/${editingId}` : '/api/soundscapes/admin';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchSoundscapes();
        setIsDialogOpen(false);
        resetForm();
      } else {
        alert(data.error || 'Operation failed');
      }
    } catch (err) {
      alert('Operation failed');
    } finally {
      setOperationLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this soundscape?')) {
      return;
    }

    try {
      setOperationLoading(id);
      
      const response = await fetch(`/api/soundscapes/admin/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchSoundscapes();
      } else {
        alert(data.error || 'Delete failed');
      }
    } catch (err) {
      alert('Delete failed');
    } finally {
      setOperationLoading(null);
    }
  };

  const togglePublished = async (soundscape: Soundscape) => {
    try {
      setOperationLoading(soundscape.id);
      
      const response = await fetch(`/api/soundscapes/admin/${soundscape.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...soundscape,
          is_published: !soundscape.is_published
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchSoundscapes();
      } else {
        alert(data.error || 'Update failed');
      }
    } catch (err) {
      alert('Update failed');
    } finally {
      setOperationLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p>Loading soundscapes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Soundscapes Management</h1>
          <p className="text-gray-600 mt-2">Manage ambient sounds for family wellness</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Soundscape
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Soundscapes</CardTitle>
          <CardDescription>
            Manage your collection of ambient sounds and white noise
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Preview</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sort Order</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {soundscapes.map((soundscape) => {
                const IconComponent = categoryIcons[soundscape.category] || Radio;
                
                return (
                  <TableRow key={soundscape.id}>
                    <TableCell>
                      <img 
                        src={soundscape.thumbnail_url} 
                        alt={soundscape.title}
                        className="w-12 h-12 rounded object-cover"
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{soundscape.title}</div>
                        {soundscape.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {soundscape.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <IconComponent className="w-4 h-4" />
                        <span>{soundscape.category}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePublished(soundscape)}
                        disabled={operationLoading === soundscape.id}
                      >
                        {soundscape.is_published ? (
                          <>
                            <Eye className="w-4 h-4 mr-1" />
                            <Badge variant="default">Published</Badge>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-4 h-4 mr-1" />
                            <Badge variant="secondary">Draft</Badge>
                          </>
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{soundscape.sort_order}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(soundscape)}
                          disabled={!!operationLoading}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(soundscape.id)}
                          disabled={operationLoading === soundscape.id}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {soundscapes.length === 0 && (
            <div className="text-center">
              <Radio className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No soundscapes yet</h3>
              <p className="text-gray-500 mb-4">Create your first ambient sound to get started.</p>
              <Button onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Add Soundscape
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Soundscape' : 'Create New Soundscape'}
            </DialogTitle>
            <DialogDescription>
              {editingId ? 'Update the soundscape details below.' : 'Add a new ambient sound to your collection.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g., Ocean Waves"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Peaceful ocean sounds for relaxation..."
              />
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <Select value={form.category} onValueChange={(value: any) => setForm({ ...form, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="audio_url">Audio URL *</Label>
              <Input
                id="audio_url"
                value={form.audio_url}
                onChange={(e) => setForm({ ...form, audio_url: e.target.value })}
                placeholder="https://example.com/audio.mp3"
                required
              />
            </div>

            <div>
              <Label htmlFor="thumbnail_url">Thumbnail URL *</Label>
              <Input
                id="thumbnail_url"
                value={form.thumbnail_url}
                onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })}
                placeholder="https://example.com/thumbnail.jpg"
                required
              />
            </div>

            <div>
              <Label htmlFor="sort_order">Sort Order</Label>
              <Input
                id="sort_order"
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_published"
                checked={form.is_published}
                onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="is_published">Published</Label>
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
                disabled={!!operationLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={!!operationLoading}
              >
                {operationLoading ? 'Saving...' : (editingId ? 'Update' : 'Create')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
