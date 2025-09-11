"use client";
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

interface ControlsProps {
  onStart: () => void;
  onStop: () => void;
  onFadeIn: (ms: number) => void;
  onFadeOut: (ms: number) => void;
  onTimer: (minutes: number) => void;
  onVolume: (v: number) => void;
}

export function Controls({ onStart, onStop, onFadeIn, onFadeOut, onTimer, onVolume }: ControlsProps) {
  const [timer, setTimer] = useState<number>(30);
  const [volume, setVol] = useState<number>(0.8);
  const sliderRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        onStart();
      } else if (e.key.toLowerCase() === 't') {
        const mins = parseInt(String(timer), 10) || 0;
        onTimer(mins);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onStart, onTimer, timer]);

  return (
    <div className="flex flex-col gap-4" role="group" aria-label="Soundscapes Controls">
      <div className="flex gap-2">
        <Button aria-label="Start" onClick={onStart} className="bg-green-600 hover:bg-green-700 text-white text-lg px-6 py-6">Start</Button>
        <Button aria-label="Stop" onClick={onStop} className="bg-gray-600 hover:bg-gray-700 text-white text-lg px-6 py-6">Stop</Button>
      </div>
      <div className="flex gap-2">
        <Button aria-label="Fade In" onClick={() => onFadeIn(2000)} className="bg-blue-600 hover:bg-blue-700">Fade In</Button>
        <Button aria-label="Fade Out" onClick={() => onFadeOut(2000)} className="bg-blue-600 hover:bg-blue-700">Fade Out</Button>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm" htmlFor="timer">Timer (min)</label>
        <input id="timer" aria-label="Timer in minutes" className="border rounded px-2 py-1 w-24" type="number" min={5} max={120} step={5} value={timer} onChange={(e) => setTimer(parseInt(e.target.value || '0', 10))} />
        <Button aria-label="Set Timer" onClick={() => onTimer(timer)} className="bg-purple-600 hover:bg-purple-700">Set</Button>
      </div>
      <div className="flex items-center gap-2">
        <label htmlFor="volume" className="text-sm">Volume</label>
        <input ref={sliderRef} id="volume" aria-label="Volume" className="flex-1" type="range" min={0} max={1} step={0.05} value={volume} onChange={(e) => { const v = parseFloat(e.target.value); setVol(v); onVolume(v); }} />
        <span className="text-xs text-gray-500">Guidance: keep safe levels</span>
      </div>
    </div>
  );
}

export default Controls;

