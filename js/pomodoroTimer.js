/**
 * Pomodoro Timer Manager
 * Handles Pomodoro timer functionality with category integration
 */
class PomodoroTimer {
    constructor(config, googleSheetsAPI) {
        this.config = config;
        this.googleSheetsAPI = googleSheetsAPI;
        
        // Timer state
        this.isRunning = false;
        this.isPaused = false;
        this.currentTime = 0;
        this.totalTime = 0;
        this.timerType = 'work'; // 'work', 'short-break', 'long-break'
        this.sessionCount = 0;
        this.intervalId = null;
        
        // Session data
        this.currentSession = {
            category: null,
            subject: null,
            startTime: null,
            endTime: null
        };
        
        // Elements
        this.elements = {
            display: document.getElementById('timer-display'),
            label: document.getElementById('timer-label'),
            startBtn: document.getElementById('timer-start'),
            pauseBtn: document.getElementById('timer-pause'),
            resetBtn: document.getElementById('timer-reset'),
            progressCircle: document.getElementById('timer-progress-circle'),
            subjectSelect: document.getElementById('pomodoro-subject'),
            categorySelect: document.getElementById('pomodoro-category'),
            sessionsToday: document.getElementById('sessions-today'),
            focusTimeToday: document.getElementById('focus-time-today'),
        };
        
        this.subjects = [];
        this.categories = [];
        
        this.init();
    }
    
    /**
     * Initialize Pomodoro timer
     */
    init() {
        this.setupEventListeners();
        this.loadSubjectsAndCategories();
        this.loadSettings();
        this.resetTimer();
        this.updateSessionStats();
        
        // Pomodoro Timer initialized
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Timer controls
        if (this.elements.startBtn) {
            this.elements.startBtn.addEventListener('click', () => this.startTimer());
        }
        
        if (this.elements.pauseBtn) {
            this.elements.pauseBtn.addEventListener('click', () => this.pauseTimer());
        }
        
        if (this.elements.resetBtn) {
            this.elements.resetBtn.addEventListener('click', () => this.resetTimer());
        }
        
        // Quick start from dashboard
        const startPomodoroQuick = document.getElementById('start-pomodoro-quick');
        if (startPomodoroQuick) {
            startPomodoroQuick.addEventListener('click', () => {
                // Switch to Pomodoro page and start timer
                if (window.navigationManager) {
                    window.navigationManager.showForm('pomodoro');
                    setTimeout(() => this.startTimer(), 300);
                }
            });
        }
        
        // Subject selection
        if (this.elements.subjectSelect) {
            this.elements.subjectSelect.addEventListener('change', (e) => {
                this.updateCategoriesForSubject(e.target.value);
            });
        }
    }
    
    /**
     * Load subjects and categories
     */
    async loadSubjectsAndCategories() {
        try {
            const [subjectsResponse, categoriesResponse] = await Promise.all([
                this.googleSheetsAPI.fetchSubjects(),
                this.googleSheetsAPI.fetchCategories()
            ]);
            
            if (subjectsResponse.success) {
                this.subjects = subjectsResponse.subjects || [];
                this.updateSubjectDropdown();
            }
            
            if (categoriesResponse.success) {
                this.categories = categoriesResponse.categories || [];
            }
            
        } catch (error) {
            console.error('Error loading subjects and categories for Pomodoro:', error);
        }
    }
    
