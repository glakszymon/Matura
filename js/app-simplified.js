/**
 * Simplified Form Application Class
 * Professional data entry system with basic form handling and analytics
 */
class SimplifiedFormApp {
    constructor(config) {
        this.config = config;
        this.currentView = 'form';
        this.googleSheetsAPI = new GoogleSheetsAPIv2(config);
        this.analyticsManager = null;
        
        this.init();
    }

    /**
     * Initialize the simplified application
     */
    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    /**
     * Setup the application
     */
    setup() {
        this.setupNavigation();
        this.setupForm();
        this.setupAnalytics();
        this.setupStudyTracking();
        this.showView('form'); // Default to form view
    }

    /**
     * Setup navigation between form, study, and analytics
     */
    setupNavigation() {
        const showFormBtn = document.getElementById('show-form');
        const showStudyBtn = document.getElementById('show-study');
        const showAnalyticsBtn = document.getElementById('show-analytics');

        if (showFormBtn) {
            showFormBtn.addEventListener('click', () => {
                this.showView('form');
                this.setActiveNav(showFormBtn);
            });
        }

        if (showStudyBtn) {
            showStudyBtn.addEventListener('click', () => {
                this.showView('study');
                this.setActiveNav(showStudyBtn);
            });
        }

        if (showAnalyticsBtn) {
            showAnalyticsBtn.addEventListener('click', () => {
                this.showView('analytics');
                this.setActiveNav(showAnalyticsBtn);
            });
        }
    }

    /**
     * Set active navigation button
     */
    setActiveNav(activeBtn) {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        activeBtn.classList.add('active');
    }

