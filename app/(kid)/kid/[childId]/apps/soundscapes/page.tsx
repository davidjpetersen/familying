"use client";
import { useMemo, useState, useEffect } from 'react';
import { mixes } from '@/app/lib/soundscapes/mixes';
import { useSoundscapePlayer } from '@/app/components/soundscapes/Player';
import { Analytics } from '@/app/lib/analytics/events';
import { Button } from '@/components/ui/button';

export default function KidSoundscapesPage({ params }: { params: { childId: string } }) {
  const [selected, setSelected] = useState('bedtime');
  const [locked, setLocked] = useState(false);
  const player = useSoundscapePlayer(() => {
    setLocked(false);
    Analytics.track({ name: 'soundscape_completed', props: { mix: selected, role: 'child' } });
  });
  const current = useMemo(() => mixes.find((m) => m.id === selected)!, [selected]);

  // Bedtime lock logic: lock nav during playback (simplified)
  useEffect(() => {
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (locked) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [locked]);

  const startBedtime = () => {
    setLocked(true);
    Analytics.track({ name: 'bedtime_mode_on', props: { child: params.childId } });
    player.start(selected);
    player.fadeIn(1500);
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-center">Soundscapes</h1>
        <div className="grid grid-cols-2 gap-4 mb-6">
          {mixes.map((m) => (
            <Button key={m.id} aria-label={`Select ${m.title}`} onClick={() => setSelected(m.id)} className="text-lg py-6">
              {m.title}
            </Button>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <Button aria-label="Start" onClick={startBedtime} className="bg-green-600 hover:bg-green-700 text-white text-xl py-6">Start</Button>
          <Button aria-label="Stop (Parent PIN)" onClick={() => setLocked(false)} className="bg-gray-600 hover:bg-gray-700 text-white py-6">Parent Exit</Button>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">Bedtime lock prevents leaving until timer ends or parent exit</p>
      </div>
    </div>
  );
}

