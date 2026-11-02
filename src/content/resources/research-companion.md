---
title: Research companion
type: skill
description: Give your agent a repeatable way to find evidence, compare sources, and preserve uncertainty.
tags: [Research, Agent instructions, Original]
updated: 2026-11-02
order: 2
author: Dawas Shlef · starter skill
art: skill
compatibility: Markdown-based agent skills. Supported folders and activation vary by agent.
copyLabel: Copy SKILL.md
copyText: |
  ---
  name: research-companion
  description: Structure a research question, compare primary sources, and report evidence and uncertainty.
  ---

  # Research companion

  1. Restate the research question and the intended audience.
  2. Ask for any missing scope or date range before making assumptions.
  3. If browsing is available, find primary sources and record their URLs and dates.
  4. Separate direct evidence, interpretation, and open questions.
  5. Compare sources and explain disagreements without hiding uncertainty.
  6. Write a short answer with links supporting each substantive claim.
  7. Never invent a source or imply that you browsed when you could not.
steps:
  - Copy the complete SKILL.md text below.
  - Save it as SKILL.md in a research-companion folder inside your agent’s supported skills directory.
  - Ask your agent to use Research companion with a specific question and scope.
---
## A method your agent can return to

This original starter skill makes the research process explicit. It asks the agent to gather primary evidence, distinguish findings from interpretation, and make uncertainty visible.

## Try it with

“Use Research companion to compare two approaches to organizing a small community library. Focus on practical tradeoffs and tell me what information is missing.”

## Before you use it

Check your agent’s documentation for skill locations and activation. The skill does not grant web access; without browsing, the agent should say which claims remain unverified.
