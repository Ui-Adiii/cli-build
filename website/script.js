const THEME_KEY = 'cli-build-theme';
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;

function applyTheme(theme) {
  if (theme === 'dark') {
    html.setAttribute('data-theme', 'dark');
    themeToggle.querySelector('.icon').textContent = '☀️';
  } else {
    html.removeAttribute('data-theme');
    themeToggle.querySelector('.icon').textContent = '🌙';
  }
}

function getSavedTheme() {
  return localStorage.getItem(THEME_KEY);
}

function toggleTheme() {
  const current = html.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
}

function initTheme() {
  const saved = getSavedTheme();
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (prefersDark ? 'dark' : 'light');
  applyTheme(theme);
}

initTheme();
themeToggle.addEventListener('click', toggleTheme);