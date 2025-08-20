import React, { useState, useEffect, useRef } from 'react';
import { Zap, Terminal } from 'lucide-react';
import { Node, Connection } from './types/NodeTypes';
import { nodeTypes, categories } from './data/nodeTypes';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import WorkflowCanvas from './components/WorkflowCanvas';
import PropertiesPanel from './components/PropertiesPanel';
import Settings from './components/Settings';
import Console from './components/Console';
import HomePage from './components/HomePage';
import WorkflowTemplates from './components/WorkflowTemplates';
import SavedWorkflows from './components/SavedWorkflows';
import CharacterProfiles from './components/CharacterProfiles';
import WorkflowExecutor from './components/WorkflowExecutor';
import { logger } from './utils/logging';
import { normalizeWorkflow, normalizeNode, loadSavedWorkflows, upsertSavedWorkflow, seedWorkflowIfMissing, dedupeConnections, addConnectionSafe } from './utils/workflow';
import enhancedWorkflowJson from '../workflow-1-enhanced-ai-content.json';

// Error Boundary Component
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setHasError(true);
      setError(new Error(event.message));
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      setHasError(true);
      setError(new Error(event.reason));
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="max-w-md p-6 bg-red-500/10 border border-red-500/20 rounded-lg">
          <h2 className="text-lg font-semibold text-red-400 mb-2">Something went wrong</h2>
          <p className="text-sm text-gray-300 mb-4">
            An error occurred while rendering the application.
          </p>
          <pre className="text-xs text-gray-400 bg-black/20 p-2 rounded overflow-auto max-h-32">
            {error?.stack || error?.message || 'Unknown error'}
          </pre>
          <button
            onClick={() => {
              setHasError(false);
              setError(null);
              window.location.reload();
            }}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Reload Application
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'workflow' | 'templates' | 'characters' | 'saved'>(() => {
    const saved = localStorage.getItem('vidforge_current_view');
    return saved || 'home';
  });
  const [nodes, setNodes] = useState<Node[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState('all');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [isCharacterProfilesOpen, setIsCharacterProfilesOpen] = useState(false);
  const [selectedCharacterProfile, setSelectedCharacterProfile] = useState<any>(null);
  
  // Workflow execution state
  const [isWorkflowRunning, setIsWorkflowRunning] = useState(false);
  const [currentExecutingNode, setCurrentExecutingNode] = useState<string | null>(null);
  const [executionResults, setExecutionResults] = useState<Map<string, any>>(new Map());
  const [executionStartTimes, setExecutionStartTimes] = useState<Map<string, Date>>(new Map());
  const [cycleNodes, setCycleNodes] = useState<Set<string>>(new Set());
  
  // Connection state
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState<{ nodeId: string; x: number; y: number } | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // Drag state
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // API Keys
  const [apiKeys, setApiKeys] = useState(() => ({
    openai: localStorage.getItem('openai_key') || '',
    youtube: localStorage.getItem('youtube_key') || '',
    elevenlabs: localStorage.getItem('elevenlabs_key') || '',
    hedra: localStorage.getItem('hedra_key') || ''
  }));
  
  // Visual Theme
  const [visualTheme, setVisualTheme] = useState(() => {
    const saved = localStorage.getItem('vidforge_visual_theme');
    return saved ? JSON.parse(saved) : {
      nodeStyle: 'glass',
      nodeOpacity: 0.8,
      glassBlur: 16,
      glassBorder: 0.1,
      glassReflection: 0.05,
      borderRadius: 16,
      refractionStrength: 0.3,
      glowIntensity: 0.2,
      shadowDepth: 0.6,
      crystalFacets: false,
      prismEffect: false,
      iridescence: false,
      holographicShift: false,
      background: 'default',
      gridPattern: 'dots',
      animations: {
        enabled: true,
        hoverLift: true,
        pulseOnExecution: true,
        connectionFlow: true,
        particleTrails: false,
        breathingEffect: false,
        morphingShapes: false
      }
    };
  });

  // Saved workflows
  const [savedWorkflows, setSavedWorkflows] = useState(() => loadSavedWorkflows());

  // Persist current view
  useEffect(() => {
    localStorage.setItem('vidforge_current_view', currentView);
  }, [currentView]);

  // Seed the enhanced workflow once
  useEffect(() => {
    try {
      if (enhancedWorkflowJson && enhancedWorkflowJson.nodes && enhancedWorkflowJson.connections) {
        seedWorkflowIfMissing('Enhanced AI Content Creation Workflow #1', enhancedWorkflowJson);
        setSavedWorkflows(loadSavedWorkflows()); // refresh list in the UI
        logger.info('workflow', 'Seeded enhanced workflow into saved workflows');
      }
    } catch (e) {
      logger.warn('workflow', `Could not seed enhanced workflow: ${(e as Error)?.message}`);
    }
  }, []);

  // Auto-save workflow
  useEffect(() => {
    if (nodes.length > 0) {
      const workflowData = { 
        nodes, 
        connections,
        apiKeys,
        visualTheme,
        metadata: {
          version: '2.0',
          nodeCount: nodes.length,
          connectionCount: connections.length,
          lastModified: Date.now(),
          executionResults: Object.fromEntries(executionResults),
          selectedNodeId: selectedNode?.id,
          autoSaved: true
        }
      };
      localStorage.setItem('vidforge_current_workflow', JSON.stringify(workflowData));
      logger.debug('workflow', `Auto-saved complete workflow with ${nodes.length} nodes, ${connections.length} connections, and full configuration`);
    }
  }, [nodes, connections, apiKeys, visualTheme, executionResults, selectedNode]);

  // Load saved workflow on startup
  useEffect(() => {
    const saved = localStorage.getItem('vidforge_current_workflow');
    if (saved) {
      try {
        const workflowData = JSON.parse(saved);
        const normalized = normalizeWorkflow(workflowData);
        
        // Clean up duplicate connections
        const cleanedConnections = dedupeConnections(normalized.connections);
        setNodes(normalized.nodes);
        setConnections(cleanedConnections);
        
        // Save cleaned workflow back to storage
        if (cleanedConnections.length !== normalized.connections.length) {
          const cleanedWorkflow = { ...workflowData, connections: cleanedConnections };
          localStorage.setItem('vidforge_current_workflow', JSON.stringify(cleanedWorkflow));
          logger.info('workflow', `Cleaned ${normalized.connections.length - cleanedConnections.length} duplicate connections`);
        }
        
        // If we have nodes, automatically go to workflow view
        if (normalized.nodes.length > 0) {
          setCurrentView('workflow');
        }
        
        // Restore API keys if present
        if (workflowData.apiKeys) {
          setApiKeys(workflowData.apiKeys);
          Object.entries(workflowData.apiKeys).forEach(([key, value]) => {
            if (value) {
              localStorage.setItem(`${key}_key`, value as string);
            }
          });
          logger.info('config', 'Restored API keys from workflow');
        }
        
        // Restore visual theme if present
        if (workflowData.visualTheme) {
          setVisualTheme(workflowData.visualTheme);
          localStorage.setItem('vidforge_visual_theme', JSON.stringify(workflowData.visualTheme));
          logger.info('config', 'Restored visual theme from workflow');
        }
        
        // Restore execution results if present
        if (workflowData.metadata?.executionResults) {
          const restoredResults = new Map(Object.entries(workflowData.metadata.executionResults));
          setExecutionResults(restoredResults);
          logger.info('workflow', 'Restored execution results from workflow');
        }
        
        // Restore selected node if present
        if (workflowData.metadata?.selectedNodeId) {
          const nodeToSelect = normalized.nodes.find(n => n.id === workflowData.metadata.selectedNodeId);
          if (nodeToSelect) {
            setSelectedNode(nodeToSelect);
          }
        }
        
        logger.info('workflow', `Loaded saved workflow with ${normalized.nodes.length} nodes and full configuration`);
      } catch (error) {
        logger.error('workflow', `Failed to load saved workflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }, []);

  // Update preview nodes when source nodes change
  useEffect(() => {
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    
    // Update preview nodes with data from their connected source nodes
    const updatedNodes = nodes.map(node => {
      if (node.type === 'image-preview-node' || node.type === 'audio-preview-node' || 
          node.type === 'video-preview-node' || node.type === 'text-preview-node') {
        const inputConnection = connections.find(conn => conn.targetId === node.id);
        if (inputConnection) {
          const sourceNode = nodeMap.get(inputConnection.sourceId);
          const sourceResult = sourceNode?.data?.lastResult;
          
          if (sourceResult && sourceResult !== node.data?.lastResult) {
            return normalizeNode({
              ...node,
              data: {
                ...node.data,
                lastResult: sourceResult
              }
            });
          }
        }
      }
      return node;
    });
    
    // Only update if there are actual changes
    const hasChanges = updatedNodes.some((node, index) => 
      node.data?.lastResult !== nodes[index].data?.lastResult
    );
    
    if (hasChanges) {
      setNodes(updatedNodes);
    }
  }, [nodes, connections]);

  // Workflow executor
  const workflowExecutor = WorkflowExecutor({
    nodes,
    connections,
    apiKeys,
    onNodeUpdate: (nodeId: string, data: any) => {
      setNodes(prev => prev.map(node => 
        node.id === nodeId 
          ? normalizeNode({ ...node, data: { ...node.data, ...data } })
          : node
      ));
    },
    onExecutionUpdate: (status: string, nodeId?: string, result?: any) => {
      if (status === 'executing') {
        setCurrentExecutingNode(nodeId || null);
        setIsWorkflowRunning(true);
      } else if (status === 'completed') {
        if (result && nodeId) {
          setExecutionResults(prev => new Map(prev.set(nodeId, result)));
        }
      } else if (status === 'finished' || status === 'failed' || status === 'stopped') {
        setIsWorkflowRunning(false);
        setCurrentExecutingNode(null);
      } else if (status === 'cycle_detected') {
        if (result?.cyclePath) {
          setCycleNodes(new Set(result.cyclePath));
        }
      }
    }
  });

  // Mouse event handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      
      if (draggedNode) {
        setNodes(prev => prev.map(node => 
          node.id === draggedNode 
            ? normalizeNode({
                ...node,
                position: {
                  x: e.clientX - dragOffset.x,
                  y: e.clientY - dragOffset.y
                }
              })
            : node
        ));
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (isConnecting) {
        const target = e.target as HTMLElement;
        const portElement = target.closest('[data-port-type="input"]');
        
        if (portElement && connectionStart) {
          const targetNodeId = portElement.getAttribute('data-node-id');
          const targetPortIndex = parseInt(portElement.getAttribute('data-port-index') || '0');
          
          if (targetNodeId && targetNodeId !== connectionStart.nodeId) {
            const newConnection: Connection = {
              id: `conn-${Date.now()}`,
              sourceId: connectionStart.nodeId,
              targetId: targetNodeId,
              sourcePort: 0,
              targetPort: targetPortIndex
            };
            
            setConnections(prev => addConnectionSafe(prev, newConnection));
            logger.info('workflow', `Created connection: ${connectionStart.nodeId} → ${targetNodeId}`);
          }
        }
        
        setIsConnecting(false);
        setConnectionStart(null);
      }
      
      if (draggedNode) {
        setDraggedNode(null);
        setDragOffset({ x: 0, y: 0 });
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isConnecting, connectionStart, draggedNode, dragOffset]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    try {
      const nodeTypeData = e.dataTransfer.getData('application/json');
      
      // Check if nodeTypeData is empty or invalid before parsing
      if (!nodeTypeData || nodeTypeData.trim() === '') {
        throw new Error('No node data found in drag event');
      }
      
      const nodeType = JSON.parse(nodeTypeData);
      
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const newNode: Node = normalizeNode({
        id: `${nodeType.id}-${Date.now()}`,
        type: nodeType.id,
        position: { x: x - 100, y: y - 50 },
        data: {}
      });
      
      setNodes(prev => [...prev, newNode]);
      logger.info('workflow', `Added ${nodeType.name} node to canvas`);
    } catch (error) {
      logger.error('workflow', `Failed to add node: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleNodeSelect = (node: Node | null) => {
    setSelectedNode(node);
    if (node) {
      logger.debug('workflow', `Selected ${node.type} node`, node.id);
    }
  };

  const handleToggleNodeSelection = (nodeId: string, ctrlKey: boolean) => {
    if (ctrlKey) {
      setSelectedNodes(prev => {
        const newSet = new Set(prev);
        if (newSet.has(nodeId)) {
          newSet.delete(nodeId);
        } else {
          newSet.add(nodeId);
        }
        return newSet;
      });
    } else {
      setSelectedNodes(new Set([nodeId]));
    }
  };

  const handleNodeDelete = (nodeId: string) => {
    setNodes(prev => prev.filter(node => node.id !== nodeId));
    setConnections(prev => prev.filter(conn => 
      conn.sourceId !== nodeId && conn.targetId !== nodeId
    ));
    
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
    
    setSelectedNodes(prev => {
      const newSet = new Set(prev);
      newSet.delete(nodeId);
      return newSet;
    });
    
    logger.info('workflow', `Deleted node: ${nodeId}`);
  };

  const handleConnectionDelete = (connectionId: string) => {
    setConnections(prev => prev.filter(conn => conn.id !== connectionId));
    logger.info('workflow', `Deleted connection: ${connectionId}`);
  };

  const handleStartConnection = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    setIsConnecting(true);
    setConnectionStart({
      nodeId,
      x: e.clientX,
      y: e.clientY
    });
    
    logger.debug('workflow', `Started connection from node: ${nodeId}`);
  };

  const handleStartNodeDrag = (nodeId: string, e: React.MouseEvent) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    setDraggedNode(nodeId);
    setDragOffset({
      x: e.clientX - node.position.x,
      y: e.clientY - node.position.y
    });
    
    logger.debug('workflow', `Started dragging node: ${nodeId}`);
  };

  const handleNodeUpdate = (nodeId: string, data: any) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId 
        ? normalizeNode({ ...node, data: { ...node.data, ...data } })
        : node
    ));
  };

  const handleApiKeysUpdate = (keys: any) => {
    setApiKeys(keys);
    Object.entries(keys).forEach(([key, value]) => {
      if (value) {
        localStorage.setItem(`${key}_key`, value as string);
      }
    });
    logger.info('config', 'API keys updated');
  };

  const handleVisualThemeUpdate = (theme: any) => {
    setVisualTheme(theme);
    localStorage.setItem('vidforge_visual_theme', JSON.stringify(theme));
    logger.info('config', 'Visual theme updated');
  };

  const handleSaveWorkflow = () => {
    const workflowData = {
      name: `Workflow ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
      nodes,
      connections,
      savedAt: Date.now(),
      apiKeys,
      visualTheme,
      metadata: {
        version: '2.0',
        nodeCount: nodes.length,
        connectionCount: connections.length,
        lastModified: Date.now(),
        executionResults: Object.fromEntries(executionResults),
        selectedNodeId: selectedNode?.id
      }
    };
    
    const blob = new Blob([JSON.stringify(workflowData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vidforge-workflow-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    logger.info('workflow', 'Workflow exported');
  };

  const handleLoadWorkflow = (workflowData?: any) => {
    if (workflowData) {
      const normalized = normalizeWorkflow(workflowData);
      
      // Clean up duplicate connections
      const cleanedConnections = dedupeConnections(normalized.connections);
      setNodes(normalized.nodes);
      setConnections(cleanedConnections);
      
      // Restore API keys if present
      if (workflowData.apiKeys) {
        setApiKeys(workflowData.apiKeys);
        Object.entries(workflowData.apiKeys).forEach(([key, value]) => {
          if (value) {
            localStorage.setItem(`${key}_key`, value as string);
          }
        });
        logger.info('config', 'Restored API keys from workflow');
      }
      
      // Restore visual theme if present
      if (workflowData.visualTheme) {
        setVisualTheme(workflowData.visualTheme);
        localStorage.setItem('vidforge_visual_theme', JSON.stringify(workflowData.visualTheme));
        logger.info('config', 'Restored visual theme from workflow');
      }
      
      // Restore execution results if present
      if (workflowData.metadata?.executionResults) {
        const restoredResults = new Map(Object.entries(workflowData.metadata.executionResults));
        setExecutionResults(restoredResults);
        logger.info('workflow', 'Restored execution results from workflow');
      }
      
      // Restore selected node if present
      if (workflowData.metadata?.selectedNodeId) {
        const nodeToSelect = normalized.nodes.find(n => n.id === workflowData.metadata.selectedNodeId);
        if (nodeToSelect) {
          setSelectedNode(nodeToSelect);
        }
      }
      
      setCurrentView('workflow');
      logger.info('workflow', `Loaded workflow: ${workflowData.name || 'Unnamed'}`);
    }
  };

  const handleNewWorkflow = () => {
    // Only clear workflow data, don't change view if we're already in workflow view
    setNodes([]);
    setConnections([]);
    setSelectedNode(null);
    setSelectedNodes(new Set());
    setExecutionResults(new Map());
    setExecutionStartTimes(new Map());
    setCycleNodes(new Set());
    
    // Clear the saved workflow
    localStorage.removeItem('vidforge_current_workflow');
    
    // Only change view if we're not already in workflow view
    if (currentView !== 'workflow') {
      setCurrentView('workflow');
    }
    logger.info('workflow', 'Created new workflow');
  };

  const handleGoHome = () => {
    setCurrentView('home');
  };

  const handleLoadRecent = (workflow: any) => {
    const normalized = normalizeWorkflow(workflow);
    
    // Clean up duplicate connections
    const cleanedConnections = dedupeConnections(normalized.connections);
    setNodes(normalized.nodes);
    setConnections(cleanedConnections);
    
    // Restore all workflow state
    if (workflow.apiKeys) {
      setApiKeys(workflow.apiKeys);
    }
    if (workflow.visualTheme) {
      setVisualTheme(workflow.visualTheme);
    }
    if (workflow.metadata?.executionResults) {
      const restoredResults = new Map(Object.entries(workflow.metadata.executionResults));
      setExecutionResults(restoredResults);
    }
    
    setCurrentView('workflow');
    logger.info('workflow', `Loaded recent workflow: ${workflow.name}`);
  };

  const handleLoadTemplate = (template: any) => {
    const normalized = normalizeWorkflow(template);
    
    // Clean up duplicate connections
    const cleanedConnections = dedupeConnections(normalized.connections);
    setNodes(normalized.nodes);
    setConnections(cleanedConnections);
    
    // Clear execution state for fresh template
    setExecutionResults(new Map());
    setExecutionStartTimes(new Map());
    setCycleNodes(new Set());
    
    setCurrentView('workflow');
    logger.info('workflow', `Loaded template: ${template.name}`);
  };

  const handleSaveToSaved = (name: string) => {
    const normalized = normalizeWorkflow({ nodes, connections });
    upsertSavedWorkflow({
      id: `wf-${Date.now()}`,
      name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      graph: normalized,
      apiKeys,
      visualTheme,
      metadata: {
        version: '2.0',
        nodeCount: nodes.length,
        connectionCount: connections.length,
        lastModified: Date.now(),
        executionResults: Object.fromEntries(executionResults),
        selectedNodeId: selectedNode?.id
      }
    });
    setSavedWorkflows(loadSavedWorkflows());
    logger.info('workflow', `Saved workflow: ${name}`);
  };

  if (currentView === 'home') {
    return (
      <ErrorBoundary>
        <HomePage
          onCreateNew={handleNewWorkflow}
          onOpenTemplates={() => setCurrentView('templates')}
          onOpenSaved={() => {
            // Load the enhanced workflow directly
            const enhanced = savedWorkflows.find(w => w.name === 'Enhanced AI Content Creation Workflow #1');
            if (enhanced) {
              handleLoadWorkflow(enhanced.graph);
            } else {
              setCurrentView('workflow');
            }
          }}
          recentWorkflows={savedWorkflows.slice(0, 4)}
          onLoadRecent={handleLoadRecent}
        />
      </ErrorBoundary>
    );
  }

  if (currentView === 'templates') {
    return (
      <ErrorBoundary>
        <WorkflowTemplates
          onLoadTemplate={handleLoadTemplate}
          onBack={handleGoHome}
        />
      </ErrorBoundary>
    );
  }

  if (currentView === 'saved') {
    return (
      <ErrorBoundary>
        <SavedWorkflows
          savedWorkflows={savedWorkflows}
          onLoadWorkflow={handleLoadWorkflow}
          onBack={handleGoHome}
          onDeleteWorkflow={(workflowId) => {
            const updated = savedWorkflows.filter(w => w.id !== workflowId);
            saveSavedWorkflows(updated);
            setSavedWorkflows(updated);
          }}
        />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
        <Header
          onStartWorkflow={workflowExecutor.startWorkflow}
          onSave={handleSaveWorkflow}
          onLoad={handleLoadWorkflow}
          onNewWorkflow={handleNewWorkflow}
          onGoHome={handleGoHome}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
        
        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            nodeTypes={nodeTypes}
            activeCategory={activeCategory}
            categories={categories}
            nodes={nodes}
            connections={connections}
            onCategoryChange={setActiveCategory}
            onDragStart={(e, nodeType) => {
              const nodeData = JSON.stringify(nodeType);
              e.dataTransfer.setData('application/json', nodeData);
              e.dataTransfer.effectAllowed = 'copy';
            }}
          />
          
          <WorkflowCanvas
            nodes={nodes}
            connections={connections}
            selectedNode={selectedNode}
            selectedNodes={selectedNodes}
            onToggleNodeSelection={handleToggleNodeSelection}
            currentExecutingNode={currentExecutingNode}
            executionResults={executionResults}
            executionStartTimes={executionStartTimes}
            cycleNodes={cycleNodes}
            isConnecting={isConnecting}
            connectionStart={connectionStart}
            mousePosition={mousePosition}
            draggedNode={draggedNode}
            dragOffset={dragOffset}
            visualTheme={visualTheme}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onNodeSelect={handleNodeSelect}
            onNodeDelete={handleNodeDelete}
            onConnectionDelete={handleConnectionDelete}
            onStartConnection={handleStartConnection}
            onStartNodeDrag={handleStartNodeDrag}
            onMouseMove={() => {}}
            onMouseUp={() => {}}
          />
          
          <PropertiesPanel
            selectedNode={selectedNode}
            connections={connections}
            onNodeUpdate={handleNodeUpdate}
            apiKeys={apiKeys}
          />
        </div>
        
        {/* Settings Modal */}
        <Settings
          isVisible={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          apiKeys={apiKeys}
          onApiKeysUpdate={handleApiKeysUpdate}
          visualTheme={visualTheme}
          onVisualThemeUpdate={handleVisualThemeUpdate}
        />
        
        {/* Character Profiles Modal */}
        <CharacterProfiles
          isVisible={isCharacterProfilesOpen}
          onClose={() => setIsCharacterProfilesOpen(false)}
          onProfileSelect={setSelectedCharacterProfile}
          selectedProfileId={selectedCharacterProfile?.id}
        />
        
        {/* Console */}
        <Console
          isVisible={isConsoleOpen}
          onToggle={() => setIsConsoleOpen(!isConsoleOpen)}
        />
        
        {/* Console Toggle Button */}
        <button
          onClick={() => setIsConsoleOpen(!isConsoleOpen)}
          className="fixed bottom-4 right-4 p-3 bg-amber-500 text-black rounded-full shadow-lg hover:bg-amber-400 transition-colors z-30"
          title="Toggle Console"
        >
          <Terminal className="w-5 h-5" />
        </button>
      </div>
    </ErrorBoundary>
  );
}