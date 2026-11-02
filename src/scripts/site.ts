const storageKey = 'ai-shelf:saved:v1';
let memorySaved = new Set<string>();
let storageAvailable = true;
let toastTimer: ReturnType<typeof setTimeout>;

export function announce(message: string) {
  const toast = document.querySelector<HTMLElement>('#toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 3600);
}

export function getSaved(): Set<string> {
  if (!storageAvailable) return new Set(memorySaved);
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (Array.isArray(parsed)) memorySaved = new Set(parsed.filter((item): item is string => typeof item === 'string'));
  } catch { storageAvailable = false; }
  return new Set(memorySaved);
}

function syncSaved() {
  const saved = getSaved();
  document.querySelectorAll<HTMLElement>('[data-saved-count]').forEach(el => { el.textContent = String(saved.size); });
  document.querySelectorAll<HTMLButtonElement>('[data-save]').forEach(button => {
    const active = saved.has(button.dataset.save!);
    button.setAttribute('aria-pressed', String(active));
    button.setAttribute('aria-label', `${active ? 'Remove' : 'Save'} ${button.dataset.saveTitle}${active ? ' from my shelf' : ''}`);
    button.title = active ? 'Remove from my shelf' : 'Save for later';
    const label = button.querySelector('[data-save-label]');
    if (label) label.textContent = active ? 'Saved to my shelf' : 'Save to my shelf';
  });
}

document.querySelectorAll<HTMLButtonElement>('[data-save]').forEach(button => {
  button.addEventListener('click', () => {
    const saved = getSaved();
    const id = button.dataset.save!;
    const adding = !saved.has(id);
    if (adding) saved.add(id); else saved.delete(id);
    memorySaved = saved;
    let persisted = true;
    try { if (!storageAvailable) throw new Error('Storage unavailable'); localStorage.setItem(storageKey, JSON.stringify([...saved])); } catch { persisted = false; storageAvailable = false; }
    syncSaved();
    window.dispatchEvent(new Event('shelfchange'));
    announce(persisted ? `${button.dataset.saveTitle} ${adding ? 'saved to' : 'removed from'} your shelf.` : 'Storage is unavailable. Your shelf will last for this page only.');
  });
});
window.addEventListener('storage', syncSaved);
syncSaved();

document.querySelectorAll<HTMLButtonElement>('[data-copy-target]').forEach(button => {
  button.addEventListener('click', async () => {
    const source = document.getElementById(button.dataset.copyTarget!);
    if (!source) return;
    const text = source.textContent || '';
    let copied = false;
    try { await navigator.clipboard.writeText(text); copied = true; }
    catch { /* The complete text remains available for manual selection below. */ }
    if (copied) {
      const label = button.querySelector('span');
      const previous = button.dataset.copyIdleLabel || label?.textContent || 'Copy text';
      button.dataset.copyIdleLabel = previous;
      if (label) label.textContent = 'Copied';
      announce('Copied. Make it your own.');
      setTimeout(() => { if (label) label.textContent = previous || 'Copy text'; }, 2400);
    } else {
      const range = document.createRange();
      range.selectNodeContents(source);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      source.focus();
      announce('Automatic copying is unavailable. The text is selected so you can copy it manually.');
    }
  });
});

const preview = document.querySelector<HTMLDialogElement>('.preview-dialog');
document.querySelector('[data-open-preview]')?.addEventListener('click', () => preview?.showModal());
document.querySelector('[data-close-preview]')?.addEventListener('click', () => preview?.close());
preview?.addEventListener('click', event => { if (event.target === preview) { const bounds = preview.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) preview.close(); } });
