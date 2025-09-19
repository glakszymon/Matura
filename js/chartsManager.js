/**
 * Charts Manager
 * Handles time-series charts for tracking correct exercises over time
 */
class ChartsManager {
    constructor(analyticsManager) {
        this.analyticsManager = analyticsManager;
        this.charts = {}; // Store chart instances
        this.chartColors = {
            primary: '#667eea',
            secondary: '#764ba2',
            success: '#10b981',
            warning: '#f59e0b',
            error: '#ef4444',
            info: '#3b82f6'
        };
        this.subjectColors = [
            '#667eea', '#764ba2', '#10b981', '#f59e0b', 
            '#ef4444', '#3b82f6', '#8b5cf6', '#06b6d4',
            '#84cc16', '#f97316', '#ec4899', '#6366f1'
        ];
    }

    /**
     * Utility to group tasks by date and compute correct/incorrect and accuracy per day
     */
    buildDailyAggregates(tasks) {
        const byDate = {};
        tasks.forEach(task => {
            const date = (task.start_time || task.timestamp || new Date().toISOString()).split('T')[0];
            if (!byDate[date]) {
                byDate[date] = { date, total: 0, correct: 0, incorrect: 0 };
            }
            byDate[date].total++;
            if (this.isTaskCorrect(task)) {
                byDate[date].correct++;
            } else {
                byDate[date].incorrect++;
            }
        });
        const sortedDates = Object.keys(byDate).sort();
        return sortedDates.map(d => ({
            date: d,
            displayDate: new Date(d).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' }),
            total: byDate[d].total,
            correct: byDate[d].correct,
            incorrect: byDate[d].incorrect,
            accuracy: byDate[d].total > 0 ? Math.round((byDate[d].correct / byDate[d].total) * 100) : 0
        }));
    }

    /**
     * Create stacked daily tasks chart (correct vs incorrect)
     */
    createDailyTasksStackedChart(tasks, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return null;
        if (this.charts[containerId]) this.charts[containerId].destroy();
        const daily = this.buildDailyAggregates(tasks);
        if (daily.length === 0) {
            container.innerHTML = `
                <div class="chart-no-data">
                    <div class="no-data-icon">🧮</div>
                    <div class="no-data-text">Brak danych dziennych</div>
                </div>
            `;
            return null;
        }
        container.innerHTML = '<canvas id="' + containerId + '-canvas"></canvas>';
        const ctx = document.getElementById(containerId + '-canvas');
        const config = {
            type: 'bar',
            data: {
                labels: daily.map(d => d.displayDate),
                datasets: [
                    {
                        label: 'Poprawne',
                        data: daily.map(d => d.correct),
                        backgroundColor: this.chartColors.success + 'cc',
                        borderColor: this.chartColors.success,
                        borderWidth: 1,
                        stack: 'tasks'
                    },
                    {
                        label: 'Niepoprawne',
                        data: daily.map(d => d.incorrect),
                        backgroundColor: this.chartColors.error + 'cc',
                        borderColor: this.chartColors.error,
                        borderWidth: 1,
                        stack: 'tasks'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: 'Liczba zadań dziennie (poprawne vs niepoprawne)' },
                    tooltip: {
                        callbacks: {
                            footer: (items) => {
                                const i = items[0].dataIndex;
                                const total = daily[i].total;
                                const acc = daily[i].accuracy;
                                return `Razem: ${total} • Dokładność: ${acc}%`;
                            }
                        }
                    }
                },
                scales: {
                    x: { stacked: true },
                    y: { stacked: true, beginAtZero: true }
                }
            }
        };
        const chart = new Chart(ctx, config);
        this.charts[containerId] = chart;
        return chart;
    }

