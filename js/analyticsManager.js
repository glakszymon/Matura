/**
 * Analytics Manager
 * Handles performance tracking, category analysis, and study insights
 */
class AnalyticsManager {
    constructor(config, googleSheetsAPI) {
        this.config = config;
        this.googleSheetsAPI = googleSheetsAPI;
        this.tasks = [];
        this.subjects = [];
        this.categories = [];
        this.currentFilter = 'all';
        this.isDataLoaded = false;
        
        // Initialize data structures
        this.overallStats = { totalTasks: 0, correctTasks: 0, correctPercentage: 0 };
        this.categoryPerformance = [];
        this.weakCategories = [];
        
        // Charts integration
        this.timeSeriesData = {};
        this.chartsManager = null;
        this.subjectTimeAnalysisManager = null;
        
        this.init();
    }
    
    /**
     * Initialize analytics manager
     */
init() {
        this.setupEventListeners();
        // Initialize ChartsManager lazily to avoid dependency issues
        if (typeof ChartsManager !== 'undefined') {
            this.chartsManager = new ChartsManager(this);
        }
        // Initialize SubjectTimeAnalysisManager only if legacy containers exist
        if (typeof SubjectTimeAnalysisManager !== 'undefined') {
            const hasLegacyContainers = document.getElementById('subject-sub-tabs') && document.getElementById('subject-tab-contents');
            if (hasLegacyContainers) {
                this.subjectTimeAnalysisManager = new SubjectTimeAnalysisManager(this);
            }
        }
        // Analytics Manager initialized
    }
    
    /**
     * Set loaded data from AppLoader
     */
    setLoadedData(loadedData) {
        if (loadedData) {
            this.subjects = loadedData.subjects || [];
            this.categories = loadedData.categories || [];
            this.tasks = loadedData.tasks || []; // Tasks data for analytics
            this.isDataLoaded = true;
            
            // Process the loaded data
            this.processAnalyticsData();
            
            // Analytics data set from AppLoader
        }
    }
    
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Quick analytics from dashboard
        const viewAnalyticsQuick = document.getElementById('view-analytics-quick');
        if (viewAnalyticsQuick) {
            viewAnalyticsQuick.addEventListener('click', () => {
                if (window.navigationManager) {
                    window.navigationManager.showForm('analytics');
                }
            });
        }
        
        // Filter reset button
        const resetFilters = document.getElementById('reset-filters');
        if (resetFilters) {
            resetFilters.addEventListener('click', () => {
                this.resetFilters();
            });
        }
        
        // Sort buttons
        const sortButtons = document.querySelectorAll('.sort-btn');
        sortButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                this.handleSortChange(e.target);
            });
        });

        // Summary tab at top of analytics
        const summaryTabBtn = document.getElementById('summary-tab-btn');
        if (summaryTabBtn) {
            summaryTabBtn.addEventListener('click', async () => {
                try {
                    if (!this.isDataLoaded || !this.subjectAnalytics) {
                        await this.loadAnalyticsData();
                    }
                } catch (e) {
                    console.warn('Failed to preload analytics before summary:', e);
                }
                this.showSummaryAnalytics();
            });
        }
    }
    
    /**
     * Load analytics data (optimized with preloading)
     */
    async loadAnalyticsData() {
        // Show analytics loading screen
        const loadingId = showAnalyticsLoading();
        
        // console.group('%c📊 [ANALYTICS DATA] Loading Analytics', 'color: #e74c3c; font-weight: bold; font-size: 14px;');
        // console.log('GoogleSheetsAPI instance:', !!this.googleSheetsAPI);
        // console.log('Demo mode:', this.googleSheetsAPI?.config?.DEMO_MODE);
        // console.log('Data loaded:', this.isDataLoaded);
        
        // If data is already loaded from AppLoader, use it
        if (this.isDataLoaded && window.appData) {
            // console.log('⚡ Using data from AppLoader - rendering instantly!');
            this.subjects = window.appData.subjects || [];
            this.categories = window.appData.categories || [];
            
            // Update loading steps quickly
            updateLoadingStep(loadingId, 0, 'completed');
            updateLoadingStep(loadingId, 1, 'completed');
            updateLoadingStep(loadingId, 2, 'completed');
            updateLoadingStep(loadingId, 3, 'active');
            updateLoadingText(loadingId, 'Renderowanie analityki...');
            
            this.renderAnalytics();
            
            // Hide loading
            setTimeout(() => {
                updateLoadingStep(loadingId, 3, 'completed');
                updateLoadingText(loadingId, 'Analityka gotowa!');
                setTimeout(() => hideLoading(loadingId), 500);
            }, 300);
            
            // console.log('✅ Analytics rendered instantly from loaded data');
            // console.groupEnd();
            return;
        }
        
        // Show loading indicators
        this.setLoadingState(true);
        
        try {
            // console.log('Starting optimized analytics data fetch...');
            
            // Update loading step 1 - Tasks
            updateLoadingStep(loadingId, 0, 'completed');
            updateLoadingStep(loadingId, 1, 'active');
            updateLoadingText(loadingId, 'Grupowanie według przedmiotów...');
            
            // Load data with smart caching and instant demo mode
            let tasksResponse, subjectsResponse, categoriesResponse;
            
            // Load tasks first (instant for demo mode)
            tasksResponse = await this.loadTasksData();
            
            // Update loading step 2 - Processing
            updateLoadingStep(loadingId, 1, 'completed');
            updateLoadingStep(loadingId, 2, 'active');
            updateLoadingText(loadingId, 'Obliczanie statystyk...');
            
            // Load subjects and categories in parallel (demo mode is instant)
            [subjectsResponse, categoriesResponse] = await Promise.all([
                this.googleSheetsAPI.fetchSubjects(),
                this.googleSheetsAPI.fetchCategories()
            ]);
            
            // For demo mode, render immediately after tasks are loaded
            if (this.googleSheetsAPI?.config?.DEMO_MODE) {
                // Store data immediately
                this.subjects = subjectsResponse.subjects || [];
                this.categories = categoriesResponse.categories || [];
                
                // Process and render immediately
                this.processAnalyticsData();
                this.renderAnalytics();
                
                // console.log('Demo mode: Analytics rendered instantly');
                this.setLoadingState(false);
                // console.groupEnd();
                return;
            }
            
            // console.log('Analytics parallel fetch completed:');
            // console.log('- Tasks response:', tasksResponse);
            // console.log('- Subjects response:', subjectsResponse);
            // console.log('- Categories response:', categoriesResponse);
            
            // Store data
            if (subjectsResponse.success) {
                this.subjects = subjectsResponse.subjects || [];
                // console.log('Analytics subjects stored:', this.subjects);
            } else {
                // console.warn('Analytics subjects fetch failed:', subjectsResponse);
                this.subjects = [];
            }
            
            if (categoriesResponse.success) {
                this.categories = categoriesResponse.categories || [];
                // console.log('Analytics categories stored:', this.categories);
            } else {
                // console.warn('Analytics categories fetch failed:', categoriesResponse);
                this.categories = [];
            }
            
            // Analytics final data state processed
            
            // Update final loading steps
            updateLoadingStep(loadingId, 2, 'completed');
            updateLoadingStep(loadingId, 3, 'active');
            updateLoadingText(loadingId, 'Finalizowanie analityki...');
            
            // Process and render analytics
            // console.log('Processing analytics data...');
            this.processAnalyticsData();
            
            // Small delay for final step
            await new Promise(resolve => setTimeout(resolve, 500));
            
            updateLoadingStep(loadingId, 3, 'completed');
            updateLoadingText(loadingId, 'Analityka wygenerowana!');
            
            // console.log('Rendering analytics...');
            this.renderAnalytics();
            // console.log('Analytics loading completed successfully');
            
            // Hide loading after completion
            setTimeout(() => {
                hideLoading(loadingId);
            }, 800);
            
        } catch (error) {
            // console.error('ERROR loading analytics data:', error);
            // Error details logged
            
            // Update loading to show error
            updateLoadingText(loadingId, 'Błąd ładowania analityki', 'Spróbuj odświeżyć stronę');
            
            setTimeout(() => {
                hideLoading(loadingId);
                this.showError('Błąd ładowania danych analityki');
            }, 2000);
        } finally {
            this.setLoadingState(false);
            // console.groupEnd();
        }
    }
    
    /**
     * Set loading state for analytics UI
     */
    setLoadingState(loading) {
        // Update overview cards
        const totalTasksEl = document.getElementById('total-tasks-analytics');
        const correctPercentageEl = document.getElementById('correct-percentage');
        const weakCategoriesEl = document.getElementById('weak-categories-count');
        
        if (loading) {
            if (totalTasksEl) totalTasksEl.innerHTML = '<span class="loading-spinner-small"></span>';
            if (correctPercentageEl) correctPercentageEl.innerHTML = '<span class="loading-spinner-small"></span>';
            if (weakCategoriesEl) weakCategoriesEl.innerHTML = '<span class="loading-spinner-small"></span>';
            
            // Show loading in performance table
            const performanceTable = document.getElementById('performance-table');
            if (performanceTable) {
                performanceTable.innerHTML = `
                    <div class="analytics-loading">
                        <div class="loading-spinner"></div>
                        <div class="loading-text">Ładowanie danych analityki...</div>
                    </div>
                `;
            }
            
            // Show loading in suggestions
            const reviewSuggestions = document.getElementById('review-suggestions');
            if (reviewSuggestions) {
                reviewSuggestions.innerHTML = `
                    <div class="analytics-loading">
                        <div class="loading-spinner"></div>
                        <div class="loading-text">Analizowanie słabych punktów...</div>
                    </div>
                `;
            }
        }
    }
    
    /**
     * Load tasks data from StudyTasks (SessionTasks) sheet for analytics
     */
    async loadTasksData() {
        console.log('%c📊 [ANALYTICS] Loading StudyTasks Data...', 'color: #2563eb; font-weight: bold; font-size: 14px;');
        console.log('Demo mode:', this.googleSheetsAPI?.config?.DEMO_MODE);
        
        // Use GoogleSheetsAPI getStudyTasks method to get data from StudyTasks sheet
        try {
            const tasksResponse = await this.googleSheetsAPI.getStudyTasks();
            
            if (tasksResponse.success) {
                const tasks = tasksResponse.data || tasksResponse.tasks || [];
                
                console.log('%c📋 [ANALYTICS] Raw StudyTasks data:', 'color: #7c3aed; font-weight: bold;', tasks);
                
                // Normalize task format for analytics - StudyTasks structure with multiple categories support
                this.tasks = tasks.map((task, index) => {
                    try {
                        const categoriesString = task.categories || task.category || 'Unknown';
                        
                        // Debug logging for problematic categories
                        if (index < 3) {
                            console.log(`%c🔍 [ANALYTICS] Task ${index + 1} categories debug:`, 'color: #f59e0b; font-weight: 600;');
                            console.log('Raw categories value:', categoriesString);
                            console.log('Categories type:', typeof categoriesString);
                            console.log('Categories is array:', Array.isArray(categoriesString));
                        }
                        
                        const categoriesArray = this.parseCategoriesString(categoriesString);
                        
                        if (index < 3) {
                            console.log('Parsed categories array:', categoriesArray);
                        }
                        
                        return {
                            name: task.task_name || task.name || 'Unnamed Task',
                            subject: task.subject || 'Unknown',
                            category: categoriesString, // Keep original for backward compatibility
                            categories: categoriesArray, // Array of individual categories
                            categoriesString: categoriesString, // Original string for display
                            correctness: task.correctly_completed === 'Yes' || task.correctness === 'Poprawnie' || task.correctness === true,
                            timestamp: task.start_time || task.timestamp || new Date().toISOString(),
                            date: (task.start_time || task.timestamp || new Date().toISOString()).split('T')[0],
                            description: task.description || '',
                            location: task.location || '',
                            session_id: task.session_id || '',
                            task_id: task.task_id || '',
                            // Additional StudyTasks fields
                            start_time: task.start_time || null,
                            end_time: task.end_time || null
                        };
                    } catch (taskError) {
                        console.error(`Error processing task ${index + 1}:`, taskError);
                        console.error('Problematic task data:', task);
                        
                        // Return safe fallback task
                        return {
                            name: task.task_name || task.name || 'Error Task',
                            subject: task.subject || 'Unknown',
                            category: 'Unknown',
                            categories: ['Unknown'],
                            categoriesString: 'Unknown',
                            correctness: false,
                            timestamp: new Date().toISOString(),
                            date: new Date().toISOString().split('T')[0],
                            description: 'Task processing error',
                            location: '',
                            session_id: task.session_id || '',
                            task_id: task.task_id || '',
                            end_time: null
                        };
                    }
                });
                
                console.log('%c✅ Analytics StudyTasks loaded:', 'color: #10b981; font-weight: 600;', this.tasks.length, 'tasks');
                console.log('%c🔍 Sample StudyTask data:', 'color: #8b5cf6; font-weight: 600;', this.tasks.slice(0, 3));
                return { success: true, tasks: this.tasks };
            } else {
                console.error('Failed to load StudyTasks for analytics:', tasksResponse.error);
                this.tasks = [];
                return { success: false, tasks: [], error: tasksResponse.error };
            }
        } catch (error) {
            console.error('Error loading StudyTasks data for analytics:', error);
            this.tasks = [];
            return { success: false, tasks: [], error: error.message };
        }
    }
    
    /**
     * Parse categories string into array of individual categories
     * @param {any} categoriesString - Comma-separated categories string (or other data types)
     * @returns {Array} Array of individual category names
     */
    parseCategoriesString(categoriesString) {
        // Handle null, undefined, or empty values
        if (!categoriesString || categoriesString === 'Unknown') {
            return ['Unknown'];
        }
        
        // Convert to string if it's not already a string
        let categoriesStr;
        if (typeof categoriesString === 'string') {
            categoriesStr = categoriesString;
        } else if (typeof categoriesString === 'number') {
            categoriesStr = categoriesString.toString();
        } else if (categoriesString && typeof categoriesString === 'object') {
            // Handle objects, arrays, etc.
            if (Array.isArray(categoriesString)) {
                // Already an array, return as-is (with string conversion)
                return categoriesString.map(item => String(item).trim()).filter(cat => cat && cat.length > 0);
            } else {
                categoriesStr = categoriesString.toString();
            }
        } else {
            // Fallback: convert to string
            categoriesStr = String(categoriesString);
        }
        
        // Handle edge cases after string conversion
        if (!categoriesStr || categoriesStr === 'null' || categoriesStr === 'undefined' || categoriesStr === '[object Object]') {
            return ['Unknown'];
        }
        
        // Split and process categories
        try {
            return categoriesStr
                .split(',')
                .map(cat => cat.trim())
                .filter(cat => cat && cat.length > 0);
        } catch (error) {
            console.warn('Error parsing categories string:', error, 'Original value:', categoriesString);
            return ['Unknown'];
        }
    }
    
    /**
     * Process analytics data - NEVER sum up subjects together, analyze each separately
     */
