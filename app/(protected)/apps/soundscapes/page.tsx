"use client";
import { useMemo, useState } from 'react';
import { mixes } from '@/lib/soundscapes/mixes';
import { useSoundscapePlayer } from '@/components/soundscapes/Player';
import Controls from '@/components/soundscapes/Controls';
import { Analytics } from '@/lib/analytics/events';
import { Button } from '@/components/ui/button';
import { Navigation } from '@/components/layout/navigation';

export default function SoundscapesPage() {
  const [selected, setSelected] = useState(mixes[0].id);
  const player = useSoundscapePlayer(() => Analytics.track({ name: 'soundscape_completed', props: { mix: selected } }));
  const current = useMemo(() => mixes.find((m) => m.id === selected)!, [selected]);

  const onStart = () => {
    player.start(selected);
    player.fadeIn(1000);
    Analytics.track({ name: 'soundscape_started', props: { mix: selected, role: 'caregiver' } });
  };

  return (
    <>
      <Navigation />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Soundscapes</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">Quickly start focus, reading, or bedtime mixes.</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6" role="list" aria-label="Soundscape mixes">
          {mixes.map((m) => (
            <Button key={m.id} variant={m.id === selected ? 'default' : 'secondary'} aria-label={`Select ${m.title}`} onClick={() => setSelected(m.id)}>
              {m.title}
            </Button>
          ))}
        </div>

        <div className="mb-6 text-sm text-gray-500 dark:text-gray-400">Selected: {current.title}</div>

        <Controls
          onStart={onStart}
          onStop={() => player.fadeOut(1000)}
          onFadeIn={(ms) => player.fadeIn(ms)}
          onFadeOut={(ms) => player.fadeOut(ms)}
          onTimer={(minutes) => { player.setTimer(minutes); Analytics.track({ name: 'timer_set', props: { minutes } }); }}
          onVolume={(v) => player.setVolume(v)}
        />

        <div className="mt-6">
          <Button onClick={() => Analytics.track({ name: 'soundscape_favorited', props: { mix: selected } })} aria-label="Favorite mix">
            Favorite
          </Button>
        </div>
      </div>
    </div>
    </>
  );
}

