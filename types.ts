// VidForge - Shared TypeScript interfaces for node IO + configs
export interface VFLog {
  id: string;                 // nanoid()
  ts: number;                 // Date.now()
  level: 'debug' | 'info' | 'warn' | 'error' | 'success';
  cat: 'workflow' | 'config' | 'api' | 'performance' | 'execution' | 'data-flow' | 'auth' | 'judge' | 'media' | 'error';
  nodeId?: string;
  runId?: string;             // workflow run correlation id
  msg: string;
  meta?: Record<string, any>; // payload (truncated & safe)
}

export interface LikenessOutput {
  subject: {
    name?: string;
    descriptor: string; // concise identity description
  };
  references: Array<{ url: string; localPath?: string; hash?: string }>;
  settings: { strictness: number };
}

export interface ImageGenOutput {
  images: Array<{ url: string; local: string; revisedPrompt?: string }>;
  meta: { aspect: string; quality: 'standard' | 'hd'; model: string; timeMs: number };
}

export interface JudgmentResult {
  decision: boolean;              // pass/fail
  confidence: number;             // 0–1
  qualityScore: number;           // 0–100
  likenessScore?: number;         // 0–100 (if likeness available)
  reasons: string[];
}

export type SequentialItem =
  | { kind: 'voice', text: string, idx: number }
  | { kind: 'image', prompt: string, idx: number };

export interface VoiceGenOutput {
  audioUrl: string;
  durationSec: number;
  voiceId: string;
  settings: Record<string, any>;
}

export interface NodeExecutionResult {
  ok: boolean;
  node?: string;
  result?: any;
  error?: string;
  details?: any;
  stack?: string;
}