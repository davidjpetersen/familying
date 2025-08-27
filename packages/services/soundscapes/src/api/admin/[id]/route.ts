import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { checkIsAdmin } from '@/lib/admin-adapter';
import { checkIsAdminDirect } from '@/lib/admin-adapter-direct';

// Sample data for soundscapes (in a real app, this would be in a database)
const sampleSoundscapes = [
  {
    id: '1',
    title: 'Ocean Waves',
    description: 'Peaceful ocean sounds for deep relaxation',
    category: 'Nature',
    audio_url: 'https://www.soundjay.com/misc/sounds/ocean-wave-1.wav',
    thumbnail_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop',
    is_published: true,
    sort_order: 1,
    duration_seconds: 1800,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    title: 'Forest Rain',
    description: 'Gentle rainfall in a peaceful forest',
    category: 'Nature',
    audio_url: 'https://www.soundjay.com/misc/sounds/rain-1.wav',
    thumbnail_url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
    is_published: true,
    sort_order: 2,
    duration_seconds: 2400,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    title: 'White Noise',
    description: 'Pure white noise for focus and concentration',
    category: 'White Noise',
    audio_url: 'https://www.soundjay.com/misc/sounds/white-noise-1.wav',
    thumbnail_url: 'https://images.unsplash.com/photo-1518709414372-162cfbd45b3b?w=400&h=300&fit=crop',
    is_published: true,
    sort_order: 3,
    duration_seconds: 3600,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '4',
    title: 'Meditation Bells',
    description: 'Soft bells for meditation and mindfulness',
    category: 'Focus',
    audio_url: 'https://www.soundjay.com/misc/sounds/bell-1.wav',
    thumbnail_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
    is_published: false,
    sort_order: 4,
    duration_seconds: 900,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

let soundscapes = [...sampleSoundscapes];

// Helper function to verify admin access
async function verifyAdminAccess() {
  const { userId } = await auth();
  
  if (!userId) {
    return null;
  }

  let admin = await checkIsAdmin(userId);
  if (!admin) {
    admin = await checkIsAdminDirect(userId);
  }
  
  return admin;
}

// PUT - Update soundscape
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdminAccess();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();
    const { title, description, category, audio_url, thumbnail_url, is_published, sort_order } = body;

    const soundscapeIndex = soundscapes.findIndex(s => s.id === id);
    if (soundscapeIndex === -1) {
      return NextResponse.json({ success: false, error: 'Soundscape not found' }, { status: 404 });
    }

    // Update the soundscape
    const updatedSoundscape = {
      ...soundscapes[soundscapeIndex],
      title: title || soundscapes[soundscapeIndex].title,
      description: description !== undefined ? description : soundscapes[soundscapeIndex].description,
      category: category || soundscapes[soundscapeIndex].category,
      audio_url: audio_url || soundscapes[soundscapeIndex].audio_url,
      thumbnail_url: thumbnail_url || soundscapes[soundscapeIndex].thumbnail_url,
      is_published: is_published !== undefined ? is_published : soundscapes[soundscapeIndex].is_published,
      sort_order: sort_order !== undefined ? sort_order : soundscapes[soundscapeIndex].sort_order,
      updated_at: new Date().toISOString()
    };

    soundscapes[soundscapeIndex] = updatedSoundscape;

    return NextResponse.json({
      success: true,
      data: updatedSoundscape
    });
  } catch (error) {
    console.error('Error updating soundscape:', error);
    return NextResponse.json({ success: false, error: 'Failed to update soundscape' }, { status: 500 });
  }
}

// DELETE - Delete soundscape
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdminAccess();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;
    
    const soundscapeIndex = soundscapes.findIndex(s => s.id === id);
    if (soundscapeIndex === -1) {
      return NextResponse.json({ success: false, error: 'Soundscape not found' }, { status: 404 });
    }

    // Remove the soundscape
    const deletedSoundscape = soundscapes.splice(soundscapeIndex, 1)[0];

    return NextResponse.json({
      success: true,
      data: deletedSoundscape
    });
  } catch (error) {
    console.error('Error deleting soundscape:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete soundscape' }, { status: 500 });
  }
}
