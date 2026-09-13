(() => {
  const key = 'bet-protect-theme';
  const root = document.documentElement;
  const saved = localStorage.getItem(key);
  if (saved === 'light' || saved === 'dark') root.dataset.theme = saved;
  const update = button => {
    const dark = root.dataset.theme === 'dark' || (!root.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
    button.setAttribute('aria-pressed', String(dark));
    button.setAttribute('aria-label', dark ? 'Use light mode' : 'Use dark mode');
    button.innerHTML = `<span class="theme-toggle-icon" aria-hidden="true"></span><span>${dark ? 'Light' : 'Dark'}</span>`;
  };
  addEventListener('DOMContentLoaded', () => {
    const button = document.querySelector('[data-theme-toggle]');
    if (!button) return;
    update(button);
    button.addEventListener('click', () => {
      const currentlyDark = root.dataset.theme === 'dark' || (!root.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
      root.dataset.theme = currentlyDark ? 'light' : 'dark';
      localStorage.setItem(key, root.dataset.theme);
      update(button);
    });
    matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => { if (!localStorage.getItem(key)) update(button); });
  });
})();
