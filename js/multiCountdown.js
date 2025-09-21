/**
 * MultiCountdownManager
 * Renders up to 5 countdown tiles for upcoming exams defined in CONFIG.EXAMS
 * Falls back to CONFIG.EXAM if EXAMS is empty
 */
(function initMultiCountdown() {
  function fmt(n) { return n.toString().padStart(2, '0'); }
  function diffParts(target) {
    const now = Date.now();
    const t = new Date(target).getTime();
    let d = Math.max(0, t - now);
    const days = Math.floor(d / (1000*60*60*24)); d %= (1000*60*60*24);
    const hours = Math.floor(d / (1000*60*60)); d %= (1000*60*60);
    const minutes = Math.floor(d / (1000*60)); d %= (1000*60);
    const seconds = Math.floor(d / 1000);
    return { days, hours, minutes, seconds, over: t <= now };
  }
  function buildTile(exam, index) {
    const id = `cd-${index}`;
    return `
      <div class="cd-tile" data-date="${exam.date}">
        <div class="cd-title">${exam.name || 'Egzamin'}</div>
        <div class="cd-time" id="${id}">
          <div class="cd-seg"><span class="cd-val" id="${id}-d">0</span><span class="cd-lbl">dni</span></div>
          <div class="cd-seg"><span class="cd-val" id="${id}-h">00</span><span class="cd-lbl">godz</span></div>
          <div class="cd-seg"><span class="cd-val" id="${id}-m">00</span><span class="cd-lbl">min</span></div>
          <div class="cd-seg"><span class="cd-val" id="${id}-s">00</span><span class="cd-lbl">sek</span></div>
        </div>
        <div class="cd-date">${new Date(exam.date).toLocaleDateString('pl-PL')}</div>
      </div>`;
  }
  function startTimers(exams) {
    const timers = exams.map((ex, i) => ({ baseId: `cd-${i}`, date: ex.date }));
    const tick = () => {
      timers.forEach(t => {
        const p = diffParts(t.date);
        const d = document.getElementById(`${t.baseId}-d`);
        const h = document.getElementById(`${t.baseId}-h`);
        const m = document.getElementById(`${t.baseId}-m`);
        const s = document.getElementById(`${t.baseId}-s`);
        if (!d || !h || !m || !s) return;
        if (p.over) {
          d.textContent = '0'; h.textContent = '00'; m.textContent = '00'; s.textContent = '00';
          return;
        }
        d.textContent = String(p.days);
        h.textContent = fmt(p.hours);
        m.textContent = fmt(p.minutes);
        s.textContent = fmt(p.seconds);
      });
    };
    tick();
    setInterval(tick, (window.CONFIG?.EXAM?.COUNTDOWN_UPDATE_INTERVAL) || 1000);
  }
  function render() {
    const host = document.getElementById('countdowns-grid');
    if (!host) return;
    const cfg = (typeof CONFIG !== 'undefined') ? CONFIG : (window.CONFIG || {});
    let exams = Array.isArray(cfg.EXAMS) ? cfg.EXAMS.filter(e => e && e.date) : [];
    if (!exams.length && cfg.EXAM && cfg.EXAM.DATE) {
      exams = [{ name: cfg.EXAM.NAME || 'Egzamin', date: cfg.EXAM.DATE }];
    }
    exams = exams.slice(0, 5);
    if (!exams.length) {
      host.innerHTML = '<div class="no-data-message">Brak skonfigurowanych egzaminów</div>';
      return;
    }
    host.innerHTML = exams.map((ex, i) => buildTile(ex, i)).join('');
    startTimers(exams);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
