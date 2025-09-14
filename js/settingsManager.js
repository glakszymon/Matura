/**
 * Settings Manager
 * Handles application settings, preferences, and configuration
 */
class SettingsManager {
    constructor(config) {
        this.config = config;
        this.currentSettings = {};
        
        this.init();
    }
    
    /**
     * Initialize settings manager
     */
    init() {
        this.loadCurrentSettings();
        this.setupEventListeners();
        
        // Settings Manager initialized
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Save settings button
        const saveSettingsBtn = document.getElementById('save-settings');
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', () => {
                this.saveSettings();
            });
        }
        
        // Reset progress button
        const resetProgressBtn = document.getElementById('reset-progress');
        if (resetProgressBtn) {
            resetProgressBtn.addEventListener('click', () => {
                this.handleResetProgress();
            });
        }
        
        // Export data button
        const exportDataBtn = document.getElementById('export-data');
        if (exportDataBtn) {
            exportDataBtn.addEventListener('click', () => {
                this.handleExportData();
            });
        }
        
        // Management buttons
        const managementButtons = {
            'manage-subjects': 'subject',
            'manage-categories': 'category',
            'view-all-tasks': 'entries'
        };
        
        Object.entries(managementButtons).forEach(([buttonId, formType]) => {
            const button = document.getElementById(buttonId);
            if (button) {
                button.addEventListener('click', () => {
                    if (window.navigationManager) {
                        window.navigationManager.showForm(formType);
                    }
                });
            }
        });
    }
    
    /**
     * Load current settings from storage and config
     */
    loadCurrentSettings() {
        // Exam settings
        const examDate = localStorage.getItem(this.config.STORAGE_KEYS.EXAM_DATE) || this.config.EXAM.DATE;
        const examName = localStorage.getItem('examName') || this.config.EXAM.NAME;
        const dailyGoal = localStorage.getItem('dailyGoal') || '10';
        
        // Pomodoro settings
        const timerSettings = localStorage.getItem(this.config.STORAGE_KEYS.TIMER_SETTINGS);
        let pomodoroSettings = {
            workDuration: this.config.POMODORO.WORK_DURATION / 60, // Convert to minutes
            shortBreak: this.config.POMODORO.SHORT_BREAK / 60,
            longBreak: this.config.POMODORO.LONG_BREAK / 60,
            soundEnabled: this.config.POMODORO.SOUND_ENABLED
        };
        
        if (timerSettings) {
            try {
                pomodoroSettings = { ...pomodoroSettings, ...JSON.parse(timerSettings) };
            } catch (e) {
                console.log('Error parsing timer settings, using defaults');
            }
        }
        
        // App settings
        const debugMode = localStorage.getItem('debugMode') === 'true' || this.config.DEBUG_MODE;
        
        this.currentSettings = {
            examDate,
            examName,
            dailyGoal: parseInt(dailyGoal),
            ...pomodoroSettings,
            debugMode
        };
        
        // Update UI with current settings
        this.updateSettingsUI();
    }
    
    /**
     * Update settings UI with current values
     */
    updateSettingsUI() {
        // Exam settings
        const examDateInput = document.getElementById('exam-date');
        const examNameInput = document.getElementById('exam-name');
        const dailyGoalInput = document.getElementById('daily-goal');
        
        if (examDateInput) examDateInput.value = this.currentSettings.examDate;
        if (examNameInput) examNameInput.value = this.currentSettings.examName;
        if (dailyGoalInput) dailyGoalInput.value = this.currentSettings.dailyGoal;
        
        // Pomodoro settings
        const workDurationInput = document.getElementById('work-duration');
        const shortBreakInput = document.getElementById('short-break');
        const longBreakInput = document.getElementById('long-break');
        const soundEnabledInput = document.getElementById('sound-enabled');
        
        if (workDurationInput) workDurationInput.value = this.currentSettings.workDuration;
        if (shortBreakInput) shortBreakInput.value = this.currentSettings.shortBreak;
        if (longBreakInput) longBreakInput.value = this.currentSettings.longBreak;
        if (soundEnabledInput) soundEnabledInput.checked = this.currentSettings.soundEnabled;
        
        // App settings
        const debugModeInput = document.getElementById('debug-mode');
        if (debugModeInput) debugModeInput.checked = this.currentSettings.debugMode;
    }
    
    /**
     * Save settings
     */
    saveSettings() {
        try {
            // Get values from form
            const newSettings = this.getSettingsFromForm();
            
            // Validate settings
            const validation = this.validateSettings(newSettings);
            if (!validation.isValid) {
                this.showError(validation.message);
                return;
            }
            
            // Save to local storage
            this.saveSettingsToStorage(newSettings);
            
            // Update current settings
            this.currentSettings = newSettings;
            
            // Apply settings to application
            this.applySettings(newSettings);
            
            // Show success message
            this.showSuccess('Ustawienia zostały zapisane pomyślnie!');
            
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showError('Błąd podczas zapisywania ustawień');
        }
    }
    
    /**
     * Get settings values from form inputs
     */
    getSettingsFromForm() {
        return {
            examDate: document.getElementById('exam-date')?.value || this.currentSettings.examDate,
            examName: document.getElementById('exam-name')?.value || this.currentSettings.examName,
            dailyGoal: parseInt(document.getElementById('daily-goal')?.value) || this.currentSettings.dailyGoal,
            workDuration: parseInt(document.getElementById('work-duration')?.value) || this.currentSettings.workDuration,
            shortBreak: parseInt(document.getElementById('short-break')?.value) || this.currentSettings.shortBreak,
            longBreak: parseInt(document.getElementById('long-break')?.value) || this.currentSettings.longBreak,
            soundEnabled: document.getElementById('sound-enabled')?.checked || this.currentSettings.soundEnabled,
            debugMode: document.getElementById('debug-mode')?.checked || this.currentSettings.debugMode
        };
    }
    
    /**
     * Validate settings
     */
    validateSettings(settings) {
        const errors = [];
        
        // Validate exam date
        if (!settings.examDate) {
            errors.push('Data egzaminu jest wymagana');
        } else {
            const examDate = new Date(settings.examDate);
            const today = new Date();
            if (examDate < today) {
                errors.push('Data egzaminu nie może być w przeszłości');
            }
        }
        
        // Validate daily goal
        if (settings.dailyGoal < 1 || settings.dailyGoal > 100) {
            errors.push('Dzienny cel musi być między 1 a 100 zadań');
        }
        
        // Validate Pomodoro timers
        if (settings.workDuration < 5 || settings.workDuration > 60) {
            errors.push('Czas pracy musi być między 5 a 60 minut');
        }
        
        if (settings.shortBreak < 1 || settings.shortBreak > 15) {
            errors.push('Krótka przerwa musi być między 1 a 15 minut');
        }
        
        if (settings.longBreak < 15 || settings.longBreak > 60) {
            errors.push('Długa przerwa musi być między 15 a 60 minut');
        }
        
        return {
            isValid: errors.length === 0,
            message: errors.join(', ')
        };
    }
    
    /**
     * Save settings to local storage
     */
    saveSettingsToStorage(settings) {
        // Exam settings
        localStorage.setItem(this.config.STORAGE_KEYS.EXAM_DATE, settings.examDate);
        localStorage.setItem('examName', settings.examName);
        localStorage.setItem('dailyGoal', settings.dailyGoal.toString());
        
        // Pomodoro settings
        const timerSettings = {
            workDuration: settings.workDuration,
            shortBreak: settings.shortBreak,
            longBreak: settings.longBreak,
            soundEnabled: settings.soundEnabled
        };
        localStorage.setItem(this.config.STORAGE_KEYS.TIMER_SETTINGS, JSON.stringify(timerSettings));
        
        // App settings
        localStorage.setItem('debugMode', settings.debugMode.toString());
    }
    
    /**
     * Apply settings to the application
     */
    applySettings(settings) {
        // Update exam countdown
        if (window.countdownTimer) {
            window.countdownTimer.setExamDate(settings.examDate);
        }
        
        // Update Pomodoro timer settings (would need to be implemented in PomodoroTimer)
        if (window.pomodoroTimer) {
            // This would require updating the PomodoroTimer class
            console.log('Applying Pomodoro settings:', {
                workDuration: settings.workDuration * 60, // Convert back to seconds
                shortBreak: settings.shortBreak * 60,
                longBreak: settings.longBreak * 60,
                soundEnabled: settings.soundEnabled
            });
        }
        
        // Update debug mode
        CONFIG.DEBUG_MODE = settings.debugMode;
        
        console.log('Settings applied:', settings);
    }
    
    /**
     * Handle reset progress confirmation
     */
    handleResetProgress() {
        const confirmation = confirm(
            'Czy na pewno chcesz zresetować cały postęp?\\n\\n' +
            'Ta akcja usunie:\\n' +
            '• Aktualną passę i punkty\\n' +
            '• Wszystkie odblokowane osiągnięcia\\n' +
            '• Statystyki sesji Pomodoro\\n' +
            '• Lokalne dane analityki\\n\\n' +
            'UWAGA: Dane w Google Sheets pozostaną nienaruszone.\\n\\n' +
            'Tej operacji nie można cofnąć!'
        );
        
        if (confirmation) {
            this.resetAllProgress();
        }
    }
    
    /**
     * Reset all progress data
     */
    resetAllProgress() {
        try {
            // Reset streak manager
            if (window.streakManager) {
                window.streakManager.resetAllProgress();
            }
            
            // Reset achievements
            if (window.achievementSystem) {
                window.achievementSystem.resetAllAchievements();
            }
            
            // Clear Pomodoro sessions
            const today = new Date().toISOString().split('T')[0];
            for (let i = 0; i < 365; i++) { // Clear last year
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateKey = date.toISOString().split('T')[0];
                localStorage.removeItem(`pomodoro_sessions_${dateKey}`);
                localStorage.removeItem(`tasks_${dateKey}`);
            }
            
            // Clear analytics data
            localStorage.removeItem('analyticsData');
            
            // Clear settings (except exam date and preferences)
            const preservedSettings = ['examDate', 'examName', 'dailyGoal', 'timerSettings', 'debugMode'];
            Object.keys(localStorage).forEach(key => {
                if (!preservedSettings.includes(key) && !key.startsWith('warp_')) {
                    localStorage.removeItem(key);
                }
            });
            
            this.showSuccess('Wszystkie dane postępu zostały zresetowane!');
            
            // Refresh current page to reflect changes
            if (window.navigationManager) {
                window.location.reload();
            }
            
        } catch (error) {
            console.error('Error resetting progress:', error);
            this.showError('Błąd podczas resetowania postępu');
        }
    }
    
    /**
     * Handle data export
     */
    handleExportData() {
        try {
            const exportData = this.generateExportData();
            this.downloadExportFile(exportData);
            this.showSuccess('Dane zostały wyeksportowane pomyślnie!');
            
        } catch (error) {
            console.error('Error exporting data:', error);
            this.showError('Błąd podczas eksportowania danych');
        }
    }
    
    /**
     * Generate export data
     */
    generateExportData() {
        const exportData = {
            exportDate: new Date().toISOString(),
            appVersion: '2.0',
            settings: this.currentSettings,
            streak: {
                current: window.streakManager?.getCurrentStreak() || 0,
                totalPoints: window.streakManager?.getTotalPoints() || 0,
                lastActivity: localStorage.getItem(this.config.STORAGE_KEYS.LAST_ACTIVITY_DATE)
            },
            achievements: {
                unlocked: JSON.parse(localStorage.getItem(this.config.STORAGE_KEYS.UNLOCKED_ACHIEVEMENTS) || '[]'),
                stats: window.achievementSystem?.getAchievementStats() || {}
            },
            pomodoroSessions: {},
            tasks: {}
        };
        
        // Export Pomodoro sessions from last 30 days
        for (let i = 0; i < 30; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateKey = date.toISOString().split('T')[0];
            const sessions = localStorage.getItem(`pomodoro_sessions_${dateKey}`);
            if (sessions) {
                exportData.pomodoroSessions[dateKey] = JSON.parse(sessions);
            }
            
            const tasks = localStorage.getItem(`tasks_${dateKey}`);
            if (tasks) {
                exportData.tasks[dateKey] = JSON.parse(tasks);
            }
        }
        
        return exportData;
    }
    
    /**
     * Download export file
     */
    downloadExportFile(data) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        a.href = url;
        a.download = `studyflow-export-${new Date().toISOString().split('T')[0]}.json`;
        a.style.display = 'none';
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    }
    
    /**
     * Show success message
     */
    showSuccess(message) {
        if (window.navigationManager) {
            window.navigationManager.showMessage(message, 'success');
        } else {
            console.log('Success:', message);
        }
    }
    
    /**
     * Show error message
     */
    showError(message) {
        if (window.navigationManager) {
            window.navigationManager.showMessage(message, 'error');
        } else {
            console.error('Settings Error:', message);
        }
    }
    
    /**
     * Get current settings
     */
    getCurrentSettings() {
        return this.currentSettings;
    }
    
    /**
     * Update specific setting
     */
    updateSetting(key, value) {
        this.currentSettings[key] = value;
        this.saveSettingsToStorage(this.currentSettings);
        this.applySettings(this.currentSettings);
    }
}

// Initialize settings manager when DOM is ready
let settingsManager;
document.addEventListener('DOMContentLoaded', () => {
    settingsManager = new SettingsManager(CONFIG);
});
