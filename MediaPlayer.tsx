import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Download, Maximize2, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';

// Helper functions for robust image URL extraction
function normalizeOutputs(o: any) {
  if (!o) return undefined;
  return o["0"] ?? o[0] ?? o.default ?? o;
}

function toPublicUploads(pathStr?: string) {
  if (!pathStr || typeof pathStr !== "string") return "";
  // Rewrite absolute disk paths to the public /uploads path
  if (pathStr.startsWith("/home/project/uploads/")) {
    const file = pathStr.split("/uploads/")[1];
    return file ? `/uploads/${file}` : "";
  }
  return pathStr; // already /uploads/... or http(s)://...
}

function pickImageUrl(img: any): string {
  const candidates = [
    img?.url,
    img?.imageUrl,
    img?.publicUrl,
    img?.src,
    img?.image_file,
    img?.imageFile,
    img?.local,          // rewrite to /uploads later
    img?.dataURL         // base64 data URI
  ].filter((v) => typeof v === "string" && v.length > 0);

  let src = candidates[0] || "";
  if (src && src.startsWith("/home/project/uploads/")) src = toPublicUploads(src);
  return src;
}

interface MediaPlayerProps {
  data: any;
  type: 'audio' | 'image' | 'video' | 'text';
  title?: string;
}

