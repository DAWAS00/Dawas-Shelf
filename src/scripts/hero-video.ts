const video = document.querySelector<HTMLVideoElement>('#hero-film');
const toggle = document.querySelector<HTMLButtonElement>('[data-video-toggle]');
if (video && toggle) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  let manualPause = false;
  let inView = false;
  let failed = false;
  let wantsPlayback = false;
  // Wait for the motion module to read the visitor's saved choice before fetching media.
  const motionAllowed = () => !reduced.matches && document.documentElement.dataset.motion === 'on';
  const updateButton = () => {
    const playing = !video.paused && !video.ended;
    toggle.setAttribute('aria-label', playing ? 'Pause hero video' : 'Play hero video');
    toggle.setAttribute('aria-pressed', String(playing));
    toggle.querySelector('[data-video-label]')!.textContent = failed ? 'Film unavailable' : playing ? 'Pause film' : 'Play film';
    toggle.querySelector('[data-play-icon]')!.textContent = playing ? 'Ⅱ' : '▷';
  };
  const stop = () => { wantsPlayback = false; video.pause(); updateButton(); };
  const play = async (explicit = false) => {
    if (failed || !inView || document.hidden || (!explicit && (!motionAllowed() || manualPause || connection?.saveData))) return;
    if (!video.getAttribute('src')) video.src = video.dataset.videoSrc!;
    wantsPlayback = true;
    try {
      await video.play();
      if (!wantsPlayback) video.pause();
    } catch { /* Autoplay can be refused; the poster and explicit play control remain. */ }
    updateButton();
  };
  toggle.hidden = false;
  toggle.addEventListener('click', () => {
    if (video.paused) { manualPause = false; void play(true); }
    else { manualPause = true; stop(); }
  });
  video.addEventListener('play', updateButton);
  video.addEventListener('pause', updateButton);
  video.addEventListener('error', () => { failed = true; stop(); toggle.disabled = true; });
  window.addEventListener('shelf:motionchange', () => { if (motionAllowed()) void play(); else stop(); });
  reduced.addEventListener('change', () => { if (reduced.matches) stop(); else void play(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else void play(); });
  const observer = new IntersectionObserver(entries => {
    inView = entries[0].isIntersecting;
    if (inView) void play(); else stop();
  }, { threshold: .1 });
  observer.observe(video);
  window.addEventListener('pagehide', () => { observer.disconnect(); stop(); }, { once: true });
  window.addEventListener('pageshow', event => { if (event.persisted) { observer.observe(video); void play(); } });
}
