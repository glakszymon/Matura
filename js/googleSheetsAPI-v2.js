/**
 * Enhanced Google Sheets API Integration Class
 * Version 2.0 - Comprehensive data operations for StudyFlow app
 * Handles all interactions with Google Sheets via Google Apps Script Web App
 */
class GoogleSheetsAPIv2 {
    constructor(config) {
        this.config = config;
        this.url = config.GAS_WEB_APP_URL;
        this.spreadsheetId = config.SPREADSHEET_ID;
        this.isLoading = false;
        
        // Initialize debugger integration
        this.debugger = window.gsDebugger || null;
        
        if (!this.url) {
            console.warn('⚠️ Google Apps Script URL not configured');
        }
        
        if (!this.spreadsheetId) {
            console.warn('⚠️ Spreadsheet ID not configured');
        }
    }

    // =============================================
    // TASK OPERATIONS
    // =============================================

    /**
     * Add a new task to the Tasks sheet
     * @param {Object} taskData - Task data
     * @returns {Promise<Object>} Response from Google Apps Script
     */
    async addTask(taskData) {
        const startTime = Date.now();
        
        // Backend expects: [task_name, description, category, subject, correctness, timestamp, session_id]
        const orderedData = [
            taskData.name || '',
            taskData.description || '',
            taskData.category || '',
            taskData.subject || '',
            taskData.correctness ? 'Poprawnie' : 'Błędnie',
            new Date().toISOString(),
            taskData.sessionId || ''
        ];

        try {
            const result = await this.postData('addTask', orderedData);
            const duration = Date.now() - startTime;
            
            if (this.debugger) {
                this.debugger.logDataRetrieved('addTask', 'task_submission', taskData, { duration });
            }
            
            return result;
        } catch (error) {
            if (this.debugger) {
                this.debugger.logError('addTask', error, { taskData, orderedData });
            }
            throw error;
        }
    }

    /**
     * Get all tasks from the Tasks sheet
     * @returns {Promise<Object>} Tasks data
     */
    async getTasks() {
        const startTime = Date.now();
        
        try {
            const response = await this.getData('getTasks');
            const duration = Date.now() - startTime;
            
            if (!response.success) {
                return { success: false, data: [], tasks: [], error: response.error };
            }
            
            // Process tasks data
            const tasks = response.data || [];
            
            if (this.debugger && tasks.length > 0) {
                this.debugger.logDataRetrieved('getTasks', 'tasks', tasks, { duration });
            }
            
            return { success: true, data: tasks, tasks: tasks };
            
        } catch (error) {
            if (this.debugger) {
                this.debugger.logError('getTasks', error);
            }
            return { success: false, data: [], tasks: [], error: error.message };
        }
    }

    // =============================================
    // SUBJECT & CATEGORY OPERATIONS
    // =============================================

    /**
     * Fetch all subjects
     * @returns {Promise<Object>} Subjects data
     */
    async fetchSubjects() {
        const startTime = Date.now();
        
        try {
            const response = await this.getData('getSubjects');
            const duration = Date.now() - startTime;
            
            // Check if the response was successful and has data
            if (!response.success) {
                return { success: false, subjects: [], error: response.error };
            }
            
            // Check if data exists and is an array
            if (!response.data || !Array.isArray(response.data)) {
                return { success: true, subjects: [] };
            }
            
            const processedResponse = {
                success: true,
                subjects: response.data.map(subject => ({
                    name: subject.subject_name || subject.name,
                    subject_name: subject.subject_name,
                    color: subject.color,
                    icon: subject.icon,
                    active: subject.active
                }))
            };
            
            if (this.debugger && processedResponse.subjects.length > 0) {
                this.debugger.logDataRetrieved('fetchSubjects', 'subjects', processedResponse.subjects, { duration });
            }
            
            return processedResponse;
        } catch (error) {
            if (this.debugger) {
                this.debugger.logError('fetchSubjects', error);
            }
            return { success: false, subjects: [], error: error.message };
        }
    }