export default function MediaPlayer({ data, type, title }: MediaPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageZoom, setImageZoom] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoadError, setImageLoadError] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Enhanced image URL extraction
  useEffect(() => {
    const audio = audioRef.current;
    const video = videoRef.current;
    
    const updateTime = () => {
      const media = audio || video;
      if (media) {
        setCurrentTime(media.currentTime);
        setDuration(media.duration || 0);
      }
    };

    const handleLoadedMetadata = () => {
      const media = audio || video;
      if (media) {
        setDuration(media.duration);
      }
    };

    if (audio) {
      audio.addEventListener('timeupdate', updateTime);
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      return () => {
        audio.removeEventListener('timeupdate', updateTime);
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
    }

    if (video) {
      video.addEventListener('timeupdate', updateTime);
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      return () => {
        video.removeEventListener('timeupdate', updateTime);
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
    }
  }, [type]);

  const togglePlay = () => {
    const media = audioRef.current || videoRef.current;
    if (media) {
      if (isPlaying) {
        media.pause();
      } else {
        media.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    const media = audioRef.current || videoRef.current;
    if (media) {
      media.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    const media = audioRef.current || videoRef.current;
    if (media) {
      media.volume = newVolume;
      setVolume(newVolume);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    const media = audioRef.current || videoRef.current;
    if (media) {
      media.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleDownload = () => {
    let url = '';
    let filename = '';
    
    if (type === 'audio' && (data.audioUrl || data.audioFile)) {
      url = data.audioUrl;
      filename = `audio-${Date.now()}.mp3`;
    } else if (type === 'image') {
      // Use the same logic as display to find the image URL
      const outputs = normalizeOutputs(data?.outputs);
      let images = data?.images || outputs?.images || data?.lastResult?.images || data?.result?.images;
      if (!images && (data.url || data.imageUrl || data.local)) {
        images = [data];
      }
      const imgObj = Array.isArray(images) ? images[0] : images;
      url = imgObj ? pickImageUrl(imgObj) : '';
      filename = `image-${Date.now()}.png`;
    } else if (type === 'video' && (data.videoUrl || data.videoFile)) {
      url = data.videoUrl;
      filename = `video-${Date.now()}.mp4`;
    } else if (type === 'text') {
      const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
      const blob = new Blob([content], { type: 'text/plain' });
      url = URL.createObjectURL(blob);
      filename = `content-${Date.now()}.txt`;
    }
    
    if (url) {
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      
      if (type === 'text') {
        URL.revokeObjectURL(url);
      }
    }
  };

  const handleImageZoom = (delta: number) => {
    setImageZoom(prev => Math.max(0.1, Math.min(5, prev + delta)));
  };

  const resetImageView = () => {
    setImageZoom(1);
    setImagePosition({ x: 0, y: 0 });
  };

  const handleImageDrag = (e: React.MouseEvent) => {
    if (imageZoom <= 1) return;
    
    const startX = e.clientX - imagePosition.x;
    const startY = e.clientY - imagePosition.y;
    
    const handleMouseMove = (e: MouseEvent) => {
      setImagePosition({
        x: e.clientX - startX,
        y: e.clientY - startY
      });
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  if (type === 'audio' && (data.audioUrl || data.audioFile)) {
    const audioSrc = data.audioUrl || (data.audioFile ? `/uploads/${data.audioFile}` : '');
    
    return (
      <div className="bg-black/20 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-white">{title || 'Audio Player'}</h4>
          <button onClick={handleDownload} className="p-1 text-gray-400 hover:text-white">
            <Download className="w-4 h-4" />
          </button>
        </div>
        
        <audio
          ref={audioRef}
          src={audioSrc}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
        />
        
        <div className="flex items-center space-x-3">
          <button onClick={togglePlay} className="p-2 bg-amber-500 rounded-full text-black hover:bg-amber-400">
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
            className="w-16 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        
        {data.metadata && (
          <div className="text-xs text-gray-400 space-y-1">
            {data.metadata.duration && <div>Duration: {data.metadata.duration}s</div>}
            {data.metadata.format && <div>Format: {data.metadata.format}</div>}
            {data.metadata.size && <div>Size: {data.metadata.size}</div>}
          </div>
        )}
      </div>
    );
  }

  if (type === 'image' && (data.imageUrl || data.imageFile || data.images)) {
    // Robust image extraction using helper functions
    const outputs = normalizeOutputs(data?.outputs);
    
    // Check multiple possible locations for images
    let images = data?.images;
    if (!images) images = outputs?.images;
    if (!images) images = data?.lastResult?.images;
    if (!images) images = data?.result?.images;
    if (!images && Array.isArray(data)) images = data;
    
    // Also check if data itself is a single image object
    if (!images && data && (data.url || data.imageUrl || data.local)) {
      images = [data];
    }

    // Force debug logging for troubleshooting
    console.log('=== MEDIA PLAYER IMAGE DEBUG ===', {
      type: "image",
      dataKeys: data ? Object.keys(data) : [],
      hasImages: Array.isArray(images) && images.length > 0,
      imagesLength: images?.length ?? 0,
      firstImageKeys: images?.[0] ? Object.keys(images[0]) : [],
      outputs: outputs ? Object.keys(outputs) : [],
      directUrl: data?.url,
      directImageUrl: data?.imageUrl,
      directLocal: data?.local,
      rawData: data
    });

    // Pick the current/first image
    const imgObj = Array.isArray(images) ? (images[currentImageIndex] ?? images[0]) : images;
    const imageSrc = imgObj ? pickImageUrl(imgObj) : "";
    
    // Handle multiple images for navigation
    const hasMultipleImages = Array.isArray(images) && images.length > 1;
    const currentImage = imgObj;
    
    console.log('=== FINAL IMAGE RENDERING ===', {
      hasImages: Array.isArray(images) && images.length > 0,
      imagesLength: images?.length ?? 0,
      pickedSrc: imageSrc,
      willRender: !!imageSrc,
      imgObj
    });
    
    return (
      <div ref={containerRef} className="bg-black/20 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-white">
            {title || 'Image Viewer'}
            {hasMultipleImages && (
              <span className="text-sm text-gray-400 ml-2">
                ({currentImageIndex + 1} of {images.length})
              </span>
            )}
          </h4>
          <div className="flex items-center space-x-2">
            {hasMultipleImages && (
              <>
                <button 
                  onClick={() => setCurrentImageIndex(Math.max(0, currentImageIndex - 1))}
                  disabled={currentImageIndex === 0}
                  className="p-1 text-gray-400 hover:text-white disabled:opacity-50"
                >
                  ←
                </button>
                <button 
                  onClick={() => setCurrentImageIndex(Math.min(images.length - 1, currentImageIndex + 1))}
                  disabled={currentImageIndex === images.length - 1}
                  className="p-1 text-gray-400 hover:text-white disabled:opacity-50"
                >
                  →
                </button>
              </>
            )}
            <button onClick={() => handleImageZoom(-0.2)} className="p-1 text-gray-400 hover:text-white">
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs text-gray-400">{Math.round(imageZoom * 100)}%</span>
            <button onClick={() => handleImageZoom(0.2)} className="p-1 text-gray-400 hover:text-white">
              <ZoomIn className="w-4 h-4" />
            </button>
            <button onClick={resetImageView} className="p-1 text-gray-400 hover:text-white">
              <RotateCcw className="w-4 h-4" />
            </button>
            <button onClick={handleDownload} className="p-1 text-gray-400 hover:text-white">
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="relative overflow-hidden rounded-lg bg-black/40 min-h-48 flex items-center justify-center">
          {imageSrc && !imageLoadError ? (
            <img
              ref={imageRef}
              key={imageSrc}
              src={imageSrc}
              alt={`Generated content ${currentImageIndex + 1}`}
              className="max-w-full max-h-96 object-contain cursor-move"
              style={{
                transform: `scale(${imageZoom}) translate(${imagePosition.x / imageZoom}px, ${imagePosition.y / imageZoom}px)`,
                transition: imageZoom === 1 ? 'transform 0.2s ease' : 'none'
              }}
              onMouseDown={handleImageDrag}
              onLoad={() => {
                console.log('✓ Image loaded successfully:', imageSrc);
                setImageLoadError(false);
              }}
              onError={(e) => {
                console.error('✗ Image failed to load:', imageSrc);
                console.error('Image error details:', {
                  src: e.currentTarget.src,
                  imgObj,
                  allImages: images,
                  naturalWidth: e.currentTarget.naturalWidth,
                  naturalHeight: e.currentTarget.naturalHeight
                });
                setImageLoadError(`Failed to load: ${imageSrc}`);
              }}
            />
          ) : (
            <div className="text-gray-400 text-center py-8">
              <div className="text-sm">
                {imageLoadError ? imageLoadError : 'No image available'}
              </div>
              <div className="text-xs mt-1">
                {imageLoadError ? 'Check console for details' : `Source: ${imageSrc || 'none found'}`}
              </div>
              {imageLoadError && imageSrc && (
                <div className="text-xs mt-2 font-mono text-red-400 bg-red-500/10 p-2 rounded max-w-md mx-auto break-all">
                  Failed: {imageSrc}
                </div>
              )}
              {!imageSrc && imgObj && (
                <div className="text-xs mt-2 font-mono text-yellow-400 bg-yellow-500/10 p-2 rounded max-w-md mx-auto break-all">
                  Raw object: {JSON.stringify(imgObj, null, 2)}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Image thumbnails for multiple images */}
        {hasMultipleImages && (
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {images.map((img: any, index: number) => {
              const thumbSrc = pickImageUrl(img);
              return (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden ${
                  index === currentImageIndex ? 'border-amber-500' : 'border-white/20'
                }`}
              >
                {thumbSrc ? (
                  <img
                    src={thumbSrc}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-600 flex items-center justify-center text-xs">
                    {index + 1}
                  </div>
                )}
              </button>
              );
            })}
          </div>
        )}
        
        {/* Image metadata */}
        {data.metadata && (
          <div className="text-xs text-gray-400 space-y-1">
            {data.metadata.width && data.metadata.height && (
              <div>Dimensions: {data.metadata.width} × {data.metadata.height}</div>
            )}
            {data.metadata.format && <div>Format: {data.metadata.format}</div>}
            {data.metadata.size && <div>Size: {data.metadata.size}</div>}
          </div>
        )}
        
        {/* Current image info */}
        {currentImage?.revisedPrompt && (
          <div className="text-xs text-gray-400 bg-black/20 p-2 rounded">
            <div className="font-medium">Revised Prompt:</div>
            <div>{currentImage.revisedPrompt}</div>
          </div>
        )}
        
        {/* Likeness Analysis Display */}
        {data.likenessDescription && (
          <div className="text-xs text-gray-300 bg-purple-500/10 p-3 rounded border border-purple-500/20">
            <div className="font-medium text-purple-400 mb-2 flex items-center">
              <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
              Character Likeness Analysis
            </div>
            <div className="whitespace-pre-wrap max-h-32 overflow-y-auto">
              {data.likenessDescription}
            </div>
            {data.imageCount && (
              <div className="mt-2 pt-2 border-t border-purple-500/20 text-purple-300">
                Analyzed {data.imageCount} reference images • {data.detailLevel} detail • {data.consistencyMode} consistency
              </div>
            )}
          </div>
        )}
        
        {/* Detailed Analysis for each image */}
        {data.detailedAnalysis && hasMultipleImages && (
          <div className="text-xs text-gray-300 bg-blue-500/10 p-3 rounded border border-blue-500/20">
            <div className="font-medium text-blue-400 mb-2">
              Image {currentImageIndex + 1} Analysis
            </div>
            {data.detailedAnalysis[currentImageIndex] && (
              <div className="space-y-1">
                <div><strong>Name:</strong> {data.detailedAnalysis[currentImageIndex].imageName}</div>
                <div><strong>Size:</strong> {data.detailedAnalysis[currentImageIndex].imageSize}</div>
                <div><strong>Consistency Score:</strong> {data.detailedAnalysis[currentImageIndex].consistencyScore}%</div>
                <div><strong>Notes:</strong> {data.detailedAnalysis[currentImageIndex].analysisNotes}</div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  if (type === 'video' && (data.videoUrl || data.videoFile)) {
    const videoSrc = data.videoUrl || (data.videoFile ? `/uploads/${data.videoFile}` : '');
    
    return (
      <div className="bg-black/20 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-white">{title || 'Video Player'}</h4>
          <div className="flex items-center space-x-2">
            <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-1 text-gray-400 hover:text-white">
              <Maximize2 className="w-4 h-4" />
            </button>
            <button onClick={handleDownload} className="p-1 text-gray-400 hover:text-white">
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="relative">
          <video
            ref={videoRef}
            src={videoSrc}
            className="w-full rounded-lg bg-black"
            controls
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
          />
        </div>
        
        {data.metadata && (
          <div className="text-xs text-gray-400 space-y-1">
            {data.metadata.duration && <div>Duration: {data.metadata.duration}s</div>}
            {data.metadata.resolution && <div>Resolution: {data.metadata.resolution}</div>}
            {data.metadata.format && <div>Format: {data.metadata.format}</div>}
            {data.metadata.size && <div>Size: {data.metadata.size}</div>}
          </div>
        )}
      </div>
    );
  }

  // Text/JSON fallback
  return (
    <div className="bg-black/20 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-white">{title || 'Content Preview'}</h4>
        <button onClick={handleDownload} className="p-1 text-gray-400 hover:text-white">
          <Download className="w-4 h-4" />
        </button>
      </div>
      
      <div className="bg-black/40 rounded p-3 max-h-64 overflow-auto">
        <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
          {typeof data === 'string' ? data : JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  );
}