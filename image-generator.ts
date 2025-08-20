// VidForge - Image Generator Node schema
import { z } from 'zod';
import { BaseNodeDataSchema, ImageSchema } from './base';

export const ImageGeneratorConfigSchema = BaseNodeDataSchema.extend({
  prompt: z.string().default(''),
  negativePrompt: z.string().default(''),
  count: z.number().min(1).max(10).default(1),
  style: z.enum(['photorealistic', 'artistic', 'cartoon', 'abstract', 'vintage', 'modern']).default('photorealistic'),
  aspectRatio: z.enum(['1:1', '16:9', '9:16', '4:3', '3:4']).default('16:9'),
  quality: z.enum(['standard', 'hd']).default('hd'),
  model: z.enum(['dall-e-3', 'dall-e-2']).default('dall-e-3'),
  resolution: z.string().default('1792x1024'),
  seed: z.number().optional(),
  subjectSeed: z.number().optional(), // For character consistency
  sceneSeed: z.number().optional(), // For scene consistency
  likenessRequired: z.boolean().default(false),
  upscaling: z.enum(['none', '2x', '4x', '8x']).default('none'),
  postProcessing: z.boolean().default(false),
  safetyFilter: z.boolean().default(true)
});

export const ImageGeneratorInputSchema = z.object({
  prompt: z.string().optional(),
  scenePrompt: z.string().optional(),
  likeness: z.any().optional(), // LikenessOutput
  characterProfile: z.any().optional()
});

export const ImageGeneratorOutputSchema = z.object({
  images: z.array(ImageSchema),
  meta: z.object({
    aspect: z.string(),
    quality: z.enum(['standard', 'hd']),
    model: z.string(),
    timeMs: z.number(),
    promptUsed: z.string().optional(),
    negativePromptUsed: z.string().optional(),
    seedUsed: z.number().optional()
  })
});

export type ImageGeneratorConfig = z.infer<typeof ImageGeneratorConfigSchema>;
export type ImageGeneratorInput = z.infer<typeof ImageGeneratorInputSchema>;
export type ImageGeneratorOutput = z.infer<typeof ImageGeneratorOutputSchema>;

export const VERSION = '1.0.0';