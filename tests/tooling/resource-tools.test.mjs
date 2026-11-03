import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { addResource, normalizeUrl, nextOrder } from '../../tools/add-resource.mjs';
import { shipProject } from '../../tools/ship.mjs';
import { resourceSchema } from '../../src/lib/resource-schema.mjs';

function temporary(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dawas-shelf-test-'));
  t.after(() => {
    // Check the absolute target before recursive cleanup, including on Windows.
    const resolved = fs.realpathSync(root);
    assert.equal(path.dirname(resolved), fs.realpathSync(os.tmpdir()));
    assert.ok(path.basename(resolved).startsWith('dawas-shelf-test-'));
    fs.rmSync(resolved, { recursive: true, force: true });
  });
  return root;
}

function contentRoot(t) {
  const root = temporary(t);
  const directory = path.join(root, 'src/content/resources');
  fs.mkdirSync(directory, { recursive: true });
  return { root, directory };
}

const entry = { title: 'Example tool', type: 'website', description: 'A useful example.', tags: ['Tools'], url: 'https://example.com' };
function frontmatter(file) { return yaml.load(fs.readFileSync(file, 'utf8').match(/^---\n([\s\S]*?)\n---/)[1]); }

test('quotes, newlines, and Windows paths round-trip through frontmatter', t => {
  const { root } = contentRoot(t);
  const data = { ...entry, description: 'Read C:\\Users\\Dawas\\notes\nThen choose "a draft".', author: 'Dawas "curator"' };
  const file = addResource(data, { root });
  const actual = resourceSchema.parse(frontmatter(file));
  assert.equal(actual.description, data.description);
  assert.equal(actual.author, data.author);
});

test('malformed fields and incomplete skills never create resources', t => {
  const { root, directory } = contentRoot(t);
  for (const data of [{ ...entry, type: 'skill' }, { ...entry, title: '✨' }, { ...entry, type: 'invalid' }, { ...entry, tags: [''] }, { ...entry, url: 'http://example.com' }]) {
    assert.throws(() => addResource(data, { root }));
    assert.deepEqual(fs.readdirSync(directory), []);
  }
});

test('a failed project check rolls back only the newly created entry', t => {
  const { root, directory } = contentRoot(t);
  const existing = addResource({ ...entry, title: 'Existing' }, { root });
  assert.throws(() => addResource(entry, { root, validateProject: () => { throw new Error('check failed'); } }), /removed the new entry/);
  assert.deepEqual(fs.readdirSync(directory), ['existing.md']);
  assert.ok(fs.existsSync(existing));
});

test('duplicate slugs cannot overwrite existing content', t => {
  const { root } = contentRoot(t);
  const file = addResource(entry, { root });
  const before = fs.readFileSync(file, 'utf8');
  assert.throws(() => addResource({ ...entry, description: 'Replacement' }, { root }), /already exists/);
  assert.equal(fs.readFileSync(file, 'utf8'), before);
});

test('actual skill files and multiline prompts are preserved', t => {
  const { root } = contentRoot(t);
  const source = '---\nname: example-skill\ndescription: An actual skill\n---\n\n# Real instructions\n\nRead the original source, then ask a question.\n';
  const skillPath = path.join(root, 'SKILL.md');
  fs.writeFileSync(skillPath, source);
  const file = addResource({ ...entry, type: 'skill', copyFile: skillPath }, { root });
  assert.equal(frontmatter(file).copyText, source);
  assert.equal(frontmatter(file).copyLabel, 'Copy SKILL.md');
  const prompt = 'Explain this idea:\n\n[Paste your context here]\n';
  const promptFile = addResource({ ...entry, title: 'Prompt example', type: 'prompt', copyText: prompt }, { root });
  assert.equal(frontmatter(promptFile).copyText, prompt);
  assert.equal(frontmatter(promptFile).copyLabel, 'Copy prompt');
  assert.throws(() => addResource({ ...entry, title: 'Conflicting', type: 'skill', copyFile: skillPath, copyText: 'Other text' }, { root }), /either/);
});

test('URLs add only missing schemes and reject HTTP or embedded credentials', () => {
  assert.equal(normalizeUrl('example.com/path'), 'https://example.com/path');
  assert.equal(normalizeUrl(' HTTPS://example.com/path '), 'https://example.com/path');
  assert.equal(normalizeUrl('//example.com/path'), 'https://example.com/path');
  for (const value of ['http://example.com', 'ftp://example.com', 'javascript:alert(1)', 'https://user:secret@example.com']) assert.throws(() => normalizeUrl(value));
  assert.equal(resourceSchema.safeParse({ ...entry, updated: '2026-11-03', tutorialUrl: 'invalid' }).success, false);
});

