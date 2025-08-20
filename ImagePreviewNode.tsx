import React, { useState } from 'react';
import { Image as ImageIcon, X, Download, ZoomIn, ZoomOut, RotateCcw, RefreshCw } from 'lucide-react';
import { Node } from '../types/NodeTypes';

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

interface ImagePreviewNodeProps {
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

export default function ImagePreviewNode({ 
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
}: ImagePreviewNodeProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageZoom, setImageZoom] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [imageLoadError, setImageLoadError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');

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

  // Get connected node data - ALWAYS read from upstream node's lastResult
  const getConnectedNodeData = () => {
    const inputConnection = connections.find(conn => conn.targetId === node.id);
    if (!inputConnection) return null;
    
    const sourceNode = nodes.find(n => n.id === inputConnection.sourceId);
    const sourceResult = sourceNode?.data?.lastResult;
    
    console.log('ImagePreviewNode getConnectedNodeData:', {
      nodeId: node.id,
      sourceNodeId: inputConnection.sourceId,
      sourceNodeType: sourceNode?.type,
      hasSourceResult: !!sourceResult,
      sourceResultKeys: sourceResult ? Object.keys(sourceResult) : [],
      sourceResult
    });
    
    return sourceResult || node.data?.lastResult || null;
  };

  const previewData = getConnectedNodeData();
  const hasConnection = connections.some(conn => conn.targetId === node.id);

  // Extract images from preview data using robust extraction
  const getImages = () => {
    if (!previewData) return [];
    
    const outputs = normalizeOutputs(previewData?.outputs);
    let images = previewData?.images || outputs?.images || previewData?.lastResult?.images || previewData?.result?.images;
    
    // Also check if data itself is a single image object
    if (!images && previewData && (previewData.url || previewData.imageUrl || previewData.local)) {
      images = [previewData];
    }
    
    console.log('ImagePreviewNode getImages:', {
      nodeId: node.id,
      hasPreviewData: !!previewData,
      previewDataKeys: previewData ? Object.keys(previewData) : [],
      hasImages: Array.isArray(images) && images.length > 0,
      imagesLength: images?.length || 0,
      firstImageKeys: images?.[0] ? Object.keys(images[0]) : [],
      outputs: outputs ? Object.keys(outputs) : []
    });
    
    return Array.isArray(images) ? images : [];
  };

  const images = getImages();
  const currentImage = images[currentImageIndex];
  const imageSrc = currentImage ? pickImageUrl(currentImage) : "";

  // Auto-update timestamp when data flows through
  React.useEffect(() => {
    if (previewData && images.length > 0) {
      setLastUpdate(new Date().toLocaleTimeString());
    }
  }, [previewData, images.length]);

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

  const handleDownload = () => {
    if (imageSrc) {
      const a = document.createElement('a');
      a.href = imageSrc;
      a.download = `image-${Date.now()}.png`;
      a.click();
    }
  };

  const getNodeStyle = () => {
    const baseOpacity = visualTheme.nodeOpacity || 0.8;
    const glowColor = visualTheme.glowIntensity > 0 ? `0 0 ${Math.round(visualTheme.glowIntensity * 40)}px rgba(168, 85, 247, ${visualTheme.glowIntensity * 0.3})` : '';
    const shadowDepth = `0 ${Math.round(visualTheme.shadowDepth * 20)}px ${Math.round(visualTheme.shadowDepth * 80)}px rgba(0, 0, 0, ${visualTheme.shadowDepth * 0.9})`;
    const reflection = `inset 0 1px 0 rgba(255, 255, 255, ${visualTheme.glassReflection})`;
    
    return {
      background: `rgba(168, 85, 247, ${baseOpacity * 0.08})`,
      backdropFilter: `blur(${visualTheme.glassBlur}px)`,
      border: `1px solid rgba(168, 85, 247, ${visualTheme.glassBorder})`,
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
        <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
          <ImageIcon className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-white text-sm">Image Preview</h3>
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
      
      <p className="text-xs text-gray-400 mb-3">Preview generated images</p>
      
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
        {images.length > 0 && (
          <div className="text-purple-400 mt-1">
            <ImageIcon className="w-3 h-3 inline mr-1" />
            {images.length} image{images.length !== 1 ? 's' : ''} detected
          </div>
        )}
      </div>

      {/* Image Display */}
      <div className="bg-black/20 rounded-lg overflow-hidden mb-3" style={{ height: '200px' }}>
        {imageSrc && !imageLoadError ? (
          <div className="relative w-full h-full">
            <img
              key={imageSrc}
              src={imageSrc}
              alt={`Generated image ${currentImageIndex + 1}`}
              className="w-full h-full object-contain cursor-move"
              style={{
                transform: `scale(${imageZoom}) translate(${imagePosition.x / imageZoom}px, ${imagePosition.y / imageZoom}px)`,
                transition: imageZoom === 1 ? 'transform 0.2s ease' : 'none',
                display: 'block',
                zIndex: 1
              }}
              onMouseDown={handleImageDrag}
              onLoad={() => {
                console.log('✓ Image loaded successfully:', imageSrc);
                setImageLoadError(null);
              }}
              onError={(e) => {
                console.error('✗ Image failed to load:', imageSrc);
                setImageLoadError(`Failed to load: ${imageSrc}`);
              }}
            />
            
            {/* Image controls overlay */}
            <div className="absolute top-2 right-2 flex items-center space-x-1 bg-black/70 rounded p-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleImageZoom(-0.2);
                }}
                className="p-1 text-white hover:text-amber-400"
              >
                <ZoomOut className="w-3 h-3" />
              </button>
              <span className="text-xs text-white px-1">{Math.round(imageZoom * 100)}%</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleImageZoom(0.2);
                }}
                className="p-1 text-white hover:text-amber-400"
              >
                <ZoomIn className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  resetImageView();
                }}
                className="p-1 text-white hover:text-amber-400"
              >
                <RotateCcw className="w-3 h-3" />
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

            {/* Multiple images navigation */}
            {images.length > 1 && (
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-center space-x-2 bg-black/70 rounded p-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(Math.max(0, currentImageIndex - 1));
                  }}
                  disabled={currentImageIndex === 0}
                  className="p-1 text-white hover:text-amber-400 disabled:opacity-50"
                >
                  ←
                </button>
                <span className="text-xs text-white">
                  {currentImageIndex + 1} / {images.length}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(Math.min(images.length - 1, currentImageIndex + 1));
                  }}
                  disabled={currentImageIndex === images.length - 1}
                  className="p-1 text-white hover:text-amber-400 disabled:opacity-50"
                >
                  →
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-center p-4">
            {imageLoadError ? (
              <div>
                <div className="text-red-400 text-sm mb-2">Failed to load image</div>
                <div className="text-xs font-mono break-all">{imageSrc}</div>
              </div>
            ) : hasConnection ? (
              <div>
                <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <div className="text-sm">Waiting for images...</div>
              </div>
            ) : (
              <div>
                <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <div className="text-sm">Connect to image source</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Image thumbnails for multiple images */}
      {images.length > 1 && (
        <div className="flex space-x-1 overflow-x-auto pb-2 mb-3">
          {images.map((img: any, index: number) => {
            const thumbSrc = pickImageUrl(img);
            return (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex(index);
                }}
                className={`flex-shrink-0 w-12 h-8 rounded border overflow-hidden ${
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
      {currentImage && (
        <div className="text-xs text-gray-400 space-y-1">
          {currentImage.revisedPrompt && (
            <div className="bg-black/20 p-2 rounded">
              <div className="font-medium">Prompt:</div>
              <div className="text-gray-300">{currentImage.revisedPrompt}</div>
            </div>
          )}
        </div>
      )}

      {/* Debug panel */}
      <details className="text-xs text-gray-400 bg-yellow-500/10 p-2 rounded border border-yellow-500/20 mt-2">
        <summary className="cursor-pointer hover:text-gray-300">
          Debug: Raw Data
        </summary>
        <pre className="mt-2 text-xs overflow-auto max-h-32 whitespace-pre-wrap">
          {JSON.stringify({ previewData, currentImage, imageSrc }, null, 2)}
        </pre>
      </details>

      {/* Status indicator */}
      <div className="absolute top-2 right-2">
        <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
      </div>
    </div>
  );
}