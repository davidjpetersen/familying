import { MicroApps } from './registry';
import { Rocket } from 'lucide-react';

// Register built-in apps
MicroApps.registerApp({
  id: 'soundscapes',
  slug: 'soundscapes',
  title: 'Soundscapes',
  icon: <Rocket className="h-5 w-5" />,
  route: '/apps/soundscapes',
  allowedRoles: ['owner', 'caregiver', 'child'],
  allowedPlans: ['plus', 'family'],
  dashboardSlots: ['home', 'kid'],
  featureFlag: 'apps.soundscapes.enabled',
  events: [
    'soundscape_started',
    'timer_set',
    'bedtime_mode_on',
    'soundscape_favorited',
    'soundscape_completed',
  ],
});