    /**
     * Update subject dropdown
     */
    updateSubjectDropdown() {
        if (!this.elements.subjectSelect) return;
        
        this.elements.subjectSelect.innerHTML = '';
        
        // Add default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Wybierz przedmiot...';
        this.elements.subjectSelect.appendChild(defaultOption);
        
        // Add subjects
        this.subjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject.name;
            option.textContent = subject.name;
            this.elements.subjectSelect.appendChild(option);
        });
    }
    
    /**
     * Update categories for selected subject
     */
    updateCategoriesForSubject(subjectName) {
        if (!this.elements.categorySelect) return;
        
        this.elements.categorySelect.innerHTML = '';
        
        if (!subjectName) {
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'Wybierz przedmiot';
            this.elements.categorySelect.appendChild(defaultOption);
            return;
        }
        
        // Add default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Wybierz kategorię...';
        this.elements.categorySelect.appendChild(defaultOption);
        
        // Add categories
        this.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.name;
            option.textContent = category.name;
            this.elements.categorySelect.appendChild(option);
        });
    }
    
    /**
     * Start timer
     */
    startTimer() {
        // Validate session setup for work sessions
        if (this.timerType === 'work') {
            const validation = this.validateSessionSetup();
            if (!validation.isValid) {
                this.showError(validation.message);
                return;
            }
            
            // Set up session data
            this.currentSession = {
                category: this.elements.categorySelect?.value,
                subject: this.elements.subjectSelect?.value,
                startTime: new Date(),
                endTime: null
            };
        }
        
        if (!this.isRunning && !this.isPaused) {
            // Starting fresh timer
            this.setTimerDuration();
        }
        
        this.isRunning = true;
        this.isPaused = false;
        
        // Update UI
        this.updateTimerControls();
        this.updateTimerLabel();
        
        // Start countdown
        this.intervalId = setInterval(() => {
            this.tick();
        }, 1000);
        
        // console.log(`${this.timerType} timer started:`, this.currentSession);
    }
    
    /**
     * Validate session setup
     */
    validateSessionSetup() {
        if (!this.elements.subjectSelect?.value) {
            return {
                isValid: false,
                message: 'Wybierz przedmiot przed rozpoczęciem sesji'
            };
        }
        
        if (!this.elements.categorySelect?.value) {
            return {
                isValid: false,
                message: 'Wybierz kategorię przed rozpoczęciem sesji'
            };
        }
        
        return { isValid: true };
    }
    
    /**
     * Show error message
     */
    showError(message) {
        if (window.navigationManager) {
            window.navigationManager.showMessage(message, 'error');
        } else {
            console.error('Pomodoro Error:', message);
        }
    }
    
    /**
     * Load settings from localStorage or use defaults
     */
    loadSettings() {
        try {
            const settings = localStorage.getItem('pomodoroSettings');
            if (settings) {
                const parsedSettings = JSON.parse(settings);
                this.workDuration = parsedSettings.workDuration || 25 * 60; // 25 minutes
                this.shortBreakDuration = parsedSettings.shortBreakDuration || 5 * 60; // 5 minutes
                this.longBreakDuration = parsedSettings.longBreakDuration || 15 * 60; // 15 minutes
                this.longBreakInterval = parsedSettings.longBreakInterval || 4; // every 4 sessions
            } else {
                // Default settings
                this.workDuration = 25 * 60; // 25 minutes
                this.shortBreakDuration = 5 * 60; // 5 minutes
                this.longBreakDuration = 15 * 60; // 15 minutes
                this.longBreakInterval = 4; // every 4 sessions
            }
        } catch (error) {
            console.error('Error loading Pomodoro settings:', error);
            // Use defaults
            this.workDuration = 25 * 60;
            this.shortBreakDuration = 5 * 60;
            this.longBreakDuration = 15 * 60;
            this.longBreakInterval = 4;
        }
    }
    
    /**
     * Save settings to localStorage
     */
    saveSettings() {
        try {
            const settings = {
                workDuration: this.workDuration,
                shortBreakDuration: this.shortBreakDuration,
                longBreakDuration: this.longBreakDuration,
                longBreakInterval: this.longBreakInterval
            };
            localStorage.setItem('pomodoroSettings', JSON.stringify(settings));
        } catch (error) {
            console.error('Error saving Pomodoro settings:', error);
        }
    }
    
    /**
     * Pause timer
     */
    pauseTimer() {
        if (this.isRunning) {
            this.isPaused = true;
            this.isRunning = false;
            
            if (this.intervalId) {
                clearInterval(this.intervalId);
                this.intervalId = null;
            }
            
            this.updateTimerControls();
            // console.log('Timer paused');
        }
    }
    
    /**
     * Reset timer
     */
    resetTimer() {
        this.isRunning = false;
        this.isPaused = false;
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        this.setTimerDuration();
        this.updateDisplay();
        this.updateTimerControls();
        this.updateTimerLabel();
        this.updateProgressCircle();
        
        // console.log('Timer reset');
    }
    
    /**
     * Set timer duration based on current type
     */
    setTimerDuration() {
        switch (this.timerType) {
            case 'work':
                this.totalTime = this.workDuration;
                break;
            case 'short-break':
                this.totalTime = this.shortBreakDuration;
                break;
            case 'long-break':
                this.totalTime = this.longBreakDuration;
                break;
            default:
                this.totalTime = this.workDuration;
        }
        this.currentTime = this.totalTime;
    }
    
    /**
     * Timer tick - called every second
     */
    tick() {
        if (this.currentTime > 0) {
            this.currentTime--;
            this.updateDisplay();
            this.updateProgressCircle();
        } else {
            this.completeSession();
        }
    }
    
    /**
     * Complete current session
     */
    completeSession() {
        this.isRunning = false;
        this.isPaused = false;
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        // Complete current session
        if (this.timerType === 'work') {
            this.sessionCount++;
            this.currentSession.endTime = new Date();
            this.saveSession();
            
            // Determine next break type
            if (this.sessionCount % this.longBreakInterval === 0) {
                this.timerType = 'long-break';
            } else {
                this.timerType = 'short-break';
            }
        } else {
            // Break completed, back to work
            this.timerType = 'work';
            this.currentSession = {
                category: null,
                subject: null,
                startTime: null,
                endTime: null
            };
        }
        
        this.setTimerDuration();
        this.updateDisplay();
        this.updateTimerControls();
        this.updateTimerLabel();
        this.updateProgressCircle();
        this.updateSessionStats();
        
        // Show completion message
        const message = this.timerType === 'work' 
            ? 'Przerwa zakończona! Czas na pracę.' 
            : 'Sesja pracy zakończona! Czas na przerwę.';
        
        if (window.navigationManager) {
            window.navigationManager.showMessage(message, 'success');
        }
        
        // console.log('Session completed:', this.timerType);
    }
    
    /**
     * Save completed work session
     */
    async saveSession() {
        if (this.timerType !== 'work' || !this.currentSession.category || !this.currentSession.subject) {
            return;
        }
        
        try {
            const sessionData = {
                nazwa: `Pomodoro: ${this.currentSession.subject}`,
                tresc: `Sesja skupionej nauki - ${Math.round(this.workDuration / 60)} minut`,
                poprawnosc: 'Poprawne', // Default to correct for completed sessions
                kategorie: this.currentSession.category,
                przedmiot: this.currentSession.subject
            };
            
            const response = await this.googleSheetsAPI.submitData(sessionData);
            
            if (response.success) {
                // console.log('Pomodoro session saved successfully');
                if (window.navigationManager) {
                    window.navigationManager.showMessage('Sesja zapisana pomyślnie!', 'success');
                }
            } else {
                console.error('Failed to save Pomodoro session:', response.message);
            }
        } catch (error) {
            console.error('Error saving Pomodoro session:', error);
        }
    }
    
    /**
     * Update timer display
     */
    updateDisplay() {
        if (this.elements.display) {
            const minutes = Math.floor(this.currentTime / 60);
            const seconds = this.currentTime % 60;
            this.elements.display.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }
    
    /**
     * Update timer controls (start/pause buttons)
     */
    updateTimerControls() {
        if (this.elements.startBtn) {
            this.elements.startBtn.textContent = this.isPaused ? '▶️ Wznów' : '▶️ Start';
            this.elements.startBtn.disabled = this.isRunning;
        }
        
        if (this.elements.pauseBtn) {
            this.elements.pauseBtn.disabled = !this.isRunning;
        }
    }
    
    /**
     * Update timer label
     */
    updateTimerLabel() {
        if (this.elements.label) {
            const labels = {
                'work': '🎯 Sesja pracy',
                'short-break': '☕ Krótka przerwa',
                'long-break': '🌟 Długa przerwa'
            };
            this.elements.label.textContent = labels[this.timerType] || 'Timer';
        }
    }
    
    /**
     * Update progress circle
     */
    updateProgressCircle() {
        if (this.elements.progressCircle && this.totalTime > 0) {
            const progress = ((this.totalTime - this.currentTime) / this.totalTime) * 100;
            this.elements.progressCircle.style.background = 
                `conic-gradient(#5070ff ${progress * 3.6}deg, #e2e8f0 ${progress * 3.6}deg)`;
        }
    }
    
    /**
     * Update session statistics
     */
    updateSessionStats() {
        // Get today's stats from localStorage or calculate
        const today = new Date().toDateString();
        const stats = this.getTodayStats();
        
        if (this.elements.sessionsToday) {
            this.elements.sessionsToday.textContent = stats.sessions || 0;
        }
        
        if (this.elements.focusTimeToday) {
            const hours = Math.floor(stats.focusTime / 3600);
            const minutes = Math.floor((stats.focusTime % 3600) / 60);
            this.elements.focusTimeToday.textContent = `${hours}h ${minutes}m`;
        }
        
    }
    
    /**
     * Get today's statistics
     */
    getTodayStats() {
        try {
            const today = new Date().toDateString();
            const statsKey = `pomodoroStats_${today}`;
            const stats = localStorage.getItem(statsKey);
            
            if (stats) {
                return JSON.parse(stats);
            }
            
            return {
                sessions: this.sessionCount,
                focusTime: this.sessionCount * this.workDuration
            };
        } catch (error) {
            console.error('Error getting today stats:', error);
            return { sessions: 0, focusTime: 0 };
        }
    }
    
    /**
     * Save today's statistics
     */
    saveTodayStats() {
        try {
            const today = new Date().toDateString();
            const statsKey = `pomodoroStats_${today}`;
            const stats = {
                sessions: this.sessionCount,
                focusTime: this.sessionCount * this.workDuration
            };
            
            localStorage.setItem(statsKey, JSON.stringify(stats));
        } catch (error) {
            console.error('Error saving today stats:', error);
        }
    }
}

// Initialize Pomodoro timer when DOM is ready
let pomodoroTimer;
document.addEventListener('DOMContentLoaded', () => {
    const initPomodoroTimer = () => {
        if (window.GoogleSheetsAPIv2 && CONFIG) {
            const googleSheetsAPI = new GoogleSheetsAPIv2(CONFIG);
            pomodoroTimer = new PomodoroTimer(CONFIG, googleSheetsAPI);
        } else {
            setTimeout(initPomodoroTimer, 100);
        }
    };
    
    initPomodoroTimer();
});
