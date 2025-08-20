// VidForge - Deterministic DAG execution engine with cycle detection
import { Node, Connection } from '../types/NodeTypes';
import { logger } from '../utils/logging';

export class CycleDetectedError extends Error {
  public cyclePath: string[];

  constructor(cyclePath: string[]) {
    const pathString = cyclePath.join(' → ');
    super(`Cycle detected: ${pathString}`);
    this.name = 'CycleDetectedError';
    this.cyclePath = cyclePath;
  }
}

export interface GraphNode {
  id: string;
  type: string;
  requires: string[]; // ['nodeId:port'] dependencies
  data: any;
}

export interface ExecutionGraph {
  adjacency: Map<string, string[]>;
  indegree: Map<string, number>;
  nodes: Map<string, GraphNode>;
}

export interface ExecutionPlan {
  stages: Stage[];
  startNodes: string[];
  totalNodes: number;
}

export interface Stage {
  id: string;
  nodeIds: string[];
  phase: 'configure' | 'execute' | 'validate' | 'route';
  dependencies: string[];
}

export class WorkflowDAG {
  private graph: ExecutionGraph;
  private runId: string;
  private connections: Connection[];
  private managedLoopEdges: Set<string>;
  private dagAdjacency: Map<string, string[]>;
  private dagIndegree: Map<string, number>;

  constructor(nodes: Node[], connections: Connection[], runId: string) {
    this.runId = runId;
    this.connections = connections;
    this.managedLoopEdges = new Set();
    this.dagAdjacency = new Map();
    this.dagIndegree = new Map();
    this.graph = this.buildGraph(nodes, connections);
  }

  buildGraph(nodes: Node[], connections: Connection[]): ExecutionGraph {
    const adjacency = new Map<string, string[]>();
    const indegree = new Map<string, number>();
    const nodeMap = new Map<string, GraphNode>();

    // Initialize all nodes
    nodes.forEach(node => {
      adjacency.set(node.id, []);
      indegree.set(node.id, 0);
      nodeMap.set(node.id, {
        id: node.id,
        type: node.type,
        requires: node.data.requires || [],
        data: node.data
      });
    });

    // Build adjacency list and calculate indegrees
    connections.forEach(conn => {
      const sourceId = conn.sourceId;
      const targetId = conn.targetId;
      
      if (adjacency.has(sourceId) && indegree.has(targetId)) {
        adjacency.get(sourceId)!.push(targetId);
        indegree.set(targetId, indegree.get(targetId)! + 1);
      }
    });

    logger.debug('workflow', 'Built execution graph', undefined, {
      runId: this.runId,
      totalNodes: nodes.length,
      totalConnections: connections.length,
      indegrees: Object.fromEntries(indegree)
    });

    return { adjacency, indegree, nodes: nodeMap };
  }

  detectCycles(): { hasCycle: boolean; cyclePath?: string[] } {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const path: string[] = [];
    let detectedCyclePath: string[] | undefined;
    let isManagedLoop = false;

    const dfs = (nodeId: string): boolean => {
      if (recursionStack.has(nodeId)) {
        // Found cycle - extract the cycle path
        const cycleStart = path.indexOf(nodeId);
        detectedCyclePath = path.slice(cycleStart).concat([nodeId]);
        
        // Check if this is a managed loop (cycle involving loop-node)
        const cycleNodes = detectedCyclePath.slice(0, -1); // Remove duplicate end node
        const hasLoopNode = cycleNodes.some(id => {
          const node = this.graph.nodes.get(id);
          return node?.type === 'loop-node';
        });
        
        if (hasLoopNode) {
          // This is a managed loop - store the back edge and don't treat as error
          const backEdgeKey = `${detectedCyclePath[detectedCyclePath.length - 2]}->${detectedCyclePath[0]}`;
          this.managedLoopEdges.add(backEdgeKey);
          isManagedLoop = true;
          
          logger.info('workflow', 'Detected managed loop cycle', undefined, {
            runId: this.runId,
            cyclePath: detectedCyclePath,
            backEdge: backEdgeKey
          });
          
          return false; // Don't treat as error cycle
        }
        
        return true;
      }

      if (visited.has(nodeId)) {
        return false;
      }

      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);

      const neighbors = this.graph.adjacency.get(nodeId) || [];
      for (const neighbor of neighbors) {
        if (dfs(neighbor)) {
          return true;
        }
      }

      recursionStack.delete(nodeId);
      path.pop();
      return false;
    };

    // Check all nodes for cycles
    for (const nodeId of this.graph.nodes.keys()) {
      if (!visited.has(nodeId)) {
        if (dfs(nodeId)) {
          logger.error('workflow', 'Unmanaged cycle detected in workflow graph', undefined, {
            runId: this.runId,
            cyclePath: detectedCyclePath,
            cycleLength: detectedCyclePath?.length || 0
          });
          
          return { hasCycle: true, cyclePath: detectedCyclePath };
        }
      }
    }

    // If we found managed loops but no unmanaged cycles, return no cycle
    if (isManagedLoop && this.managedLoopEdges.size > 0) {
      logger.info('workflow', 'Only managed loops detected, proceeding with execution', undefined, {
        runId: this.runId,
        managedLoops: Array.from(this.managedLoopEdges)
      });
    }
    
