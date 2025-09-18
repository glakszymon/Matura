/**
 * Study Tracking Manager
 * Handles study session tracking, task counters, dopamine feedback, and data collection
 */
class StudyTrackingManager {
    constructor(config, googleSheetsAPI) {
        this.config = config;
        this.googleSheetsAPI = googleSheetsAPI;
        
        // Session state
        this.isSessionActive = false;
        this.isPaused = false;
        this.sessionStartTime = null;
        this.currentTaskStartTime = null;
        
        // Task tracking
        this.tasks = [];
        this.currentTaskNumber = 0;
        this.counters = {
            total: 0,
            correct: 0,
            incorrect: 0
        };
        
        // Timer intervals
        this.sessionTimerInterval = null;
        this.taskTimerInterval = null;
        
        // DOM elements
        this.elements = {};
        
        this.init();
    }

    /**
     * Initialize the study tracking manager
     */
    init() {
        this.cacheElements();
        this.setupEventListeners();
        this.setupDashboardIntegration();
        console.log('🎯 StudyTrackingManager initialized');
    }

    /**
     * Cache DOM elements
     */
    cacheElements() {
        // Main elements
        this.elements.startStudyBtn = document.getElementById('start-study-button');
        this.elements.studyModal = document.getElementById('study-session-modal');
        this.elements.analysisModal = document.getElementById('study-analysis-modal');
        
        // Session modal elements
        this.elements.sessionTimer = document.getElementById('session-timer');
        this.elements.currentTaskTime = document.getElementById('current-task-time');
        this.elements.currentTaskNumber = document.getElementById('current-task-number');
        
        // Counter elements
        this.elements.totalCounter = document.getElementById('total-tasks-counter');
        this.elements.correctCounter = document.getElementById('correct-tasks-counter');
        this.elements.incorrectCounter = document.getElementById('incorrect-tasks-counter');
        
        // Button elements
        this.elements.correctTaskBtn = document.getElementById('correct-task-btn');
        this.elements.incorrectTaskBtn = document.getElementById('incorrect-task-btn');
        this.elements.finishSessionBtn = document.getElementById('finish-session-btn');
        this.elements.pauseSessionBtn = document.getElementById('pause-session-btn');
        
        // Analysis modal elements
        this.elements.analysisContainer = document.getElementById('analysis-form-container');
        this.elements.submitAnalysisBtn = document.getElementById('submit-analysis-btn');
        this.elements.cancelAnalysisBtn = document.getElementById('cancel-analysis-btn');
        this.elements.sessionSummary = document.getElementById('session-summary');
        this.elements.summaryTotal = document.getElementById('summary-total');
        this.elements.summaryCorrect = document.getElementById('summary-correct');
        this.elements.summaryIncorrect = document.getElementById('summary-incorrect');
        
        // Celebration elements
        this.elements.celebrationOverlay = document.getElementById('celebration-overlay');
        this.elements.celebrationIcon = document.getElementById('celebration-icon');
        this.elements.celebrationText = document.getElementById('celebration-text');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Start study button
        if (this.elements.startStudyBtn) {
            this.elements.startStudyBtn.addEventListener('click', () => this.startStudySession());
        }

        // Task action buttons
        if (this.elements.correctTaskBtn) {
            this.elements.correctTaskBtn.addEventListener('click', () => this.completeTask(true));
        }
        if (this.elements.incorrectTaskBtn) {
            this.elements.incorrectTaskBtn.addEventListener('click', () => this.completeTask(false));
        }

        // Session control buttons
        if (this.elements.finishSessionBtn) {
            this.elements.finishSessionBtn.addEventListener('click', () => this.finishSession());
        }
        if (this.elements.pauseSessionBtn) {
            this.elements.pauseSessionBtn.addEventListener('click', () => this.togglePause());
        }

        // Analysis modal buttons
        if (this.elements.submitAnalysisBtn) {
            this.elements.submitAnalysisBtn.addEventListener('click', () => this.submitAnalysis());
        }
        if (this.elements.cancelAnalysisBtn) {
            this.elements.cancelAnalysisBtn.addEventListener('click', () => this.cancelAnalysis());
        }

        // Modal close on outside click
        if (this.elements.studyModal) {
            this.elements.studyModal.addEventListener('click', (e) => {
                if (e.target === this.elements.studyModal) {
                    // Prevent closing during active session
                    if (!this.isSessionActive) {
                        this.hideStudyModal();
                    }
                }
            });
        }
    }

    /**
     * Start a new study session
     */
    startStudySession() {
        console.log('🎯 Starting new study session');
        
        // Set global coordination flag to prevent duplicates
        if (window.systemCoordination) {
            window.systemCoordination.studySessionActive = true;
            console.log('🎆 Study session active - duplicate prevention enabled');
        }
        
        // Generate a session ID for this session
        this.currentSessionId = this.generateSessionId();
        
        // Reset session state
        this.isSessionActive = true;
        this.isPaused = false;
        this.sessionStartTime = new Date();
        this.currentTaskStartTime = new Date();
        
        // Reset counters and tasks
        this.tasks = [];
        this.currentTaskNumber = 1;
        this.counters = { total: 0, correct: 0, incorrect: 0 };
        
        // Update UI
        this.updateCounters();
        this.updateTaskInfo();
        this.showStudyModal();
        
        // Start timers
        this.startTimers();
        
        // Show start celebration
        this.showCelebration('🎯', 'Rozpoczynamy naukę!');
    }

    /**
     * Complete current task
     * @param {boolean} isCorrect - Whether the task was completed correctly
     */
    completeTask(isCorrect) {
        if (!this.isSessionActive || this.isPaused) return;

        const now = new Date();
        const taskId = this.generateTaskId();
        
        // Create task object
        const task = {
            id: taskId,
            number: this.currentTaskNumber,
            startTime: this.currentTaskStartTime,
            endTime: now,
            isCorrect: isCorrect,
            duration: now - this.currentTaskStartTime
        };
        
        console.log('Creating task with data:', {
            id: taskId,
            number: this.currentTaskNumber,
            isCorrect: isCorrect,
            duration: task.duration
        });
        
        // Add to tasks array
        this.tasks.push(task);
        
        console.log('Tasks array now contains:', this.tasks.length, 'tasks');
        console.log('Latest task:', this.tasks[this.tasks.length - 1]);
        
        // Update counters
        this.counters.total++;
        if (isCorrect) {
            this.counters.correct++;
        } else {
            this.counters.incorrect++;
        }
        
        // Update UI
        this.updateCounters();
        this.animateCounter(isCorrect ? 'correct' : 'incorrect');
        
        // Show dopamine feedback
        this.showTaskCompletionFeedback(isCorrect);
        
        // Prepare for next task
        this.currentTaskNumber++;
        this.currentTaskStartTime = new Date();
        this.updateTaskInfo();
        
        console.log(`✅ Task ${task.number} completed:`, { 
            correct: isCorrect, 
            duration: task.duration + 'ms' 
        });
    }

