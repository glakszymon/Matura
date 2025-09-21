/**
 * Enhanced Subject Time Analysis Manager
 * Handles individual subject tabs with detailed time analysis
 */
class SubjectTimeAnalysisManager {
    constructor(analyticsManager) {
        this.analyticsManager = analyticsManager;
        // Try to access ChartsManager from provided manager/app or global app
        this.chartsManager = (analyticsManager && analyticsManager.chartsManager) 
            || (window.enhancedAnalyticsApp && window.enhancedAnalyticsApp.chartsManager) 
            || (typeof ChartsManager !== 'undefined' ? new ChartsManager(analyticsManager) : null);
        this.subjects = {};
        this.activeSubjectTab = null;
        this.subjectSubTabs = document.getElementById('subject-sub-tabs');
        this.subjectTabContents = document.getElementById('subject-tab-contents');
        this.subjectsOverview = document.getElementById('subjects-overview');
        // Per-subject timeframe selection (Option A)
        this.subjectTimeframe = {};
        
        this.init();
    }
    
    init() {
        console.log('🚀 Subject Time Analysis Manager initialized');
    }
    
    /**
     * Render subject tabs based on available analytics data
     */
    renderSubjectTabs(subjectAnalytics) {
        if (!this.subjectSubTabs || !this.subjectTabContents) {
            console.error('Subject tabs containers not found');
            return;
        }
        
        this.subjects = subjectAnalytics;
        const subjectNames = Object.keys(subjectAnalytics);
        
        if (subjectNames.length === 0) {
            this.showNoSubjectsMessage();
            return;
        }
        
        // Generate subject tabs
        const tabsHTML = subjectNames.map(subjectName => {
            const subject = subjectAnalytics[subjectName];
            const icon = this.getSubjectIcon(subjectName);
            const stats = subject.stats || {};
            
            return `
                <button class="subject-sub-tab" data-subject="${this.escapeHtml(subjectName)}">
                    <span class="subject-sub-tab-icon">${icon}</span>
                    <span class="subject-sub-tab-label">${this.escapeHtml(subjectName)}</span>
                    <span class="subject-sub-tab-stats">${stats.totalTasks || 0} zadań</span>
                </button>
            `;
        }).join('');
        
        this.subjectSubTabs.innerHTML = `
            <button class="subject-sub-tab active" data-subject="overview">
                <span class="subject-sub-tab-icon">📊</span>
                <span class="subject-sub-tab-label">Przegląd wszystkich</span>
            </button>
            ${tabsHTML}
        `;
        
        // Generate subject content areas
        const contentsHTML = subjectNames.map(subjectName => `
            <div class="subject-tab-content" id="subject-content-${this.getSafeId(subjectName)}">
                <!-- Content will be populated when tab is activated -->
            </div>
        `).join('');
        
        this.subjectTabContents.innerHTML = contentsHTML;
        
        // Setup event listeners
        this.setupTabEventListeners();
        
        // Show overview by default
        this.showOverview();
    }
    
