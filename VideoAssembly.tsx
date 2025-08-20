import React, { useState } from 'react';
import { Download, Play, Settings, Film } from 'lucide-react';

interface VideoAssemblyProps {
  audioUrl?: string;
  images?: Array<{
    url: string;
    duration?: number;
    prompt?: string;
  }>;
  script?: string;
  title?: string;
  description?: string;
  onAssemble?: (config: VideoConfig) => Promise<string>;
}

interface VideoConfig {
  resolution: '720p' | '1080p' | '4K';
  fps: 24 | 30 | 60;
  format: 'mp4' | 'webm' | 'mov';
  quality: 'draft' | 'standard' | 'high';
  transitions: 'none' | 'fade' | 'slide' | 'zoom';
  backgroundMusic?: string;
  subtitles: boolean;
  watermark?: string;
}

export default function VideoAssembly({ 
  audioUrl, 
  images = [], 
  script, 
  title, 
  description,
  onAssemble 
}: VideoAssemblyProps) {
  const [isAssembling, setIsAssembling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [assembledVideoUrl, setAssembledVideoUrl] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [config, setConfig] = useState<VideoConfig>({
    resolution: '1080p',
    fps: 30,
    format: 'mp4',
    quality: 'standard',
    transitions: 'fade',
    subtitles: true
  });

  const handleAssemble = async () => {
    if (!onAssemble || !audioUrl || images.length === 0) return;

    setIsAssembling(true);
    setProgress(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const videoUrl = await onAssemble(config);
      
      clearInterval(progressInterval);
      setProgress(100);
      setAssembledVideoUrl(videoUrl);
    } catch (error) {
      console.error('Video assembly failed:', error);
    } finally {
      setIsAssembling(false);
    }
  };

  const downloadVideo = () => {
    if (assembledVideoUrl) {
      const a = document.createElement('a');
      a.href = assembledVideoUrl;
      a.download = `${title || 'video'}.${config.format}`;
      a.click();
    }
  };

  const estimatedDuration = images.reduce((total, img) => total + (img.duration || 3), 0);
  const estimatedSize = Math.round((estimatedDuration * 2.5) / 1024 * 100) / 100; // Rough estimate in MB

  return (
    <div className="bg-slate-800 rounded-lg border border-white/10 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Film className="w-6 h-6 text-amber-400" />
          <h2 className="text-xl font-semibold text-white">Video Assembly</h2>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 bg-white/10 rounded hover:bg-white/20 transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
          <h3 className="font-medium text-white mb-4">Assembly Settings</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Resolution</label>
              <select
                value={config.resolution}
                onChange={(e) => setConfig(prev => ({ ...prev, resolution: e.target.value as any }))}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              >
                <option value="720p">720p (HD)</option>
                <option value="1080p">1080p (Full HD)</option>
                <option value="4K">4K (Ultra HD)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Frame Rate</label>
              <select
                value={config.fps}
                onChange={(e) => setConfig(prev => ({ ...prev, fps: parseInt(e.target.value) as any }))}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              >
                <option value={24}>24 FPS (Cinematic)</option>
                <option value={30}>30 FPS (Standard)</option>
                <option value={60}>60 FPS (Smooth)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Quality</label>
              <select
                value={config.quality}
                onChange={(e) => setConfig(prev => ({ ...prev, quality: e.target.value as any }))}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              >
                <option value="draft">Draft (Fast)</option>
                <option value="standard">Standard</option>
                <option value="high">High (Slow)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Transitions</label>
              <select
                value={config.transitions}
                onChange={(e) => setConfig(prev => ({ ...prev, transitions: e.target.value as any }))}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              >
                <option value="none">None</option>
                <option value="fade">Fade</option>
                <option value="slide">Slide</option>
                <option value="zoom">Zoom</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={config.subtitles}
                onChange={(e) => setConfig(prev => ({ ...prev, subtitles: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm text-gray-300">Include subtitles</span>
            </label>
          </div>
        </div>
      )}

      {/* Assembly Status */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-300">Assembly Status</span>
          <span className="text-sm text-gray-400">
            {isAssembling ? `${progress}%` : assembledVideoUrl ? 'Complete' : 'Ready'}
          </span>
        </div>
        
        {isAssembling && (
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-amber-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Content Summary */}
      <div className="mb-6 p-4 bg-white/5 rounded-lg">
        <h3 className="font-medium text-white mb-3">Content Summary</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Audio:</span>
            <span className="text-white ml-2">{audioUrl ? 'Available' : 'Missing'}</span>
          </div>
          <div>
            <span className="text-gray-400">Images:</span>
            <span className="text-white ml-2">{images.length} frames</span>
          </div>
          <div>
            <span className="text-gray-400">Duration:</span>
            <span className="text-white ml-2">~{Math.round(estimatedDuration)}s</span>
          </div>
          <div>
            <span className="text-gray-400">Est. Size:</span>
            <span className="text-white ml-2">{estimatedSize} MB</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <button
          onClick={handleAssemble}
          disabled={isAssembling || !audioUrl || images.length === 0}
          className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-amber-500 text-black rounded-lg font-medium hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Film className="w-4 h-4" />
          <span>{isAssembling ? 'Assembling...' : 'Assemble Video'}</span>
        </button>

        {assembledVideoUrl && (
          <button
            onClick={downloadVideo}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-400 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </button>
        )}
      </div>

      {/* Assembly Preview */}
      {assembledVideoUrl && (
        <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-green-400">Video Ready!</h4>
              <p className="text-sm text-gray-300">Your video has been assembled successfully.</p>
            </div>
            <button
              onClick={() => window.open(assembledVideoUrl, '_blank')}
              className="flex items-center space-x-2 px-3 py-2 bg-green-500/20 border border-green-500/30 rounded text-green-400 hover:bg-green-500/30 transition-colors"
            >
              <Play className="w-4 h-4" />
              <span>Preview</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}