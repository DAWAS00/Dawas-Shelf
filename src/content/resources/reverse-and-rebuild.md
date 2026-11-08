---
title: Reverse and rebuild
type: skill
description: Study how a program behaves, then rebuild selected features as a Rust desktop app in small, reviewed steps.
tags: [Reverse engineering, Rust, egui, Agent instructions]
updated: 2026-11-08
order: 25
url: https://github.com/DAWAS00/reverse-and-rebuild-skill
author: DAWAS00
art: skill
compatibility: Coding agents with shell and Git access. The desktop build guide uses Rust and egui.
copyKind: prompt
copyLabel: Copy starter prompt
copyText: |
  Use the reverse-and-rebuild skill to study [program or repository] and plan a Rust/egui rebuild of [one feature]. I have permission to inspect the target. Work in [destination project folder].

  Start with a short checklist of questions and the evidence needed to answer them. Record findings as observed, inferred, or unknown. Use a scratch project for live checks. Compare the target with the destination app, then propose the smallest build slice, its tests, and decisions for me to review.

  For this first pass, stop after the study, comparison, and plan. Leave the target data untouched and wait for my decision before implementing or publishing anything.
steps:
  - Install the full skill folder using one of the methods below. Keep its references folder beside SKILL.md.
  - Open the destination project in your coding agent and identify the program and feature you have permission to study.
  - Copy the starter prompt, fill in the bracketed fields, and review the findings and proposed first slice.
---

## What it does

Reverse and rebuild gives a coding agent a method for studying an existing program and rebuilding a selected workflow. It grew out of Diagram Studio, a Rust and egui editor for UML class and sequence diagrams. The evidence, planning, and review steps transfer to other stacks. The GUI architecture and test recipes focus on Rust and egui.

## Install the skill

Use Node.js 22.20 or newer for the `skills` CLI (verified with version 1.7.6). Run this from your destination project and select the agent you use. [CLI package](https://www.npmjs.com/package/skills/v/1.7.6) · [Upstream installation instructions](https://github.com/DAWAS00/reverse-and-rebuild-skill/blob/503fa4a82603ae129ef07bea6af85c81204013cb/README.md#install)

```sh
npx skills add DAWAS00/reverse-and-rebuild-skill
```

With pnpm, run `pnpm dlx skills add DAWAS00/reverse-and-rebuild-skill`. To inspect the package first, append `--list` to the install command.

For another agent, clone the repository and copy the entire `skills/reverse-and-rebuild` directory into that agent's skill directory. You can also point the agent at its `SKILL.md` in your project instructions. Keep `references/` beside the main file because the skill uses relative links. [Download the reviewed revision](https://github.com/DAWAS00/reverse-and-rebuild-skill/archive/503fa4a82603ae129ef07bea6af85c81204013cb.zip)

```sh
git clone https://github.com/DAWAS00/reverse-and-rebuild-skill
```

The bundled Node.js installer supports Node 18 or newer and defaults to `~/.claude/skills`. For a project install, run `node /path/to/reverse-and-rebuild-skill/bin/install.js --project` **from the destination project**, replacing the path with the location of the clone. This copies into `./.claude/skills` in the current directory. Use `--dir` with an explicit destination for a different agent. [Installer source](https://github.com/DAWAS00/reverse-and-rebuild-skill/blob/503fa4a82603ae129ef07bea6af85c81204013cb/bin/install.js)

## What you need for a rebuild

- Git and an agent that can read files and run shell commands. Start with the source when it is available. For behavior you can only see while the app is running, use a scratch file and record what happened.
- Rust and Cargo for the desktop build. Use a signed-in GitHub CLI (`gh`) if your workflow includes pull requests.
- An independent reviewer for build slices. The guide uses Codex in read-only mode and documents alternatives when a second agent is unavailable.

## Follow the seven phases

1. **Study.** List the questions and the evidence needed. Record observations, inferences, and open questions. For live tests, capture the steps, expected result, actual result, and evidence.
2. **Compare.** Run the destination app and compare its behavior with the target. Record what works, what is missing, and which checks you ran.
3. **Rank ideas.** Tie each proposal to a finding. Identify risks, scope for the first release, and decisions the owner needs to make.
4. **Plan execution.** Name the files, tests, and UI changes for each phase. Start with logic, then connect it to the interface.
5. **Plan the workflow.** Settle responsibilities, review gates, and decision records. Keep project status in one tracker.
6. **Build in slices.** Take one behavior at a time. Review the plan, write behavior tests, implement the change, then run formatting, lint, tests, and documentation checks. Review the diff and try the feature in the actual window before publishing an authorized slice.
7. **Test the whole app.** Launch the app from the completed build. Check mouse and keyboard use, focus, errors, Undo and Redo, the supported sizes and themes, and the complete user journey. Keep an acceptance table with evidence.

## Try it with one feature

Use a diagram editor you own or have permission to inspect. Ask the agent to study **Save and Reopen** in a scratch document. Create two nodes and a connection, save the file, close it, then reopen it. Record whether the nodes, positions, and connection persist. Ask for a first slice that implements the save/load round trip with a model-level test and a check in the actual app window. Leave export, themes, and unrelated tools for later decisions.

## Read the complete instructions

These links point to the same reviewed revision so the main file and references stay in sync.

- [SKILL.md and the full workflow](https://github.com/DAWAS00/reverse-and-rebuild-skill/blob/503fa4a82603ae129ef07bea6af85c81204013cb/skills/reverse-and-rebuild/SKILL.md)
- [Evidence rules, target selection, and hand testing](https://github.com/DAWAS00/reverse-and-rebuild-skill/blob/503fa4a82603ae129ef07bea6af85c81204013cb/skills/reverse-and-rebuild/references/reverse-engineering-method.md)
- [Plans, decision records, and acceptance templates](https://github.com/DAWAS00/reverse-and-rebuild-skill/blob/503fa4a82603ae129ef07bea6af85c81204013cb/skills/reverse-and-rebuild/references/templates.md)
- [Builder and independent review loop](https://github.com/DAWAS00/reverse-and-rebuild-skill/blob/503fa4a82603ae129ef07bea6af85c81204013cb/skills/reverse-and-rebuild/references/claude-codex-loop.md)
- [Rust GUI structure and test layers](https://github.com/DAWAS00/reverse-and-rebuild-skill/blob/503fa4a82603ae129ef07bea6af85c81204013cb/skills/reverse-and-rebuild/references/rust-gui-split-and-test.md)
- [Desktop UI design and accessibility](https://github.com/DAWAS00/reverse-and-rebuild-skill/blob/503fa4a82603ae129ef07bea6af85c81204013cb/skills/reverse-and-rebuild/references/desktop-ui-design.md)
- [Subagent roles and example prompts](https://github.com/DAWAS00/reverse-and-rebuild-skill/blob/503fa4a82603ae129ef07bea6af85c81204013cb/skills/reverse-and-rebuild/references/subagents.md)
- [Git and GitHub publishing checklist](https://github.com/DAWAS00/reverse-and-rebuild-skill/blob/503fa4a82603ae129ef07bea6af85c81204013cb/skills/reverse-and-rebuild/references/github-flow.md)

The skill is published under the MIT license. [License](https://github.com/DAWAS00/reverse-and-rebuild-skill/blob/503fa4a82603ae129ef07bea6af85c81204013cb/LICENSE)
