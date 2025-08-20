import React from 'react';
import { Plus } from 'lucide-react';
import { NodeType } from '../types/NodeTypes';

interface SidebarProps {
  nodeTypes: NodeType[];
  activeCategory: string;
  categories: Array<{ id: string; name: string }>;
  nodes: any[];
  connections: any[];
  onCategoryChange: (category: string) => void;
  onDragStart: (e: React.DragEvent, nodeType: NodeType) => void;
}

export default function Sidebar({ 
  nodeTypes, 
  activeCategory, 
  categories, 
  nodes, 
  connections, 
  onCategoryChange, 
  onDragStart 
}: SidebarProps) {
  const filteredNodeTypes = activeCategory === 'all' 
    ? nodeTypes 
    : nodeTypes.filter(type => type.category === activeCategory);

  const handleDragStart = (e: React.DragEvent, nodeType: NodeType) => {
    const nodeData = JSON.stringify(nodeType);
    e.dataTransfer.setData('application/json', nodeData);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="w-80 glass-strong border-r border-white/10 flex flex-col mt-20">
      <div className="p-6 border-b border-white/10">
        <h2 className="text-lg font-semibold mb-4">Node Library</h2>
        
        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={`px-3 py-1 rounded-full text-sm transition-all ${
                activeCategory === category.id
                  ? 'bg-amber-500 text-black font-medium'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>
      
      {/* Node List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredNodeTypes.map(nodeType => {
          const Icon = nodeType.icon;
          return (
            <div
              key={nodeType.id}
              draggable
              onDragStart={(e) => handleDragStart(e, nodeType)}
              className="node-card p-4 cursor-grab active:cursor-grabbing group"
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg bg-gradient-to-r ${nodeType.color}`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-white">{nodeType.name}</h3>
                  <p className="text-sm text-gray-400">{nodeType.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Workflow Stats */}
      <div className="p-4 border-t border-white/10">
        <h3 className="font-medium mb-2">Workflow Stats</h3>
        <div className="space-y-1 text-sm text-gray-400">
          <div className="flex justify-between">
            <span>Total Nodes:</span>
            <span className="text-white">{nodes.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Connections:</span>
            <span className="text-white">{connections.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}