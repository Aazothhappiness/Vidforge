// VidForge - Execution tracing with correlation IDs and spans
import { logger } from '../utils/logging';

export interface Span {
  spanId: string;
  parentSpanId?: string;
  runId: string;
  nodeId?: string;
  operation: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'running' | 'completed' | 'failed';
  metadata?: Record<string, any>;
  error?: string;
}

export class TracingManager {
  private spans: Map<string, Span> = new Map();
  private activeSpans: Set<string> = new Set();
  private runId: string;

  constructor(runId: string) {
    this.runId = runId;
  }

  createRunId(): string {
    return `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  createSpanId(parentSpanId?: string): string {
    const spanId = `span_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    if (parentSpanId) {
      return `${parentSpanId}.${spanId}`;
    }
    
    return spanId;
  }

  startSpan(operation: string, nodeId?: string, parentSpanId?: string, metadata?: Record<string, any>): string {
    const spanId = this.createSpanId(parentSpanId);
    
    const span: Span = {
      spanId,
      parentSpanId,
      runId: this.runId,
      nodeId,
      operation,
      startTime: Date.now(),
      status: 'running',
      metadata
    };

    this.spans.set(spanId, span);
    this.activeSpans.add(spanId);

    logger.debug('performance', `Span started: ${operation}`, nodeId, {
      runId: this.runId,
      spanId,
      parentSpanId,
      operation,
      metadata
    });

    return spanId;
  }

  endSpan(spanId: string, status: 'completed' | 'failed' = 'completed', error?: string, metadata?: Record<string, any>): void {
    const span = this.spans.get(spanId);
    if (!span) {
      logger.warn('performance', `Attempted to end non-existent span: ${spanId}`);
      return;
    }

    const endTime = Date.now();
    const duration = endTime - span.startTime;

    span.endTime = endTime;
    span.duration = duration;
    span.status = status;
    span.error = error;
    
    if (metadata) {
      span.metadata = { ...span.metadata, ...metadata };
    }

    this.activeSpans.delete(spanId);

    const level = status === 'failed' ? 'error' : 'debug';
    logger.log(level, 'performance', `Span ended: ${span.operation} (${duration}ms)`, span.nodeId, {
      runId: this.runId,
      spanId,
      operation: span.operation,
      duration: `${duration}ms`,
      status,
      error
    });
  }

  getSpan(spanId: string): Span | undefined {
    return this.spans.get(spanId);
  }

  getAllSpans(): Span[] {
    return Array.from(this.spans.values()).sort((a, b) => a.startTime - b.startTime);
  }

  getActiveSpans(): Span[] {
    return Array.from(this.activeSpans).map(id => this.spans.get(id)!).filter(Boolean);
  }

  getSpansByNode(nodeId: string): Span[] {
    return this.getAllSpans().filter(span => span.nodeId === nodeId);
  }

  getExecutionSummary(): {
    totalSpans: number;
    completedSpans: number;
    failedSpans: number;
    activeSpans: number;
    totalDuration: number;
    averageDuration: number;
    nodeBreakdown: Record<string, { count: number; totalDuration: number; avgDuration: number }>;
  } {
    const allSpans = this.getAllSpans();
    const completedSpans = allSpans.filter(s => s.status === 'completed');
    const failedSpans = allSpans.filter(s => s.status === 'failed');
    const activeSpans = allSpans.filter(s => s.status === 'running');

    const totalDuration = completedSpans.reduce((sum, span) => sum + (span.duration || 0), 0);
    const averageDuration = completedSpans.length > 0 ? totalDuration / completedSpans.length : 0;

    // Node breakdown
    const nodeBreakdown: Record<string, { count: number; totalDuration: number; avgDuration: number }> = {};
    
    completedSpans.forEach(span => {
      if (span.nodeId) {
        if (!nodeBreakdown[span.nodeId]) {
          nodeBreakdown[span.nodeId] = { count: 0, totalDuration: 0, avgDuration: 0 };
        }
        nodeBreakdown[span.nodeId].count++;
        nodeBreakdown[span.nodeId].totalDuration += span.duration || 0;
      }
    });

    // Calculate averages
    Object.values(nodeBreakdown).forEach(breakdown => {
      breakdown.avgDuration = breakdown.count > 0 ? breakdown.totalDuration / breakdown.count : 0;
    });

    return {
      totalSpans: allSpans.length,
      completedSpans: completedSpans.length,
      failedSpans: failedSpans.length,
      activeSpans: activeSpans.length,
      totalDuration,
      averageDuration,
      nodeBreakdown
    };
  }

  exportTrace(): any {
    return {
      runId: this.runId,
      spans: this.getAllSpans(),
      summary: this.getExecutionSummary(),
      exportedAt: Date.now()
    };
  }

  clear(): void {
    this.spans.clear();
    this.activeSpans.clear();
  }
}

// Global tracing instance
let globalTracer: TracingManager | null = null;

export function initializeTracing(runId: string): TracingManager {
  globalTracer = new TracingManager(runId);
  logger.setRunId(runId);
  return globalTracer;
}

export function getTracer(): TracingManager | null {
  return globalTracer;
}

export function createRunId(): string {
  return `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function createSpanId(parentSpanId?: string): string {
  const spanId = `span_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  return parentSpanId ? `${parentSpanId}.${spanId}` : spanId;
}

// Convenience functions
export function startSpan(operation: string, nodeId?: string, parentSpanId?: string, metadata?: Record<string, any>): string {
  const tracer = getTracer();
  if (!tracer) {
    logger.warn('performance', 'No active tracer for span creation');
    return 'no-tracer';
  }
  return tracer.startSpan(operation, nodeId, parentSpanId, metadata);
}

export function endSpan(spanId: string, status: 'completed' | 'failed' = 'completed', error?: string, metadata?: Record<string, any>): void {
  const tracer = getTracer();
  if (!tracer) return;
  tracer.endSpan(spanId, status, error, metadata);
}

export function withSpan<T>(operation: string, nodeId: string | undefined, fn: (spanId: string) => Promise<T>): Promise<T> {
  const spanId = startSpan(operation, nodeId);
  
  return fn(spanId)
    .then(result => {
      endSpan(spanId, 'completed');
      return result;
    })
    .catch(error => {
      endSpan(spanId, 'failed', error.message);
      throw error;
    });
}