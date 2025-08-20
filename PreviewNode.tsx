import React, { useState } from 'react';
import { Eye, X, Download, Play, Pause, Volume2, VolumeX, RefreshCw } from 'lucide-react';
import { Node } from '../types/NodeTypes';
import MediaPlayer from './MediaPlayer';
import MediaViewer from './MediaViewer';
import { detectMediaType } from '../utils/media';

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

interface PreviewNodeProps {
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

export default function PreviewNode({ 
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
}: PreviewNodeProps) {
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [previewWindowSize, setPreviewWindowSize] = useState({ width: 300, height: 200 });
  const [isResizing, setIsResizing] = useState(false);
  const [showPreviewWindow, setShowPreviewWindow] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  // Fix the missing variable declaration
  const isInCycle = false; // Preview nodes are never in cycles

  // Get number of input ports from node data (preview nodes only have inputs)
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
    
    // Get the most recent data from the connected source node
    const sourceNode = nodes.find(n => n.id === inputConnection.sourceId);
    const sourceResult = sourceNode?.data?.lastResult;
    
    console.log('PreviewNode getConnectedNodeData:', {
      nodeId: node.id,
      sourceNodeId: inputConnection.sourceId,
      sourceNodeType: sourceNode?.type,
      hasSourceResult: !!sourceResult,
      sourceResultKeys: sourceResult ? Object.keys(sourceResult) : [],
      sourceResultImages: sourceResult?.images?.length || 0,
      nodeLastResult: node.data?.lastResult,
      nodeLastResultKeys: node.data?.lastResult ? Object.keys(node.data.lastResult) : []
    });
    
    return sourceResult || node.data?.lastResult || null;
  };

  const previewData = getConnectedNodeData();
  const hasConnection = connections.some(conn => conn.targetId === node.id);

  // Debug the actual data structure
  React.useEffect(() => {
    console.log('=== PREVIEW NODE DEBUG ===', {
      nodeId: node.id,
      hasConnection,
      previewData,
      previewDataKeys: previewData ? Object.keys(previewData) : [],
      previewDataType: typeof previewData,
      hasImageData: hasImageData(),
      connections: connections.filter(conn => conn.targetId === node.id)
    });
  }, [previewData, hasConnection]);

  // Enhanced image detection for preview
  const hasImageData = () => {
    if (!previewData) return false;
    
    // Check for images in various locations
    const outputs = normalizeOutputs(previewData?.outputs);
    let images = previewData?.images || outputs?.images || previewData?.lastResult?.images || previewData?.result?.images;
    
    // Also check if data itself is a single image object
    if (!images && previewData && (previewData.url || previewData.imageUrl || previewData.local)) {
      images = [previewData];
    }
    
    const hasImages = Array.isArray(images) && images.length > 0;
    const firstImage = hasImages ? images[0] : null;
    const imageSrc = firstImage ? pickImageUrl(firstImage) : "";
    
    console.log('PreviewNode hasImageData check:', {
      nodeId: node.id,
      hasPreviewData: !!previewData,
      previewDataKeys: previewData ? Object.keys(previewData) : [],
      hasImages,
      imagesLength: images?.length || 0,
      firstImageKeys: firstImage ? Object.keys(firstImage) : [],
      imageSrc,
      outputs: outputs ? Object.keys(outputs) : []
    });
    
    return hasImages && imageSrc;
  };

  // Auto-open preview window when data flows through
  React.useEffect(() => {
    if (previewData && hasImageData() && !showPreviewWindow) {
      setShowPreviewWindow(true);
      setLastUpdate(new Date().toLocaleTimeString());
    }
  }, [previewData, showPreviewWindow]);

  const handlePreview = () => {
    setShowPreviewWindow(true);
    setLastUpdate(new Date().toLocaleTimeString());
  };

