/**
 * Dashboard Manager Class
 * Handles dashboard functionality including data fetching, statistics calculation,
 * and rendering of subject cards with category lists and progress bars
 */
class DashboardManager {
    constructor(config, googleSheetsAPI) {
        this.config = config;
        this.googleSheetsAPI = googleSheetsAPI;
        this.subjects = [];
        this.categories = [];
        this.entries = [];
        this.dashboardData = {};
        this.selectedSubject = null;
        this.isLoading = false;

        this.init();
    }

    /**
     * Initialize dashboard
     */
    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupEventListeners());
        } else {
            this.setupEventListeners();
        }
    }

    /**
     * Set loaded data from AppLoader
     */
    setLoadedData(loadedData) {
        if (loadedData) {
            this.subjects = loadedData.subjects || [];
            this.categories = loadedData.categories || [];
            // Fix: AppLoader stores tasks in 'tasks' property, not 'entries'
            this.entries = loadedData.tasks || loadedData.entries || [];
            
            // Dashboard data set from AppLoader
            
            // Process data
            this.processDashboardData();
            
            // Try to render, but defer if DOM elements aren't ready
            this.tryRenderDashboard();
        }
    }
    
    /**
     * Try to render dashboard, with retry if DOM elements aren't ready
     */
    tryRenderDashboard() {
        const tabsContainer = document.getElementById('subject-tabs');
        const contentContainer = document.getElementById('categories-content');
        
        if (!tabsContainer || !contentContainer) {
            // console.log('🕰️ Dashboard DOM elements not ready, deferring render...');
            // Retry after a short delay
            setTimeout(() => {
                this.tryRenderDashboard();
            }, 100);
            return;
        }
        
        // DOM elements are ready, render dashboard
        this.renderDashboard();
        // console.log('🎨 Dashboard rendered successfully');
    }
    
    /**
     * Force render dashboard (called when dashboard is shown)
     */
    forceRender() {
        if (this.subjects.length > 0 || this.categories.length > 0 || this.entries.length > 0) {
            // console.log('🔄 Force rendering dashboard...');
            this.processDashboardData();
            this.tryRenderDashboard();
        } else {
            // console.log('⚠️ No data available for dashboard rendering');
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        const refreshBtn = document.getElementById('refresh-dashboard');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                // console.log('Manual refresh clicked - attempting to load real data from Google Sheets...');
                this.loadDashboardData();
            });
        }

        // DashboardManager initialized
        
        // Dashboard data will be loaded via AppLoader
    }


    /**
     * Load all dashboard data
     */
    async loadDashboardData() {
        // console.log('loadDashboardData() called');
        
        if (this.isLoading) {
            // console.log('Already loading, returning early');
            return;
        }
        
        const tabsContainer = document.getElementById('subject-tabs');
        const contentContainer = document.getElementById('categories-content');
        if (!tabsContainer || !contentContainer) {
            // Dashboard containers not found
            return;
        }
        
        // console.log('Starting loadDashboardData execution...');

        try {
            // console.log('Entering try block...');
            this.isLoading = true;
            this.setLoadingState(true);
            // console.log('Loading state set to true');

            // console.log('=== LOADING DASHBOARD DATA ===');
            // console.log('Loading real data from Google Sheets...');
            // console.log('GoogleSheetsAPI instance:', this.googleSheetsAPI);

            // Load all required data in parallel with timeout
            // console.log('Starting parallel data fetch...');
            
            const fetchWithTimeout = (promise, timeout = 3000) => {
                return Promise.race([
                    promise,
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Request timeout')), timeout)
                    )
                ]);
            };
            
            try {
                // console.log('Attempting to fetch real data from Google Sheets...');
                
                // Try to fetch data with individual error handling
                let subjectsResponse = { success: false, subjects: [] };
                let categoriesResponse = { success: false, categories: [] };
                let entriesResponse = { success: false, entries: [] };
                
                try {
                    // console.log('Fetching subjects...');
                    subjectsResponse = await fetchWithTimeout(this.googleSheetsAPI.fetchSubjects());
                    // console.log('%c📚 [DASHBOARD] Subjects response:', 'color: #e67e22; font-weight: bold;', subjectsResponse);
                } catch (subError) {
                    // console.error('%c❌ [DASHBOARD] Failed to fetch subjects:', 'color: #e74c3c; font-weight: bold;', subError);
                }
                
                try {
                    // console.log('Fetching categories...');
                    categoriesResponse = await fetchWithTimeout(this.googleSheetsAPI.fetchCategories());
                    // console.log('%c🏷️ [DASHBOARD] Categories response:', 'color: #8e44ad; font-weight: bold;', categoriesResponse);
                } catch (catError) {
                    // console.error('%c❌ [DASHBOARD] Failed to fetch categories:', 'color: #e74c3c; font-weight: bold;', catError);
                }
                
                try {
                    // console.log('Fetching tasks...');
                    entriesResponse = await fetchWithTimeout(this.googleSheetsAPI.getTasks());
                    // console.log('%c📝 [DASHBOARD] Tasks response:', 'color: #27ae60; font-weight: bold;', entriesResponse);
                } catch (entError) {
                    // console.error('%c❌ [DASHBOARD] Failed to fetch tasks:', 'color: #e74c3c; font-weight: bold;', entError);
                }
                
                // Data fetch completed with results
                
                // If all API calls failed, show an error and stop
                const allFailed = !subjectsResponse.success && !categoriesResponse.success && !entriesResponse.success;
                if (allFailed) {
                    // console.error('All API calls failed.');
                    this.showErrorMessage('Nie udało się załadować danych z Google Sheets.');
                    this.setLoadingState(false);
                    this.isLoading = false;
                    return;
                }
                
                // Store the data (use whatever we got)
                this.subjects = subjectsResponse.subjects || [];
                this.categories = categoriesResponse.categories || [];
                this.entries = entriesResponse.data || []; // Tasks come in data property
                
                // Stored dashboard data
                
                // Check if we got any useful data (more lenient requirements)
                const hasSubjects = this.subjects.length > 0;
                const hasCategories = this.categories.length > 0;
                const hasAnyData = hasSubjects || hasCategories;
                
                // Data availability check
                
                if (!hasAnyData) {
                    // console.log('No data available from Google Sheets.');
                    this.showErrorMessage('Brak danych w Google Sheets. Dodaj najpierw kategorie, przedmioty i wpisy.');
                    this.setLoadingState(false);
                    this.isLoading = false;
                    return;
                }
                
                // Process only the real data that was loaded successfully

                // Process and render dashboard with real data
                // console.log('Using real data from Google Sheets');
                this.processDashboardData();
                this.renderDashboard();
                
                // console.log('Dashboard rendering completed with real data');
                
                // Show success message with details about what was loaded
                try {
                    const messageContainer = document.getElementById('message-container');
                    if (messageContainer && window.navigationManager) {
                        let message = '✅ Dashboard załadowany z Google Sheets!';
                        
                        const loadedParts = [];
                        if (hasSubjects) loadedParts.push(`${this.subjects.length} przedmiotów`);
                        if (hasCategories) loadedParts.push(`${this.categories.length} kategorii`);
                        if (this.entries.length > 0) loadedParts.push(`${this.entries.length} wpisów`);
                        
                        if (loadedParts.length > 0) {
                            message += ` Załadowano: ${loadedParts.join(', ')}.`;
                        }
                        
                        window.navigationManager.showMessage(message, 'success');
                    }
                } catch (msgError) {
                    // console.log('Could not show success message:', msgError);
                }
                
            } catch (apiError) {
                // console.error('API fetch failed:', apiError);
                this.showErrorMessage(`Błąd połączenia z Google Sheets: ${apiError.message}`);
                this.setLoadingState(false);
                this.isLoading = false;
                return;
            }


        } catch (error) {
            // console.error('Error loading dashboard data:', error);
            this.showErrorMessage(`Błąd ładowania danych: ${error.message}`);
        } finally {
            this.isLoading = false;
            this.setLoadingState(false);
        }
    }


    /**
     * Process dashboard data and calculate statistics
     */
    processDashboardData() {
        const dashboardData = {};

        // Clean summary of imported data
        if (this.entries.length > 0) {
            const correctTasks = this.entries.filter(entry => {
                if (typeof entry.correctness === 'string') {
                    return entry.correctness.toLowerCase() === 'poprawnie';
                } else if (typeof entry.correctness === 'boolean') {
                    return entry.correctness === true;
                }
                return false;
            }).length;
            
            const percentage = Math.round((correctTasks / this.entries.length) * 100);
            
            console.log('📊 FINAL IMPORTED DATA SUMMARY:');
            console.log(`✅ Total Tasks: ${this.entries.length}`);
            console.log(`✅ Correct Tasks: ${correctTasks} (${percentage}%)`);
            console.log(`✅ Subjects: ${this.subjects.length}`);
            console.log(`✅ Categories: ${this.categories.length}`);
        }

        // Group entries by subject - only include subjects with entries
        this.subjects.forEach(subject => {
            const subjectEntries = this.entries.filter(entry => 
                entry.subject === subject.name || entry.przedmiot === subject.name
            );

            // Only process subjects that have entries
            if (subjectEntries.length > 0) {
                // Group by category
                const categoriesData = {};
                
                // Only include categories that have entries for this subject
                this.categories.forEach(category => {
                    const categoryEntries = subjectEntries.filter(entry => 
                        entry.category === category.name || entry.kategorie === category.name
                    );

                    // Only include category if it has entries for this subject
                    if (categoryEntries.length > 0) {
                        categoriesData[category.name] = {
                            category: category,
                            entries: categoryEntries,
                            stats: this.calculateCategoryStats(categoryEntries)
                        };
                    }
                });

                // Include subject only if it has entries
                dashboardData[subject.name] = {
                    subject: subject,
                    totalEntries: subjectEntries.length,
                    categories: categoriesData,
                    overallStats: this.calculateOverallStats(subjectEntries)
                };
            }
        });

        this.dashboardData = dashboardData;
    }

    /**
     * Calculate statistics for a category
     */
    calculateCategoryStats(entries) {
        if (entries.length === 0) {
            return { total: 0, correctScore: 0, percentage: 0 };
        }

        let correctScore = 0;
        
        entries.forEach(entry => {
            // Handle both task format (correctness: boolean/string) and main entry format (poprawnosc: string)
            let isCorrect = false;
            
            if (entry.correctness !== undefined) {
                // Task format: handle both boolean and string correctness
                if (typeof entry.correctness === 'boolean') {
                    isCorrect = entry.correctness;
                } else if (typeof entry.correctness === 'string') {
                    // Handle string values like "Poprawnie", "Błędnie", "Dobrze", "Źle"
                    const corrValue = entry.correctness.toLowerCase();
                    isCorrect = corrValue === 'poprawnie' || corrValue === 'dobrze' || corrValue === 'true';
                }
            } else if (entry.poprawnosc !== undefined) {
                // Legacy main entry format: string poprawnosc
                const corrValue = entry.poprawnosc.toLowerCase();
                isCorrect = corrValue === 'poprawnie' || corrValue === 'dobrze';
            }
            
            if (isCorrect) {
                correctScore += 1;
            }
        });

        const percentage = Math.round((correctScore / entries.length) * 100);

        return {
            total: entries.length,
            correctScore: correctScore,
            percentage: percentage
        };
    }

    /**
     * Calculate overall statistics for a subject
     */
    calculateOverallStats(entries) {
        if (entries.length === 0) {
            return { total: 0, correctScore: 0, percentage: 0 };
        }

        let correctScore = 0;
        
        entries.forEach(entry => {
            // Handle both task format (correctness: boolean/string) and main entry format (poprawnosc: string)
            let isCorrect = false;
            
            if (entry.correctness !== undefined) {
                // Task format: handle both boolean and string correctness
                if (typeof entry.correctness === 'boolean') {
                    isCorrect = entry.correctness;
                } else if (typeof entry.correctness === 'string') {
                    // Handle string values like "Poprawnie", "Błędnie", "Dobrze", "Źle"
                    const corrValue = entry.correctness.toLowerCase();
                    isCorrect = corrValue === 'poprawnie' || corrValue === 'dobrze' || corrValue === 'true';
                }
            } else if (entry.poprawnosc !== undefined) {
                // Legacy main entry format: string poprawnosc
                const corrValue = entry.poprawnosc.toLowerCase();
                isCorrect = corrValue === 'poprawnie' || corrValue === 'dobrze';
            }
            
            if (isCorrect) {
                correctScore += 1;
            }
        });

        const percentage = Math.round((correctScore / entries.length) * 100);

        return {
            total: entries.length,
            correctScore: correctScore,
            percentage: percentage
        };
    }

    /**
     * Render the dashboard
     */
    renderDashboard() {
        this.renderSubjectTabs();
        this.renderCategoriesContent();
    }

    /**
     * Render subject tabs horizontally
     */
    renderSubjectTabs() {
        const tabsContainer = document.getElementById('subject-tabs');
        // console.log('renderSubjectTabs - tabsContainer:', tabsContainer);
        if (!tabsContainer) {
            // console.error('subject-tabs element not found!');
            return;
        }

        // Check if there's any data
        if (Object.keys(this.dashboardData).length === 0) {
            let message = '📊 Brak danych do wyświetlenia.';
            
            if (this.subjects.length === 0) {
                message += '<br>❌ Brak przedmiotów - dodaj przedmioty w zarządzaniu przedmiotami.';
            } else if (this.categories.length === 0) {
                message += '<br>❌ Brak kategorii - dodaj kategorie w zarządzaniu kategoriami.';
            } else if (this.entries.length === 0) {
                message += '<br>❌ Brak wpisów - dodaj wpisy używając formularza głównego.';
            } else {
                message += '<br>❌ Wpisy nie pasują do żadnych przedmiotów/kategorii - sprawdź nazwy.';
            }
            
            message += `<br><br>📈 Aktualnie:<br>
                       • Przedmioty: ${this.subjects.length}<br>
                       • Kategorie: ${this.categories.length}<br>
                       • Wpisy: ${this.entries.length}`;
            
            tabsContainer.innerHTML = `
                <div class="no-data-message">
                    ${message}
                </div>
            `;
            return;
        }

        // Render subject tabs
        const subjectNames = Object.keys(this.dashboardData);
        const tabsHtml = subjectNames.map(subjectName => {
            const subjectData = this.dashboardData[subjectName];
            const isActive = this.selectedSubject === subjectName;
            
            return `
                <div class="subject-tab ${isActive ? 'active' : ''}" data-subject="${this.escapeHtml(subjectName)}">
                    📚 ${this.escapeHtml(subjectName)}
                    <span class="subject-tab-count">${subjectData.totalEntries}</span>
                </div>
            `;
        }).join('');

        tabsContainer.innerHTML = tabsHtml;

        // If no subject is selected, select the first one
        if (!this.selectedSubject && subjectNames.length > 0) {
            this.selectedSubject = subjectNames[0];
            this.renderSubjectTabs(); // Re-render to show active state
        }

        // Setup click handlers for tabs
        this.setupTabClickHandlers();
    }

    /**
     * Render categories content for selected subject
     */
    renderCategoriesContent() {
        const contentContainer = document.getElementById('categories-content');
        // console.log('renderCategoriesContent - contentContainer:', contentContainer);
        // console.log('Selected subject:', this.selectedSubject);
        if (!contentContainer) {
            // console.error('categories-content element not found!');
            return;
        }

        if (!this.selectedSubject || !this.dashboardData[this.selectedSubject]) {
            contentContainer.innerHTML = `
                <div class="no-subject-selected">
                    📚 Wybierz przedmiot z menu powyżej, aby zobaczyć kategorie i statystyki dla tego przedmiotu.
                    <br><br>
                    💡 Dashboard pokazuje tylko kategorie, które mają wpisy w wybranym przedmiocie.
                </div>
            `;
            return;
        }

        const subjectData = this.dashboardData[this.selectedSubject];
        const categories = subjectData.categories;

        if (Object.keys(categories).length === 0) {
            contentContainer.innerHTML = `
                <div class="no-subject-selected">
                    📚 Brak kategorii z wpisami dla przedmiotu "${this.escapeHtml(this.selectedSubject)}".
                    <br><br>
                    📝 Aby zobaczyć kategorie tutaj, dodaj wpisy używając formularza głównego.
                </div>
            `;
            return;
        }

        // Render categories as a styled table
        const categoriesHtml = this.renderCategoriesTable(categories);

        contentContainer.innerHTML = categoriesHtml;

        // Setup expand/collapse functionality
        this.setupExpandCollapseHandlers();
    }

    /**
     * Setup click handlers for subject tabs
     */
    setupTabClickHandlers() {
        const tabs = document.querySelectorAll('.subject-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const subjectName = tab.getAttribute('data-subject');
                this.selectSubject(subjectName);
            });
        });
    }

    /**
     * Select a subject and update the display
     */
    selectSubject(subjectName) {
        if (this.selectedSubject === subjectName) return;
        
        this.selectedSubject = subjectName;
        // console.log('Selected subject:', subjectName);
        
        // Update tab appearance
        this.renderSubjectTabs();
        
        // Update categories content
        this.renderCategoriesContent();
    }

    /**
     * Render categories as a styled table
     */
    renderCategoriesTable(categories) {
        if (Object.keys(categories).length === 0) {
            return `
                <div class="no-subject-selected">
                    📚 Brak kategorii dla przedmiotu "${this.escapeHtml(this.selectedSubject)}".
                </div>
            `;
        }

        // Sort categories by percentage (descending)
        const sortedCategories = Object.keys(categories)
            .map(categoryName => ({
                name: categoryName,
                data: categories[categoryName]
            }))
            .sort((a, b) => b.data.stats.percentage - a.data.stats.percentage);

        const tableRows = sortedCategories.map(({ name, data }) => {
            const { stats } = data;
            const progressClass = this.getProgressClass(stats.percentage);
            const progressColor = this.getProgressColor(stats.percentage);
            
            return `
                <tr style="transition: background-color 0.2s; background: white;" class="category-row" data-category="${this.escapeHtml(name)}">
                    <td style="padding: 16px; border-bottom: 1px solid rgb(238, 238, 238); font-weight: 600; color: rgb(34, 34, 59);">
                        🏷️ ${this.escapeHtml(name)}
                    </td>
                    <td style="text-align: center; padding: 16px; border-bottom: 1px solid rgb(238, 238, 238); font-weight: 600; color: rgb(34, 34, 59);">
                        ${stats.correctScore.toFixed(1)}/${stats.total}
                    </td>
                    <td style="text-align: center; padding: 16px; border-bottom: 1px solid rgb(238, 238, 238);">
                        <span style="font-weight: 700; color: ${progressColor};">${stats.percentage}%</span>
                    </td>
                    <td style="text-align: center; padding: 16px; border-bottom: 1px solid rgb(238, 238, 238);">
                        <div style="width: 100%; background: rgb(241, 243, 244); border-radius: 6px; overflow: hidden;">
                            <div style="width: ${stats.percentage}%; height: 12px; background: linear-gradient(90deg, ${progressColor} 0%, ${progressColor}CC 100%); border-radius: 6px; transition: width 0.5s;"></div>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        return `
            <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: rgba(80, 112, 255, 0.1) 0px 4px 24px; margin-top: 1rem;">
                <div style="padding: 16px; background: linear-gradient(135deg, rgb(102, 126, 234) 0%, rgb(118, 75, 162) 100%); color: white; font-weight: 700; font-size: 18px; text-align: center;">
                    📊 ${this.escapeHtml(this.selectedSubject)} - Kategorie z wpisami
                </div>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr>
                            <th style="text-align: left; padding: 16px; background: linear-gradient(135deg, rgb(102, 126, 234) 0%, rgb(118, 75, 162) 100%); color: white; font-weight: 700; font-size: 16px;">
                                🏷️ Kategoria
                            </th>
                            <th style="text-align: center; padding: 16px; background: linear-gradient(135deg, rgb(102, 126, 234) 0%, rgb(118, 75, 162) 100%); color: white; font-weight: 700; font-size: 16px;">
                                📊 Zadania
                            </th>
                            <th style="text-align: center; padding: 16px; background: linear-gradient(135deg, rgb(102, 126, 234) 0%, rgb(118, 75, 162) 100%); color: white; font-weight: 700; font-size: 16px;">
                                🎯 Skuteczność
                            </th>
                            <th style="text-align: center; padding: 16px; background: linear-gradient(135deg, rgb(102, 126, 234) 0%, rgb(118, 75, 162) 100%); color: white; font-weight: 700; font-size: 16px;">
                                📈 Postęp
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * Get progress color based on percentage
     */
    getProgressColor(percentage) {
        if (percentage >= 80) return 'rgb(46, 204, 113)';  // Green
        if (percentage >= 60) return 'rgb(243, 156, 18)';  // Orange
        return 'rgb(231, 76, 60)';  // Red
    }

    /**
     * Render a category as list item (legacy - now unused)
     */
    renderCategoryListItem(categoryName, categoryData) {
        const { category, entries, stats } = categoryData;
        const progressClass = this.getProgressClass(stats.percentage);
        
        return `
            <div class="category-list-item" data-category="${this.escapeHtml(categoryName)}">
                <div class="category-list-header">
                    <div class="category-list-info">
                        <span class="category-list-name">🏷️ ${this.escapeHtml(categoryName)}</span>
                        <div class="category-list-progress">
                            <div class="progress-container-small">
                                <div class="progress-bar ${progressClass}" style="width: ${stats.percentage}%"></div>
                            </div>
                            <span class="progress-text-small">${stats.percentage}% (${stats.correctScore}/${stats.total})</span>
                        </div>
                    </div>
                    <div class="category-list-actions">
                        <span class="category-count-badge">${stats.total} ćwiczeń</span>
                        <span class="expand-icon-small">▼</span>
                    </div>
                </div>
                
                <div class="exercises-list">
                    ${entries.length > 0 ? 
                        entries.map(entry => this.renderExerciseItem(entry)).join('') :
                        '<div class="no-exercises">Brak ćwiczeń w tej kategorii</div>'
                    }
                </div>
            </div>
        `;
    }

    /**
     * Render a category card (legacy - now unused)
     */
    renderCategoryCard(categoryName, categoryData) {
        const { category, entries, stats } = categoryData;
        const progressClass = this.getProgressClass(stats.percentage);
        
        return `
            <div class="category-item-dashboard" data-category="${this.escapeHtml(categoryName)}">
                <div class="category-header">
                    <h4 class="category-name-dashboard">🏷️ ${this.escapeHtml(categoryName)}</h4>
                    <div class="category-stats">
                        <span class="category-count">${stats.total}</span>
                        <span class="expand-icon">▼</span>
                    </div>
                </div>
                
                <div class="progress-container">
                    <div class="progress-bar ${progressClass}" style="width: ${stats.percentage}%"></div>
                </div>
                <div class="progress-text">${stats.percentage}% poprawnych (${stats.correctScore}/${stats.total})</div>
                
                <div class="exercises-list">
                    ${entries.length > 0 ? 
                        entries.map(entry => this.renderExerciseItem(entry)).join('') :
                        '<div class="no-exercises">Brak ćwiczeń w tej kategorii</div>'
                    }
                </div>
            </div>
        `;
    }

    /**
     * Render a subject card (legacy - now unused)
     */
    renderSubjectCard(subjectName, subjectData) {
        const { subject, totalEntries, categories, overallStats } = subjectData;
        
        return `
            <div class="subject-card">
                <div class="subject-card-header">
                    <h3 class="subject-title">📚 ${this.escapeHtml(subjectName)}</h3>
                    <span class="subject-total">${totalEntries} ćwiczeń</span>
                </div>
                
                <div class="categories-list-dashboard">
                    ${Object.keys(categories)
                        .map(categoryName => this.renderCategoryItem(categoryName, categories[categoryName]))
                        .join('')}
                </div>
            </div>
        `;
    }

    /**
     * Render a category item with progress bar and exercises
     */
    renderCategoryItem(categoryName, categoryData) {
        const { category, entries, stats } = categoryData;
        const progressClass = this.getProgressClass(stats.percentage);
        
        return `
            <div class="category-item-dashboard" data-category="${this.escapeHtml(categoryName)}">
                <div class="category-header">
                    <h4 class="category-name-dashboard">🏷️ ${this.escapeHtml(categoryName)}</h4>
                    <div class="category-stats">
                        <span class="category-count">${stats.total}</span>
                        <span class="expand-icon">▼</span>
                    </div>
                </div>
                
                <div class="progress-container">
                    <div class="progress-bar ${progressClass}" style="width: ${stats.percentage}%"></div>
                </div>
                <div class="progress-text">${stats.percentage}% poprawnych (${stats.correctScore}/${stats.total})</div>
                
                <div class="exercises-list">
                    ${entries.length > 0 ? 
                        entries.map(entry => this.renderExerciseItem(entry)).join('') :
                        '<div class="no-exercises">Brak ćwiczeń w tej kategorii</div>'
                    }
                </div>
            </div>
        `;
    }

    /**
     * Render an exercise item
     */
    renderExerciseItem(entry) {
        const correctnessType = this.config.DASHBOARD.CORRECTNESS_MAPPING[entry.poprawnosc] || 'unknown';
        const correctnessText = entry.poprawnosc;
        
        return `
            <div class="exercise-item">
                <span class="exercise-name">${this.escapeHtml(entry.nazwa)}</span>
                <span class="exercise-correctness ${correctnessType}">${this.escapeHtml(correctnessText)}</span>
            </div>
        `;
    }

    /**
     * Setup expand/collapse handlers for category table rows
     */
    setupExpandCollapseHandlers() {
        const categoryRows = document.querySelectorAll('.category-row');
        
        categoryRows.forEach(row => {
            row.addEventListener('click', (e) => {
                e.stopPropagation();
                const categoryName = row.getAttribute('data-category');
                this.showCategoryDetails(categoryName);
            });
            
            // Add hover effect
            row.addEventListener('mouseenter', () => {
                row.style.backgroundColor = 'rgb(248, 250, 252)';
                row.style.cursor = 'pointer';
            });
            
            row.addEventListener('mouseleave', () => {
                row.style.backgroundColor = 'white';
            });
        });
    }

    /**
     * Show category details in a modal or expanded view
     */
    showCategoryDetails(categoryName) {
        if (!this.selectedSubject || !this.dashboardData[this.selectedSubject]) return;
        
        const categoryData = this.dashboardData[this.selectedSubject].categories[categoryName];
        if (!categoryData) return;
        
        const { entries, stats } = categoryData;
        
        // Create a modal to show exercises
        const modalHtml = `
            <div class="category-modal-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.7); display: flex; align-items: center; justify-content: center; z-index: 2000;">
                <div class="category-modal" style="background: white; border-radius: 12px; width: 90%; max-width: 600px; max-height: 80vh; overflow-y: auto; box-shadow: rgba(80, 112, 255, 0.2) 0px 8px 32px;">
                    <div style="padding: 24px; background: linear-gradient(135deg, rgb(102, 126, 234) 0%, rgb(118, 75, 162) 100%); color: white; border-radius: 12px 12px 0 0;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <h3 style="margin: 0; font-size: 20px; font-weight: 700;">
                                🏷️ ${this.escapeHtml(categoryName)}
                            </h3>
                            <button onclick="this.closest('.category-modal-overlay').remove()" style="background: none; border: none; color: white; font-size: 24px; cursor: pointer; padding: 4px 8px; border-radius: 4px; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.2)'" onmouseout="this.style.background='none'">
                                ×
                            </button>
                        </div>
                        <div style="margin-top: 12px; font-size: 16px; opacity: 0.9;">
                            🎯 ${stats.percentage}% skuteczność • ${stats.correctScore}/${stats.total} zadania
                        </div>
                    </div>
                    <div style="padding: 24px;">
                        ${entries.length > 0 ? 
                            `<div style="display: flex; flex-direction: column; gap: 12px;">
                                ${entries.map(entry => this.renderExerciseItemInModal(entry)).join('')}
                            </div>` :
                            '<div style="text-align: center; padding: 40px; color: #6b7280; font-style: italic;">Brak ćwiczeń w tej kategorii</div>'
                        }
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Add click outside to close
        const overlay = document.querySelector('.category-modal-overlay');
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
            }
        });
    }
    
    /**
     * Render exercise item for modal display
     */
    renderExerciseItemInModal(entry) {
        const correctnessType = this.config.DASHBOARD.CORRECTNESS_MAPPING[entry.poprawnosc] || 'unknown';
        const correctnessText = entry.poprawnosc;
        const correctnessColor = this.getProgressColor(
            correctnessType === 'correct' ? 100 : 
            correctnessType === 'partial' ? 60 : 0
        );
        
        return `
            <div style="padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px; background: white; transition: all 0.2s;" onmouseover="this.style.backgroundColor='#f8fafc'" onmouseout="this.style.backgroundColor='white'">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;">
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: #374151; font-size: 16px; margin-bottom: 8px;">
                            ${this.escapeHtml(entry.nazwa)}
                        </div>
                        <div style="color: #6b7280; font-size: 14px; line-height: 1.5;">
                            ${this.escapeHtml(entry.tresc || 'Brak opisu')}
                        </div>
                    </div>
                    <div style="background: ${correctnessColor}22; color: ${correctnessColor}; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; white-space: nowrap; border: 1px solid ${correctnessColor}44;">
                        ${this.escapeHtml(correctnessText)}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Toggle category expansion (legacy - now unused)
     */
    toggleCategoryExpansion(categoryItem) {
        const exercisesList = categoryItem.querySelector('.exercises-list');
        const isExpanded = categoryItem.classList.contains('expanded');

        if (isExpanded) {
            categoryItem.classList.remove('expanded');
            exercisesList.classList.remove('expanded');
        } else {
            categoryItem.classList.add('expanded');
            exercisesList.classList.add('expanded');
        }
    }

    /**
     * Get progress bar class based on percentage
     */
    getProgressClass(percentage) {
        if (percentage >= 80) return 'high';
        if (percentage >= 60) return 'medium';
        return 'low';
    }

    /**
     * Set loading state
     */
    setLoadingState(loading) {
        const tabsContainer = document.getElementById('subject-tabs');
        const contentContainer = document.getElementById('categories-content');
        const refreshBtn = document.getElementById('refresh-dashboard');

        if (loading) {
            if (tabsContainer) {
                tabsContainer.innerHTML = '<div class="loading-dashboard">🔄 Ładowanie przedmiotów...</div>';
            }
            if (contentContainer) {
                contentContainer.innerHTML = '<div class="loading-dashboard">🔄 Ładowanie danych...</div>';
            }
            if (refreshBtn) {
                refreshBtn.disabled = true;
                refreshBtn.textContent = '🔄 Ładowanie...';
            }
        } else {
            if (refreshBtn) {
                refreshBtn.disabled = false;
                refreshBtn.textContent = '🔄 Odśwież dane';
            }
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        const tabsContainer = document.getElementById('subject-tabs');
        const contentContainer = document.getElementById('categories-content');
        
        const errorHtml = `
            <div class="no-data-message">
                ❌ ${message}<br>
                <div style="margin-top: 1rem; display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                    <button type="button" onclick="dashboardManager.loadDashboardData()" class="btn btn-primary">
                        🔄 Spróbuj ponownie
                    </button>
                    <button type="button" onclick="dashboardManager.loadSampleData()" class="btn btn-secondary">
                        📊 Pokaż przykładowe dane
                    </button>
                </div>
            </div>
        `;
        
        if (tabsContainer) {
            tabsContainer.innerHTML = errorHtml;
        }
        if (contentContainer) {
            contentContainer.innerHTML = '<div class="no-subject-selected">❌ Błąd ładowania danych</div>';
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
     * Format date for display
     */
    formatDate(dateString) {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('pl-PL', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return dateString;
        }
    }

    /**
     * Check if dashboard data has been loaded
     */
    hasDataLoaded() {
        return this.subjects.length > 0 || this.categories.length > 0 || this.entries.length > 0;
    }

    /**
     * Show error message to user
     */
    showErrorMessage(message) {
        // console.error('Dashboard error:', message);
        
        const tabsContainer = document.getElementById('subject-tabs');
        const contentContainer = document.getElementById('categories-content');
        
        if (tabsContainer) {
            tabsContainer.innerHTML = `
                <div class="no-data-message">
                    ❌ ${message}
                    <br><br>
                    🔄 <button onclick="window.dashboardManager?.loadDashboardData()" class="btn btn-primary" style="margin-top: 1rem;">Spróbuj ponownie</button>
                </div>
            `;
        }
        
        if (contentContainer) {
            contentContainer.innerHTML = `
                <div class="no-subject-selected">
                    🚫 Nie można załadować danych z Google Sheets.
                </div>
            `;
        }
        
        // Also show message in the navigation message container if available
        try {
            const messageContainer = document.getElementById('message-container');
            if (messageContainer && window.navigationManager) {
                window.navigationManager.showMessage(message, 'error');
            }
        } catch (msgError) {
            // console.log('Could not show navigation message:', msgError);
        }
    }

    /**
     * Get dashboard visibility
     */
    isDashboardVisible() {
        const dashboardContainer = document.getElementById('dashboard-container');
        // If no inline style is set, it defaults to visible (block from HTML)
        const isVisible = dashboardContainer && (dashboardContainer.style.display !== 'none');
        
        if (this.config.DEBUG_MODE) {
            // Dashboard visibility check
        }
        
        return isVisible;
    }
}

// Global dashboard manager instance
let dashboardManager;