processAnalyticsData() {
        // Group tasks by subject - each subject analyzed completely separately
        this.subjectAnalytics = this.groupTasksBySubject();
        
        console.log('%c📊 [ANALYTICS] Subject Analytics:', 'color: #2563eb; font-weight: bold;', this.subjectAnalytics);
        
        // Process each subject individually 
        this.processSubjectAnalytics();
        
        // Initialize subject time analysis manager with subject data
        if (this.subjectTimeAnalysisManager) {
            this.subjectTimeAnalysisManager.renderSubjectTabs(this.subjectAnalytics);
        }
        
        // Build time series data for charts if charts manager is available
        if (this.chartsManager) {
            try {
                this.timeSeriesData = this.chartsManager.processTimeSeriesData(this.subjectAnalytics);
            } catch (e) {
                console.warn('Time series processing failed:', e);
                this.timeSeriesData = {};
            }
        } else {
            this.timeSeriesData = {};
        }
        
        console.log('%c✅ [ANALYTICS] Processed Subject Analytics:', 'color: #10b981; font-weight: bold;', this.subjectAnalytics);
        console.log('%c📈 [ANALYTICS] Time Series Data:', 'color: #8b5cf6; font-weight: bold;', this.timeSeriesData);
    }
    
    /**
     * Group tasks by subject - each subject completely separate with multiple categories support
     */
    groupTasksBySubject() {
        const subjectGroups = {};
        
        this.tasks.forEach(task => {
            const subject = task.subject || task.przedmiot || 'Unknown';
            if (!subjectGroups[subject]) {
                subjectGroups[subject] = {
                    name: subject,
                    tasks: [],
                    categories: {}
                };
            }
            subjectGroups[subject].tasks.push(task);
            
            // Group by individual categories within each subject (handle multiple categories per task)
            const categories = task.categories || ['Unknown'];
            categories.forEach(categoryName => {
                if (!subjectGroups[subject].categories[categoryName]) {
                    subjectGroups[subject].categories[categoryName] = {
                        name: categoryName,
                        tasks: []
                    };
                }
                // Add task to each category it belongs to
                subjectGroups[subject].categories[categoryName].tasks.push(task);
            });
        });
        
        return subjectGroups;
    }
    
    /**
     * Process analytics for each subject individually
     */
    processSubjectAnalytics() {
        Object.keys(this.subjectAnalytics).forEach(subjectName => {
            const subject = this.subjectAnalytics[subjectName];
            
            // Calculate subject overall stats
            subject.stats = this.calculateSubjectStats(subject.tasks);
            
            // Calculate category performance within this subject
            subject.categoryPerformance = this.calculateSubjectCategoryPerformance(subject.categories);
            
            // Identify weak categories within this subject
            subject.weakCategories = subject.categoryPerformance.filter(cat => 
                cat.totalTasks >= 3 && cat.correctPercentage < 60
            );
            
            // Identify strong categories within this subject
            subject.strongCategories = subject.categoryPerformance.filter(cat => 
                cat.correctPercentage >= 80
            );
        });
    }
    
    /**
     * Calculate statistics for a single subject
     */
    calculateSubjectStats(tasks) {
        if (tasks.length === 0) {
            return {
                totalTasks: 0,
                correctTasks: 0,
                incorrectTasks: 0,
                correctPercentage: 0
            };
        }
        
        const correctTasks = tasks.filter(task => {
            if (typeof task.correctness === 'boolean') {
                return task.correctness === true;
            } else if (typeof task.correctness === 'string') {
                const corrValue = task.correctness.toLowerCase();
                return corrValue === 'poprawnie' || corrValue === 'dobrze' || corrValue === 'true';
            }
            return false;
        }).length;
        
        const incorrectTasks = tasks.length - correctTasks;
        const correctPercentage = Math.round((correctTasks / tasks.length) * 100);
        
        return {
            totalTasks: tasks.length,
            correctTasks: correctTasks,
            incorrectTasks: incorrectTasks,
            correctPercentage: correctPercentage
        };
    }
    
    /**
     * Calculate category performance within a single subject
     */
    calculateSubjectCategoryPerformance(categories) {
        return Object.values(categories).map(category => {
            const stats = this.calculateSubjectStats(category.tasks);
            return {
                name: category.name,
                tasks: category.tasks, // Include the actual tasks array
                ...stats,
                isWeak: stats.totalTasks >= 3 && stats.correctPercentage < 60,
                isStrong: stats.correctPercentage >= 80
            };
        }).sort((a, b) => a.correctPercentage - b.correctPercentage); // Sort by performance
    }
    
    /**
     * Calculate overall statistics
     */
    calculateOverallStats(tasks) {
        if (tasks.length === 0) {
            return {
                totalTasks: 0,
                correctTasks: 0,
                correctPercentage: 0
            };
        }
        
        const correctTasks = tasks.filter(task => {
            // Handle both boolean and string correctness values
            if (typeof task.correctness === 'boolean') {
                return task.correctness === true;
            } else if (typeof task.correctness === 'string') {
                const corrValue = task.correctness.toLowerCase();
                return corrValue === 'poprawnie' || corrValue === 'dobrze' || corrValue === 'true';
            }
            return false;
        }).length;
        
        const correctPercentage = Math.round((correctTasks / tasks.length) * 100);
        
        return {
            totalTasks: tasks.length,
            correctTasks: correctTasks,
            correctPercentage: correctPercentage
        };
    }
    
    /**
     * Calculate category performance
     */
    calculateCategoryPerformance(tasks) {
        const categoryStats = {};
        
        // Group tasks by category
        tasks.forEach(task => {
            if (!categoryStats[task.category]) {
                categoryStats[task.category] = {
                    name: task.category,
                    subject: task.subject,
                    totalTasks: 0,
                    correctTasks: 0,
                    tasks: []
                };
            }
            
            categoryStats[task.category].totalTasks++;
            categoryStats[task.category].tasks.push(task);
            
            // Handle both boolean and string correctness values
            let isCorrect = false;
            if (typeof task.correctness === 'boolean') {
                isCorrect = task.correctness === true;
            } else if (typeof task.correctness === 'string') {
                const corrValue = task.correctness.toLowerCase();
                isCorrect = corrValue === 'poprawnie' || corrValue === 'dobrze' || corrValue === 'true';
            }
            
            if (isCorrect) {
                categoryStats[task.category].correctTasks++;
            }
        });
        
        // Calculate percentages and add metadata
        return Object.values(categoryStats).map(category => ({
            ...category,
            correctPercentage: category.totalTasks > 0 ? 
                Math.round((category.correctTasks / category.totalTasks) * 100) : 0,
            isWeak: category.totalTasks >= 3 && 
                   (category.correctTasks / category.totalTasks) < 0.6 // Less than 60% correct
        })).sort((a, b) => a.correctPercentage - b.correctPercentage);
    }
    
    /**
     * Identify weak categories (less than 60% correct, min 3 tasks)
     */
    identifyWeakCategories(categoryPerformance) {
        return categoryPerformance.filter(category => category.isWeak);
    }
    
    /**
     * Render analytics - show subject selection buttons first
     */
    renderAnalytics() {
        const analyticsContent = document.getElementById('analytics-content');
        const subjectSelectionSection = document.getElementById('subject-selection-section');
        
        if (!analyticsContent) return;
        
        // Always hide the internal subject list (we use left navigation now)
        if (subjectSelectionSection) {
            subjectSelectionSection.style.display = 'none';
        }
        
        // If there is no data yet, show a helpful message
        if (!this.subjectAnalytics || Object.keys(this.subjectAnalytics).length === 0) {
            this.renderNoDataMessage();
            return;
        }
        
        // Show a simple prompt to pick a subject from the left navigation
        analyticsContent.innerHTML = `
            <div class="no-analytics-data">
                <div class="no-analytics-icon">👈</div>
                <div class="no-analytics-title">Wybierz przedmiot z lewego menu</div>
                <div class="no-analytics-subtitle">Kliknij przedmiot w lewym pasku nawigacji, aby zobaczyć szczegóły.</div>
            </div>
        `;
    }

    /**
     * Show aggregated summary across all subjects
     */
    async showSummaryAnalytics() {
        const analyticsContent = document.getElementById('analytics-content');
        if (!analyticsContent) return;

        // Ensure data
        if (!this.isDataLoaded || !this.subjectAnalytics) {
            try {
                await this.loadAnalyticsData();
            } catch (_) {}
        }

        // Compute overall stats and per-subject rows
        const overall = this.calculateOverallStats(this.tasks || []);
        const subjects = this.subjectAnalytics ? Object.keys(this.subjectAnalytics) : [];
        const subjectsCount = subjects.length;

        // Best/Worst subjects
        const subjectEntries = subjects.map(n => ({ name: n, st: this.subjectAnalytics[n]?.stats || { totalTasks: 0, correctTasks: 0, incorrectTasks: 0, correctPercentage: 0 } }));
        const withTasks = subjectEntries.filter(e => e.st.totalTasks > 0);
        const best = withTasks.length ? withTasks.reduce((a,b)=> (b.st.correctPercentage > a.st.correctPercentage ? b : a), withTasks[0]) : null;
        const worst = withTasks.length ? withTasks.reduce((a,b)=> (b.st.correctPercentage < a.st.correctPercentage ? b : a), withTasks[0]) : null;

        // Build subject rows (more info)
        const rows = subjects.map(name => {
            const s = this.subjectAnalytics[name];
            const st = s && s.stats ? s.stats : { totalTasks: 0, correctTasks: 0, incorrectTasks: 0, correctPercentage: 0 };
            const weakCount = (s && Array.isArray(s.weakCategories)) ? s.weakCategories.length : 0;
            const strongCount = (s && Array.isArray(s.strongCategories)) ? s.strongCategories.length : 0;
            const catCount = s && s.categories ? Object.keys(s.categories).length : 0;
            const icon = this.getSubjectIcon(name);
            const trend = this.getSubjectTrendData(s ? s.tasks || [] : []);
            const lastActivity = s && s.tasks && s.tasks.length ? this.formatTimeAgo(s.tasks[s.tasks.length - 1].timestamp) : '—';
            return `
                <tr data-subject="${this.escapeHtml(name)}">
                    <td class="subject-name-cell">${icon} ${this.escapeHtml(name)}</td>
                    <td class="center">${st.totalTasks}</td>
                    <td class="center">${st.correctTasks}</td>
                    <td class="center">${st.incorrectTasks}</td>
                    <td class="center"><span class="analytics-percentage ${this.getPerformanceClass(st.correctPercentage)}">${st.correctPercentage}%</span></td>
                    <td class="center"><span class="trend ${trend.class}">${trend.icon}</span></td>
                    <td class="center">${lastActivity}</td>
                    <td class="center">${catCount}</td>
                    <td class="center">${strongCount}</td>
                    <td class="center">${weakCount}</td>
                </tr>
            `;
        }).join('');

        // Insights chips
        const insights = `
            <div class="recent-summary" style="margin-bottom: 10px;">
                <span class="chip info">📚 Przedmioty: ${subjectsCount}</span>
                <span class="chip success">✅ Poprawne razem: ${overall.correctTasks || 0}</span>
                <span class="chip error">❌ Błędne razem: ${(overall.totalTasks - (overall.correctTasks || 0)) || 0}</span>
                ${best ? `<span class="chip success">🏆 Najlepszy: ${this.escapeHtml(best.name)} (${best.st.correctPercentage}%)</span>` : ''}
                ${worst ? `<span class="chip error">⚠️ Do poprawy: ${this.escapeHtml(worst.name)} (${worst.st.correctPercentage}%)</span>` : ''}
            </div>`;

        analyticsContent.innerHTML = `
            <div class="summary-analytics-section">
                <div class="summary-header">
                    <h3>📊 Podsumowanie wszystkich przedmiotów</h3>
                    <p class="summary-subtitle">Wiele sposobów analizy — wykresy, wskaźniki i krótkie listy</p>
                </div>

                <div class="kpi-grid">
                    <div class="kpi-card grad" aria-label="Zadania"><div class="kpi-icon">📦</div><div class="kpi-title">Zadania</div><div class="kpi-value">${overall.totalTasks}</div><div class="kpi-diff">—</div></div>
                    <div class="kpi-card grad" aria-label="Skuteczność"><div class="kpi-icon">🎯</div><div class="kpi-title">Skuteczność</div><div class="kpi-value">${overall.correctPercentage}%</div><div class="kpi-diff">—</div></div>
                    <div class="kpi-card grad" aria-label="Przedmioty"><div class="kpi-icon">📚</div><div class="kpi-title">Przedmioty</div><div class="kpi-value">${subjectsCount}</div><div class="kpi-diff">—</div></div>
                </div>

                ${insights}

                <!-- Charts: one per line -->
                <div class="subject-chart-card">
                    <h4 class="subject-chart-title">📊 Skuteczność dzienna (ogółem)</h4>
                    <div class="subject-chart" id="summary-daily-accuracy"></div>
                </div>
                <div class="subject-chart-card">
                    <h4 class="subject-chart-title">🏷️ Skuteczność kategorii w czasie</h4>
                    <div class="subject-chart" id="summary-category-accuracy"></div>
                </div>
                <div class="subject-chart-card">
                    <h4 class="subject-chart-title">⏰ Pory dnia — skuteczność</h4>
                    <div class="subject-chart" id="summary-time-of-day"></div>
                </div>

                <!-- Compact subjects table -->
                <div class="analytics-table-container" style="margin-top: 1rem;">
                    <table class="analytics-table compact">
                        <thead>
                            <tr>
                                <th>📚 Przedmiot</th>
                                <th class="center">📦 Razem</th>
                                <th class="center">🎯 Skuteczność</th>
                                <th class="center">⚠️ Słabe</th>
                            </tr>
                        </thead>
                        <tbody id="summary-compact-rows"></tbody>
                    </table>
                </div>
            </div>
        `;

        // Initialize charts after content injection
        const lazyInit = () => {
            if (!this.chartsManager) return;
            this.chartsManager.createDailyAccuracyWithOverallLineChart(
                this.tasks || [],
                overall.correctPercentage || 0,
                'summary-daily-accuracy'
            );
            this.chartsManager.createCategoryAccuracyLineChart(
                this.tasks || [],
                'summary-category-accuracy'
            );
            // Time of day
            const tod = this.computeTimeOfDaySummary(this.tasks || []);
            const timeData = { timePeriods: (tod.periods || []).reduce((acc, p) => {
                acc[p.label || p.key || 'Okres'] = { total: p.total, correct: p.correct, accuracy: p.accuracy };
                return acc;
            }, {}) };
            if (this.chartsManager.createTimeOfDayChart) {
                this.chartsManager.createTimeOfDayChart(timeData, 'summary-time-of-day');
            }
            // Compact table rows
            const tbody = document.getElementById('summary-compact-rows');
            if (tbody) {
                const rowsCompact = (subjects || []).map(name => {
                    const s = this.subjectAnalytics[name];
                    const st = s && s.stats ? s.stats : { totalTasks: 0, correctTasks: 0, incorrectTasks: 0, correctPercentage: 0 };
                    const weakCount = (s && Array.isArray(s.weakCategories)) ? s.weakCategories.length : 0;
                    const icon = this.getSubjectIcon(name);
                    return `
                        <tr data-subject="${this.escapeHtml(name)}">
                            <td class="subject-name-cell">${icon} ${this.escapeHtml(name)}</td>
                            <td class="center">${st.totalTasks}</td>
                            <td class="center"><span class="analytics-percentage ${this.getPerformanceClass(st.correctPercentage)}">${st.correctPercentage}%</span></td>
                            <td class="center">${weakCount}</td>
                        </tr>
                    `;
                }).join('');
                tbody.innerHTML = rowsCompact || '<tr><td colspan="4" class="center">Brak danych</td></tr>';
                // Click to open subject
                tbody.addEventListener('click', (e) => {
                    const tr = e.target.closest('tr[data-subject]');
                    if (!tr) return;
                    const subject = tr.getAttribute('data-subject');
                    if (window.leftNavigationManager) {
                        window.leftNavigationManager.navigateToSubjectAnalytics(subject);
                    } else if (this.showSubjectAnalytics) {
                        this.showSubjectAnalytics(subject);
                    }
                });
            }
        };
        if ('IntersectionObserver' in window) {
            const io = new IntersectionObserver((entries, obs) => {
                for (const e of entries) {
                    if (e.isIntersecting) { lazyInit(); obs.disconnect(); break; }
                }
            }, { rootMargin: '0px 0px -25% 0px' });
            io.observe(analyticsContent);
        } else {
            lazyInit();
        }

        this.setSummaryTabActive(true);

        // Row click: navigate to subject analytics
        const table = analyticsContent.querySelector('.analytics-table');
        if (table) {
            table.addEventListener('click', (e) => {
                const tr = e.target.closest('tr[data-subject]');
                if (!tr) return;
                const subject = tr.getAttribute('data-subject');
                if (!subject) return;
                if (window.leftNavigationManager) {
                    window.leftNavigationManager.navigateToSubjectAnalytics(subject);
                } else if (this.showSubjectAnalytics) {
                    this.showSubjectAnalytics(subject);
                }
            });
        }
    }

    /**
     * Toggle active state on the summary tab button
     */
    setSummaryTabActive(isActive) {
        const btn = document.getElementById('summary-tab-btn');
        if (!btn) return;
        if (isActive) btn.classList.add('active'); else btn.classList.remove('active');
    }
    
    /**
     * Render subject selection buttons with enhanced information
     */
    renderSubjectButtons() {
        const subjectSelectionSection = document.getElementById('subject-selection-section');
        const subjectButtonsContainer = document.getElementById('subject-buttons');
        
        if (!subjectSelectionSection || !subjectButtonsContainer) return;
        
        // Show the selection section
        subjectSelectionSection.style.display = 'block';
        
        // Create buttons for each subject
        const subjects = Object.keys(this.subjectAnalytics);
        let buttonsHTML = '';
        
        subjects.forEach(subjectName => {
            const subject = this.subjectAnalytics[subjectName];
            const stats = subject.stats;
            const categoryPerformance = subject.categoryPerformance || [];
            
            // Get subject icon based on name
            const icon = this.getSubjectIcon(subjectName);
            
            // Calculate additional stats
            const averagePercentage = stats.correctPercentage;
            const performanceClass = this.getPerformanceClass(averagePercentage);
            const statusEmoji = this.getPerformanceEmoji(averagePercentage);
            
            // Calculate weak categories count
            const weakCategoriesCount = categoryPerformance.filter(cat => 
                cat.totalTasks >= 3 && cat.correctPercentage < 60
            ).length;
            
            // Calculate strong categories count
            const strongCategoriesCount = categoryPerformance.filter(cat => 
                cat.correctPercentage >= 80
            ).length;
            
            // Get recent activity info
            const recentTasks = subject.tasks.slice(-3); // Last 3 tasks
            const lastActivity = recentTasks.length > 0 ? 
                this.formatTimeAgo(recentTasks[recentTasks.length - 1].timestamp) : 'Brak aktywności';
            
            // Get trend information
            const trendData = this.getSubjectTrendData(subject.tasks);
            
            buttonsHTML += `
                <div class="subject-card" data-subject="${this.escapeHtml(subjectName)}">
                    <div class="subject-card-header">
                        <div class="subject-icon-container">
                            <span class="subject-icon">${icon}</span>
                        </div>
                        <div class="subject-main-info">
                            <h3 class="subject-name">${this.escapeHtml(subjectName)}</h3>
                            <div class="subject-meta">
                                <span class="tasks-count">${stats.totalTasks} zadań</span>
                                <span class="last-activity">${lastActivity}</span>
                            </div>
                        </div>
                        <div class="subject-trend ${trendData.class}">
                            <span class="trend-icon">${trendData.icon}</span>
                            <span class="trend-text">${trendData.text}</span>
                        </div>
                    </div>
                    
                    <div class="subject-stats-container">
                        <div class="accuracy-display">
                            <div class="accuracy-circle ${performanceClass}">
                                <span class="accuracy-percentage">${stats.correctPercentage}%</span>
                                <span class="accuracy-label">dokładności</span>
                            </div>
                            <div class="task-counts">
                                <div class="correct-tasks">
                                    <span class="count-icon">✅</span>
                                    <span class="count-value">${stats.correctTasks}</span>
                                </div>
                                <div class="incorrect-tasks">
                                    <span class="count-icon">❌</span>
                                    <span class="count-value">${stats.incorrectTasks}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="categories-summary">
                            <div class="performance-metrics">
                                <div class="metric-row primary">
                                    <div class="metric-number">${stats.totalTasks}</div>
                                    <div class="metric-label">Wszystkich zadań</div>
                                </div>
                                <div class="metric-separator"></div>
                                <div class="metric-row success">
                                    <div class="metric-number">${stats.correctTasks}</div>
                                    <div class="metric-label">Poprawnych</div>
                                </div>
                                <div class="metric-separator"></div>
                                <div class="metric-row error">
                                    <div class="metric-number">${stats.incorrectTasks}</div>
                                    <div class="metric-label">Błędnych</div>
                                </div>
                            </div>
                            <div class="subject-status-badge ${stats.correctPercentage >= 80 ? 'excellent' : stats.correctPercentage >= 60 ? 'good' : stats.correctPercentage >= 40 ? 'average' : 'needs-work'}">
                                ${stats.correctPercentage >= 80 ? '⭐ Świetnie!' : stats.correctPercentage >= 60 ? '👍 Dobrze' : stats.correctPercentage >= 40 ? '🔄 W toku' : '💪 Trenuj więcej'}
                            </div>
                        </div>
                    </div>
                    
                    <div class="subject-history">
                        <div class="history-header">${this.getHistoryLabel(subject.tasks.length)}</div>
                        ${subject.tasks.length >= 2 ? 
                            `<div class="history-chart">
                                ${this.renderHistoryChart(subject.tasks)}
                            </div>` :
                            `<div class="history-chart-placeholder">
                                Za mało danych
                            </div>`
                        }
                    </div>
                </div>
            `;
        });
        
        subjectButtonsContainer.innerHTML = buttonsHTML;
        
        // Add click event listeners
        this.setupSubjectButtonListeners();
    }
    
    /**
     * Setup event listeners for subject buttons
     */
    setupSubjectButtonListeners() {
        const subjectButtons = document.querySelectorAll('.subject-button, .subject-card');
        
        subjectButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                // Don't trigger if clicking on footer buttons
                if (e.target.matches('.view-details-btn, .add-task-btn')) {
                    e.stopPropagation();
                    return;
                }
                
                const subjectName = button.getAttribute('data-subject');
                this.showSubjectAnalytics(subjectName);
            });
        });
    }
    
    /**
     * Show analytics for selected subject
     */
