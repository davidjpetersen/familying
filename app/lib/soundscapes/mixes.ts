export type LayerType = 'nature' | 'white' | 'brown' | 'pink' | 'music';

export interface LayerConfig {
  id: string;
  type: LayerType;
  file: string; // public URL e.g., /audio/soundscapes/rain.ogg
  gain: number; // 0..1 default volume
  loopStart?: number; // seconds
  loopEnd?: number; // seconds
}

export interface MixConfig {
  id: string; // e.g., 'focus'
  title: string;
  layers: LayerConfig[];
}

export const mixes: MixConfig[] = [
  {
    id: 'focus',
    title: 'Focus',
    layers: [
      { id: 'pink', type: 'pink', file: '/audio/soundscapes/pink-noise.ogg', gain: 0.35 },
      { id: 'keys', type: 'music', file: '/audio/soundscapes/soft-keys.ogg', gain: 0.25 },
    ],
  },
  {
    id: 'reading',
    title: 'Reading',
    layers: [
      { id: 'white', type: 'white', file: '/audio/soundscapes/white-noise.ogg', gain: 0.3 },
      { id: 'rain', type: 'nature', file: '/audio/soundscapes/rain.ogg', gain: 0.2 },
    ],
  },
  {
    id: 'calm-play',
    title: 'Calm Play',
    layers: [
      { id: 'brown', type: 'brown', file: '/audio/soundscapes/brown-noise.ogg', gain: 0.3 },
      { id: 'birds', type: 'nature', file: '/audio/soundscapes/birds.ogg', gain: 0.15 },
    ],
  },
  {
    id: 'bedtime',
    title: 'Bedtime',
    layers: [
      { id: 'soft-music', type: 'music', file: '/audio/soundscapes/lullaby.ogg', gain: 0.2 },
      { id: 'pink', type: 'pink', file: '/audio/soundscapes/pink-noise.ogg', gain: 0.15 },
    ],
  },
];

