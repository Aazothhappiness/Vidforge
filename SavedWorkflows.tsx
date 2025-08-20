import React, { useState } from 'react';
import { 
  ArrowLeft, FolderOpen, Trash2, Download, Upload, Search, 
  Calendar, Layers, GitBranch, Eye, Play, Clock, Star
} from 'lucide-react';

interface SavedWorkflow {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  graph: {
    nodes: any[];
    connections: any[];
  };
}

interface SavedWorkflowsProps {
  savedWorkflows: SavedWorkflow[];
  onLoadWorkflow: (workflow: any) => void;
  onBack: () => void;
  onDeleteWorkflow: (workflowId: string) => void;
}

export default function SavedWorkflows({ 
  savedWorkflows, 
  onLoadWorkflow, 
  onBack, 
  onDeleteWorkflow 
}: SavedWorkflowsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'updated' | 'created'>('updated');
  const [selectedWorkflow, setSelectedWorkflow] = useState<SavedWorkflow | null>(null);

  const filteredWorkflows = savedWorkflows
    .filter(workflow => 
      workflow.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'updated':
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });

  const handleLoadWorkflow = (workflow: SavedWorkflow) => {
    // Pass the complete workflow data including configurations
    onLoadWorkflow({
      ...workflow.graph,
      apiKeys: workflow.apiKeys,
      visualTheme: workflow.visualTheme,
      metadata: workflow.metadata,
      name: workflow.name
    });
  };

  const handleDeleteWorkflow = (workflow: SavedWorkflow, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete "${workflow.name}"?`)) {
      onDeleteWorkflow(workflow.id);
    }
  };

  const exportWorkflow = (workflow: SavedWorkflow, e: React.MouseEvent) => {
    e.stopPropagation();
    const exportData = {
      name: workflow.name,
      ...workflow.graph,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflow.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <div className="glass-strong border-b border-white/10 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 px-4 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Home</span>
              </button>
              <div>
                <h1 className="text-2xl font-bold">Saved Workflows</h1>
                <p className="text-gray-400">Manage your saved workflow projects</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-400">
                {filteredWorkflows.length} of {savedWorkflows.length} workflows
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Search and Filter */}
        <div className="mb-8 flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search workflows..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-amber-500"
            />
          </div>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-amber-500"
          >
            <option value="updated">Sort by Updated</option>
            <option value="created">Sort by Created</option>
            <option value="name">Sort by Name</option>
          </select>
        </div>

        {/* Workflows Grid */}
        {filteredWorkflows.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkflows.map(workflow => (
              <div
                key={workflow.id}
                className="group bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all transform hover:scale-105 cursor-pointer"
                onClick={() => setSelectedWorkflow(workflow)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-amber-400 transition-colors">
                      {workflow.name}
                    </h3>
                    <div className="text-sm text-gray-400 space-y-1">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-3 h-3" />
                        <span>Updated {formatDate(workflow.updatedAt)}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Layers className="w-3 h-3" />
                          <span>{workflow.graph.nodes?.length || 0} nodes</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <GitBranch className="w-3 h-3" />
                          <span>{workflow.graph.connections?.length || 0} connections</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {workflow.name.includes('Enhanced') && (
                    <Star className="w-5 h-5 text-amber-400 fill-current" />
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLoadWorkflow(workflow);
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-black rounded-lg font-medium hover:from-amber-400 hover:to-orange-400 transition-all"
                  >
                    <Play className="w-4 h-4" />
                    <span>Load</span>
                  </button>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => setSelectedWorkflow(workflow)}
                      className="p-2 bg-blue-500/20 border border-blue-500/30 rounded text-blue-400 hover:bg-blue-500/30 transition-colors"
                      title="Preview workflow"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => exportWorkflow(workflow, e)}
                      className="p-2 bg-green-500/20 border border-green-500/30 rounded text-green-400 hover:bg-green-500/30 transition-colors"
                      title="Export workflow"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteWorkflow(workflow, e)}
                      className="p-2 bg-red-500/20 border border-red-500/30 rounded text-red-400 hover:bg-red-500/30 transition-colors"
                      title="Delete workflow"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <FolderOpen className="w-16 h-16 mx-auto mb-4 text-gray-500 opacity-50" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">
              {searchTerm ? 'No workflows found' : 'No saved workflows'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm 
                ? 'Try adjusting your search terms' 
                : 'Create and save workflows to see them here'
              }
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="px-4 py-2 bg-amber-500 text-black rounded-lg font-medium hover:bg-amber-400 transition-colors"
              >
                Clear Search
              </button>
            )}
          </div>
        )}
      </div>

      {/* Workflow Detail Modal */}
      {selectedWorkflow && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-slate-900 rounded-xl border border-white/10 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedWorkflow.name}</h2>
                  <p className="text-gray-400">Created {formatDate(selectedWorkflow.createdAt)}</p>
                </div>
                <button
                  onClick={() => setSelectedWorkflow(null)}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Workflow Info */}
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Workflow Details</h3>
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Nodes:</span>
                          <span className="text-white ml-2">{selectedWorkflow.graph.nodes?.length || 0}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Connections:</span>
                          <span className="text-white ml-2">{selectedWorkflow.graph.connections?.length || 0}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Created:</span>
                          <span className="text-white ml-2">{formatDate(selectedWorkflow.createdAt)}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Updated:</span>
                          <span className="text-white ml-2">{formatDate(selectedWorkflow.updatedAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Included Nodes</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {(selectedWorkflow.graph.nodes || []).map((node: any, index: number) => (
                        <div key={index} className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                          <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                          <span className="text-white font-medium">
                            {node.type?.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Unknown Node'}
                          </span>
                          <span className="text-xs text-gray-400">({node.id})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-4">
                  <div className="bg-white/5 rounded-lg p-4">
                    <h3 className="font-semibold text-white mb-3">Quick Stats</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Nodes:</span>
                        <span className="text-white">{selectedWorkflow.graph.nodes?.length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Connections:</span>
                        <span className="text-white">{selectedWorkflow.graph.connections?.length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Complexity:</span>
                        <span className="text-white">
                          {(selectedWorkflow.graph.nodes?.length || 0) > 15 ? 'High' : 
                           (selectedWorkflow.graph.nodes?.length || 0) > 8 ? 'Medium' : 'Low'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={() => handleLoadWorkflow(selectedWorkflow)}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-black rounded-lg font-medium hover:from-amber-400 hover:to-orange-400 transition-all"
                    >
                      <Play className="w-4 h-4" />
                      <span>Load Workflow</span>
                    </button>

                    <button
                      onClick={(e) => exportWorkflow(selectedWorkflow, e)}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export Workflow</span>
                    </button>

                    <button
                      onClick={(e) => handleDeleteWorkflow(selectedWorkflow, e)}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/30 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Workflow</span>
                    </button>
                  </div>

                  <div className="text-xs text-gray-400 bg-blue-500/10 p-3 rounded border border-blue-500/20">
                    <div className="font-medium text-blue-400 mb-2">Tips</div>
                    <ul className="space-y-1">
                      <li>• Click "Load Workflow" to open in the editor</li>
                      <li>• Export workflows to share with others</li>
                      <li>• Workflows are automatically saved as you work</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}