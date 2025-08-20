import React, { useState, useRef, useEffect } from 'react';
import { Video, X, Download, Play, Pause, Volume2, VolumeX, Maximize2, RefreshCw } from 'lucide-react';
import { Node } from '../types/NodeTypes';

interface VideoPreviewNodeProps {
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

export default function VideoPreviewNode({ 
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
}: VideoPreviewNodeProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  
  const videoRef = useRef<HTMLVideoElement>(null);

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

  // Extract video URL
  const videoSrc = previewData?.videoUrl || (previewData?.videoFile ? `/uploads/${previewData.videoFile}` : '');

  // Auto-update timestamp when data flows through
  React.useEffect(() => {
    if (previewData && videoSrc) {
      setLastUpdate(new Date().toLocaleTimeString());
    }
  }, [previewData, videoSrc]);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);
    const handleEnded = () => setIsPlaying(false);

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('ended', handleEnded);
    };
  }, [videoSrc]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (video) {
      if (isPlaying) {
        video.pause();
      } else {
        video.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (video) {
      video.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    const video = videoRef.current;
    if (video) {
      video.volume = newVolume;
      setVolume(newVolume);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    const video = videoRef.current;
    if (video) {
      video.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleDownload = () => {
    if (videoSrc) {
      const a = document.createElement('a');
      a.href = videoSrc;
      a.download = `video-${Date.now()}.mp4`;
      a.click();
    }
  };

  const getNodeStyle = () => {
    const baseOpacity = visualTheme.nodeOpacity || 0.8;
    const glowColor = visualTheme.glowIntensity > 0 ? `0 0 ${Math.round(visualTheme.glowIntensity * 40)}px rgba(99, 102, 241, ${visualTheme.glowIntensity * 0.3})` : '';
    const shadowDepth = `0 ${Math.round(visualTheme.shadowDepth * 20)}px ${Math.round(visualTheme.shadowDepth * 80)}px rgba(0, 0, 0, ${visualTheme.shadowDepth * 0.9})`;
    const reflection = `inset 0 1px 0 rgba(255, 255, 255, ${visualTheme.glassReflection})`;
    
    return {
      background: `rgba(99, 102, 241, ${baseOpacity * 0.08})`,
      backdropFilter: `blur(${visualTheme.glassBlur}px)`,
      border: `1px solid rgba(99, 102, 241, ${visualTheme.glassBorder})`,
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
        <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500">
          <Video className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-white text-sm">Video Preview</h3>
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
      
      <p className="text-xs text-gray-400 mb-3">Preview generated videos</p>
      
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
        {videoSrc && (
          <div className="text-indigo-400 mt-1">
            <Video className="w-3 h-3 inline mr-1" />
            Video detected
          </div>
        )}
      </div>

      {/* Video Player */}
      {videoSrc ? (
        <div className="space-y-3">
          <div className="relative bg-black rounded overflow-hidden" style={{ height: '180px' }}>
            <video
              ref={videoRef}
              src={videoSrc}
              className="w-full h-full object-contain"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
            />
            
            {/* Video controls overlay */}
            <div className="absolute bottom-2 left-2 right-2 flex items-center space-x-2 bg-black/70 rounded p-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlay();
                }}
                className="p-1 bg-amber-500 rounded text-black hover:bg-amber-400"
              >
                {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              </button>
              
              <div className="flex-1">
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1 bg-gray-600 rounded appearance-none cursor-pointer"
                />
              </div>
              
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMute();
                }}
                className="p-1 text-white hover:text-amber-400"
              >
                {isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload();
                }}
                className="p-1 text-white hover:text-amber-400"
              >
                <Download className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="text-xs text-gray-400">
            <div className="flex justify-between">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Video metadata */}
          {previewData.metadata && (
            <div className="text-xs text-gray-400 space-y-1 bg-black/20 p-2 rounded">
              {previewData.metadata.resolution && <div>Resolution: {previewData.metadata.resolution}</div>}
              {previewData.metadata.format && <div>Format: {previewData.metadata.format}</div>}
              {previewData.metadata.fps && <div>FPS: {previewData.metadata.fps}</div>}
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center h-32 text-gray-400 text-center">
          {hasConnection ? (
            <div>
              <Video className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <div className="text-sm">Waiting for video...</div>
            </div>
          ) : (
            <div>
              <Video className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <div className="text-sm">Connect to video source</div>
            </div>
          )}
        </div>
      )}

      {/* Status indicator */}
      <div className="absolute top-2 right-2">
        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
      </div>
    </div>
  );
}