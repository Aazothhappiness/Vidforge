import React, { useRef, useEffect, useState } from 'react';
import { X, Play, Pause, Volume2, VolumeX, Settings, RotateCcw } from 'lucide-react';
import { Node } from '../types/NodeTypes';
import { mountDigiviceWidget, DigiviceController } from '../lib/digivice/core';

interface DigiviceNodeProps {
  node: Node;
  isSelected: boolean;
  isMultiSelected?: boolean;
  visualTheme: any;
  onSelect: (ctrlKey?: boolean) => void;
  onDelete: () => void;
  onStartConnection: (nodeId: string, e: React.MouseEvent) => void;
  onStartDrag: (nodeId: string, e: React.MouseEvent) => void;
}

export default function DigiviceNode({
  node,
  isSelected,
  isMultiSelected = false,
  visualTheme,
  onSelect,
  onDelete,
  onStartConnection,
  onStartDrag
}: DigiviceNodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controllerRef = useRef<DigiviceController | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [gameState, setGameState] = useState<any>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const initWidget = async () => {
      try {
        const controller = await mountDigiviceWidget(canvas, {
          shell: node.data.shell || 'round',
          difficulty: node.data.difficulty || 'Normal',
          speed: node.data.speed || 1,
          audio: {
            muted: node.data.sound === false,
            volume: node.data.volume || 0.7
          },
          features: {
            exploration: node.data.exploration !== false,
            linkPlay: node.data.linkPlay !== false,
            events: node.data.events !== false
          },
          rules: {
            poopEnabled: node.data.poopEnabled !== false,
            deathEnabled: node.data.deathEnabled === true
          },
          debug: node.data.debug === true
        });

        controllerRef.current = controller;
        setIsLoaded(true);

        // Subscribe to game state changes
        controller.on('state:change', (state) => {
          setGameState(state);
        });

        // Subscribe to evolution events
        controller.on('evolve', (monster) => {
          console.log('Monster evolved:', monster);
        });

      } catch (err) {
        console.error('Digivice initialization error:', err);
      }
    };

    initWidget();

    return () => {
      if (controllerRef.current) {
        controllerRef.current.unmount();
      }
    };
  }, [node.id]);

  const togglePause = () => {
    if (!controllerRef.current) return;
    
    if (isPaused) {
      controllerRef.current.resume();
    } else {
      controllerRef.current.pause();
    }
    setIsPaused(!isPaused);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    // In a real implementation, this would update the audio context
  };

  const resetGame = () => {
    if (controllerRef.current && confirm('Reset your Digimon? This cannot be undone!')) {
      // Reset logic would go here
      console.log('Game reset requested');
    }
  };

  const getNodeStyle = () => {
    const baseOpacity = visualTheme.nodeOpacity || 0.8;
    const glowColor = visualTheme.glowIntensity > 0 ? `0 0 ${Math.round(visualTheme.glowIntensity * 40)}px rgba(245, 158, 11, ${visualTheme.glowIntensity * 0.3})` : '';
    const shadowDepth = `0 ${Math.round(visualTheme.shadowDepth * 20)}px ${Math.round(visualTheme.shadowDepth * 80)}px rgba(0, 0, 0, ${visualTheme.shadowDepth * 0.9})`;
    const reflection = `inset 0 1px 0 rgba(255, 255, 255, ${visualTheme.glassReflection})`;
    
    return {
      background: `rgba(245, 158, 11, ${baseOpacity * 0.08})`,
      backdropFilter: `blur(${visualTheme.glassBlur}px)`,
      border: `1px solid rgba(245, 158, 11, ${visualTheme.glassBorder})`,
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
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500">
            <span className="text-white font-bold text-sm">🎮</span>
          </div>
          <div>
            <h3 className="font-medium text-white text-sm">Digivice Widget</h3>
            <p className="text-xs text-gray-400">Virtual Pet Game</p>
          </div>
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

      {/* Digivice Canvas */}
      <div className="mb-3 bg-black/20 rounded-lg p-2">
        <canvas
          ref={canvasRef}
          width={240}
          height={240}
          className="w-full h-auto border border-white/10 rounded"
          style={{
            imageRendering: 'pixelated',
            maxWidth: '100%'
          }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePause();
            }}
            className="p-2 bg-white/10 rounded hover:bg-white/20 transition-colors"
            title={isPaused ? 'Resume' : 'Pause'}
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleMute();
            }}
            className="p-2 bg-white/10 rounded hover:bg-white/20 transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              resetGame();
            }}
            className="p-2 bg-white/10 rounded hover:bg-white/20 transition-colors"
            title="Reset Game"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        <div className="text-xs text-gray-400">
          {isLoaded ? (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Active</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              <span>Loading...</span>
            </div>
          )}
        </div>
      </div>

      {/* Game Status */}
      {gameState && (
        <div className="mt-3 text-xs text-gray-400 bg-black/20 p-2 rounded">
          <div className="grid grid-cols-2 gap-2">
            <div>Monster: {gameState.currentMonster?.name}</div>
            <div>Stage: {gameState.currentMonster?.stage}</div>
            <div>Hunger: {Math.round(gameState.careNeeds?.hunger || 0)}%</div>
            <div>Energy: {Math.round(gameState.careNeeds?.energy || 0)}%</div>
            <div>Bond: {Math.round(gameState.careNeeds?.bond || 0)}%</div>
            <div>Battles: {gameState.stats?.battlesWon || 0}</div>
          </div>
        </div>
      )}

      {/* Status indicator */}
      <div className="absolute top-2 right-2">
        <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
      </div>
    </div>
  );
}