test('ordering includes nested entries and values over 90, while ignoring drafts', t => {
  const { root, directory } = contentRoot(t);
  const file = addResource({ ...entry, order: 130 }, { root });
  fs.mkdirSync(path.join(directory, 'websites'));
  fs.renameSync(file, path.join(directory, 'websites', 'example.md'));
  fs.writeFileSync(path.join(directory, '_draft.md'), 'Incomplete draft');
  fs.mkdirSync(path.join(directory, '.private'));
  fs.writeFileSync(path.join(directory, '.private', 'ignored.md'), 'Not an entry');
  assert.equal(nextOrder(directory), 131);
  assert.equal(frontmatter(addResource({ ...entry, title: 'Next tool' }, { root })).order, 131);
});

test('CLI reports invalid arguments with a failing exit status', () => {
  const file = fileURLToPath(new URL('../../tools/add-resource.mjs', import.meta.url));
  const result = spawnSync(process.execPath, [file, '--unsupported-option'], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Add failed/);
});

function git(root, args) { return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim(); }
function gitFixture(t) {
  const base = temporary(t);
  const root = path.join(base, 'checkout');
  const origin = path.join(base, 'origin.git');
  fs.mkdirSync(root);
  git(base, ['init', '--bare', origin]);
  git(root, ['init', '-b', 'main']);
  git(root, ['config', 'user.name', 'Test Author']);
  git(root, ['config', 'user.email', 'test@example.invalid']);
  git(root, ['config', 'commit.gpgsign', 'false']);
  git(root, ['remote', 'add', 'origin', origin]);
  fs.writeFileSync(path.join(root, 'README.md'), '# Fixture\n');
  git(root, ['add', '--all']); git(root, ['commit', '-m', 'Initial fixture']); git(root, ['push', '-u', 'origin', 'main']);
  return { root, origin, base };
}

test('shipping preserves literal shell characters in commit messages', async t => {
  const { root, origin } = gitFixture(t);
  fs.appendFileSync(path.join(root, 'README.md'), 'A reviewed change.\n');
  const message = 'Add "quoted" entry & echo MARKER $(echo nope) `echo nope` %PATH%';
  const logs = [];
  let checked = false;
  const result = await shipProject({ root, message, validate: () => { checked = true; }, log: text => logs.push(text) });
  assert.ok(checked);
  assert.equal(result.pushed, true);
  assert.equal(git(root, ['log', '-1', '--format=%B']), message);
  assert.equal(git(root, ['rev-parse', 'HEAD']), git(root, ['--git-dir', origin, 'rev-parse', 'main']));
  assert.ok(logs.some(text => text.includes('does not confirm a successful deployment')));
});

test('validation failure prevents committing or pushing', async t => {
  const { root, origin } = gitFixture(t);
  const before = git(root, ['rev-parse', 'HEAD']);
  fs.appendFileSync(path.join(root, 'README.md'), 'Unvalidated change.\n');
  await assert.rejects(shipProject({ root, message: 'Must not publish', validate: () => { throw new Error('validation failed'); }, log() {} }), /validation failed/);
  assert.equal(git(root, ['rev-parse', 'HEAD']), before);
  assert.equal(git(root, ['--git-dir', origin, 'rev-parse', 'main']), before);
  assert.ok(git(root, ['status', '--porcelain']));
});

test('clean committed work is pushed, and a synchronized branch is a no-op', async t => {
  const { root } = gitFixture(t);
  fs.appendFileSync(path.join(root, 'README.md'), 'Committed locally.\n');
  git(root, ['add', '--all']); git(root, ['commit', '-m', 'Local change']);
  const result = await shipProject({ root, validate() {}, log() {} });
  assert.equal(result.pushed, true);
  const noop = await shipProject({ root, validate: () => { throw new Error('No check should run'); }, log() {} });
  assert.equal(noop.pushed, false);
});

test('shipping refuses to publish over newer remote work', async t => {
  const { root, base, origin } = gitFixture(t);
  const other = path.join(base, 'other');
  git(base, ['clone', '--branch', 'main', origin, other]);
  git(other, ['config', 'user.name', 'Other Author']); git(other, ['config', 'user.email', 'other@example.invalid']); git(other, ['config', 'commit.gpgsign', 'false']);
  fs.appendFileSync(path.join(other, 'README.md'), 'Remote change.\n');
  git(other, ['add', '--all']); git(other, ['commit', '-m', 'New remote work']); git(other, ['push']);
  const before = git(root, ['rev-parse', 'HEAD']);
  await assert.rejects(shipProject({ root, validate() {}, log() {} }), /newer commits/);
  assert.equal(git(root, ['rev-parse', 'HEAD']), before);
});
