"use client";
import { useEffect, useRef, useState, useCallback } from 'react';
import { mixes, MixConfig } from '@/lib/soundscapes/mixes';

type PlayerStatus = 'idle' | 'playing' | 'stopped' | 'fading';

export interface PlayerHandle {
  start: (mixId: string) => void;
  stop: () => void;
  fadeIn: (ms: number) => void;
  fadeOut: (ms: number) => void;
  setVolume: (v: number) => void;
  setTimer: (minutes: number) => void;
}

export function useSoundscapePlayer(onComplete?: () => void) {
  const [status, setStatus] = useState<PlayerStatus>('idle');
  const [currentMix, setCurrentMix] = useState<MixConfig | null>(null);
  const [volume, setVolume] = useState<number>(0.8);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fadeRef = useRef<NodeJS.Timeout | null>(null);
  const audiosRef = useRef<HTMLAudioElement[]>([]);

  const cleanup = useCallback(() => {
    audiosRef.current.forEach((a) => {
      a.pause();
      a.src = '';
    });
    audiosRef.current = [];
    if (timerRef.current) clearTimeout(timerRef.current);
    if (fadeRef.current) clearInterval(fadeRef.current);
    timerRef.current = null;
    fadeRef.current = null;
  }, []);

  const start = useCallback((mixId: string) => {
    const mix = mixes.find((m) => m.id === mixId);
    if (!mix) return;
    cleanup();
    setCurrentMix(mix);
    const nodes = mix.layers.map((layer) => {
      const a = new Audio(layer.file);
      a.loop = true;
      a.volume = layer.gain * volume;
      a.play().catch(() => {/* requires user gesture */});
      return a;
    });
    audiosRef.current = nodes;
    setStatus('playing');
  }, [cleanup, volume]);

  const stop = useCallback(() => {
    cleanup();
    setStatus('stopped');
    setCurrentMix(null);
  }, [cleanup]);

  const fadeIn = useCallback((ms: number) => {
    if (!audiosRef.current.length) return;
    setStatus('fading');
    const steps = Math.max(1, Math.floor(ms / 50));
    let i = 0;
    audiosRef.current.forEach((a) => (a.volume = 0));
    if (fadeRef.current) clearInterval(fadeRef.current);
    fadeRef.current = setInterval(() => {
      i += 1;
      const t = Math.min(1, i / steps);
      audiosRef.current.forEach((a, idx) => {
        const base = currentMix?.layers[idx]?.gain ?? 0.2;
        a.volume = base * volume * t;
      });
      if (i >= steps) {
        if (fadeRef.current) clearInterval(fadeRef.current);
        setStatus('playing');
      }
    }, 50) as unknown as NodeJS.Timeout;
  }, [currentMix, volume]);

  const fadeOut = useCallback((ms: number) => {
    if (!audiosRef.current.length) return;
    setStatus('fading');
    const steps = Math.max(1, Math.floor(ms / 50));
    let i = 0;
    if (fadeRef.current) clearInterval(fadeRef.current);
    fadeRef.current = setInterval(() => {
      i += 1;
      const t = 1 - Math.min(1, i / steps);
      audiosRef.current.forEach((a) => {
        a.volume = volume * t;
      });
      if (i >= steps) {
        if (fadeRef.current) clearInterval(fadeRef.current);
        stop();
        onComplete?.();
      }
    }, 50) as unknown as NodeJS.Timeout;
  }, [onComplete, stop, volume]);

  const setMasterVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    setVolume(clamped);
    audiosRef.current.forEach((a, idx) => {
      const base = currentMix?.layers[idx]?.gain ?? 0.2;
      a.volume = base * clamped;
    });
  }, [currentMix]);

  const setTimer = useCallback((minutes: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!minutes || minutes <= 0) return;
    timerRef.current = setTimeout(() => {
      fadeOut(3000);
    }, minutes * 60 * 1000) as unknown as NodeJS.Timeout;
  }, [fadeOut]);

  useEffect(() => () => cleanup(), [cleanup]);

  return {
    status,
    currentMix,
    start,
    stop,
    fadeIn,
    fadeOut,
    setVolume: setMasterVolume,
    setTimer,
  } as PlayerHandle & { status: PlayerStatus; currentMix: MixConfig | null };
}

