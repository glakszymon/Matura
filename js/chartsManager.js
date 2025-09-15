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

        // Create canvas
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
