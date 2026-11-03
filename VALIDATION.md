# Validation

Last checked on 3 November 2026 using Node.js 24.16.0, Astro 5.18.2, Anime.js 4.5.0, and Playwright 1.64.1.

- `npm run check`: 0 errors, 0 warnings, 0 hints.
- `npm run build`: successful static build; 31 pages including 24 resource details, the contribution form, and two Learning pages.
- Learning update: four targeted desktop/mobile browser checks passed for article navigation, nine chapter links, table-of-contents targets, accessibility, and overflow on the article and existing core pages. The previous complete browser run remains recorded below; the full suite was not repeated for this update.
- `npm run test:tools`: **12 regression tests passed** for resource creation and Git publishing.
- `npm test`: **36 browser tests passed** on desktop and mobile Chromium.
- Protected-form security suite: **21 tests passed**. `npm run test:security` checks server rejection of invalid requests, private/plain-text delivery, CAPTCHA host/action checks, both rate-limit stages, duplicate suppression, and fail-closed upstream errors using mocked services.
- Browser tests cover closed configuration, resource-specific fields, accepted submissions, persisted cooldown, rate-limit responses, text preservation, mobile overflow, and accessibility, alongside the existing library checks.
- Production activation is pending. The previous owner-authorized Formspree setup test belongs to the former direct-provider implementation; it does not validate the new Vercel/Turnstile/Redis/Resend path.
- Private provider credentials, real Redis Lua concurrency, Vercel function packaging/routing, deployed headers, and inbox delivery must be verified in staging/production before enabling submissions. The old Formspree form must be disabled separately.
- WCAG A/AA automated checks through axe passed on the home, library, skill, prompt, workflow, website detail, and about pages in both viewport profiles.
- No horizontal overflow on those pages in either test profile.
- Search and category combinations, sort order, URL restoration, no-results reset, saved-item persistence, blocked storage, exact clipboard content, failed-copy manual selection, preview focus/Escape behavior, reduced motion, and no-JavaScript reading were exercised.
- Resource tests cover escaped text, real skill/prompt imports, duplicate prevention, invalid input, validation rollback, URL schemes, and ordering through nested folders with excluded drafts.
- Publishing tests use disposable local Git repositories. They verify literal commit-message characters, validation failures preventing publication, already-committed changes being pushed, clean synchronized branches being skipped, and newer remote work preventing a push. No test pushes to GitHub or Vercel.
- Browser counts come from Astro's rendered inventory instead of a second filesystem parser. The production-preview checks can use a separate base URL, including the no-JavaScript case.
- New branding is verified in the header, footer, and page title.
- Actual video playback, manual pause/resume, off-screen pause, persisted motion settings, and Data Saver are checked in both viewport profiles. Playback tests exercise the explicit play control, since mobile browsers can decline autoplay.
- Reduced motion and saved motion-off settings prevent automatic video loading. Reduced motion disables the JavaScript timelines and CSS mist; the static poster remains visible.
- Updated desktop and phone hero previews were visually reviewed, along with the library layout. Browser runtime errors were checked during the visual review; none were reported.

Contrast is measured after the Anime.js entrance settles. Text remains opaque during animation. Reduced-motion behavior is tested independently. Mobile testing uses Chromium emulation; no physical phone or Safari test was performed. Automated accessibility checks do not establish complete WCAG compliance.

The eight-second hero film is a locally rendered, silent H.264 loop at 1280×720 and 24fps. FFprobe confirms one video stream, no audio stream, an exact 8.000-second duration, and a 772,531-byte file. Its WebP poster is 35,568 bytes. The renderer uses the same Fontsource display/body fonts and palette as the site.

Main-thread long tasks were observed during a desktop startup review (67, 161, 56, and 118ms, including page and font initialization). This is a diagnostic observation, not a frame-rate guarantee. No continuous JavaScript animation is used for ambient motion; recurring background mist uses CSS and the hero movement plays from the compressed video. JavaScript motion uses transforms and temporary GPU hints, and is stopped when disabled.

Fonts are self-hosted through the specified Fontsource packages and exact fallback stacks. Site text uses the supplied ink, ink-light, and deep-celadon tokens; ordinary celadon is reserved for graphical marks. Borderless surfaces and separate clipped paper layers preserve visible keyboard focus.

Eleven curated website entries include local screenshots captured on 3 November 2026, source links, credits, and usage notes. These include design tools and agent-skill directories. Earlier starter previews remain labeled editorial illustrations. Screenshot detail pages and enlarged previews use the existing image support. Entries do not imply personal usage unless explicitly stated.

The repository excludes build output, test artifacts, dependencies, and local environment files. It includes the ready-to-use hero film and poster, editable rendering source, lockfile, original design specification, content, tests, GitHub workflow, and Vercel settings. Vercel deployment must be connected separately.
