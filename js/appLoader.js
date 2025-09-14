/**
 * App Loader Manager
 * Coordinates initial data loading from Google Sheets with visual feedback
 */
class AppLoader {
    constructor(config) {
        this.config = config;
        this.googleSheetsAPI = null;
        this.loadingSteps = [
            { id: 'config', name: 'Konfiguracja', status: 'pending' },
            { id: 'subjects', name: 'Przedmioty', status: 'pending' },
            { id: 'categories', name: 'Kategorie', status: 'pending' },
            { id: 'data', name: 'Dane użytkownika', status: 'pending' },
            { id: 'interface', name: 'Interfejs', status: 'pending' }
        ];
        this.loadedData = {
            subjects: [],
            categories: [],
            entries: [],
            achievements: [],
            settings: {}
        };
        this.totalSteps = this.loadingSteps.length;
        this.completedSteps = 0;
        this.isLoading = false;
        
        this.elements = {
            loadingScreen: null,
            progressFill: null,
            statusText: null,
            steps: {}
        };
    }

    /**
     * Initialize the app loader
     */
    init() {
        this.cacheElements();
        this.initializeAPI();
        this.showLoadingScreen();
        this.startLoading();
    }

    /**
     * Cache DOM elements
     */
    cacheElements() {
        this.elements.loadingScreen = document.getElementById('app-loading');
        this.elements.progressFill = document.getElementById('loading-progress-fill');
        this.elements.statusText = document.getElementById('loading-status');
        
        // Cache step elements
        this.loadingSteps.forEach(step => {
            this.elements.steps[step.id] = {
                element: document.getElementById(`step-${step.id}`),
                status: document.querySelector(`#step-${step.id} .step-status`)
            };
        });
        
    }

    /**
     * Initialize Google Sheets API
     */
    initializeAPI() {
        try {
            this.googleSheetsAPI = new GoogleSheetsAPIv2(this.config);
        } catch (error) {
            console.error('❌ Failed to initialize Google Sheets API:', error);
            this.showError('Błąd inicjalizacji API');
        }
    }

    /**
     * Show the loading screen
     */
    showLoadingScreen() {
        if (this.elements.loadingScreen) {
            this.elements.loadingScreen.style.display = 'flex';
            this.updateProgress(0, 'Inicjalizacja aplikacji...');
        }
    }

    /**
     * Hide the loading screen with animation
     */
    hideLoadingScreen() {
        return new Promise((resolve) => {
            if (this.elements.loadingScreen) {
                this.elements.loadingScreen.classList.add('fade-out');
                setTimeout(() => {
                    this.elements.loadingScreen.style.display = 'none';
                    resolve();
                }, 500);
            } else {
                resolve();
            }
        });
    }

