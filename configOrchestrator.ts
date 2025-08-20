// VidForge - Configuration Orchestrator with conflict resolution
import { logger } from '../utils/logging';
import { ConfigSuggestionSchema } from '../schemas/base';
import { z } from 'zod';

export type ConfigSuggestion = z.infer<typeof ConfigSuggestionSchema>;

export interface ConfigSnapshot {
  runId: string;
  stage: string;
  timestamp: number;
  effectiveConfig: Record<string, any>;
  appliedSuggestions: ConfigSuggestion[];
  conflicts: Array<{
    path: string;
    suggestions: ConfigSuggestion[];
    winner: ConfigSuggestion;
    reason: string;
  }>;
}

export class ConfigOrchestrator {
  private suggestions: Map<string, ConfigSuggestion[]> = new Map();
  private snapshots: ConfigSnapshot[] = [];
  private runId: string;

  constructor(runId: string) {
    this.runId = runId;
  }

  addSuggestion(suggestion: ConfigSuggestion): void {
    // Validate suggestion
    try {
      ConfigSuggestionSchema.parse(suggestion);
    } catch (error) {
      logger.error('config', 'Invalid configuration suggestion', suggestion.source, {
        runId: this.runId,
        error: error instanceof Error ? error.message : String(error),
        suggestion
      });
      return;
    }

    const path = suggestion.path;
    if (!this.suggestions.has(path)) {
      this.suggestions.set(path, []);
    }
    
    this.suggestions.get(path)!.push(suggestion);
    
    logger.debug('config', `Configuration suggestion added: ${path}`, suggestion.source, {
      runId: this.runId,
      path,
      value: suggestion.value,
      priority: suggestion.priority,
      rationale: suggestion.rationale
    });
  }

  resolveConflicts(stage: string): ConfigSnapshot {
    const effectiveConfig: Record<string, any> = {};
    const appliedSuggestions: ConfigSuggestion[] = [];
    const conflicts: ConfigSnapshot['conflicts'] = [];
    const now = Date.now();

    for (const [path, suggestions] of this.suggestions) {
      // Filter out expired suggestions
      const validSuggestions = suggestions.filter(s => 
        !s.ttl || (now - s.timestamp) < s.ttl
      );

      if (validSuggestions.length === 0) continue;

      if (validSuggestions.length === 1) {
        // No conflict
        const suggestion = validSuggestions[0];
        this.setNestedValue(effectiveConfig, path, suggestion.value);
        appliedSuggestions.push(suggestion);
      } else {
        // Resolve conflict
        const winner = this.resolveConflict(validSuggestions);
        conflicts.push({
          path,
          suggestions: validSuggestions,
          winner,
          reason: this.getConflictReason(validSuggestions, winner)
        });
        
        this.setNestedValue(effectiveConfig, path, winner.value);
        appliedSuggestions.push(winner);
      }
    }

    const snapshot: ConfigSnapshot = {
      runId: this.runId,
      stage,
      timestamp: now,
      effectiveConfig,
      appliedSuggestions,
      conflicts
    };

    this.snapshots.push(snapshot);

    logger.info('config', `Configuration resolved for stage ${stage}`, undefined, {
      runId: this.runId,
      stage,
      totalPaths: Object.keys(effectiveConfig).length,
      conflictsResolved: conflicts.length,
      suggestionsApplied: appliedSuggestions.length
    });

    // Log conflicts for transparency
    conflicts.forEach(conflict => {
      logger.warn('config', `Configuration conflict resolved: ${conflict.path}`, undefined, {
        runId: this.runId,
        path: conflict.path,
        conflictingSources: conflict.suggestions.map(s => s.source),
        winner: conflict.winner.source,
        reason: conflict.reason,
        finalValue: conflict.winner.value
      });
    });

    return snapshot;
  }

  private resolveConflict(suggestions: ConfigSuggestion[]): ConfigSuggestion {
    // Sort by priority (higher first), then by timestamp (later first)
    const sorted = [...suggestions].sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority; // Higher priority wins
      }
      return b.timestamp - a.timestamp; // Later timestamp wins
    });

    return sorted[0];
  }

  private getConflictReason(suggestions: ConfigSuggestion[], winner: ConfigSuggestion): string {
    const others = suggestions.filter(s => s !== winner);
    
    if (winner.priority > Math.max(...others.map(s => s.priority))) {
      return `Higher priority (${winner.priority})`;
    }
    
    if (winner.timestamp > Math.max(...others.map(s => s.timestamp))) {
      return `More recent suggestion`;
    }
    
    return `Default resolution order`;
  }

  private setNestedValue(obj: Record<string, any>, path: string, value: any): void {
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
  }

  getSnapshot(stage: string): ConfigSnapshot | undefined {
    return this.snapshots.find(s => s.stage === stage);
  }

  getAllSnapshots(): ConfigSnapshot[] {
    return [...this.snapshots];
  }

  clear(): void {
    this.suggestions.clear();
    this.snapshots.length = 0;
  }
}