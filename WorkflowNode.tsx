import React from 'react';
import { X, Play, Pause, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { Node } from '../types/NodeTypes';
import { nodeTypes } from '../data/nodeTypes';

interface WorkflowNodeProps {
  node: Node;
  isSelected: boolean;
  isMultiSelected?: boolean;
  isExecuting?: boolean;
  executionStatus?: 'idle' | 'executing' | 'completed' | 'error';
  executionStartTime?: Date;
  isInCycle?: boolean;
  visualTheme: any;
  onSelect: (ctrlKey?: boolean) => void;
  onDelete: () => void;
  onStartConnection: (nodeId: string, e: React.MouseEvent) => void;
  onStartDrag: (nodeId: string, e: React.MouseEvent) => void;
}

export default function WorkflowNode({
  node,
  isSelected,
  isMultiSelected = false,
  isExecuting = false,
  executionStatus = 'idle',
  executionStartTime,
  isInCycle,
  visualTheme,
  onSelect,
  onDelete,
  onStartConnection,
  onStartDrag
}: WorkflowNodeProps) {
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);
  
  const nodeTypeInfo = nodeTypes.find(type => type.id === node.type);
  if (!nodeTypeInfo) return null;
  
  const Icon = nodeTypeInfo.icon;
  
  // Get number of input and output ports from node data
  let inputPorts = 1;
  let outputPorts = 1;
  
  // Special handling for nodes with fixed port configurations
  if (node.type === 'yes-no-node') {
    inputPorts = node.data.inputPorts || 1; // Configurable inputs
    outputPorts = 2; // Always 2 outputs (yes/no)
  } else if (node.type === 'file-input-node') {
    inputPorts = 0; // No inputs - file upload only
    outputPorts = 2; // Always 2 outputs (script/prompts)
  } else if (node.type === 'judgment-node') {
    inputPorts = node.data.inputPorts || 1; // Configurable inputs
    outputPorts = 2; // Always 2 outputs (yes/no)
  } else if (node.type === 'decision-node') {
    inputPorts = 2; // Always 2 inputs for YES/NO
    outputPorts = node.data.outputPorts || 2; // Default 2 outputs, configurable
  } else {
    // For all other nodes, use the configured port counts
    inputPorts = node.data?.inputPorts || 1;
    outputPorts = node.data?.outputPorts || 1;
  }
  
  // Calculate port positions
  const getPortPositions = (count: number, isInput: boolean) => {
    if (count === 1) {
      return [{ top: '50%', transform: 'translateY(-50%)' }];
    }
    
    const positions = [];
    const spacing = 80 / (count + 1); // Distribute across 80% of node height
    
    for (let i = 0; i < count; i++) {
      const top = 10 + spacing * (i + 1); // Start at 10% from top
      positions.push({ top: `${top}%`, transform: 'none' });
    }
    
    return positions;
  };
  
  const inputPortPositions = getPortPositions(inputPorts, true);
  const outputPortPositions = getPortPositions(outputPorts, false);
  
  const getStatusIcon = () => {
    switch (executionStatus) {
      case 'executing':
        return <Play className="w-3 h-3 text-amber-400 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-3 h-3 text-green-400" />;
      case 'error':
        return <AlertCircle className="w-3 h-3 text-red-400 animate-pulse" />;
      default:
        return <Clock className="w-3 h-3 text-gray-400" />;
    }
  };
  
  const getExecutionTime = () => {
    if (!executionStartTime) return '';
    const now = new Date();
    const diff = Math.floor((now.getTime() - executionStartTime.getTime()) / 1000);
    return `${diff}s`;
  };
  
  const getNodeStyle = () => {
    const baseOpacity = visualTheme.nodeOpacity || 0.8;
    const glowColor = visualTheme.glowIntensity > 0 ? `0 0 ${Math.round(visualTheme.glowIntensity * 40)}px rgba(245, 158, 11, ${visualTheme.glowIntensity * 0.3})` : '';
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
          background: `rgba(255, 255, 255, ${baseOpacity * 0.12})`,
          backdropFilter: `blur(${visualTheme.glassBlur}px)`,
          border: `2px solid rgba(255, 255, 255, ${visualTheme.glassBorder * 3})`,
          borderRadius: `${Math.round(visualTheme.borderRadius * 0.6)}px`,
          boxShadow: `
            ${shadowDepth},
            ${reflection},
            ${glowColor},
            inset 2px 2px 4px rgba(255, 255, 255, 0.1),
            inset -2px -2px 4px rgba(0, 0, 0, 0.2)
          `.trim(),
          clipPath: visualTheme.crystalFacets ? 'polygon(0% 15%, 15% 0%, 85% 0%, 100% 15%, 100% 85%, 85% 100%, 15% 100%, 0% 85%)' : undefined
        };
      case 'frosted':
        return {
          background: `rgba(255, 255, 255, ${baseOpacity * 0.15})`,
          backdropFilter: `blur(${visualTheme.glassBlur * 1.5}px) saturate(1.2)`,
          border: `1px solid rgba(255, 255, 255, ${visualTheme.glassBorder * 4})`,
          borderRadius: `${visualTheme.borderRadius}px`,
          boxShadow: `
            ${shadowDepth},
            ${reflection},
            ${glowColor}
          `.trim()
        };
      case 'liquid':
        return {
          background: `rgba(255, 255, 255, ${baseOpacity * 0.06})`,
          backdropFilter: `blur(${visualTheme.glassBlur}px) hue-rotate(${visualTheme.holographicShift ? '30deg' : '0deg'})`,
          border: `1px solid rgba(245, 158, 11, ${visualTheme.glassBorder * 6})`,
          borderRadius: `${visualTheme.borderRadius * 1.5}px`,
          boxShadow: `
            ${shadowDepth},
            ${reflection},
            0 0 20px rgba(245, 158, 11, 0.2),
            ${glowColor}
          `.trim()
        };
      case 'holographic':
        return {
          background: `linear-gradient(135deg, 
            rgba(255, 255, 255, ${baseOpacity * 0.1}) 0%, 
            rgba(168, 85, 247, ${baseOpacity * 0.08}) 25%, 
            rgba(59, 130, 246, ${baseOpacity * 0.08}) 50%, 
            rgba(34, 197, 94, ${baseOpacity * 0.08}) 75%, 
            rgba(255, 255, 255, ${baseOpacity * 0.1}) 100%)`,
          backdropFilter: `blur(${visualTheme.glassBlur}px) hue-rotate(${visualTheme.holographicShift ? '45deg' : '0deg'})`,
          border: `1px solid rgba(255, 255, 255, ${visualTheme.glassBorder * 2})`,
          borderRadius: `${visualTheme.borderRadius}px`,
          boxShadow: `
            ${shadowDepth},
            ${reflection},
            0 0 30px rgba(168, 85, 247, 0.3),
            ${glowColor}
          `.trim()
        };
      case 'prism':
        return {
          background: `conic-gradient(from 0deg, 
            rgba(255, 0, 150, ${baseOpacity * 0.1}) 0deg, 
            rgba(0, 255, 255, ${baseOpacity * 0.1}) 120deg, 
            rgba(255, 255, 0, ${baseOpacity * 0.1}) 240deg, 
            rgba(255, 0, 150, ${baseOpacity * 0.1}) 360deg)`,
          backdropFilter: `blur(${visualTheme.glassBlur}px)`,
          border: `2px solid rgba(255, 255, 255, ${visualTheme.glassBorder * 3})`,
          borderRadius: `${visualTheme.borderRadius}px`,
          boxShadow: `
            ${shadowDepth},
            ${reflection},
            0 0 40px rgba(255, 255, 255, 0.2),
            ${glowColor}
          `.trim()
        };
      case 'minimal':
        return {
          background: `rgba(0, 0, 0, ${baseOpacity * 0.3})`,
          border: `2px solid rgba(245, 158, 11, ${visualTheme.glassBorder * 15})`,
          borderRadius: `${Math.round(visualTheme.borderRadius * 0.6)}px`,
          backdropFilter: `blur(${Math.round(visualTheme.glassBlur * 0.2)}px)`,
          boxShadow: shadowDepth
        };
      default:
        return {
          background: `rgba(255, 255, 255, ${baseOpacity * 0.08})`,
          backdropFilter: `blur(${visualTheme.glassBlur}px)`,
          border: `1px solid rgba(255, 255, 255, ${visualTheme.glassBorder})`,
          borderRadius: `${visualTheme.borderRadius}px`,
          boxShadow: `
            ${shadowDepth},
            ${reflection},
            ${glowColor}
          `.trim()
        };
    }
  };

  return (
    <div
      data-node-draggable="true"
      className={`absolute p-4 w-48 cursor-move select-none ${
        visualTheme.animations.enabled ? 'transition-all duration-300 ease-out' : ''
      } ${
        isSelected ? 'ring-2 ring-amber-500 shadow-lg shadow-amber-500/20' : ''
      } ${
       isMultiSelected && !isSelected ? 'ring-2 ring-blue-400 shadow-lg shadow-blue-400/20' : ''
     } ${
        isExecuting && visualTheme.animations.pulseOnExecution ? 'ring-4 ring-amber-400 shadow-2xl shadow-amber-400/50 animate-pulse bg-amber-400/10' : 
        isExecuting ? 'ring-4 ring-amber-400 shadow-2xl shadow-amber-400/50 bg-amber-400/10' : ''
      } ${
        executionStatus === 'completed' ? 'ring-2 ring-green-400 shadow-lg shadow-green-400/20 bg-green-400/5' : ''
      } ${
        executionStatus === 'error' ? 'ring-4 ring-red-500 shadow-2xl shadow-red-500/60 animate-pulse bg-red-500/20' : ''
      } ${
        node.type === 'judgment-node' ? 'border-l-4 border-l-orange-500' : ''
      } ${
        node.type === 'trash-node' ? 'border-l-4 border-l-gray-500' : ''
      } ${
        visualTheme.animations.enabled && visualTheme.animations.hoverLift ? 'hover:transform hover:-translate-y-2 hover:scale-105' : ''
      } ${
        visualTheme.animations.enabled && visualTheme.animations.breathingEffect ? 'animate-pulse' : ''
      }`}
      style={{
        left: node.position.x,
        top: node.position.y,
        zIndex: isSelected ? 10 : 2,
        ...getNodeStyle(),
        animation: visualTheme.animations.enabled && visualTheme.animations.breathingEffect ? 'breathe 4s ease-in-out infinite' : undefined
      }}
      onClick={(e) => {
        e.stopPropagation();
        console.log('WorkflowNode clicked:', node.id, node.type, 'onSelect function:', typeof onSelect);
        onSelect(e.ctrlKey || e.metaKey);
      }}
      onMouseDown={(e) => onStartDrag(node.id, e)}
      onDragStart={(e) => e.preventDefault()}
    >
      {/* Input Ports */}
      {inputPortPositions.map((position, index) => (
        <div
          key={`input-${index}`}
          className={`absolute left-0 w-3 h-3 rounded-full border-2 border-white cursor-pointer hover:scale-110 transition-all z-20 ${
            node.type === 'decision-node'
              ? (index === 0 ? 'bg-green-500 hover:bg-green-400' : 'bg-red-500 hover:bg-red-400')
              : 'bg-blue-500 hover:bg-blue-400'
          }`}
          data-port-type="input"
          data-node-id={node.id}
          data-port-index={index}
          style={{ 
            ...position,
            transform: `translateX(-50%) ${position.transform}`,
            pointerEvents: 'auto' 
          }}
        >
          {/* Input port labels for decision node */}
          {node.type === 'decision-node' && (
            <div className={`absolute text-xs font-medium whitespace-nowrap ${
              index === 0 
                ? 'text-green-400 -top-5 -left-6' 
                : 'text-red-400 -bottom-5 -left-5'
            }`}>
              {index === 0 ? 'YES' : 'NO'}
            </div>
          )}
        </div>
      ))}
      
      {/* Output Ports */}
      {outputPortPositions.map((position, index) => (
        <div
          key={`output-${index}`}
          className={`absolute right-0 w-3 h-3 rounded-full border-2 border-white cursor-pointer hover:scale-110 transition-all z-20 ${
            (node.type === 'yes-no-node' || node.type === 'judgment-node') 
              ? (index === 0 ? 'bg-green-500 hover:bg-green-400' : 'bg-red-500 hover:bg-red-400')
              : 'bg-green-500 hover:bg-green-400'
          }`}
          data-port-type="output"
          data-node-id={node.id}
          data-port-index={index}
          data-port-label={(node.type === 'yes-no-node' || node.type === 'judgment-node') ? (index === 0 ? 'yes' : 'no') : undefined}
          style={{ 
            ...position,
            transform: `translateX(50%) ${position.transform}`,
            pointerEvents: 'auto' 
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onStartConnection(node.id, e);
          }}
        >
          {/* Port labels for yes/no node */}
          {(node.type === 'yes-no-node' || node.type === 'judgment-node' || node.type === 'file-input-node') && (
            <div className={`absolute text-xs font-medium whitespace-nowrap ${
              index === 0 
                ? (node.type === 'file-input-node' ? 'text-blue-400 -top-5 -right-6' : 'text-green-400 -top-5 -right-2')
                : (node.type === 'file-input-node' ? 'text-purple-400 -bottom-5 -right-8' : 'text-red-400 -bottom-5 -right-2')
            }`}>
              {node.type === 'file-input-node' 
                ? (index === 0 ? 'SCRIPT' : 'PROMPTS')
                : (index === 0 ? 'YES' : 'NO')
              }
            </div>
          )}
          {/* Port labels for decision node */}
          {node.type === 'decision-node' && outputPorts === 2 && (
            <div className={`absolute text-xs font-medium whitespace-nowrap ${
              index === 0 
                ? 'text-green-400 -top-5 -right-4' 
                : 'text-red-400 -bottom-5 -right-3'
            }`}>
              {index === 0 ? 'YES' : 'NO'}
            </div>
          )}
        </div>
      ))}
      
      <div className="flex items-center space-x-3 mb-2">
        <div className={`p-2 rounded-lg bg-gradient-to-r ${nodeTypeInfo.color}`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-white text-sm">{nodeTypeInfo.name}</h3>
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
      <p className="text-xs text-gray-400">{nodeTypeInfo.description}</p>
      
      {/* Status indicator */}
      <div className="absolute top-2 right-2 flex items-center space-x-1">
        {getStatusIcon()}
        {(isExecuting || executionStatus === 'error') && executionStartTime && (
          <span className={`text-xs font-mono ${
            executionStatus === 'error' ? 'text-red-400' : 'text-amber-400'
          }`}>
            {getExecutionTime()}
          </span>
        )}
        {executionStatus === 'executing' && (
          <div className="absolute -top-8 -right-2 bg-amber-500 text-black text-xs px-2 py-1 rounded-full font-medium animate-bounce">
            RUNNING
          </div>
        )}
        {executionStatus === 'error' && (
          <div className="absolute -top-8 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium animate-pulse">
            ERROR
          </div>
        )}
        {isInCycle && (
          <div className="absolute -top-8 -right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium animate-pulse">
            CYCLE
          </div>
        )}
      </div>
      
      {/* Execution status bar */}
      {(isExecuting || executionStatus !== 'idle') && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20 rounded-b-[20px] overflow-hidden">
          <div className={`h-full transition-all duration-300 ${
            executionStatus === 'executing' ? 'bg-amber-400 animate-pulse' :
            executionStatus === 'completed' ? 'bg-green-400' :
            executionStatus === 'error' ? 'bg-red-400' : 'bg-gray-400'
          }`} style={{ width: executionStatus === 'executing' ? '100%' : executionStatus === 'completed' ? '100%' : '0%' }} />
        </div>
      )}
    </div>
  );
}