  const handleDownload = () => {
    if (previewData) {
      const content = typeof previewData === 'string' ? previewData : JSON.stringify(previewData, null, 2);
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `preview-${Date.now()}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleResize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = previewWindowSize.width;
    const startHeight = previewWindowSize.height;
    
    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(200, startWidth + (e.clientX - startX));
      const newHeight = Math.max(150, startHeight + (e.clientY - startY));
      setPreviewWindowSize({ width: newWidth, height: newHeight });
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };


  const getNodeStyle = () => {
    const baseOpacity = visualTheme.nodeOpacity || 0.8;
    const glowColor = visualTheme.glowIntensity > 0 ? `0 0 ${Math.round(visualTheme.glowIntensity * 40)}px rgba(168, 85, 247, ${visualTheme.glowIntensity * 0.3})` : '';
    const shadowDepth = `0 ${Math.round(visualTheme.shadowDepth * 20)}px ${Math.round(visualTheme.shadowDepth * 80)}px rgba(0, 0, 0, ${visualTheme.shadowDepth * 0.9})`;
    const reflection = `inset 0 1px 0 rgba(255, 255, 255, ${visualTheme.glassReflection})`;
    
    switch (visualTheme.nodeStyle) {
      case 'solid':
        return {
          background: `rgba(30, 41, 59, ${baseOpacity})`,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: `${visualTheme.borderRadius}px`,
          backdropFilter: 'none',
          boxShadow: shadowDepth
        };
      case 'crystal':
        return {
          background: `rgba(168, 85, 247, ${baseOpacity * 0.12})`,
          backdropFilter: `blur(${visualTheme.glassBlur}px)`,
          border: `2px solid rgba(168, 85, 247, ${visualTheme.glassBorder * 4})`,
          borderRadius: `${Math.round(visualTheme.borderRadius * 0.6)}px`,
          boxShadow: `
            ${shadowDepth},
            ${reflection},
            ${glowColor},
            inset 2px 2px 4px rgba(168, 85, 247, 0.1),
            inset -2px -2px 4px rgba(0, 0, 0, 0.2)
          `.trim(),
          clipPath: visualTheme.crystalFacets ? 'polygon(0% 15%, 15% 0%, 85% 0%, 100% 15%, 100% 85%, 85% 100%, 15% 100%, 0% 85%)' : undefined
        };
      case 'minimal':
        return {
          background: `rgba(0, 0, 0, ${baseOpacity * 0.3})`,
          border: `2px solid rgba(168, 85, 247, ${visualTheme.glassBorder * 15})`,
          borderRadius: `${Math.round(visualTheme.borderRadius * 0.6)}px`,
          backdropFilter: `blur(${Math.round(visualTheme.glassBlur * 0.2)}px)`,
          boxShadow: shadowDepth
        };
      default:
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
    }
  };

  // Detect media type for better preview
  const mediaInfo = previewData ? detectMediaType(previewData) : null;
  return (
    <>
      <div
        data-preview-node="true"
        data-node-draggable="true"
        className={`absolute p-4 w-64 cursor-move select-none transition-all duration-200 ${
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
          console.log('Preview node clicked:', node.id);
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
            <Eye className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-white text-sm">Preview Node</h3>
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
        
        <p className="text-xs text-gray-400 mb-3">Preview output from any connected node</p>
        
        {/* Preview Controls */}
        <div className="space-y-3">
          <div className="text-xs">
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
            {mediaInfo && (
              <div className="text-blue-400 mt-1">
                <span className="capitalize">{mediaInfo.type}</span> content detected
                {mediaInfo.urls.length > 0 && ` (${mediaInfo.urls.length} items)`}
              </div>
            )}
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePreview();
              }}
              className="flex-1 px-3 py-2 bg-amber-500/20 border border-amber-500/30 rounded-lg text-xs text-amber-400 hover:bg-amber-500/30 transition-colors"
            >
              {showPreviewWindow ? 'Refresh Preview' : 'Open Preview'}
            </button>
            {showPreviewWindow && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPreviewWindow(false);
                }}
                className="px-3 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/30 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {/* Connection Status */}
          <div className="text-xs text-gray-400">
            {previewData ? (
              <div>
                <div>Data Size: {JSON.stringify(previewData).length} chars</div>
                {mediaInfo && mediaInfo.type !== 'text' && mediaInfo.type !== 'json' && (
                  <div>Media Type: {mediaInfo.type}</div>
                )}
              </div>
            ) : 'No data'}
          </div>
        </div>
        
        {/* Status indicator */}
        <div className="absolute top-2 right-2">
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
        </div>
      </div>

