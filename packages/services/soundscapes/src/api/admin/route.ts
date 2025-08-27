import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { checkIsAdmin } from '@/lib/admin-adapter';
import { checkIsAdminDirect } from '@/lib/admin-adapter-direct';

// Sample data for soundscapes (since database might not be set up yet)
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

// GET - List all soundscapes (admin view)
export async function GET() {
  try {
    const admin = await verifyAdminAccess();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    // In a real implementation, this would fetch from database
    // For now, return sample data
    return NextResponse.json({
      success: true,
      data: soundscapes,
      categories: ['Sleep', 'Nature', 'White Noise', 'Focus']
    });
  } catch (error) {
    console.error('Error fetching soundscapes:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch soundscapes' }, { status: 500 });
  }
}

// POST - Create new soundscape
export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdminAccess();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, category, audio_url, thumbnail_url, is_published, sort_order } = body;

    if (!title || !audio_url || !thumbnail_url || !category) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const newSoundscape = {
      id: Date.now().toString(),
      title,
      description: description || '',
      category,
      audio_url,
      thumbnail_url,
      is_published: is_published !== undefined ? is_published : true,
      sort_order: sort_order || 0,
      duration_seconds: 1800, // Default 30 minutes
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    soundscapes.push(newSoundscape);

    return NextResponse.json({
      success: true,
      data: newSoundscape
    });
  } catch (error) {
    console.error('Error creating soundscape:', error);
    return NextResponse.json({ success: false, error: 'Failed to create soundscape' }, { status: 500 });
  }
}
