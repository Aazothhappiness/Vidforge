import { ComponentType } from 'react';

export interface Node {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, any>;
}

export interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
  sourcePort?: number;
  targetPort?: number;
}

export interface NodeType {
  id: string;
  name: string;
  description: string;
  icon: ComponentType<any>;
  category: string;
  color: string;
}

export interface NodeExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: string;
}

export interface WorkflowState {
  nodes: Node[];
  connections: Connection[];
  isRunning: boolean;
  currentNode?: string;
}