async showSubjectAnalytics(subjectName) {
        // Ensure analytics data is available
        if (!this.subjectAnalytics || !this.subjectAnalytics[subjectName]) {
            try {
                await this.loadAnalyticsData();
            } catch (e) {
                console.warn('Failed to load analytics data on demand:', e);
            }
        }
        // Try again after loading
        let subject = this.subjectAnalytics ? this.subjectAnalytics[subjectName] : null;
        if (!subject) {
            // Try case-insensitive match as fallback
            const key = Object.keys(this.subjectAnalytics || {}).find(k => k.toLowerCase() === String(subjectName).toLowerCase());
            if (key) subject = this.subjectAnalytics[key];
        }
        if (!subject) return;
        
        const analyticsContent = document.getElementById('analytics-content');
        
        if (!analyticsContent) return;
        
        // Console: clear everything and only log math summary
        try {
            console.clear();
            if (!window.__consoleSilenced) {
                window.__consoleOriginal = {
                    log: console.log,
                    info: console.info,
                    warn: console.warn,
                    error: console.error,
                    debug: console.debug
                };
                console.log = function(){};
                console.warn = function(){};
                console.error = function(){};
                console.debug = function(){};
                window.__consoleSilenced = true;
            }
            const sName = String(subject.name || subjectName || '');
            const isMath = /matem|math/i.test(sName);
            if (isMath) {
                const t = subject.tasks || [];
                const total = t.length;
                const correct = t.filter(tt => this.isTaskCorrect(tt)).length;
                const incorrect = total - correct;
                const catCount = Object.keys(subject.categories || {}).length;
                const last = total > 0 ? this.formatTimeAgo(t[t.length - 1].timestamp) : '—';
                console.info('[MATH] Subject:', sName);
                console.info('[MATH] Tasks:', total, '| Correct:', correct, '| Incorrect:', incorrect, '| Categories:', catCount);
                console.info('[MATH] Last activity:', last);
            }
        } catch(_) {}
        
        // Keep subject selection visible and update active state
        this.updateSelectedSubject(subjectName);
        
        // Show subject analytics without back button since list stays visible
        const html = `
            <div class="current-subject-display">
                <h4 class="current-subject-title">
                    ${this.getSubjectIcon(subjectName)} Szczegółowa analityka: ${this.escapeHtml(subjectName)}
                </h4>
            </div>
            ${this.renderSubjectSection(subject)}
        `;
        
        analyticsContent.innerHTML = html;
        this.setSummaryTabActive(false);
        
        // Small reveal animation on first render
        const rootSec = analyticsContent.querySelector('.subject-analytics-section');
        if (rootSec) {
            rootSec.classList.add('reveal');
            setTimeout(()=> rootSec.classList.remove('reveal'), 280);
        }
        
        // Safe, reusable id for DOM containers in this subject section
        const safeId = this.getSafeId(subject.name);
        
        // Enhance interactions (delegation, labels, filtering)
        this.enhanceSubjectTableInteractions(safeId);
        this.enhanceSubjectSubnavAndFilters(safeId, subject);

        // Wire mobile action bar
        const mab = document.getElementById(`mobile-action-bar-${safeId}`);
        if (mab) {
            mab.addEventListener('click', (e) => {
                const btn = e.target.closest('button[data-action]');
                if (!btn) return;
                const action = btn.getAttribute('data-action');
                if (action === 'start-study') {
                    if (window.navigationManager) window.navigationManager.showForm('study');
                } else if (action === 'add-task') {
                    if (window.navigationManager) window.navigationManager.showForm('main');
                } else if (action === 'view-sessions') {
                    // Switch to Sessions subsection
                    const subnav = document.getElementById(`subnav-${safeId}`);
                    const ses = subnav && subnav.querySelector('[data-subsection="sessions"]');
                    if (ses) ses.click();
                }
            });
        }
        
        // Render charts lazily when visible
        const lazyInit = () => {
            if (!this.chartsManager) return;
            // Apply ambient class to chart shells
            const ambients = document.querySelectorAll('.enhanced-chart-section');
            ambients.forEach(a => a.classList.add('chart-ambient'));

            this.chartsManager.createDailyAccuracyWithOverallLineChart(
                subject.tasks,
                subject.stats?.correctPercentage || 0,
                `daily-accuracy-${safeId}`
            );
            this.chartsManager.createCategoryAccuracyLineChart(
                subject.tasks,
                `category-accuracy-${safeId}`
            );
            // Time analysis
            this.renderTimeAnalysis(subject);
            // Mini heatmap activity for this subject
            const dailyActivity = this.buildDailyActivity(subject.tasks);
            this.chartsManager.createConsistencyHeatmapChart({ dailyActivity }, `subject-heatmap-${safeId}`);
        };
        const sectionEl = analyticsContent.querySelector('.subject-analytics-section');
        if ('IntersectionObserver' in window && sectionEl) {
            const io = new IntersectionObserver((entries, obs) => {
                for (const e of entries) {
                    if (e.isIntersecting) {
                        lazyInit();
                        obs.disconnect();
                        break;
                    }
                }
            }, { rootMargin: '0px 0px -25% 0px' });
            io.observe(sectionEl);
        } else {
            lazyInit();
        }

        // Back-to-top button and compact header on scroll
        this.injectBackToTop();
        this.setupSubjectScrollUX();
    }
    
    // Charts functionality removed
    
    /**
     * Update selected subject visual state
     */
    updateSelectedSubject(selectedSubjectName) {
        const subjectButtons = document.querySelectorAll('.subject-button, .subject-card');
        
        subjectButtons.forEach(button => {
            const buttonSubject = button.getAttribute('data-subject');
            if (buttonSubject === selectedSubjectName) {
                button.classList.add('selected');
            } else {
                button.classList.remove('selected');
            }
        });
    }
    
    /**
     * Render message prompting user to select a subject
     */
    renderSelectSubjectMessage() {
        const analyticsContent = document.getElementById('analytics-content');
        if (!analyticsContent) return;
        
        analyticsContent.innerHTML = `
            <div class="no-analytics-data">
                <div class="no-analytics-icon">👆</div>
                <div class="no-analytics-title">Wybierz przedmiot do analizy</div>
                <div class="no-analytics-subtitle">Kliknij na przycisk przedmiotu powyżej, aby zobaczyć szczegółową analitykę.<br>Lista przedmiotów pozostanie widoczna dla łatwego przełączania.</div>
            </div>
        `;
    }
    
    /**
     * Get icon for subject (can be customized)
     */
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
        return '📚'; // default icon
    }
    
    /**
     * Get performance emoji based on percentage
     */
    getPerformanceEmoji(percentage) {
        if (percentage >= 90) return '🏆'; // trophy
        if (percentage >= 80) return '🎆'; // fireworks
        if (percentage >= 70) return '✅'; // check mark
        if (percentage >= 60) return '🟡'; // yellow circle
        if (percentage >= 50) return '🟠'; // orange circle
        if (percentage >= 30) return '🔴'; // red circle
        return '🆘'; // SOS
    }
    
    /**
     * Get subject trend data for new card format
     */
    getSubjectTrendData(tasks) {
        const trendHTML = this.getSubjectTrend(tasks);
        
        // Extract trend info from the HTML
        if (trendHTML.includes('improving')) {
            return { class: 'improving', icon: '📈', text: 'Poprawa' };
        } else if (trendHTML.includes('declining')) {
            return { class: 'declining', icon: '📉', text: 'Spadek' };
        } else if (trendHTML.includes('stable')) {
            return { class: 'stable', icon: '➡️', text: 'Stabilnie' };
        } else {
            return { class: 'neutral', icon: '📊', text: 'Nowe dane' };
        }
    }
    
    /**
     * Get history label based on task count
     */
    getHistoryLabel(taskCount) {
        if (taskCount === 0) return 'Historia';
        const displayCount = Math.min(taskCount, 10);
        return `Ostatnie ${displayCount} zadań`;
    }
    
    /**
     * Render history chart for new card format
     */
    renderHistoryChart(tasks) {
        const maxBars = (this.config && this.config.RECENT_TIMELINE_COUNT) || 20;
        const recentTasks = tasks.slice(-maxBars);
        const containerId = `recent-${Date.now()}-${Math.floor(Math.random()*1000)}`;

        // Compute stats
        const correctCount = recentTasks.filter(t => this.isTaskCorrect(t)).length;
        const total = recentTasks.length;
        const incorrectCount = total - correctCount;
        const percent = total > 0 ? Math.round((correctCount/total)*100) : 0;

        // Current incorrect-only streak or correct-streak? We'll show current correct streak
        let currentCorrectStreak = 0;
        for (let i = recentTasks.length - 1; i >= 0; i--) {
            if (this.isTaskCorrect(recentTasks[i])) currentCorrectStreak++; else break;
        }

        // Build timeline bars
        const timeline = recentTasks.map((task, index) => {
            const isCorrect = this.isTaskCorrect(task);
            const className = isCorrect ? 'correct' : 'incorrect';
            const statusText = isCorrect ? 'Poprawne' : 'Błędne';
            const label = task.name ? this.escapeHtml(task.name) : (task.timestamp || 'Zadanie');
            const dateStr = this.formatTaskDate(task.timestamp);
            const timeStr = this.formatTaskTime(task.timestamp);
            const tip = `${dateStr} ${timeStr} • ${label} • ${statusText}`;
            return `<div class="mini-bar ${className}" data-index="${index}" title="${this.escapeHtml(tip)}"></div>`;
        }).join('');

        // Build details list
        const details = recentTasks.map((task, index) => {
            const isCorrect = this.isTaskCorrect(task);
            const correctnessClass = isCorrect ? 'correct' : 'incorrect';
            const correctnessText = isCorrect ? '✅ Poprawne' : '❌ Niepoprawne';
            const dateStr = this.formatTaskDate(task.timestamp);
            const timeStr = this.formatTaskTime(task.timestamp);
            const cats = task.categoriesString || task.category || '';
            // Optional duration if available
            let durationHtml = '';
            if (task.start_time && task.end_time) {
                const dur = new Date(task.end_time) - new Date(task.start_time);
                if (dur > 0) durationHtml = `<span class="detail-time">⏱️ ${this.formatDuration(dur)}</span>`;
            }
            return `
                <div class="detail-item ${correctnessClass}" data-incorrect="${!isCorrect}">
                    <div class="detail-left">
                        <div class="dot ${correctnessClass}"></div>
                        <div class="detail-main">
                            <div class="detail-title">${this.escapeHtml(task.name || 'Zadanie')}</div>
                            <div class="detail-meta">${dateStr} • ${timeStr} ${durationHtml}</div>
                        </div>
                    </div>
                    <div class="detail-right">
                        <span class="detail-status ${correctnessClass}">${correctnessText}</span>
                        ${cats ? `<span class="detail-cats">🏷️ ${this.escapeHtml(cats)}</span>` : ''}
                    </div>
                </div>`;
        }).join('');

        // Build widget
        return `
            <div class="recent-tasks-widget" id="${containerId}">
                <div class="recent-summary">
                    <span class="chip neutral">Ostatnie ${total}</span>
                    <span class="chip success">${correctCount} poprawnych</span>
                    <span class="chip error">${incorrectCount} błędnych</span>
                    <span class="chip info">${percent}%</span>
                    <span class="chip streak">🔥 Passa: ${currentCorrectStreak}</span>
                    <div class="recent-actions">
                        <label class="control-item">
                            <input type="checkbox" data-action="recent-only-incorrect" data-container="${containerId}">
                            Tylko błędne
                        </label>
                        <button type="button" class="btn-mini" data-action="recent-details" data-container="${containerId}">Szczegóły</button>
                    </div>
                </div>
                <div class="timeline" id="${containerId}-timeline">
                    ${timeline}
                </div>
                <div class="recent-details" id="${containerId}-details" style="display:none;">
                    ${details}
                </div>
            </div>
        `;
    }

    toggleRecentDetails(containerId) {
        const el = document.getElementById(`${containerId}-details`);
        if (!el) return;
        el.style.display = (el.style.display === 'none' || el.style.display === '') ? 'block' : 'none';
    }

    setRecentFilterIncorrect(containerId, onlyIncorrect) {
        const details = document.getElementById(`${containerId}-details`);
        const timeline = document.getElementById(`${containerId}-timeline`);
        if (details) {
            const items = details.querySelectorAll('.detail-item');
            items.forEach(it => {
                const isIncorrect = it.getAttribute('data-incorrect') === 'true';
                if (onlyIncorrect) {
                    it.style.display = isIncorrect ? 'flex' : 'none';
                } else {
                    it.style.display = 'flex';
                }
            });
        }
        if (timeline) {
            if (onlyIncorrect) timeline.classList.add('dim-correct'); else timeline.classList.remove('dim-correct');
        }
    }
    
    /**
     * Get subject trend based on recent tasks
     */
    getSubjectTrend(tasks) {
        if (tasks.length < 3) return '<span class="trend neutral">📊 Nowe dane</span>';
        
        // Get last 5 tasks and first 5 tasks for comparison
        const recentTasks = tasks.slice(-5);
        const earlierTasks = tasks.slice(0, 5);
        
        const recentCorrect = recentTasks.filter(task => this.isTaskCorrect(task)).length;
        const earlierCorrect = earlierTasks.filter(task => this.isTaskCorrect(task)).length;
        
        const recentPercentage = (recentCorrect / recentTasks.length) * 100;
        const earlierPercentage = earlierTasks.length > 0 ? (earlierCorrect / earlierTasks.length) * 100 : recentPercentage;
        
        const difference = recentPercentage - earlierPercentage;
        
        if (difference > 10) {
            return '<span class="trend improving">📈 Poprawa</span>';
        } else if (difference < -10) {
            return '<span class="trend declining">📉 Spadek</span>';
        } else {
            return '<span class="trend stable">➡️ Stabilnie</span>';
        }
    }
    
    /**
     * Render mini chart for subject button
     */
    renderMiniChart(tasks) {
        if (tasks.length < 5) {
            return '<div class="mini-chart-placeholder">Za mało danych</div>';
        }
        
        // Get last 10 tasks for mini chart
        const recentTasks = tasks.slice(-10);
        const chartBars = recentTasks.map(task => {
            const isCorrect = this.isTaskCorrect(task);
            const barClass = isCorrect ? 'correct' : 'incorrect';
            return `<div class="mini-bar ${barClass}" title="${task.name}: ${isCorrect ? 'Poprawne' : 'Błędne'}"></div>`;
        }).join('');
        
        return `
            <div class="mini-chart-bars">
                ${chartBars}
            </div>
            <div class="mini-chart-label">Ostatnie ${recentTasks.length} zadań</div>
        `;
    }

    /**
     * Compute enhanced time-of-day summary for a subject with best/worst periods
     */
    computeTimeOfDaySummary(tasks) {
        const periods = {
            RANO: { label: 'Rano (6:00–12:00)', emoji: '🌅', start: 6, end: 12, total: 0, correct: 0, totalTime: 0 },
            POPO: { label: 'Popołudnie (12:00–18:00)', emoji: '☀️', start: 12, end: 18, total: 0, correct: 0, totalTime: 0 },
            WIEC: { label: 'Wieczór (18:00–24:00)', emoji: '🌙', start: 18, end: 24, total: 0, correct: 0, totalTime: 0 },
            NOC:  { label: 'Noc (0:00–6:00)', emoji: '🌃', start: 0, end: 6, total: 0, correct: 0, totalTime: 0 }
        };
        
        (tasks || []).forEach(task => {
            const ts = task.start_time || task.timestamp;
            const hour = ts ? new Date(ts).getHours() : null;
            if (hour === null || isNaN(hour)) return;
            
            let key;
            if (hour >= 6 && hour < 12) key = 'RANO';
            else if (hour >= 12 && hour < 18) key = 'POPO';
            else if (hour >= 18 && hour < 24) key = 'WIEC';
            else key = 'NOC';
            
            periods[key].total++;
            if (this.isTaskCorrect(task)) periods[key].correct++;
            
            // Calculate time spent if available
            if (task.start_time && task.end_time) {
                const duration = new Date(task.end_time) - new Date(task.start_time);
                if (duration > 0) {
                    periods[key].totalTime += duration;
                }
            }
        });
        
        // Calculate accuracy for each period and find best/worst
        const periodStats = [];
        Object.entries(periods).forEach(([key, period]) => {
            if (period.total > 0) {
                const accuracy = Math.round((period.correct / period.total) * 100);
                periodStats.push({
                    key,
                    ...period,
                    accuracy,
                    averageTime: period.total > 0 ? Math.round(period.totalTime / period.total) : 0
                });
            }
        });
        
        // Sort by accuracy to find best/worst (minimum 3 tasks for reliable data)
        const reliablePeriods = periodStats.filter(p => p.total >= 3);
        const sortedByAccuracy = [...periodStats].sort((a, b) => b.accuracy - a.accuracy);
        
        const best = reliablePeriods.length > 0 ? 
            reliablePeriods.reduce((best, current) => 
                current.accuracy > best.accuracy ? current : best
            ) : (periodStats.length > 0 ? sortedByAccuracy[0] : null);
            
        const worst = reliablePeriods.length > 0 ? 
            reliablePeriods.reduce((worst, current) => 
                current.accuracy < worst.accuracy ? current : worst
            ) : (periodStats.length > 1 ? sortedByAccuracy[sortedByAccuracy.length - 1] : null);
        
        // Calculate total study time across all periods
        const totalStudyTime = Object.values(periods).reduce((sum, period) => sum + period.totalTime, 0);
        
        return {
            periods: periodStats,
            best,
            worst,
            totalStudyTime,
            totalTasks: periodStats.reduce((sum, period) => sum + period.total, 0),
            overallAccuracy: periodStats.length > 0 ? 
                Math.round((periodStats.reduce((sum, p) => sum + p.correct, 0) / 
                           periodStats.reduce((sum, p) => sum + p.total, 0)) * 100) : 0
        };
    }

    /**
     * Render a complete section for one subject
     */