    /**
     * Setup form functionality
     */
    setupForm() {
        const form = document.getElementById('google-sheets-form');
        const submitButton = document.getElementById('submit-button');

        if (!form || !submitButton) {
            console.error('Form elements not found');
            return;
        }

        // Form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // StudyTrackingManager is disabled - no duplicate prevention needed
            
            await this.handleFormSubmit(form);
        });

        // Real-time validation
        form.addEventListener('input', (e) => {
            this.validateField(e.target);
        });

        // Load form data (subjects/categories) - with delay to ensure DOM is ready
        setTimeout(() => {
            this.loadFormData();
        }, 100);
    }

    /**
     * Setup analytics functionality
     */
    setupAnalytics() {
        // Initialize analytics manager if it exists
        if (typeof AnalyticsManager !== 'undefined') {
            this.analyticsManager = new AnalyticsManager(this.config, this.googleSheetsAPI);
        }
    }

    /**
     * Setup study tracking functionality
     */
    setupStudyTracking() {
        // DISABLED: StudyTrackingManager to prevent duplicate submissions
        // SimplifiedFormApp handles study sessions instead
        console.log('🎆 StudyTrackingManager disabled - using SimplifiedFormApp study system');
        // if (typeof StudyTrackingManager !== 'undefined') {
        //     this.studyTrackingManager = new StudyTrackingManager(this.config, this.googleSheetsAPI);
        // }
        
        // Initialize study session data for saving
        this.currentSession = null;
        this.sessionTasks = [];
        this.isSessionActive = false;
        
        // Timer management
        this.sessionTimerInterval = null;
        this.taskTimerInterval = null;
        
        // Setup study session modal controls
        this.setupStudySessionModal();
    }
    
    /**
     * Setup study session modal functionality
     */
    setupStudySessionModal() {
        const startStudyBtn = document.getElementById('start-study-button');
        const viewHistoryBtn = document.getElementById('view-history-button');
        const studyModal = document.getElementById('study-session-modal');
        const finishSessionBtn = document.getElementById('finish-session-btn');
        const pauseSessionBtn = document.getElementById('pause-session-btn');
        
        // Start Study Session button
        if (startStudyBtn) {
            startStudyBtn.addEventListener('click', () => {
                console.log('🏁 Starting study session...');
                this.startStudySession();
                this.openStudySessionModal();
            });
        }
        
        // View History button
        if (viewHistoryBtn) {
            viewHistoryBtn.addEventListener('click', () => {
                console.log('📅 Opening study history...');
                // TODO: Implement history view
                alert('Historia sesji nauki - funkcjonalność w przygotowaniu');
            });
        }
        
        // Task completion buttons
        const correctTaskBtn = document.getElementById('correct-task-btn');
        const incorrectTaskBtn = document.getElementById('incorrect-task-btn');
        
        if (correctTaskBtn) {
            correctTaskBtn.addEventListener('click', () => {
                console.log('✅ Correct task recorded');
                this.recordStudyTask(true);
            });
        }
        
        if (incorrectTaskBtn) {
            incorrectTaskBtn.addEventListener('click', () => {
                console.log('❌ Incorrect task recorded');
                this.recordStudyTask(false);
            });
        }
        
        // Finish Session button
        if (finishSessionBtn) {
            finishSessionBtn.addEventListener('click', () => {
                console.log('🏁 Finishing study session...');
                this.finishStudySession();
                this.closeStudySessionModal();
            });
        }
        
        // Pause Session button
        if (pauseSessionBtn) {
            pauseSessionBtn.addEventListener('click', () => {
                console.log('⏸️ Pausing study session...');
                // TODO: Implement pause functionality
                alert('Funkcja pauzy - w przygotowaniu');
            });
        }
        
        // Submit analysis button (the main save button)
        const submitAnalysisBtn = document.getElementById('submit-analysis-btn');
        if (submitAnalysisBtn) {
            submitAnalysisBtn.addEventListener('click', () => {
                console.log('💾 Saving complete study session...');
                this.saveCompleteSession();
            });
        }
        
        // Cancel analysis button
        const cancelAnalysisBtn = document.getElementById('cancel-analysis-btn');
        if (cancelAnalysisBtn) {
            cancelAnalysisBtn.addEventListener('click', () => {
                console.log('❌ Canceling session save...');
                this.hideAnalysisModal();
            });
        }
        
        // Close modal when clicking outside
        if (studyModal) {
            studyModal.addEventListener('click', (e) => {
                if (e.target === studyModal) {
                    this.closeStudySessionModal();
                }
            });
        }
    }
    
    /**
     * Open the study session modal
     */
    openStudySessionModal() {
        const studyModal = document.getElementById('study-session-modal');
        if (studyModal) {
            studyModal.style.display = 'flex';
            console.log('✅ Study session modal opened');
            
            // Reset counters
            this.resetStudyCounters();
            
            // StudyTrackingManager is disabled - SimplifiedFormApp handles sessions
            console.log('📚 Session modal opened - using SimplifiedFormApp session management');
        }
    }
    
    /**
     * Close the study session modal
     */
    closeStudySessionModal() {
        const studyModal = document.getElementById('study-session-modal');
        if (studyModal) {
            studyModal.style.display = 'none';
            console.log('✅ Study session modal closed');
            
            // StudyTrackingManager is disabled - SimplifiedFormApp handles sessions
            console.log('📚 Session modal closed - SimplifiedFormApp handles session management');
        }
    }
    
    /**
     * Reset study session counters
     */
    resetStudyCounters() {
        const totalCounter = document.getElementById('total-tasks-counter');
        const correctCounter = document.getElementById('correct-tasks-counter');
        const incorrectCounter = document.getElementById('incorrect-tasks-counter');
        const currentTaskNumber = document.getElementById('current-task-number');
        const currentTaskTime = document.getElementById('current-task-time');
        const sessionTimer = document.getElementById('session-timer');
        
        if (totalCounter) totalCounter.textContent = '0';
        if (correctCounter) correctCounter.textContent = '0';
        if (incorrectCounter) incorrectCounter.textContent = '0';
        if (currentTaskNumber) currentTaskNumber.textContent = '1';
        if (currentTaskTime) currentTaskTime.textContent = '00:00';
        if (sessionTimer) sessionTimer.textContent = '00:00';
        
        console.log('🔄 Study counters reset');
    }
    
    /**
     * Start a study session for data tracking
     */
    startStudySession() {
        if (this.isSessionActive) {
            console.warn('Session already active');
            return;
        }
        
        // Show session configuration modal first
        this.showSessionConfigModal();
        
        return null; // Will be set after configuration
    }
    
    /**
     * Show session configuration modal to set session-wide settings
     */
    async showSessionConfigModal() {
        const modal = document.getElementById('session-config-modal');
        if (!modal) {
            // Create modal if it doesn't exist
            this.createSessionConfigModal();
        }
        
        // Populate dropdowns
        await this.populateSessionConfigDropdowns();
        
        // Show modal
        document.getElementById('session-config-modal').style.display = 'flex';
        console.log('🔧 Session configuration modal shown');
    }
    
    /**
     * Create session configuration modal
     */
    createSessionConfigModal() {
        const modalHTML = `
            <div class="modal-overlay" id="session-config-modal" style="display: none;">
                <div class="modal-content session-config-content">
                    <div class="modal-header">
                        <h3 class="modal-title">🎯 Konfiguracja Sesji Nauki</h3>
                        <p class="modal-subtitle">Ustaw parametry dla całej sesji nauki</p>
                    </div>
                    <div class="modal-body">
                        <form id="session-config-form">
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">Przedmiot <span class="required">*</span></label>
                                    <select name="session_subject" class="form-control" required>
                                        <option value="">Wybierz przedmiot...</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Miejsce nauki <span class="required">*</span></label>
                                    <select name="session_location" class="form-control" required>
                                        <option value="">Wybierz miejsce...</option>
                                        <option value="W szkole">🏫 W szkole</option>
                                        <option value="W domu">🏠 W domu</option>
                                        <option value="Na korepetycjach">👨‍🏫 Na korepetycjach</option>
                                        <option value="W bibliotece">📚 W bibliotece</option>
                                        <option value="Inne">📍 Inne miejsce</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Notatki sesji</label>
                                <textarea name="session_notes" class="form-control" rows="2" 
                                          placeholder="Opcjonalne notatki o sesji nauki..."></textarea>
                            </div>
                            <div class="form-actions">
                                <button type="button" id="start-session-btn" class="btn btn-primary">
                                    <span class="btn-icon">🚀</span> Rozpocznij Sesję
                                </button>
                                <button type="button" id="cancel-session-btn" class="btn btn-secondary">
                                    <span class="btn-icon">❌</span> Anuluj
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Setup event listeners
        document.getElementById('start-session-btn').addEventListener('click', () => this.confirmSessionStart());
        document.getElementById('cancel-session-btn').addEventListener('click', () => this.cancelSessionConfig());
    }
    
    /**
     * Populate dropdowns in session config modal
     */
    async populateSessionConfigDropdowns() {
        try {
            const subjectsResponse = await this.googleSheetsAPI.fetchSubjects();
            if (subjectsResponse.success) {
                const subjectSelect = document.querySelector('#session-config-modal select[name="session_subject"]');
                if (subjectSelect) {
                    const subjects = subjectsResponse.subjects || [];
                    subjectSelect.innerHTML = '<option value="">Wybierz przedmiot...</option>';
                    subjects.forEach(subject => {
                        const name = subject.subject_name || subject.name || subject;
                        subjectSelect.innerHTML += `<option value="${name}">${name}</option>`;
                    });
                }
            }
        } catch (error) {
            console.warn('Could not load subjects for session config:', error);
        }
    }
    
    /**
     * Confirm and start the session with configured settings
     */
    confirmSessionStart() {
        const form = document.getElementById('session-config-form');
        const formData = new FormData(form);
        
        const sessionSubject = formData.get('session_subject');
        const sessionLocation = formData.get('session_location');
        const sessionNotes = formData.get('session_notes');
        
        // Validate required fields
        if (!sessionSubject || !sessionLocation) {
            alert('⚠️ Uzupełnij wszystkie wymagane pola!');
            return;
        }
        
        // Create session with configuration
        this.currentSession = {
            sessionId: this.generateSessionId(),
            startTime: new Date().toISOString(),
            endTime: null,
            durationMinutes: 0,
            totalTasks: 0,
            correctTasks: 0,
            incorrectTasks: 0,
            accuracyPercentage: 0,
            notes: sessionNotes || '',
            // Session-wide settings
            subject: sessionSubject,
            location: sessionLocation
        };
        
        this.sessionTasks = [];
        this.isSessionActive = true;
        
        // Start session timer
        this.startSessionTimer();
        
        // Hide config modal
        document.getElementById('session-config-modal').style.display = 'none';
        
        console.log('🎯 Study session started with config:', {
            id: this.currentSession.sessionId,
            subject: sessionSubject,
            location: sessionLocation
        });
        
        return this.currentSession.sessionId;
    }
    
    /**
     * Cancel session configuration
     */
    cancelSessionConfig() {
        document.getElementById('session-config-modal').style.display = 'none';
        console.log('❌ Session configuration cancelled');
    }
    
    /**
     * Record a task during the session - stores basic info for analysis modal
     */
    recordStudyTask(isCorrect) {
        // StudyTrackingManager is disabled - no duplicate prevention needed
        
        if (!this.isSessionActive || !this.currentSession) {
            // If no session active, start one
            this.startStudySession();
        }
        
        const taskOrder = this.sessionTasks.length + 1;
        
        // Get current form data (if available) to pre-populate analysis forms
        const form = document.getElementById('google-sheets-form');
        const taskData = form ? this.getFormData(form) : {};
        
        // Store basic task info - uses session-wide settings
        const task = {
            task_id: this.generateTaskId(), // Generate unique task ID
            task_name: taskData.task_name || '', // Pre-fill from form if available
            description: taskData.description || '', // Pre-fill from form if available
            category: taskData.category || '', // Pre-fill from form if available
            subject: this.currentSession.subject, // From session config
            correctness: isCorrect, // Store as boolean, will be converted to Yes/No in GoogleSheetsAPI
            timestamp: new Date().toISOString(),
            session_id: this.currentSession.sessionId, // From session
            task_order: taskOrder, // Task sequence in session
            location: this.currentSession.location // From session config
        };
        
        console.log(`📝 Creating task ${taskOrder} with data:`, task);
        console.log(`  - Correctness stored as:`, task.correctness, '(type:', typeof task.correctness, ')');
        
        this.sessionTasks.push(task);
        
        console.log(`💾 Session tasks now contains:`, this.sessionTasks.length, 'tasks');
        console.log(`  - Latest task:`, this.sessionTasks[this.sessionTasks.length - 1]);
        
        // Update session counters
        this.currentSession.totalTasks++;
        if (isCorrect) {
            this.currentSession.correctTasks++;
        } else {
            this.currentSession.incorrectTasks++;
        }
        
        // Calculate accuracy
        this.currentSession.accuracyPercentage = this.currentSession.totalTasks > 0 ? 
            Math.round((this.currentSession.correctTasks / this.currentSession.totalTasks) * 100) : 0;
        
        // Update UI counters
        this.updateTaskCounters();
        
        console.log('📝 Task recorded for session:', `Task ${taskOrder} (${isCorrect ? 'Correct' : 'Incorrect'})`);
        
        return task;
    }
    
    /**
     * Update task counters in the UI
     */
    updateTaskCounters() {
        const totalCounter = document.getElementById('total-tasks-counter');
        const correctCounter = document.getElementById('correct-tasks-counter');
        const incorrectCounter = document.getElementById('incorrect-tasks-counter');
        const currentTaskNumber = document.getElementById('current-task-number');
        
        if (totalCounter) totalCounter.textContent = this.currentSession?.totalTasks || 0;
        if (correctCounter) correctCounter.textContent = this.currentSession?.correctTasks || 0;
        if (incorrectCounter) incorrectCounter.textContent = this.currentSession?.incorrectTasks || 0;
        if (currentTaskNumber) currentTaskNumber.textContent = (this.sessionTasks.length + 1) || 1;
    }
    
    /**
     * End session and show analysis modal
     */
    finishStudySession() {
        if (!this.isSessionActive || !this.currentSession) {
            console.warn('No active session to finish');
            return;
        }
        
        this.currentSession.endTime = new Date().toISOString();
        
        // Stop session timer
        this.stopSessionTimer();
        
        // Calculate duration
        const startTime = new Date(this.currentSession.startTime);
        const endTime = new Date(this.currentSession.endTime);
        this.currentSession.durationMinutes = Math.round((endTime - startTime) / (1000 * 60));
        
        console.log('🏁 Session finished:', this.currentSession.sessionId);
        
        // Populate analysis modal with forms for each task
        this.populateAnalysisModal();
        
        // Show analysis modal
        this.showAnalysisModal();
        
        return this.currentSession;
    }
    
    /**
     * Show analysis modal with session data
     */
    showAnalysisModal() {
        const modal = document.getElementById('study-analysis-modal');
        if (modal) {
            // Update session summary
            this.updateSessionSummary();
            
            modal.style.display = 'flex';
            console.log('📋 Analysis modal shown');
        }
    }
    
    /**
     * Populate analysis modal with forms for each task
     */
    async populateAnalysisModal() {
        const container = document.getElementById('analysis-form-container');
        if (!container) {
            console.error('Analysis form container not found');
            return;
        }
        
        // Clear existing content
        container.innerHTML = '';
        
        if (!this.sessionTasks || this.sessionTasks.length === 0) {
            container.innerHTML = `
                <div class="no-tasks-message">
                    <div class="no-tasks-icon">📝</div>
                    <h4>Brak zadań do analizy</h4>
                    <p>Nie zarejestrowano żadnych zadań w tej sesji.</p>
                </div>
            `;
            return;
        }
        
        console.log('📝 Populating analysis modal with', this.sessionTasks.length, 'tasks');
        
        // Load subjects and categories for dropdowns
        let subjects = [];
        let categories = [];
        
        try {
            const subjectsResponse = await this.googleSheetsAPI.fetchSubjects();
            if (subjectsResponse.success) {
                subjects = subjectsResponse.subjects || [];
            }
            
            // Fetch categories filtered by session subject
            const categoriesResponse = await this.googleSheetsAPI.fetchCategories(this.currentSession?.subject);
            if (categoriesResponse.success) {
                categories = categoriesResponse.categories || [];
            }
        } catch (error) {
            console.warn('Could not load subjects/categories for forms:', error);
        }
        
        // Create form for each task
        this.sessionTasks.forEach((task, index) => {
            const taskForm = this.createTaskForm(task, index, subjects, categories);
            container.appendChild(taskForm);
        });
        
        console.log('✅ Analysis modal populated with', this.sessionTasks.length, 'task forms');
    }
    
    /**
     * Create individual task form for analysis modal - adapted for original form structure
     */
    createTaskForm(task, index, subjects, categories) {
        const taskDiv = document.createElement('div');
        taskDiv.className = 'task-analysis-form';
        taskDiv.innerHTML = `
            <div class="task-header">
                <h4 class="task-title">
                    <span class="task-number">Zadanie ${index + 1}</span>
                    <span class="correctness-badge ${task.correctness === true ? 'correct' : 'incorrect'}">
                        ${task.correctness === true ? '✅ Poprawnie' : '❌ Błędnie'}
                    </span>
                </h4>
            </div>
            <div class="task-form-content">
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Nazwa zadania <span class="required">*</span></label>
                        <input type="text" name="task_name" class="form-control" 
                               placeholder="Opisz zadanie..." maxlength="100" required
                               value="${task.task_name || ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Przedmiot (z sesji)</label>
                        <input type="text" name="subject" class="form-control" 
                               value="${task.subject || ''}" readonly>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Kategorie (wybierz wszystkie pasujące) <span class="required">*</span></label>
                    <div class="category-selection-instructions">
                        <div class="instruction-icon">📝</div>
                        <div class="instruction-text">Dotknij kategorii aby je zaznaczyć. Możesz wybrać kilka kategorii.</div>
                    </div>
                    <div class="category-selection-grid" data-task-index="${index}">
                        ${this.generateCategorySelection(categories, task.category || '')}
                    </div>
                    <div class="selected-categories-summary" style="display: none;">
                        <div class="summary-title">Wybrane kategorie:</div>
                        <div class="selected-categories-list"></div>
                    </div>
                    <input type="hidden" name="categories" class="categories-input">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Miejsce (z sesji)</label>
                        <input type="text" name="location" class="form-control" 
                               value="${task.location || ''}" readonly>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Opis zadania</label>
                    <textarea name="description" class="form-control" 
                              placeholder="Opcjonalny opis zadania..." 
                              maxlength="1000" rows="3">${task.description || ''}</textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">ID Sesji</label>
                        <input type="text" name="session_id" class="form-control" 
                               value="${task.session_id || ''}" readonly>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Kolejność w sesji</label>
                        <input type="number" name="task_order" class="form-control" 
                               value="${task.task_order || index + 1}" readonly>
                    </div>
                </div>
            </div>
        `;
        
        // Store task reference for later retrieval
        taskDiv.dataset.taskIndex = index;
        
        // Setup category selection after creating the form
        setTimeout(() => {
            this.setupCategorySelection(taskDiv, index);
        }, 100);
        
        return taskDiv;
    }
    
    /**
     * Generate category selection HTML
     */
    generateCategorySelection(categories, selectedCategories = '') {
        if (!categories || categories.length === 0) {
            return `
                <div class="no-categories-message">
                    <div style="text-align: center; padding: 20px; color: #6b7280;">
                        <div style="font-size: 24px; margin-bottom: 8px;">📂</div>
                        <div>Brak kategorii dla tego przedmiotu</div>
                    </div>
                </div>
            `;
        }
        
        const selectedArray = selectedCategories.split(',').map(c => c.trim()).filter(c => c);
        
        return categories.map(category => {
            const name = category.category_name || category.name || category;
            const difficulty = category.difficulty || 'Średni';
            const isSelected = selectedArray.includes(name);
            const difficultyClass = this.getDifficultyClass(difficulty);
            
            return `
                <div class="category-selection-item ${isSelected ? 'selected' : ''}" 
                     data-category="${name}" data-difficulty="${difficulty}">
                    <div class="category-item-content">
                        <div class="category-item-name">${name}</div>
                        <div class="category-item-difficulty">
                            <span class="difficulty-badge ${difficultyClass}">
                                ${this.getDifficultyIcon(difficulty)} ${difficulty}
                            </span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    /**
     * Setup category selection interactions
     */
    setupCategorySelection(taskDiv, taskIndex) {
        const grid = taskDiv.querySelector('.category-selection-grid');
        const hiddenInput = taskDiv.querySelector('.categories-input');
        const summary = taskDiv.querySelector('.selected-categories-summary');
        const summaryList = taskDiv.querySelector('.selected-categories-list');
        
        if (!grid || !hiddenInput || !summary || !summaryList) return;
        
        // Add click handlers to category items
        const categoryItems = grid.querySelectorAll('.category-selection-item');
        categoryItems.forEach(item => {
            item.addEventListener('click', () => {
                const isSelected = item.classList.contains('selected');
                
                if (isSelected) {
                    item.classList.remove('selected');
                } else {
                    item.classList.add('selected');
                }
                
                // Update hidden input and summary
                this.updateCategorySelection(grid, hiddenInput, summary, summaryList);
            });
        });
        
        // Initialize with current selection
        this.updateCategorySelection(grid, hiddenInput, summary, summaryList);
    }
    
    /**
     * Update category selection hidden input and summary
     */
    updateCategorySelection(grid, hiddenInput, summary, summaryList) {
        const selectedItems = grid.querySelectorAll('.category-selection-item.selected');
        const selectedCategories = Array.from(selectedItems).map(item => item.getAttribute('data-category'));
        
        // Update hidden input
        hiddenInput.value = selectedCategories.join(', ');
        
        // Update summary
        if (selectedCategories.length > 0) {
            summary.style.display = 'block';
            summaryList.innerHTML = selectedCategories.map(category => `
                <span class="selected-category-tag">
                    ${category}
                    <button type="button" class="remove-category" onclick="this.closest('.task-analysis-form').querySelector('[data-category=\"${category}\"]').click()">
                        ×
                    </button>
                </span>
            `).join('');
        } else {
            summary.style.display = 'none';
        }
    }
    
    /**
     * Get CSS class for difficulty level
     */
    getDifficultyClass(difficulty) {
        if (!difficulty) return 'medium';
        const level = difficulty.toLowerCase();
        if (level.includes('łatwy') || level.includes('easy')) return 'easy';
        if (level.includes('trudny') || level.includes('hard')) return 'hard';
        return 'medium';
    }
    
    /**
     * Get icon for difficulty level
     */
    getDifficultyIcon(difficulty) {
        if (!difficulty) return '⚖️';
        const level = difficulty.toLowerCase();
        if (level.includes('łatwy') || level.includes('easy')) return '😊';
        if (level.includes('trudny') || level.includes('hard')) return '😰';
        return '⚖️';
    }
    
    /**
     * Update session summary in modal header
     */
    updateSessionSummary() {
        const totalEl = document.getElementById('summary-total');
        const correctEl = document.getElementById('summary-correct');
        const incorrectEl = document.getElementById('summary-incorrect');
        
        if (totalEl) totalEl.textContent = this.currentSession?.totalTasks || 0;
        if (correctEl) correctEl.textContent = this.currentSession?.correctTasks || 0;
        if (incorrectEl) incorrectEl.textContent = this.currentSession?.incorrectTasks || 0;
    }
    
    /**
     * Hide analysis modal
     */
    hideAnalysisModal() {
        const modal = document.getElementById('study-analysis-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    /**
     * Save complete session data to Google Sheets
     */
    async saveCompleteSession() {
        // StudyTrackingManager is disabled - no duplicate prevention needed
        
        if (!this.isSessionActive || !this.currentSession) {
            console.error('No active session to save');
            alert('⚠️ Brak aktywnej sesji do zapisania');
            return;
        }
        
        try {
            // Show loading state
            this.setLoadingState(true, 'Zbieranie danych z formularzy...');
            
            // Collect form data from analysis modal
            const tasksWithFormData = this.collectTaskFormData();
            
            // Validate that all required fields are filled
            const validationResult = this.validateTaskForms(tasksWithFormData);
            if (!validationResult.isValid) {
                this.setLoadingState(false);
                alert('⚠️ Uzupełnij wszystkie wymagane pola:\n' + validationResult.errors.join('\n'));
                return;
            }
            
            this.setLoadingState(true, 'Zapisywanie sesji...');
            
            // Prepare data for Google Sheets
            const sessionData = {
                sessionData: {
                    session_id: this.currentSession.sessionId,
                    start_time: this.currentSession.startTime,
                    end_time: this.currentSession.endTime,
                    duration_minutes: this.currentSession.durationMinutes,
                    total_tasks: this.currentSession.totalTasks,
                    correct_tasks: this.currentSession.correctTasks,
                    accuracy_percentage: this.currentSession.accuracyPercentage,
                    notes: this.currentSession.notes || 'Study session completed'
                },
                tasks: tasksWithFormData // Use tasks with completed form data
            };
            
            console.log('📤 Sending session data to Google Sheets:', sessionData);
            
            // Send to Google Sheets using GoogleSheetsAPI-v2 for consistency
            const response = await this.saveSessionUsingAPI(sessionData);
            
            if (response.success) {
                console.log('✅ Session saved successfully:', response);
                alert(`✅ Sesja zapisana pomyślnie!\nID sesji: ${response.sessionId}\nZadań: ${response.tasksCount}`);
                this.resetSession();
                this.hideAnalysisModal();
            } else {
                console.error('❌ Failed to save session:', response.error);
                alert('❌ Błąd podczas zapisywania sesji: ' + (response.error || 'Nieznany błąd'));
            }
            
        } catch (error) {
            console.error('❌ Error saving session:', error);
            alert('❌ Błąd podczas zapisywania sesji: ' + error.message);
        } finally {
            this.setLoadingState(false);
        }
    }
    
    /**
     * Collect form data from all task forms in analysis modal
     */
    collectTaskFormData() {
        const formContainer = document.getElementById('analysis-form-container');
        if (!formContainer) {
            console.error('Analysis form container not found');
            return [];
        }
        
        const taskForms = formContainer.querySelectorAll('.task-analysis-form');
        const tasksWithData = [];
        
        taskForms.forEach((form, index) => {
            const taskIndex = parseInt(form.dataset.taskIndex);
            const originalTask = this.sessionTasks[taskIndex];
            
            if (!originalTask) {
                console.warn(`Original task not found for index ${taskIndex}`);
                return;
            }
            
            // Extract form data
            const taskName = form.querySelector('input[name="task_name"]')?.value?.trim() || '';
            const subject = form.querySelector('input[name="subject"]')?.value?.trim() || ''; // Readonly from session
            
            // Handle multiple categories selection - using hidden input from category selection interface
            const categoryInput = form.querySelector('input[name="categories"], input.categories-input');
            const category = categoryInput?.value?.trim() || ''; // Categories already joined with comma in hidden input
            
            console.log(`📁 Category debug for task ${index + 1}:`);
            console.log('  - Category input found:', !!categoryInput);
            console.log('  - Category input value:', categoryInput?.value);
            console.log('  - Final category value:', category);
            
            const description = form.querySelector('textarea[name="description"]')?.value?.trim() || '';
            const location = form.querySelector('input[name="location"]')?.value?.trim() || ''; // Readonly from session
            const sessionId = form.querySelector('input[name="session_id"]')?.value?.trim() || '';
            const taskOrder = form.querySelector('input[name="task_order"]')?.value?.trim() || '';
            
            // Convert correctness to Yes/No format for Google Sheets
            console.log(`📊 Correctness debug for task ${index + 1}:`);
            console.log('  - Original task:', originalTask);
            console.log('  - Original correctness:', originalTask.correctness, '(type:', typeof originalTask.correctness, ')');
            
            const correctnessString = this.convertCorrectnessToString(originalTask.correctness);
            console.log('  - Converted correctness:', correctnessString);
            
            // Create complete task object with field names matching backend expectations
            const completeTask = {
                task_id: originalTask.task_id || this.generateTaskId(),
                task_name: taskName,
                description: description,
                categories: category, // Backend expects 'categories' (plural)
                correctly_completed: correctnessString, // Backend expects 'correctly_completed' 
                start_time: originalTask.timestamp || new Date().toISOString(),
                end_time: originalTask.timestamp || new Date().toISOString(),
                location: location,
                subject: subject,
                session_id: sessionId
            };
            
            console.log(`📦 Final task ${index + 1} data:`, completeTask);
            tasksWithData.push(completeTask);
        });
        
        console.log('📝 Collected form data for', tasksWithData.length, 'tasks');
        console.log('📦 All tasks data:', tasksWithData);
        return tasksWithData;
    }
    
    /**
     * Validate that all task forms have required fields filled
     */
    validateTaskForms(tasks) {
        const errors = [];
        
        tasks.forEach((task, index) => {
            const taskNum = index + 1;
            
            if (!task.task_name) {
                errors.push(`Zadanie ${taskNum}: Brak nazwy zadania`);
            }
            // Note: subject and location are set at session level, so always present
            // Note: description is now optional
            if (!task.categories || task.categories.trim() === '') {
                errors.push(`Zadanie ${taskNum}: Wybierz przynajmniej jedną kategorię`);
            }
        });
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
    
    /**
     * Save session data using GoogleSheetsAPI-v2 for consistent field mapping
     */
    async saveSessionUsingAPI(sessionData) {
        try {
            let tasksSaved = 0;
            let sessionSaved = false;
            
            console.log('💾 Starting to save session using GoogleSheetsAPI-v2...');
            
            // Save each task using GoogleSheetsAPI-v2's submitStudyTask method
            for (const task of sessionData.tasks) {
                console.log('💾 Saving task:', task);
                
                // Map fields to what submitStudyTask expects
                const taskDataForAPI = {
                    task_id: task.task_id,
                    task_name: task.task_name,
                    description: task.description,
                    categories: task.categories, // This will be mapped correctly
                    correctly_completed: task.correctly_completed, // This is already 'Yes'/'No'
                    start_time: task.start_time,
                    end_time: task.end_time,
                    location: task.location,
                    subject: task.subject,
                    session_id: task.session_id
                };
                
                try {
                    await this.googleSheetsAPI.submitStudyTask(taskDataForAPI);
                    tasksSaved++;
                    console.log(`✅ Task ${tasksSaved} saved successfully`);
                } catch (taskError) {
                    console.error(`❌ Error saving task ${tasksSaved + 1}:`, taskError);
                    throw new Error(`Failed to save task ${tasksSaved + 1}: ${taskError.message}`);
                }
            }
            
            // Save session summary
            try {
                await this.googleSheetsAPI.addStudySession(sessionData.sessionData);
                sessionSaved = true;
                console.log('✅ Session summary saved successfully');
            } catch (sessionError) {
                console.error('❌ Error saving session summary:', sessionError);
                // Don't fail the entire operation if session summary fails
                console.warn('Session summary save failed, but tasks were saved');
            }
            
            return {
                success: true,
                message: 'Session saved using GoogleSheetsAPI-v2',
                sessionId: sessionData.sessionData.session_id,
                tasksCount: tasksSaved,
                sessionSummaryStatus: sessionSaved ? 'saved' : 'failed'
            };
            
        } catch (error) {
            console.error('❌ Error in saveSessionUsingAPI:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Legacy save method (kept for fallback)
     */
    async saveToGoogleSheets(sessionData) {
        try {
            const formData = new FormData();
            formData.append('action', 'saveCompleteStudySession');
            formData.append('spreadsheetId', this.config.SPREADSHEET_ID);
            formData.append('data', JSON.stringify(sessionData));
            
            const response = await fetch(this.config.GAS_WEB_APP_URL, {
                method: 'POST',
                mode: 'no-cors',
                body: formData
            });
            
            // Note: no-cors mode means we can't read the response body
            // We assume success if no error is thrown
            return {
                success: true,
                message: 'Session saved successfully',
                sessionId: sessionData.sessionData.session_id,
                tasksCount: sessionData.tasks.length
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Reset session data
     */
    resetSession() {
        // Stop any running timers
        this.stopSessionTimer();
        
        this.currentSession = null;
        this.sessionTasks = [];
        this.isSessionActive = false;
        console.log('🔄 Session reset');
    }
    
    /**
     * Show success message
     */
    showSuccessMessage(response) {
        const message = `✅ Sesja zapisana pomyślnie!\n` +
                       `ID sesji: ${response.sessionId}\n` +
                       `Zadań: ${response.tasksCount}`;
        alert(message);
    }
    
    /**
     * Convert correctness value to standardized Yes/No string for Google Sheets
     * @param {*} correctness - Correctness value (boolean, string, etc.)
     * @returns {string} "Yes" or "No"
     */
    convertCorrectnessToString(correctness) {
        // Handle boolean values
        if (typeof correctness === 'boolean') {
            return correctness ? 'Yes' : 'No';
        }
        
        // Handle string values
        if (typeof correctness === 'string') {
            const corrValue = correctness.toLowerCase();
            if (corrValue === 'yes' || corrValue === 'true' || corrValue === 'poprawnie' || corrValue === 'dobrze') {
                return 'Yes';
            }
            if (corrValue === 'no' || corrValue === 'false' || corrValue === 'błędnie' || corrValue === 'źle') {
                return 'No';
            }
            // If already "Yes" or "No", return as is
            if (corrValue === 'yes') return 'Yes';
            if (corrValue === 'no') return 'No';
        }
        
        // Default to 'No' for any unrecognized values
        console.warn('Unknown correctness value:', correctness, 'defaulting to "No"');
        return 'No';
    }
    
    /**
     * Start session timer
     */
    startSessionTimer() {
        // Clear any existing timer
        if (this.sessionTimerInterval) {
            clearInterval(this.sessionTimerInterval);
        }
        
        this.sessionTimerInterval = setInterval(() => {
            this.updateSessionTimer();
        }, 1000); // Update every second
        
        console.log('⏱️ Session timer started');
    }
    
    /**
     * Stop session timer
     */
    stopSessionTimer() {
        if (this.sessionTimerInterval) {
            clearInterval(this.sessionTimerInterval);
            this.sessionTimerInterval = null;
            console.log('⏱️ Session timer stopped');
        }
    }
    
    /**
     * Update session timer display
     */
    updateSessionTimer() {
        if (!this.isSessionActive || !this.currentSession) {
            return;
        }
        
        const now = new Date();
        const startTime = new Date(this.currentSession.startTime);
        const elapsed = Math.floor((now - startTime) / 1000); // Total seconds
        
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Update session timer display
        const sessionTimerEl = document.getElementById('session-timer');
        if (sessionTimerEl) {
            sessionTimerEl.textContent = timeString;
        }
        
        // Also update task timer (time since last task)
        // For now, we'll just show session time, but this could be enhanced
        const currentTaskTimeEl = document.getElementById('current-task-time');
        if (currentTaskTimeEl) {
            // Simple implementation: show time since session start
            // In a more advanced version, this could track individual task time
            currentTaskTimeEl.textContent = timeString;
        }
    }
    
    /**
     * Generate unique session ID
     */
    generateSessionId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        return `session_${timestamp}_${random}`;
    }
    
    /**
     * Generate unique task ID
     */
    generateTaskId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        return `task_${timestamp}_${random}`;
    }
    
    /**
     * Set loading state with custom message
     */
    setLoadingState(loading, message = 'Przetwarzanie...') {
        const submitButton = document.getElementById('submit-analysis-btn');
        const loadingOverlay = document.getElementById('loading-overlay');
        const loadingText = document.getElementById('loading-text');

        if (submitButton) {
            submitButton.disabled = loading;
            submitButton.innerHTML = loading ? 
                '<span class="btn-icon">⏳</span> Zapisywanie...' : 
                '<span class="btn-icon">💾</span> Zapisz Wszystkie Dane';
        }

        if (loadingOverlay) {
            loadingOverlay.style.display = loading ? 'flex' : 'none';
        }
        
        if (loadingText && loading) {
            loadingText.textContent = message;
        }
    }
    
    /**
     * Update study dashboard with current statistics
     */
    updateStudyDashboard() {
        // Update today's statistics
        this.updateTodayStats();
        
        // Update recent sessions list
        this.updateRecentSessions();
        
        console.log('📊 Study dashboard updated');
    }

    /**
     * Update today's statistics
     */
    async updateTodayStats() {
        try {
            const todaySessionsEl = document.getElementById('today-sessions');
            const todayTasksEl = document.getElementById('today-tasks');
            const todayAccuracyEl = document.getElementById('today-accuracy');

            // For now, show placeholder values
            // In a real implementation, you would fetch data from Google Sheets
            if (todaySessionsEl) todaySessionsEl.textContent = '0';
            if (todayTasksEl) todayTasksEl.textContent = '0';
            if (todayAccuracyEl) todayAccuracyEl.textContent = '0%';

            // TODO: Implement actual data fetching from Google Sheets
            // const todayStats = await this.googleSheetsAPI.getTodayStudyStats();
            
        } catch (error) {
            console.error('Error updating today stats:', error);
        }
    }

    /**
     * Update recent sessions list
     */
    async updateRecentSessions() {
        try {
            const recentSessionsList = document.getElementById('recent-sessions-list');
            if (!recentSessionsList) return;

            // For now, show placeholder
            // TODO: Implement actual recent sessions fetching
            recentSessionsList.innerHTML = `
                <div class="no-sessions-placeholder">
                    <div class="placeholder-icon">📈</div>
                    <p>Brak ostatnich sesji nauki</p>
                    <p class="placeholder-description">Rozpocznij pierwszą sesję, aby zobaczyć historię</p>
                </div>
            `;
            
        } catch (error) {
            console.error('Error updating recent sessions:', error);
        }
    }


    /**
     * Handle form submission
     */
    async handleFormSubmit(form) {
        const formData = this.getFormData(form);
        
        // Validate
        const validation = this.validateFormData(formData);
        if (!validation.isValid) {
            this.showMessage(validation.errors.join(', '), 'error');
            return;
        }

        // Show form submission loading
        const loadingId = showFormSubmission();
        
        try {
            this.setLoading(true);
            
            // Update loading progress
            updateLoadingStep(loadingId, 2, 'completed');
            updateLoadingStep(loadingId, 3, 'active');
            updateLoadingText(loadingId, 'Zapisywanie w Google Sheets...');
            
            // Prepare data for Google Apps Script backend using StudyTasks structure
            // Backend expects StudyTasks format: task_id, task_name, description, categories, correctly_completed, start_time, end_time, location, subject, session_id
            const taskData = {
                task_name: formData.task_name,
                description: formData.description,
                categories: formData.categories,
                correctly_completed: formData.correctly_completed,
                location: formData.location || '',
                subject: formData.subject,
                start_time: new Date().toISOString(),
                end_time: new Date().toISOString(),
                session_id: '' // Individual tasks don't belong to sessions
            };
            
            console.log('Submitting StudyTask data:', taskData);
            const result = await this.googleSheetsAPI.addStudyTask(taskData);
            
            if (result.success) {
                // Mark final step as completed
                updateLoadingStep(loadingId, 3, 'completed');
                updateLoadingText(loadingId, 'Dane zapisane pomyślnie!');
                
                // Hide loading after short delay
                setTimeout(() => {
                    hideLoading(loadingId);
                    this.showMessage('Dane zostały pomyślnie zapisane do Google Sheets', 'success');
                }, 1000);
                
                form.reset();
                this.clearValidation(form);
            }
        } catch (error) {
            console.error('Submission error:', error);
            
            // Update loading to show error
            updateLoadingText(loadingId, 'Błąd podczas zapisywania', 'Spróbuj ponownie');
            
            setTimeout(() => {
                hideLoading(loadingId);
                this.showMessage('Wystąpił błąd podczas zapisywania danych: ' + error.message, 'error');
            }, 1500);
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Get form data as object
     */
    getFormData(form) {
        const formData = new FormData(form);
        const data = {};
        
        for (const [key, value] of formData.entries()) {
            data[key] = value.trim();
        }
        
        return data;
    }

    /**
     * Validate form data
     */
    validateFormData(data) {
        const errors = [];
        const fields = this.config.FORM_FIELDS;

        for (const [fieldName, fieldConfig] of Object.entries(fields)) {
            const value = data[fieldName];
            
            if (fieldConfig.required && (!value || value === '')) {
                errors.push(`${fieldConfig.label} jest wymagane`);
            }
            
            if (value && fieldConfig.maxLength && value.length > fieldConfig.maxLength) {
                errors.push(`${fieldConfig.label} nie może przekraczać ${fieldConfig.maxLength} znaków`);
            }
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Validate individual field
     */
    validateField(field) {
        const fieldConfig = this.config.FORM_FIELDS[field.name];
        if (!fieldConfig) return;

        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        if (fieldConfig.required && !value) {
            isValid = false;
            errorMessage = `${fieldConfig.label} jest wymagane`;
        }

        if (value && fieldConfig.maxLength && value.length > fieldConfig.maxLength) {
            isValid = false;
            errorMessage = `${fieldConfig.label} nie może przekraczać ${fieldConfig.maxLength} znaków`;
        }

        this.updateFieldAppearance(field, isValid, errorMessage);
    }

    /**
     * Update field appearance
     */
    updateFieldAppearance(field, isValid, errorMessage) {
        const errorElement = field.parentElement.querySelector('.field-error');

        if (isValid) {
            field.classList.remove('error');
            field.classList.add('valid');
            if (errorElement) {
                errorElement.textContent = '';
                errorElement.style.display = 'none';
            }
        } else {
            field.classList.remove('valid');
            field.classList.add('error');
            if (errorElement) {
                errorElement.textContent = errorMessage;
                errorElement.style.display = 'block';
            }
        }
    }

    /**
     * Clear validation styles from form
     */
    clearValidation(form) {
        form.querySelectorAll('.form-control').forEach(field => {
            field.classList.remove('valid', 'error');
        });
        form.querySelectorAll('.field-error').forEach(error => {
            error.textContent = '';
            error.style.display = 'none';
        });
    }

    /**
     * Load form data (subjects and categories)
     */
    async loadFormData() {
        // Show loading screen with steps
        const loadingId = showDataLoading([
            { text: 'Łączenie z Google Sheets...', status: 'active' },
            { text: 'Pobieranie przedmiotów...', status: '' },
            { text: 'Pobieranie kategorii...', status: '' },
            { text: 'Inicjalizacja formularza...', status: '' }
        ]);
        
        try {
            console.log('%c🚀 INITIALIZING DATA FROM GOOGLE SHEETS', 'color: #1f2937; font-weight: bold; font-size: 16px; background: #f3f4f6; padding: 8px; border-radius: 4px;');
            console.log('─'.repeat(70));
            
            // Update loading step
            updateLoadingStep(loadingId, 0, 'completed');
            updateLoadingStep(loadingId, 1, 'active');
            updateLoadingText(loadingId, 'Pobieranie przedmiotów z Google Sheets');
            
            // Load subjects
            const subjectsResponse = await this.googleSheetsAPI.fetchSubjects();
            if (subjectsResponse.success) {
                console.log('%c🎩 POPULATING SUBJECT DROPDOWN...', 'color: #3b82f6; font-weight: bold;');
                this.populateSelect('subject', subjectsResponse.subjects || []);
                if (!subjectsResponse.subjects || subjectsResponse.subjects.length === 0) {
                    console.log('%c⚠️ No subjects found in Google Sheets', 'color: #f59e0b; font-weight: 600;');
                } else {
                    console.log(`%c✅ Successfully populated subject dropdown with ${subjectsResponse.subjects.length} options`, 'color: #10b981; font-weight: 600;');
                }
            } else {
                console.error('%c❌ FAILED TO LOAD SUBJECTS:', 'color: #ef4444; font-weight: bold;', subjectsResponse.error);
                this.populateSelect('subject', []); // Empty - no data
            }

            // Categories are now a text input field (no longer a dropdown)
            // Skip category dropdown population since we changed to text input
            updateLoadingStep(loadingId, 1, 'completed');
            updateLoadingStep(loadingId, 2, 'active');
            updateLoadingText(loadingId, 'Konfigurowanie pól formularza...');
            
            console.log('%c📝 Categories field now uses text input instead of dropdown', 'color: #8b5cf6; font-weight: bold;');
            console.log('%c💡 Users can enter comma-separated categories like "Algebra, Equations"', 'color: #6366f1; font-weight: 600;');
            
            // Update final loading steps
            updateLoadingStep(loadingId, 2, 'completed');
            updateLoadingStep(loadingId, 3, 'active');
            updateLoadingText(loadingId, 'Finalizowanie inicjalizacji...');
            
            // Small delay to show completion
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Final completion summary
            console.log('');
            console.log('%c🎯 DATA LOADING COMPLETION SUMMARY', 'color: #ffffff; font-weight: bold; font-size: 14px; background: linear-gradient(90deg, #6366f1, #4f46e5); padding: 10px; border-radius: 6px;');
            
            const subjectsCount = (subjectsResponse.success && subjectsResponse.subjects) ? subjectsResponse.subjects.length : 0;
            
            console.log('%c📊 Subjects loaded: %c' + subjectsCount, 'color: #374151; font-weight: 600;', subjectsCount > 0 ? 'color: #10b981; font-weight: bold;' : 'color: #ef4444; font-weight: bold;');
            console.log('%c📝 Categories field: %cText input (comma-separated)', 'color: #374151; font-weight: 600;', 'color: #8b5cf6; font-weight: bold;');
            
            console.log('%c🎉 Total dropdown options: %c' + subjectsCount, 'color: #374151; font-weight: 600;', 'color: #7c3aed; font-weight: bold;');
            
            if (subjectsCount > 0) {
                console.log('%c✅ FORM FULLY INITIALIZED - Ready for data entry!', 'color: #10b981; font-weight: bold;');
            } else {
                console.log('%c⚠️ FORM INITIALIZED WITH LIMITED DATA - Check Google Sheets connection', 'color: #f59e0b; font-weight: bold;');
            }
            
            console.log('═'.repeat(70));
            
            // Final loading step completion
            updateLoadingStep(loadingId, 3, 'completed');
            updateLoadingText(loadingId, 'Formularz gotowy do użycia!');
            
            // Hide loading after short delay
            setTimeout(() => {
                hideLoading(loadingId);
            }, 800);
            
        } catch (error) {
            console.error('Error loading form data:', error);
            console.log('%c❌ DATA LOADING FAILED', 'color: #ef4444; font-weight: bold; font-size: 14px; background: #fef2f2; padding: 8px; border-radius: 4px;');
            
            // Update loading to show error
            updateLoadingText(loadingId, 'Błąd ładowania danych', 'Spróbuj odświeżyć stronę');
            
            // Hide loading after showing error
            setTimeout(() => {
                hideLoading(loadingId);
                this.showMessage('Błąd ładowania danych z Google Sheets: ' + error.message, 'error');
            }, 2000);
        }
    }

    /**
     * Populate select element with options - ONLY imported data
     * With improved safety checks for all data types
     */
    populateSelect(fieldName, items) {
        try {
            console.log(`Starting populateSelect for ${fieldName} with:`, items);
            
            const select = document.getElementById(fieldName);
            if (!select) {
                console.error(`❌ SELECT ELEMENT NOT FOUND: ${fieldName}`);
                console.log('Available elements:', document.querySelectorAll('select'));
                return;
            }
            console.log(`✅ Found select element: ${fieldName}`, select);
    
            // Clear all options
            select.innerHTML = '';
            
            // Add default empty option
            const emptyOption = document.createElement('option');
            emptyOption.value = '';
            emptyOption.textContent = items && Array.isArray(items) && items.length > 0 ? 
                `Wybierz ${fieldName === 'subject' ? 'przedmiot' : 'kategorię'}...` : 
                'Brak danych';
            select.appendChild(emptyOption);
    
            // Only add options if we have data from import
            if (!items || !Array.isArray(items) || items.length === 0) {
                console.log(`No imported data for ${fieldName}`);
                return;
            }
    
            console.log(`%c📏 POPULATING ${fieldName.toUpperCase()} DROPDOWN:`, 'color: #374151; font-weight: bold;');
            console.log('%cData from Google Sheets:', 'color: #6b7280;', items);
    
            // Add options from imported data only - with thorough type checking
            items.forEach((item, index) => {
                try {
                    console.log(`Processing item ${index}:`, item);
                    
                    if (item === null || item === undefined) {
                        console.warn(`Skipping null/undefined item at index ${index}`);
                        return;
                    }
                    
                    const option = document.createElement('option');
                    
                    if (typeof item === 'object') {
                        // Handle Google Sheets data structure (object)
                        let name = '';
                        
                        // For categories, prioritize category_name, for subjects prioritize subject_name
                        if (fieldName === 'category') {
                            if (item.category_name) name = String(item.category_name);
                            else if (item.name) name = String(item.name);
                            else name = 'Category ' + index;
                        } else if (fieldName === 'subject') {
                            if (item.subject_name) name = String(item.subject_name);
                            else if (item.name) name = String(item.name);
                            else name = 'Subject ' + index;
                        } else {
                            // Generic fallback for other field types
                            if (item.name) name = String(item.name);
                            else if (item.category_name) name = String(item.category_name);
                            else if (item.subject_name) name = String(item.subject_name);
                            else name = 'Item ' + index;
                        }
                        
                        option.value = name;
                        option.textContent = name;
                        select.appendChild(option);
                        console.log(`%c  ✅ Added object option: ${name}`, 'color: #10b981; font-weight: 500;');
                    } else {
                        // Handle any other data type by converting to string
                        const value = String(item);
                        option.value = value;
                        option.textContent = value;
                        select.appendChild(option);
                        console.log(`%c  ✅ Added string option: ${value}`, 'color: #10b981; font-weight: 500;');
                    }
                } catch (itemError) {
                    console.error(`Error processing item ${index}:`, itemError);
                }
            });
            
            // Show final state
            console.log(`%c🎯 FINAL ${fieldName.toUpperCase()} DROPDOWN STATE:`, 'color: #059669; font-weight: bold;');
            console.log(`%c  Total options: ${select.options.length}`, 'color: #059669; font-weight: 600;');
            Array.from(select.options).forEach((opt, index) => {
                if (opt.value) {
                    console.log(`%c    ${index}. "${opt.textContent}"`, 'color: #374151;');
                } else {
                    console.log(`%c    ${index}. [Empty option: "${opt.textContent}"]`, 'color: #6b7280;');
                }
            });
            console.log('─'.repeat(50));
            
            // Force refresh of the select element
            select.style.display = 'none';
            setTimeout(() => {
                select.style.display = '';
                console.log(`✅ Refreshed display for ${fieldName}`);
            }, 10);
            
            // Dispatch change event to notify any listeners
            select.dispatchEvent(new Event('change', { bubbles: true }));
            
        } catch (error) {
            console.error(`Error in populateSelect for ${fieldName}:`, error);
            
            // Try to add at least empty option on error
            const select = document.getElementById(fieldName);
            if (select) {
                select.innerHTML = '<option value="">Błąd ładowania</option>';
            }
        }
    }

    /**
     * Show specific view (form, study, or analytics)
     */
    showView(viewName) {
        console.log(`🔄 Switching to view: ${viewName}`);
        this.currentView = viewName;

        // Get all containers
        const formContainer = document.getElementById('main-form-container');
        const studyContainer = document.getElementById('study-container');
        const analyticsContainer = document.getElementById('analytics-container');

        console.log('📋 Container elements found:', {
            formContainer: !!formContainer,
            studyContainer: !!studyContainer,
            analyticsContainer: !!analyticsContainer
        });

        // Hide all containers first
        if (formContainer) formContainer.style.display = 'none';
        if (studyContainer) studyContainer.style.display = 'none';
        if (analyticsContainer) analyticsContainer.style.display = 'none';

        // Show the selected container
        switch (viewName) {
            case 'form':
                if (formContainer) {
                    formContainer.style.display = 'block';
                    console.log('✅ Form container shown');
                }
                break;
                
            case 'study':
                if (studyContainer) {
                    studyContainer.style.display = 'block';
                    console.log('✅ Study container shown');
                    this.updateStudyDashboard();
                } else {
                    console.error('❌ Study container not found!');
                }
                break;
                
            case 'analytics':
                if (analyticsContainer) {
                    analyticsContainer.style.display = 'block';
                    console.log('✅ Analytics container shown');
                    if (this.analyticsManager) {
                        this.analyticsManager.loadAnalyticsData();
                    }
                }
                break;
                
            default:
                console.warn(`Unknown view: ${viewName}`);
        }
    }

    /**
     * Show message to user
     */
    showMessage(message, type = 'info') {
        const messageContainer = document.getElementById('message-container');
        if (!messageContainer) return;

        const className = type === 'success' ? 'message success' : 
                         type === 'error' ? 'message error' : 'message info';

        messageContainer.innerHTML = `<div class="${className}">${message}</div>`;
        messageContainer.style.display = 'block';

        // Auto-hide after 5 seconds
        setTimeout(() => {
            messageContainer.style.display = 'none';
        }, 5000);
    }

    /**
     * Set loading state
     */
    setLoading(loading) {
        const submitButton = document.getElementById('submit-button');
        const loadingOverlay = document.getElementById('loading-overlay');

        if (submitButton) {
            submitButton.disabled = loading;
            submitButton.textContent = loading ? 'Przetwarzanie...' : 'Wyślij';
        }

        if (loadingOverlay) {
            loadingOverlay.style.display = loading ? 'flex' : 'none';
        }
    }
}

// Export for global use
window.SimplifiedFormApp = SimplifiedFormApp;

// Auto-initialize if CONFIG is available
if (typeof CONFIG !== 'undefined') {
    window.formApp = new SimplifiedFormApp(CONFIG);
}
