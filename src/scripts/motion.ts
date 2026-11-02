import { animate, createScope, createTimeline, cubicBezier, stagger, svg, type Scope } from 'animejs';

const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
const button = document.querySelector<HTMLButtonElement>('[data-motion-toggle]');
const preferenceKey = 'dawas-shlef:motion:v1';
let disabledByUser = false;
try { disabledByUser = localStorage.getItem(preferenceKey) === 'off'; } catch { /* Settings still work for this visit. */ }
let scope: Scope | undefined;
let observer: IntersectionObserver | undefined;
let removeInteractions: (() => void) | undefined;
const inkEase = cubicBezier(.16, 1, .3, 1);

function revealCards(cards: HTMLElement[]) {
  if (!cards.length || document.documentElement.dataset.motion !== 'on') return;
  scope?.execute(() => {
    cards.forEach(card => { card.style.willChange = 'transform'; });
    animate(cards, {
      y: [26, 0], rotate: [getComputedStyle(document.documentElement).direction === 'rtl' ? .5 : -.5, 0],
      duration: 850, delay: stagger(65), ease: inkEase,
      onComplete: () => cards.forEach(card => { card.style.removeProperty('transform'); card.style.removeProperty('will-change'); }),
    });
  });
}

function configureMotion() {
  observer?.disconnect();
  removeInteractions?.();
  scope?.revert();
  document.querySelectorAll<HTMLElement>('.resource-card, [data-hero-line]').forEach(el => el.style.removeProperty('will-change'));
  scope = undefined;
  const enabled = !reduced.matches && !disabledByUser;
  document.documentElement.dataset.motion = enabled ? 'on' : 'off';
  document.documentElement.dataset.motionReady = enabled ? 'entering' : 'static';
  if (button) {
    button.hidden = false;
    button.disabled = reduced.matches;
    button.setAttribute('aria-pressed', String(enabled));
    button.setAttribute('aria-label', reduced.matches ? 'Motion disabled by your reduced-motion setting' : enabled ? 'Turn animations off' : 'Turn animations on');
    button.querySelector('[data-motion-label]')!.textContent = enabled ? 'Motion on' : 'Motion off';
    button.title = reduced.matches ? 'Following your device’s reduced-motion setting' : 'Control page motion and automatic video playback';
  }
  window.dispatchEvent(new Event('shelf:motionchange'));
  if (!enabled) return;

  scope = createScope({ root: document.body });
  scope.add(() => {
    const lines = document.querySelectorAll<HTMLElement>('[data-hero-line]');
    const hero = document.querySelector<HTMLElement>('.hero-film');
    if (lines.length && hero) {
      const intro = createTimeline({ defaults: { ease: inkEase, duration: 1100 }, onComplete: () => {
        document.documentElement.dataset.motionReady = 'settled';
        lines.forEach(line => line.style.removeProperty('will-change'));
      } });
      lines.forEach(line => { line.style.willChange = 'transform'; });
      intro.add(lines, { y: ['108%', '0%'], rotate: [1.2, 0], delay: stagger(135) }, 70)
        .add('.hero-kicker', { x: [-16, 0], duration: 1050 }, 0)
        .add('.hero-description, .hero-actions, .hero-footnote', { y: [18, 0], delay: stagger(100), duration: 1000 }, 280)
        .add(hero, { y: [30, 0], rotate: [1.2, 0], duration: 1400 }, 180);
      const thread = svg.createDrawable('.hero-thread path');
      intro.add(thread, { draw: ['0 0', '0 1'], duration: 1600 }, 420);
    } else document.documentElement.dataset.motionReady = 'settled';

    observer = new IntersectionObserver(entries => {
      const entering = entries.filter(entry => entry.isIntersecting && !(entry.target as HTMLElement).hidden).map(entry => entry.target as HTMLElement);
      entering.forEach(card => observer?.unobserve(card));
      revealCards(entering);
    }, { threshold: .08 });
    document.querySelectorAll<HTMLElement>('.resource-card').forEach(card => observer!.observe(card));
  });

  const cleanup: (() => void)[] = [];
  if (finePointer.matches) document.querySelectorAll<HTMLElement>('.card-preview').forEach(preview => {
    const art = preview.querySelector<HTMLElement>('.resource-art, img');
    if (!art) return;
    const enter = () => { scope?.execute(() => animate(art, { scale: 1.035, rotate: .35, duration: 900, ease: inkEase })); };
    const leave = () => { scope?.execute(() => animate(art, { scale: 1, rotate: 0, duration: 1100, ease: inkEase })); };
    preview.addEventListener('pointerenter', enter);
    preview.addEventListener('pointerleave', leave);
    cleanup.push(() => { preview.removeEventListener('pointerenter', enter); preview.removeEventListener('pointerleave', leave); });
  });
  document.querySelectorAll<HTMLButtonElement>('[data-save], [data-copy-target]').forEach(control => {
    const click = () => { scope?.execute(() => animate(control.querySelector('svg') || control, { scale: [1, 1.18, 1], duration: 700, ease: inkEase })); };
    control.addEventListener('click', click);
    cleanup.push(() => control.removeEventListener('click', click));
  });
  removeInteractions = () => cleanup.forEach(remove => remove());
}

button?.addEventListener('click', () => {
  disabledByUser = !disabledByUser;
  try { localStorage.setItem(preferenceKey, disabledByUser ? 'off' : 'on'); } catch { /* Keep the choice in memory when storage is blocked. */ }
  configureMotion();
});
window.addEventListener('library:updated', event => {
  if ((event as CustomEvent<{ animate: boolean }>).detail.animate) revealCards([...document.querySelectorAll<HTMLElement>('[data-resource]:not([hidden])')].filter(card => { const bounds = card.getBoundingClientRect(); return bounds.top < innerHeight && bounds.bottom > 0; }));
});
reduced.addEventListener('change', configureMotion);
finePointer.addEventListener('change', configureMotion);
window.addEventListener('pagehide', () => { scope?.revert(); observer?.disconnect(); removeInteractions?.(); });
window.addEventListener('pageshow', event => { if (event.persisted) configureMotion(); });
configureMotion();
