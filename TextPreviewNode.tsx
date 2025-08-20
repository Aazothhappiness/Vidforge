import React, { useState } from 'react';
import { FileText, X, Download, Copy, RefreshCw } from 'lucide-react';
import { Node } from '../types/NodeTypes';

interface TextPreviewNodeProps {
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

export default function TextPreviewNode({ 
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
}: TextPreviewNodeProps) {
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

  // Extract text content
  const getTextContent = () => {
    if (!previewData) return '';
    
    if (typeof previewData === 'string') return previewData;
    
    // Check common text fields
    const textFields = ['text', 'script', 'content', 'message', 'description'];
    for (const field of textFields) {
      if (previewData[field] && typeof previewData[field] === 'string') {
        return previewData[field];
      }
    }
    
    // Fallback to JSON representation
    return JSON.stringify(previewData, null, 2);
  };

  const textContent = getTextContent();

  // Auto-update timestamp when data flows through
  React.useEffect(() => {
    if (previewData && textContent) {
      setLastUpdate(new Date().toLocaleTimeString());
    }
  }, [previewData, textContent]);

  const handleCopy = () => {
    if (textContent) {
      navigator.clipboard.writeText(textContent);
    }
  };

  const handleDownload = () => {
    if (textContent) {
      const blob = new Blob([textContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `content-${Date.now()}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const getNodeStyle = () => {
    const baseOpacity = visualTheme.nodeOpacity || 0.8;
    const glowColor = visualTheme.glowIntensity > 0 ? `0 0 ${Math.round(visualTheme.glowIntensity * 40)}px rgba(34, 197, 94, ${visualTheme.glowIntensity * 0.3})` : '';
    const shadowDepth = `0 ${Math.round(visualTheme.shadowDepth * 20)}px ${Math.round(visualTheme.shadowDepth * 80)}px rgba(0, 0, 0, ${visualTheme.shadowDepth * 0.9})`;
    const reflection = `inset 0 1px 0 rgba(255, 255, 255, ${visualTheme.glassReflection})`;
    
    return {
      background: `rgba(34, 197, 94, ${baseOpacity * 0.08})`,
      backdropFilter: `blur(${visualTheme.glassBlur}px)`,
      border: `1px solid rgba(34, 197, 94, ${visualTheme.glassBorder})`,
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
        <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500">
          <FileText className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-white text-sm">Text Preview</h3>
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
      
      <p className="text-xs text-gray-400 mb-3">Preview text content and scripts</p>
      
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
        {textContent && (
          <div className="text-green-400 mt-1">
            <FileText className="w-3 h-3 inline mr-1" />
            {textContent.length} characters
          </div>
        )}
      </div>

      {/* Text Display */}
      <div className="bg-black/20 rounded-lg p-3 mb-3" style={{ height: '200px', overflow: 'auto' }}>
        {textContent ? (
          <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
            {textContent}
          </pre>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-center">
            {hasConnection ? (
              <div>
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <div className="text-sm">Waiting for content...</div>
              </div>
            ) : (
              <div>
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <div className="text-sm">Connect to text source</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Text controls */}
      {textContent && (
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCopy();
            }}
            className="flex-1 px-3 py-2 bg-green-500/20 border border-green-500/30 rounded text-xs text-green-400 hover:bg-green-500/30 transition-colors"
          >
            <Copy className="w-3 h-3 inline mr-1" />
            Copy
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDownload();
            }}
            className="flex-1 px-3 py-2 bg-blue-500/20 border border-blue-500/30 rounded text-xs text-blue-400 hover:bg-blue-500/30 transition-colors"
          >
            <Download className="w-3 h-3 inline mr-1" />
            Download
          </button>
        </div>
      )}

      {/* Status indicator */}
      <div className="absolute top-2 right-2">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
      </div>
    </div>
  );
}