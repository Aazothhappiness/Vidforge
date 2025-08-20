import React from 'react';
import { Settings } from 'lucide-react';
import { Node } from '../types/NodeTypes';
import { nodeTypes } from '../data/nodeTypes';
import NodeProperties from './NodeProperties';

interface PropertiesPanelProps {
  selectedNode: Node | null;
  connections: any[];
  onNodeUpdate: (nodeId: string, patch: Record<string, any>) => void;
  apiKeys?: {
    elevenlabs?: string;
    openai?: string;
    youtube?: string;
    hedra?: string;
  };
}

// Deep merge utility
function mergeDeep(target: any, patch: any): any {
  if (typeof patch !== 'object' || patch === null) return patch;
  if (typeof target !== 'object' || target === null) target = Array.isArray(patch) ? [] : {};
  const out = Array.isArray(target) ? [...target] : { ...target };
  for (const key of Object.keys(patch)) {
    const pv = (patch as any)[key];
    const tv = (target as any)[key];
    if (pv && typeof pv === 'object' && !Array.isArray(pv)) {
      out[key] = mergeDeep(tv, pv);
    } else {
      out[key] = pv;
    }
  }
  return out;
}

export default function PropertiesPanel({ selectedNode, connections, onNodeUpdate, apiKeys }: PropertiesPanelProps) {
  const getNodeTypeInfo = (nodeType: string) => {
    return nodeTypes.find(type => type.id === nodeType);
  };

  if (!selectedNode) {
    return (
      <div className="w-80 glass-strong border-l border-white/10 mt-20 flex flex-col fixed right-0 top-0 bottom-0 z-40">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-lg font-semibold mb-4 text-white">Properties</h2>
          <div className="text-center text-gray-500 py-8">
            <Settings className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Select a node to view properties</p>
          </div>
        </div>
      </div>
    );
  }

  const handleUpdate = (patch: Record<string, any>) => {
    // Deep merge the patch into existing node data
    const currentData = selectedNode.data || {};
    const mergedData = mergeDeep(currentData, patch);
    
    // Log the update for debugging
    console.log('PropertiesPanel update:', {
      nodeId: selectedNode.id,
      nodeType: selectedNode.type,
      patch,
      currentData: Object.keys(currentData),
      mergedData: Object.keys(mergedData)
    });
    
    onNodeUpdate(selectedNode.id, mergedData);
  };

  return (
    <div className="w-80 glass-strong border-l border-white/10 mt-20 flex flex-col fixed right-0 top-0 bottom-0 z-40">
      <div className="p-6 border-b border-white/10">
        <h2 className="text-lg font-semibold mb-4 text-white">Properties</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-amber-400 mb-2">
              {getNodeTypeInfo(selectedNode.type)?.name}
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              {getNodeTypeInfo(selectedNode.type)?.description}
            </p>
          </div>
          
          {/* Connection Status */}
          <div>
            <h4 className="font-medium mb-2 text-white">Connections</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Input:</span>
                <span className="text-blue-400">
                  {connections.find(c => c.targetId === selectedNode.id) ? 'Connected' : 'None'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Outputs:</span>
                <span className="text-green-400">
                  {connections.filter(c => c.sourceId === selectedNode.id).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Node-specific properties */}
      <div className="flex-1 overflow-y-auto">
        <NodeProperties 
          key={selectedNode.id} // Force remount when node changes
          node={selectedNode} 
          onUpdate={handleUpdate}
          apiKeys={apiKeys}
        />
      </div>
    </div>
  );
}