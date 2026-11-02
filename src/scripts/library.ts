import { getSaved } from './site';

const library = document.querySelector<HTMLElement>('[data-library]');
if (library) {
  const search = library.querySelector<HTMLInputElement>('#resource-search')!;
  const sort = library.querySelector<HTMLSelectElement>('#sort-order')!;
  const cards = Array.from(library.querySelectorAll<HTMLElement>('[data-resource]'));
  const grid = library.querySelector<HTMLElement>('#resource-grid')!;
  const filters = Array.from(library.querySelectorAll<HTMLButtonElement>('[data-filter]'));
  const savedFilter = library.querySelector<HTMLButtonElement>('[data-saved-filter]')!;
  let type = 'all';
  let savedOnly = false;
  const normalize = (text: string) => text.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  function fromUrl() {
    const params = new URLSearchParams(location.search);
    type = filters.some(b => b.dataset.filter === params.get('type')) ? params.get('type')! : 'all';
    search.value = params.get('q') || '';
    savedOnly = params.get('saved') === '1';
    sort.value = ['curated', 'newest', 'az'].includes(params.get('sort') || '') ? params.get('sort')! : 'curated';
    update(false);
  }

  function update(writeUrl = true, animateCards = false) {
    const words = normalize(search.value.trim()).split(/\s+/).filter(Boolean);
    const saved = getSaved();
    const ordered = [...cards].sort((a, b) => {
      if (sort.value === 'az') return a.dataset.title!.localeCompare(b.dataset.title!);
      if (sort.value === 'newest') return b.dataset.updated!.localeCompare(a.dataset.updated!) || Number(a.dataset.order) - Number(b.dataset.order);
      return Number(a.dataset.order) - Number(b.dataset.order);
    });
    let shown = 0;
    ordered.forEach(card => {
      const visible = (type === 'all' || card.dataset.type === type) && (!savedOnly || saved.has(card.dataset.resource!)) && words.every(word => normalize(card.dataset.search!).includes(word));
      card.hidden = !visible;
      if (visible) shown++;
      grid.append(card);
    });
    filters.forEach(button => { const selected = button.dataset.filter === type; button.classList.toggle('selected', selected); button.setAttribute('aria-pressed', String(selected)); });
    savedFilter.setAttribute('aria-pressed', String(savedOnly));
    library!.querySelector('#result-count')!.textContent = `${shown} ${shown === 1 ? 'resource' : 'resources'} ${savedOnly ? 'on your shelf' : 'to explore'}`;
    library!.querySelector<HTMLElement>('#empty-state')!.hidden = shown > 0;
    library!.querySelector('#empty-message')!.textContent = savedOnly ? 'Save something with the bookmark button, or clear your filters to explore the library.' : 'Try a different search, or give another category a look.';
    if (writeUrl) {
      const params = new URLSearchParams();
      if (type !== 'all') params.set('type', type);
      if (search.value.trim()) params.set('q', search.value.trim());
      if (savedOnly) params.set('saved', '1');
      if (sort.value !== 'curated') params.set('sort', sort.value);
      history.replaceState(null, '', `${location.pathname}${params.size ? `?${params}` : ''}${location.hash}`);
    }
    window.dispatchEvent(new CustomEvent('library:updated', { detail: { animate: animateCards } }));
  }
  search.addEventListener('input', () => update());
  library.querySelector('form')!.addEventListener('submit', event => { event.preventDefault(); update(); });
  sort.addEventListener('change', () => update(true, true));
  filters.forEach(button => button.addEventListener('click', () => { type = button.dataset.filter!; update(true, true); }));
  savedFilter.addEventListener('click', () => { savedOnly = !savedOnly; update(); });
  library.querySelector('[data-reset]')!.addEventListener('click', () => { type = 'all'; search.value = ''; sort.value = 'curated'; savedOnly = false; update(); search.focus(); });
  window.addEventListener('shelfchange', () => update(false));
  window.addEventListener('storage', () => update(false));
  window.addEventListener('popstate', fromUrl);
  document.addEventListener('keydown', event => { if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey && !(event.target instanceof HTMLElement && (event.target.matches('input,textarea,select') || event.target.isContentEditable))) { event.preventDefault(); search.focus(); } });
  fromUrl();
}
