#!/usr/bin/env node
import { execFileSync, execSync } from 'node:child_process';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const PROJECT_ROOT = fileURLToPath(new URL('../', import.meta.url));

export function validateProject(root) {
  const options = { cwd: root, stdio: 'inherit', env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' } };
  // Fixed npm commands work on Windows too; user input is never interpolated here.
  execSync('npm run test:tools', options);
  execSync('npm run check', options);
  execSync('npm run build', options);
}

export async function shipProject({ root = PROJECT_ROOT, message, validate = validateProject, askMessage, log = console.log } = {}) {
  const git = args => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
  const branch = git(['branch', '--show-current']);
  if (!branch) throw new Error('Checkout a branch before shipping; detached HEAD cannot be published.');
  git(['remote', 'get-url', 'origin']);
  git(['fetch', 'origin']);
  const status = git(['status', '--porcelain=v1']);
  let remoteExists = false;
  try { git(['show-ref', '--verify', `refs/remotes/origin/${branch}`]); remoteExists = true; }
  catch (error) { if (error.status !== 1 && error.status !== 128) throw error; }
  let ahead = 0;
  if (remoteExists) {
    const counts = git(['rev-list', '--left-right', '--count', `HEAD...origin/${branch}`]).split(/\s+/).map(Number);
    [ahead] = counts;
    if (counts[1] > 0) throw new Error(`origin/${branch} has newer commits. Integrate them before shipping.`);
  }
  if (!status && remoteExists && !ahead) { log('Working tree and GitHub branch are up to date. Nothing to ship.'); return { pushed: false, branch }; }
  if (status) log(`Changes to include:\n${status}`);
  validate(root);
  if (status) {
    if (!message && askMessage) message = await askMessage();
    message = message?.trim() || 'Update Dawas Shlef content and resources';
    git(['diff', '--check']);
    git(['diff', '--cached', '--check']);
    git(['add', '--all']);
    git(['commit', '-m', message]);
  }
  // Keep the branch and complete commit message as literal arguments, never shell code.
  git(['push', '--set-upstream', 'origin', branch]);
  const sha = git(['rev-parse', 'HEAD']);
  log(`Pushed ${sha.slice(0, 7)} to origin/${branch}.`);
  log('If this repository is connected to Vercel, check its deployment status in Vercel.');
  log('A GitHub push does not confirm a successful deployment. Production uses the configured production branch, usually main.');
  return { pushed: true, branch, sha };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) { console.log('npm run ship -- "Commit message"\nChecks the project, commits all unignored changes, and pushes the current branch.'); return; }
  await shipProject({ message: args.join(' ').trim(), askMessage: async () => {
    if (!input.isTTY) return '';
    const rl = readline.createInterface({ input, output });
    try { return (await rl.question('Commit message [Update Dawas Shlef content and resources]: ')).trim(); }
    finally { rl.close(); }
  } });
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  main().catch(error => { console.error(`Ship failed: ${error.message}`); process.exitCode = 1; });
}
