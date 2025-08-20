import React, { useState, useEffect } from 'react';
import { Mic, Download, Play, Pause, Volume2, RefreshCw, Star, User } from 'lucide-react';

interface Voice {
  voice_id: string;
  name: string;
  preview_url?: string;
  category: string;
  description?: string;
  labels: Record<string, string>;
  samples?: Array<{
    sample_id: string;
    file_name: string;
    mime_type: string;
    size_bytes: number;
    hash: string;
  }>;
}

interface VoiceManagerProps {
  selectedVoiceId: string;
  onVoiceSelect: (voiceId: string) => void;
  apiKey?: string;
}

export default function VoiceManager({ selectedVoiceId, onVoiceSelect, apiKey }: VoiceManagerProps) {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Default voices for when API key is not available
  const defaultVoices: Voice[] = [
    {
      voice_id: 'Fahco4VZzobUeiPqni1S',
      name: 'Rachel',
      category: 'premade',
      description: 'Young American female voice',
      labels: { accent: 'american', age: 'young', gender: 'female' }
    },
    {
      voice_id: 'AZnzlk1XvdvUeBnXmlld',
      name: 'Domi',
      category: 'premade', 
      description: 'Young American female voice',
      labels: { accent: 'american', age: 'young', gender: 'female' }
    },
    {
      voice_id: 'EXAVITQu4vr4xnSDxMaL',
      name: 'Bella',
      category: 'premade',
      description: 'Young American female voice',
      labels: { accent: 'american', age: 'young', gender: 'female' }
    },
    {
      voice_id: 'ErXwobaYiN019PkySvjV',
      name: 'Antoni',
      category: 'premade',
      description: 'Young American male voice',
      labels: { accent: 'american', age: 'young', gender: 'male' }
    },
    {
      voice_id: 'VR6AewLTigWG4xSOukaG',
      name: 'Arnold',
      category: 'premade',
      description: 'Middle-aged American male voice',
      labels: { accent: 'american', age: 'middle_aged', gender: 'male' }
    },
    {
      voice_id: 'pNInz6obpgDQGcFmaJgB',
      name: 'Adam',
      category: 'premade',
      description: 'Deep American male voice',
      labels: { accent: 'american', age: 'middle_aged', gender: 'male' }
    },
    {
      voice_id: 'yoZ06aMxZJJ28mfd3POQ',
      name: 'Sam',
      category: 'premade',
      description: 'Young American male voice',
      labels: { accent: 'american', age: 'young', gender: 'male' }
    }
  ];

  const fetchVoices = async () => {
    if (!apiKey) {
      setVoices(defaultVoices);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/elevenlabs/voices', {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch voices');
      }

      const data = await response.json();
      setVoices(data.voices || defaultVoices);
    } catch (err) {
      console.error('Error fetching voices:', err);
      setError('Failed to load voices. Using default voices.');
      setVoices(defaultVoices);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVoices();
  }, [apiKey]);

  const playVoicePreview = async (voiceId: string) => {
    if (playingVoice === voiceId) {
      setPlayingVoice(null);
      return;
    }

    setPlayingVoice(voiceId);
    
    // Simulate playing preview (in real implementation, would play actual audio)
    setTimeout(() => {
      setPlayingVoice(null);
    }, 3000);
  };

  const filteredVoices = voices.filter(voice => {
    const matchesSearch = voice.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         voice.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || voice.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', 'premade', 'cloned', 'generated'];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-amber-400">ElevenLabs Voice Selection</h4>
        <button
          onClick={fetchVoices}
          disabled={loading}
          className="p-1 text-gray-400 hover:text-white disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Search and Filter */}
      <div className="space-y-2">
        <input
          type="text"
          placeholder="Search voices..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:border-amber-500"
        />
        
        <div className="flex flex-wrap gap-1">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setCategoryFilter(category)}
              className={`px-2 py-1 text-xs rounded ${
                categoryFilter === category
                  ? 'bg-amber-500 text-black'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="text-yellow-400 text-xs bg-yellow-400/10 p-2 rounded">
          {error}
        </div>
      )}

      {/* Voice List */}
      <div className="max-h-64 overflow-y-auto space-y-2">
        {filteredVoices.map(voice => (
          <div
            key={voice.voice_id}
            className={`p-3 rounded-lg border cursor-pointer transition-all ${
              selectedVoiceId === voice.voice_id
                ? 'bg-amber-500/20 border-amber-500/50'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
            onClick={() => onVoiceSelect(voice.voice_id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1 bg-white/10 rounded">
                  {voice.category === 'premade' ? (
                    <Star className="w-3 h-3" />
                  ) : (
                    <User className="w-3 h-3" />
                  )}
                </div>
                <div>
                  <div className="font-medium text-sm">{voice.name}</div>
                  <div className="text-xs text-gray-400">
                    {voice.labels?.gender} • {voice.labels?.age} • {voice.labels?.accent}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playVoicePreview(voice.voice_id);
                  }}
                  className="p-1 text-gray-400 hover:text-white"
                >
                  {playingVoice === voice.voice_id ? (
                    <Pause className="w-3 h-3" />
                  ) : (
                    <Play className="w-3 h-3" />
                  )}
                </button>
                <Volume2 className="w-3 h-3 text-gray-400" />
              </div>
            </div>
            
            {voice.description && (
              <div className="text-xs text-gray-400 mt-1">
                {voice.description}
              </div>
            )}
            
            <div className="text-xs text-gray-500 mt-1 font-mono">
              ID: {voice.voice_id}
            </div>
          </div>
        ))}
      </div>

      {/* Selected Voice Info */}
      {selectedVoiceId && (
        <div className="bg-white/5 p-3 rounded-lg border border-white/10">
          <div className="text-xs text-gray-400 mb-1">Selected Voice ID:</div>
          <div className="font-mono text-sm text-amber-400 break-all">
            {selectedVoiceId}
          </div>
        </div>
      )}
    </div>
  );
}