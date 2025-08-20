// VidForge - Base schemas and validation utilities
import { z } from 'zod';

export const VERSION = '1.0.0';

// Base node data schema
export const BaseNodeDataSchema = z.object({
  version: z.string().default(VERSION),
  inputPorts: z.number().min(0).max(10).default(1),
  outputPorts: z.number().min(0).max(10).default(1),
  requires: z.array(z.string()).default([]), // ['nodeId:port']
  lastResult: z.any().optional(),
  locked: z.array(z.string()).default([]), // locked field names
  hidden: z.array(z.string()).default([]) // hidden field names
});

// Common field schemas
export const TagsSchema = z.array(z.string()).default([]);
export const KeywordsSchema = z.array(z.string()).default([]);
export const SourcesSchema = z.array(z.string()).default([]);

// Media schemas
export const ImageSchema = z.object({
  url: z.string(),
  local: z.string().optional(),
  revisedPrompt: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

export const AudioSchema = z.object({
  audioUrl: z.string(),
  durationSec: z.number(),
  voiceId: z.string(),
  settings: z.record(z.any()).default({})
});

export const VideoSchema = z.object({
  videoUrl: z.string(),
  durationSec: z.number(),
  resolution: z.string(),
  format: z.string(),
  metadata: z.record(z.any()).default({})
});

// Judgment result schema
export const JudgmentResultSchema = z.object({
  decision: z.boolean(),
  confidence: z.number().min(0).max(1),
  qualityScore: z.number().min(0).max(100),
  likenessScore: z.number().min(0).max(100).optional(),
  reasons: z.array(z.string()),
  strengths: z.array(z.string()).default([]),
  weaknesses: z.array(z.string()).default([]),
  recommendations: z.array(z.string()).default([])
});

// Likeness output schema
export const LikenessOutputSchema = z.object({
  subject: z.object({
    name: z.string().optional(),
    descriptor: z.string()
  }),
  references: z.array(z.object({
    url: z.string(),
    localPath: z.string().optional(),
    hash: z.string().optional()
  })),
  settings: z.object({
    strictness: z.number().min(0.1).max(1.0)
  })
});

// Sequential item schema
export const SequentialItemSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('voice'),
    text: z.string(),
    idx: z.number()
  }),
  z.object({
    kind: z.literal('image'),
    prompt: z.string(),
    idx: z.number()
  })
]);

// Configuration suggestion schema
export const ConfigSuggestionSchema = z.object({
  path: z.string(), // 'voice.stability'
  value: z.any(),
  source: z.string(), // nodeId
  priority: z.number().default(50),
  scope: z.string().optional(), // 'voice.*'
  rationale: z.string(),
  ttl: z.number().optional(), // milliseconds
  timestamp: z.number()
});

// Asset schema
export const AssetSchema = z.object({
  sha256: z.string(),
  path: z.string(),
  publicUrl: z.string(),
  contentType: z.string(),
  size: z.number(),
  producer: z.string(), // nodeId
  consumers: z.array(z.string()).default([]), // nodeIds
  pinned: z.boolean().default(false),
  createdAt: z.number()
});

// Validation utilities
export function validateNodeInput<T>(schema: z.ZodSchema<T>, data: any, nodeId: string): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(issue => 
        `${issue.path.join('.')}: ${issue.message}`
      ).join(', ');
      
      logger.error('execution', `Input validation failed for node ${nodeId}`, nodeId, {
        validationErrors: issues,
        receivedData: Object.keys(data || {}),
        schema: schema._def.typeName
      });
      
      throw new Error(`Input validation failed: ${issues}`);
    }
    throw error;
  }
}

export function validateNodeOutput<T>(schema: z.ZodSchema<T>, data: any, nodeId: string): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(issue => 
        `${issue.path.join('.')}: ${issue.message}`
      ).join(', ');
      
      logger.error('execution', `Output validation failed for node ${nodeId}`, nodeId, {
        validationErrors: issues,
        producedData: Object.keys(data || {}),
        schema: schema._def.typeName
      });
      
      throw new Error(`Output validation failed: ${issues}`);
    }
    throw error;
  }
}

// Migration utilities
export function migrateNodeConfig(nodeType: string, config: any, fromVersion: string, toVersion: string): any {
  logger.info('config', `Migrating ${nodeType} config from ${fromVersion} to ${toVersion}`, undefined, {
    nodeType,
    fromVersion,
    toVersion,
    configKeys: Object.keys(config || {})
  });

  // Add migration logic here as schemas evolve
  const migrated = {
    ...config,
    version: toVersion
  };

  // Ensure array fields are properly initialized
  const arrayFields = ['tags', 'sources', 'keywords', 'topics', 'voices', 'platforms', 'hashtags', 'styles'];
  arrayFields.forEach(field => {
    if (migrated[field] && !Array.isArray(migrated[field])) {
      migrated[field] = [migrated[field]];
    } else if (!migrated[field]) {
      migrated[field] = [];
    }
  });

  return migrated;
}