renderSubjectSection(subject) {
        const stats = subject.stats;
        const categoryPerformance = subject.categoryPerformance;
        const strongCategories = subject.strongCategories;
        const weakCategories = subject.weakCategories;
        const safeId = this.getSafeId(subject.name);
        const accent = this.getSubjectAccentColor(subject.name);
const lastActivity = subject.tasks.length > 0 ? this.formatTimeAgo(subject.tasks[subject.tasks.length - 1].timestamp) : '—';
        
        return `
            <div class="subject-analytics-section" style="--subject-accent: ${accent}">
<div class="subject-sticky-header">
                    <div class="subject-breadcrumb">Analityka › Przedmioty › ${this.escapeHtml(subject.name)}</div>
<div class="subject-hero">
                        <div class="subject-avatar" aria-hidden="true">
                            <div class="avatar-ring"><span class="avatar-emoji">${this.getSubjectIcon(subject.name)}</span></div>
                        </div>
                        <div class="subject-hero-main">
                            <h3 class="subject-name">${this.escapeHtml(subject.name)}</h3>
                        </div>
                        <div class="hero-stat" aria-label="Skuteczność">
                            <div class="stat-value">${stats.correctPercentage}%</div>
                            <div class="stat-label">Skuteczność</div>
                        </div>
                    </div>
                    <div class="subject-controls">
<div class="subject-subnav" id="subnav-${safeId}" role="tablist" aria-label="Sekcje">
                            <button class="subnav-pill" data-subsection="overview" aria-current="page">Przegląd</button>
                            <button class="subnav-pill" data-subsection="time">Czas</button>
                            <button class="subnav-pill" data-subsection="sessions">Sesje</button>
                        </div>
<div class="subject-toolbar">
                            <div class="timeframe-group" id="timeframe-${safeId}">
                                <button class="time-btn" data-range="7" aria-label="Zakres: Tydzień">Tydzień</button>
                                <button class="time-btn" data-range="30" aria-label="Zakres: 30 dni">30 dni</button>
                                <button class="time-btn" data-range="90" aria-label="Zakres: 90 dni">90 dni</button>
                                <button class="time-btn" data-range="all" aria-label="Zakres: Wszystko">Wszystko</button>
                                <button class="time-btn compact" id="timeframe-toggle-${safeId}" aria-label="Zmień zakres" title="Zmień zakres">🗓️</button>
                            </div>
                            <div class="toolbar-right">
                                <div class="active-filters" id="active-filters-${safeId}"></div>
                                <button class="filters-toggle" id="filters-toggle-${safeId}" aria-controls="filters-panel-${safeId}" aria-expanded="false">Filtry (0)</button>
                            </div>
                        </div>
                        <div class="filters-panel" id="filters-panel-${safeId}" hidden>
                            <div class="filter-chips" id="filters-${safeId}">
                                <button class="filter-chip" data-filter="correct" aria-pressed="false" aria-label="Filtr: poprawne">Poprawne</button>
                                <button class="filter-chip" data-filter="incorrect" aria-pressed="false" aria-label="Filtr: błędne">Błędne</button>
                                <button class="filter-chip selector" data-select="location" aria-haspopup="true" aria-expanded="false" aria-label="Filtr: miejsce">Miejsce ▾</button>
                                <button class="filter-chip selector" data-select="difficulty" aria-haspopup="true" aria-expanded="false" aria-label="Filtr: trudność">Trudność ▾</button>
                            </div>
                        </div>
                    </div>
                </div>
                
<section class="subject-section active" id="section-overview-${safeId}">
                    <div class="subject-section-header"><span class="section-title">Przegląd</span><button class="btn-mini" data-accordion="toggle">▾</button></div>

                    <div class="recent-activity">${this.renderHistoryChart(subject.tasks)}</div>

<div class="kpi-grid">
                        <div class="kpi-card grad" aria-label="Zadania"><div class="kpi-icon">📦</div><div class="kpi-title">Zadania</div><div class="kpi-value">${stats.totalTasks}</div><div class="kpi-diff">—</div></div>
                        <div class="kpi-card grad" aria-label="Skuteczność"><div class="kpi-icon">🎯</div><div class="kpi-title">Skuteczność</div><div class="kpi-value">${stats.correctPercentage}%</div><div class="kpi-diff">—</div></div>
                        <div class="kpi-card grad" aria-label="Aktywne kategorie"><div class="kpi-icon">🏷️</div><div class="kpi-title">Kategorie</div><div class="kpi-value">${categoryPerformance.length}</div><div class="kpi-diff">—</div></div>
                        <div class="kpi-card grad" aria-label="Ostatnia aktywność"><div class="kpi-icon">⏱️</div><div class="kpi-title">Ostatnio</div><div class="kpi-value">${lastActivity}</div><div class="kpi-diff">—</div></div>
                    </div>


                <!-- Extra Subject Metrics -->
                ${(() => {
                    const ts = (this.timeSeriesData && this.timeSeriesData[subject.name] && this.timeSeriesData[subject.name].data) || [];
                    let avgAcc = 0, bestAcc = 0, bestDate = null;
                    if (ts.length > 0) {
                        const sum = ts.reduce((s,d)=> s + (d.dailyAccuracy || 0), 0);
                        avgAcc = Math.round(sum / ts.length);
                        const best = ts.reduce((b,d)=> (d.dailyAccuracy||0) > (b.dailyAccuracy||0) ? d : b, ts[0]);
                        bestAcc = best.dailyAccuracy || 0;
                        bestDate = best.date ? new Date(best.date) : null;
                    }
                    const tod = this.computeTimeOfDaySummary(subject.tasks);
                    const bestDateStr = bestDate ? bestDate.toLocaleDateString('pl-PL') : '—';
                    
                    // Enhanced time analysis display
                    const totalStudyTimeFormatted = tod.totalStudyTime > 0 ? 
                        this.formatDuration(tod.totalStudyTime) : '—';
                    
                    return `
                        <div class="analytics-summary-cards">
                            <div class="analytics-summary-card">
                                <div class="analytics-card-icon">📈</div>
                                <h4 class="analytics-card-value neutral">${avgAcc}%</h4>
                                <p class="analytics-card-label">Średnia skuteczność</p>
                                <p class="analytics-card-subtext">w analizowanym okresie</p>
                            </div>
                            <div class="analytics-summary-card">
                                <div class="analytics-card-icon">📅</div>
                                <h4 class="analytics-card-value neutral">${bestAcc}%</h4>
                                <p class="analytics-card-label">Najlepszy dzień</p>
                                <p class="analytics-card-subtext">${bestDateStr}</p>
                            </div>
                            <div class="analytics-summary-card">
                                <div class="analytics-card-icon">⏰</div>
                                <h4 class="analytics-card-value neutral">${totalStudyTimeFormatted}</h4>
                                <p class="analytics-card-label">Łączny czas nauki</p>
                                <p class="analytics-card-subtext">${tod.totalTasks} zadań</p>
                            </div>
                        </div>
                    `;
                })()}
                
                <!-- 1) Performance Sections -->
                ${this.renderPerformanceSections(strongCategories, weakCategories)}

                <!-- Kategorie - szczegółowa tabela na dole -->
                ${this.renderSubjectDetailedTable(categoryPerformance, subject.name)}
            
                </section>
                
                
                <section class="subject-section" id="section-time-${safeId}">
                    <div class="subject-section-header"><span class="section-title">Czas</span><button class="btn-mini" data-accordion="toggle">▾</button></div>
                    <!-- 3) Dzienna dokładność vs ogólna -->
                    <div class="subject-chart-card" style="grid-column: 1 / -1; background: transparent; border: none; box-shadow: none; padding: 0;">
                        <div class="enhanced-chart-section">
                            <div class="enhanced-chart-header">
                                <h2 class="enhanced-chart-title">📊 Dzienna dokładność vs ogólna</h2>
                                <div class="chart-subtitle" id="chart-subtitle-${safeId}"></div>
                            </div>
                            <div class="enhanced-chart-container" id="daily-accuracy-${safeId}"></div>
                            <div class="chart-footer" id="chart-footer-${safeId}"></div>
                        </div>
                    </div>
                    
                    <!-- 4) Skuteczność kategorii w czasie -->
                    <div class="subject-chart-card">
                        <h4 class="subject-chart-title">🏷️ Skuteczność kategorii w czasie</h4>
                        <div class="subject-chart" id="category-accuracy-${safeId}"></div>
                    </div>
                    
                    <!-- 5) Analiza czasu -->
                    <div class="time-analysis-section" id="time-analysis-${safeId}">
                        <h4 class="subject-chart-title">⏱️ Analiza czasu</h4>
                        <div class="time-analysis-content"></div>
                    </div>

                    <!-- 6) Aktywność (mini heatmapa) -->
                    <div class="subject-chart-card">
                        <h4 class="subject-chart-title">🔥 Aktywność (ostatnie 90 dni)</h4>
                        <div id="subject-heatmap-${safeId}"></div>
                    </div>
                </section>
                
                <section class="subject-section" id="section-sessions-${safeId}">
                    <div class="subject-section-header"><span class="section-title">Sesje</span><button class="btn-mini" data-accordion="toggle">▾</button></div>
                    <div class="sessions-list" id="sessions-list-${safeId}"></div>
                    <div style="margin-top:8px;"><button class="btn-mini" id="sessions-more-${safeId}">Pokaż więcej</button></div>
                </section>
                
                <div class="mobile-action-bar" id="mobile-action-bar-${safeId}">
                    <button class="btn btn-primary" data-action="start-study">Rozpocznij naukę</button>
                    <button class="btn btn-secondary" data-action="add-task">Dodaj zadanie</button>
                    <button class="btn btn-outline" data-action="view-sessions">Wszystkie sesje</button>
                </div>
            </div>
        `;
    }
    
    // Charts functionality removed
    
    /**
     * Render good and weak performance sections
     */
    renderPerformanceSections(strongCategories, weakCategories) {
        return `
            <div class="performance-sections">
                <div class="performance-section good">
                    <div class="performance-section-header">
                        <h4 class="performance-section-title">🏆 Najlepiej opanowane</h4>
                    </div>
                    <div class="performance-section-content">
                        ${strongCategories.length > 0 ? 
                            strongCategories.map(cat => this.renderCategoryPerformanceItem(cat)).join('') :
                            '<p>Brak kategorii z wysoką skutecznością (≥80%)</p>'
                        }
                    </div>
                </div>
                
                <div class="performance-section weak">
                    <div class="performance-section-header">
                        <h4 class="performance-section-title">⚠️ Wymagają poprawy</h4>
                    </div>
                    <div class="performance-section-content">
                        ${weakCategories.length > 0 ? 
                            weakCategories.map(cat => this.renderCategoryPerformanceItem(cat)).join('') :
                            '<p>Świetna robota! Brak słabych kategorii.</p>'
                        }
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Render individual category performance item
     */
    renderCategoryPerformanceItem(category) {
        const performanceClass = category.correctPercentage >= 80 ? 'good' : 
                                category.correctPercentage >= 60 ? 'warning' : 'error';
        const textClass = category.correctPercentage >= 80 ? 'good' : 
                          category.correctPercentage >= 60 ? 'warning' : 'error';
        
        return `
            <div class="category-performance-item">
                <div class="category-performance-name">
                    🎯 ${this.escapeHtml(category.name)}
                </div>
                <div class="category-performance-bar">
                    <div class="category-progress-bar ${performanceClass}" style="width: ${category.correctPercentage}%"></div>
                    <span class="category-performance-text ${textClass}">
                        ${category.correctPercentage}% (${category.correctTasks}/${category.totalTasks})
                    </span>
                </div>
            </div>
        `;
    }
    
    /**
     * Render detailed table for subject
     */
renderSubjectDetailedTable(categoryPerformance, subjectName) {
        const safeId = this.getSafeId(subjectName);
        // Reset category task map for this render
        this._categoryTaskMap = {};
        return `
            <div class="detailed-table-section" data-subject-id="${safeId}">
                <div class="detailed-table-header">
                    <h4 class="detailed-table-title">📋 Szczegółowe statystyki - ${this.escapeHtml(subjectName)}</h4>
                    <p class="detailed-table-subtitle">Kliknij na kategorię, aby zobaczyć listę zadań</p>
                    <div class="table-controls" id="table-controls-${safeId}">
                        <input type="search" class="control-select" placeholder="Szukaj kategorii…" id="table-search-${safeId}" aria-label="Szukaj kategorii">
                        <label class="control-item" style="margin-left:.5rem;">
                            <input type="checkbox" id="table-one-open-${safeId}">
                            Tylko jedna sekcja rozwinięta
                        </label>
                    </div>
                </div>
                
                <div class="analytics-table-container">
                    <table class="analytics-table expandable-table" id="analytics-table-${safeId}">
                        <thead>
                            <tr>
                                <th>🏷️ Kategoria</th>
                                <th class="center">📊 Zadania</th>
                                <th class="center">🎯 Skuteczność</th>
                                <th class="center">📈 Postęp</th>
                                <th class="center">🔽 Szczegóły</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${categoryPerformance.map(category => this.renderExpandableTableRow(category, subjectName)).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
    
    /**
     * Render expandable table row for category with task list
     */
    renderExpandableTableRow(category, subjectName) {
        const performanceClass = category.correctPercentage >= 70 ? 'good' : 
                                category.correctPercentage >= 50 ? 'warning' : 'error';
        
        const categoryId = `category-${this.escapeHtml(category.name).replace(/[^a-zA-Z0-9]/g, '-')}`;
        const tasksCount = category.tasks ? category.tasks.length : 0;
        
        // Debug logging
        console.log(`%c📋 [ANALYTICS] Rendering category: ${category.name}`, 'color: #7c3aed; font-weight: bold;');
        console.log(`  Tasks count: ${tasksCount}`);
        console.log(`  Tasks array:`, category.tasks);
        
// Store tasks for lazy render
        this._categoryTaskMap = this._categoryTaskMap || {};
        this._categoryTaskMap[categoryId] = category.tasks || [];
        return `
            <tr class="category-row" data-category="${this.escapeHtml(category.name)}" data-target="${categoryId}">
                <td class="category-name-cell">
                    <div class="category-name-container">
                        <span class="category-expand-icon" role="button" tabindex="0" aria-expanded="false" aria-controls="${categoryId}" data-toggle="category" data-target="${categoryId}" aria-label="Pokaż zadania dla ${this.escapeHtml(category.name)}">▶️</span>
                        <strong>${this.escapeHtml(category.name)}</strong>
                    </div>
                </td>
                <td class="center">${category.correctTasks}/${category.totalTasks}</td>
                <td class="center">
                    <span class="analytics-percentage ${performanceClass}">${category.correctPercentage}%</span>
                </td>
                <td class="center">
                    <div class="analytics-progress-container">
                        <div class="analytics-progress-fill ${performanceClass}" style="width: ${category.correctPercentage}%"></div>
                    </div>
                </td>
                <td class="center">
                    <button class="expand-tasks-btn" type="button" data-toggle="category" data-target="${categoryId}" aria-controls="${categoryId}" aria-expanded="false">
                        <span class="expand-text">Pokaż zadania (${tasksCount})</span>
                    </button>
                </td>
            </tr>
            <tr class="task-details-row" id="${categoryId}" style="display: none;">
                <td colspan="5" class="task-details-cell">
                    <div class="task-details-container">
                        <div class="task-list-header">
                            <h5 class="task-list-title">📝 Zadania w kategorii "${this.escapeHtml(category.name)}"</h5>
                            <div class="task-list-stats">
                                <span class="task-stats-item correct">✅ Poprawne: ${category.correctTasks}</span>
                                <span class="task-stats-item incorrect">❌ Niepoprawne: ${category.totalTasks - category.correctTasks}</span>
                                <span class="task-stats-item total">📊 Razem: ${category.totalTasks}</span>
                            </div>
                        </div>
<div class="task-list" id="${categoryId}-task-list"></div>
                    </div>
                </td>
            </tr>
        `;
    }
    
    /**
     * Render individual task list
     */
renderTaskList(tasks) {
        if (!tasks || tasks.length === 0) {
            return `
                <div class="no-tasks-message">
                    <div class="no-tasks-icon">📝</div>
                    <div class="no-tasks-text">Brak zadań w tej kategorii</div>
                </div>
            `;
        }
        const BATCH = 10;
        const initial = tasks.slice(0, BATCH).map(task => this.renderTaskItem(task)).join('');
        const rest = tasks.slice(BATCH).map(task => this.renderTaskItem(task)).join('');
        if (tasks.length <= BATCH) return initial;
        const listId = `more-${Date.now()}-${Math.floor(Math.random()*1000)}`;
        return `
            ${initial}
            <div class="task-list-collapsed" id="${listId}" style="display:none;">
                ${rest}
            </div>
            <div style="margin-top:8px;">
                <button type="button" class="btn-mini" data-action="show-more" data-target="${listId}">Pokaż więcej (${tasks.length - BATCH})</button>
            </div>
        `;
    }
    
    /**
     * Render individual task item
     */
renderTaskItem(task) {
        const isCorrect = this.isTaskCorrect(task);
        const correctnessClass = isCorrect ? 'correct' : 'incorrect';
        const correctnessText = isCorrect ? '✅ Poprawne' : '❌ Niepoprawne';
        const catBand = this.getCategoryAccentColor((task.categories && task.categories[0]) || task.category || 'Unknown');
        
        // Generate task ID for unique identification
        const taskId = `task-${this.escapeHtml(task.name || 'unnamed').replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}`;
        
        // Format date and time
        const taskDate = this.formatTaskDate(task.timestamp);
        const taskTime = this.formatTaskTime(task.timestamp);
        const timeAgo = this.formatTimeAgo(task.timestamp);
        
        return `
            <div class="task-item ${correctnessClass}" data-task-id="${taskId}" style="border-left-color:${catBand}">
                <div class="task-header">
                    <div class="task-main-info">
                        <div class="task-title-section">
                            <h6 class="task-title">${this.escapeHtml(task.name || 'Bez nazwy')}</h6>
                            <div class="task-status-container">
                                <span class="task-correctness ${correctnessClass}">
                                    ${correctnessText}
                                </span>
                            </div>
                        </div>
                        <div class="task-meta-badges">
                            <span class="task-subject-badge">📚 ${this.escapeHtml(task.subject || 'Nieznany')}</span>
                            <span class="task-category">🏷️ ${this.escapeHtml(task.category || 'Nieznana')}</span>
                        </div>
                    </div>
                </div>
                
                ${task.description ? `
                <div class="task-description">
                    <span class="task-description-text">📝 ${this.escapeHtml(task.description)}</span>
                </div>
                ` : ''}
                
                <div class="task-footer">
                    <div class="task-date-info">
                        <span class="task-date">🗓️ ${taskDate}</span>
                        <span class="task-time">🕰️ ${taskTime}</span>
                        <span class="task-time-ago">${timeAgo}</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    getCategoryAccentColor(name){
        const palette = ['#67e8f9','#60a5fa','#a78bfa','#f472b6','#f47272','#fbbf24','#34d399','#22c55e','#4ade80','#93c5fd'];
        const idx = Math.abs(this.simpleHash(String(name))) % palette.length;
        return palette[idx];
    }
    
    /**
     * Check if task is correct (helper method)
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
     * Format task date
     */
    formatTaskDate(timestamp) {
        if (!timestamp) return 'Brak daty';
        const date = new Date(timestamp);
        return date.toLocaleDateString('pl-PL');
    }
    
    /**
     * Format task time
     */
    formatTaskTime(timestamp) {
        if (!timestamp) return 'Brak czasu';
        const date = new Date(timestamp);
        return date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
    }
    
    /**
     * Format time ago
     */
    formatTimeAgo(timestamp) {
        if (!timestamp) return 'Nieznano';
        
        const now = new Date();
        const taskDate = new Date(timestamp);
        const diffMs = now - taskDate;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Dzisiaj';
        if (diffDays === 1) return 'Wczoraj';
        if (diffDays < 7) return `${diffDays} dni temu`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} tygodni temu`;
        return `${Math.floor(diffDays / 30)} miesięcy temu`;
    }
    
    /**
     * Render no data message - only imported data used
     */
    renderNoDataMessage() {
        const analyticsContent = document.getElementById('analytics-content');
        if (!analyticsContent) return;
        
        analyticsContent.innerHTML = `
            <div class="no-analytics-data">
                <div class="no-analytics-icon">📈</div>
                <div class="no-analytics-title">Brak danych do analizy</div>
                <div class="no-analytics-subtitle">Brak danych w Google Sheets do wyświetlenia. Dodaj zadania do arkusza Google Sheets, aby zobaczyć analitykę.</div>
            </div>
        `;
    }
    
    /**
     * Render subject filter tabs
     */
    renderSubjectFilters() {
        const subjectTabs = document.getElementById('subject-filter-tabs');
        if (!subjectTabs) return;
        
        const tabsHTML = [
            '<button class="filter-tab active" data-subject="all">Wszystkie</button>',
            ...this.subjects.map(subject => 
                `<button class="filter-tab" data-subject="${this.escapeHtml(subject.name)}">${this.escapeHtml(subject.name)}</button>`
            )
        ].join('');
        
        subjectTabs.innerHTML = tabsHTML;
        
        // Setup filter listeners
        const filterTabs = subjectTabs.querySelectorAll('.filter-tab');
        filterTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.handleFilterChange(e.target);
            });
        });
    }
    
    /**
     * Render overview cards
     */
    renderOverviewCards() {
        const totalTasksElement = document.getElementById('total-tasks-analytics');
        const correctPercentageElement = document.getElementById('correct-percentage');
        const weakCategoriesCountElement = document.getElementById('weak-categories-count');
        
        if (totalTasksElement) {
            totalTasksElement.textContent = this.overallStats.totalTasks;
        }
        
        if (correctPercentageElement) {
            correctPercentageElement.textContent = `${this.overallStats.correctPercentage}%`;
        }
        
        if (weakCategoriesCountElement) {
            weakCategoriesCountElement.textContent = this.weakCategories.length;
        }
    }
    
    /**
     * Render performance table
     */
    renderPerformanceTable() {
        const performanceTable = document.getElementById('performance-table');
        if (!performanceTable) return;
        
        if (this.categoryPerformance.length === 0) {
            performanceTable.innerHTML = `
                <div class="table-placeholder">
                    <div class="placeholder-icon">📊</div>
                    <div class="placeholder-text">
                        <div class="placeholder-title">Brak danych do analizy</div>
                        <div class="placeholder-subtitle">Dodaj zadania, aby zobaczyć statystyki wydajności</div>
                    </div>
                </div>
            `;
            return;
        }
        
        const tableHTML = `
                <table class="performance-table">
                    <thead>
                        <tr>
                            <th>🏷️ Kategoria</th>
                            <th>📚 Przedmiot</th>
                            <th>📊 Zadania</th>
                            <th>🎯 Skuteczność</th>
                            <th>📈 Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.categoryPerformance.map((category, index) => {
                            const performanceClass = this.getPerformanceClass(category.correctPercentage);
                            const rowClasses = [
                                'performance-row',
                                category.isWeak ? 'weak-category' : '',
                                performanceClass
                            ].filter(Boolean).join(' ');
                            
                            return `
                            <tr class="${rowClasses}" data-performance="${category.correctPercentage}" data-category="${this.escapeHtml(category.name)}">
                                <td class="category-name">
                                    <div class="category-info">
                                        <span class="category-title">${this.escapeHtml(category.name)}</span>
                                        <div class="category-rank" style="font-size: 12px; color: #666; margin-top: 2px;">
                                            #${index + 1} w rankingu
                                        </div>
                                    </div>
                                </td>
                                <td class="subject-name">${this.escapeHtml(category.subject)}</td>
                                <td class="task-count">
                                    <span class="correct-tasks">${category.correctTasks}</span>
                                    /
                                    <span class="total-tasks">${category.totalTasks}</span>
                                </td>
                                <td class="performance-percentage">
                                    <div class="percentage-container">
                                        <span class="percentage-text ${performanceClass}">
                                            ${category.correctPercentage}%
                                        </span>
                                        <div class="percentage-bar">
                                            <div class="percentage-fill ${performanceClass}" 
                                                 style="width: ${category.correctPercentage}%"></div>
                                        </div>
                                    </div>
                                </td>
                                <td class="performance-status">
                                    ${this.getStatusBadge(category)}
                                </td>
                            </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
        `;
        
        performanceTable.innerHTML = tableHTML;
    }
    
    /**
     * Render suggested review section
     */
    renderSuggestedReview() {
        const reviewSuggestions = document.getElementById('review-suggestions');
        if (!reviewSuggestions) return;
        
        if (this.weakCategories.length === 0) {
            reviewSuggestions.innerHTML = `
                <div class="suggestion-placeholder">
                    <div class="placeholder-icon">✨</div>
                    <div class="placeholder-text">
                        <div class="placeholder-title">Świetna robota!</div>
                        <div class="placeholder-subtitle">Nie masz słabych punktów do powtórki. Kontynuuj naukę!</div>
                    </div>
                </div>
            `;
            return;
        }
        
        const suggestionsHTML = this.weakCategories.map(category => `
            <div class="suggestion-item">
                <div class="suggestion-header">
                    <div class="suggestion-icon">⚠️</div>
                    <div class="suggestion-title">${this.escapeHtml(category.name)}</div>
                    <div class="suggestion-percentage">${category.correctPercentage}%</div>
                </div>
                <div class="suggestion-content">
                    <div class="suggestion-stats">
                        <span class="stat">📚 ${this.escapeHtml(category.subject)}</span>
                        <span class="stat">📝 ${category.totalTasks} zadań</span>
                        <span class="stat">❌ ${category.totalTasks - category.correctTasks} błędów</span>
                    </div>
                    <div class="suggestion-recommendation">
                        💡 Zalecenie: Poświęć więcej czasu na tę kategorię. 
                        Rozważ dodatkowe ćwiczenia lub powtórkę materiału.
                    </div>
                </div>
            </div>
        `).join('');
        
        reviewSuggestions.innerHTML = `
            <div class="suggestions-header">
                <h4>🎯 Priorytetowe kategorie do powtórki</h4>
                <p>Kategorie z wynikiem poniżej 60% (min. 3 zadania)</p>
            </div>
            <div class="suggestions-list">
                ${suggestionsHTML}
            </div>
        `;
    }
    
    /**
     * Handle filter change
     */
    handleFilterChange(tab) {
        // Update active tab
        const allTabs = document.querySelectorAll('.filter-tab');
        allTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Update current filter
        this.currentFilter = tab.dataset.subject;
        
        // Reload analytics with new filter
        this.processAnalyticsData();
        this.renderAnalytics();
    }
    
    /**
     * Reset filters
     */
    resetFilters() {
        this.currentFilter = 'all';
        
        // Update UI
        const allTabs = document.querySelectorAll('.filter-tab');
        allTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.subject === 'all');
        });
        
        // Reload analytics
        this.processAnalyticsData();
        this.renderAnalytics();
    }
    
    /**
     * Handle sort change
     */
    handleSortChange(button) {
        // Analytics: handleSortChange called
        
        // Check if categoryPerformance is initialized
        if (!this.categoryPerformance || !Array.isArray(this.categoryPerformance)) {
            // console.warn('⚠️ Analytics: categoryPerformance is not initialized, initializing as empty array');
            this.categoryPerformance = [];
            return;
        }
        
        // Update active sort button
        const allSortButtons = document.querySelectorAll('.sort-btn');
        allSortButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        const sortType = button.dataset.sort;
        // console.log('📊 Analytics: Sorting by', sortType);
        
        // Sort category performance
        switch (sortType) {
            case 'performance-asc':
                // Sort by percentage ascending (worst first - most useful for improvement)
                this.categoryPerformance.sort((a, b) => a.correctPercentage - b.correctPercentage);
                // console.log('📊 Sorted by performance ascending (worst first)');
                break;
            case 'performance-desc':
                // Sort by percentage descending (best first)
                this.categoryPerformance.sort((a, b) => b.correctPercentage - a.correctPercentage);
                // console.log('📊 Sorted by performance descending (best first)');
                break;
            case 'performance':
                // Legacy support - default to ascending
                this.categoryPerformance.sort((a, b) => a.correctPercentage - b.correctPercentage);
                // console.log('📊 Sorted by performance (legacy - ascending)');
                break;
            case 'name':
                this.categoryPerformance.sort((a, b) => a.name.localeCompare(b.name));
                // console.log('📊 Sorted alphabetically by name');
                break;
            case 'count':
                this.categoryPerformance.sort((a, b) => b.totalTasks - a.totalTasks);
                // console.log('📊 Sorted by task count descending');
                break;
        }
        
        // Add visual feedback for sorting
        this.addSortingAnimation();
        
        // Re-render performance table
        this.renderPerformanceTable();
        
        // Add post-sort visual highlight
        setTimeout(() => {
            this.highlightSortedRows();
        }, 100);
    }
    
    /**
     * Get performance class for styling
     */
    getPerformanceClass(percentage) {
        if (percentage >= 90) return 'excellent';
        if (percentage >= 70) return 'good';
        if (percentage >= 50) return 'average';
        if (percentage >= 30) return 'poor';
        return 'critical';
    }
    
    /**
     * Get status badge based on performance
     */
    getStatusBadge(category) {
        const percentage = category.correctPercentage;
        
        if (percentage >= 90) {
            return '<span class="status-badge excellent">🏆 Doskonały</span>';
        } else if (percentage >= 70) {
            return '<span class="status-badge good">✅ Dobry</span>';
        } else if (percentage >= 50) {
            return '<span class="status-badge average">🔶 Średni</span>';
        } else if (percentage >= 30) {
            return '<span class="status-badge poor">⚠️ Słaby punkt</span>';
        } else {
            return '<span class="status-badge critical">🚨 Wymaga uwagi</span>';
        }
    }
    
    /**
     * Show error message
     */
    showError(message) {
        if (window.navigationManager) {
            window.navigationManager.showMessage(message, 'error');
        } else {
            // console.error('Analytics Error:', message);
        }
    }
    
    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Convert arbitrary string to a safe DOM id suffix
     */
    getSafeId(text) {
        return String(text || 'subject').toLowerCase().replace(/[^a-z0-9]+/gi, '-');
    }

    /**
     * Format a duration in ms to human string, e.g., 2h 30min
     */
    formatDuration(ms) {
        if (!ms || ms <= 0) return '0m';
        const totalMinutes = Math.floor(ms / 60000);
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        const parts = [];
        if (h > 0) parts.push(`${h}h`);
        if (m > 0) parts.push(`${m}min`);
        return parts.join(' ');
    }

    /**
     * Compute time analysis for a subject
     */
    computeSubjectTimeAnalysis(subject) {
        const result = { totalMs: 0, byCategory: [] };
        const perCategory = {};
        let totalTasksWithTime = 0;
        (subject.tasks || []).forEach(task => {
            if (task.start_time && task.end_time) {
                const dur = new Date(task.end_time) - new Date(task.start_time);
                if (isFinite(dur) && dur > 0) {
                    result.totalMs += dur;
                    totalTasksWithTime++;
                    const cats = Array.isArray(task.categories) && task.categories.length ? task.categories : [task.category || 'Unknown'];
                    cats.forEach(cat => {
                        if (!perCategory[cat]) perCategory[cat] = { name: cat, timeMs: 0, tasksCount: 0 };
                        perCategory[cat].timeMs += dur;
                        perCategory[cat].tasksCount += 1;
                    });
                }
            }
        });
        result.byCategory = Object.values(perCategory)
            .map(c => ({ ...c, avgMs: c.tasksCount > 0 ? Math.round(c.timeMs / c.tasksCount) : 0 }))
            .sort((a, b) => b.timeMs - a.timeMs);
        result.averageTaskMs = totalTasksWithTime > 0 ? Math.round(result.totalMs / totalTasksWithTime) : 0;
        return result;
    }

    /**
     * Render enhanced time analysis section with time-of-day performance
     */
    renderTimeAnalysis(subject) {
        const safeId = this.getSafeId(subject.name);
        const section = document.getElementById(`time-analysis-${safeId}`);
        if (!section) return;
        const content = section.querySelector('.time-analysis-content') || section;
        
        // Get both task duration analysis and time-of-day analysis
        const durationAnalysis = this.computeSubjectTimeAnalysis(subject);
        const timeOfDayAnalysis = this.computeTimeOfDaySummary(subject.tasks);
        
        // If no time data at all, show no data message
        if (durationAnalysis.totalMs <= 0 && timeOfDayAnalysis.totalStudyTime <= 0) {
            console.warn('[TimeAnalysis] No time data found for subject', subject.name, {
                sampleTask: (subject.tasks || [])[0]
            });
            content.innerHTML = `
                <div class="no-analytics-data">
                    <div class="no-analytics-icon">⏱️</div>
                    <div class="no-analytics-text">Brak danych o czasie</div>
                    <div class="no-analytics-subtitle">Brak pól start_time/end_time w zadaniach. Upewnij się, że zapisujesz start i koniec zadania.</div>
                </div>
            `;
            return;
        }
        
        // Build time summary cards
        const totalFormatted = Math.max(durationAnalysis.totalMs, timeOfDayAnalysis.totalStudyTime) > 0 ? 
            this.formatDuration(Math.max(durationAnalysis.totalMs, timeOfDayAnalysis.totalStudyTime)) : '—';
        const avgFormatted = durationAnalysis.averageTaskMs > 0 ? 
            this.formatDuration(durationAnalysis.averageTaskMs) : '—';
        
        // Build time-of-day performance breakdown
        const timeOfDayPeriods = timeOfDayAnalysis.periods.map(period => {
            const accuracyClass = period.accuracy >= 80 ? 'success' : period.accuracy >= 60 ? 'warning' : 'error';
            const totalTimeFormatted = period.totalTime > 0 ? this.formatDuration(period.totalTime) : '—';
            const avgTimeFormatted = period.averageTime > 0 ? this.formatDuration(period.averageTime) : '—';
            
            return `
                <div class="time-period-item">
                    <div class="time-period-header">
                        <div class="time-period-emoji">${period.emoji}</div>
                        <div class="time-period-info">
                            <div class="time-period-name">${period.label}</div>
                            <div class="time-period-stats">
                                <span class="accuracy ${accuracyClass}">${period.accuracy}% skuteczność</span>
                                <span class="task-count">${period.total} zadań</span>
                            </div>
                        </div>
                    </div>
                    <div class="time-period-details">
                        <div class="time-detail">
                            <span class="time-detail-label">Łączny czas:</span>
                            <span class="time-detail-value">${totalTimeFormatted}</span>
                        </div>
                        <div class="time-detail">
                            <span class="time-detail-label">Śr. na zadanie:</span>
                            <span class="time-detail-value">${avgTimeFormatted}</span>
                        </div>
                        <div class="time-detail">
                            <span class="time-detail-label">Poprawne:</span>
                            <span class="time-detail-value">${period.correct}/${period.total}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Build category breakdown if available
        const categoryBreakdown = durationAnalysis.byCategory.length > 0 ? `
            <div class="time-categories-section">
                <h5 class="time-section-title">⏱️ Czas według kategorii</h5>
                <div class="time-categories-list">
                    ${durationAnalysis.byCategory.slice(0, 6).map(cat => `
                        <div class="time-cat-item">
                            <div class="time-cat-name">${this.escapeHtml(cat.name)}</div>
                            <div class="time-cat-values">
                                <span class="time-total">${this.formatDuration(cat.timeMs)}</span>
                                <span class="time-sep">·</span>
                                <span class="time-avg">${this.formatDuration(cat.avgMs)}/zad.</span>
                                <span class="time-count">(${cat.tasksCount})</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : '';
        
        content.innerHTML = `
            <div class="time-summary-cards">
                <div class="time-card">
                    <div class="time-card-title">Czas łącznie</div>
                    <div class="time-card-value">${totalFormatted}</div>
                </div>
                <div class="time-card">
                    <div class="time-card-title">Śr. czas/zadanie</div>
                    <div class="time-card-value">${avgFormatted}</div>
                </div>
                <div class="time-card">
                    <div class="time-card-title">Najlepsza pora</div>
                    <div class="time-card-value">${timeOfDayAnalysis.best ? timeOfDayAnalysis.best.emoji + ' ' + timeOfDayAnalysis.best.accuracy + '%' : '—'}</div>
                </div>
            </div>
            
            <div class="time-periods-section">
                <h5 class="time-section-title">🕐 Analiza skuteczności według pory dnia</h5>
                <div class="time-periods-grid">
                    ${timeOfDayPeriods}
                </div>
            </div>
            
            ${categoryBreakdown}
        `;
        
        // Update hero card time if present
        const heroTime = document.getElementById(`hero-time-${safeId}`);
        if (heroTime) {
            const val = heroTime.querySelector('.hero-value');
            if (val) val.textContent = totalFormatted;
        }
    }
    
    /**
     * Add sorting animation visual feedback
     */
    addSortingAnimation() {
        const performanceRows = document.querySelectorAll('.performance-row');
        performanceRows.forEach(row => {
            row.classList.add('sorting');
            setTimeout(() => {
                row.classList.remove('sorting');
            }, 300);
        });
    }
    
    /**
     * Highlight sorted rows with animation
     */
    highlightSortedRows() {
        const performanceRows = document.querySelectorAll('.performance-row');
        performanceRows.forEach((row, index) => {
            setTimeout(() => {
                row.classList.add('just-sorted');
                setTimeout(() => {
                    row.classList.remove('just-sorted');
                }, 1000);
            }, index * 50); // Stagger the animation
        });
    }
    
    /**
     * Get analytics statistics
     */
    getAnalyticsStats() {
        return {
            totalTasks: this.overallStats.totalTasks,
            correctPercentage: this.overallStats.correctPercentage,
            weakCategories: this.weakCategories.length,
            categoryPerformance: this.categoryPerformance,
            currentFilter: this.currentFilter
        };
    }
    
    /**
     * Toggle visibility of category task list
     */
    toggleCategoryTasks(categoryId) {
        const detailsRow = document.getElementById(categoryId);
        const expandIcons = document.querySelectorAll(`[onclick*="${categoryId}"]`);
        
        if (detailsRow) {
            const isVisible = detailsRow.style.display !== 'none';
            
            if (isVisible) {
                // Hide
                detailsRow.style.display = 'none';
                expandIcons.forEach(element => {
                    if (element.classList.contains('category-expand-icon')) {
                        element.textContent = '▶️';
                    }
                    const expandText = element.querySelector('.expand-text');
                    if (expandText) {
                        expandText.textContent = expandText.textContent.replace('Ukryj', 'Pokaż');
                    }
                });
            } else {
                // Show
                detailsRow.style.display = 'table-row';
                expandIcons.forEach(element => {
                    if (element.classList.contains('category-expand-icon')) {
                        element.textContent = '🔽';
                    }
                    const expandText = element.querySelector('.expand-text');
                    if (expandText) {
                        expandText.textContent = expandText.textContent.replace('Pokaż', 'Ukryj');
                    }
                });
            }
        }
    }

    enhanceSubjectTableInteractions(safeId) {
        const section = document.querySelector(`.detailed-table-section[data-subject-id="${safeId}"]`);
        if (!section) return;
        const table = section.querySelector('table.analytics-table');
        // Add data-labels for mobile
        if (table) {
            const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim());
            table.querySelectorAll('tbody tr.category-row').forEach(row => {
                row.querySelectorAll('td').forEach((td, idx) => {
                    td.setAttribute('data-label', headers[idx] || '');
                });
            });
        }
        // Delegated clicks
        section.addEventListener('click', (e) => {
            const toggleEl = e.target.closest('[data-toggle="category"]');
            if (toggleEl) {
                const targetId = toggleEl.getAttribute('data-target');
                this.toggleCategoryTasksAccessible(targetId, section, safeId);
                e.preventDefault();
                return;
            }
            const showMoreBtn = e.target.closest('[data-action="show-more"]');
            if (showMoreBtn) {
                const target = document.getElementById(showMoreBtn.getAttribute('data-target'));
                if (target) {
                    const hidden = target.style.display === 'none' || target.style.display === '';
                    target.style.display = hidden ? 'block' : 'none';
                    showMoreBtn.textContent = hidden ? 'Pokaż mniej' : showMoreBtn.textContent.replace('Pokaż mniej', 'Pokaż więcej');
                }
                e.preventDefault();
                return;
            }
            const row = e.target.closest('tr.category-row');
            if (row && e.target.tagName !== 'BUTTON') {
                const targetId = row.getAttribute('data-target');
                if (targetId) this.toggleCategoryTasksAccessible(targetId, section, safeId);
            }
        });
        // Keyboard accessibility (Enter/Space toggles)
        section.addEventListener('keydown', (e) => {
            const key = e.key;
            // Focus search with '/'
            if (key === '/' && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
                const searchEl = section.querySelector(`#table-search-${safeId}`);
                if (searchEl) {
                    e.preventDefault();
                    searchEl.focus();
                }
                return;
            }
            const toggleEl = e.target.closest && e.target.closest('[data-toggle="category"]');
            if (toggleEl && (key === 'Enter' || key === ' ')) {
                e.preventDefault();
                const targetId = toggleEl.getAttribute('data-target');
                this.toggleCategoryTasksAccessible(targetId, section, safeId);
            }
        });

        // Search filter
        const search = section.querySelector(`#table-search-${safeId}`);
        if (search) {
            search.addEventListener('input', () => {
                const q = search.value.toLowerCase();
                section.querySelectorAll('tbody tr.category-row').forEach(row => {
                    const nameEl = row.querySelector('.category-name-container strong');
                    const name = nameEl ? nameEl.textContent.toLowerCase() : '';
                    const match = name.includes(q);
                    row.style.display = match ? '' : 'none';
                    const targetId = row.getAttribute('data-target');
                    const details = targetId ? document.getElementById(targetId) : null;
                    if (details && !match) details.style.display = 'none';
                });
            });
        }
    }

    /**
     * Resolve subject accent color
     */
