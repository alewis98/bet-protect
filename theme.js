(() => {
  const key = 'bet-protect-theme';
  const root = document.documentElement;
  const saved = localStorage.getItem(key);
  if (saved === 'light' || saved === 'dark') root.dataset.theme = saved;
  const mode = () => localStorage.getItem(key) || 'system';
  const update = button => {
    const current = mode();
    button.setAttribute('aria-label', `Theme: ${current}. Choose next theme`);
    button.setAttribute('title', `Theme: ${current} · click to change`);
    const icons = { light:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"/></svg>', dark:'<svg viewBox="0 0 24 24"><path d="M20.5 15.2A8.5 8.5 0 0 1 8.8 3.5 8.5 8.5 0 1 0 20.5 15.2Z"/></svg>', system:'<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="13" rx="1.8"/><path d="M8 21h8M12 17v4"/></svg>' };
    button.innerHTML = `<span class="theme-toggle-icon mode-${current}" aria-hidden="true">${icons[current]}</span><span>${current[0].toUpperCase() + current.slice(1)}</span>`;
  };
  addEventListener('DOMContentLoaded', () => {
    const button = document.querySelector('[data-theme-toggle]');
    if (!button) return;
    update(button);
    button.addEventListener('click', () => {
      const next = {system:'light',light:'dark',dark:'system'}[mode()];
      if (next === 'system') { root.removeAttribute('data-theme'); localStorage.setItem(key, 'system'); }
      else { root.dataset.theme = next; localStorage.setItem(key, next); }
      update(button);
      dispatchEvent(new Event('themechange'));
    });
    matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => { if (mode() === 'system') { update(button); dispatchEvent(new Event('themechange')); } });
  });
})();
