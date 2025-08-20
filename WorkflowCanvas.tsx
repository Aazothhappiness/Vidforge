import React, { useRef, useCallback, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { Node, Connection } from '../types/NodeTypes';
import WorkflowNode from './WorkflowNode';
import ImagePreviewNode from './ImagePreviewNode';
import AudioPreviewNode from './AudioPreviewNode';
import VideoPreviewNode from './VideoPreviewNode';
import TextPreviewNode from './TextPreviewNode';
import DigiviceNode from './DigiviceNode';

interface WorkflowCanvasProps {
  nodes: Node[];
  connections: Connection[];
  selectedNode: Node | null;
  selectedNodes?: Set<string>;
  onToggleNodeSelection?: (nodeId: string, ctrlKey: boolean) => void;
  currentExecutingNode?: string;
  executionResults?: Map<string, any>;
  executionStartTimes?: Map<string, Date>;
  cycleNodes?: Set<string>;
  isConnecting: boolean;
  connectionStart: { nodeId: string; x: number; y: number } | null;
  mousePosition: { x: number; y: number };
  draggedNode: string | null;
  dragOffset: { x: number; y: number };
  visualTheme: any;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onNodeSelect: (node: Node) => void;
  onNodeDelete: (nodeId: string) => void;
  onConnectionDelete: (connectionId: string) => void;
  onStartConnection: (nodeId: string, e: React.MouseEvent) => void;
  onStartNodeDrag: (nodeId: string, e: React.MouseEvent) => void;
  onMouseMove: (e: MouseEvent) => void;
  onMouseUp: (e: MouseEvent) => void;
}

let lastConnLog = 0;
function debugConnectionsOncePerSecond(connections, nodes) {
  const now = Date.now();
  if (now - lastConnLog < 1000) return;
  lastConnLog = now;
  console.debug('=== CONNECTION RENDERING DEBUG ===');
  console.debug('Total connections:', connections.length);
  console.debug('Total nodes:', nodes.length);
}

export default function WorkflowCanvas({
  nodes,
  connections,
  selectedNode,
  selectedNodes = new Set(),
  onToggleNodeSelection,
  currentExecutingNode,
  executionResults,
  executionStartTimes,
  cycleNodes = new Set(),
  isConnecting,
  connectionStart,
  mousePosition,
  draggedNode,
  dragOffset,
  visualTheme,
  onDrop,
  onDragOver,
  onNodeSelect,
  onNodeDelete,
  onConnectionDelete,
  onStartConnection,
  onStartNodeDrag,
  onMouseMove,
  onMouseUp
}: WorkflowCanvasProps) {
  // Ensure cycleNodes is always a Set, even if passed as an array
  const cycleNodesSet = React.useMemo(() => {
    if (cycleNodes instanceof Set) {
      return cycleNodes;
    }
    if (Array.isArray(cycleNodes)) {
      return new Set(cycleNodes);
    }
    return new Set();
  }, [cycleNodes]);

  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [zoom, setZoom] = React.useState(1);
  const [panOffset, setPanOffset] = React.useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = React.useState(false);
  const [panStart, setPanStart] = React.useState({ x: 0, y: 0 });
  const [lastPanOffset, setLastPanOffset] = React.useState({ x: 0, y: 0 });

  // Calculate the bounding box of all nodes to size the SVG appropriately
  const getWorkflowBounds = useCallback(() => {
    if (nodes.length === 0) {
      return { minX: 0, minY: 0, maxX: 2000, maxY: 2000 };
    }
    
    const positions = nodes.map(node => ({
      x: node.position.x,
      y: node.position.y
    }));
    
    const minX = Math.min(...positions.map(p => p.x)) - 200;
    const minY = Math.min(...positions.map(p => p.y)) - 200;
    const maxX = Math.max(...positions.map(p => p.x)) + 400;
    const maxY = Math.max(...positions.map(p => p.y)) + 400;
    
    return { minX, minY, maxX, maxY };
  }, [nodes]);

  // Convert screen coordinates to world coordinates
  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    if (!canvasRef.current) return { x: screenX, y: screenY };
    
    const rect = canvasRef.current.getBoundingClientRect();
    const canvasX = screenX - rect.left;
    const canvasY = screenY - rect.top;
    
    const worldX = (canvasX - panOffset.x) / zoom;
    const worldY = (canvasY - panOffset.y) / zoom;
    
    return { x: worldX, y: worldY };
  }, [panOffset, zoom]);

  // Convert world coordinates to screen coordinates
  const worldToScreen = useCallback((worldX: number, worldY: number) => {
    if (!canvasRef.current) return { x: worldX, y: worldY };
    
    const rect = canvasRef.current.getBoundingClientRect();
    const canvasX = worldX * zoom + panOffset.x;
    const canvasY = worldY * zoom + panOffset.y;
    
    const screenX = canvasX + rect.left;
    const screenY = canvasY + rect.top;
    
    return { x: screenX, y: screenY };
  }, []);

  // Handle zoom with mousewheel
  const handleWheel = useCallback((e: WheelEvent) => {
    if (!canvasRef.current) return;
    
    e.preventDefault();
    
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(3, zoom * zoomFactor));
    
    // Calculate zoom point in world coordinates
    const worldX = (mouseX - panOffset.x) / zoom;
    const worldY = (mouseY - panOffset.y) / zoom;
    
    // Calculate new pan offset to keep the same world point under the mouse
    const newPanX = mouseX - worldX * newZoom;
    const newPanY = mouseY - worldY * newZoom;
    
    setZoom(newZoom);
    setPanOffset({ x: newPanX, y: newPanY });
  }, [zoom, panOffset]);

  // Handle canvas panning
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    // Only start panning if NOT clicking on nodes or their children
    const target = e.target as HTMLElement;
    const isNodeElement = target.closest('[data-node-draggable]') || 
                          target.closest('[data-port-type]') || 
                          target.hasAttribute('data-port-type') ||
                          target.closest('button') ||
                          target.tagName === 'BUTTON' ||
                          target.closest('[data-preview-node]');
    
    if (!isNodeElement) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      setLastPanOffset({ ...panOffset });
      e.preventDefault();
      e.stopPropagation();
    }
  }, [panOffset]);

  // Add wheel event listener to canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('wheel', handleWheel, { passive: false });
      return () => canvas.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  // Add global mouse up listener for panning
  useEffect(() => {
    if (isPanning) {
      const handleGlobalMouseUp = (e: MouseEvent) => {
        setIsPanning(false);
        onMouseUp(e);
      };
      const handleGlobalMouseMove = (e: MouseEvent) => {
        const deltaX = e.clientX - panStart.x;
        const deltaY = e.clientY - panStart.y;
        setPanOffset({
          x: lastPanOffset.x + deltaX,
          y: lastPanOffset.y + deltaY
        });
        onMouseMove(e);
      };
      
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.addEventListener('mousemove', handleGlobalMouseMove);
      return () => {
        document.removeEventListener('mouseup', handleGlobalMouseUp);
        document.removeEventListener('mousemove', handleGlobalMouseMove);
      };
    }
  }, [isPanning, panStart, lastPanOffset, onMouseMove, onMouseUp]);

  const getConnectionPath = (sourceNode: Node, targetNode: Node) => {
    const connection = connections.find(c => c.sourceId === sourceNode.id && c.targetId === targetNode.id);
    const sourcePort = connection?.sourcePort || 0;
    const targetPort = connection?.targetPort || 0;
    
    // Calculate port positions based on actual port indices
    const sourceNodeWidth = sourceNode.type === 'preview-node' ? 256 : 192;
    const sourceNodeHeight = 120;
    const targetNodeHeight = 120;
    
    // Calculate source port position
    const sourceOutputPorts = sourceNode.data?.outputPorts || 1;
    let sourcePortY;
    if (sourceOutputPorts === 1) {
      sourcePortY = sourceNode.position.y + sourceNodeHeight / 2;
    } else {
      const spacing = (sourceNodeHeight * 0.8) / (sourceOutputPorts + 1);
      sourcePortY = sourceNode.position.y + (sourceNodeHeight * 0.1) + spacing * (sourcePort + 1);
    }
    
    // Calculate target port position
    const targetInputPorts = targetNode.data?.inputPorts || 1;
    let targetPortY;
    if (targetInputPorts === 1) {
      targetPortY = targetNode.position.y + targetNodeHeight / 2;
    } else {
      const spacing = (targetNodeHeight * 0.8) / (targetInputPorts + 1);
      targetPortY = targetNode.position.y + (targetNodeHeight * 0.1) + spacing * (targetPort + 1);
    }
    
    const sourceX = sourceNode.position.x + sourceNodeWidth;
    const sourceY = sourcePortY;
    const targetX = targetNode.position.x;
    const targetY = targetPortY;
    
    // Simple approach: offset connections based on port index to prevent overlap
    const horizontalDistance = targetX - sourceX;
    const controlPointOffset = Math.max(80, Math.abs(horizontalDistance) * 0.3);
    
    // Create slight vertical offset for different port combinations
    const portCombinationOffset = (sourcePort * 10) + (targetPort * 5);
    
    const sourceControlX = sourceX + controlPointOffset;
    const targetControlX = targetX - controlPointOffset;
    const sourceControlY = sourceY + portCombinationOffset;
    const targetControlY = targetY - portCombinationOffset;
    
    return `M ${sourceX} ${sourceY} C ${sourceControlX} ${sourceControlY}, ${targetControlX} ${targetControlY}, ${targetX} ${targetY}`;
  };

  // Reset zoom and pan
  const resetView = useCallback(() => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);
  
  const getBackgroundStyle = () => {
    switch (visualTheme.background) {
      case 'dark':
        return { background: '#0a0a0a' };
      case 'blue':
        return { 
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 25%, #3b82f6 50%, #1d4ed8 75%, #0f172a 100%)',
          backgroundImage: visualTheme.crystalFacets ? 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M30 0l30 30-30 30L0 30z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' : undefined
        };
      case 'purple':
        return { 
          background: 'linear-gradient(135deg, #2e1065 0%, #581c87 25%, #7c3aed 50%, #8b5cf6 75%, #2e1065 100%)',
          backgroundImage: visualTheme.iridescence ? 'linear-gradient(45deg, rgba(168, 85, 247, 0.1) 0%, rgba(236, 72, 153, 0.1) 50%, rgba(59, 130, 246, 0.1) 100%)' : undefined
        };
      case 'green':
        return { 
          background: 'linear-gradient(135deg, #052e16 0%, #14532d 25%, #16a34a 50%, #22c55e 75%, #052e16 100%)',
          backgroundImage: visualTheme.prismEffect ? 'radial-gradient(circle at 25% 25%, rgba(34, 197, 94, 0.2) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(16, 163, 74, 0.2) 0%, transparent 50%)' : undefined
        };
      case 'aurora':
        return {
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 25%, #16213e 50%, #0f3460 75%, #0a0a0a 100%)',
          backgroundImage: 'radial-gradient(ellipse at top, rgba(59, 130, 246, 0.3) 0%, transparent 50%), radial-gradient(ellipse at bottom, rgba(168, 85, 247, 0.3) 0%, transparent 50%)'
        };
      case 'prism':
        return {
          background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%)',
          backgroundImage: 'conic-gradient(from 0deg at 50% 50%, rgba(255, 0, 150, 0.1) 0deg, rgba(0, 255, 255, 0.1) 120deg, rgba(255, 255, 0, 0.1) 240deg, rgba(255, 0, 150, 0.1) 360deg)'
        };
      case 'pattern':
        return { 
          background: '#0a0a0a',
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M30 0l15 15-15 15-15-15z M0 30l15 15-15 15L0 45z M60 30l-15 15 15 15V45z M30 60l15-15-15-15-15 15z'/%3E%3C/g%3E%3C/svg%3E")`
        };
      default:
        return { background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 25%, #0f0f0f 50%, #050505 75%, #000000 100%)' };
    }
  };
  
  const getGridPattern = () => {
    switch (visualTheme.gridPattern) {
      case 'lines':
        return `
          linear-gradient(rgba(255, 255, 255, ${visualTheme.glassBorder * 5}) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, ${visualTheme.glassBorder * 5}) 1px, transparent 1px)
        `;
      case 'large-dots':
        return `radial-gradient(circle, rgba(255, 255, 255, ${visualTheme.glassBorder * 10}) 2px, transparent 2px)`;
      case 'hexagon':
        return `url("data:image/svg+xml,%3Csvg width='50' height='50' viewBox='0 0 50 50' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23ffffff' stroke-opacity='${visualTheme.glassBorder * 10}' stroke-width='1'%3E%3Cpath d='M25 5l15 10v20L25 45 10 35V15z'/%3E%3C/g%3E%3C/svg%3E")`;
      case 'diamond':
        return `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23ffffff' stroke-opacity='${visualTheme.glassBorder * 8}' stroke-width='1'%3E%3Cpath d='M20 5l15 15-15 15-15-15z'/%3E%3C/g%3E%3C/svg%3E")`;
      case 'none':
        return 'none';
      default:
        return `radial-gradient(circle, rgba(255, 255, 255, ${visualTheme.glassBorder * 7.5}) 1px, transparent 1px)`;
    }
  };
  
  const getGridSize = () => {
    switch (visualTheme.gridPattern) {
      case 'lines':
        return '40px 40px';
      case 'large-dots':
        return '50px 50px';
      case 'hexagon':
        return '50px 50px';
      case 'diamond':
        return '40px 40px';
      case 'none':
        return 'none';
      default:
        return '30px 30px';
    }
  };

  return (
    <div className="flex-1 relative mt-20">
      <div
        ref={canvasRef}
        className={`w-full h-full canvas-grid relative overflow-hidden bg-slate-900/20 ${
          isPanning ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('Drag enter on canvas');
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onMouseDown={(e) => {
          // Always try to handle panning, let the callback decide
          handleCanvasMouseDown(e);
        }}
        onClick={(e) => {
          // Deselect nodes when clicking on empty canvas
          const target = e.target as HTMLElement;
          const isNodeElement = target.closest('[data-node-draggable]') || 
                                target.closest('[data-port-type]') || 
                                target.hasAttribute('data-port-type') ||
                                target.closest('button') ||
                                target.tagName === 'BUTTON' ||
                                target.closest('[data-preview-node]');
          
          if (!isNodeElement) {
            onNodeSelect(null as any);
          }
        }}
        style={{
          ...getBackgroundStyle(),
          backgroundImage: getGridPattern(),
          backgroundSize: getGridSize(),
          backgroundPosition: '0 0',
          backgroundRepeat: 'repeat'
        }}
      >
        {/* Canvas content with zoom and pan transform */}
        <div
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            width: '10000px',
            height: '10000px',
            position: 'relative'
          }}
        >
          {(() => {
            const bounds = getWorkflowBounds();
            console.log('Workflow bounds:', bounds);
            console.log('SVG will cover:', {
              width: bounds.maxX - bounds.minX,
              height: bounds.maxY - bounds.minY,
              viewBox: `${bounds.minX} ${bounds.minY} ${bounds.maxX - bounds.minX} ${bounds.maxY - bounds.minY}`
            });
            return null;
          })()}
          
          {/* SVG for connections */}
          {(() => {
            const bounds = getWorkflowBounds();
            return (
              <svg
                ref={svgRef}
                className="absolute pointer-events-none"
                style={{ 
                  zIndex: 1,
                  width: `${bounds.maxX - bounds.minX}px`,
                  height: `${bounds.maxY - bounds.minY}px`,
                  left: `${bounds.minX}px`,
                  top: `${bounds.minY}px`,
                  overflow: 'visible',
                  pointerEvents: 'none',
                }}
                viewBox={`0 0 ${bounds.maxX - bounds.minX} ${bounds.maxY - bounds.minY}`}
              >
                <defs>
                  <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgba(245, 158, 11, 0.9)" />
                    <stop offset="50%" stopColor="rgba(245, 158, 11, 1)" />
                    <stop offset="100%" stopColor="rgba(245, 158, 11, 0.9)" />
                  </linearGradient>
                </defs>
                
                {/* Render connections */}
                {debugConnectionsOncePerSecond(connections, nodes)}
                
                {connections.map(connection => {
                  const sourceNode = nodes.find(n => n.id === connection.sourceId);
                  const targetNode = nodes.find(n => n.id === connection.targetId);
                  const bounds = getWorkflowBounds();
                  
                  const sPort = connection.sourcePortId ?? String(connection.sourcePort ?? 0);
                  const tPort = connection.targetPortId ?? String(connection.targetPort ?? 0);
                  
                  console.debug(`Rendering ${connection.id}: ${connection.sourceId}:${sPort} → ${connection.targetId}:${tPort}`);
                  
                  if (!sourceNode || !targetNode) {
                    console.error(`❌ Missing node for connection ${connection.id}`);
                    return null;
                  }
                  
                  // Adjust coordinates relative to SVG bounds
                  const adjustedSourceNode = {
                    ...sourceNode,
                    position: {
                      x: sourceNode.position.x - bounds.minX,
                      y: sourceNode.position.y - bounds.minY
                    }
                  };
                  const adjustedTargetNode = {
                    ...targetNode,
                    position: {
                      x: targetNode.position.x - bounds.minX,
                      y: targetNode.position.y - bounds.minY
                    }
                  };
                  
                  const path = getConnectionPath(adjustedSourceNode, adjustedTargetNode);

                  return (
                    <path
                      key={connection.id}
                      d={path}
                      stroke="#f59e0b"
                      strokeWidth="4"
                      fill="none"
                      className="pointer-events-auto cursor-pointer"
                      onClick={() => onConnectionDelete(connection.id)}
                    />
                  );
                })}
                
                {/* Gradient and filter definitions */}
                
                {/* Connection preview */}
                {isConnecting && connectionStart && (
                  <>
                    {(() => {
                      // Find the source node to get its actual position
                      const sourceNode = nodes.find(n => n.id === connectionStart.nodeId);
                      if (!sourceNode) return null;
                      
                      // Calculate the actual output port position in world coordinates
                      const bounds = getWorkflowBounds();
                      const portX = (sourceNode.position.x - bounds.minX) + 192; // Right side of node
                      const portY = (sourceNode.position.y - bounds.minY) + 60;  // Middle of node
                      
                      // Convert mouse position to world coordinates and adjust for SVG bounds
                      const canvas = document.querySelector('.canvas-grid') as HTMLElement;
                      if (!canvas) return null;
                      
                      const rect = canvas.getBoundingClientRect();
                      const canvasX = mousePosition.x - rect.left;
                      const canvasY = mousePosition.y - rect.top;
                      const worldX = ((canvasX - panOffset.x) / zoom) - bounds.minX;
                      const worldY = ((canvasY - panOffset.y) / zoom) - bounds.minY;
                      
                      return (
                        <>
                          {/* Connection line preview */}
                          <path
                            d={`M ${portX} ${portY} C ${portX + 100} ${portY}, ${worldX - 100} ${worldY}, ${worldX} ${worldY}`}
                            stroke="rgba(245, 158, 11, 0.7)"
                            strokeWidth="3"
                            strokeDasharray="8,4"
                            fill="none"
                          />
                          {/* Target indicator */}
                          <circle
                            cx={worldX}
                            cy={worldY}
                            r="8"
                            fill="none"
                            stroke="rgba(245, 158, 11, 0.8)"
                            strokeWidth="2"
                            strokeDasharray="4,2"
                          >
                            <animate attributeName="r" values="6;12;6" dur="1.5s" repeatCount="indefinite" />
                          </circle>
                        </>
                      );
                    })()}
                  </>
                )}
                
              </svg>
            );
          })()}
          
          {/* Render nodes */}
          {nodes.map(node => (
            node.type === 'image-preview-node' ? (
              <ImagePreviewNode
                key={node.id}
                node={node}
                isSelected={selectedNode?.id === node.id}
                isMultiSelected={selectedNodes.has(node.id)}
                connections={connections}
                visualTheme={visualTheme}
                nodes={nodes}
                onSelect={(ctrlKey) => {
                  onNodeSelect(node);
                  onToggleNodeSelection?.(node.id, ctrlKey);
                }}
                onDelete={() => onNodeDelete(node.id)}
                onStartConnection={onStartConnection}
                onStartDrag={onStartNodeDrag}
              />
            ) : node.type === 'audio-preview-node' ? (
              <AudioPreviewNode
                key={node.id}
                node={node}
                isSelected={selectedNode?.id === node.id}
                isMultiSelected={selectedNodes.has(node.id)}
                connections={connections}
                visualTheme={visualTheme}
                nodes={nodes}
                onSelect={(ctrlKey) => {
                  onNodeSelect(node);
                  onToggleNodeSelection?.(node.id, ctrlKey);
                }}
                onDelete={() => onNodeDelete(node.id)}
                onStartConnection={onStartConnection}
                onStartDrag={onStartNodeDrag}
              />
            ) : node.type === 'video-preview-node' ? (
              <VideoPreviewNode
                key={node.id}
                node={node}
                isSelected={selectedNode?.id === node.id}
                isMultiSelected={selectedNodes.has(node.id)}
                connections={connections}
                visualTheme={visualTheme}
                nodes={nodes}
                onSelect={(ctrlKey) => {
                  onNodeSelect(node);
                  onToggleNodeSelection?.(node.id, ctrlKey);
                }}
                onDelete={() => onNodeDelete(node.id)}
                onStartConnection={onStartConnection}
                onStartDrag={onStartNodeDrag}
              />
            ) : node.type === 'text-preview-node' ? (
              <TextPreviewNode
                key={node.id}
                node={node}
                isSelected={selectedNode?.id === node.id}
                isMultiSelected={selectedNodes.has(node.id)}
                connections={connections}
                visualTheme={visualTheme}
                nodes={nodes}
                onSelect={(ctrlKey) => {
                  onNodeSelect(node);
                  onToggleNodeSelection?.(node.id, ctrlKey);
                }}
                onDelete={() => onNodeDelete(node.id)}
                onStartConnection={onStartConnection}
                onStartDrag={onStartNodeDrag}
              />
            ) : node.type === 'digivice-widget' ? (
              <DigiviceNode
                key={node.id}
                node={node}
                isSelected={selectedNode?.id === node.id}
                isMultiSelected={selectedNodes.has(node.id)}
                visualTheme={visualTheme}
                onSelect={(ctrlKey) => {
                  onNodeSelect(node);
                  onToggleNodeSelection?.(node.id, ctrlKey);
                }}
                onDelete={() => onNodeDelete(node.id)}
                onStartConnection={onStartConnection}
                onStartDrag={onStartNodeDrag}
              />
            ) : (
              <WorkflowNode
                key={node.id}
                node={node}
                isSelected={selectedNode?.id === node.id}
                isMultiSelected={selectedNodes.has(node.id)}
                isExecuting={currentExecutingNode === node.id}
                isInCycle={cycleNodesSet.has(node.id)}
                executionStatus={
                  currentExecutingNode === node.id ? 'executing' :
                  executionResults?.has(node.id) ? 'completed' : 'idle'
                }
                executionStartTime={executionStartTimes?.get(node.id)}
                visualTheme={visualTheme}
                onSelect={(ctrlKey) => {
                  onNodeSelect(node);
                  onToggleNodeSelection?.(node.id, ctrlKey);
                }}
                onDelete={() => onNodeDelete(node.id)}
                onStartConnection={onStartConnection}
                onStartDrag={onStartNodeDrag}
              />
            )
          ))}
          
          {/* Drop zone indicator */}
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Plus className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Drag nodes here to start building</p>
                <p className="text-sm">Create your autonomous content workflow</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Controls */}
      <div className="absolute bottom-4 left-4 flex flex-col space-y-2">
        <div className="glass px-3 py-2 rounded-lg text-sm text-gray-300">
          Zoom: {Math.round(zoom * 100)}%
        </div>
        <button
          onClick={resetView}
          className="glass px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white transition-colors"
        >
          Reset View
        </button>
      </div>
    </div>
  );
}