    /**
     * Start the loading process
     */
    async startLoading() {
        if (this.isLoading) return;
        
        this.isLoading = true;

        try {
            // Step 1: Configuration
            await this.executeStep('config', 'Ładowanie konfiguracji...', async () => {
                await this.delay(300); // Simulate config loading
                return true;
            });

            // Step 2: Subjects
            await this.executeStep('subjects', 'Pobieranie przedmiotów...', async () => {
                const response = await this.googleSheetsAPI.fetchSubjects();
                if (response.success && response.subjects) {
                    this.loadedData.subjects = response.subjects;
                    return true;
                } else {
                    this.loadedData.subjects = [];
                    return true; // Continue anyway
                }
            });

            // Step 3: Categories  
            await this.executeStep('categories', 'Pobieranie kategorii...', async () => {
                const response = await this.googleSheetsAPI.fetchCategories();
                if (response.success && response.categories) {
                    this.loadedData.categories = response.categories;
                    return true;
                } else {
                    this.loadedData.categories = [];
                    return true; // Continue anyway
                }
            });

            // Step 4: User Data
            await this.executeStep('data', 'Ładowanie danych użytkownika...', async () => {
                try {
                    // Try to load tasks and achievements, but don't fail if they don't exist
                    const tasksPromise = this.googleSheetsAPI.getTasks()
                        .then(response => response)
                        .catch(error => ({ success: false, data: [] }));
                    
                    const achievementsPromise = this.googleSheetsAPI.fetchAchievements()
                        .then(response => response)
                        .catch(error => ({ success: false, data: [] }));

                    const [tasksResponse, achievementsResponse] = await Promise.all([
                        tasksPromise,
                        achievementsPromise
                    ]);

                    this.loadedData.tasks = (tasksResponse && tasksResponse.success && tasksResponse.data) ? tasksResponse.data : [];
                    this.loadedData.achievements = (achievementsResponse && achievementsResponse.success && achievementsResponse.data) ? achievementsResponse.data : [];
                    
                    return true; // Always return true for user data step
                } catch (error) {
                    this.loadedData.tasks = [];
                    this.loadedData.achievements = [];
                    return true; // Continue anyway
                }
            });

            // Step 5: Interface
            await this.executeStep('interface', 'Przygotowanie interfejsu...', async () => {
                await this.initializeInterface();
                return true;
            });

            // Complete loading
            this.updateProgress(100, 'Gotowe!');
            await this.delay(500);
            

            // Hide loading screen and initialize app
            await this.hideLoadingScreen();
            this.initializeApp();

        } catch (error) {
            this.showError('Błąd podczas ładowania aplikacji');
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Execute a loading step with visual feedback
     */
    async executeStep(stepId, statusText, stepFunction) {
        const step = this.loadingSteps.find(s => s.id === stepId);
        if (!step) return;

        // Update UI
        this.setStepActive(stepId);
        this.updateProgress(null, statusText);

        try {
            // Execute the step function
            const success = await stepFunction();
            
            if (success) {
                this.setStepCompleted(stepId);
                this.completedSteps++;
                step.status = 'completed';
            } else {
                this.setStepError(stepId);
                step.status = 'error';
            }

            // Update progress
            const progressPercent = (this.completedSteps / this.totalSteps) * 100;
            this.updateProgress(progressPercent);
            
            await this.delay(200); // Brief pause for visual feedback
            
        } catch (error) {
            this.setStepError(stepId);
            step.status = 'error';
            
            // Continue anyway for non-critical errors
            if (stepId !== 'config' && stepId !== 'interface') {
                this.completedSteps++;
                const progressPercent = (this.completedSteps / this.totalSteps) * 100;
                this.updateProgress(progressPercent);
            } else {
                throw error; // Critical errors should stop loading
            }
        }
    }

    /**
     * Initialize the app interface with loaded data
     */
    async initializeInterface() {
        // Store data globally for other managers
        window.appData = this.loadedData;
        
        // Initialize dropdowns and forms with real data
        this.populateDropdowns();
        
        // Initialize other components
        await this.delay(300); // Simulate interface setup
        
    }

    /**
     * Populate dropdowns with loaded data
     */
    populateDropdowns() {
        // Quick task form
        this.populateSubjectDropdown('quick-task-subject');
        
        // Pomodoro form  
        this.populateSubjectDropdown('pomodoro-subject');
        
    }
    
    /**
     * Set up category change handlers for subject dropdowns
     */
    setupCategoryHandlers() {
        // Quick task subject change
        const quickSubjectSelect = document.getElementById('quick-task-subject');
        const quickCategorySelect = document.getElementById('quick-task-category');
        
        if (quickSubjectSelect && quickCategorySelect) {
            quickSubjectSelect.addEventListener('change', (e) => {
                this.updateCategoriesForSubject(e.target.value, quickCategorySelect);
            });
        }
        
        // Pomodoro subject change
        const pomodoroSubjectSelect = document.getElementById('pomodoro-subject');
        const pomodoroCategorySelect = document.getElementById('pomodoro-category');
        
        if (pomodoroSubjectSelect && pomodoroCategorySelect) {
            pomodoroSubjectSelect.addEventListener('change', (e) => {
                this.updateCategoriesForSubject(e.target.value, pomodoroCategorySelect);
            });
        }
    }
    
    /**
     * Update categories dropdown based on selected subject
     */
    updateCategoriesForSubject(selectedSubject, categorySelect) {
        if (!categorySelect) return;
        
        // Clear existing options
        categorySelect.innerHTML = '<option value="">Wybierz kategorię</option>';
        
        if (!selectedSubject) {
            return;
        }
        
        // Filter categories by subject
        const filteredCategories = this.loadedData.categories.filter(category => 
            (category.subject_name === selectedSubject || category.subject === selectedSubject)
        );
        
        // Add filtered categories
        filteredCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.name || category.category_name;
            option.textContent = category.name || category.category_name;
            categorySelect.appendChild(option);
        });
        
        // If no categories found, show message
        if (filteredCategories.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'Brak kategorii dla tego przedmiotu';
            option.disabled = true;
            categorySelect.appendChild(option);
        }
    }