    /**
     * Fetch categories for a subject
     * @param {string} subjectName - Name of the subject
     * @returns {Promise<Object>} Categories data
     */
    async fetchCategories(subjectName = null) {
        const startTime = Date.now();
        
        try {
            const params = subjectName ? `&subject=${encodeURIComponent(subjectName)}` : '';
            const response = await this.getData('getCategories', params);
            const duration = Date.now() - startTime;
            
            // Check if the response was successful and has data
            if (!response.success) {
                return { success: false, categories: [], error: response.error };
            }
            
            // Check if data exists and is an array
            if (!response.data || !Array.isArray(response.data)) {
                return { success: true, categories: [] };
            }
            
            const processedResponse = {
                success: true,
                categories: response.data.map(category => ({
                    name: category.category_name || category.name,
                    category_name: category.category_name,
                    subject: category.subject_name || category.subject,
                    subject_name: category.subject_name,
                    difficulty: category.difficulty,
                    active: category.active
                }))
            };
            
            if (this.debugger && processedResponse.categories.length > 0) {
                this.debugger.logDataRetrieved('fetchCategories', 'categories', processedResponse.categories, { duration, subjectFilter: subjectName });
            }
            
            return processedResponse;
        } catch (error) {
            if (this.debugger) {
                this.debugger.logError('fetchCategories', error, { subjectFilter: subjectName });
            }
            return { success: false, categories: [], error: error.message };
        }
    }

    // =============================================
    // POMODORO SESSION OPERATIONS
    // =============================================

    /**
     * Add a Pomodoro session
     * @param {Object} sessionData - Session data
     * @returns {Promise<Object>} Response from Google Apps Script
     */
    async addPomodoroSession(sessionData) {
        const orderedData = [
            sessionData.sessionId || this.generateSessionId(),
            sessionData.startTime || new Date().toISOString(),
            sessionData.endTime || new Date().toISOString(),
            sessionData.duration || 25,
            sessionData.subject || '',
            sessionData.category || '',
            sessionData.completed || true,
            sessionData.tasksCompleted || 0
        ];

        const startTime = Date.now();
        
        try {
            const result = await this.postData('addPomodoroSession', orderedData);
            const duration = Date.now() - startTime;
            
            if (this.debugger) {
                this.debugger.logDataRetrieved('addPomodoroSession', 'pomodoro_session', sessionData, { duration });
            }
            
            return result;
        } catch (error) {
            if (this.debugger) {
                this.debugger.logError('addPomodoroSession', error, { sessionData });
            }
            throw error;
        }
    }

    /**
     * Get Pomodoro sessions
     * @returns {Promise<Object>} Sessions data
     */
    async getPomodoroSessions() {
        const startTime = Date.now();
        
        try {
            const response = await this.getData('getPomodoroSessions');
            const duration = Date.now() - startTime;
            
            if (this.debugger && response.success && response.data) {
                this.debugger.logDataRetrieved('getPomodoroSessions', 'sessions', response.data, { duration });
            }
            
            return response;
        } catch (error) {
            if (this.debugger) {
                this.debugger.logError('getPomodoroSessions', error);
            }
            throw error;
        }
    }

    // =============================================
    // ACHIEVEMENT OPERATIONS
    // =============================================

    /**
     * Fetch all achievements (alias for compatibility)
     * @returns {Promise<Object>} Achievements data
     */
    async fetchAchievements() {
        const startTime = Date.now();
        
        try {
            const response = await this.getData('getAchievements');
            const duration = Date.now() - startTime;
            
            // Check if the response was successful and has data
            if (!response.success) {
                return { success: false, data: [], error: response.error };
            }
            
            // Check if data exists and is an array
            if (!response.data || !Array.isArray(response.data)) {
                return { success: true, data: [] };
            }
            
            if (this.debugger && response.data.length > 0) {
                this.debugger.logDataRetrieved('fetchAchievements', 'achievements', response.data, { duration });
            }
            
            return { success: true, data: response.data };
        } catch (error) {
            if (this.debugger) {
                this.debugger.logError('fetchAchievements', error);
            }
            return { success: false, data: [], error: error.message };
        }
    }

