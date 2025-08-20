import React, { useRef, useEffect, useState } from 'react';
import { mountDigiviceWidget, DigiviceController } from '../lib/digivice/core';

interface DigiviceWidgetProps {
  options?: {
    shell?: 'brick' | 'oval' | 'round' | 'neon';
    difficulty?: 'Casual' | 'Normal' | 'Hard';
    speed?: 0.5 | 1 | 2 | 4 | 8;
    sound?: boolean;
    music?: boolean;
    volume?: number;
    debug?: boolean;
  };
  onStateChange?: (state: any) => void;
}

export default function DigiviceWidget({ options = {}, onStateChange }: DigiviceWidgetProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controllerRef = useRef<DigiviceController | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const initWidget = async () => {
      try {
        const controller = await mountDigiviceWidget(canvas, {
          shell: 'round',
          difficulty: 'Normal',
          speed: 1,
          sound: true,
          music: true,
          volume: 0.7,
          features: {
            exploration: true,
            linkPlay: true,
            events: true
          },
          ...options
        });

        controllerRef.current = controller;
        setIsLoaded(true);

        // Subscribe to state changes
        if (onStateChange) {
          controller.on('state:change', onStateChange);
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize Digivice');
        console.error('Digivice initialization error:', err);
      }
    };

    initWidget();

    return () => {
      if (controllerRef.current) {
        controllerRef.current.unmount();
      }
    };
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center w-full h-64 bg-red-500/10 border border-red-500/20 rounded-lg">
        <div className="text-center">
          <div className="text-red-400 font-medium mb-2">Digivice Error</div>
          <div className="text-sm text-gray-400">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <canvas
        ref={canvasRef}
        className="border border-white/20 rounded-lg shadow-2xl"
        style={{
          imageRendering: 'pixelated',
          maxWidth: '100%',
          height: 'auto'
        }}
      />
      
      {!isLoaded && (
        <div className="text-center">
          <div className="text-amber-400 font-medium">Loading Digivice...</div>
          <div className="text-xs text-gray-400 mt-1">Initializing virtual pet system</div>
        </div>
      )}
      
      {isLoaded && (
        <div className="text-center">
          <div className="text-green-400 font-medium">Digivice Ready!</div>
          <div className="text-xs text-gray-400 mt-1">Your digital companion awaits</div>
        </div>
      )}
    </div>
  );
}