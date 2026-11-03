import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { resourceSchema } from './lib/resource-schema.mjs';

const resources = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/resources' }),
  schema: resourceSchema,
});

const learning = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/learning' }),
  schema: z.object({
    title: z.string(), description: z.string(), published: z.coerce.date(),
    author: z.string(), category: z.string(), source: z.string().url(),
    sourceLabel: z.string(), sourceCommit: z.string(),
  }),
});

export const collections = { resources, learning };