    return { hasCycle: false };
  }

  computeStartNodes(): string[] {
    const validStarterTypes = [
      'trend-research', 'content-research', 'script-generator', 
      'input-node', 'sequential-node', 'likeness-node'
    ];

    const startNodes = Array.from(this.graph.nodes.values())
      .filter(node => {
        // Must have zero data dependencies
        const hasDataDependencies = this.graph.indegree.get(node.id) || 0 > 0;
        
        // Must be a valid starter type
        const isValidStarter = validStarterTypes.includes(node.type);
        
        // Exclude utility nodes that shouldn't auto-start
        const isExcluded = ['preview-node', 'trash-node', 'loop-node'].includes(node.type);
        
        return !hasDataDependencies && isValidStarter && !isExcluded;
      })
      .map(node => node.id);

    logger.info('workflow', 'Computed start nodes', undefined, {
      runId: this.runId,
      startNodes,
      totalCandidates: this.graph.nodes.size,
      validStarterTypes
    });

    return startNodes;
  }

  topologicalSort(): { success: boolean; order?: string[]; error?: string } {
    const cycleResult = this.detectCycles();
    if (cycleResult.hasCycle) {
      throw new CycleDetectedError(cycleResult.cyclePath!);
    }

    // Build DAG-compliant graph after cycle detection
    this.buildDAGGraph();
    
    const queue: string[] = [];
    const order: string[] = [];

    // Find all nodes with no incoming edges
    for (const [nodeId, degree] of this.dagIndegree) {
      if (degree === 0) {
        queue.push(nodeId);
      }
    }

    while (queue.length > 0) {
      const current = queue.shift()!;
      order.push(current);

      // Process all neighbors
      const neighbors = this.dagAdjacency.get(current) || [];
      for (const neighbor of neighbors) {
        const newDegree = this.dagIndegree.get(neighbor)! - 1;
        this.dagIndegree.set(neighbor, newDegree);
        
        if (newDegree === 0) {
          queue.push(neighbor);
        }
      }
    }

    if (order.length !== this.graph.nodes.size) {
      return {
        success: false,
        error: `Topological sort failed: ${this.graph.nodes.size - order.length} nodes unreachable`
      };
    }

    logger.success('workflow', 'Topological sort completed', undefined, {
      runId: this.runId,
      executionOrder: order,
      totalNodes: order.length,
      managedLoops: Array.from(this.managedLoopEdges)
    });

    return { success: true, order };
  }

  private buildDAGGraph(): void {
    // Initialize DAG adjacency and indegree maps
    this.dagAdjacency.clear();
    this.dagIndegree.clear();
    
    // Initialize with empty adjacency lists and zero indegrees
    for (const [nodeId, neighbors] of this.graph.adjacency) {
      this.dagAdjacency.set(nodeId, []);
      this.dagIndegree.set(nodeId, 0);
    }
    
    // Add only non-managed-loop edges to DAG graph
    for (const connection of this.connections) {
      const backEdgeKey = `${connection.sourceId}->${connection.targetId}`;
      
      // Skip managed loop back-edges
      if (!this.managedLoopEdges.has(backEdgeKey)) {
        const sourceId = connection.sourceId;
        const targetId = connection.targetId;
        
        if (this.dagAdjacency.has(sourceId) && this.dagIndegree.has(targetId)) {
          this.dagAdjacency.get(sourceId)!.push(targetId);
          this.dagIndegree.set(targetId, this.dagIndegree.get(targetId)! + 1);
        }
      }
    }
  }

  createExecutionPlan(): ExecutionPlan {
    const sortResult = this.topologicalSort();
    if (!sortResult.success) {
      throw new Error(sortResult.error);
    }

    const order = sortResult.order!;
    const startNodes = this.computeStartNodes();

    // Create stages based on dependency levels
    const stages: Stage[] = [];
    const processed = new Set<string>();
    let stageIndex = 0;

    while (processed.size < order.length) {
      const currentStage: string[] = [];
      
      for (const nodeId of order) {
        if (processed.has(nodeId)) continue;
        
        // Check if all dependencies are satisfied using DAG adjacency
        const dependencies = Array.from(this.dagAdjacency.entries())
          .filter(([_, targets]) => targets.includes(nodeId))
          .map(([source, _]) => source);
        
        const allDepsProcessed = dependencies.every(dep => processed.has(dep));
        
        if (allDepsProcessed) {
          currentStage.push(nodeId);
        }
      }

      if (currentStage.length === 0) {
        throw new Error('Execution plan creation failed: circular dependency detected');
      }

      stages.push({
        id: `stage-${stageIndex}`,
        nodeIds: currentStage,
        phase: 'execute',
        dependencies: []
      });

      currentStage.forEach(nodeId => processed.add(nodeId));
      stageIndex++;
    }

    logger.info('workflow', 'Execution plan created', undefined, {
      runId: this.runId,
      totalStages: stages.length,
      stagesBreakdown: stages.map(s => ({ id: s.id, nodeCount: s.nodeIds.length })),
      startNodes
    });

    return {
      stages,
      startNodes,
      totalNodes: order.length
    };
  }

  validateGating(nodeId: string, availableData: Map<string, any>): { canExecute: boolean; missingDeps: string[] } {
    const node = this.graph.nodes.get(nodeId);
    if (!node) {
      return { canExecute: false, missingDeps: [`Node ${nodeId} not found`] };
    }

    const missingDeps: string[] = [];
    
    for (const requirement of node.requires) {
      const [requiredNodeId, portStr] = requirement.split(':');
      const port = parseInt(portStr) || 0;
      
      const data = availableData.get(requiredNodeId);
      if (!data) {
        missingDeps.push(`${requiredNodeId}:${port} (no data)`);
      } else if (data.outputs && !data.outputs[port]) {
        missingDeps.push(`${requiredNodeId}:${port} (port missing)`);
      }
    }

    const canExecute = missingDeps.length === 0;
    
    if (!canExecute) {
      logger.warn('workflow', `Node ${nodeId} gating failed`, nodeId, {
        runId: this.runId,
        missingDeps,
        availableNodes: Array.from(availableData.keys())
      });
    }

    return { canExecute, missingDeps };
  }
}