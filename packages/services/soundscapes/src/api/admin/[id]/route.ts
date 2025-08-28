import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { checkIsAdmin } from '@/lib/admin-adapter';
import { checkIsAdminDirect } from '@/lib/admin-adapter-direct';
import { validateParams, validateRequestBody, createValidationErrorResponse } from '../../../validation/middleware';
import { IdParamSchema, UpdateSoundscapeSchema } from '../../../validation/schemas';

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
  { params }: { params: { id: string } }
) {
  try {
    const admin = await verifyAdminAccess();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    // Validate params
    const paramsValidation = validateParams(params, IdParamSchema);
    if (!paramsValidation.success) {
      return createValidationErrorResponse(paramsValidation);
    }
    const { id } = paramsValidation.data;

    // Validate request body
    const bodyValidation = await validateRequestBody(request, UpdateSoundscapeSchema);
    if (!bodyValidation.success) {
      return createValidationErrorResponse(bodyValidation);
    }
    const bodyData = bodyValidation.data;

    const soundscapeIndex = soundscapes.findIndex(s => s.id === id);
    if (soundscapeIndex === -1) {
      return NextResponse.json({ success: false, error: 'Soundscape not found' }, { status: 404 });
    }

    // Update the soundscape using validated data
    const updatedSoundscape = {
      ...soundscapes[soundscapeIndex],
      ...bodyData,
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
  { params }: { params: { id: string } }
) {
  try {
    const admin = await verifyAdminAccess();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    // Validate params
    const paramsValidation = validateParams(params, IdParamSchema);
    if (!paramsValidation.success) {
      return createValidationErrorResponse(paramsValidation);
    }
    const { id } = paramsValidation.data;
    
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
