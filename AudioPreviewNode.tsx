import React, { useState, useRef, useEffect } from 'react';
import { Headphones, X, Download, Play, Pause, Volume2, VolumeX, RefreshCw } from 'lucide-react';
import { Node } from '../types/NodeTypes';

interface AudioPreviewNodeProps {
  node: Node;
  isSelected: boolean;
  isMultiSelected?: boolean;
  connections: any[];
  visualTheme: any;
  nodes: Node[];
  onSelect: (ctrlKey?: boolean) => void;
  onDelete: () => void;
  onStartConnection: (nodeId: string, e: React.MouseEvent) => void;
  onStartDrag: (nodeId: string, e: React.MouseEvent) => void;
}

export default function AudioPreviewNode({ 
  node, 
  isSelected, 
  isMultiSelected = false,
  connections,
  visualTheme,
  nodes,
  onSelect, 
  onDelete, 
  onStartConnection, 
  onStartDrag 
}: AudioPreviewNodeProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  
  const audioRef = useRef<HTMLAudioElement>(null);

  // Get number of input ports from node data
  const inputPorts = node.data?.inputPorts || 1;
  
  // Calculate port positions
  const getInputPortPositions = (count: number) => {
    if (count === 1) {
      return [{ top: '50%', transform: 'translateY(-50%)' }];
    }
    
    const positions = [];
    const spacing = 80 / (count + 1);
    
    for (let i = 0; i < count; i++) {
      const top = 10 + spacing * (i + 1);
      positions.push({ top: `${top}%`, transform: 'none' });
    }
    
    return positions;
  };
  
  const inputPortPositions = getInputPortPositions(inputPorts);

  // Get connected node data
  const getConnectedNodeData = () => {
    const inputConnection = connections.find(conn => conn.targetId === node.id);
    if (!inputConnection) return null;
    
    const sourceNode = nodes.find(n => n.id === inputConnection.sourceId);
    const sourceResult = sourceNode?.data?.lastResult;
    
    return sourceResult || node.data?.lastResult || null;
  };

  const previewData = getConnectedNodeData();
  const hasConnection = connections.some(conn => conn.targetId === node.id);

  // Extract audio URL
  const audioSrc = previewData?.audioUrl || (previewData?.audioFile ? `/uploads/${previewData.audioFile}` : '');

  // Auto-update timestamp when data flows through
  React.useEffect(() => {
    if (previewData && audioSrc) {
      setLastUpdate(new Date().toLocaleTimeString());
    }
  }, [previewData, audioSrc]);

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
  }, [audioSrc]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (audio) {
      if (isPlaying) {
        audio.pause();
      } else {
        audio.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.muted = !isMuted;
      setIsMuted(!isMuted);
    }
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

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleDownload = () => {
    if (audioSrc) {
      const a = document.createElement('a');
      a.href = audioSrc;
      a.download = `audio-${Date.now()}.mp3`;
      a.click();
    }
  };

  const getNodeStyle = () => {
    const baseOpacity = visualTheme.nodeOpacity || 0.8;
    const glowColor = visualTheme.glowIntensity > 0 ? `0 0 ${Math.round(visualTheme.glowIntensity * 40)}px rgba(59, 130, 246, ${visualTheme.glowIntensity * 0.3})` : '';
    const shadowDepth = `0 ${Math.round(visualTheme.shadowDepth * 20)}px ${Math.round(visualTheme.shadowDepth * 80)}px rgba(0, 0, 0, ${visualTheme.shadowDepth * 0.9})`;
    const reflection = `inset 0 1px 0 rgba(255, 255, 255, ${visualTheme.glassReflection})`;
    
    return {
      background: `rgba(59, 130, 246, ${baseOpacity * 0.08})`,
      backdropFilter: `blur(${visualTheme.glassBlur}px)`,
      border: `1px solid rgba(59, 130, 246, ${visualTheme.glassBorder})`,
      borderRadius: `${visualTheme.borderRadius}px`,
      boxShadow: `
        ${shadowDepth},
        ${reflection},
        ${glowColor}
      `.trim()
    };
  };

  return (
    <div
      data-preview-node="true"
      data-node-draggable="true"
      className={`absolute p-4 w-80 cursor-move select-none transition-all duration-200 ${
        isSelected ? 'ring-2 ring-amber-500 shadow-lg shadow-amber-500/20' : ''
      } ${
        isMultiSelected && !isSelected ? 'ring-2 ring-blue-400 shadow-lg shadow-blue-400/20' : ''
      }`}
      style={{
        left: node.position.x,
        top: node.position.y,
        zIndex: isSelected ? 10 : 2,
        ...getNodeStyle()
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(e.ctrlKey || e.metaKey);
      }}
      onMouseDown={(e) => onStartDrag(node.id, e)}
      onDragStart={(e) => e.preventDefault()}
    >
      {/* Input Ports */}
      {inputPortPositions.map((position, index) => (
        <div
          key={`input-${index}`}
          className="absolute left-0 w-3 h-3 bg-blue-500 rounded-full border-2 border-white cursor-pointer hover:bg-blue-400 hover:scale-110 transition-all z-20"
          data-port-type="input"
          data-node-id={node.id}
          data-port-index={index}
          style={{ 
            ...position,
            transform: `translateX(-50%) ${position.transform}`,
            pointerEvents: 'auto' 
          }}
        />
      ))}
      
      <div className="flex items-center space-x-3 mb-3">
        <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500">
          <Headphones className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-white text-sm">Audio Preview</h3>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="text-gray-400 hover:text-red-400 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <p className="text-xs text-gray-400 mb-3">Preview generated audio</p>
      
      {/* Connection Status */}
      <div className="text-xs mb-3">
        <div className={`flex items-center space-x-2 ${hasConnection ? 'text-green-400' : 'text-gray-400'}`}>
          <div className={`w-2 h-2 rounded-full ${hasConnection ? 'bg-green-400' : 'bg-gray-400'}`}></div>
          <span>Status: {hasConnection ? 'Connected' : 'Not Connected'}</span>
        </div>
        {previewData && (
          <div className="text-amber-400 mt-1">
            <RefreshCw className="w-3 h-3 inline mr-1" />
            Data flowing • Last update: {lastUpdate}
          </div>
        )}
        {audioSrc && (
          <div className="text-blue-400 mt-1">
            <Headphones className="w-3 h-3 inline mr-1" />
            Audio detected
          </div>
        )}
      </div>

      {/* Audio Player */}
      {audioSrc ? (
        <div className="space-y-3">
          <audio
            ref={audioRef}
            src={audioSrc}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
          />
          
          <div className="flex items-center space-x-2">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              className="p-2 bg-amber-500 rounded-full text-black hover:bg-amber-400"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            
            <div className="flex-1">
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
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMute();
                }}
                className="p-1 text-gray-400 hover:text-white"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="w-16 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownload();
              }}
              className="p-1 text-gray-400 hover:text-white"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>

          {/* Audio metadata */}
          {previewData.metadata && (
            <div className="text-xs text-gray-400 space-y-1 bg-black/20 p-2 rounded">
              {previewData.metadata.duration && <div>Duration: {previewData.metadata.duration}s</div>}
              {previewData.metadata.format && <div>Format: {previewData.metadata.format}</div>}
              {previewData.voiceId && <div>Voice: {previewData.voiceId}</div>}
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center h-32 text-gray-400 text-center">
          {hasConnection ? (
            <div>
              <Headphones className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <div className="text-sm">Waiting for audio...</div>
            </div>
          ) : (
            <div>
              <Headphones className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <div className="text-sm">Connect to audio source</div>
            </div>
          )}
        </div>
      )}

      {/* Status indicator */}
      <div className="absolute top-2 right-2">
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
      </div>
    </div>
  );
}