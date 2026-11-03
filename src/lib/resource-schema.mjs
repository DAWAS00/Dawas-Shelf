import { z } from 'zod';

const text = () => z.string().trim().min(1, 'Enter a nonempty value.');
const httpsUrl = () => z.string().url().refine(value => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch { return false; }
}, 'Use an HTTPS URL without embedded credentials.');

// One schema for Astro and the resource wizard, so accepted entries agree.
export const resourceSchema = z.object({
  title: text(),
  type: z.enum(['website', 'skill', 'prompt', 'workflow', 'repository']),
  description: text(),
  tags: z.array(text()).min(1),
  updated: z.coerce.date(),
  order: z.number().finite().default(99),
  featured: z.boolean().default(false),
  url: httpsUrl().optional(),
  author: text().optional(),
  preview: z.string().startsWith('/previews/').optional(),
  previewAlt: text().optional(),
  previewKind: z.enum(['illustration', 'screenshot']).default('illustration'),
  art: z.enum(['research', 'code', 'prompt', 'workflow', 'skill', 'repository']).default('research'),
  copyLabel: text().optional(),
  // Preserve actual skill/prompt text, including indentation and newlines.
  copyText: z.string().refine(value => value.trim().length > 0, 'Enter the complete text.').optional(),
  compatibility: text().optional(),
  steps: z.array(text()).optional(),
  tutorialUrl: httpsUrl().optional(),
}).superRefine((data, ctx) => {
  if (data.preview && !data.previewAlt) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['previewAlt'], message: 'Describe the preview image.' });
  if ((data.type === 'prompt' || data.type === 'skill') && !data.copyText) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['copyText'], message: 'Prompts and skills need copyable text.' });
});
