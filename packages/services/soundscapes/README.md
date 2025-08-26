# Soundscapes Plugin

A calming audio gallery microservice for families, designed for the Familying.org platform.

## Overview

**Soundscapes** is a white noise and ambient sound player that provides a gallery-based experience for discovering, playing, and setting timers on soothing sounds to support family wellness.

## Features

### Public Interface (`/app/soundscapes`)
- **Hero Section**: Welcome message and description
- **Category Organization**: Sounds grouped by Sleep, Nature, White Noise, and Focus
- **Audio Player**: Play/pause, volume control, loop functionality
- **Sleep Timer**: Auto-stop after 15, 30, or 60 minutes
- **Responsive Design**: Mobile-first gallery layout

### Admin Interface (`/admin/soundscapes`)
- **Upload Management**: Add new soundscapes with audio and thumbnail URLs
- **Content Management**: Edit titles, descriptions, and categories
- **Publishing Control**: Toggle published/draft status
- **Sort Order**: Arrange soundscapes within categories

### API Endpoints
- `GET /api/soundscapes` - List published soundscapes (with optional category filter)
- `GET /api/soundscapes/:id` - Get specific soundscape
- `POST /api/soundscapes` - Create new soundscape (admin only)
- `PUT /api/soundscapes/:id` - Update soundscape (admin only)  
- `DELETE /api/soundscapes/:id` - Delete soundscape (admin only)

## Database Schema

```sql
create table public.soundscapes (
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
```

## Categories

- **Sleep**: Calming sounds for bedtime and naps
- **Nature**: Outdoor sounds like rain, ocean waves, forest
- **White Noise**: Consistent background sounds for focus
- **Focus**: Ambient sounds to enhance concentration

## File Structure

```
packages/services/soundscapes/
├── plugin.manifest.json          # Plugin configuration
├── package.json                  # NPM dependencies
├── migrations/
│   └── 0001_create_soundscapes_table.sql
└── src/
    ├── index.ts                  # Main plugin registration
    ├── SoundscapesPage.tsx      # Public user interface
    └── AdminSoundscapesPage.tsx # Admin management interface
```

## Plugin Integration

This plugin integrates with the Familying.org plugin system by:

1. **Auto-discovery**: Automatically discovered from `packages/services/soundscapes`
2. **Database Integration**: Secure queries through the plugin database helpers
3. **Authentication**: Admin routes protected via Clerk integration
4. **Type Safety**: Full TypeScript support with defined interfaces

## Usage

### For Users
1. Navigate to `/app/soundscapes`
2. Browse sounds by category
3. Click any sound card to start playing
4. Use the audio controls to adjust volume and set sleep timers

### For Admins
1. Navigate to `/admin/soundscapes` 
2. Click "Add Soundscape" to create new entries
3. Provide audio URL, thumbnail URL, title, description, and category
4. Toggle published status to control visibility
5. Use sort order to arrange sounds within categories

## Security

- **Row Level Security**: Database policies restrict access to authenticated users
- **Admin Authorization**: All admin operations require proper role permissions
- **Input Validation**: Secure database operations through plugin helpers
- **File Upload**: Currently uses URLs (future enhancement for direct file upload)

## Future Enhancements

- **Direct File Upload**: Support for uploading audio files to Supabase Storage
- **Playlist Creation**: Allow users to create custom soundscape combinations
- **Favorites**: User-specific favoriting system
- **Analytics**: Track most popular sounds and usage patterns
- **Personalization**: AI-powered recommendations based on listening history

## Development

The plugin follows the standard Familying.org plugin architecture:

1. **Plugin Manifest**: Defines routes, migrations, and metadata
2. **Database Migration**: Creates tables with proper RLS policies
3. **API Layer**: Secure REST endpoints with role-based access
4. **UI Components**: React components for both public and admin interfaces
5. **Type Safety**: Comprehensive TypeScript interfaces

This modular design allows the Soundscapes feature to be:
- **Independently deployable**
- **Easily testable** 
- **Highly maintainable**
- **Future-extensible**
