// src/utils/workflow.ts
export type PortCount = { inputPorts: number; outputPorts: number };

export type NormalizedNodeData = {
  inputPorts: number;
  outputPorts: number;
  lastResult: any | null;
  // You can keep expanding this with safe defaults you rely on elsewhere:
  // e.g., nodeConfigurationsApplied?: boolean
  //       persisted?: boolean
};

export function defaultNodeData(portCounts?: Partial<PortCount>): NormalizedNodeData {
  const inputs = Math.max(1, portCounts?.inputPorts ?? 1);
  const outputs = Math.max(1, portCounts?.outputPorts ?? 1);
  return {
    inputPorts: inputs,
    outputPorts: outputs,
    lastResult: null,
  };
}

/**
 * Ensure every node has a .data object and required fields, but NEVER remove unknown fields.
 * Use this whenever you load/import/seed a workflow or when pasting nodes.
 */
export function normalizeNode<T extends { id: string; type: string; data?: any }>(
  node: T,
  fallbackPorts?: Partial<PortCount>
): T & { data: NormalizedNodeData & Record<string, any> } {
  // Preserve ALL existing data, including custom fields, uploaded files, etc.
  const data = { ...(node.data ?? {}) };
  
  // Special port handling for specific node types
  let defaultInputs = fallbackPorts?.inputPorts ?? 1;
  let defaultOutputs = fallbackPorts?.outputPorts ?? 1;
  
  if (node.type === 'yes-no-node' || node.type === 'judgment-node') {
    defaultOutputs = 2; // Always 2 outputs (YES/NO)
  } else if (node.type === 'file-input-node') {
    defaultInputs = 0; // File input nodes have no inputs
    defaultOutputs = 2; // Always 2 outputs (script/prompts)
  } else if (node.type === 'decision-node') {
    defaultInputs = 2; // Always 2 inputs for YES/NO
    defaultOutputs = data.outputPorts ?? 2; // Default 2 outputs, configurable
  } else if (node.type === 'image-sequential-node') {
    defaultInputs = 1; // Takes script/content input
    defaultOutputs = 1; // Outputs structured image items
  } else if (node.type === 'image-preview-node' || node.type === 'audio-preview-node' || 
             node.type === 'video-preview-node' || node.type === 'text-preview-node') {
    defaultOutputs = 0; // Preview nodes have no outputs
  }
  
  // Only set defaults for missing fields, preserve all existing data
  const normalized = {
    ...data, // Preserve ALL existing data first
    inputPorts: typeof data.inputPorts === 'number' ? data.inputPorts : defaultInputs,
    outputPorts: typeof data.outputPorts === 'number' ? data.outputPorts : defaultOutputs,
    lastResult: data.lastResult ?? null,
  };
  
  return { ...node, data: normalized };
}

/**
 * Normalize an entire workflow graph in one pass.
 */
export function normalizeWorkflow(
  wf: { nodes: any[]; connections?: any[]; edges?: any[] },
  fallbackPorts?: Partial<PortCount>
) {
  const nodes = (wf.nodes ?? []).map((n) => normalizeNode(n, fallbackPorts));
  const connections = Array.isArray(wf.connections) ? wf.connections : Array.isArray(wf.edges) ? wf.edges : [];
  return { ...wf, nodes, connections };
}

/**
 * Saved workflows store/load helpers
 */
const STORE_KEY = 'vidforge.savedWorkflows';

export type SavedWorkflow = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  graph: { nodes: any[]; connections: any[] };
  apiKeys?: any;
  visualTheme?: any;
  metadata?: {
    version?: string;
    nodeCount?: number;
    connectionCount?: number;
    lastModified?: number;
    executionResults?: Record<string, any>;
    selectedNodeId?: string;
    autoSaved?: boolean;
  };
};

export function loadSavedWorkflows(): SavedWorkflow[] {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    return list;
  } catch {
    return [];
  }
}

export function saveSavedWorkflows(list: SavedWorkflow[]) {
  localStorage.setItem(STORE_KEY, JSON.stringify(list));
}

export function upsertSavedWorkflow(entry: SavedWorkflow) {
  const list = loadSavedWorkflows();
  const idx = list.findIndex((w) => w.id === entry.id || w.name === entry.name);
  if (idx >= 0) {
    list[idx] = { ...entry, updatedAt: new Date().toISOString() };
  } else {
    list.unshift(entry);
  }
  saveSavedWorkflows(list);
}

/**
 * Seed a workflow if it's not already present by name.
 */
export function seedWorkflowIfMissing(name: string, graph: { nodes: any[]; connections?: any[]; edges?: any[] }) {
  const list = loadSavedWorkflows();
  const exists = list.some((w) => w.name === name);
  if (exists) return;

  const normalized = normalizeWorkflow(graph);
  upsertSavedWorkflow({
    id: `seed-${Date.now()}`,
    name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    graph: normalized,
  });
}

/**
 * Remove duplicate connections based on source/target nodes and ports
 */
export function dedupeConnections(connections: any[]): any[] {
  const seen = new Set<string>();
  const out: any[] = [];

  for (const c of connections) {
    const sPort = c.sourcePortId ?? String(c.sourcePort ?? 0);
    const tPort = c.targetPortId ?? String(c.targetPort ?? 0);
    const key = [c.sourceId, sPort, c.targetId, tPort].join('|');
    
    if (seen.has(key)) {
      console.log('Removing duplicate connection:', { 
        id: c.id, 
        from: c.sourceId, 
        to: c.targetId, 
        sourcePort: sPort, 
        targetPort: tPort 
      });
      continue;
    }
    
    seen.add(key);
    out.push(c);
  }
  
  return out;
}

/**
 * Safely add a connection, preventing duplicates
 */
export function addConnectionSafe(connections: any[], newConnection: any): any[] {
  const sPort = newConnection.sourcePortId ?? String(newConnection.sourcePort ?? 0);
  const tPort = newConnection.targetPortId ?? String(newConnection.targetPort ?? 0);

  const exists = connections.some(c => {
    const cSPort = c.sourcePortId ?? String(c.sourcePort ?? 0);
    const cTPort = c.targetPortId ?? String(c.targetPort ?? 0);
    return c.sourceId === newConnection.sourceId &&
           c.targetId === newConnection.targetId &&
           cSPort === sPort &&
           cTPort === tPort;
  });

  if (exists) {
    console.log('Connection already exists, not adding duplicate:', {
      from: newConnection.sourceId,
      to: newConnection.targetId,
      sourcePort: sPort,
      targetPort: tPort
    });
    return connections; // no-op
  }

  return [...connections, { 
    id: newConnection.id ?? `conn-${Date.now()}`, 
    ...newConnection 
  }];
}