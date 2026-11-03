const form = document.querySelector<HTMLFormElement>('#contribution-form');
if (form) {
  const type = form.querySelector<HTMLSelectElement>('#resource-type')!;
  const source = form.querySelector<HTMLInputElement>('#resource-url')!;
  const content = form.querySelector<HTMLTextAreaElement>('#resource-content')!;
  const status = form.querySelector<HTMLElement>('#contribution-status')!;
  const submit = form.querySelector<HTMLButtonElement>('[type="submit"]')!;
  const fields = [...form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input, select, textarea')];
  const enabled = form.dataset.enabled === 'true';
  const key = 'dawas:contribution:next-at';
  let sending = false;
  let nextAt = 0;
  try { nextAt = Number(localStorage.getItem(key)) || 0; } catch { /* Server limits still apply. */ }
  const refresh = () => { submit.disabled = !enabled || sending || Date.now() < nextAt; };
  const cooldown = (seconds: number) => {
    nextAt = Date.now() + seconds * 1000;
    try { localStorage.setItem(key, String(nextAt)); } catch { /* Server limits still apply. */ }
    refresh();
  };
  function updateFields() {
    source.required = ['website', 'repository'].includes(type.value);
    content.required = ['skill', 'prompt', 'workflow'].includes(type.value);
    form!.querySelector('[data-url-required]')!.textContent = source.required ? '*' : '(optional)';
    form!.querySelector('[data-content-required]')!.textContent = content.required ? '*' : '(optional)';
    form!.querySelector('[data-content-label]')!.textContent = ({ skill: 'Skill instructions', prompt: 'Full prompt text', workflow: 'Workflow steps' } as Record<string, string>)[type.value] || 'Instructions or example';
  }
  type.addEventListener('change', updateFields);
  updateFields(); refresh();
  if (Date.now() < nextAt) status.textContent = 'Please wait before sending another suggestion. Your previous submission may already have arrived.';
  const timer = window.setInterval(refresh, 1000);
  window.addEventListener('pagehide', () => clearInterval(timer), { once: true });
  window.addEventListener('storage', event => { if (event.key === key) { nextAt = Number(event.newValue) || 0; refresh(); } });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!enabled || sending || Date.now() < nextAt || !form.reportValidity()) return;
    const values = new FormData(form);
    const token = String(values.get('cf-turnstile-response') || '');
    if (!token) { status.textContent = 'Please complete the verification before sending.'; return; }
    const payload = Object.fromEntries(['type', 'title', 'url', 'description', 'content', 'creator', 'name', 'email', 'website'].map(k => [k, String(values.get(k) || '').trim()]));
    sending = true; refresh();
    fields.forEach(field => { field.disabled = true; });
    form.setAttribute('aria-busy', 'true');
    status.dataset.state = '';
    status.textContent = 'Sending your suggestion…';
    try {
      const response = await fetch('/api/contributions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, credit: values.has('credit'), token }), signal: AbortSignal.timeout(30000) });
      const result = await response.json();
      if (response.status === 429) {
        const seconds = Math.min(86400, Math.max(60, Number(result.retryAfter) || 60));
        cooldown(seconds);
        status.textContent = `Too many suggestions. Please try again in ${Math.ceil(seconds / 60)} minute(s). Your text is still here.`;
      } else if (response.status === 409) {
        cooldown(60);
        status.textContent = 'This suggestion was already received or is being processed. It may have arrived; please do not send it repeatedly. Your text is still here.';
      } else if (response.ok && result.ok === true) {
        form.reset(); updateFields(); cooldown(60);
        status.dataset.state = 'success';
        status.textContent = 'Thank you. Your suggestion has been sent to Dawas for review. It is not published yet. Please wait a minute before sending another.';
      } else {
        status.dataset.state = 'error';
        status.textContent = result.error === 'verification' ? 'Verification expired or failed. Please verify again. Your text is still here.' : result.error === 'validation' ? 'Please check the required fields, HTTPS source, and complete instructions. Your text is still here.' : 'Submissions are temporarily unavailable. Please try again later. Your text is still here.';
      }
    } catch {
      cooldown(60);
      status.dataset.state = 'error';
      status.textContent = 'We couldn’t confirm delivery. Your text is still here. It may have arrived; please wait a minute before retrying.';
    } finally {
      sending = false;
      fields.forEach(field => { field.disabled = false; });
      form.removeAttribute('aria-busy');
      (window as Window & { turnstile?: { reset: () => void } }).turnstile?.reset();
      refresh();
    }
  });
}