    /**
     * Create daily accuracy bar chart with an overall subject accuracy reference line
     */
    createDailyAccuracyWithOverallLineChart(tasks, overallAccuracy, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return null;
        if (this.charts[containerId]) this.charts[containerId].destroy();
        const daily = this.buildDailyAggregates(tasks);
        if (daily.length === 0) {
            container.innerHTML = `
                <div class="chart-no-data">
                    <div class="no-data-icon">📊</div>
                    <div class="no-data-text">Brak danych o dokładności</div>
                </div>
            `;
            return null;
        }
        container.innerHTML = '<canvas id="' + containerId + '-canvas" style="display: block; box-sizing: border-box; height: 400px; width: 100%;"></canvas>';
        const ctx = document.getElementById(containerId + '-canvas');
        const labels = daily.map(d => d.displayDate);
        const config = {
            type: 'line',
            data: {
                labels,
                datasets: [
                    // Bars: daily tasks (stacked correct/incorrect) on right axis
                    {
                        type: 'bar',
                        label: 'Zadania: poprawne',
                        data: daily.map(d => d.correct),
                        backgroundColor: this.chartColors.success + 'b3',
                        borderColor: this.chartColors.success,
                        borderWidth: 1,
                        yAxisID: 'y1',
                        stack: 'tasks',
                        order: 1
                    },
                    {
                        type: 'bar',
                        label: 'Zadania: niepoprawne',
                        data: daily.map(d => d.incorrect),
                        backgroundColor: this.chartColors.error + 'b3',
                        borderColor: this.chartColors.error,
                        borderWidth: 1,
                        yAxisID: 'y1',
                        stack: 'tasks',
                        order: 1
                    },
                    // Lines: daily accuracy and overall accuracy on left axis
                    {
                        label: 'Dzienna dokładność (%)',
                        data: daily.map(d => d.accuracy),
                        borderColor: this.chartColors.info,
                        backgroundColor: this.chartColors.info + '20',
                        borderWidth: 3,
                        fill: false,
                        tension: 0.3,
                        pointRadius: 3,
                        pointBackgroundColor: this.chartColors.info,
                        yAxisID: 'y',
                        order: 2
                    },
                    {
                        label: 'Ogólna dokładność (%)',
                        data: labels.map(() => overallAccuracy || 0),
                        borderColor: this.chartColors.secondary,
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.2,
                        pointRadius: 0,
                        borderDash: [6, 4],
                        yAxisID: 'y',
                        order: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: 'Dokładność dziennie vs. ogólna' },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => {
                                if (ctx.dataset.yAxisID === 'y') {
                                    return `${ctx.dataset.label}: ${ctx.parsed.y}%`;
                                } else {
                                    return `${ctx.dataset.label}: ${ctx.parsed.y}`;
                                }
                            },
                            footer: (items) => {
                                const i = items[0].dataIndex;
                                const total = daily[i].total;
                                const acc = daily[i].accuracy;
                                return `Razem: ${total} • Dokładność: ${acc}%`;
                            }
                        }
                    }
                },
                interaction: { intersect: false, mode: 'index' },
                scales: {
                    x: {
                        stacked: true
                    },
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: { callback: (v) => v + '%' },
                        title: { display: true, text: 'Dokładność (%)' }
                    },
                    y1: {
                        beginAtZero: true,
                        position: 'right',
                        stacked: true,
                        grid: { drawOnChartArea: false },
                        title: { display: true, text: 'Liczba zadań' }
                    }
                }
            }
        };
        const chart = new Chart(ctx, config);
        this.charts[containerId] = chart;
        return chart;
    }

    /**
     * Create a time-based line chart where each line represents a category accuracy over time
     */
    createCategoryAccuracyLineChart(tasks, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return null;
        if (this.charts[containerId]) this.charts[containerId].destroy();

        // Build per-day per-category counts
        const datesSet = new Set();
        const byDateCat = {};
        tasks.forEach(task => {
            const date = (task.start_time || task.timestamp || new Date().toISOString()).split('T')[0];
            datesSet.add(date);
            const cats = Array.isArray(task.categories) && task.categories.length ? task.categories : [task.category || 'Unknown'];
            cats.forEach(cat => {
                byDateCat[date] = byDateCat[date] || {};
                byDateCat[date][cat] = byDateCat[date][cat] || { total: 0, correct: 0 };
                byDateCat[date][cat].total++;
                if (this.isTaskCorrect(task)) byDateCat[date][cat].correct++;
            });
        });
        const sortedDates = Array.from(datesSet).sort();
        if (sortedDates.length === 0) {
            container.innerHTML = `
                <div class="chart-no-data">
                    <div class="no-data-icon">🏷️</div>
                    <div class="no-data-text">Brak danych kategorii</div>
                </div>
            `;
            return null;
        }

        // Determine categories
        const categoriesSet = new Set();
        Object.values(byDateCat).forEach(catsObj => Object.keys(catsObj).forEach(c => categoriesSet.add(c)));
        const categories = Array.from(categoriesSet);
        if (categories.length === 0) {
            container.innerHTML = `
                <div class="chart-no-data">
                    <div class="no-data-icon">🏷️</div>
                    <div class="no-data-text">Brak kategorii do wyświetlenia</div>
                </div>
            `;
            return null;
        }

        // Build cumulative accuracy (summary) per category and keep arrays for tooltips
        const cumByCat = {};
        categories.forEach(cat => {
            let cumCorrect = 0;
            let cumTotal = 0;
            const acc = [];
            const corr = [];
            const tot = [];
            sortedDates.forEach(date => {
                const entry = byDateCat[date] && byDateCat[date][cat];
                if (entry) {
                    cumCorrect += entry.correct;
                    cumTotal += entry.total;
                }
                if (cumTotal > 0) {
                    acc.push(Math.round((cumCorrect / cumTotal) * 100));
                } else {
                    acc.push(null);
                }
                corr.push(cumCorrect);
                tot.push(cumTotal);
            });
            // Forward fill accuracy after first known
            let last = null;
            for (let i = 0; i < acc.length; i++) {
                if (acc[i] == null) acc[i] = last; else last = acc[i];
            }
            // Backfill leading nulls with first known value
            const firstIdx = acc.findIndex(v => v != null);
            if (firstIdx > 0) {
                for (let i = 0; i < firstIdx; i++) acc[i] = acc[firstIdx];
            }
            cumByCat[cat] = { acc, corr, tot };
        });

        const datasets = categories.map((cat, idx) => {
            const color = this.subjectColors[idx % this.subjectColors.length];
            return {
                label: cat,
                data: cumByCat[cat].acc,
                borderColor: color,
                backgroundColor: color + '20',
                borderWidth: 2,
                fill: false,
                tension: 0.4,
                pointRadius: 3
            };
        });

        // Tooltip needs access to cumulative arrays
        const getCumInfo = (label, i) => {
            const s = cumByCat[label];
            if (!s) return null;
            return { acc: s.acc[i], correct: s.corr[i], total: s.tot[i] };
        };

        // Create controls + canvas
container.innerHTML = `
            <div class="category-chart-controls" id="${containerId}-controls"></div>
            <canvas id="${containerId}-canvas"></canvas>
        `;
        const controls = document.getElementById(containerId + '-controls');
        const ctx = document.getElementById(containerId + '-canvas');
        const config = {
            type: 'line',
            data: {
                labels: sortedDates.map(d => new Date(d).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' })),
                datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: 'Dokładność kategorii w czasie' },
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => {
                                const info = getCumInfo(ctx.dataset.label, ctx.dataIndex);
                                if (!info) return `${ctx.dataset.label}: ${ctx.parsed.y}%`;
                                return `${ctx.dataset.label}: ${info.acc}% ( ${info.correct}/${info.total} )`;
                            }
                        }
                    }
                },
                interaction: { intersect: false, mode: 'nearest' },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: { callback: (v) => v + '%' },
                        title: { display: true, text: 'Dokładność (%)' }
                    }
                }
            }
        };
        const chart = new Chart(ctx, config);
        this.charts[containerId] = chart;

        // Build checkbox controls with persistence and top-N filter
        if (controls) {
            const visibilityStore = (window.chartVisibilityState = window.chartVisibilityState || {});
            const storeKey = containerId;
            const saved = visibilityStore[storeKey] || { hidden: {}, top: 'all' };

            // Compute latest accuracy per category for top-N feature
            const latestAccuracies = categories.map((cat, idx) => {
                const data = chart.data.datasets[idx]?.data || [];
                let last = null;
                for (let i = data.length - 1; i >= 0; i--) {
                    const v = data[i];
                    if (v != null) { last = v; break; }
                }
                return { idx, cat, value: last ?? -1 };
            });

            const toggleAllId = `${containerId}-toggle-all`;
            const hideAllId = `${containerId}-hide-all`;
            const topSelectId = `${containerId}-top-select`;

            let controlsHTML = `
                <div class="controls-row">
                    <label class="control-item">
                        <input type="checkbox" id="${toggleAllId}">
                        Pokaż wszystkie
                    </label>
                    <button type="button" class="btn-mini" id="${hideAllId}">Ukryj wszystkie</button>
                    <div class="control-item">
                        Pokaż top:
                        <select id="${topSelectId}" class="control-select">
                            <option value="all">Wszystkie</option>
                            <option value="3">3</option>
                            <option value="5">5</option>
                            <option value="10">10</option>
                        </select>
                    </div>
                </div>
                <div class="controls-list">
            `;

            categories.forEach((cat, idx) => {
                const cbId = `${containerId}-cat-${idx}`;
                const color = this.subjectColors[idx % this.subjectColors.length];
                controlsHTML += `
                    <label class="control-item">
                        <span class="color-badge" style="background:${color}"></span>
                        <input type="checkbox" data-dataset-index="${idx}" id="${cbId}">
                        ${cat}
                    </label>
                `;
            });
            controlsHTML += '</div>';
            controls.innerHTML = controlsHTML;

            const toggleAll = document.getElementById(toggleAllId);
            const hideAllBtn = document.getElementById(hideAllId);
            const topSelect = document.getElementById(topSelectId);
            const itemCheckboxes = controls.querySelectorAll('input[data-dataset-index]');

            // Restore saved state
            const applySavedVisibility = () => {
                let allChecked = true;
                itemCheckboxes.forEach(cb => {
                    const index = parseInt(cb.dataset.datasetIndex, 10);
                    const cat = categories[index];
                    const hidden = saved.hidden[cat] === true;
                    cb.checked = !hidden;
                    if (chart.data.datasets[index]) {
                        chart.data.datasets[index].hidden = hidden;
                    }
                    if (hidden) allChecked = false;
                });
                toggleAll.checked = allChecked;
                if (saved.top) {
                    topSelect.value = String(saved.top);
                }
                chart.update();
            };

            // Save state helper
            const saveState = () => {
                const hidden = {};
                itemCheckboxes.forEach(cb => {
                    const index = parseInt(cb.dataset.datasetIndex, 10);
                    const cat = categories[index];
                    hidden[cat] = !cb.checked;
                });
                visibilityStore[storeKey] = { hidden, top: topSelect.value };
            };

            // Item toggles
            itemCheckboxes.forEach(cb => {
                cb.addEventListener('change', (e) => {
                    const index = parseInt(e.target.dataset.datasetIndex, 10);
                    const checked = e.target.checked;
                    if (chart.data.datasets[index]) {
                        chart.data.datasets[index].hidden = !checked;
                        chart.update();
                    }
                    // Update toggle-all state
                    const allChecked = Array.from(itemCheckboxes).every(x => x.checked);
                    toggleAll.checked = allChecked;
                    // Reset top select to 'all' because manual toggles override top-N filter
                    topSelect.value = 'all';
                    saveState();
                });
            });

            // Toggle all
            if (toggleAll) {
                toggleAll.addEventListener('change', (e) => {
                    const checked = e.target.checked;
                    itemCheckboxes.forEach(cb => {
                        cb.checked = checked;
                        const index = parseInt(cb.dataset.datasetIndex, 10);
                        if (chart.data.datasets[index]) {
                            chart.data.datasets[index].hidden = !checked;
                        }
                    });
                    // Reset top select to 'all'
                    topSelect.value = 'all';
                    chart.update();
                    saveState();
                });
            }

            // Hide all
            if (hideAllBtn) {
                hideAllBtn.addEventListener('click', () => {
                    itemCheckboxes.forEach(cb => {
                        cb.checked = false;
                        const index = parseInt(cb.dataset.datasetIndex, 10);
                        if (chart.data.datasets[index]) {
                            chart.data.datasets[index].hidden = true;
                        }
                    });
                    toggleAll.checked = false;
                    topSelect.value = 'all';
                    chart.update();
                    saveState();
                });
            }

            // Top-N change
            if (topSelect) {
                topSelect.addEventListener('change', () => {
                    const val = topSelect.value;
                    if (val === 'all') {
                        itemCheckboxes.forEach(cb => {
                            cb.checked = true;
                            const index = parseInt(cb.dataset.datasetIndex, 10);
                            if (chart.data.datasets[index]) chart.data.datasets[index].hidden = false;
                        });
                        toggleAll.checked = true;
                        chart.update();
                        saveState();
                        return;
                    }
                    const N = parseInt(val, 10);
                    // Determine top N by latest accuracy
                    const ranked = latestAccuracies
                        .slice()
                        .sort((a, b) => (b.value ?? -1) - (a.value ?? -1))
                        .slice(0, N)
                        .map(r => r.idx);
                    itemCheckboxes.forEach(cb => {
                        const index = parseInt(cb.dataset.datasetIndex, 10);
                        const inTop = ranked.includes(index);
                        cb.checked = inTop;
                        if (chart.data.datasets[index]) chart.data.datasets[index].hidden = !inTop;
                    });
                    toggleAll.checked = ranked.length === itemCheckboxes.length;
                    chart.update();
                    saveState();
                });
            }

            // Initial state
            // Default all visible if no saved state exists
            itemCheckboxes.forEach(cb => { cb.checked = true; });
            toggleAll.checked = true;
            applySavedVisibility();
        }

        return chart;
    }

    /**
     * Process task data for time-series charts
     */
    processTimeSeriesData(subjectAnalytics) {
        const timeSeriesData = {};
        
        Object.keys(subjectAnalytics).forEach(subjectName => {
            const subject = subjectAnalytics[subjectName];
            const tasks = subject.tasks || [];
            
            // Group tasks by date and count correct ones
            const dateGroups = {};
            
            tasks.forEach(task => {
                const date = task.timestamp ? 
                    task.timestamp.split('T')[0] : 
                    new Date().toISOString().split('T')[0];
                
                if (!dateGroups[date]) {
                    dateGroups[date] = {
                        date: date,
                        total: 0,
                        correct: 0
                    };
                }
                
                dateGroups[date].total++;
                
                if (this.isTaskCorrect(task)) {
                    dateGroups[date].correct++;
                }
            });
            
            // Convert to sorted array and calculate cumulative correct count
            const sortedDates = Object.keys(dateGroups).sort();
            let cumulativeCorrect = 0;
            
            const chartData = sortedDates.map(date => {
                cumulativeCorrect += dateGroups[date].correct;
                // Format date for display (DD.MM)
                const displayDate = new Date(date).toLocaleDateString('pl-PL', {
                    day: '2-digit',
                    month: '2-digit'
                });
                return {
                    date: date,
                    displayDate: displayDate,
                    dailyCorrect: dateGroups[date].correct,
                    cumulativeCorrect: cumulativeCorrect,
                    dailyTotal: dateGroups[date].total,
                    dailyAccuracy: dateGroups[date].total > 0 ? 
                        Math.round((dateGroups[date].correct / dateGroups[date].total) * 100) : 0
                };
            });
            
            timeSeriesData[subjectName] = {
                data: chartData,
                totalTasks: tasks.length,
                totalCorrect: tasks.filter(task => this.isTaskCorrect(task)).length
            };
        });
        
        return timeSeriesData;
    }

    /**
     * Create progress over time chart for a subject
     */
    createProgressChart(subjectName, timeSeriesData, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return null;

        // Clear existing chart
        if (this.charts[containerId]) {
            this.charts[containerId].destroy();
        }

        // Create canvas only
        container.innerHTML = '<canvas id="' + containerId + '-canvas"></canvas>';
        const canvas = document.getElementById(containerId + '-canvas');
        
        const data = timeSeriesData[subjectName];
        if (!data || !data.data || data.data.length === 0) {
            container.innerHTML = `
                <div class="chart-no-data">
                    <div class="no-data-icon">📈</div>
                    <div class="no-data-text">Brak danych do wyświetlenia</div>
                    <div class="no-data-subtitle">Dodaj zadania dla tego przedmiotu, aby zobaczyć wykres postępu</div>
                </div>
            `;
            return null;
        }

        const chartData = data.data;
        const subjectColorIndex = Object.keys(timeSeriesData).indexOf(subjectName);
        const color = this.subjectColors[subjectColorIndex % this.subjectColors.length];

        const config = {
            type: 'line',
            data: {
                labels: chartData.map(item => item.displayDate),
                datasets: [{
                    label: 'Poprawne zadania (łącznie)',
                    data: chartData.map(item => item.cumulativeCorrect),
                    borderColor: color,
                    backgroundColor: color + '20',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: color,
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    title: {
                        display: true,
                        text: `Postęp w czasie: ${subjectName}`,
                        font: {
                            size: 16,
                            weight: 'bold'
                        },
                        color: '#374151'
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        borderColor: color,
                        borderWidth: 1,
                        callbacks: {
                            title: function(context) {
                                return context[0].label;
                            },
                            label: function(context) {
                                const dataIndex = context.dataIndex;
                                const dailyCorrect = chartData[dataIndex].dailyCorrect;
                                const dailyTotal = chartData[dataIndex].dailyTotal;
                                const cumulative = context.parsed.y;
                                
                                return [
                                    `Łącznie poprawnych: ${cumulative}`,
                                    `Tego dnia: ${dailyCorrect}/${dailyTotal} (${chartData[dataIndex].dailyAccuracy}%)`
                                ];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'category',
                        title: {
                            display: true,
                            text: 'Data'
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Liczba poprawnych zadań',
                            font: {
                                weight: 'bold'
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        };

        const chart = new Chart(canvas, config);
        this.charts[containerId] = chart;

        // Remove any orphaned controls handling in this chart (progress chart doesn't use category filters)
        
        return chart;
    }

    /**
     * Create daily accuracy chart for a subject
     */
    createAccuracyChart(subjectName, timeSeriesData, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return null;

        // Clear existing chart
        if (this.charts[containerId]) {
            this.charts[containerId].destroy();
        }

        // Create canvas
        container.innerHTML = '<canvas id="' + containerId + '-canvas"></canvas>';
        const canvas = document.getElementById(containerId + '-canvas');
        
        const data = timeSeriesData[subjectName];
        if (!data || !data.data || data.data.length === 0) {
            container.innerHTML = `
                <div class="chart-no-data">
                    <div class="no-data-icon">📊</div>
                    <div class="no-data-text">Brak danych do wyświetlenia</div>
                    <div class="no-data-subtitle">Dodaj zadania dla tego przedmiotu, aby zobaczyć wykres dokładności</div>
                </div>
            `;
            return null;
        }

        const chartData = data.data;
        const subjectColorIndex = Object.keys(timeSeriesData).indexOf(subjectName);
        const color = this.subjectColors[subjectColorIndex % this.subjectColors.length];

        const config = {
            type: 'bar',
            data: {
                labels: chartData.map(item => item.displayDate),
                datasets: [{
                    label: 'Dzienna dokładność (%)',
                    data: chartData.map(item => item.dailyAccuracy),
                    backgroundColor: chartData.map(item => {
                        const alpha = item.dailyAccuracy >= 80 ? '0.8' : 
                                    item.dailyAccuracy >= 60 ? '0.6' : '0.4';
                        return color + Math.round(parseFloat(alpha) * 255).toString(16).padStart(2, '0');
                    }),
                    borderColor: color,
                    borderWidth: 2,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    title: {
                        display: true,
                        text: `Dzienna dokładność: ${subjectName}`,
                        font: {
                            size: 16,
                            weight: 'bold'
                        },
                        color: '#374151'
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        borderColor: color,
                        borderWidth: 1,
                        callbacks: {
                            title: function(context) {
                                return context[0].label;
                            },
                            label: function(context) {
                                const dataIndex = context.dataIndex;
                                const accuracy = context.parsed.y;
                                const correct = chartData[dataIndex].dailyCorrect;
                                const total = chartData[dataIndex].dailyTotal;
                                
                                return [
                                    `Dokładność: ${accuracy}%`,
                                    `Zadania: ${correct}/${total}`
                                ];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'category',
                        title: {
                            display: true,
                            text: 'Data'
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Dokładność (%)',
                            font: {
                                weight: 'bold'
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        };

        const chart = new Chart(canvas, config);
        this.charts[containerId] = chart;
        
        return chart;
    }

    /**
     * Create performance over time trend chart
     */
    createPerformanceOverTimeChart(performanceData, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return null;

        // Clear existing chart
        if (this.charts[containerId]) {
            this.charts[containerId].destroy();
        }

        // Create canvas
        container.innerHTML = '<canvas id="' + containerId + '-canvas"></canvas>';
        const canvas = document.getElementById(containerId + '-canvas');
        
        const dailyData = performanceData.dailyData || [];
        if (dailyData.length === 0) {
            container.innerHTML = `
                <div class="chart-no-data">
                    <div class="no-data-icon">📈</div>
                    <div class="no-data-text">Brak danych o skuteczności w czasie</div>
                    <div class="no-data-subtitle">Dodaj zadania, aby zobaczyć trend skuteczności</div>
                </div>
            `;
            return null;
        }

        const config = {
            type: 'line',
            data: {
                labels: dailyData.map(item => new Date(item.date).toLocaleDateString('pl-PL')),
                datasets: [
                    {
                        label: 'Dzienna skuteczność (%)',
                        data: dailyData.map(item => item.accuracy),
                        borderColor: this.chartColors.primary,
                        backgroundColor: this.chartColors.primary + '20',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: this.chartColors.primary,
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 5,
                        pointHoverRadius: 7
                    },
                    {
                        label: 'Średnia krocząca (7 dni)',
                        data: performanceData.rollingAverages ? performanceData.rollingAverages['7day'] : [],
                        borderColor: this.chartColors.secondary,
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.4,
                        pointRadius: 3,
                        pointHoverRadius: 5,
                        borderDash: [5, 5]
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Skuteczność w czasie',
                        font: {
                            size: 16,
                            weight: 'bold'
                        },
                        color: '#374151'
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        callbacks: {
                            title: function(context) {
                                return context[0].label;
                            },
                            label: function(context) {
                                const dataIndex = context.dataIndex;
                                const dayData = dailyData[dataIndex];
                                return [
                                    `${context.dataset.label}: ${context.parsed.y}%`,
                                    `Zadania: ${dayData.correct}/${dayData.total}`,
                                    `Przedmioty: ${dayData.subjects ? dayData.subjects.size : 0}`
                                ];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'category',
                        title: {
                            display: true,
                            text: 'Data'
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Skuteczność (%)',
                            font: {
                                weight: 'bold'
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        };

        const chart = new Chart(canvas, config);
        this.charts[containerId] = chart;
        
        return chart;
    }

    /**
     * Create study consistency heatmap chart
     */
    createConsistencyHeatmapChart(consistencyData, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return null;

        const dailyActivity = consistencyData.dailyActivity || [];
        if (dailyActivity.length === 0) {
            container.innerHTML = `
                <div class="chart-no-data">
                    <div class="no-data-icon">🔥</div>
                    <div class="no-data-text">Brak danych o systematyczności</div>
                    <div class="no-data-subtitle">Systematycznie dodawaj zadania, aby zobaczyć kalendarz aktywności</div>
                </div>
            `;
            return null;
        }

        // Create heatmap using div-based visualization (since Chart.js doesn't have native heatmap)
        const heatmapHTML = this.createHeatmapHTML(dailyActivity);
        container.innerHTML = `
            <div class="consistency-heatmap">
                <h4 class="chart-title">Kalendarz aktywności (ostatnie 90 dni)</h4>
                <div class="heatmap-container">
                    ${heatmapHTML}
                </div>
                <div class="heatmap-legend">
                    <span class="legend-label">Mniej</span>
                    <div class="legend-colors">
                        <div class="legend-color" data-level="0"></div>
                        <div class="legend-color" data-level="1"></div>
                        <div class="legend-color" data-level="2"></div>
                        <div class="legend-color" data-level="3"></div>
                        <div class="legend-color" data-level="4"></div>
                    </div>
                    <span class="legend-label">Więcej</span>
                </div>
            </div>
        `;

        return null; // No Chart.js instance for this custom visualization
    }

    /**
     * Create HTML for consistency heatmap
     */
    createHeatmapHTML(dailyActivity) {
        const maxTasks = Math.max(...dailyActivity.map(day => day.tasks), 1);
        
        // Group by weeks
        const weeks = [];
        let currentWeek = [];
        
        dailyActivity.forEach((day, index) => {
            currentWeek.push(day);
            if (currentWeek.length === 7 || index === dailyActivity.length - 1) {
                weeks.push([...currentWeek]);
                currentWeek = [];
            }
        });

        return weeks.map((week, weekIndex) => {
            const weekHTML = week.map((day, dayIndex) => {
                const level = this.getHeatmapLevel(day.tasks, maxTasks);
                const date = new Date(day.date);
                const dayName = date.toLocaleDateString('pl-PL', { weekday: 'short' });
                const dateFormatted = date.toLocaleDateString('pl-PL');
                
                return `
                    <div class="heatmap-day" 
                         data-level="${level}" 
                         data-date="${day.date}"
                         data-tasks="${day.tasks}"
                         data-active="${day.active}"
                         title="${dateFormatted}: ${day.tasks} zadań">
                    </div>
                `;
            }).join('');
            
            return `<div class="heatmap-week">${weekHTML}</div>`;
        }).join('');
    }

    /**
     * Get heatmap level based on task count
     */
    getHeatmapLevel(taskCount, maxTasks) {
        if (taskCount === 0) return 0;
        const ratio = taskCount / maxTasks;
        if (ratio <= 0.2) return 1;
        if (ratio <= 0.4) return 2;
        if (ratio <= 0.6) return 3;
        return 4;
    }

    /**
     * Create time of day analysis chart
     */
    createTimeOfDayChart(timeData, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return null;

        // Clear existing chart
        if (this.charts[containerId]) {
            this.charts[containerId].destroy();
        }

        // Create canvas
        container.innerHTML = '<canvas id="' + containerId + '-canvas"></canvas>';
        const canvas = document.getElementById(containerId + '-canvas');
        
        const timePeriods = timeData.timePeriods || {};
        const periods = Object.keys(timePeriods).filter(period => timePeriods[period].total > 0);
        
        if (periods.length === 0) {
            container.innerHTML = `
                <div class="chart-no-data">
                    <div class="no-data-icon">🕐</div>
                    <div class="no-data-text">Brak danych o porach dnia</div>
                    <div class="no-data-subtitle">Dodaj zadania o różnych porach, aby zobaczyć analizę</div>
                </div>
            `;
            return null;
        }

        const config = {
            type: 'bar',
            data: {
                labels: periods.map(period => timePeriods[period].label),
                datasets: [
                    {
                        label: 'Skuteczność (%)',
                        data: periods.map(period => timePeriods[period].accuracy),
                        backgroundColor: periods.map(period => {
                            const accuracy = timePeriods[period].accuracy;
                            if (accuracy >= 80) return this.chartColors.success + '80';
                            if (accuracy >= 60) return this.chartColors.info + '80';
                            if (accuracy >= 40) return this.chartColors.warning + '80';
                            return this.chartColors.error + '80';
                        }),
                        borderColor: periods.map(period => {
                            const accuracy = timePeriods[period].accuracy;
                            if (accuracy >= 80) return this.chartColors.success;
                            if (accuracy >= 60) return this.chartColors.info;
                            if (accuracy >= 40) return this.chartColors.warning;
                            return this.chartColors.error;
                        }),
                        borderWidth: 2,
                        borderRadius: 6
                    },
                    {
                        label: 'Liczba zadań',
                        data: periods.map(period => timePeriods[period].total),
                        type: 'line',
                        yAxisID: 'y1',
                        borderColor: this.chartColors.secondary,
                        backgroundColor: 'transparent',
                        borderWidth: 3,
                        pointBackgroundColor: this.chartColors.secondary,
                        pointRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Skuteczność w różnych porach dnia',
                        font: {
                            size: 16,
                            weight: 'bold'
                        },
                        color: '#374151'
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        callbacks: {
                            title: function(context) {
                                return context[0].label;
                            },
                            label: function(context) {
                                const period = periods[context.dataIndex];
                                const periodData = timePeriods[period];
                                if (context.dataset.label === 'Skuteczność (%)') {
                                    return [
                                        `Skuteczność: ${periodData.accuracy}%`,
                                        `Poprawne: ${periodData.correct}/${periodData.total}`,
                                        `${periodData.emoji} ${periodData.label}`
                                    ];
                                } else {
                                    return `Zadania: ${periodData.total}`;
                                }
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Pora dnia'
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Skuteczność (%)',
                            font: {
                                weight: 'bold'
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Liczba zadań'
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                        beginAtZero: true
                    }
                }
            }
        };

        const chart = new Chart(canvas, config);
        this.charts[containerId] = chart;
        
        return chart;
    }

    /**
     * Create location impact comparison chart
     */
    createLocationImpactChart(locationData, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return null;

        // Clear existing chart
        if (this.charts[containerId]) {
            this.charts[containerId].destroy();
        }

        // Create canvas
        container.innerHTML = '<canvas id="' + containerId + '-canvas"></canvas>';
        const canvas = document.getElementById(containerId + '-canvas');
        
        const locations = locationData.locations || {};
        const locationNames = Object.keys(locations).filter(name => locations[name].total >= 3); // Min 3 tasks
        
        if (locationNames.length === 0) {
            container.innerHTML = `
                <div class="chart-no-data">
                    <div class="no-data-icon">📍</div>
                    <div class="no-data-text">Brak wystarczających danych o lokalizacjach</div>
                    <div class="no-data-subtitle">Dodaj więcej zadań z różnych miejsc (minimum 3 na lokalizację)</div>
                </div>
            `;
            return null;
        }

        // Sort by accuracy for better visualization
        locationNames.sort((a, b) => locations[b].accuracy - locations[a].accuracy);

        const config = {
            type: 'doughnut',
            data: {
                labels: locationNames,
                datasets: [{
                    label: 'Skuteczność według lokalizacji',
                    data: locationNames.map(name => locations[name].accuracy),
                    backgroundColor: locationNames.map((_, index) => 
                        this.subjectColors[index % this.subjectColors.length] + '80'
                    ),
                    borderColor: locationNames.map((_, index) => 
                        this.subjectColors[index % this.subjectColors.length]
                    ),
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Skuteczność według lokalizacji',
                        font: {
                            size: 16,
                            weight: 'bold'
                        },
                        color: '#374151'
                    },
                    legend: {
                        display: true,
                        position: 'bottom'
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        callbacks: {
                            label: function(context) {
                                const locationName = context.label;
                                const locationInfo = locations[locationName];
                                return [
                                    `${locationName}: ${locationInfo.accuracy}%`,
                                    `Zadania: ${locationInfo.correct}/${locationInfo.total}`,
                                    `Przedmioty: ${Object.keys(locationInfo.subjects).length}`
                                ];
                            }
                        }
                    }
                }
            }
        };

        const chart = new Chart(canvas, config);
        this.charts[containerId] = chart;
        
        return chart;
    }

    /**
     * Create subject comparison radar chart
     */
    createSubjectRadarChart(subjectAnalysis, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return null;

        // Clear existing chart
        if (this.charts[containerId]) {
            this.charts[containerId].destroy();
        }

        // Create canvas
        container.innerHTML = '<canvas id="' + containerId + '-canvas"></canvas>';
        const canvas = document.getElementById(containerId + '-canvas');
        
        const subjects = subjectAnalysis.subjects || {};
        const subjectNames = Object.keys(subjects).filter(name => subjects[name].performance.total >= 5);
        
        if (subjectNames.length < 2) {
            container.innerHTML = `
                <div class="chart-no-data">
                    <div class="no-data-icon">🎯</div>
                    <div class="no-data-text">Potrzeba więcej przedmiotów</div>
                    <div class="no-data-subtitle">Dodaj zadania z różnych przedmiotów (minimum 5 zadań każdy) dla porównania</div>
                </div>
            `;
            return null;
        }

        const config = {
            type: 'radar',
            data: {
                labels: subjectNames,
                datasets: [{
                    label: 'Skuteczność przedmiotów (%)',
                    data: subjectNames.map(name => subjects[name].performance.accuracy),
                    borderColor: this.chartColors.primary,
                    backgroundColor: this.chartColors.primary + '20',
                    borderWidth: 3,
                    pointBackgroundColor: this.chartColors.primary,
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Porównanie skuteczności przedmiotów',
                        font: {
                            size: 16,
                            weight: 'bold'
                        },
                        color: '#374151'
                    },
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        callbacks: {
                            label: function(context) {
                                const subjectName = context.label;
                                const subjectInfo = subjects[subjectName];
                                return [
                                    `${subjectName}: ${subjectInfo.performance.accuracy}%`,
                                    `Zadania: ${subjectInfo.performance.correct}/${subjectInfo.performance.total}`,
                                    `Kategorie: ${Object.keys(subjectInfo.categories).length}`
                                ];
                            }
                        }
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            stepSize: 20,
                            callback: function(value) {
                                return value + '%';
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        angleLines: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    }
                }
            }
        };

        const chart = new Chart(canvas, config);
        this.charts[containerId] = chart;
        
        return chart;
    }

    /**
     * Create comparison chart showing all subjects
     */
    createComparisonChart(timeSeriesData, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return null;

        // Clear existing chart
        if (this.charts[containerId]) {
            this.charts[containerId].destroy();
        }

        // Create canvas
        container.innerHTML = '<canvas id="' + containerId + '-canvas"></canvas>';
        const canvas = document.getElementById(containerId + '-canvas');
        
        const subjects = Object.keys(timeSeriesData);
        if (subjects.length === 0) {
            container.innerHTML = `
                <div class="chart-no-data">
                    <div class="no-data-icon">📊</div>
                    <div class="no-data-text">Brak danych do porównania</div>
                    <div class="no-data-subtitle">Dodaj zadania dla różnych przedmiotów, aby zobaczyć porównanie</div>
                </div>
            `;
            return null;
        }

        // Get all unique dates across all subjects
        const allDates = new Set();
        subjects.forEach(subjectName => {
            const data = timeSeriesData[subjectName];
            if (data && data.data) {
                data.data.forEach(item => allDates.add(item.date));
            }
        });
        
        const sortedDates = Array.from(allDates).sort();

        // Create datasets for each subject
        const datasets = subjects.map((subjectName, index) => {
            const color = this.subjectColors[index % this.subjectColors.length];
            const data = timeSeriesData[subjectName];
            
            // Map data to all dates (fill missing dates with previous cumulative value)
            let lastCumulative = 0;
            const dataPoints = sortedDates.map(date => {
                const dayData = data.data.find(item => item.date === date);
                if (dayData) {
                    lastCumulative = dayData.cumulativeCorrect;
                }
                return lastCumulative;
            });

            return {
                label: subjectName,
                data: dataPoints,
                borderColor: color,
                backgroundColor: color + '20',
                borderWidth: 2,
                fill: false,
                tension: 0.4,
                pointBackgroundColor: color,
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            };
        });

        const config = {
            type: 'line',
            data: {
                labels: sortedDates,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Porównanie postępów między przedmiotami',
                        font: {
                            size: 16,
                            weight: 'bold'
                        },
                        color: '#374151'
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        callbacks: {
                            title: function(context) {
                                return context[0].label;
                            },
                            label: function(context) {
                                return `${context.dataset.label}: ${context.parsed.y} poprawnych zadań`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'category',
                        title: {
                            display: true,
                            text: 'Data'
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Łączna liczba poprawnych zadań',
                            font: {
                                weight: 'bold'
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        };

        const chart = new Chart(canvas, config);
        this.charts[containerId] = chart;
        
        return chart;
    }

    /**
     * Create progress over time chart for progress tab
     */
    createProgressOverTimeChart(progressData, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return null;
        
        // Clear existing chart
        if (this.charts[containerId]) {
            this.charts[containerId].destroy();
        }
        
        // Handle different data structures
        let progressOverTime = [];
        
        if (progressData.weeklyProgress) {
            // Check if it's an object (from EnhancedAnalytics) or array
            if (Array.isArray(progressData.weeklyProgress)) {
                progressOverTime = progressData.weeklyProgress;
            } else if (typeof progressData.weeklyProgress === 'object') {
                // Convert object to array, sorted by week number
                progressOverTime = Object.values(progressData.weeklyProgress)
                    .sort((a, b) => b.week - a.week) // Reverse order so most recent is last
                    .map((weekData, index) => ({
                        week: weekData.week || index,
                        totalTasks: weekData.totalTasks || 0,
                        correctTasks: weekData.correctTasks || 0,
                        accuracy: weekData.accuracy || 0,
                        cumulativeTasks: weekData.totalTasks || 0, // For compatibility
                        cumulativeCorrect: weekData.correctTasks || 0 // For compatibility
                    }));
            }
        }
        
        // Show no data message if empty
        if (progressOverTime.length === 0) {
            container.innerHTML = `
                <div class="chart-no-data">
                    <div class="no-data-icon">📊</div>
                    <div class="no-data-text">Brak danych o postępie</div>
                    <div class="no-data-subtitle">Kontynuuj naukę, aby zobaczyć postęp w czasie</div>
                </div>
            `;
            return null;
        }
        
        // Create canvas
        container.innerHTML = '<canvas id="' + containerId + '-canvas"></canvas>';
        const canvas = document.getElementById(containerId + '-canvas');
        
        const config = {
            type: 'line',
            data: {
                labels: progressOverTime.map(item => `Tydzień ${item.week !== undefined ? item.week : 'N/A'}`),
                datasets: [
                    {
                        label: 'Łączne zadania',
                        data: progressOverTime.map(item => item.cumulativeTasks || item.totalTasks || 0),
                        borderColor: this.chartColors.primary,
                        backgroundColor: this.chartColors.primary + '20',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: this.chartColors.primary,
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 5
                    },
                    {
                        label: 'Poprawne zadania',
                        data: progressOverTime.map(item => item.cumulativeCorrect || item.correctTasks || 0),
                        borderColor: this.chartColors.success,
                        backgroundColor: this.chartColors.success + '20',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: this.chartColors.success,
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 5
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Postęp w czasie',
                        font: { size: 16, weight: 'bold' },
                        color: '#374151'
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        callbacks: {
                            title: function(context) {
                                return context[0].label;
                            },
                            label: function(context) {
                                const dataPoint = progressOverTime[context.dataIndex];
                                if (context.dataset.label === 'Łączne zadania') {
                                    return `${context.dataset.label}: ${context.parsed.y} zadań`;
                                } else {
                                    const accuracy = dataPoint.accuracy || 0;
                                    return `${context.dataset.label}: ${context.parsed.y} zadań (${accuracy}%)`;
                                }
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Okres'
                        },
                        grid: { color: 'rgba(0, 0, 0, 0.1)' }
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Liczba zadań'
                        },
                        grid: { color: 'rgba(0, 0, 0, 0.1)' },
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        };
        
        const chart = new Chart(canvas, config);
        this.charts[containerId] = chart;
        return chart;
    }
    
    /**
     * Helper method to check if task is correct
     */
    isTaskCorrect(task) {
        if (typeof task.correctness === 'boolean') {
            return task.correctness === true;
        } else if (typeof task.correctness === 'string') {
            const corrValue = task.correctness.toLowerCase();
            return corrValue === 'poprawnie' || corrValue === 'dobrze' || corrValue === 'true' || corrValue === 'correct';
        }
        return false;
    }

    /**
     * Destroy all charts
     */
    destroyAllCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart) {
                chart.destroy();
            }
        });
        this.charts = {};
    }

    /**
     * Destroy specific chart
     */
    destroyChart(containerId) {
        if (this.charts[containerId]) {
            this.charts[containerId].destroy();
            delete this.charts[containerId];
        }
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.ChartsManager = ChartsManager;
}
