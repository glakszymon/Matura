/**
 * Application bootstrap: load shared data once at startup
 * - Fetch subjects once and publish globally for other modules (navigation, forms, etc.)
 */
(function bootstrapApp() {
  const MAX_WAIT_MS = 6000;

  function getConfig() {
    // CONFIG might be a top-level const (not on window)
    if (typeof window !== 'undefined' && window.CONFIG) return window.CONFIG;
    try {
      // eslint-disable-next-line no-undef
      if (typeof CONFIG !== 'undefined') return CONFIG;
    } catch (_) {}
    return null;
  }

  function waitForDeps(timeout = MAX_WAIT_MS) {
    const start = Date.now();
    return new Promise(resolve => {
      (function check() {
        const hasAPI = typeof window !== 'undefined' && (window.GoogleSheetsAPIv2 || window.googleSheetsAPI);
        const hasConfig = !!getConfig();
        if (hasAPI && hasConfig) return resolve(true);
        if (Date.now() - start >= timeout) return resolve(false);
        setTimeout(check, 100);
      })();
    });
  }

  async function loadSubjectsOnce() {
    window.appData = window.appData || {};
    if (Array.isArray(window.appData.subjects) && window.appData.subjects.length > 0) {
      // Already loaded by someone else
      return window.appData.subjects;
    }

    const ready = await waitForDeps();
    if (!ready) {
      console.warn('⚠️ Bootstrap: dependencies not ready; skipping initial subjects load.');
      window.appData.subjects = [];
      window.dispatchEvent(new CustomEvent('subjectsLoaded', { detail: { subjects: [] } }));
      return [];
    }

    const cfg = getConfig();
    try {
      const api = window.googleSheetsAPI || new window.GoogleSheetsAPIv2(cfg);
      let subjects = [];
      if (typeof api.fetchSubjects === 'function') {
        const res = await api.fetchSubjects();
        if (res && res.success && Array.isArray(res.subjects)) {
          subjects = res.subjects.map(s => ({ name: s.name || s.subject_name || s, icon: s.icon || '📚' }));
        }
      } else if (typeof api.getSubjects === 'function') {
        const raw = await api.getSubjects();
        subjects = (raw || []).map(s => ({ name: s.name || s.subject_name || s, icon: s.icon || '📚' }));
      }

      window.appData.subjects = subjects;
      window.dispatchEvent(new CustomEvent('subjectsLoaded', { detail: { subjects } }));
      console.log(`✅ Bootstrap: loaded ${subjects.length} subjects.`);
      return subjects;
    } catch (err) {
      console.error('❌ Bootstrap: error loading subjects:', err);
      window.appData.subjects = [];
      window.dispatchEvent(new CustomEvent('subjectsLoaded', { detail: { subjects: [] } }));
      return [];
    }
  }

  // Kick off as soon as possible
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadSubjectsOnce);
  } else {
    loadSubjectsOnce();
  }
})();
