// VidForge - Judgment Node schema
import { z } from 'zod';
import { BaseNodeDataSchema, JudgmentResultSchema } from './base';

export const JudgmentNodeConfigSchema = BaseNodeDataSchema.extend({
  evaluationMethod: z.enum(['ai_analysis', 'heuristic', 'custom']).default('ai_analysis'),
  qualityThreshold: z.number().min(0).max(1).default(0.7),
  confidenceThreshold: z.number().min(0).max(1).default(0.65),
  likenessRequired: z.boolean().default(false),
  likenessThreshold: z.number().min(0.5).max(1.0).default(0.85),
  criteria: z.array(z.string()).default([
    'Visual quality and clarity',
    'Prompt adherence',
    'Professional appearance',
    'Subject consistency'
  ]),
  autoFailOnLikenessError: z.boolean().default(true),
  outputPorts: z.literal(2) // Always YES/NO
});

export const JudgmentNodeInputSchema = z.object({
  images: z.array(z.any()).optional(),
  text: z.string().optional(),
  audio: z.any().optional(),
  video: z.any().optional(),
  likeness: z.any().optional(), // LikenessOutput for reference
  scenePrompt: z.string().optional(),
  originalPrompt: z.string().optional()
});

export const JudgmentNodeOutputSchema = z.object({
  judgment: JudgmentResultSchema,
  outputs: z.array(z.any().nullable()).length(2), // [YES port data, NO port data]
  routedTo: z.enum(['yes', 'no'])
});

export type JudgmentNodeConfig = z.infer<typeof JudgmentNodeConfigSchema>;
export type JudgmentNodeInput = z.infer<typeof JudgmentNodeInputSchema>;
export type JudgmentNodeOutput = z.infer<typeof JudgmentNodeOutputSchema>;

export const VERSION = '1.0.0';