    /**
     * Setup event listeners for subject tabs
     */
    setupTabEventListeners() {
        const tabs = this.subjectSubTabs.querySelectorAll('.subject-sub-tab');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const subjectName = tab.getAttribute('data-subject');
                
                // Update active tab
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                if (subjectName === 'overview') {
                    this.showOverview();
                } else {
                    this.showSubjectAnalysis(subjectName);
                }
            });
        });
    }
    
    /**
     * Show overview of all subjects
     */
    showOverview() {
        this.activeSubjectTab = 'overview';
        
        // Hide individual subject contents
        const subjectContents = this.subjectTabContents.querySelectorAll('.subject-tab-content');
        subjectContents.forEach(content => content.classList.remove('active'));
        
        // Show subjects overview
        if (this.subjectsOverview) {
            this.subjectsOverview.classList.remove('hidden');
        }
    }
    
    /**
     * Show detailed analysis for a specific subject
     */
    showSubjectAnalysis(subjectName) {
        this.activeSubjectTab = subjectName;
        const subject = this.subjects[subjectName];
        
        if (!subject) {
            console.error(`Subject ${subjectName} not found`);
            return;
        }
        
        // Hide overview
        if (this.subjectsOverview) {
            this.subjectsOverview.classList.add('hidden');
        }
        
        // Hide all subject contents
        const subjectContents = this.subjectTabContents.querySelectorAll('.subject-tab-content');
        subjectContents.forEach(content => content.classList.remove('active'));
        
        // Show active subject content
        const activeContent = document.getElementById(`subject-content-${this.getSafeId(subjectName)}`);
        if (activeContent) {
            activeContent.classList.add('active');
            this.renderSubjectTimeAnalysis(activeContent, subject, subjectName);
        }
    }
    
    /**
     * Render enhanced time analysis for a specific subject
     */
    renderSubjectTimeAnalysis(container, subject, subjectName) {
        // Get data and timeframe
        const allTasks = subject.tasks || [];
        const timeframeKey = this.subjectTimeframe[subjectName] || 'MONTH';
        const filteredTasks = this.filterTasksByTimeframe(allTasks, timeframeKey);
        const timeAnalysis = this.computeEnhancedTimeAnalysis(allTasks); // KPIs overall for now
        const stats = subject.stats || subject.performance || {};
        const safeId = this.getSafeId(subjectName);
        const icon = this.getSubjectIcon(subjectName);
        const cfg = (this.analyticsManager && this.analyticsManager.config) || window.CONFIG || {};
        const periodsCfg = cfg?.ANALYTICS?.PERFORMANCE_OVER_TIME?.TIME_PERIODS || {
            WEEK: { days: 7, label: 'Ostatni tydzień' },
            MONTH: { days: 30, label: 'Ostatni miesiąc' },
            QUARTER: { days: 90, label: 'Ostatnie 3 miesiące' },
            ALL: { days: null, label: 'Cały okres' }
        };
        const timeframeLabel = periodsCfg[timeframeKey]?.label || '';
        const accent = this.pickSubjectAccent(subjectName);

        // KPIs
        const total = stats.totalTasks || stats.total || allTasks.length || 0;
        const accuracy = (stats.accuracy != null ? stats.accuracy : timeAnalysis.overallAccuracy) || 0;
        const lastDate = this.getLastActivityDate(allTasks);
        const activeDays = this.countActiveDays(allTasks);

        const html = `
            <div class="subject-view" style="--subject-accent: ${accent};">
                <div class="subject-header">
                    <div class="subject-header-top">
                        <div class="subject-title">
                            <span class="subject-emoji">${icon}</span>
                            <h2 class="subject-name">${this.escapeHtml(subjectName)}</h2>
                        </div>
                        <div class="subject-timeframe" role="tablist" aria-label="Zakres czasu">
                            <button class="chart-control-btn ${timeframeKey==='WEEK' ? 'active' : ''}" data-period="WEEK" aria-pressed="${timeframeKey==='WEEK'}">Tydzień</button>
                            <button class="chart-control-btn ${timeframeKey==='MONTH' ? 'active' : ''}" data-period="MONTH" aria-pressed="${timeframeKey==='MONTH'}">30 dni</button>
                            <button class="chart-control-btn ${timeframeKey==='QUARTER' ? 'active' : ''}" data-period="QUARTER" aria-pressed="${timeframeKey==='QUARTER'}">90 dni</button>
                            <button class="chart-control-btn ${timeframeKey==='ALL' ? 'active' : ''}" data-period="ALL" aria-pressed="${timeframeKey==='ALL'}">Wszystko</button>
                        </div>
                    </div>
                    <div class="subject-kpis">
                        <div class="kpi-card" aria-label="Zadania razem">
                            <div class="kpi-label">Zadania</div>
                            <div class="kpi-value">${total}</div>
                            <div class="kpi-sub">łącznie</div>
                        </div>
                        <div class="kpi-card" aria-label="Ogólna dokładność">
                            <div class="kpi-label">Dokładność</div>
                            <div class="kpi-value">${accuracy}%</div>
                            <div class="kpi-sub">ogólna</div>
                        </div>
                        <div class="kpi-card" aria-label="Ostatnia aktywność">
                            <div class="kpi-label">Ostatnia aktywność</div>
                            <div class="kpi-value">${lastDate || '—'}</div>
                            <div class="kpi-sub">data</div>
                        </div>
                        <div class="kpi-card" aria-label="Aktywne dni">
                            <div class="kpi-label">Dni aktywności</div>
                            <div class="kpi-value">${activeDays}</div>
                            <div class="kpi-sub">unikalne</div>
                        </div>
                    </div>
                </div>

                <div class="subject-time-analysis">
                    <!-- Optional: keep enhanced metric cards as before -->
                    <div class="subject-chart-card">
                        <div class="subject-chart-head">
                            <h3 class="subject-chart-title">📈 Zadania dziennie</h3>
                            <div class="subject-chart-subtitle">${timeframeLabel}</div>
                        </div>
                        <div class="skeleton skeleton-rect" id="skeleton-tasks-${safeId}"></div>
                        <div class="enhanced-chart-container" id="subject-daily-tasks-${safeId}"></div>
                    </div>

                    <div class="subject-chart-card">
                        <div class="subject-chart-head">
                            <h3 class="subject-chart-title">🎯 Dokładność dziennie</h3>
                            <div class="subject-chart-subtitle">${timeframeLabel}</div>
                        </div>
                        <div class="skeleton skeleton-rect" id="skeleton-acc-${safeId}"></div>
                        <div class="enhanced-chart-container" id="subject-daily-accuracy-${safeId}"></div>
                    </div>

                    <div class="subject-chart-card">
                        <div class="subject-chart-head">
                            <h3 class="subject-chart-title">🏷️ Dokładność kategorii w czasie</h3>
                            <div class="subject-chart-subtitle">${timeframeLabel}</div>
                        </div>
                        <div class="skeleton skeleton-rect" id="skeleton-cat-${safeId}"></div>
                        <div class="enhanced-chart-container" id="subject-category-accuracy-${safeId}"></div>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;

        // Render charts (filtered by timeframe)
        if (this.chartsManager) {
            const overallAcc = stats.accuracy || timeAnalysis.overallAccuracy || 0;
            // Remove skeletons once charts are drawn
            setTimeout(() => {
                const s1 = document.getElementById(`skeleton-tasks-${safeId}`);
                const s2 = document.getElementById(`skeleton-acc-${safeId}`);
                const s3 = document.getElementById(`skeleton-cat-${safeId}`);
                if (s1) s1.remove();
                if (s2) s2.remove();
                if (s3) s3.remove();
            }, 50);

            this.chartsManager.createDailyTasksStackedChart(filteredTasks, `subject-daily-tasks-${safeId}`);
            this.chartsManager.createDailyAccuracyWithOverallLineChart(filteredTasks, overallAcc, `subject-daily-accuracy-${safeId}`);
            this.chartsManager.createCategoryAccuracyLineChart(filteredTasks, `subject-category-accuracy-${safeId}`);
        }

        // Timeframe switching events
        const header = container.querySelector('.subject-header');
        if (header) {
            header.addEventListener('click', (e) => {
                const btn = e.target.closest('button.chart-control-btn');
                if (!btn) return;
                const period = btn.getAttribute('data-period');
                if (!period) return;
                this.subjectTimeframe[subjectName] = period;
                // Re-render the view for this subject
                this.renderSubjectTimeAnalysis(container, subject, subjectName);
            });
        }
    }
    
    /**
     * Compute enhanced time analysis for a subject
     */
    computeEnhancedTimeAnalysis(tasks) {
        const periods = {
            MORNING: { label: 'Rano (6:00–12:00)', emoji: '🌅', start: 6, end: 12, total: 0, correct: 0, totalTime: 0 },
            AFTERNOON: { label: 'Popołudnie (12:00–18:00)', emoji: '☀️', start: 12, end: 18, total: 0, correct: 0, totalTime: 0 },
            EVENING: { label: 'Wieczór (18:00–24:00)', emoji: '🌙', start: 18, end: 24, total: 0, correct: 0, totalTime: 0 },
            NIGHT: { label: 'Noc (0:00–6:00)', emoji: '🌃', start: 0, end: 6, total: 0, correct: 0, totalTime: 0 }
        };
        
        const categoryTime = {};
        let totalStudyTime = 0;
        
        (tasks || []).forEach(task => {
            const ts = task.start_time || task.timestamp;
            const hour = ts ? new Date(ts).getHours() : null;
            if (hour === null || isNaN(hour)) return;
            
            let periodKey;
            if (hour >= 6 && hour < 12) periodKey = 'MORNING';
            else if (hour >= 12 && hour < 18) periodKey = 'AFTERNOON';
            else if (hour >= 18 && hour < 24) periodKey = 'EVENING';
            else periodKey = 'NIGHT';
            
            periods[periodKey].total++;
            if (this.isTaskCorrect(task)) periods[periodKey].correct++;
            
            // Calculate time spent if available
            if (task.start_time && task.end_time) {
                const duration = new Date(task.end_time) - new Date(task.start_time);
                if (duration > 0) {
                    periods[periodKey].totalTime += duration;
                    totalStudyTime += duration;
                    
                    // Track category time
                    const category = task.category || 'Unknown';
                    if (!categoryTime[category]) {
                        categoryTime[category] = { name: category, totalTime: 0, tasks: 0 };
                    }
                    categoryTime[category].totalTime += duration;
                    categoryTime[category].tasks++;
                }
            }
        });
        
        // Process periods
        const periodStats = Object.entries(periods).map(([key, period]) => {
            if (period.total > 0) {
                const accuracy = Math.round((period.correct / period.total) * 100);
                return {
                    key,
                    ...period,
                    accuracy,
                    averageTime: period.total > 0 ? Math.round(period.totalTime / period.total) : 0
                };
            }
            return null;
        }).filter(p => p !== null);
        
        // Find best/worst periods (minimum 3 tasks for reliability)
        const reliablePeriods = periodStats.filter(p => p.total >= 3);
        const bestPeriod = reliablePeriods.length > 0 ? 
            reliablePeriods.reduce((best, current) => current.accuracy > best.accuracy ? current : best) : 
            (periodStats.length > 0 ? periodStats[0] : null);
            
        const worstPeriod = reliablePeriods.length > 0 ? 
            reliablePeriods.reduce((worst, current) => current.accuracy < worst.accuracy ? current : worst) : 
            (periodStats.length > 1 ? periodStats[periodStats.length - 1] : null);
        
        // Process categories
        const categoryStats = Object.values(categoryTime)
            .map(cat => ({
                ...cat,
                averageTime: cat.tasks > 0 ? Math.round(cat.totalTime / cat.tasks) : 0,
                formattedTime: this.formatDuration(cat.totalTime),
                formattedAverage: this.formatDuration(cat.tasks > 0 ? cat.totalTime / cat.tasks : 0)
            }))
            .sort((a, b) => b.totalTime - a.totalTime);
        
        // Generate recommendations
        const recommendations = this.generateTimeRecommendations(bestPeriod, worstPeriod, periodStats);
        
        return {
            periods: periodStats,
            bestPeriod,
            worstPeriod,
            categories: categoryStats,
            totalStudyTime: this.formatDuration(totalStudyTime),
            overallAccuracy: periodStats.length > 0 ? 
                Math.round((periodStats.reduce((sum, p) => sum + p.correct, 0) / 
                           periodStats.reduce((sum, p) => sum + p.total, 0)) * 100) : 0,
            recommendations
        };
    }
    
    /**
     * Render time period card
     */
    renderTimePeriodCard(period) {
        const accuracyClass = period.accuracy >= 80 ? 'success' : period.accuracy >= 60 ? 'warning' : 'error';
        
        return `
            <div class="subject-time-card">
                <div class="subject-time-card-header">
                    <div class="subject-time-card-icon">${period.emoji}</div>
                    <div>
                        <h3 class="subject-time-card-title">${period.label}</h3>
                        <p class="subject-time-card-subtitle">${period.total} zadań</p>
                    </div>
                </div>
                <div class="time-period-details">
                    <div class="time-detail">
                        <span class="time-detail-label">Skuteczność:</span>
                        <span class="time-detail-value ${accuracyClass}">${period.accuracy}%</span>
                    </div>
                    <div class="time-detail">
                        <span class="time-detail-label">Łączny czas:</span>
                        <span class="time-detail-value">${this.formatDuration(period.totalTime)}</span>
                    </div>
                    <div class="time-detail">
                        <span class="time-detail-label">Śr. na zadanie:</span>
                        <span class="time-detail-value">${this.formatDuration(period.averageTime)}</span>
                    </div>
                    <div class="time-detail">
                        <span class="time-detail-label">Poprawne:</span>
                        <span class="time-detail-value">${period.correct}/${period.total}</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Render category time card
     */
    renderCategoryTimeCard(category) {
        return `
            <div class="subject-time-card">
                <div class="subject-time-card-header">
                    <div class="subject-time-card-icon">🏷️</div>
                    <div>
                        <h3 class="subject-time-card-title">${this.escapeHtml(category.name)}</h3>
                        <p class="subject-time-card-subtitle">${category.tasks} zadań</p>
                    </div>
                </div>
                <div class="time-period-details">
                    <div class="time-detail">
                        <span class="time-detail-label">Łączny czas:</span>
                        <span class="time-detail-value">${category.formattedTime}</span>
                    </div>
                    <div class="time-detail">
                        <span class="time-detail-label">Średnio na zadanie:</span>
                        <span class="time-detail-value">${category.formattedAverage}</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Generate time-based recommendations
     */
    generateTimeRecommendations(bestPeriod, worstPeriod, periods) {
        const recommendations = [];
        
        if (bestPeriod && bestPeriod.total >= 3) {
            recommendations.push({
                type: 'positive',
                emoji: bestPeriod.emoji,
                title: 'Najlepsza pora dnia',
                message: `Najlepiej radzisz sobie ${bestPeriod.label.toLowerCase()} z dokładnością ${bestPeriod.accuracy}%. Planuj najważniejsze zadania w tym czasie.`
            });
        }
        
        if (worstPeriod && worstPeriod.total >= 3 && worstPeriod.accuracy < 60) {
            recommendations.push({
                type: 'warning',
                emoji: '⚠️',
                title: 'Pora do poprawy',
                message: `${worstPeriod.label} to czas z najniższą skutecznością (${worstPeriod.accuracy}%). Rozważ unikanie trudnych zadań w tym okresie.`
            });
        }
        
        // Time distribution recommendation
        const totalTime = periods.reduce((sum, p) => sum + p.totalTime, 0);
        if (totalTime > 0) {
            const mostActiveTime = periods.reduce((max, p) => p.totalTime > max.totalTime ? p : max, periods[0]);
            if (mostActiveTime) {
                recommendations.push({
                    type: 'info',
                    emoji: '📊',
                    title: 'Rozkład czasu nauki',
                    message: `Najwięcej czasu spędzasz na nauce ${mostActiveTime.label.toLowerCase()}. To ${this.formatDuration(mostActiveTime.totalTime)} z całkowitego czasu nauki.`
                });
            }
        }
        
        return recommendations;
    }
    
    /**
     * Show no subjects message
     */
    showNoSubjectsMessage() {
        if (this.subjectSubTabs) {
            this.subjectSubTabs.innerHTML = `
                <div class="no-data-message">
                    <div class="no-data-icon">📚</div>
                    <div class="no-data-text">Brak danych o przedmiotach</div>
                    <div class="no-data-subtitle">Dodaj zadania do różnych przedmiotów, aby zobaczyć analizę czasu dla każdego z nich.</div>
                </div>
            `;
        }
        
        if (this.subjectTabContents) {
            this.subjectTabContents.innerHTML = '';
        }
    }
    
    // Helper methods
    getSubjectIcon(subjectName) {
        const name = subjectName.toLowerCase();
        if (name.includes('matemat')) return '🔢';
        if (name.includes('polski')) return '📝';
        if (name.includes('angiel')) return '🇺🇸';
        if (name.includes('histor')) return '🏛️';
        if (name.includes('fizyk')) return '⚗️';
        if (name.includes('chemi')) return '🧪';
        if (name.includes('biolog')) return '🧬';
        if (name.includes('geograf')) return '🌍';
        return '📚';
    }
    
    getSafeId(text) {
        return String(text || 'subject').toLowerCase().replace(/[^a-z0-9]+/gi, '-');
    }
    
    filterTasksByTimeframe(tasks, timeframeKey) {
        if (!Array.isArray(tasks) || tasks.length === 0) return [];
        const now = new Date();
        let days = null;
        switch (timeframeKey) {
            case 'WEEK': days = 7; break;
            case 'MONTH': days = 30; break;
            case 'QUARTER': days = 90; break;
            case 'ALL': default: days = null; break;
        }
        if (days == null) return tasks.slice();
        const start = new Date(now);
        start.setDate(start.getDate() - days + 1);
        return tasks.filter(t => {
            const ts = t.start_time || t.timestamp;
            if (!ts) return false;
            const d = new Date(ts);
            return d >= start && d <= now;
        });
    }

    pickSubjectAccent(subjectName) {
        // Deterministic accent from ChartsManager palette
        const palette = (this.chartsManager && this.chartsManager.subjectColors) || ['#667eea', '#764ba2', '#3b82f6', '#10b981'];
        const idx = Math.abs(this.hashCode(subjectName)) % palette.length;
        return palette[idx];
    }

    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < String(str).length; i++) {
            hash = ((hash << 5) - hash) + String(str).charCodeAt(i);
            hash |= 0;
        }
        return hash;
    }

    getLastActivityDate(tasks) {
        if (!Array.isArray(tasks) || tasks.length === 0) return null;
        const maxTs = tasks
            .map(t => t.start_time || t.timestamp)
            .filter(Boolean)
            .map(ts => new Date(ts).getTime())
            .reduce((max, t) => Math.max(max, t), 0);
        if (!maxTs) return null;
        try {
            return new Date(maxTs).toLocaleDateString('pl-PL');
        } catch (_) { return null; }
    }

    countActiveDays(tasks) {
        const days = new Set();
        (tasks || []).forEach(t => {
            const ts = t.start_time || t.timestamp;
            if (!ts) return;
            days.add(new Date(ts).toISOString().split('T')[0]);
        });
        return days.size;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    formatDuration(ms) {
        if (!ms || ms <= 0) return '0min';
        const totalMinutes = Math.floor(ms / 60000);
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        const parts = [];
        if (h > 0) parts.push(`${h}h`);
        if (m > 0) parts.push(`${m}min`);
        return parts.join(' ') || '0min';
    }
    
    isTaskCorrect(task) {
        if (typeof task.correctly_completed === 'string') {
            return task.correctly_completed.toLowerCase() === 'yes';
        }
        return task.correctly_completed === true || task.correctness === true;
    }
}

// Initialize when analytics manager is available
window.SubjectTimeAnalysisManager = SubjectTimeAnalysisManager;