    /**
     * Show task completion feedback with dopamine triggering effects
     */
    showTaskCompletionFeedback(isCorrect) {
        // Button pulse animation
        const button = isCorrect ? this.elements.correctTaskBtn : this.elements.incorrectTaskBtn;
        if (button) {
            button.classList.add('task-completed-success');
            setTimeout(() => {
                button.classList.remove('task-completed-success');
            }, 600);
        }

        // Celebration overlay
        const icon = isCorrect ? '🎉' : '💪';
        const messages = isCorrect 
            ? ['Świetnie!', 'Dobra robota!', 'Tak trzymaj!', 'Doskonale!', 'Brawa!'] 
            : ['Nie poddawaj się!', 'Następnym razem!', 'Dalej walcz!', 'Możesz to!', 'Próbuj dalej!'];
        
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        this.showCelebration(icon, randomMessage);

        // Confetti effect for correct answers
        if (isCorrect) {
            this.createConfettiEffect();
        }

        // Play achievement sound (if browser supports it)
        this.playFeedbackSound(isCorrect);
    }

    /**
     * Create confetti effect
     */
    createConfettiEffect() {
        const confettiCount = 15;
        const colors = ['#667eea', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
        
        for (let i = 0; i < confettiCount; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.classList.add('confetti');
                confetti.style.left = Math.random() * 100 + 'vw';
                confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.animationDelay = Math.random() * 3 + 's';
                
                document.body.appendChild(confetti);
                
                // Remove confetti after animation
                setTimeout(() => {
                    if (confetti.parentNode) {
                        confetti.parentNode.removeChild(confetti);
                    }
                }, 4000);
            }, i * 50);
        }
    }

    /**
     * Play feedback sound
     */
    playFeedbackSound(isCorrect) {
        // Create Web Audio API context if supported
        if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                // Different frequencies for correct/incorrect
                oscillator.frequency.value = isCorrect ? 800 : 400;
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.3);
            } catch (error) {
                // Fallback: no sound if audio context fails
                console.log('Audio feedback not available');
            }
        }
    }

    /**
     * Show celebration overlay
     */
    showCelebration(icon, text) {
        if (this.elements.celebrationOverlay && this.elements.celebrationIcon && this.elements.celebrationText) {
            this.elements.celebrationIcon.textContent = icon;
            this.elements.celebrationText.textContent = text;
            this.elements.celebrationOverlay.style.display = 'flex';
            
            setTimeout(() => {
                this.elements.celebrationOverlay.style.display = 'none';
            }, 1200);
        }
    }

    /**
     * Animate counter increment
     */
    animateCounter(type) {
        let counterElement;
        switch (type) {
            case 'correct':
                counterElement = document.querySelector('.counter-item.correct');
                break;
            case 'incorrect':
                counterElement = document.querySelector('.counter-item.incorrect');
                break;
            default:
                counterElement = document.querySelector('.counter-item');
        }
        
        if (counterElement) {
            counterElement.classList.add('counter-increment');
            setTimeout(() => {
                counterElement.classList.remove('counter-increment');
            }, 800);
        }
    }

    /**
     * Finish the current session
     */
    finishSession() {
        if (!this.isSessionActive) return;
        
        console.log('🏁 Finishing study session');
        console.log('🏁 Session state before finish:', {
            tasksCount: this.tasks.length,
            counters: this.counters,
            sessionActive: this.isSessionActive
        });
        
        // Stop session
        this.isSessionActive = false;
        this.stopTimers();
        
        // Hide study modal
        this.hideStudyModal();
        
        console.log('🏁 About to show analysis modal...');
        
        // Show analysis modal
        this.showAnalysisModal();
    }

    /**
     * Toggle pause state
     */
    togglePause() {
        if (!this.isSessionActive) return;
        
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            this.stopTimers();
            this.elements.pauseSessionBtn.innerHTML = '<span class="btn-icon">▶️</span>Wznów';
            this.showCelebration('⏸️', 'Sesja wstrzymana');
        } else {
            this.startTimers();
            this.elements.pauseSessionBtn.innerHTML = '<span class="btn-icon">⏸️</span>Pauza';
            this.showCelebration('▶️', 'Wznowiono sesję');
        }
    }

    /**
     * Start session and task timers
     */
    startTimers() {
        // Session timer
        this.sessionTimerInterval = setInterval(() => {
            if (this.sessionStartTime && this.elements.sessionTimer) {
                const elapsed = new Date() - this.sessionStartTime;
                this.elements.sessionTimer.textContent = this.formatTime(elapsed);
            }
        }, 1000);

        // Task timer
        this.taskTimerInterval = setInterval(() => {
            if (this.currentTaskStartTime && this.elements.currentTaskTime) {
                const elapsed = new Date() - this.currentTaskStartTime;
                this.elements.currentTaskTime.textContent = this.formatTime(elapsed);
            }
        }, 1000);
    }

    /**
     * Stop all timers
     */
    stopTimers() {
        if (this.sessionTimerInterval) {
            clearInterval(this.sessionTimerInterval);
            this.sessionTimerInterval = null;
        }
        if (this.taskTimerInterval) {
            clearInterval(this.taskTimerInterval);
            this.taskTimerInterval = null;
        }
    }

    /**
     * Update counter displays
     */
    updateCounters() {
        if (this.elements.totalCounter) {
            this.elements.totalCounter.textContent = this.counters.total;
        }
        if (this.elements.correctCounter) {
            this.elements.correctCounter.textContent = this.counters.correct;
        }
        if (this.elements.incorrectCounter) {
            this.elements.incorrectCounter.textContent = this.counters.incorrect;
        }
    }

    /**
     * Update task info display
     */
    updateTaskInfo() {
        if (this.elements.currentTaskNumber) {
            this.elements.currentTaskNumber.textContent = this.currentTaskNumber;
        }
        if (this.elements.currentTaskTime) {
            this.elements.currentTaskTime.textContent = '00:00';
        }
    }

    /**
     * Show study session modal
     */
    showStudyModal() {
        if (this.elements.studyModal) {
            this.elements.studyModal.style.display = 'flex';
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        }
    }

    /**
     * Hide study session modal
     */
    hideStudyModal() {
        if (this.elements.studyModal) {
            this.elements.studyModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    /**
     * Show analysis modal and generate forms
     */
    showAnalysisModal() {
        console.log('📝 showAnalysisModal called');
        console.log('📝 Analysis modal element found:', !!this.elements.analysisModal);
        console.log('📝 Tasks length:', this.tasks.length);
        console.log('📝 Current counters:', this.counters);
        
        if (!this.elements.analysisModal) {
            console.error('❌ Analysis modal element not found!');
            return;
        }
        
        if (this.tasks.length === 0) {
            console.warn('⚠️ No tasks to analyze! Showing modal anyway with empty state.');
            
            // Still show the modal but with a message about no tasks
            this.updateSessionSummary(); // This should show 0 counts
            this.elements.analysisModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            // Show empty state message
            if (this.elements.analysisContainer) {
                this.elements.analysisContainer.innerHTML = `
                    <div class="no-tasks-message" style="text-align: center; padding: 40px; color: #666;">
                        <div style="font-size: 48px; margin-bottom: 16px;">🤔</div>
                        <h3>Brak zadań do analizy</h3>
                        <p>Nie zarejestrowano żadnych zadań w tej sesji.</p>
                        <p style="font-size: 14px; color: #999;">Counters: Total: ${this.counters.total}, Correct: ${this.counters.correct}, Incorrect: ${this.counters.incorrect}</p>
                        <p style="font-size: 14px; color: #999;">Tasks array length: ${this.tasks.length}</p>
                    </div>
                `;
            }
            return;
        }
        
        console.log('✅ Showing analysis modal with', this.tasks.length, 'tasks');
        
        // Update summary
        this.updateSessionSummary();
        
        // Generate task analysis forms
        this.generateAnalysisForms();
        
        // Show modal
        this.elements.analysisModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    /**
     * Hide analysis modal
     */
    hideAnalysisModal() {
        if (this.elements.analysisModal) {
            this.elements.analysisModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    /**
     * Update session summary in analysis modal
     */
    updateSessionSummary() {
        console.log('📊 Updating session summary with counters:', this.counters);
        console.log('📊 Tasks array length:', this.tasks.length);
        console.log('📊 Summary elements found:', {
            summaryTotal: !!this.elements.summaryTotal,
            summaryCorrect: !!this.elements.summaryCorrect,
            summaryIncorrect: !!this.elements.summaryIncorrect
        });
        
        if (this.elements.summaryTotal) {
            this.elements.summaryTotal.textContent = this.counters.total;
            console.log('📊 Set summaryTotal to:', this.counters.total);
        } else {
            console.error('❌ summaryTotal element not found');
        }
        
        if (this.elements.summaryCorrect) {
            this.elements.summaryCorrect.textContent = this.counters.correct;
            console.log('📊 Set summaryCorrect to:', this.counters.correct);
        } else {
            console.error('❌ summaryCorrect element not found');
        }
        
        if (this.elements.summaryIncorrect) {
            this.elements.summaryIncorrect.textContent = this.counters.incorrect;
            console.log('📊 Set summaryIncorrect to:', this.counters.incorrect);
        } else {
            console.error('❌ summaryIncorrect element not found');
        }
    }

    /**
     * Generate analysis forms for each task
     */
    generateAnalysisForms() {
        if (!this.elements.analysisContainer) return;

        this.elements.analysisContainer.innerHTML = '';

        console.log('Generating analysis forms for', this.tasks.length, 'tasks');
        console.log('Tasks data:', this.tasks.map(t => ({ id: t.id, number: t.number, isCorrect: t.isCorrect })));

        this.tasks.forEach((task, index) => {
            console.log(`Creating form for task ${index}:`, { id: task.id, number: task.number, isCorrect: task.isCorrect });
            const formHtml = this.createTaskAnalysisForm(task, index);
            this.elements.analysisContainer.insertAdjacentHTML('beforeend', formHtml);
        });
        
        // Verify forms were created with proper data-task-id attributes
        setTimeout(() => {
            const createdForms = this.elements.analysisContainer.querySelectorAll('.task-analysis-form');
            console.log('Created forms count:', createdForms.length);
            createdForms.forEach((form, index) => {
                const taskId = form.dataset.taskId || form.getAttribute('data-task-id');
                console.log(`Form ${index} has data-task-id:`, taskId);
            });
            
            this.populateAnalysisDropdowns();
        }, 100);
    }

    /**
     * Create HTML for task analysis form
     */
    createTaskAnalysisForm(task, index) {
        const statusClass = task.isCorrect ? 'correct' : 'incorrect';
        const statusText = task.isCorrect ? 'Poprawne' : 'Błędne';
        const durationText = this.formatTime(task.duration);

        return `
            <div class="task-analysis-form" data-task-id="${task.id}">
                <div class="task-analysis-header">
                    <span class="task-number">Zadanie ${task.number}</span>
                    <span class="task-status ${statusClass}">${statusText}</span>
                </div>
                
                <div class="analysis-form-row">
                    <div class="form-group">
                        <label class="form-label">Nazwa zadania <span class="required">*</span></label>
                        <input type="text" name="task_name" class="form-control" required 
                               placeholder="np. Równania kwadratowe - zadanie 15">
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Kategorie (wybierz wszystkie pasujące)</label>
                    <div class="category-selection-instructions">
                        <div class="instruction-icon">📝</div>
                        <div class="instruction-text">Dotknij kategorii aby je zaznaczyć. Możesz wybrać kilka kategorii.</div>
                    </div>
                    <div class="category-selection-grid" data-task-index="${index}">
                        <!-- Categories will be populated dynamically -->
                    </div>
                    <div class="selected-categories-summary" style="display: none;">
                        <div class="summary-title">Wybrane kategorie:</div>
                        <div class="selected-categories-list"></div>
                    </div>
                    <input type="hidden" name="categories" class="categories-input">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Opis zadania</label>
                    <textarea name="description" class="form-control" rows="2" 
                              placeholder="Krótki opis zadania lub trudności..."></textarea>
                </div>
                
                <div class="analysis-form-row">
                    <div class="form-group">
                        <label class="form-label">Przedmiot</label>
                        <select name="subject" class="form-control">
                            <option value="">Wybierz przedmiot...</option>
                            <!-- Subjects will be populated dynamically -->
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Miejsce wykonania <span style="color: #6b7280; font-size: 0.875rem;">(z sesji)</span></label>
                        <input type="text" name="location" class="form-control" readonly 
                               style="background-color: #f3f4f6;" 
                               placeholder="Zostanie uzupełnione z sesji...">
                    </div>
                </div>
                
                <div class="analysis-form-row">
                    <div class="form-group">
                        <label class="form-label">Czas rozpoczęcia</label>
                        <input type="text" class="form-control" readonly 
                               value="${this.formatDateTime(task.startTime)}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Czas zakończenia</label>
                        <input type="text" class="form-control" readonly 
                               value="${this.formatDateTime(task.endTime)}">
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Czas trwania</label>
                    <input type="text" class="form-control" readonly value="${durationText}">
                </div>
                
                <!-- Hidden fields for system data -->
                <input type="hidden" name="correctly_completed" value="${task.isCorrect}">
                <input type="hidden" name="start_time" value="${task.startTime.toISOString()}">
                <input type="hidden" name="end_time" value="${task.endTime.toISOString()}">
            </div>
        `;
    }

    /**
     * Submit analysis data to Google Sheets
     */
    async submitAnalysis() {
        console.log('💾 Submitting study session analysis');
        
        // Prevent duplicate submissions
        if (this.isSubmitting) {
            console.warn('⚠️ Submission already in progress');
            return;
        }
        this.isSubmitting = true;

        try {
            // Collect all task data from forms
            const taskForms = this.elements.analysisContainer.querySelectorAll('.task-analysis-form');
            const tasksData = [];
            
            console.log(`🔍 Processing ${taskForms.length} task forms`);

            for (let i = 0; i < taskForms.length; i++) {
                const form = taskForms[i];
                let taskId = form.dataset.taskId || form.getAttribute('data-task-id');
                
                // Fallback: try to use the task at the same index if ID is missing
                if (!taskId && this.tasks[i] && this.tasks[i].id) {
                    taskId = this.tasks[i].id;
                    console.warn(`⚠️ Missing data-task-id on form index ${i}. Falling back to tasks[${i}].id: ${taskId}`);
                    // Ensure the DOM gets the attribute for future runs
                    form.setAttribute('data-task-id', taskId);
                }
                
                console.log(`\n📋 Processing task ${i + 1}/${taskForms.length} (ID: ${taskId})`);
                
                // Find the original task data from session with multiple fallbacks
                let originalTask = null;
                if (taskId) {
                    originalTask = this.tasks.find(t => t.id === taskId) || null;
                }
                if (!originalTask && this.tasks[i]) {
                    originalTask = this.tasks[i];
                    console.warn(`⚠️ Using tasks[${i}] as originalTask fallback`);
                }
                if (!originalTask) {
                    // Final fallback: match by task number
                    originalTask = this.tasks.find(t => t.number === (i + 1)) || null;
                    if (originalTask) {
                        console.warn(`⚠️ Matched originalTask by number=${i + 1}. Using id=${originalTask.id}`);
                        form.setAttribute('data-task-id', originalTask.id);
                        taskId = originalTask.id;
                    }
                }
                
                if (!originalTask) {
                    console.error(`❌ Could not find original task data for ${taskId}`);
                    continue;
                }
                
                // Get form field values directly
                const taskNameInput = form.querySelector('input[name="task_name"]');
                const descriptionInput = form.querySelector('textarea[name="description"]');
                const locationInput = form.querySelector('input[name="location"]');
                const subjectSelect = form.querySelector('select[name="subject"]');
                
                // Extract values
                const taskName = taskNameInput ? taskNameInput.value.trim() : '';
                const description = descriptionInput ? descriptionInput.value.trim() : '';
                
                // Extract categories with multiple fallbacks
                let categories = '';
                
                // Try 1: Get from hidden categories input (populated by grid selection)
                const categoriesHiddenInput = form.querySelector('input[name="categories"], .categories-input');
                if (categoriesHiddenInput && categoriesHiddenInput.value) {
                    categories = categoriesHiddenInput.value.trim();
                    console.log('📋 Got categories from hidden input:', categories);
                }
                
                // Try 2: Get directly from selected grid items
                if (!categories) {
                    const selectedCategoryItems = form.querySelectorAll('.category-selection-item.selected');
                    if (selectedCategoryItems.length > 0) {
                        categories = Array.from(selectedCategoryItems)
                            .map(item => item.getAttribute('data-category'))
                            .filter(cat => cat)
                            .join(', ');
                        console.log('📋 Extracted categories from grid selection:', categories);
                    }
                }
                
                // Try 3: Get from main form as fallback
                if (!categories) {
                    const mainCategoryInput = document.querySelector('input[name="kategorie"], select[name="kategorie"]');
                    if (mainCategoryInput && mainCategoryInput.value) {
                        categories = mainCategoryInput.value.trim();
                        console.log('📋 Using category from main form:', categories);
                    }
                }
                
                // Try 4: Use subject-based default category
                if (!categories) {
                    // Create a meaningful default based on subject
                    const subjectValue = subjectSelect ? subjectSelect.value : 'Matematyka';
                    if (subjectValue === 'Matematyka') {
                        categories = 'Algebra';
                    } else if (subjectValue === 'Polski') {
                        categories = 'Gramatyka';
                    } else if (subjectValue === 'Angielski') {
                        categories = 'Grammar';
                    } else {
                        categories = 'General';
                    }
                    console.log('⚠️ No categories found, using subject-based default:', categories);
                }
                
                const location = locationInput ? locationInput.value.trim() : '';
                let subject = subjectSelect ? subjectSelect.value : '';
                
                // If subject is empty (disabled field issue), use session default
                if (!subject) {
                    // Try to get from global session or use default
                    if (window.formApp?.currentSession?.subject) {
                        subject = window.formApp.currentSession.subject;
                    } else {
                        subject = 'Matematyka'; // Default subject
                    }
                    console.log('⚠️ Subject field empty, using fallback:', subject);
                }
                
                // CRITICAL FIX: Always use the original task boolean, ignore form hidden field
                const correctlyCompleted = originalTask.isCorrect; // This is the actual boolean
                
                // Verify we have the correct boolean value
                console.log('📊 Boolean correctness verification:', {
                    taskNumber: originalTask.number,
                    originalTaskCorrect: originalTask.isCorrect,
                    correctlyCompletedValue: correctlyCompleted,
                    correctlyCompletedType: typeof correctlyCompleted,
                    willConvertTo: correctlyCompleted ? 'Yes' : 'No'
                });
                
                console.log('📊 Form data extracted:', {
                    taskName,
                    description,
                    categories,
                    location,
                    subject,
                    correctlyCompleted: correctlyCompleted,
                    originalTaskCorrect: originalTask.isCorrect
                });

                // Validate required fields
                if (!taskName) {
                    throw new Error(`Nazwa zadania jest wymagana dla zadania ${i + 1}`);
                }
                if (!location) {
                    throw new Error(`Miejsce wykonania jest wymagane dla zadania ${i + 1}`);
                }

                // Prepare data object with proper boolean handling
                const taskData = {
                    task_id: taskId,
                    task_name: taskName,
                    description: description,
                    categories: categories,
                    correctly_completed: correctlyCompleted, // Use original boolean value
                    start_time: originalTask.startTime.toISOString(),
                    end_time: originalTask.endTime.toISOString(),
                    location: location,
                    subject: subject,
                    session_id: this.currentSessionId || this.generateSessionId()
                };
                
                console.log('✅ Final taskData prepared:', taskData);
                tasksData.push(taskData);
            }

            // Show loading state
            this.elements.submitAnalysisBtn.disabled = true;
            this.elements.submitAnalysisBtn.innerHTML = '<span class="btn-icon">⏳</span>Zapisywanie...';

            // Set submission flag to prevent duplicates
            if (window.systemCoordination) {
                window.systemCoordination.isSubmittingStudyData = true;
                console.log('🚀 Study data submission started - blocking other systems');
            }
            
            // Submit to Google Sheets
            const result = await this.submitTasksToSheet(tasksData);

            if (result.success) {
                this.showMessage('Wszystkie dane zostały pomyślnie zapisane do Google Sheets!', 'success');
                
                // Save the session data to StudySessions sheet
                await this.saveSessionToSheets();
                
                // Update dashboard with completed session
                this.updateDashboardStats();
                this.addToRecentSessions();
                
                this.hideAnalysisModal();
                this.resetSession();
            } else {
                throw new Error(result.error || 'Błąd podczas zapisywania danych');
            }

        } catch (error) {
            console.error('Error submitting analysis:', error);
            this.showMessage('Wystąpił błąd podczas zapisywania: ' + error.message, 'error');
        } finally {
            // Clear submission coordination flag
            if (window.systemCoordination) {
                window.systemCoordination.isSubmittingStudyData = false;
                console.log('🏁 Study data submission completed - other systems unblocked');
            }
            
            // Reset button state and submission lock
            this.elements.submitAnalysisBtn.disabled = false;
            this.elements.submitAnalysisBtn.innerHTML = '<span class="btn-icon">💾</span>Zapisz Wszystkie Dane';
            this.isSubmitting = false;
        }
    }

    /**
     * Submit tasks data to Google Sheets
     */
    async submitTasksToSheet(tasksData) {
        console.log(`📤 Submitting ${tasksData.length} tasks to Google Sheets`);
        
        try {
            const results = [];
            
            // Submit tasks sequentially to avoid overwhelming the API
            for (let i = 0; i < tasksData.length; i++) {
                const taskData = tasksData[i];
                console.log(`\n📋 Submitting task ${i + 1}/${tasksData.length}:`, taskData);
                
                try {
                    const result = await this.googleSheetsAPI.submitStudyTask(taskData);
                    results.push(result);
                    console.log(`✅ Task ${i + 1} submitted successfully:`, result);
                } catch (error) {
                    console.error(`❌ Task ${i + 1} submission failed:`, error);
                    results.push({ success: false, error: error.message });
                }
                
                // Small delay between submissions
                if (i < tasksData.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }

            // Check if all submissions were successful
            const failed = results.filter(result => !result.success);
            if (failed.length > 0) {
                console.error(`❌ ${failed.length} tasks failed to submit:`, failed);
                return {
                    success: false,
                    error: `${failed.length} z ${tasksData.length} zadań nie zostało zapisanych`
                };
            }

            console.log(`✅ All ${tasksData.length} tasks submitted successfully!`);
            return { success: true };

        } catch (error) {
            console.error('Error in submitTasksToSheet:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Cancel analysis and reset session
     */
    cancelAnalysis() {
        if (confirm('Czy na pewno chcesz anulować? Wszystkie dane z sesji zostaną utracone.')) {
            this.hideAnalysisModal();
            this.resetSession();
        }
    }

    /**
     * Reset session state
     */
    resetSession() {
        this.isSessionActive = false;
        this.isPaused = false;
        this.sessionStartTime = null;
        this.currentTaskStartTime = null;
        this.tasks = [];
        this.currentTaskNumber = 0;
        this.counters = { total: 0, correct: 0, incorrect: 0 };
        
        // Clear global coordination flags
        if (window.systemCoordination) {
            window.systemCoordination.studySessionActive = false;
            window.systemCoordination.isSubmittingStudyData = false;
            console.log('🎆 Study session ended - duplicate prevention disabled');
        }
        
        this.stopTimers();
        this.updateCounters();
        
        console.log('🔄 Session reset');
    }

    /**
     * Generate unique task ID
     */
    generateTaskId() {
        return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Format time duration (milliseconds to MM:SS)
     */
    formatTime(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    /**
     * Format date and time for display
     */
    formatDateTime(date) {
        return date.toLocaleString('pl-PL', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    /**
     * Show message to user
     */
    showMessage(message, type = 'info') {
        const messageContainer = document.getElementById('message-container');
        if (!messageContainer) {
            alert(message); // Fallback
            return;
        }

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
     * Populate dropdowns in analysis forms with loaded data
     */
    async populateAnalysisDropdowns() {
        // Get session data from current session - try multiple sources
        let sessionSubject = '';
        let sessionLocation = '';
        
        // Try to get from global app instance
        if (window.formApp?.currentSession) {
            sessionSubject = window.formApp.currentSession.subject || '';
            sessionLocation = window.formApp.currentSession.location || '';
        }
        
        // Fallback: try to extract from form data or use defaults
        if (!sessionLocation) {
            sessionLocation = 'W szkole'; // Default location
        }
        if (!sessionSubject) {
            sessionSubject = 'Matematyka'; // Default subject
        }
        
        console.log('🔧 Using session config:', { sessionSubject, sessionLocation });
        
        try {
            // Fetch categories filtered by session subject
            const categoriesResponse = await this.googleSheetsAPI.fetchCategories(sessionSubject);
            let categories = [];
            
            if (categoriesResponse.success) {
                categories = categoriesResponse.categories || [];
            }
            
            // Populate mobile-friendly category grids
            const categoryGrids = this.elements.analysisContainer.querySelectorAll('.category-selection-grid');
            categoryGrids.forEach((grid, gridIndex) => {
                this.populateCategoryGrid(grid, categories, gridIndex);
            });
            
            // Populate subject dropdowns (readonly with session subject)
            const subjectSelects = this.elements.analysisContainer.querySelectorAll('select[name="subject"]');
            subjectSelects.forEach(select => {
                select.innerHTML = `<option value="${sessionSubject}" selected>${sessionSubject}</option>`;
                select.style.backgroundColor = '#f3f4f6';
                select.readOnly = true;
                // Don't disable - use readonly to preserve form value
                select.style.pointerEvents = 'none';
                select.style.cursor = 'not-allowed';
                
                // Add readonly indicator
                const parentGroup = select.closest('.form-group');
                if (parentGroup) {
                    const label = parentGroup.querySelector('.form-label');
                    if (label && !label.textContent.includes('(z sesji)')) {
                        label.innerHTML = `${label.innerHTML} <span style="color: #6b7280; font-size: 0.875rem;">(z sesji)</span>`;
                    }
                }
            });
            
            // Populate location inputs (readonly with session location)
            const locationInputs = this.elements.analysisContainer.querySelectorAll('input[name="location"]');
            locationInputs.forEach(input => {
                input.value = sessionLocation;
            });
            
        } catch (error) {
            console.warn('Could not populate analysis dropdowns:', error);
        }
    }
    
    /**
     * Populate category grid with mobile-friendly selection
     */
    populateCategoryGrid(grid, categories, gridIndex) {
        grid.innerHTML = '';
        
        if (!categories || categories.length === 0) {
            grid.innerHTML = `
                <div class="no-categories-message">
                    <div style="text-align: center; padding: 20px; color: #6b7280;">
                        <div style="font-size: 24px; margin-bottom: 8px;">📂</div>
                        <div>Brak kategorii dla tego przedmiotu</div>
                    </div>
                </div>
            `;
            return;
        }
        
        categories.forEach((category, categoryIndex) => {
            const categoryItem = document.createElement('div');
            categoryItem.className = 'category-selection-item';
            categoryItem.setAttribute('data-category', category.name);
            categoryItem.setAttribute('data-difficulty', category.difficulty);
            
            const difficultyClass = this.getDifficultyClass(category.difficulty);
            
            categoryItem.innerHTML = `
                <div class="category-item-content">
                    <div class="category-item-name">${category.name}</div>
                    <div class="category-item-difficulty">
                        <span class="difficulty-badge ${difficultyClass}">
                            ${this.getDifficultyIcon(category.difficulty)} ${category.difficulty}
                        </span>
                    </div>
                </div>
            `;
            
            // Add click handler
            categoryItem.addEventListener('click', (e) => {
                this.toggleCategorySelection(categoryItem, gridIndex);
            });
            
            grid.appendChild(categoryItem);
        });
    }
    
    /**
     * Toggle category selection
     */
    toggleCategorySelection(categoryItem, gridIndex) {
        const isSelected = categoryItem.classList.contains('selected');
        
        if (isSelected) {
            categoryItem.classList.remove('selected');
        } else {
            categoryItem.classList.add('selected');
        }
        
        // Update hidden input and summary
        this.updateCategorySelection(gridIndex);
    }
    
    /**
     * Update category selection hidden input and summary
     */
    updateCategorySelection(gridIndex) {
        const taskForm = this.elements.analysisContainer.querySelectorAll('.task-analysis-form')[gridIndex];
        if (!taskForm) return;
        
        const grid = taskForm.querySelector('.category-selection-grid');
        const hiddenInput = taskForm.querySelector('.categories-input');
        const summary = taskForm.querySelector('.selected-categories-summary');
        const summaryList = taskForm.querySelector('.selected-categories-list');
        
        if (!grid || !hiddenInput || !summary || !summaryList) return;
        
        // Get selected categories
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
     * Setup dashboard integration
     */
    setupDashboardIntegration() {
        // Add event listener for view history button if it exists
        const viewHistoryBtn = document.getElementById('view-history-button');
        if (viewHistoryBtn) {
            viewHistoryBtn.addEventListener('click', () => this.showSessionHistory());
        }
    }

    /**
     * Show session history (placeholder for future implementation)
     */
    showSessionHistory() {
        // TODO: Implement session history view
        this.showMessage('Historia sesji będzie dostępna wkrótce!', 'info');
        console.log('📅 Session history requested');
    }

    /**
     * Update dashboard statistics after session completion
     */
    updateDashboardStats() {
        // Update today's stats in the dashboard if visible
        const todaySessionsEl = document.getElementById('today-sessions');
        const todayTasksEl = document.getElementById('today-tasks');
        const todayAccuracyEl = document.getElementById('today-accuracy');

        if (todaySessionsEl && todayTasksEl && todayAccuracyEl) {
            // Simple increment for demonstration
            const currentSessions = parseInt(todaySessionsEl.textContent) || 0;
            const currentTasks = parseInt(todayTasksEl.textContent) || 0;
            
            todaySessionsEl.textContent = (currentSessions + 1).toString();
            todayTasksEl.textContent = (currentTasks + this.counters.total).toString();
            
            const totalTasks = currentTasks + this.counters.total;
            const correctTasks = this.counters.correct;
            const accuracy = totalTasks > 0 ? Math.round((correctTasks / totalTasks) * 100) : 0;
            todayAccuracyEl.textContent = accuracy + '%';
        }
    }

    /**
     * Add completed session to recent sessions list
     */
    addToRecentSessions() {
        const recentSessionsList = document.getElementById('recent-sessions-list');
        if (!recentSessionsList) return;

        // Remove placeholder if it exists
        const placeholder = recentSessionsList.querySelector('.no-sessions-placeholder');
        if (placeholder) {
            placeholder.remove();
        }

        // Create session item
        const sessionStats = this.getSessionStats();
        const sessionItem = document.createElement('div');
        sessionItem.className = 'session-item';
        sessionItem.innerHTML = `
            <div class="session-icon">🎯</div>
            <div class="session-details">
                <div class="session-title">Sesja Nauki</div>
                <div class="session-meta">${this.formatDateTime(this.sessionStartTime)}</div>
            </div>
            <div class="session-stats">
                ${this.counters.total} zadań<br>
                ${Math.round(sessionStats.accuracy)}% poprawnych
            </div>
        `;

        // Add to the beginning of the list
        recentSessionsList.insertBefore(sessionItem, recentSessionsList.firstChild);

        // Keep only the 5 most recent sessions
        const sessionItems = recentSessionsList.querySelectorAll('.session-item');
        if (sessionItems.length > 5) {
            sessionItems[sessionItems.length - 1].remove();
        }
    }

    /**
     * Setup dashboard integration
     */
    setupDashboardIntegration() {
        // Add event listener for view history button if it exists
        const viewHistoryBtn = document.getElementById('view-history-button');
        if (viewHistoryBtn) {
            viewHistoryBtn.addEventListener('click', () => this.showSessionHistory());
        }
    }

    /**
     * Show session history modal with data
     */
    async showSessionHistory() {
        console.log('📅 Loading session history');
        
        // Cache history modal elements
        this.historyElements = {
            modal: document.getElementById('session-history-modal'),
            closeBtn: document.getElementById('close-history-modal'),
            closeBtnFooter: document.getElementById('close-history-btn'),
            refreshBtn: document.getElementById('refresh-history-btn'),
            dateFilter: document.getElementById('history-date-filter'),
            sortFilter: document.getElementById('history-sort-filter'),
            sessionsList: document.getElementById('sessions-history-list'),
            loadingState: document.getElementById('history-loading'),
            noHistoryState: document.getElementById('no-history-state'),
            totalCount: document.getElementById('total-sessions-count'),
            totalTime: document.getElementById('total-study-time'),
            averageAccuracy: document.getElementById('average-accuracy')
        };
        
        // Setup event listeners for history modal
        this.setupHistoryEventListeners();
        
        // Show modal
        if (this.historyElements.modal) {
            this.historyElements.modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
        
        // Load session data
        await this.loadSessionHistory();
    }

    /**
     * Setup event listeners for history modal
     */
    setupHistoryEventListeners() {
        if (!this.historyElements) return;

        // Close modal events
        if (this.historyElements.closeBtn) {
            this.historyElements.closeBtn.addEventListener('click', () => this.hideSessionHistory());
        }
        if (this.historyElements.closeBtnFooter) {
            this.historyElements.closeBtnFooter.addEventListener('click', () => this.hideSessionHistory());
        }

        // Refresh button
        if (this.historyElements.refreshBtn) {
            this.historyElements.refreshBtn.addEventListener('click', () => this.loadSessionHistory());
        }

        // Filter change events
        if (this.historyElements.dateFilter) {
            this.historyElements.dateFilter.addEventListener('change', () => this.applyHistoryFilters());
        }
        if (this.historyElements.sortFilter) {
            this.historyElements.sortFilter.addEventListener('change', () => this.applyHistoryFilters());
        }

        // Close modal on outside click
        if (this.historyElements.modal) {
            this.historyElements.modal.addEventListener('click', (e) => {
                if (e.target === this.historyElements.modal) {
                    this.hideSessionHistory();
                }
            });
        }
    }

    /**
     * Hide session history modal
     */
    hideSessionHistory() {
        if (this.historyElements?.modal) {
            this.historyElements.modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    /**
     * Load session history from Google Sheets
     */
    async loadSessionHistory() {
        if (!this.historyElements) return;

        // Show loading state
        this.historyElements.loadingState.style.display = 'flex';
        this.historyElements.noHistoryState.style.display = 'none';
        this.historyElements.sessionsList.style.display = 'none';

        try {
            const response = await this.googleSheetsAPI.getStudySessions();
            
            if (response.success && response.sessions) {
                this.sessionsData = response.sessions;
                console.log('📊 Loaded', this.sessionsData.length, 'study sessions');
                
                if (this.sessionsData.length > 0) {
                    this.applyHistoryFilters();
                } else {
                    this.showNoHistoryState();
                }
            } else {
                console.error('Failed to load sessions:', response.error);
                this.showNoHistoryState();
            }
        } catch (error) {
            console.error('Error loading session history:', error);
            this.showNoHistoryState();
        }

        // Hide loading state
        this.historyElements.loadingState.style.display = 'none';
    }

    /**
     * Show no history state
     */
    showNoHistoryState() {
        if (!this.historyElements) return;

        this.historyElements.noHistoryState.style.display = 'block';
        this.historyElements.sessionsList.style.display = 'none';
        this.updateHistoryStats(0, 0, 0);
    }

    /**
     * Apply filters and sorting to session history
     */
    applyHistoryFilters() {
        if (!this.sessionsData || !this.historyElements) return;

        let filteredSessions = [...this.sessionsData];

        // Apply date filter
        const dateFilter = this.historyElements.dateFilter.value;
        if (dateFilter !== 'all') {
            const now = new Date();
            const filterDate = new Date();

            switch (dateFilter) {
                case 'today':
                    filterDate.setHours(0, 0, 0, 0);
                    break;
                case 'week':
                    filterDate.setDate(now.getDate() - 7);
                    break;
                case 'month':
                    filterDate.setMonth(now.getMonth() - 1);
                    break;
            }

            filteredSessions = filteredSessions.filter(session => {
                const sessionDate = new Date(session.start_time || session.startTime);
                return sessionDate >= filterDate;
            });
        }

        // Apply sorting
        const sortFilter = this.historyElements.sortFilter.value;
        filteredSessions.sort((a, b) => {
            switch (sortFilter) {
                case 'newest':
                    return new Date(b.start_time || b.startTime) - new Date(a.start_time || a.startTime);
                case 'oldest':
                    return new Date(a.start_time || a.startTime) - new Date(b.start_time || b.startTime);
                case 'duration':
                    return (b.duration_minutes || 0) - (a.duration_minutes || 0);
                case 'tasks':
                    return (b.total_tasks || 0) - (a.total_tasks || 0);
                case 'accuracy':
                    return (b.accuracy_percentage || 0) - (a.accuracy_percentage || 0);
                default:
                    return 0;
            }
        });

        this.displayFilteredSessions(filteredSessions);
    }

    /**
     * Display filtered sessions in the list
     */
    displayFilteredSessions(sessions) {
        if (!this.historyElements) return;

        const sessionsList = this.historyElements.sessionsList;
        sessionsList.innerHTML = '';

        if (sessions.length === 0) {
            this.showNoHistoryState();
            return;
        }

        // Show sessions list
        this.historyElements.sessionsList.style.display = 'block';
        this.historyElements.noHistoryState.style.display = 'none';

        sessions.forEach((session, index) => {
            const sessionElement = this.createSessionHistoryElement(session, index);
            sessionsList.appendChild(sessionElement);
        });

        // Update stats
        this.updateHistoryStats(
            sessions.length,
            sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0),
            sessions.length > 0 ? Math.round(sessions.reduce((sum, s) => sum + (s.accuracy_percentage || 0), 0) / sessions.length) : 0
        );
    }

    /**
     * Create session history element with expandable details
     */
    createSessionHistoryElement(session, index) {
        const sessionDate = new Date(session.start_time || session.startTime);
        const accuracyClass = this.getAccuracyClass(session.accuracy_percentage || 0);
        const sessionId = session.session_id || `session_${index}`;
        
        // Create main session container
        const sessionContainer = document.createElement('div');
        sessionContainer.className = 'session-container';
        
        // Create main session item
        const sessionElement = document.createElement('div');
        sessionElement.className = 'session-history-item';
        sessionElement.style.animationDelay = `${index * 50}ms`;
        sessionElement.dataset.sessionId = sessionId;
        
        sessionElement.innerHTML = `
            <div class="session-icon">🎯</div>
            <div class="session-main-info">
                <div class="session-date">${this.formatDate(sessionDate)}</div>
                <div class="session-time">${this.formatTime2(sessionDate)}</div>
                <div class="session-summary">
                    <div class="session-stat">📚 ${session.total_tasks || 0} zadań</div>
                    <div class="session-stat">✅ ${session.correct_tasks || 0} poprawnych</div>
                    <div class="session-stat">❌ ${(session.total_tasks || 0) - (session.correct_tasks || 0)} błędnych</div>
                </div>
            </div>
            <div class="session-stats-right">
                <div class="session-duration">${session.duration_minutes || 0} min</div>
                <div class="session-accuracy ${accuracyClass}">${session.accuracy_percentage || 0}%</div>
                <button class="session-expand-btn" data-session-id="${sessionId}">
                    ▼
                </button>
            </div>
        `;
        
        // Create expandable details section
        const detailsElement = document.createElement('div');
        detailsElement.className = 'session-details';
        detailsElement.dataset.sessionId = sessionId;
        detailsElement.innerHTML = `
            <div class="session-details-content">
                <div class="session-details-header">
                    <div class="session-details-title">
                        📋 Szczegóły zadania
                        <span class="tasks-count-badge">${session.total_tasks || 0}</span>
                    </div>
                </div>
                <div class="session-tasks-container" id="tasks-${sessionId}">
                    <div class="tasks-loading">
                        <div class="loading-spinner"></div>
                        Ładowanie zadań...
                    </div>
                </div>
            </div>
        `;
        
        // Add click event listener for expand/collapse
        const expandBtn = sessionElement.querySelector('.session-expand-btn');
        expandBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleSessionDetails(sessionId, session);
        });
        
        // Also make the whole session clickable
        sessionElement.addEventListener('click', (e) => {
            // Don't trigger if clicking on expand button
            if (e.target.classList.contains('session-expand-btn')) return;
            this.toggleSessionDetails(sessionId, session);
        });
        
        sessionContainer.appendChild(sessionElement);
        sessionContainer.appendChild(detailsElement);
        
        return sessionContainer;
    }

    /**
     * Get CSS class for accuracy level
     */
    getAccuracyClass(accuracy) {
        if (accuracy >= 80) return 'accuracy-excellent';
        if (accuracy >= 60) return 'accuracy-good';
        return 'accuracy-average';
    }

    /**
     * Format date for display
     */
    formatDate(date) {
        return date.toLocaleDateString('pl-PL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    /**
     * Format time for display
     */
    formatTime2(date) {
        return date.toLocaleTimeString('pl-PL', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Toggle session details expansion
     */
    async toggleSessionDetails(sessionId, sessionData) {
        const sessionElement = document.querySelector(`.session-history-item[data-session-id="${sessionId}"]`);
        const detailsElement = document.querySelector(`.session-details[data-session-id="${sessionId}"]`);
        const expandBtn = sessionElement?.querySelector('.session-expand-btn');
        
        if (!sessionElement || !detailsElement || !expandBtn) {
            console.error('Session elements not found:', sessionId);
            return;
        }
        
        const isExpanded = sessionElement.classList.contains('expanded');
        
        if (isExpanded) {
            // Collapse
            sessionElement.classList.remove('expanded');
            detailsElement.style.display = 'none';
            expandBtn.classList.remove('expanded');
        } else {
            // Expand and load tasks
            sessionElement.classList.add('expanded');
            detailsElement.style.display = 'block';
            expandBtn.classList.add('expanded');
            
            // Load tasks if not already loaded
            const tasksContainer = document.getElementById(`tasks-${sessionId}`);
            if (tasksContainer && !tasksContainer.dataset.loaded) {
                await this.loadSessionTasks(sessionId, tasksContainer, sessionData);
            }
        }
    }
    
    /**
     * Load tasks for a specific session
     */
    async loadSessionTasks(sessionId, container, sessionData) {
        if (!container) return;
        
        try {
            container.innerHTML = `
                <div class="tasks-loading">
                    <div class="loading-spinner"></div>
                    Ładowanie zadań...
                </div>
            `;
            
            // Try to get tasks by session ID first, fallback to all tasks if needed
            const response = await this.googleSheetsAPI.getStudyTasks(sessionId);
            
            if (response.success && response.tasks) {
                let sessionTasks = response.tasks;
                
                // If no tasks found by session ID, try time-based filtering
                if (sessionTasks.length === 0) {
                    const allTasksResponse = await this.googleSheetsAPI.getStudyTasks();
                    if (allTasksResponse.success && allTasksResponse.tasks) {
                        const sessionStart = new Date(sessionData.start_time || sessionData.startTime);
                        const sessionEnd = new Date(sessionData.end_time || sessionData.endTime);
                        
                        sessionTasks = allTasksResponse.tasks.filter(task => {
                            // First try to match by session_id
                            if (task.session_id && sessionId) {
                                return task.session_id === sessionId;
                            }
                            
                            // Fallback to time-based filtering
                            const taskTime = new Date(task.start_time || task.startTime);
                            return taskTime >= sessionStart && taskTime <= sessionEnd;
                        });
                    }
                }
                
                this.displaySessionTasks(container, sessionTasks, sessionId);
            } else {
                container.innerHTML = `
                    <div class="no-tasks-message">
                        🔍 Nie znaleziono szczegółowych zadań dla tej sesji
                    </div>
                `;
            }
            
            container.dataset.loaded = 'true';
        } catch (error) {
            console.error('Error loading session tasks:', error);
            container.innerHTML = `
                <div class="no-tasks-message">
                    ❌ Błąd podczas ładowania zadań
                </div>
            `;
        }
    }
    
    /**
     * Display tasks for a session
     */
    displaySessionTasks(container, tasks, sessionId) {
        if (!container) return;
        
        if (tasks.length === 0) {
            container.innerHTML = `
                <div class="no-tasks-message">
                    📝 Brak szczegółowych zadań dla tej sesji
                </div>
            `;
            return;
        }
        
        const tasksHtml = tasks.map((task, index) => {
            const isCorrect = this.isTaskCorrect(task.correctly_completed);
            const statusIcon = isCorrect ? '✅' : '❌';
            const statusClass = isCorrect ? 'correct' : 'incorrect';
            const taskDuration = this.calculateTaskDuration(task);
            
            return `
                <div class="session-task-item" style="animation-delay: ${index * 100}ms;">
                    <div class="task-status-icon ${statusClass}">${statusIcon}</div>
                    <div class="task-main-info">
                        <div class="task-name">${task.task_name || 'Zadanie bez nazwy'}</div>
                        <div class="task-meta">
                            ${task.subject ? `<span class="task-meta-item">📚 ${task.subject}</span>` : ''}
                            ${task.categories ? `<span class="task-meta-item">🏷️ ${task.categories}</span>` : ''}
                            ${task.location ? `<span class="task-meta-item">📍 ${task.location}</span>` : ''}
                        </div>
                        ${task.description ? `<div class="task-description" style="margin-top: 4px; font-size: 0.85rem; color: #6b7280;">${task.description}</div>` : ''}
                    </div>
                    <div class="task-duration">${taskDuration}</div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = `
            <div class="session-tasks-list">
                ${tasksHtml}
            </div>
        `;
    }
    
    /**
     * Check if task is correct
     */
    isTaskCorrect(correctlyCompleted) {
        if (typeof correctlyCompleted === 'boolean') {
            return correctlyCompleted;
        }
        if (typeof correctlyCompleted === 'string') {
            return correctlyCompleted.toLowerCase() === 'yes' || 
                   correctlyCompleted.toLowerCase() === 'true' ||
                   correctlyCompleted.toLowerCase() === 'poprawnie';
        }
        return false;
    }
    
    /**
     * Calculate task duration from start and end times
     */
    calculateTaskDuration(task) {
        if (task.start_time && task.end_time) {
            const start = new Date(task.start_time);
            const end = new Date(task.end_time);
            const duration = end - start;
            return this.formatTime(duration);
        }
        return '-';
    }

    /**
     * Update history statistics display
     */
    updateHistoryStats(totalSessions, totalTime, averageAccuracy) {
        if (!this.historyElements) return;

        if (this.historyElements.totalCount) {
            this.historyElements.totalCount.textContent = totalSessions;
        }
        if (this.historyElements.totalTime) {
            this.historyElements.totalTime.textContent = totalTime + ' min';
        }
        if (this.historyElements.averageAccuracy) {
            this.historyElements.averageAccuracy.textContent = averageAccuracy + '%';
        }
    }

    /**
     * Update dashboard statistics after session completion
     */
    updateDashboardStats() {
        // Update today's stats in the dashboard if visible
        const todaySessionsEl = document.getElementById('today-sessions');
        const todayTasksEl = document.getElementById('today-tasks');
        const todayAccuracyEl = document.getElementById('today-accuracy');

        if (todaySessionsEl && todayTasksEl && todayAccuracyEl) {
            // Simple increment for demonstration
            const currentSessions = parseInt(todaySessionsEl.textContent) || 0;
            const currentTasks = parseInt(todayTasksEl.textContent) || 0;
            
            todaySessionsEl.textContent = (currentSessions + 1).toString();
            todayTasksEl.textContent = (currentTasks + this.counters.total).toString();
            
            const totalTasks = currentTasks + this.counters.total;
            const correctTasks = this.counters.correct;
            const accuracy = totalTasks > 0 ? Math.round((correctTasks / totalTasks) * 100) : 0;
            todayAccuracyEl.textContent = accuracy + '%';
        }
    }

    /**
     * Add completed session to recent sessions list
     */
    addToRecentSessions() {
        const recentSessionsList = document.getElementById('recent-sessions-list');
        if (!recentSessionsList) return;

        // Remove placeholder if it exists
        const placeholder = recentSessionsList.querySelector('.no-sessions-placeholder');
        if (placeholder) {
            placeholder.remove();
        }

        // Create session item
        const sessionStats = this.getSessionStats();
        const sessionItem = document.createElement('div');
        sessionItem.className = 'session-item';
        sessionItem.innerHTML = `
            <div class="session-icon">🎯</div>
            <div class="session-details">
                <div class="session-title">Sesja Nauki</div>
                <div class="session-meta">${this.formatDateTime(this.sessionStartTime)}</div>
            </div>
            <div class="session-stats">
                ${this.counters.total} zadań<br>
                ${Math.round(sessionStats.accuracy)}% poprawnych
            </div>
        `;

        // Add to the beginning of the list
        recentSessionsList.insertBefore(sessionItem, recentSessionsList.firstChild);

        // Keep only the 5 most recent sessions
        const sessionItems = recentSessionsList.querySelectorAll('.session-item');
        if (sessionItems.length > 5) {
            sessionItems[sessionItems.length - 1].remove();
        }
    }

    /**
     * Save completed session to StudySessions sheet
     */
    async saveSessionToSheets() {
        if (!this.sessionStartTime) {
            console.warn('No session start time available for saving');
            return;
        }

        const endTime = new Date();
        const durationMinutes = Math.floor((endTime - this.sessionStartTime) / 1000 / 60);
        const accuracyPercentage = this.counters.total > 0 ? 
            Math.round((this.counters.correct / this.counters.total) * 100) : 0;

        // Use the current session ID if available, or generate a new one
        const sessionId = this.currentSessionId || this.generateSessionId();
        
        const sessionData = {
            session_id: sessionId,
            start_time: this.sessionStartTime.toISOString(),
            end_time: endTime.toISOString(),
            duration_minutes: durationMinutes,
            total_tasks: this.counters.total,
            correct_tasks: this.counters.correct,
            accuracy_percentage: accuracyPercentage,
            notes: `Sesja z ${this.counters.total} zadaniami, ${this.counters.correct} poprawnych, ${this.counters.incorrect} błędnych`
        };

        try {
            await this.googleSheetsAPI.addStudySession(sessionData);
            console.log('📈 Session data saved to StudySessions sheet:', sessionData);
            
            // Store the session ID for future reference
            this.lastCompletedSessionId = sessionId;
        } catch (error) {
            console.error('Error saving session to sheets:', error);
            // Don't throw error - session data is already saved via tasks
        }
    }

    /**
     * Generate unique session ID
     */
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Get session statistics
     */
    getSessionStats() {
        const totalTime = this.sessionStartTime ? new Date() - this.sessionStartTime : 0;
        const averageTaskTime = this.tasks.length > 0 
            ? this.tasks.reduce((sum, task) => sum + task.duration, 0) / this.tasks.length 
            : 0;

        return {
            totalTasks: this.counters.total,
            correctTasks: this.counters.correct,
            incorrectTasks: this.counters.incorrect,
            accuracy: this.counters.total > 0 ? (this.counters.correct / this.counters.total * 100) : 0,
            totalTime: totalTime,
            averageTaskTime: averageTaskTime,
            tasks: this.tasks
        };
    }
}

// Export for global use
window.StudyTrackingManager = StudyTrackingManager;