getSubjectAccentColor(name) {
        // Prefer subject-provided color if available
        try {
            const subj = (this.subjects || []).find(s => String(s.name).toLowerCase() === String(name).toLowerCase());
            if (subj && subj.color) return subj.color;
        } catch(_) {}
        // Fallback to ChartsManager palette
        const palettes = (this.chartsManager && this.chartsManager.subjectColors) || ['#667eea','#764ba2','#10b981','#f59e0b','#ef4444','#3b82f6','#8b5cf6','#06b6d4','#84cc16','#f97316','#ec4899','#6366f1'];
        const idx = Math.abs(this.simpleHash(String(name))) % palettes.length;
        return palettes[idx];
    }

    simpleHash(str){ let h=0; for(let i=0;i<str.length;i++){ h=((h<<5)-h)+str.charCodeAt(i); h|=0; } return h; }

    /**
     * Enhance subnav, timeframe, filters, chips
     */
    enhanceSubjectSubnavAndFilters(safeId, subject) {
        const sectionRoot = document.querySelector('.subject-analytics-section');
        if (!sectionRoot) return;

        // Subnav handling
        const subnav = document.getElementById(`subnav-${safeId}`);
        if (subnav) {
            const scrollKey = (sub)=>`subjectScroll:${safeId}:${sub}`;
            subnav.addEventListener('click', (e) => {
                const btn = e.target.closest('.subnav-pill');
                if (!btn) return;
                const target = btn.getAttribute('data-subsection');
                if (!target) return;
                // Update aria-current
                subnav.querySelectorAll('.subnav-pill').forEach(p=>p.setAttribute('aria-current','false'));
                btn.setAttribute('aria-current','page');
                // Save previous scroll
                const container = document.querySelector('.analytics-right-panel') || window;
                const activeBtn = subnav.querySelector('.subnav-pill[aria-current="page"]');
                const prevSub = activeBtn ? activeBtn.getAttribute('data-subsection') : 'overview';
                try { sessionStorage.setItem(scrollKey(prevSub), String((document.querySelector('.analytics-right-panel')?.scrollTop) || window.scrollY || 0)); } catch(_){ }

// Toggle sections
                ['overview','time','sessions'].forEach(key => {
                    const el = document.getElementById(`section-${key}-${safeId}`);
                    if (el) el.classList.toggle('active', key===target);
                });
                // Save subsection
                const storageKey = `subjectFilters:${safeId}`;
                let saved = {};
                try { saved = JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch(_) { saved={}; }
                saved.subsection = target; localStorage.setItem(storageKey, JSON.stringify(saved));
                // Restore scroll for target
                const savedScroll = Number(sessionStorage.getItem(scrollKey(target)) || 0);
                if (container === window) window.scrollTo({ top: savedScroll });
                else container.scrollTo({ top: savedScroll });
            });
        }

        // Delegated interactions for recent widgets, accordions, sessions
        sectionRoot.addEventListener('click', (e) => {
            // Accordion toggles (mobile only)
            const accBtn = e.target.closest('button[data-accordion="toggle"]');
            if (accBtn) {
                const sec = accBtn.closest('.subject-section');
                if (sec && window.innerWidth <= 768) {
                    sec.classList.toggle('collapsed');
                }
            }
            // Recent details toggle
            const recentBtn = e.target.closest('button[data-action="recent-details"]');
            if (recentBtn) {
                const cid = recentBtn.getAttribute('data-container');
                if (cid) this.toggleRecentDetails(cid);
            }
            // Sessions: load more
            const moreBtn = e.target.closest(`#sessions-more-${safeId}`);
            if (moreBtn) {
                e.preventDefault();
                this._sessionsShown = this._sessionsShown || {};
                const cur = this._sessionsShown[safeId] || 5;
                this._sessionsShown[safeId] = cur + 5;
                const storageKey = `subjectFilters:${safeId}`;
                let saved = {};
                try { saved = JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch(_) { saved={}; }
                this.refreshSubjectTimeDependentViews(safeId, subject, saved);
            }
        });
        sectionRoot.addEventListener('change', (e) => {
            const cb = e.target.closest('input[type="checkbox"][data-action="recent-only-incorrect"]');
            if (cb) {
                const cid = cb.getAttribute('data-container');
                this.setRecentFilterIncorrect(cid, cb.checked);
            }
        });

        // Load saved state
        const storageKey = `subjectFilters:${safeId}`;
        let saved = {};
        try { saved = JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch(_){ saved = {}; }

        // Timeframe
        const tfGroup = document.getElementById(`timeframe-${safeId}`);
        const defaultRange = saved.range || '30';
        if (tfGroup) {
            tfGroup.querySelectorAll('.time-btn').forEach(btn => {
                const r = btn.getAttribute('data-range');
                btn.classList.toggle('active', String(r) === String(defaultRange));
                btn.addEventListener('click', () => {
                    tfGroup.querySelectorAll('.time-btn').forEach(b=>b.classList.remove('active'));
                    btn.classList.add('active');
                    saved.range = r; localStorage.setItem(storageKey, JSON.stringify(saved));
                    this.refreshSubjectTimeDependentViews(safeId, subject, saved);
                });
            });
        }

        // Filter chips (correct/incorrect + selectors)
        const filtersEl = document.getElementById(`filters-${safeId}`);
        saved.filters = saved.filters || {};
        if (filtersEl) {
            const ensureCategoryChip = () => {
                const existing = filtersEl.querySelector('[data-filter-cat]');
                if (saved.category) {
                    if (!existing) {
                        const chip = document.createElement('button');
                        chip.className = 'filter-chip active';
                        chip.setAttribute('data-filter-cat','1');
                        chip.setAttribute('aria-label', `Kategoria: ${saved.category}`);
                        chip.textContent = `# ${saved.category} ✕`;
                        chip.addEventListener('click', () => {
                            saved.category = null;
                            localStorage.setItem(storageKey, JSON.stringify(saved));
                            chip.remove();
                            // Update count label
                            const ft = document.getElementById(`filters-toggle-${safeId}`);
                            if (ft) ft.textContent = `Filtry (${(saved.filters?.correct?1:0)+(saved.filters?.incorrect?1:0)+(saved.category?1:0)+(saved.location?1:0)+(saved.difficulty?1:0)})`;
this.renderActiveFilters(safeId, subject, saved);
                            this.debounceRefreshSubject(safeId, subject, saved);
                        });
                        filtersEl.appendChild(chip);
                    } else {
                        existing.textContent = `# ${saved.category} ✕`;
                        existing.classList.add('active');
                    }
                } else if (existing) {
                    existing.remove();
                }
            };

            const ensureLocationChip = () => {
                const existing = filtersEl.querySelector('[data-filter-loc]');
                if (saved.location) {
                    if (!existing) {
                        const chip = document.createElement('button');
                        chip.className = 'filter-chip active';
                        chip.setAttribute('data-filter-loc','1');
                        chip.setAttribute('aria-label', `Miejsce: ${saved.location}`);
                        chip.textContent = `📍 ${saved.location} ✕`;
                        chip.addEventListener('click', () => {
                            saved.location = null;
                            localStorage.setItem(storageKey, JSON.stringify(saved));
                            chip.remove();
                            this.debounceRefreshSubject(safeId, subject, saved);
                        });
                        filtersEl.appendChild(chip);
                    } else {
                        existing.textContent = `📍 ${saved.location} ✕`;
                        existing.classList.add('active');
                    }
                } else if (existing) {
                    existing.remove();
                }
            };

            const ensureDifficultyChip = () => {
                const existing = filtersEl.querySelector('[data-filter-diff]');
                if (saved.difficulty) {
                    if (!existing) {
                        const chip = document.createElement('button');
                        chip.className = 'filter-chip active';
                        chip.setAttribute('data-filter-diff','1');
                        chip.setAttribute('aria-label', `Trudność: ${saved.difficulty}`);
                        chip.textContent = `⭐ ${saved.difficulty} ✕`;
                        chip.addEventListener('click', () => {
                            saved.difficulty = null;
                            localStorage.setItem(storageKey, JSON.stringify(saved));
                            chip.remove();
                            // Update count label
                            const ft = document.getElementById(`filters-toggle-${safeId}`);
                            if (ft) ft.textContent = `Filtry (${(saved.filters?.correct?1:0)+(saved.filters?.incorrect?1:0)+(saved.category?1:0)+(saved.location?1:0)+(saved.difficulty?1:0)})`;
this.renderActiveFilters(safeId, subject, saved);
                            this.debounceRefreshSubject(safeId, subject, saved);
                        });
                        filtersEl.appendChild(chip);
                    } else {
                        existing.textContent = `⭐ ${saved.difficulty} ✕`;
                        existing.classList.add('active');
                    }
                } else if (existing) {
                    existing.remove();
                }
            };

            // Base filter chips (correct/incorrect)
            filtersEl.querySelectorAll('.filter-chip').forEach(chip => {
                const key = chip.getAttribute('data-filter');
                if (key) chip.classList.toggle('active', !!saved.filters[key]);
                chip.addEventListener('click', () => {
                    if (chip.hasAttribute('data-filter')) {
                        const current = !!saved.filters[key];
                        saved.filters[key] = !current;
                        chip.classList.toggle('active', !current);
                        chip.setAttribute('aria-pressed', String(!current));
                        localStorage.setItem(storageKey, JSON.stringify(saved));
                        // Update count label
                        const ft = document.getElementById(`filters-toggle-${safeId}`);
                if (ft) ft.textContent = `Filtry (${(saved.filters?.correct?1:0)+(saved.filters?.incorrect?1:0)+(saved.category?1:0)+(saved.location?1:0)+(saved.difficulty?1:0)})`;
this.renderActiveFilters(safeId, subject, saved);
                        this.debounceRefreshSubject(safeId, subject, saved);
                    }
                    // Selector chips open pickers
                    if (chip.classList.contains('selector')) {
                        const selKey = chip.getAttribute('data-select');
                        if (selKey === 'location') this.openLocationPicker(safeId, subject, chip, saved, storageKey);
                        if (selKey === 'difficulty') this.openDifficultyPicker(safeId, subject, chip, saved, storageKey);
                    }
                });
            });

            ensureCategoryChip();
            ensureLocationChip();
            ensureDifficultyChip();
            // Keep active filters row in sync
            this.renderActiveFilters(safeId, subject, saved);
        }

        // Timeframe compact dropdown (mobile)
        const tfToggle = document.getElementById(`timeframe-toggle-${safeId}`);
        if (tfToggle) {
            tfToggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.openTimeframePicker(safeId, subject, tfToggle, saved, storageKey);
            });
        }

// Filters panel toggle
        const filtersToggle = document.getElementById(`filters-toggle-${safeId}`);
        const filtersPanel = document.getElementById(`filters-panel-${safeId}`);
        const updateFiltersCount = () => {
            const count = (saved.filters?.correct?1:0) + (saved.filters?.incorrect?1:0) + (saved.category?1:0) + (saved.location?1:0) + (saved.difficulty?1:0);
            if (filtersToggle) filtersToggle.textContent = `Filtry (${count})`;
        };
        if (filtersToggle && filtersPanel) {
            filtersToggle.addEventListener('click', () => {
                const isHidden = filtersPanel.hasAttribute('hidden');
                if (isHidden) filtersPanel.removeAttribute('hidden'); else filtersPanel.setAttribute('hidden','');
                filtersToggle.setAttribute('aria-expanded', String(isHidden));
            });
        }
        updateFiltersCount();
this.renderActiveFilters(safeId, subject, saved);

        // Initial render of time-dependent views
        this.debounceRefreshSubject(safeId, subject, saved);
    }

    debounceRefreshSubject(safeId, subject, saved){
        this._refreshTimers = this._refreshTimers || {};
        if (this._refreshTimers[safeId]) clearTimeout(this._refreshTimers[safeId]);
        this._refreshTimers[safeId] = setTimeout(() => {
            this.refreshSubjectTimeDependentViews(safeId, subject, saved);
        }, 150);
    }

    /**
     * Refresh charts, top categories, cloud using timeframe and filters
     */
    refreshSubjectTimeDependentViews(safeId, subject, state){
        const tasks = this.applySubjectFilters(subject.tasks, state);
        // Set skeletons before chart render
        this.setChartSkeleton(`daily-accuracy-${safeId}`);
        this.setChartSkeleton(`category-accuracy-${safeId}`);
        // Update time analysis (with filtered tasks)
        if (document.getElementById(`time-analysis-${safeId}`)) this.renderTimeAnalysis({ ...subject, tasks });
        // Update sessions list
        this.renderSessionsWithPagination(safeId, tasks);

        // Update subtitle/footer
        const subtitle = document.getElementById(`chart-subtitle-${safeId}`);
        if (subtitle) {
            const parts = [];
            parts.push(`Zakres: ${this.describeRange(state.range || '30')}`);
            const actFilters = [];
            if (state.filters?.correct) actFilters.push('Poprawne');
            if (state.filters?.incorrect) actFilters.push('Błędne');
            subtitle.textContent = (actFilters.length ? `Filtry: ${actFilters.join(', ')}` : 'Bez filtrów') + ' • ' + parts.join(' · ');
        }
        const footer = document.getElementById(`chart-footer-${safeId}`);
        if (footer) footer.textContent = `Zadań: ${tasks.length}`;

        // Rebuild charts
        if (this.chartsManager) {
            this.chartsManager.createDailyAccuracyWithOverallLineChart(
                tasks,
                subject.stats?.correctPercentage || 0,
                `daily-accuracy-${safeId}`
            );
            this.chartsManager.createCategoryAccuracyLineChart(
                tasks,
                `category-accuracy-${safeId}`
            );
        }

        // Render top categories
        const topWrap = document.getElementById(`top-categories-${safeId}`);
        if (topWrap) topWrap.innerHTML = this.renderTopCategories(tasks, subject.name);
        
        // Update KPI diffs (overview card deltas based on timeframe)
        this.updateKpiDiffs(safeId, subject, state, tasks);

        // Render category chips cloud
        const cloud = document.getElementById(`category-cloud-${safeId}`);
        if (cloud) {
            cloud.innerHTML = this.renderCategoryCloud(tasks);
            cloud.addEventListener('click', (e) => {
                const chip = e.target.closest('.category-chip');
                if (!chip) return;
                const selected = chip.getAttribute('data-category');
                // Save category filter and update filter chips
                const storageKey = `subjectFilters:${safeId}`;
                let savedState = {};
                try { savedState = JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch(_) { savedState={}; }
                savedState.category = selected;
                localStorage.setItem(storageKey, JSON.stringify(savedState));
                const filtersEl = document.getElementById(`filters-${safeId}`);
                if (filtersEl) {
                    const exist = filtersEl.querySelector('[data-filter-cat]');
                    if (!exist) {
                        const catChip = document.createElement('button');
                        catChip.className = 'filter-chip active';
                        catChip.setAttribute('data-filter-cat','1');
                        catChip.textContent = `# ${selected} ✕`;
                        catChip.addEventListener('click', () => {
                            savedState.category = null;
                            localStorage.setItem(storageKey, JSON.stringify(savedState));
                            catChip.remove();
                            this.debounceRefreshSubject(safeId, subject, savedState);
                        });
                        filtersEl.appendChild(catChip);
                    } else {
                        exist.textContent = `# ${selected} ✕`;
                        exist.classList.add('active');
                    }
                }
                // Update count label
                const ft = document.getElementById(`filters-toggle-${safeId}`);
                if (ft) ft.textContent = `Filtry (${(savedState.filters?.correct?1:0)+(savedState.filters?.incorrect?1:0)+(savedState.category?1:0)+(savedState.location?1:0)+(savedState.difficulty?1:0)})`;
                this.renderActiveFilters(safeId, subject, savedState);
                this.debounceRefreshSubject(safeId, subject, savedState);
            });
        }
    }

    openTimeframePicker(safeId, subject, anchorBtn, saved, storageKey){
        const ranges = [
            { key: '7', label: 'Tydzień' },
            { key: '30', label: '30 dni' },
            { key: '90', label: '90 dni' },
            { key: 'all', label: 'Wszystko' }
        ];
        this.openSimplePicker(anchorBtn, ranges, saved.range || '30', (val) => {
            saved.range = val;
            localStorage.setItem(storageKey, JSON.stringify(saved));
            // Update active styles in full group
            const tfGroup = document.getElementById(`timeframe-${safeId}`);
            if (tfGroup) tfGroup.querySelectorAll('.time-btn').forEach(b=> b.classList.toggle('active', String(b.getAttribute('data-range'))===String(val)));
            this.debounceRefreshSubject(safeId, subject, saved);
        });
    }

    openLocationPicker(safeId, subject, anchorBtn, saved, storageKey){
        // Collect unique non-empty locations from subject tasks
        const locations = Array.from(new Set((subject.tasks||[])
            .map(t => (t.location||'').trim())
            .filter(x => x)));
        const options = [{ key: '', label: 'Wyczyść' }, ...locations.map(l => ({ key: l, label: l }))];
        this.openSimplePicker(anchorBtn, options, saved.location || '', (val) => {
            saved.location = val || null;
            localStorage.setItem(storageKey, JSON.stringify(saved));
            this.debounceRefreshSubject(safeId, subject, saved);
        });
    }

    openDifficultyPicker(safeId, subject, anchorBtn, saved, storageKey){
        const diffs = ['Łatwy','Średni','Trudny'];
        const options = [{ key: '', label: 'Wyczyść' }, ...diffs.map(d => ({ key: d, label: d }))];
        this.openSimplePicker(anchorBtn, options, saved.difficulty || '', (val) => {
            saved.difficulty = val || null;
            localStorage.setItem(storageKey, JSON.stringify(saved));
            this.debounceRefreshSubject(safeId, subject, saved);
        });
    }

    openSimplePicker(anchorBtn, options, current, onSelect){
        // Remove existing picker
        document.querySelectorAll('.filter-picker').forEach(p => p.remove());
        const picker = document.createElement('div');
        picker.className = 'filter-picker';
        picker.setAttribute('role','menu');
        picker.innerHTML = options.map(o => `<button type="button" role="menuitem" class="picker-item${String(o.key)===String(current)?' active':''}" data-val="${o.key}">${o.label}</button>`).join('');
        // Position relative to anchor
        const rect = anchorBtn.getBoundingClientRect();
        picker.style.position = 'fixed';
        picker.style.top = `${rect.bottom + 6}px`;
        picker.style.left = `${Math.max(8, Math.min(window.innerWidth-220, rect.left))}px`;
        document.body.appendChild(picker);
        // Event handling
        const onBodyClick = (e) => {
            if (!picker.contains(e.target) && e.target !== anchorBtn) {
                picker.remove();
                document.removeEventListener('click', onBodyClick, true);
            }
        };
        document.addEventListener('click', onBodyClick, true);
        picker.addEventListener('click', (e) => {
            const it = e.target.closest('.picker-item');
            if (!it) return;
            const val = it.getAttribute('data-val');
            onSelect(val);
            picker.remove();
            document.removeEventListener('click', onBodyClick, true);
        });
    }

renderActiveFilters(safeId, subject, state){
        const row = document.getElementById(`active-filters-${safeId}`);
        if (!row) return;
        const parts = [];
        if (state.filters?.correct) parts.push({ key:'correct', label:'Poprawne' });
        if (state.filters?.incorrect) parts.push({ key:'incorrect', label:'Błędne' });
        if (state.category) parts.push({ key:'category', label:`# ${state.category}` });
        if (state.location) parts.push({ key:'location', label:`📍 ${state.location}` });
        if (state.difficulty) parts.push({ key:'difficulty', label:`⭐ ${state.difficulty}` });
        if (!parts.length) { row.innerHTML = ''; return; }
        row.innerHTML = parts.map(p => `<button type="button" class="filter-chip active small" data-afkey="${p.key}" aria-label="Usuń filtr ${p.label}" title="Usuń filtr">${p.label} ✕</button>`).join('');
        row.querySelectorAll('button[data-afkey]').forEach(btn => {
            btn.addEventListener('click', () => {
                const k = btn.getAttribute('data-afkey');
                const storageKey = `subjectFilters:${safeId}`;
                let saved = {};
                try { saved = JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch(_) { saved = {}; }
                if (k==='correct' || k==='incorrect') { saved.filters = saved.filters || {}; saved.filters[k] = false; }
                if (k==='category') saved.category = null;
                if (k==='location') saved.location = null;
                if (k==='difficulty') saved.difficulty = null;
                localStorage.setItem(storageKey, JSON.stringify(saved));
                this.renderActiveFilters(safeId, subject, saved);
                this.debounceRefreshSubject(safeId, subject, saved);
                const ft = document.getElementById(`filters-toggle-${safeId}`);
                if (ft) ft.textContent = `Filtry (${(saved.filters?.correct?1:0)+(saved.filters?.incorrect?1:0)+(saved.category?1:0)+(saved.location?1:0)+(saved.difficulty?1:0)})`;
            });
        });
    }

    describeRange(r){
        if (r==='7') return 'Tydzień';
        if (r==='30') return '30 dni';
        if (r==='90') return '90 dni';
        return 'Cały okres';
    }

    applySubjectFilters(tasks, state){
        let out = tasks || [];
        // timeframe
        const r = state.range || '30';
        if (r !== 'all') {
            const days = parseInt(r, 10);
            const minDate = new Date();
            minDate.setDate(minDate.getDate() - days);
            out = out.filter(t => {
                const ts = new Date(t.start_time || t.timestamp || new Date());
                return ts >= minDate;
            });
        }
        // correctness filters
        const wantCorrect = !!state.filters?.correct;
        const wantIncorrect = !!state.filters?.incorrect;
        if (wantCorrect !== wantIncorrect) { // only one active
            out = out.filter(t => this.isTaskCorrect(t) === wantCorrect);
        }
        // category filter
        if (state.category) {
            out = out.filter(t => (t.categories && t.categories.length ? t.categories : [t.category || 'Unknown']).some(c => String(c)===String(state.category)));
        }
        // location filter
        if (state.location) {
            out = out.filter(t => (t.location || '').toLowerCase() === String(state.location).toLowerCase());
        }
        // difficulty filter (resolve via categories metadata if available)
        if (state.difficulty) {
            try {
                const subjName = (out[0]?.subject) || '';
                const catSet = new Set((this.categories||[])
                    .filter(c => (!subjName || !c.subject || c.subject === subjName))
                    .filter(c => String(c.difficulty).toLowerCase() === String(state.difficulty).toLowerCase())
                    .map(c => c.name));
                out = out.filter(t => {
                    const cats = (t.categories && t.categories.length ? t.categories : [t.category || 'Unknown']);
                    return cats.some(c => catSet.has(c));
                });
            } catch(_) { /* ignore */ }
        }
        return out;
    }

    renderTopCategories(tasks, subjectName){
        // Aggregate by category
        const map = new Map();
        (tasks||[]).forEach(t => {
            const cats = (t.categories && t.categories.length ? t.categories : [t.category || 'Unknown']);
            cats.forEach(c => {
                const m = map.get(c) || { name:c, total:0, correct:0 };
                m.total++;
                if (this.isTaskCorrect(t)) m.correct++;
                map.set(c, m);
            });
        });
        const rows = Array.from(map.values()).sort((a,b)=> (b.correct/b.total)-(a.correct/a.total)).slice(0,8);
        if (!rows.length) return '<div class="placeholder-text">Brak danych kategorii</div>';
        const maxTotal = Math.max(...rows.map(r=>r.total));
        return rows.map(r=>{
            const pct = r.total>0 ? Math.round((r.correct/r.total)*100) : 0;
            const width = maxTotal>0 ? Math.max(6, Math.round(r.total/maxTotal*100)) : 0;
            const inc = Math.max(0, r.total - r.correct);
            const corrWidth = maxTotal>0 ? Math.round((r.correct / maxTotal) * 100) : 0;
            const incWidth = maxTotal>0 ? Math.round((inc / maxTotal) * 100) : 0;
            return `
                <div class="top-cat-row" title="${this.escapeHtml(r.name)}: ${pct}% (${r.correct}/${r.total})">
                    <div class="top-cat-name">${this.escapeHtml(r.name)}</div>
                    <div class="top-cat-bar">
                        <div class="top-cat-fill-corr" style="width:${corrWidth}%"></div>
                        <div class="top-cat-fill-inc" style="width:${incWidth}%"></div>
                    </div>
                    <div class="top-cat-value">${pct}%</div>
                </div>`;
        }).join('');
    }

    setChartSkeleton(containerId){
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '<div class="skeleton chart-loading"></div>';
    }

    renderCategoryCloud(tasks){
        const freq = new Map();
        (tasks||[]).forEach(t => {
            const cats = (t.categories && t.categories.length ? t.categories : [t.category || 'Unknown']);
            cats.forEach(c => freq.set(c, (freq.get(c)||0)+1));
        });
        const entries = Array.from(freq.entries()).sort((a,b)=>b[1]-a[1]).slice(0,20);
        if (!entries.length) return '<div class="placeholder-text">Brak kategorii</div>';
        const max = entries[0][1];
        return entries.map(([name,count])=>{
            const scale = 0.85 + (count/max)*0.6; // font scale
            return `<span class="category-chip" data-category="${this.escapeHtml(name)}" style="font-size:${scale}rem" title="${this.escapeHtml(name)} (${count})">${this.escapeHtml(name)}</span>`;
        }).join('');
    }

    /**
     * Build daily activity last 90 days for heatmap
     */
    injectBackToTop(){
        if (document.querySelector('.back-to-top')) return;
        const btn = document.createElement('button');
        btn.className = 'back-to-top';
        btn.setAttribute('aria-label','Powrót na górę');
        btn.textContent = '↑';
        document.body.appendChild(btn);
        btn.addEventListener('click', () => {
            const container = document.querySelector('.analytics-right-panel') || window;
            if (container === window) window.scrollTo({ top: 0, behavior: 'smooth' });
            else container.scrollTo({ top: 0, behavior: 'smooth' });
        });
        // Show/hide on scroll
        const onScroll = () => {
            const scTop = (document.querySelector('.analytics-right-panel')?.scrollTop) || window.scrollY || 0;
            btn.classList.toggle('show', scTop > 300);
        };
        (document.querySelector('.analytics-right-panel') || window).addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    setupSubjectScrollUX(){
        const hdr = document.querySelector('.subject-sticky-header');
        if (!hdr) return;
        const container = document.querySelector('.analytics-right-panel') || window;
        const onScroll = () => {
            const scTop = (document.querySelector('.analytics-right-panel')?.scrollTop) || window.scrollY || 0;
            hdr.classList.toggle('compact', scTop > 120);
        };
        container.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    buildDailyActivity(tasks) {
        const days = 90;
        const today = new Date();
        // Normalize to local midnight for stable date keys
        const midnight = (d) => { const nd = new Date(d); nd.setHours(0,0,0,0); return nd; };
        const data = [];
        // Build a map for counts
        const counts = new Map();
        (tasks || []).forEach(t => {
            const ts = t.start_time || t.timestamp || new Date().toISOString();
            const d = midnight(new Date(ts));
            const key = d.toISOString().split('T')[0];
            counts.set(key, (counts.get(key) || 0) + 1);
        });
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const key = midnight(d).toISOString().split('T')[0];
            const cnt = counts.get(key) || 0;
            data.push({ date: key, tasks: cnt, active: cnt > 0 });
        }
        return data;
    }

    /**
     * Toggle with ARIA and optional single-open behavior
     */
    toggleCategoryTasksAccessible(categoryId, scopeEl, safeId) {
        const detailsRow = document.getElementById(categoryId);
        if (!detailsRow) return;
        const isVisible = detailsRow.style.display !== 'none';
        const oneOpen = scopeEl.querySelector(`#table-one-open-${safeId}`)?.checked;
        // If only one open, close others
        if (!isVisible && oneOpen) {
            scopeEl.querySelectorAll('tr.task-details-row').forEach(r => {
                if (r.id !== categoryId) r.style.display = 'none';
            });
            scopeEl.querySelectorAll('[data-toggle="category"][aria-expanded="true"]').forEach(el => el.setAttribute('aria-expanded', 'false'));
            scopeEl.querySelectorAll('.category-expand-icon').forEach(icon => { if (icon.getAttribute('data-target') !== categoryId) icon.textContent = '▶️'; });
        }
        // Toggle target
        if (!isVisible) {
            // Lazy-render task list on first open
            const list = document.getElementById(`${categoryId}-task-list`);
            if (list && list.innerHTML.trim() === '') {
                const tasks = (this._categoryTaskMap && this._categoryTaskMap[categoryId]) ? this._categoryTaskMap[categoryId] : [];
                list.innerHTML = this.renderTaskList(tasks);
            }
        }
        detailsRow.style.display = isVisible ? 'none' : (window.innerWidth <= 768 ? 'block' : 'table-row');
        // Update all toggles pointing to this target
        scopeEl.querySelectorAll(`[data-toggle="category"][data-target="${categoryId}"]`).forEach(el => {
            const newState = (!isVisible).toString();
            el.setAttribute('aria-expanded', newState);
            if (el.classList.contains('category-expand-icon')) {
                el.textContent = isVisible ? '▶️' : '🔽';
            }
            const expandText = el.querySelector('.expand-text');
            if (expandText) {
                expandText.textContent = expandText.textContent.includes('Pokaż') ? expandText.textContent.replace('Pokaż', 'Ukryj') : expandText.textContent.replace('Ukryj', 'Pokaż');
            }
        });
    }

    // Build sessions from tasks (group by date)
    buildSessions(tasks) {
const byDay = new Map();
        (tasks||[]).forEach(t => {
            const ts = new Date(t.start_time || t.timestamp || Date.now());
            const key = ts.toISOString().slice(0,10);
            const entry = byDay.get(key) || { date:key, tasks:0, correct:0, incorrect:0, durationMs:0 };
            entry.tasks++;
            if (this.isTaskCorrect(t)) entry.correct++; else entry.incorrect++;
            if (t.start_time && t.end_time) {
                const d = new Date(t.end_time) - new Date(t.start_time);
                if (isFinite(d) && d > 0) entry.durationMs += d;
            }
            byDay.set(key, entry);
        });
        return Array.from(byDay.values()).sort((a,b)=> b.date.localeCompare(a.date));
    }

    renderSessionsWithPagination(safeId, tasks) {
        const list = document.getElementById(`sessions-list-${safeId}`);
        if (!list) return;
        const sessions = this.buildSessions(tasks);
        this._sessionsShown = this._sessionsShown || {};
        const limit = this._sessionsShown[safeId] || 5;
        const shown = sessions.slice(0, limit);
        if (!sessions.length) {
            list.innerHTML = '<div class="placeholder-text">Brak sesji do wyświetlenia</div>';
        } else {
list.innerHTML = shown.map(s => {
                const acc = s.tasks>0 ? Math.round((s.correct/s.tasks)*100) : 0;
                const dur = s.durationMs>0 ? this.formatDuration(s.durationMs) : '—';
                return `<div class="session-row">
                    <div class="session-date">${s.date}</div>
                    <div class="session-stats">⏱ ${dur} • ${s.correct}/${s.tasks} • ${acc}%</div>
                </div>`;
            }).join('');
        }
        const moreBtn = document.getElementById(`sessions-more-${safeId}`);
        if (moreBtn) {
            moreBtn.style.display = (limit < sessions.length) ? '' : 'none';
        }
    }

    // Update KPI cards with simple deltas between current and previous equal period
    updateKpiDiffs(safeId, subject, state, currentTasks){
        const range = String(state.range || '30');
        if (range === 'all') return; // no delta for all
        const days = parseInt(range, 10);
        const end = new Date();
        const start = new Date(); start.setDate(end.getDate() - days);
        const prevStart = new Date(); prevStart.setDate(start.getDate() - days);
        const prevEnd = new Date(start);
        const allTasks = subject.tasks || [];
        const inRange = (t, a, b) => { const ts=new Date(t.start_time || t.timestamp || Date.now()); return ts>=a && ts<b; };
        const cur = allTasks.filter(t => inRange(t, start, end));
        const prev = allTasks.filter(t => inRange(t, prevStart, prevEnd));
        const pct = (arr)=> arr.length ? Math.round(arr.filter(t=>this.isTaskCorrect(t)).length/arr.length*100) : 0;
const cards = document.querySelectorAll(`#section-overview-${safeId} .kpi-card`);
        if (cards.length >= 2) {
            const totalCard = cards[0];
            const accCard = cards[1];
            const totalDiff = cur.length - prev.length;
            const accDiff = pct(cur) - pct(prev);
            const fmt = (v)=> v===0? '—' : (v>0? `▲ +${v}`: `▼ ${v}`);
            const setDiffClass = (el, val) => { el.classList.remove('up','down'); if (val>0) el.classList.add('up'); else if (val<0) el.classList.add('down'); };
            const td = totalCard.querySelector('.kpi-diff');
            const ad = accCard.querySelector('.kpi-diff');
            td.textContent = fmt(totalDiff);
            ad.textContent = (accDiff===0? '—' : (accDiff>0? `▲ +${accDiff}%` : `▼ ${accDiff}%`));
            setDiffClass(td, totalDiff);
            setDiffClass(ad, accDiff);
        }
    }
}

// Global toggle function for category tasks (kept for backward compatibility)
window.toggleCategoryTasks = function(categoryId) {
    // Find analytics manager instance
    if (window.analyticsManager && window.analyticsManager.toggleCategoryTasks) {
        window.analyticsManager.toggleCategoryTasks(categoryId);
    } else {
        // Fallback direct toggle
        const detailsRow = document.getElementById(categoryId);
        const expandIcons = document.querySelectorAll(`[onclick*="${categoryId}"]`);
        
        if (detailsRow) {
            const isVisible = detailsRow.style.display !== 'none';
            detailsRow.style.display = isVisible ? 'none' : 'table-row';
            
            expandIcons.forEach(element => {
                if (element.classList.contains('category-expand-icon')) {
                    element.textContent = isVisible ? '▶️' : '🔽';
                }
                const expandText = element.querySelector('.expand-text');
                if (expandText) {
                    expandText.textContent = expandText.textContent.includes('Pokaż') ? 
                        expandText.textContent.replace('Pokaż', 'Ukryj') : 
                        expandText.textContent.replace('Ukryj', 'Pokaż');
                }
            });
        }
    }
};

// Chart functionality removed

// AnalyticsManager will be initialized by app.js
// This ensures proper initialization order and prevents conflicts
