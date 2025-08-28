'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Play, 
  Pause, 
  Volume2, 
  Timer, 
  Moon, 
  TreePine, 
  Radio, 
  Brain,
  RotateCcw 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Soundscape {
  id: string;
  title: string;
  description?: string;
  category: 'Sleep' | 'Nature' | 'White Noise' | 'Focus';
  audio_url: string;
  thumbnail_url: string;
  is_published: boolean;
  sort_order: number;
  duration_seconds?: number;
}

interface SoundscapesData {
  success: boolean;
  data: Soundscape[];
  categories: string[];
}

const categoryIcons: Record<string, any> = {
  'Sleep': Moon,
  'Nature': TreePine,
  'White Noise': Radio,
  'Focus': Brain
};

export default function SoundscapesPage() {
  const [soundscapes, setSoundscapes] = useState<Soundscape[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Audio player state
  const [currentSound, setCurrentSound] = useState<Soundscape | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(75);
  const [timer, setTimer] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch soundscapes
  useEffect(() => {
    fetchSoundscapes();
  }, []);

  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  const fetchSoundscapes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/soundscapes/data');
      const data: SoundscapesData = await response.json();
      
      if (data.success) {
        setSoundscapes(data.data);
      } else {
        setError('Failed to load soundscapes');
      }
    } catch (err) {
      setError('Failed to load soundscapes');
    } finally {
      setLoading(false);
    }
  };

  const groupedSoundscapes = soundscapes.reduce((acc, soundscape) => {
    if (!acc[soundscape.category]) {
      acc[soundscape.category] = [];
    }
    acc[soundscape.category].push(soundscape);
    return acc;
  }, {} as Record<string, Soundscape[]>);

  const playSound = (soundscape: Soundscape) => {
    if (currentSound?.id === soundscape.id && isPlaying) {
      // Pause current sound
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      // Play new sound or resume
      if (currentSound?.id !== soundscape.id) {
        audioRef.current?.pause();
        audioRef.current = new Audio(soundscape.audio_url);
        audioRef.current.loop = true;
        audioRef.current.volume = volume / 100;
        setCurrentSound(soundscape);
      }
      
      audioRef.current?.play();
      setIsPlaying(true);
    }
  };

  const stopSound = () => {
    audioRef.current?.pause();
    setIsPlaying(false);
    setCurrentSound(null);
    clearTimer();
  };

  const setTimerMinutes = (minutes: number) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }

    const totalSeconds = minutes * 60;
    setTimer(minutes);
    setTimeRemaining(totalSeconds);

    // Start countdown
    countdownRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev && prev > 1) {
          return prev - 1;
        } else {
          clearInterval(countdownRef.current!);
          return null;
        }
      });
    }, 1000);

    // Set timer to stop audio
    timerRef.current = setTimeout(() => {
      stopSound();
      setTimer(null);
      setTimeRemaining(null);
    }, totalSeconds * 1000);
  };

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setTimer(null);
    setTimeRemaining(null);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading soundscapes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={fetchSoundscapes} className="w-full">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Soundscapes
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Gentle sounds to help your family rest, recharge, and refocus.
          </p>
        </div>

        {/* Current Player */}
        {currentSound && (
          <Card className="mb-8 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <img 
                  src={currentSound.thumbnail_url} 
                  alt={currentSound.title}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{currentSound.title}</h3>
                  <p className="text-gray-600 text-sm">{currentSound.description}</p>
                </div>
                <div className="flex items-center space-x-4">
                  {/* Volume Control */}
                  <div className="flex items-center space-x-2">
                    <Volume2 className="w-4 h-4" />
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={volume}
                      onChange={(e) => setVolume(parseInt(e.target.value))}
                      className="w-20"
                    />
                    <span className="text-xs w-8">{volume}%</span>
                  </div>
                  
                  {/* Timer */}
                  <div className="flex items-center space-x-2">
                    <Timer className="w-4 h-4" />
                    <Select value={timer?.toString() || ''} onValueChange={(value) => value ? setTimerMinutes(parseInt(value)) : clearTimer()}>
                      <SelectTrigger className="w-20">
                        <SelectValue placeholder="Timer" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Off</SelectItem>
                        <SelectItem value="15">15m</SelectItem>
                        <SelectItem value="30">30m</SelectItem>
                        <SelectItem value="60">60m</SelectItem>
                      </SelectContent>
                    </Select>
                    {timeRemaining && (
                      <span className="text-sm font-mono">
                        {formatTime(timeRemaining)}
                      </span>
                    )}
                  </div>
                  
                  {/* Play/Pause */}
                  <Button
                    onClick={() => playSound(currentSound)}
                    variant="outline"
                    size="sm"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  
                  {/* Stop */}
                  <Button
                    onClick={stopSound}
                    variant="outline"
                    size="sm"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Categories */}
        <div className="space-y-8">
          {Object.entries(groupedSoundscapes).map(([category, sounds]) => {
            const IconComponent = categoryIcons[category] || Radio;
            
            return (
              <div key={category}>
                <div className="flex items-center space-x-2 mb-4">
                  <IconComponent className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {category}
                  </h2>
                  <Badge variant="secondary" className="ml-2">
                    {sounds.length}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {sounds.map((soundscape) => (
                    <Card 
                      key={soundscape.id}
                      className={cn(
                        "group cursor-pointer transition-all hover:shadow-lg bg-white/80 backdrop-blur-sm py-0",
                        currentSound?.id === soundscape.id && "ring-2 ring-primary"
                      )}
                      onClick={() => playSound(soundscape)}
                    >
                      <div className="relative">
                        <img 
                          src={soundscape.thumbnail_url} 
                          alt={soundscape.title}
                          className="w-full h-32 object-cover rounded-t-lg"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-t-lg flex items-center justify-center">
                          <Button 
                            size="sm" 
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              playSound(soundscape);
                            }}
                          >
                            {currentSound?.id === soundscape.id && isPlaying ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-lg mb-1">{soundscape.title}</h3>
                        {soundscape.description && (
                          <p className="text-gray-600 text-sm line-clamp-2">
                            {soundscape.description}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {soundscapes.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Radio className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No soundscapes available</h3>
            <p className="text-gray-500">Check back later for new ambient sounds.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Export for plugin system
export { SoundscapesPage as UserComponent };
