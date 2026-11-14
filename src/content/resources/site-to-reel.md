---
title: Site to Reel
type: skill
description: Turn real website interactions into a vertical promo reel with a storyboard, reproducible rendering, and video quality checks.
tags: [Video, Claude Code, Playwright, FFmpeg]
updated: 2026-11-14
order: 26
url: https://github.com/DAWAS00/site-to-reel
author: DAWAS00
art: skill
compatibility: Claude Code with Playwright CLI, FFmpeg, Python, and the video-director skill.
copyKind: prompt
copyLabel: Copy starter prompt
copyText: |
  Use site-to-reel to plan a 9:16 promo video for [running website URL]. Use [public URL] on screen. The audience is [audience], and the video should show how someone [completes one useful task]. Use [caption language] and the site's own visual identity.

  Capture the actual interface. Use a scratch browser session for any demo state and restore it afterward. Propose a hook, a short beat sheet, and two to four styleframes. Pause for my review before rendering the full silent animatic.
steps:
  - Clone the repository and place the full folder in your Claude Code skills directory as site-to-reel.
  - Start the site you want to film and prepare its public URL, brand assets, audience, and the feature you want to show.
  - Copy the starter prompt and fill in the brackets. Review the treatment and styleframes before moving to the silent cut and then the final export.
---

## What it does

Site to Reel is the workflow behind the Dawas Shlef promo. It uses Playwright to capture real pages and interactions. A canvas renderer draws each frame from a timeline, and FFmpeg encodes the video. The workflow includes stills, a storyboard, and checks on the encoded file.

## Install and prepare

```sh
git clone https://github.com/DAWAS00/site-to-reel.git
```

Copy the cloned folder to `~/.claude/skills/site-to-reel/`. On Windows, place it under `.claude/skills/site-to-reel` in your user folder. Keep `SKILL.md`, `references/`, `templates/`, and `examples/` together. Copy `templates/project/` to a separate working folder for each video. [Installation and project layout](https://github.com/DAWAS00/site-to-reel/blob/8e389b0f5377061b5afaa7cd4d334585ada833c8/README.md)

The workflow uses Playwright CLI for capture and rendering, FFmpeg and ffprobe for encoding and measurement, Python with NumPy and Pillow for production scripts, and `video-director` for timeline and video checks. The skill also documents optional generated narration. [Tool requirements and commands](https://github.com/DAWAS00/site-to-reel/blob/8e389b0f5377061b5afaa7cd4d334585ada833c8/SKILL.md)

## Make your first reel

1. **Treatment and look.** Set the audience, one message, the real site features, the public URL, and the visual identity in `brand.json`. Review the hook, beat sheet, and two to four styleframes.
2. **Silent animatic.** Capture real interactions and arrange them in the timeline. Render a silent preview, then inspect the storyboard and review frames from the encoded video.
3. **Final video.** After approving the timing, add narration or music and captions. Check the exported video and prepare the subtitles and cover. The template starts with a 1080 × 1920 vertical format and supports a 45-second main cut and a 15-second cutdown.

## Try the Dawas Shlef example

Show one library search and one bookmark action. Capture the search result, save a demo resource, then show the saved item in **My shelf**. Remove the demo bookmark afterward. Keep the public site address on the end card.

The example includes timelines, capture scripts, voice lines, and review notes. To render it, capture the site again and supply the fonts and other assets used by the project. [Dawas Shlef worked example](https://github.com/DAWAS00/site-to-reel/blob/8e389b0f5377061b5afaa7cd4d334585ada833c8/examples/dawas-shlef/README.md)

## Full instructions and downloads

- [Download the full skill folder](https://github.com/DAWAS00/site-to-reel/archive/8e389b0f5377061b5afaa7cd4d334585ada833c8.zip)
- [Main skill instructions](https://github.com/DAWAS00/site-to-reel/blob/8e389b0f5377061b5afaa7cd4d334585ada833c8/SKILL.md)
- [Website capture and demo state](https://github.com/DAWAS00/site-to-reel/blob/8e389b0f5377061b5afaa7cd4d334585ada833c8/references/capture.md)
- [Motion, camera, and captions](https://github.com/DAWAS00/site-to-reel/blob/8e389b0f5377061b5afaa7cd4d334585ada833c8/references/motion.md)
- [Sound and narration](https://github.com/DAWAS00/site-to-reel/blob/8e389b0f5377061b5afaa7cd4d334585ada833c8/references/sound-and-voice.md)
- [Reels format, safe areas, and cover](https://github.com/DAWAS00/site-to-reel/blob/8e389b0f5377061b5afaa7cd4d334585ada833c8/references/instagram-reels.md)
- [Troubleshooting](https://github.com/DAWAS00/site-to-reel/blob/8e389b0f5377061b5afaa7cd4d334585ada833c8/references/gotchas.md)
- [Review report template](https://github.com/DAWAS00/site-to-reel/blob/8e389b0f5377061b5afaa7cd4d334585ada833c8/references/report-template.md)
