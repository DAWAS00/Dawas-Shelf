import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { resourceSchema } from './lib/resource-schema.mjs';

const resources = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/resources' }),
  schema: resourceSchema,
});

export const collections = { resources };
