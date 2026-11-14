---
title: SaaS Animation v2
type: skill
description: Storyboard and render short product promos with browser-based 3D, animated illustrations, or Blender.
tags: [Video, Claude Code, Motion Design, Blender]
updated: 2026-11-14
order: 27
art: skill
compatibility: Claude Code with Chrome or Chromium, Node.js, Python, and FFmpeg. Blender is optional for studio-style 3D shots.
copyKind: prompt
copyLabel: Copy starter prompt
copyText: |
  Use /saas-animation to storyboard a [duration]-second promo for [product]. The audience is [audience], and the final call to action is [CTA]. Use the brand assets and UI screenshots in [asset folder]. Deliver in [aspect ratio].

  Propose the rendering approach and a numbered storyboard with timing, camera movement, transitions, and on-screen text. If this is for Site to Reel, match the reel's framing and identify where the animation fits. Show me the storyboard for review before rendering.
steps:
  - Download the skill package using the link below and extract the saas-animation folder.
  - Place that folder in your Claude Code skills directory. Keep SKILL.md, references, scripts, and templates together.
  - Open your video project, run /saas-animation in Claude Code, and use the starter prompt to describe the product and the shot you need.
---

## Download and install

<a href="/downloads/saas-animation-v2.skill" download="saas-animation-v2.skill">Download SaaS Animation v2 (.skill)</a>

The package contains the main instructions, reference guides, scripts, and storyboard and animation templates. It uses ZIP format. If your archive tool needs a `.zip` extension, rename a copy before extracting it.

Put the extracted folder at `.claude/skills/saas-animation/` in your project or `~/.claude/skills/saas-animation/` for personal use across projects. The folder should contain `SKILL.md` directly. Run `/saas-animation` from Claude Code. [Claude Code skill setup](https://code.claude.com/docs/en/skills)

## Pick a rendering approach

- **Browser 3D** for moving product screens, UI panels, and brand assets through a scene.
- **2D puppet animation** for layered illustrations and characters.
- **Blender** for studio lighting, materials, and physical product shots.

Use Node.js 22 or newer for the bundled browser renderer, which uses the built-in `WebSocket`, along with Chrome or Chromium and FFmpeg. The supporting Python scripts use Pillow, NumPy, SciPy, and OpenCV. The Blender route also needs Blender.

## Use it with Site to Reel

Start with a short product brief and a numbered storyboard. Use the supplied templates to build the selected shots, review frames around each transition, then render and add sound.

For a website promo, capture the real interface with Site to Reel. For example, storyboard a short opener that moves from a desktop screen to a vertical preview. Render that opener at the reel's aspect ratio, then follow it with the real site interaction. [Site to Reel guide](/resources/site-to-reel/)
