import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const resources = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/resources' }),
  schema: z.object({
    title: z.string(),
    type: z.enum(['website', 'skill', 'prompt', 'workflow', 'repository']),
    description: z.string(),
    tags: z.array(z.string()).min(1),
    updated: z.coerce.date(),
    order: z.number().default(99),
    featured: z.boolean().default(false),
    url: z.string().url().refine((url) => url.startsWith('https://'), 'Use an HTTPS source URL.').optional(),
    author: z.string().optional(),
    preview: z.string().startsWith('/previews/').optional(),
    previewAlt: z.string().optional(),
    previewKind: z.enum(['illustration', 'screenshot']).default('illustration'),
    art: z.enum(['research', 'code', 'prompt', 'workflow', 'skill', 'repository']).default('research'),
    copyLabel: z.string().optional(),
    copyText: z.string().optional(),
    compatibility: z.string().optional(),
    steps: z.array(z.string()).optional(),
    tutorialUrl: z.string().url().refine((url) => url.startsWith('https://')).optional(),
  }).superRefine((data, ctx) => {
    if (data.preview && !data.previewAlt) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['previewAlt'], message: 'Describe the preview image.' });
    if ((data.type === 'prompt' || data.type === 'skill') && !data.copyText) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['copyText'], message: 'Prompts and skills need copyable text.' });
  }),
});

export const collections = { resources };
