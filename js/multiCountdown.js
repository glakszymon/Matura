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
    const name = exam.name || 'Egzamin';
    function pickEmoji(n) {
      const s = (n || '').toLowerCase();
      if (s.includes('polski')) return '🇵🇱';
      if (s.includes('matem')) return '➗';
      if (s.includes('angiel')) return '🇬🇧';
      if (s.includes('informat')) return '💻';
      if (s.includes('hist')) return '🏺';
      if (s.includes('biolog')) return '🧬';
      if (s.includes('chem')) return '🧪';
      if (s.includes('fizyk')) return '⚛️';
      return '🎓';
    }
    function colorFromString(str) {
      let h = 0;
      for (let i = 0; i < str.length; i++) {
        h = (h * 31 + str.charCodeAt(i)) >>> 0;
      }
      const hue = h % 360;
      const sat = 65;
      const light = 52;
      return `hsl(${hue} ${sat}% ${light}%)`;
    }
    const accent = colorFromString(name);
    const emoji = pickEmoji(name);
    return `
      <div class="cd-tile" data-date="${exam.date}" style="--cd-accent: ${accent};">
        <div class="cd-title-row"><span class="cd-emoji" aria-hidden="true">${emoji}</span><div class="cd-title">${name}</div></div>
        <div class="cd-time" id="${id}">
          <div class="cd-seg"><span class="cd-val" id="${id}-d">0</span><span class="cd-lbl">dni</span></div>
          <div class="cd-seg"><span class="cd-val" id="${id}-h">00</span><span class="cd-lbl">godz</span></div>
          <div class="cd-seg"><span class="cd-val" id="${id}-m">00</span><span class="cd-lbl">min</span></div>
          <div class="cd-seg"><span class="cd-val cd-sec" id="${id}-s">00</span><span class="cd-lbl">sek</span></div>
        </div>
        <div class="cd-date">${new Date(exam.date).toLocaleDateString('pl-PL')}</div>
        <div class="cd-progress"><div class="cd-progress-fill" id="${id}-p"></div></div>
      </div>`;
  }
  function startTimers(exams) {
    const now0 = Date.now();
    const timers = exams.map((ex, i) => {
      const t = new Date(ex.date).getTime();
      return { baseId: `cd-${i}`, date: ex.date, totalMs: Math.max(1, t - now0) };
    });
    const tick = () => {
      timers.forEach(t => {
        const p = diffParts(t.date);
        const d = document.getElementById(`${t.baseId}-d`);
        const h = document.getElementById(`${t.baseId}-h`);
        const m = document.getElementById(`${t.baseId}-m`);
        const s = document.getElementById(`${t.baseId}-s`);
        const pf = document.getElementById(`${t.baseId}-p`);
        if (!d || !h || !m || !s) return;
        if (p.over) {
          d.textContent = '0'; h.textContent = '00'; m.textContent = '00'; s.textContent = '00';
          if (pf) pf.style.width = '0%';
          const tileOver = (s && s.closest) ? s.closest('.cd-tile') : null;
          if (tileOver) tileOver.style.setProperty('--cd-deg', '0deg');
          return;
        }
        d.textContent = String(p.days);
        h.textContent = fmt(p.hours);
        m.textContent = fmt(p.minutes);
        s.textContent = fmt(p.seconds);
        const remainMs = Math.max(0, new Date(t.date).getTime() - Date.now());
        const ratio = Math.max(0, Math.min(1, remainMs / t.totalMs));
        if (pf) {
          const pct = ratio * 100;
          pf.style.width = pct.toFixed(2) + '%';
        }
        const tile = (pf && pf.closest) ? pf.closest('.cd-tile') : ((s && s.closest) ? s.closest('.cd-tile') : null);
        if (tile) {
          const deg = ratio * 360;
          tile.style.setProperty('--cd-deg', deg.toFixed(2) + 'deg');
        }
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
    // Render all configured exams (no artificial limit)
    if (!exams.length) {
      host.innerHTML = '<div class="no-data-message">Brak skonfigurowanych egzaminów</div>';
      return;
    }
    host.innerHTML = exams.map((ex, i) => buildTile(ex, i)).join('');
    // Entrance animation (stagger)
    const tiles = host.querySelectorAll('.cd-tile');
    tiles.forEach((el, i) => {
      setTimeout(() => el.classList.add('reveal'), i * 60);
    });
    startTimers(exams);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
