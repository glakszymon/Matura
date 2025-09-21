(function(){
  const STORAGE_KEY = (window.CONFIG && CONFIG.STORAGE_KEYS && CONFIG.STORAGE_KEYS.THEME_PREFERENCE) ? CONFIG.STORAGE_KEYS.THEME_PREFERENCE : 'themePreference';

  function getStoredTheme(){
    try { return localStorage.getItem(STORAGE_KEY); } catch(e){ return null; }
  }
  function setStoredTheme(theme){
    try { localStorage.setItem(STORAGE_KEY, theme); } catch(e){}
  }
  function prefersDark(){
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  function applyTheme(theme){
    const isDark = theme === 'dark';
    document.body.classList.toggle('theme-dark', isDark);
    // Dark extras toggle based on CONFIG flag
    try {
      const cfg = (typeof CONFIG !== 'undefined') ? CONFIG : (window.CONFIG || {});
      const extras = !!cfg.DARK_MODE_EXTRAS_ENABLED;
      if (isDark && extras) document.body.classList.add('dark-extras');
      else document.body.classList.remove('dark-extras');
    } catch(_) {}
    setStoredTheme(isDark ? 'dark' : 'light');
    updateToggleIcon();
  }
  function updateToggleIcon(){
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    const isDark = document.body.classList.contains('theme-dark');
    btn.textContent = isDark ? '☀️' : '🌙';
    btn.setAttribute('aria-label', isDark ? 'Przełącz motyw na jasny' : 'Przełącz motyw na ciemny');
    btn.setAttribute('title', isDark ? 'Przełącz na jasny' : 'Przełącz na ciemny');
  }
  function initTheme(){
    let theme = getStoredTheme();
    if (!theme) theme = prefersDark() ? 'dark' : 'light';
    applyTheme(theme);
  }
  function toggleTheme(){
    const isDark = document.body.classList.contains('theme-dark');
    applyTheme(isDark ? 'light' : 'dark');
  }

  document.addEventListener('DOMContentLoaded', function(){
    initTheme();
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.addEventListener('click', toggleTheme);
  });
})();