    // =============================================
    // ANALYTICS OPERATIONS
    // =============================================

    /**
     * Get analytics data
     * @returns {Promise<Object>} Analytics data
     */
    async getAnalytics() {
        const startTime = Date.now();
        
        try {
            const response = await this.getData('getAnalytics');
            const duration = Date.now() - startTime;
            
            if (this.debugger && response.success && response.data) {
                this.debugger.logDataRetrieved('getAnalytics', 'analytics', response.data, { duration });
            }
            
            return response;
        } catch (error) {
            if (this.debugger) {
                this.debugger.logError('getAnalytics', error);
            }
            throw error;
        }
    }

    // =============================================
    // HELPER METHODS
    // =============================================

    /**
     * Generic GET request to Google Apps Script
     * @param {string} action - Action to perform
     * @param {string} extraParams - Additional URL parameters
     * @returns {Promise<Object>} Response data
     */
    async getData(action, extraParams = '') {
        if (!this.url || !this.spreadsheetId) {
            throw new Error('Google Apps Script URL or Spreadsheet ID not configured');
        }

        const url = `${this.url}?action=${action}&spreadsheetId=${this.spreadsheetId}${extraParams}`;

        try {
            const response = await fetch(url, {
                method: 'GET',
                mode: 'cors',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Generic POST request to Google Apps Script
     * @param {string} action - Action to perform
     * @param {Array} data - Data array to send
     * @returns {Promise<Object>} Response data
     */
    async postData(action, data) {
        if (!this.url || !this.spreadsheetId) {
            throw new Error('Google Apps Script URL or Spreadsheet ID not configured');
        }

        const fd = new FormData();
        fd.append('action', action);
        fd.append('spreadsheetId', this.spreadsheetId);
        fd.append('data', JSON.stringify(data));

        try {
            const response = await fetch(this.url, {
                method: 'POST',
                mode: 'no-cors',
                body: fd
            });

            // Note: no-cors mode means we can't read the response body
            return { success: true, message: `${action} completed successfully` };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Generate unique session ID
     * @returns {string} Session ID
     */
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * Check if a task is correct based on various correctness formats
     * @param {Object} task - Task object
     * @returns {boolean} Whether the task is correct
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

    // =============================================
    // LEGACY COMPATIBILITY METHODS
    // =============================================

    /**
     * Legacy submitData method for backward compatibility
     */
    async submitData(formData) {
        const taskData = {
            name: formData.nazwa,
            category: formData.kategorie,
            subject: formData.przedmiot,
            correctness: formData.poprawnosc === 'Dobrze' || formData.poprawnosc === 'Poprawnie'
        };

        return this.addTask(taskData);
    }

    /**
     * Legacy submitQuickTask method
     */
    async submitQuickTask(taskData) {
        return this.addTask({
            name: taskData.name,
            category: taskData.category,
            subject: taskData.subject,
            correctness: taskData.correctness
        });
    }

    /**
     * Legacy submitPomodoroSession method
     */
    async submitPomodoroSession(sessionData) {
        return this.addPomodoroSession({
            sessionId: sessionData.sessionId,
            startTime: sessionData.startTime,
            endTime: sessionData.endTime,
            duration: sessionData.duration,
            subject: sessionData.subject,
            category: sessionData.category,
            completed: true,
            tasksCompleted: sessionData.tasksCompleted || 0
        });
    }

    /**
     * Get the current loading state
     * @returns {boolean} Whether a submission is in progress
     */
    isSubmitting() {
        return this.isLoading;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GoogleSheetsAPIv2;
}

// Make GoogleSheetsAPIv2 available globally
window.GoogleSheetsAPIv2 = GoogleSheetsAPIv2;

// Global initialization helper
function initializeGoogleSheetsAPI(config) {
    return new GoogleSheetsAPIv2(config);
}

// Also make the helper available globally
window.initializeGoogleSheetsAPI = initializeGoogleSheetsAPI;
