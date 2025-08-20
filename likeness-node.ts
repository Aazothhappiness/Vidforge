// VidForge - Likeness Node schema
import { z } from 'zod';
import { BaseNodeDataSchema, LikenessOutputSchema } from './base';

export const LikenessNodeConfigSchema = BaseNodeDataSchema.extend({
  referenceImages: z.array(z.object({
    name: z.string(),
    size: z.number(),
    type: z.string(),
    url: z.string(),
    id: z.string(),
    persisted: z.boolean().default(true)
  })).default([]),
  subjectName: z.string().optional(),
  strictness: z.number().min(0.1).max(1.0).default(0.85),
  detailLevel: z.enum(['basic', 'detailed', 'comprehensive']).default('detailed'),
  consistencyMode: z.enum(['strict', 'moderate', 'flexible']).default('moderate'),
  maxImages: z.number().min(1).max(20).default(10)
});

export const LikenessNodeInputSchema = z.object({
  // No required inputs - this is typically a starting node
});

export const LikenessNodeOutputSchema = LikenessOutputSchema;

export type LikenessNodeConfig = z.infer<typeof LikenessNodeConfigSchema>;
export type LikenessNodeInput = z.infer<typeof LikenessNodeInputSchema>;
export type LikenessNodeOutput = z.infer<typeof LikenessNodeOutputSchema>;

export const VERSION = '1.0.0';