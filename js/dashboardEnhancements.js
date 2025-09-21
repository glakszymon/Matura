/**
 * DashboardEnhancements
 * - Subject progress chart (lines per subject, last 30 days)
 * - Time analysis KPIs (streak, last task, top subject by time)
 * - Daily activity list (recent days summary)
 */
(function dashboardEnhancements() {
  let selectedSubjects = new Set();
  let selectedRange = 30; // default 30d
  let dailyDays = 21; // zakres dni dla listy dziennej wg przedmiotów
  function waitForAnalytics(maxMs = 6000) {
    const start = Date.now();
    return new Promise(resolve => {
      (function check() {
        if (window.analyticsManager && Array.isArray(window.analyticsManager.tasks) && window.analyticsManager.tasks.length >= 0) {
          return resolve(true);
        }
        if (Date.now() - start >= maxMs) return resolve(false);
        setTimeout(check, 100);
      })();
    });
  }

  function groupTasksBySubjectDaily(tasks, days = 30, subjectsFilter = null) {
    const cutoff = days ? new Date(Date.now() - days*24*60*60*1000) : null;
    const bySubDate = {};
    tasks.forEach(t => {
      const subName = t.subject || 'Unknown';
      if (subjectsFilter && subjectsFilter.size && !subjectsFilter.has(subName)) return;
      const dateIso = (t.start_time || t.timestamp || new Date().toISOString());
      const d = new Date(dateIso);
      if (cutoff && d < cutoff) return;
      const dateKey = dateIso.split('T')[0];
      const sub = t.subject || 'Unknown';
      bySubDate[sub] = bySubDate[sub] || {};
      const bucket = (bySubDate[sub][dateKey] = bySubDate[sub][dateKey] || { total: 0, correct: 0 });
      bucket.total += 1;
      const ok = (t.correctness === true) || (t.correctly_completed === 'Yes');
      if (ok) bucket.correct += 1;
    });
    // Build aligned arrays
    const allDates = new Set();
    Object.values(bySubDate).forEach(m => Object.keys(m).forEach(d => allDates.add(d)));
    const dates = Array.from(allDates).sort();
    const series = {};
    Object.keys(bySubDate).forEach(sub => {
      series[sub] = dates.map(d => {
        const b = bySubDate[sub][d];
        if (!b || b.total === 0) return null;
        return Math.round((b.correct / b.total) * 100);
      });
      // forward-fill
      let last = null;
      for (let i = 0; i < series[sub].length; i++) {
        if (series[sub][i] == null) series[sub][i] = last; else last = series[sub][i];
      }
      // backfill head
      const firstIdx = series[sub].findIndex(v => v != null);
      if (firstIdx > 0) for (let i = 0; i < firstIdx; i++) series[sub][i] = series[sub][firstIdx];
    });
    return { dates, series };
  }

  function ensureChartJS() { return typeof Chart !== 'undefined'; }

  function buildSubjectFilterPills(subjects) {
    const host = document.getElementById('subject-filter-pills');
    if (!host) return;
    if (!subjects || !subjects.length) { host.innerHTML = ''; return; }
    // Initialize selection if empty (select all)
    if (!selectedSubjects || selectedSubjects.size === 0) {
      selectedSubjects = new Set(subjects.map(s => s.name || s.subject_name || s));
    }
    host.innerHTML = subjects.map((s, idx) => {
      const name = s.name || s.subject_name || s;
      const active = selectedSubjects.has(name);
      return `<button type="button" class="pill ${active ? 'active' : ''}" data-subject="${name}">${name}</button>`;
    }).join('');
  }

  function bindFilterEvents(tasks, subjects) {
    const pillsHost = document.getElementById('subject-filter-pills');
    if (pillsHost) {
      pillsHost.addEventListener('click', (e) => {
        const btn = e.target.closest('button.pill[data-subject]');
        if (!btn) return;
        const sub = btn.getAttribute('data-subject');
        if (selectedSubjects.has(sub)) selectedSubjects.delete(sub); else selectedSubjects.add(sub);
        // Toggle visual state
        btn.classList.toggle('active');
        // Re-render chart
        renderSubjectProgressChart(tasks);
      });
    }
    const tfHost = document.getElementById('timeframe-pills');
    if (tfHost) {
      tfHost.addEventListener('click', (e) => {
        const btn = e.target.closest('button.pill[data-range]');
        if (!btn) return;
        const r = btn.getAttribute('data-range');
        selectedRange = (r === 'all') ? null : parseInt(r, 10);
        // Toggle visual states
        tfHost.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        renderSubjectProgressChart(tasks);
      });
    }
  }

  function renderSubjectProgressChart(tasks) {
    const canvas = document.getElementById('subject-progress-chart');
    if (!canvas || !ensureChartJS()) return;
    const { dates, series } = groupTasksBySubjectDaily(tasks, selectedRange ?? null, selectedSubjects);
    if (!dates.length) {
      const wrap = canvas.parentElement;
      if (wrap) wrap.innerHTML = '<div class="no-data-message">Brak danych do wyświetlenia</div>';
      return;
    }
    const subjectNames = Object.keys(series);
    const palette = (window.CONFIG?.ANALYTICS?.CHARTS?.SUBJECT_COLORS) || ['#667eea','#764ba2','#10b981','#f59e0b','#ef4444','#3b82f6','#8b5cf6','#06b6d4'];
    const datasets = subjectNames.map((name, idx) => ({
      label: name,
      data: series[name],
      borderColor: palette[idx % palette.length],
      backgroundColor: palette[idx % palette.length] + '33',
      borderWidth: 2,
      fill: false,
      tension: 0.3,
      spanGaps: true,
      pointRadius: 2
    }));
    new Chart(canvas, {
      type: 'line',
      data: {
        labels: dates.map(d => new Date(d).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' })),
        datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        normalized: true,
        plugins: {
          title: { display: false },
          legend: { display: true, position: 'bottom' }
        },
        scales: {
          y: { beginAtZero: true, max: 100, ticks: { callback: v => v + '%' }, title: { display: true, text: 'Dokładność (%)' } }
        }
      }
    });
  }

  function computeKPIs(tasks) {
    // Streak: consecutive days with at least 1 task up to today
    const datesSet = new Set(tasks.map(t => (t.date || (t.start_time || t.timestamp || '').split('T')[0]).slice(0,10)).filter(Boolean));
    const today = new Date();
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(today.getTime() - i*24*60*60*1000);
      const key = d.toISOString().split('T')[0];
      if (datesSet.has(key)) streak++; else break;
    }
    // Last task
    const times = tasks.map(t => new Date(t.end_time || t.start_time || t.timestamp || Date.now()).getTime());
    const lastTs = times.length ? Math.max(...times) : null;
    const lastLabel = lastTs ? new Date(lastTs).toLocaleString('pl-PL') : '—';
    // Time per subject (sum durations when available)
    const timeBySub = {};
    tasks.forEach(t => {
      if (t.start_time && t.end_time) {
        const dur = new Date(t.end_time) - new Date(t.start_time);
        if (dur > 0) {
          const s = t.subject || 'Unknown';
          timeBySub[s] = (timeBySub[s] || 0) + dur;
        }
      }
    });
    const topSub = Object.entries(timeBySub).sort((a,b)=>b[1]-a[1])[0];
    function fmtMin(ms){ return Math.round((ms||0)/60000); }
    return { streak, lastLabel, topSubject: topSub ? { name: topSub[0], minutes: fmtMin(topSub[1]) } : null };
  }

  function computeSubjectStats(tasks) {
    const bySub = {};
    tasks.forEach(t => {
      const s = t.subject || 'Unknown';
      bySub[s] = bySub[s] || { total: 0, correct: 0, dates: [] };
      bySub[s].total += 1;
      const ok = (t.correctness === true) || (t.correctly_completed === 'Yes');
      if (ok) bySub[s].correct += 1;
      const dateKey = (t.date || (t.start_time || t.timestamp || '').split('T')[0]).slice(0,10);
      if (dateKey) bySub[s].dates.push(dateKey);
    });
    // Trend: compare last 7 days vs previous 7
    const trend = (subTasks) => {
      const today = new Date();
      const inRange = (d, days) => new Date(d) >= new Date(today.getTime() - days*24*60*60*1000);
      const last7 = subTasks.filter(d => inRange(d, 7)).length;
      const prev7 = subTasks.filter(d => !inRange(d,7) && inRange(d,14)).length;
      const diff = (prev7 === 0 && last7 > 0) ? 100 : (prev7 > 0 ? Math.round(((last7 - prev7)/prev7)*100) : 0);
      return diff;
    };
    const stats = Object.keys(bySub).map(name => {
      const { total, correct, dates } = bySub[name];
      const acc = total ? Math.round((correct/total)*100) : 0;
      const tr = trend(dates);
      // last activity
      let lastDate = null;
      if (dates.length) {
        lastDate = dates.sort().slice(-1)[0];
      }
      return { name, accuracy: acc, trend: tr, lastDate };
    });
    return stats;
  }

  function renderSubjectMiniCards(tasks) {
    const host = document.getElementById('subject-mini-cards');
    if (!host) return;
    const stats = computeSubjectStats(tasks).sort((a,b)=>b.accuracy-a.accuracy);
    if (!stats.length) { host.innerHTML = ''; return; }
    host.innerHTML = stats.map(s => `
      <div class="mini-card">
        <div>
          <div class="mini-title">${s.name}</div>
          <div class="mini-sub">Ostatnia aktywność: ${s.lastDate ? new Date(s.lastDate).toLocaleDateString('pl-PL') : '—'}</div>
        </div>
        <div>
          <div class="mini-val">${s.accuracy}%</div>
          <div class="mini-trend ${s.trend>=0?'up':'down'}">${s.trend>=0?'▲':'▼'} ${Math.abs(s.trend)}%</div>
        </div>
      </div>
    `).join('');
  }

  function renderKPIs(tasks) {
    const host = document.getElementById('time-analysis-kpis');
    if (!host) return;
    const { streak, lastLabel, topSubject } = computeKPIs(tasks);
    const kpi = (title, value, sub, emoji) => `
      <div class="kpi-card-compact">
        <div class="kpi-row">
          <div class="kpi-emoji">${emoji}</div>
          <div>
            <div class="kpi-title">${title}</div>
            <div class="kpi-value">${value}</div>
            <div class="kpi-sub">${sub || ''}</div>
          </div>
        </div>
      </div>`;
    host.innerHTML = [
      kpi('Passa', `${streak} dni`, 'ciągłej aktywności', '🔥'),
      kpi('Ostatnie zadanie', lastLabel, '', '🕒'),
      kpi('Najwięcej czasu', topSubject ? `${topSubject.name}` : '—', topSubject ? `${topSubject.minutes} min` : '', '⏳')
    ].join('');
  }

  function renderHeatmap(tasks) {
    const host = document.getElementById('activity-heatmap');
    if (!host) return;
    // last 12 weeks (~84 days)
    const days = 84;
    const today = new Date();
    const counts = {};
    tasks.forEach(t => {
      const key = (t.date || (t.start_time || t.timestamp || '').split('T')[0]).slice(0,10);
      if (!key) return; counts[key] = (counts[key]||0)+1;
    });
    const cells = [];
    for (let i=days-1; i>=0; i--) {
      const d = new Date(today.getTime() - i*24*60*60*1000);
      const key = d.toISOString().split('T')[0];
      const c = counts[key] || 0;
      const lvl = c===0?0:c===1?1:c<=3?2:c<=5?3:c<=8?4:5;
      cells.push({ lvl });
    }
    host.innerHTML = cells.map(c => `<div class=\"hm-cell ${c.lvl?('l'+c.lvl):''}\"></div>`).join('');
    host.classList.add('small');
  }

  function renderDailySubjectList(tasks) {
    const host = document.getElementById('daily-subject-list');
    if (!host) return;
    const end = new Date();
    const start = new Date(end.getTime() - dailyDays*24*60*60*1000);
    const bySub = {};
    tasks.forEach(t => {
      const date = (t.date || (t.start_time || t.timestamp || '').split('T')[0]).slice(0,10);
      if (!date) return; const dt = new Date(date);
      if (dt < start || dt > end) return;
      const s = t.subject || 'Unknown';
      bySub[s] = bySub[s] || { total: 0, correct: 0, incorrect: 0 };
      bySub[s].total += 1;
      const ok = (t.correctness === true) || (t.correctly_completed === 'Yes');
      if (ok) bySub[s].correct += 1; else bySub[s].incorrect += 1;
    });
    const rows = Object.entries(bySub).map(([name, v])=>({ name, ...v })).sort((a,b)=>b.total-a.total);
    if (!rows.length) { host.innerHTML = ''; return; }
    host.innerHTML = rows.map(r => `
      <div class="subject-row">
        <div class="subject-name">${r.name}</div>
        <div class="subject-count">${r.total} razem</div>
        <div class="subject-count good">${r.correct} ✓</div>
        <div class="subject-count bad">${r.incorrect} ✗</div>
      </div>
    `).join('');
  }

  function renderDailyActivity(tasks) {
    const host = document.getElementById('daily-activity-list');
    if (!host) return;
    const byDate = {};
    tasks.forEach(t => {
      const date = (t.date || (t.start_time || t.timestamp || '').split('T')[0]).slice(0,10);
      if (!date) return;
      byDate[date] = byDate[date] || { total: 0, correct: 0, examples: [] };
      byDate[date].total += 1;
      const ok = (t.correctness === true) || (t.correctly_completed === 'Yes');
      if (ok) byDate[date].correct += 1;
      if (byDate[date].examples.length < 3) {
        byDate[date].examples.push(t.task_name || t.name || 'Zadanie');
      }
    });
    const dates = Object.keys(byDate).sort().reverse().slice(0, 14);
    if (!dates.length) {
      host.innerHTML = '<div class="no-data-message">Brak aktywności</div>';
      return;
    }
    host.innerHTML = dates.map(d => {
      const it = byDate[d];
      const acc = it.total ? Math.round((it.correct/it.total)*100) : 0;
      const ex = it.examples.join(', ');
      return `
        <div class="day-row">
          <div class="day-date">${new Date(d).toLocaleDateString('pl-PL')}</div>
          <div class="day-metrics">
            <span class="badge">${it.total} zadań</span>
            <span class="badge ${acc>=80?'good':acc>=60?'warn':'bad'}">${acc}%</span>
          </div>
          <div class="day-examples" title="${ex}">${ex}</div>
        </div>`;
    }).join('');
  }

  function renderWeeklyGoal(tasks) {
    const target = (window.CONFIG?.GOALS?.weeklyTasksTarget) ?? 50;
    const hostRing = document.getElementById('goal-ring');
    const valEl = document.getElementById('goal-val');
    const progEl = document.getElementById('goal-progress');
    const targEl = document.getElementById('goal-target');
    const statusEl = document.getElementById('goal-status');
    if (!hostRing || !valEl || !progEl || !targEl || !statusEl) return;
    const now = new Date();
    const startOfWeek = new Date(now); const day = now.getDay(); // 0=Sun
    const diffToMon = (day+6)%7; startOfWeek.setDate(now.getDate()-diffToMon);
    startOfWeek.setHours(0,0,0,0);
    const progress = tasks.filter(t => {
      const ts = new Date(t.end_time || t.start_time || t.timestamp || 0); return ts>=startOfWeek && ts<=now;
    }).length;
    const pct = target>0 ? Math.max(0, Math.min(100, Math.round((progress/target)*100))) : 0;
    hostRing.style.background = `conic-gradient(#3b82f6 ${pct*3.6}deg, var(--gray-200) 0deg)`;
    valEl.textContent = `${pct}%`;
    progEl.textContent = String(progress);
    targEl.textContent = String(target);
    const daysPassed = ((day+6)%7)+1; // Monday=1
    const expectedPct = Math.round((daysPassed/7)*100);
    statusEl.textContent = pct >= expectedPct ? 'Na dobrej drodze' : 'Wymaga pracy';
  }

  function bindExportButtons(tasks) {
    const csvBtn = document.getElementById('export-csv');
    const jsonBtn = document.getElementById('export-json');
    const copyBtn = document.getElementById('copy-link-progress');
    const exportTasks = tasks;
    function toCSV(rows) {
      if (!rows.length) return '';
      const headers = Object.keys(rows[0]);
      const esc = (v)=>`"${String(v??'').replace(/"/g,'""')}"`;
      const lines = [headers.join(',')].concat(rows.map(r=>headers.map(h=>esc(r[h])).join(',')));
      return lines.join('\n');
    }
    function download(filename, content, type) {
      const blob = new Blob([content], { type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href=url; a.download=filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    }
    if (csvBtn) csvBtn.addEventListener('click', ()=>{
      const csv = toCSV(exportTasks);
      download('tasks.csv', csv, 'text/csv;charset=utf-8;');
    });
    if (jsonBtn) jsonBtn.addEventListener('click', ()=>{
      download('tasks.json', JSON.stringify(exportTasks, null, 2), 'application/json');
    });
    if (copyBtn) copyBtn.addEventListener('click', ()=>{
      const url = location.origin + location.pathname + '#subject-progress-section';
      navigator.clipboard?.writeText(url);
    });
  }

  async function start() {
    const ok = await waitForAnalytics();
    if (!ok) return;
    try {
      // Ensure analytics data is loaded
      if (!window.analyticsManager.isDataLoaded) {
        await window.analyticsManager.loadAnalyticsData();
      }
    } catch (_) {}
    const tasks = Array.isArray(window.analyticsManager.tasks) ? window.analyticsManager.tasks : [];
    // Build subject pills from loaded subjects (appData or analytics)
    const subs = (window.appData?.subjects && window.appData.subjects.length) ? window.appData.subjects : (window.analyticsManager.subjects || []);
    buildSubjectFilterPills(subs);
    bindFilterEvents(tasks, subs);
    renderSubjectProgressChart(tasks);
    renderSubjectMiniCards(tasks);
    renderKPIs(tasks);
    renderDailySubjectList(tasks);
    renderWeeklyGoal(tasks);
    bindExportButtons(tasks);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