      {/* Resizable Preview Window */}
      {showPreviewWindow && (
        <div
          className="absolute bg-black/80 backdrop-blur-lg border border-white/20 rounded-lg overflow-hidden"
          style={{
            left: node.position.x + 280,
            top: node.position.y,
            width: previewWindowSize.width,
            height: previewWindowSize.height,
            zIndex: 15
          }}
        >
          {/* Preview Window Header */}
          <div className="bg-white/10 p-2 flex items-center justify-between border-b border-white/10">
            <div className="text-xs text-white font-medium">Preview Output</div>
            <div className="flex items-center space-x-2">
              {mediaInfo && (
                <span className="ml-2 text-blue-400 capitalize">({mediaInfo.type})</span>
              )}
              {/* Media Controls */}
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-1 bg-white/10 rounded hover:bg-white/20 transition-colors"
              >
                {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              </button>
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-1 bg-white/10 rounded hover:bg-white/20 transition-colors"
              >
                {isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
              </button>
              {previewData && (
                <button
                  onClick={handleDownload}
                  className="p-1 bg-white/10 rounded hover:bg-white/20 transition-colors"
                >
                  <Download className="w-3 h-3" />
                </button>
              )}
              <button
                onClick={() => setShowPreviewWindow(false)}
                className="p-1 bg-white/10 rounded hover:bg-red-500/20 transition-colors text-red-400"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
          
          {/* Preview Content */}
          <div className="p-3 h-full overflow-auto">
            {previewData ? (
              <div className="space-y-2">
                <div className="text-xs text-gray-400 mb-2 border-b border-white/10 pb-2">
                  <div>Type: {typeof previewData}</div>
                  <div>Size: {JSON.stringify(previewData).length} characters</div>
                  <div>Last Update: {lastUpdate}</div>
                  <div>Has Images: {hasImageData() ? 'Yes' : 'No'}</div>
                  <div>Raw Data Keys: {previewData ? Object.keys(previewData).join(', ') : 'none'}</div>
                  <div>Images Array Length: {previewData?.images?.length || 'none'}</div>
                  <div>Outputs Keys: {previewData?.outputs ? Object.keys(previewData.outputs).join(', ') : 'none'}</div>
                  {mediaInfo && (
                    <>
                      <div>Media Type: {mediaInfo.type}</div>
                      {mediaInfo.urls.length > 0 && <div>Media Items: {mediaInfo.urls.length}</div>}
                    </>
                  )}
                  {previewData.images && (
                    <div>Images: {previewData.images.length}</div>
                  )}
                  {previewData.generatedCount && (
                    <div>Generated: {previewData.generatedCount} items</div>
                  )}
                </div>
                
                {/* Debug raw data display */}
                <details className="text-xs text-gray-400 bg-yellow-500/10 p-2 rounded border border-yellow-500/20">
                  <summary className="cursor-pointer hover:text-gray-300">
                    Debug: Raw Preview Data
                  </summary>
                  <pre className="mt-2 text-xs overflow-auto max-h-32 whitespace-pre-wrap">
                    {JSON.stringify(previewData, null, 2)}
                  </pre>
                </details>
                
                {/* Enhanced Media Player with judgment overlay */}
                <div className="space-y-2">
                  {previewData.images || previewData.outputs?.["0"]?.images || previewData.url || previewData.imageUrl ? (
                    <div className="relative">
                      <MediaPlayer data={previewData} type="image" title="Generated Image" />
                      
                      {/* Judgment Overlay */}
                      {previewData.judgment && (
                        <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium ${
                          previewData.judgment.decision 
                            ? 'bg-green-500/80 text-white border border-green-400' 
                            : 'bg-red-500/80 text-white border border-red-400'
                        }`}>
                          {previewData.judgment.decision ? '✅ APPROVED' : '❌ REJECTED'}
                        </div>
                      )}
                      
                      {/* Judgment Details */}
                      {previewData.judgment && (
                        <div className="mt-2 p-2 bg-black/40 rounded text-xs">
                          <div className="font-medium mb-1">AI Judgment Results</div>
                          <div>Confidence: {Math.round((previewData.judgment.confidence || 0) * 100)}%</div>
                          <div>Quality Score: {previewData.judgment.qualityScore || 0}/100</div>
                          {previewData.judgment.likenessScore !== undefined && (
                            <div>Likeness Score: {previewData.judgment.likenessScore}/100</div>
                          )}
                          {previewData.judgment.reasons && previewData.judgment.reasons.length > 0 && (
                            <details className="mt-1">
                              <summary className="cursor-pointer hover:text-gray-300">
                                Reasoning ({previewData.judgment.reasons.length} items)
                              </summary>
                              <ul className="mt-1 ml-2 space-y-1">
                                {previewData.judgment.reasons.map((reason: string, idx: number) => (
                                  <li key={idx} className="text-gray-300">• {reason}</li>
                                ))}
                              </ul>
                            </details>
                          )}
                        </div>
                      )}
                    </div>
                  ) : mediaInfo && mediaInfo.type === 'audio' ? (
                    <MediaPlayer data={previewData} type="audio" title="Generated Audio" />
                  ) : mediaInfo && mediaInfo.type === 'video' ? (
                    <MediaPlayer data={previewData} type="video" title="Generated Video" />
                  ) : (
                    <MediaPlayer data={previewData} type="text" title="Content Preview" />
                  )}
                </div>
                
                {/* Additional data display for complex results */}
                {previewData.nodeConfigurations && (
                  <div className="text-xs text-gray-400 bg-blue-500/10 p-2 rounded mt-2">
                    <div className="font-medium text-blue-400">Auto-Configurations Applied:</div>
                    <div>{Object.keys(previewData.nodeConfigurations).join(', ')}</div>
                  </div>
                )}
                
                {/* Likeness Analysis Display */}
                {previewData.likenessDescription && (
                  <div className="text-xs text-gray-300 bg-purple-500/10 p-3 rounded border border-purple-500/20">
                    <div className="font-medium text-purple-400 mb-2 flex items-center">
                      <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
                      Character Likeness Analysis
                    </div>
                    <div className="whitespace-pre-wrap max-h-32 overflow-y-auto">
                      {previewData.likenessDescription}
                    </div>
                    {previewData.imageCount && (
                      <div className="mt-2 pt-2 border-t border-purple-500/20 text-purple-300">
                        Analyzed {previewData.imageCount} reference images • {previewData.detailLevel} detail • {previewData.consistencyMode} consistency
                      </div>
                    )}
                  </div>
                )}
                
                {/* Sequential Processing Results */}
                {previewData.items && Array.isArray(previewData.items) && (
                  <div className="text-xs text-gray-300 bg-blue-500/10 p-3 rounded border border-blue-500/20">
                    <div className="font-medium text-blue-400 mb-2">Sequential Processing Results</div>
                    <div className="space-y-1">
                      <div>Total Items: {previewData.items.length}</div>
                      <div>Voice Items: {previewData.items.filter((i: any) => i.kind === 'voice').length}</div>
                      <div>Image Items: {previewData.items.filter((i: any) => i.kind === 'image').length}</div>
                    </div>
                    <details className="mt-2">
                      <summary className="cursor-pointer hover:text-gray-300">View Items</summary>
                      <div className="mt-1 max-h-32 overflow-y-auto space-y-1">
                        {previewData.items.slice(0, 10).map((item: any, idx: number) => (
                          <div key={idx} className="text-xs">
                            <span className={`inline-block w-12 ${item.kind === 'voice' ? 'text-green-400' : 'text-blue-400'}`}>
                              {item.kind}:
                            </span>
                            <span className="text-gray-300">
                              {item.kind === 'voice' ? item.text.substring(0, 50) : item.prompt.substring(0, 50)}...
                            </span>
                          </div>
                        ))}
                        {previewData.items.length > 10 && (
                          <div className="text-gray-400">... and {previewData.items.length - 10} more items</div>
                        )}
                      </div>
                    </details>
                  </div>
                )}
                
                {previewData.error && (
                  <div className="text-xs text-red-400 bg-red-500/10 p-2 rounded mt-2">
                    <div className="font-medium">Error:</div>
                    <div>{previewData.error}</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-400 text-center py-8">
                {hasConnection 
                  ? 'Waiting for data to flow through...' 
                  : 'Connect this node to see data preview'
                }
              </div>
            )}
          </div>
          
          {/* Resize Handle */}
          <div
            className="absolute bottom-0 right-0 w-4 h-4 bg-white/20 cursor-se-resize"
            onMouseDown={handleResize}
            style={{
              clipPath: 'polygon(100% 0%, 0% 100%, 100% 100%)'
            }}
          />
        </div>
      )}
    </>
  );
}