    /**
     * Populate a subject dropdown
     */
    populateSubjectDropdown(elementId) {
        const select = document.getElementById(elementId);
        if (!select) return;

        // Clear existing options
        select.innerHTML = '<option value="">Wybierz przedmiot</option>';
        
        // Add subjects from loaded data
        this.loadedData.subjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject.name || subject.subject_name;
            option.textContent = subject.name || subject.subject_name;
            select.appendChild(option);
        });

        // If no subjects loaded, show message
        if (this.loadedData.subjects.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'Brak przedmiotów w arkuszu';
            option.disabled = true;
            select.appendChild(option);
        }
    }

    /**
     * Initialize the main app after loading
     */
    initializeApp() {
        // Initialize managers with loaded data
        try {
            // Create instances and pass loaded data
            // Initialize core components
            
            try {
                window.formApp = new FormApp();
            } catch (error) {
            }
            
            try {
                window.navigationManager = new NavigationManager(this.config, this.googleSheetsAPI);
            } catch (error) {
            }
            
            try {
                window.dashboardManager = new DashboardManager(this.config, this.googleSheetsAPI);
            } catch (error) {
            }
            
            try {
                window.analyticsManager = new AnalyticsManager(this.config, this.googleSheetsAPI);
            } catch (error) {
            }
            
            // Initialize other components
            if (typeof CountdownTimer !== 'undefined') {
                try {
                    window.countdownTimer = new CountdownTimer(this.config);
                } catch (error) {}
            }
            
            if (typeof AchievementSystem !== 'undefined') {
                try {
                    window.achievementSystem = new AchievementSystem(this.config);
                } catch (error) {}
            }

            if (typeof QuickTaskManager !== 'undefined') {
                try {
                    window.quickTaskManager = new QuickTaskManager(this.config, this.googleSheetsAPI);
                } catch (error) {}
            }
            
            if (typeof StreakManager !== 'undefined') {
                try {
                    window.streakManager = new StreakManager(this.config);
                } catch (error) {}
            }
            
            if (typeof PomodoroTimer !== 'undefined') {
                try {
                    window.pomodoroTimer = new PomodoroTimer(this.config, this.googleSheetsAPI);
                } catch (error) {}
            }
            
            if (typeof SettingsManager !== 'undefined') {
                try {
                    window.settingsManager = new SettingsManager(this.config);
                } catch (error) {}
            }

            // Set loaded data on managers
            if (window.dashboardManager && typeof window.dashboardManager.setLoadedData === 'function') {
                try {
                    window.dashboardManager.setLoadedData(this.loadedData);
                } catch (error) {}
            }
            
            if (window.analyticsManager && typeof window.analyticsManager.setLoadedData === 'function') {
                try {
                    window.analyticsManager.setLoadedData(this.loadedData);
                } catch (error) {}
            }
            
            if (window.quickTaskManager && typeof window.quickTaskManager.setLoadedData === 'function') {
                try {
                    window.quickTaskManager.setLoadedData(this.loadedData);
                } catch (error) {}
            }

            // Show the dashboard by default
            if (window.navigationManager && typeof window.navigationManager.showForm === 'function') {
                setTimeout(() => {
                    try {
                        window.navigationManager.showForm('dashboard');
                    } catch (error) {}
                }, 100);
            }
            
        } catch (error) {
            // App initialization failed
            this.updateProgress(null, '❌ Błąd inicjalizacji aplikacji');
            
            // Try to hide loading screen after error
            setTimeout(() => {
                this.hideLoadingScreen();
            }, 3000);
        }
    }

    /**
     * Update progress bar and status
     */
    updateProgress(percent, statusText) {
        if (percent !== null && this.elements.progressFill) {
            this.elements.progressFill.style.width = `${percent}%`;
        }
        
        if (statusText && this.elements.statusText) {
            this.elements.statusText.textContent = statusText;
        }
    }

    /**
     * Set step as active
     */
    setStepActive(stepId) {
        const stepElements = this.elements.steps[stepId];
        if (stepElements) {
            stepElements.element.classList.add('active');
            stepElements.status.textContent = '⏳';
        }
    }

    /**
     * Set step as completed
     */
    setStepCompleted(stepId) {
        const stepElements = this.elements.steps[stepId];
        if (stepElements) {
            stepElements.element.classList.remove('active');
            stepElements.element.classList.add('completed');
            stepElements.status.textContent = '✅';
        }
    }

    /**
     * Set step as error
     */
    setStepError(stepId) {
        const stepElements = this.elements.steps[stepId];
        if (stepElements) {
            stepElements.element.classList.remove('active');
            stepElements.element.classList.add('error');
            stepElements.status.textContent = '❌';
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        this.updateProgress(null, `❌ ${message}`);
        
        // Hide loading screen after error without trying to reinitialize
        setTimeout(() => {
            this.hideLoadingScreen();
        }, 3000);
    }

    /**
     * Utility delay function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get loaded data
     */
    getLoadedData() {
        return this.loadedData;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AppLoader;
}
