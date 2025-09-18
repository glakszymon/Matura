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
        
        // Charts functionality removed
        this.timeSeriesData = {};
        
        this.init();
    }
    
    /**
     * Initialize analytics manager
     */
    init() {
        this.setupEventListeners();
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
                this.tasks = tasks.map(task => {
                    const categoriesString = task.categories || task.category || 'Unknown';
                    const categoriesArray = this.parseCategoriesString(categoriesString);
                    
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
                        end_time: task.end_time || null
                    };
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
     * @param {string} categoriesString - Comma-separated categories string
     * @returns {Array} Array of individual category names
     */
    parseCategoriesString(categoriesString) {
        if (!categoriesString || categoriesString === 'Unknown') {
            return ['Unknown'];
        }
        
        return categoriesString
            .split(',')
            .map(cat => cat.trim())
            .filter(cat => cat && cat.length > 0);
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
        
        // Charts functionality removed - skip time series processing
        this.timeSeriesData = {};
        
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
        
        // Check if we have data
        if (!this.subjectAnalytics || Object.keys(this.subjectAnalytics).length === 0) {
            this.renderNoDataMessage();
            if (subjectSelectionSection) {
                subjectSelectionSection.style.display = 'none';
            }
            return;
        }
        
        // Show subject selection buttons
        this.renderSubjectButtons();
        
        // Hide content initially - user must select a subject
        this.renderSelectSubjectMessage();
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
    showSubjectAnalytics(subjectName) {
        const subject = this.subjectAnalytics[subjectName];
        if (!subject) return;
        
        const analyticsContent = document.getElementById('analytics-content');
        
        if (!analyticsContent) return;
        
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
        
        // Charts functionality removed
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
        const recentTasks = tasks.slice(-10); // Last 10 tasks
        return recentTasks.map(task => {
            const isCorrect = task.correctness === 'Poprawnie';
            const className = isCorrect ? 'correct' : 'incorrect';
            const statusText = isCorrect ? 'Poprawne' : 'Błędne';
            return `<div class="mini-bar ${className}" title="${this.escapeHtml(task.name)}: ${statusText}"></div>`;
        }).join('');
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
     * Render a complete section for one subject
     */
    renderSubjectSection(subject) {
        const stats = subject.stats;
        const categoryPerformance = subject.categoryPerformance;
        const strongCategories = subject.strongCategories;
        const weakCategories = subject.weakCategories;
        
        return `
            <div class="subject-analytics-section">
                <div class="subject-analytics-header">
                    <h3 class="subject-analytics-title">
                        📊 ${this.escapeHtml(subject.name)}
                    </h3>
                    <p class="subject-analytics-subtitle">
                        Analiza wyników dla przedmiotu: ${this.escapeHtml(subject.name)}
                    </p>
                </div>
                
                <!-- Summary Cards -->
                <div class="analytics-summary-cards">
                    <div class="analytics-summary-card">
                        <div class="analytics-card-icon">🎯</div>
                        <h4 class="analytics-card-value success">${stats.correctPercentage}%</h4>
                        <p class="analytics-card-label">Skuteczność</p>
                    </div>
                    <div class="analytics-summary-card">
                        <div class="analytics-card-icon">📝</div>
                        <h4 class="analytics-card-value neutral">${stats.correctTasks}/${stats.totalTasks}</h4>
                        <p class="analytics-card-label">Zadania rozwiązane</p>
                    </div>
                    <div class="analytics-summary-card">
                        <div class="analytics-card-icon">🏷️</div>
                        <h4 class="analytics-card-value neutral">${categoryPerformance.length}</h4>
                        <p class="analytics-card-label">Aktywne kategorie</p>
                    </div>
                </div>
                
                <!-- Charts functionality removed -->
                
                <!-- Performance Sections -->
                ${this.renderPerformanceSections(strongCategories, weakCategories)}
                
                <!-- Detailed Table -->
                ${this.renderSubjectDetailedTable(categoryPerformance, subject.name)}
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
        return `
            <div class="detailed-table-section">
                <div class="detailed-table-header">
                    <h4 class="detailed-table-title">📋 Szczegółowe statystyki - ${this.escapeHtml(subjectName)}</h4>
                    <p class="detailed-table-subtitle">Kliknij na kategorię, aby zobaczyć listę zadań</p>
                </div>
                
                <div class="analytics-table-container">
                    <table class="analytics-table expandable-table">
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
        
        return `
            <tr class="category-row" data-category="${this.escapeHtml(category.name)}">
                <td class="category-name-cell">
                    <div class="category-name-container">
                        <span class="category-expand-icon" onclick="toggleCategoryTasks('${categoryId}')">▶️</span>
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
                    <button class="expand-tasks-btn" onclick="toggleCategoryTasks('${categoryId}')">
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
                        <div class="task-list">
                            ${this.renderTaskList(category.tasks || [])}
                        </div>
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
        
        return tasks.map(task => this.renderTaskItem(task)).join('');
    }
    
    /**
     * Render individual task item
     */
    renderTaskItem(task) {
        const isCorrect = this.isTaskCorrect(task);
        const correctnessClass = isCorrect ? 'correct' : 'incorrect';
        const correctnessText = isCorrect ? '✅ Poprawne' : '❌ Niepoprawne';
        
        // Generate task ID for unique identification
        const taskId = `task-${this.escapeHtml(task.name || 'unnamed').replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}`;
        
        // Format date and time
        const taskDate = this.formatTaskDate(task.timestamp);
        const taskTime = this.formatTaskTime(task.timestamp);
        const timeAgo = this.formatTimeAgo(task.timestamp);
        
        return `
            <div class="task-item ${correctnessClass}" data-task-id="${taskId}">
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
}

// Global toggle function for category tasks
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
