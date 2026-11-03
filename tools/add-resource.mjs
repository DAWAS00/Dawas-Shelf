#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { execSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import yaml from 'js-yaml';
import { resourceSchema } from '../src/lib/resource-schema.mjs';

const PROJECT_ROOT = fileURLToPath(new URL('../', import.meta.url));
const artForType = { website: 'code', skill: 'skill', prompt: 'prompt', workflow: 'workflow', repository: 'repository' };

export function slugify(text) {
  return text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function normalizeUrl(value) {
  if (!value?.trim()) return undefined;
  const raw = value.trim();
  const candidate = /^[a-z][a-z\d+.-]*:/i.test(raw) ? raw : raw.startsWith('//') ? `https:${raw}` : `https://${raw}`;
  let url;
  try { url = new URL(candidate); } catch { throw new Error('Enter a valid website URL.'); }
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Use an HTTPS URL without embedded credentials.');
  return url.href;
}

function readFrontmatter(file) {
  const text = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) throw new Error(`Missing frontmatter in ${file}`);
  return yaml.load(match[1]);
}

export function nextOrder(directory) {
  const files = fs.readdirSync(directory, { recursive: true }).filter(file => {
    const segments = file.split(path.sep);
    return file.endsWith('.md') && !segments.some(segment => segment.startsWith('.')) && !path.basename(file).startsWith('_') && fs.statSync(path.join(directory, file)).isFile();
  });
  const orders = files.map(file => resourceSchema.parse(readFrontmatter(path.join(directory, file))).order);
  return Math.max(0, ...orders) + 1;
}

export function addResource(inputData, { root = PROJECT_ROOT, validateProject } = {}) {
  const directory = path.join(root, 'src/content/resources');
  const slug = inputData.slug || slugify(inputData.title || '');
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('Enter a title with letters/numbers, or provide --slug with a URL-friendly English name.');
  const target = path.join(directory, `${slug}.md`);
  if (fs.existsSync(target)) throw new Error(`Resource already exists: ${target}`);

  const { slug: unusedSlug, copyFile, ...fields } = inputData;
  if (copyFile && fields.copyText) throw new Error('Choose either --copy-file or --copy-text, not both.');
  if (copyFile) fields.copyText = fs.readFileSync(path.resolve(copyFile), 'utf8').replace(/^\uFEFF/, '');
  if ((fields.type === 'skill' || fields.type === 'prompt') && !fields.copyText?.trim()) {
    throw new Error(`${fields.type} entries need their actual instructions: use --copy-file or --copy-text.`);
  }
  const data = resourceSchema.parse({
    ...fields,
    url: normalizeUrl(fields.url),
    art: fields.art || artForType[fields.type],
    updated: fields.updated || new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Amman' }),
    order: fields.order ?? nextOrder(directory),
    copyLabel: fields.copyLabel || (fields.type === 'skill' ? 'Copy SKILL.md' : fields.type === 'prompt' ? 'Copy prompt' : undefined),
  });
  const metadata = { ...data, updated: data.updated.toISOString().slice(0, 10) };
  const frontmatter = yaml.dump(metadata, { noRefs: true, lineWidth: -1, quotingType: '"' });
  const body = `## What it does\n\nDescribe the resource and its practical purpose.\n\n## Why I use it\n\nAdd your own experience and tradeoffs.\n\n## Practical tip\n\nAdd a specific starting point or example.\n`;
  // Exclusive creation prevents overwriting a resource created while the wizard was open.
  fs.writeFileSync(target, `---\n${frontmatter}---\n\n${body}`, { encoding: 'utf8', flag: 'wx' });
  try {
    if (validateProject) validateProject(root);
  } catch (error) {
    fs.unlinkSync(target);
    throw new Error(`Project validation failed; removed the new entry ${slug}. Existing resources were kept.`, { cause: error });
  }
  return target;
}

async function promptInteractive() {
  const rl = readline.createInterface({ input, output });
  try {
    console.log('\nDawas Shlef — Add a resource\n');
    const title = (await rl.question('Title: ')).trim();
    const type = (await rl.question('Type [website / skill / prompt / workflow / repository]: ')).trim().toLowerCase() || 'website';
    if (!Object.hasOwn(artForType, type)) throw new Error('Choose a listed resource type.');
    const description = (await rl.question('Short description: ')).trim();
    const tags = (await rl.question('Tags, separated by commas: ')).split(',').map(tag => tag.trim()).filter(Boolean);
    const url = (await rl.question('Website or original source URL (optional): ')).trim() || undefined;
    const author = (await rl.question('Original author or creator (optional): ')).trim() || undefined;
    let copyFile, copyText, compatibility, steps;
    if (type === 'skill' || type === 'prompt') {
      copyFile = (await rl.question(`Path to the actual ${type === 'skill' ? 'SKILL.md' : 'prompt text file'} (leave blank to enter text): `)).trim() || undefined;
      if (!copyFile) copyText = (await rl.question('Complete text (for multiline text, use a file): ')).trim();
      if (type === 'skill') compatibility = (await rl.question('Tested/supported tools (optional): ')).trim() || undefined;
    }
    if (type === 'workflow' || type === 'skill') {
      const rawSteps = (await rl.question('Usage steps, separated by semicolons (optional): ')).trim();
      if (rawSteps) steps = rawSteps.split(';').map(step => step.trim()).filter(Boolean);
    }
    return { title, type, description, tags, url, author, copyFile, copyText, compatibility, steps };
  } finally { rl.close(); }
}

async function main() {
  const optionNames = ['title', 'slug', 'type', 'desc', 'description', 'tags', 'url', 'art', 'author', 'copy-file', 'copy-text', 'copyFile', 'copyText', 'copyLabel', 'compatibility', 'steps'];
  const { values } = parseArgs({ options: { ...Object.fromEntries(optionNames.map(name => [name, { type: 'string' }])), help: { type: 'boolean', short: 'h' } } });
  if (values.help) {
    console.log('npm run add\nnode tools/add-resource.mjs --title "Tool name" --type website --desc "What it does" --tags "Coding,Tools" --url https://example.com\nSkills/prompts: add --copy-file ./SKILL.md (or --copy-text "Complete instructions").\nOptional: --slug, --author, --art, --copyLabel, --compatibility, --steps "First;Second"');
    return;
  }
  let data;
  if (Object.keys(values).length) {
    if (!values.title || !values.type) throw new Error('Flag-based use requires --title and --type.');
    data = {
      title: values.title, slug: values.slug, type: values.type,
      description: values.desc || values.description,
      tags: (values.tags || 'AI,Tools').split(',').map(tag => tag.trim()).filter(Boolean),
      url: values.url, author: values.author, art: values.art,
      copyFile: values['copy-file'] || values.copyFile,
      copyText: values['copy-text'] || values.copyText,
      copyLabel: values.copyLabel, compatibility: values.compatibility,
      steps: values.steps?.split(';').map(step => step.trim()).filter(Boolean),
    };
  } else data = await promptInteractive();
  const target = addResource(data, { validateProject: root => execSync('npm run check', { cwd: root, stdio: 'inherit', env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' } }) });
  console.log(`\nCreated ${path.relative(PROJECT_ROOT, target)}. Schema and project checks passed.`);
  console.log('Finish the editorial sections and review the original source/dependencies before running npm run ship.');
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  main().catch(error => {
    const message = error.issues?.map(issue => `${issue.path.join('.') || 'Resource'}: ${issue.message}`).join('\n') || error.message;
    console.error(`Add failed: ${message}`);
    process.exitCode = 1;
  });
}
