import type { CollectionEntry } from 'astro:content';

export const types = [
  { value: 'all', label: 'All resources' },
  { value: 'website', label: 'Websites' },
  { value: 'skill', label: 'AI skills' },
  { value: 'prompt', label: 'Prompts' },
  { value: 'workflow', label: 'Workflows' },
  { value: 'repository', label: 'Repositories' },
] as const;
export const typeLabels: Record<string, string> = {
  website: 'Website', skill: 'AI skill', prompt: 'Prompt', workflow: 'Workflow', repository: 'Repository',
};
export function recommended(a: CollectionEntry<'resources'>, b: CollectionEntry<'resources'>) {
  return a.data.order - b.data.order || a.data.title.localeCompare(b.data.title);
}
// Stable seeds give every paper its own edge without introducing client-side layout shifts.
export function paperEdge(seed: string) {
  let n = [...seed].reduce((v, c) => (Math.imul(v, 31) + c.charCodeAt(0)) >>> 0, 7);
  const random = () => { n = (Math.imul(n, 1664525) + 1013904223) >>> 0; return n / 4294967296; };
  const points: string[] = [];
  for (let i = 0; i <= 20; i++) points.push(`${i * 5}% ${(random() * .65).toFixed(2)}%`);
  for (let i = 1; i <= 20; i++) points.push(`${(100 - random() * .45).toFixed(2)}% ${i * 5}%`);
  for (let i = 19; i >= 0; i--) points.push(`${i * 5}% ${(100 - random() * .65).toFixed(2)}%`);
  for (let i = 19; i >= 1; i--) points.push(`${(random() * .45).toFixed(2)}% ${i * 5}%`);
  return `polygon(${points.join(',')})`;
}
