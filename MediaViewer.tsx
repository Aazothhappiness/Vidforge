import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Download, Maximize2, RotateCcw, ZoomIn, ZoomOut, SkipBack, SkipForward } from 'lucide-react';

interface MediaViewerProps {
  audioUrl?: string;
  images?: Array<{
    url: string;
    duration?: number;
    timestamp?: number;
    prompt?: string;
  }>;
  script?: string;
  title?: string;
  onClose?: () => void;
}

export default function MediaViewer({ audioUrl, images = [], script, title, onClose }: MediaViewerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showScript, setShowScript] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  // Calculate image timings based on audio duration and script
  const calculateImageTimings = () => {
    if (!duration || images.length === 0) return images;
    
    // If images don't have explicit timestamps, distribute them evenly
    return images.map((img, index) => ({
      ...img,
      timestamp: img.timestamp || (duration / images.length) * index,
      duration: img.duration || duration / images.length
    }));
  };

  const timedImages = calculateImageTimings();

  // Update current image based on audio time
  useEffect(() => {
    if (timedImages.length === 0) return;
    
    const currentImg = timedImages.findIndex((img, index) => {
      const nextImg = timedImages[index + 1];
      return currentTime >= (img.timestamp || 0) && 
             (!nextImg || currentTime < (nextImg.timestamp || duration));
    });
    
    if (currentImg !== -1 && currentImg !== currentImageIndex) {
      setCurrentImageIndex(currentImg);
    }
  }, [currentTime, timedImages, duration]);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl]);

  // Canvas rendering for synchronized playback
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || timedImages.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentImg = timedImages[currentImageIndex];
    if (!currentImg) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Calculate scaling to fit image in canvas while maintaining aspect ratio
      const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
      const x = (canvas.width - img.width * scale) / 2;
      const y = (canvas.height - img.height * scale) / 2;
      
      // Draw image
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
      
      // Add subtle fade transition effect
      if (isPlaying) {
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = 'rgba(245, 158, 11, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1;
      }
    };
    img.src = currentImg.url;
  }, [currentImageIndex, timedImages, isPlaying]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    const audio = audioRef.current;
    if (audio) {
      audio.volume = newVolume;
      setVolume(newVolume);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const skipToImage = (index: number) => {
    const audio = audioRef.current;
    if (!audio || !timedImages[index]) return;

    const targetTime = timedImages[index].timestamp || 0;
    audio.currentTime = targetTime;
    setCurrentTime(targetTime);
    setCurrentImageIndex(index);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const downloadVideo = async () => {
    // This would trigger the video assembly process
    // For now, just download the audio
    if (audioUrl) {
      const a = document.createElement('a');
      a.href = audioUrl;
      a.download = `${title || 'video'}-audio.mp3`;
      a.click();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-slate-900 rounded-xl border border-white/10 w-full max-w-6xl h-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">{title || 'Media Preview'}</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowScript(!showScript)}
              className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded text-blue-400 hover:bg-blue-500/30 text-sm"
            >
              {showScript ? 'Hide Script' : 'Show Script'}
            </button>
            <button
              onClick={downloadVideo}
              className="p-2 bg-green-500/20 border border-green-500/30 rounded text-green-400 hover:bg-green-500/30"
            >
              <Download className="w-4 h-4" />
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 bg-red-500/20 border border-red-500/30 rounded text-red-400 hover:bg-red-500/30"
              >
                ×
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Main Video Area */}
          <div className="flex-1 flex flex-col">
            {/* Canvas for synchronized playback */}
            <div className="flex-1 bg-black rounded-lg m-4 relative overflow-hidden">
              <canvas
                ref={canvasRef}
                width={1280}
                height={720}
                className="w-full h-full object-contain"
              />
              
              {/* Current image info overlay */}
              {timedImages[currentImageIndex] && (
                <div className="absolute bottom-4 left-4 bg-black/70 text-white p-2 rounded text-sm">
                  <div>Image {currentImageIndex + 1} of {timedImages.length}</div>
                  {timedImages[currentImageIndex].prompt && (
                    <div className="text-xs text-gray-300 mt-1 max-w-md">
                      {timedImages[currentImageIndex].prompt}
                    </div>
                  )}
                </div>
              )}

              {/* Play button overlay */}
              {!isPlaying && (
                <button
                  onClick={togglePlay}
                  className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/40 transition-colors"
                >
                  <Play className="w-16 h-16 text-white" />
                </button>
              )}
            </div>

            {/* Controls */}
            <div className="p-4 border-t border-white/10">
              {/* Timeline */}
              <div className="mb-4">
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Playback Controls */}
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={() => skipToImage(Math.max(0, currentImageIndex - 1))}
                  className="p-2 bg-white/10 rounded hover:bg-white/20 transition-colors"
                  disabled={currentImageIndex === 0}
                >
                  <SkipBack className="w-4 h-4" />
                </button>
                
                <button
                  onClick={togglePlay}
                  className="p-3 bg-amber-500 rounded-full text-black hover:bg-amber-400 transition-colors"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
                
                <button
                  onClick={() => skipToImage(Math.min(timedImages.length - 1, currentImageIndex + 1))}
                  className="p-2 bg-white/10 rounded hover:bg-white/20 transition-colors"
                  disabled={currentImageIndex === timedImages.length - 1}
                >
                  <SkipForward className="w-4 h-4" />
                </button>

                <div className="flex items-center space-x-2 ml-8">
                  <button onClick={toggleMute} className="p-1 text-gray-400 hover:text-white">
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-20 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-80 border-l border-white/10 flex flex-col">
            {/* Image Timeline */}
            <div className="p-4 border-b border-white/10">
              <h3 className="font-medium text-white mb-3">Image Timeline</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {timedImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => skipToImage(index)}
                    className={`w-full flex items-center space-x-2 p-2 rounded text-left transition-colors ${
                      index === currentImageIndex 
                        ? 'bg-amber-500/20 border border-amber-500/30' 
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={`Frame ${index + 1}`}
                      className="w-12 h-8 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white">Frame {index + 1}</div>
                      <div className="text-xs text-gray-400">
                        {formatTime(img.timestamp || 0)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Script Panel */}
            {showScript && script && (
              <div className="flex-1 p-4 overflow-y-auto">
                <h3 className="font-medium text-white mb-3">Script</h3>
                <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {script}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="p-4 border-t border-white/10">
              <h3 className="font-medium text-white mb-2">Stats</h3>
              <div className="space-y-1 text-sm text-gray-400">
                <div>Duration: {formatTime(duration)}</div>
                <div>Images: {timedImages.length}</div>
                <div>Current: Frame {currentImageIndex + 1}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Hidden audio element */}
        {audioUrl && (
          <audio
            ref={audioRef}
            src={audioUrl}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
          />
        )}
      </div>
    </div>
  );
}