import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Instead of trying to create the table via exec_sql, let's just try to insert sample data
    // The table should be created manually in Supabase first
    const sampleData = [
      {
        title: 'Ocean Waves',
        description: 'Peaceful ocean sounds for deep relaxation',
        category: 'Nature',
        audio_url: 'https://www.soundjay.com/misc/sounds/ocean-wave-1.wav',
        thumbnail_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop',
        is_published: true,
        sort_order: 1,
        duration_seconds: 1800
      },
      {
        title: 'Forest Rain',
        description: 'Gentle rainfall in a peaceful forest',
        category: 'Nature',
        audio_url: 'https://www.soundjay.com/misc/sounds/rain-1.wav',
        thumbnail_url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
        is_published: true,
        sort_order: 2,
        duration_seconds: 2400
      },
      {
        title: 'White Noise',
        description: 'Pure white noise for focus and concentration',
        category: 'White Noise',
        audio_url: 'https://www.soundjay.com/misc/sounds/white-noise-1.wav',
        thumbnail_url: 'https://images.unsplash.com/photo-1518709414372-162cfbd45b3b?w=400&h=300&fit=crop',
        is_published: true,
        sort_order: 3,
        duration_seconds: 3600
      },
      {
        title: 'Meditation Bells',
        description: 'Soft bells for meditation and mindfulness',
        category: 'Focus',
        audio_url: 'https://www.soundjay.com/misc/sounds/bell-1.wav',
        thumbnail_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
        is_published: false,
        sort_order: 4,
        duration_seconds: 900
      }
    ]

    // Check if data already exists
    const { data: existingData, error: selectError } = await supabaseAdmin
      .from('soundscapes')
      .select('id')
      .limit(1)

    if (selectError) {
      return NextResponse.json({
        success: false,
        error: `Table not found. Please create the soundscapes table first: ${selectError.message}`,
        createTableSQL: `
-- Run this SQL in Supabase SQL Editor:
CREATE TABLE public.soundscapes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text check (category in ('Sleep', 'Nature', 'White Noise', 'Focus')) default 'Sleep',
  audio_url text not null,
  thumbnail_url text not null,
  is_published boolean default true,
  sort_order int default 0,
  duration_seconds int,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

CREATE INDEX idx_soundscapes_category ON public.soundscapes(category);
CREATE INDEX idx_soundscapes_published ON public.soundscapes(is_published);
CREATE INDEX idx_soundscapes_sort_order ON public.soundscapes(sort_order);

ALTER TABLE public.soundscapes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Soundscapes are viewable by authenticated users" ON public.soundscapes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Soundscapes are manageable by admins" ON public.soundscapes
  FOR ALL USING (true);
`
      }, { status: 400 })
    }

    if (existingData && existingData.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Sample data already exists in soundscapes table'
      })
    }

    // Insert sample data
    const { error: insertError } = await supabaseAdmin
      .from('soundscapes')
      .insert(sampleData)

    if (insertError) {
      console.error('Sample data error:', insertError)
      return NextResponse.json({
        success: false,
        error: `Failed to insert sample data: ${insertError.message}`
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Sample data inserted successfully into soundscapes table'
    })

  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Setup failed'
    }, { status: 500 })
  }
}
