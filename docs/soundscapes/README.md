# Soundscapes

Focus, Reading, Calm Play, and Bedtime mixes with gentle timers, fades, and kid-safe UI.

Routes:
- Parent/Caregiver: `/apps/soundscapes`
- Kid view: `/kid/[childId]/apps/soundscapes`

Flags & Entitlements:
- Feature flag: `apps.soundscapes.enabled`
- Plans: `plus`, `family`

Analytics events:
- `soundscape_started`, `timer_set`, `bedtime_mode_on`, `soundscape_favorited`, `soundscape_completed`

Offline:
- `public/sw.js` caches small loop files under `public/audio/soundscapes/*`.

