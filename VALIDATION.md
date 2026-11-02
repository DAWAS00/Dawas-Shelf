# Validation

Checked on 2 November 2026 using Node.js 24.16.0, Astro 5.18.2, Anime.js 4.5.0, and Playwright 1.64.1.

- `npm run check`: 0 errors, 0 warnings, 0 hints.
- `npm run build`: successful static build; 16 pages including 12 resource details.
- `npm test`: **26 tests passed** across desktop Chromium and a mobile Chromium viewport/touch profile.
- WCAG A/AA automated checks through axe passed on the home, library, skill, prompt, workflow, website detail, and about pages in both viewport profiles.
- No horizontal overflow on those pages in either test profile.
- Search and category combinations, sort order, URL restoration, no-results reset, saved-item persistence, blocked storage, exact clipboard content, failed-copy manual selection, preview focus/Escape behavior, reduced motion, and no-JavaScript reading were exercised.
- New branding is verified in the header, footer, and page title.
- Actual video playback, manual pause/resume, off-screen pause, persisted motion settings, and Data Saver are checked in both viewport profiles. Playback tests exercise the explicit play control, since mobile browsers can decline autoplay.
- Reduced motion and saved motion-off settings prevent automatic video loading. Reduced motion disables the JavaScript timelines and CSS mist; the static poster remains visible.
- Updated desktop and phone hero previews were visually reviewed, along with the library layout. Browser runtime errors were checked during the visual review; none were reported.

Contrast is measured after the Anime.js entrance settles. Text remains opaque during animation. Reduced-motion behavior is tested independently. Mobile testing uses Chromium emulation; no physical phone or Safari test was performed. Automated accessibility checks do not establish complete WCAG compliance.

The eight-second hero film is a locally rendered, silent H.264 loop at 1280×720 and 24fps. FFprobe confirms one video stream, no audio stream, an exact 8.000-second duration, and a 772,531-byte file. Its WebP poster is 35,568 bytes. The renderer uses the same Fontsource display/body fonts and palette as the site.

Main-thread long tasks were observed during a desktop startup review (67, 161, 56, and 118ms, including page and font initialization). This is a diagnostic observation, not a frame-rate guarantee. No continuous JavaScript animation is used for ambient motion; recurring background mist uses CSS and the hero movement plays from the compressed video. JavaScript motion uses transforms and temporary GPU hints, and is stopped when disabled.

Fonts are self-hosted through the specified Fontsource packages and exact fallback stacks. Site text uses the supplied ink, ink-light, and deep-celadon tokens; ordinary celadon is reserved for graphical marks. Borderless surfaces and separate clipped paper layers preserve visible keyboard focus.

Website previews in the starter content are labeled original editorial illustrations. Real screenshot fields and enlarged image previews are implemented, but no screenshots of third-party websites are included. The resources are editable starter content, not a statement of the owner’s personal usage.

The repository excludes build output, test artifacts, dependencies, and local environment files. It includes the ready-to-use hero film and poster, editable rendering source, lockfile, original design specification, content, tests, GitHub workflow, and Vercel settings. Vercel deployment must be connected separately.
