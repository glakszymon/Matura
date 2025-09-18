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
    // STUDY SESSION OPERATIONS
    // =============================================

    /**
     * Get all study sessions from the StudySessions sheet
     * @returns {Promise<Object>} Study sessions data
     */
    async getStudySessions() {
        const startTime = Date.now();
        
        // Check if demo mode is enabled
        if (this.config.DEMO_MODE) {
            console.log('%c📅 [DEMO MODE] Returning demo StudySessions data', 'color: #f59e0b; font-weight: bold;');
            const demoSessions = this.getDemoStudySessionsData();
            
            return {
                success: true,
                sessions: demoSessions,
                data: demoSessions
            };
        }
        
        try {
            const response = await this.getData('getStudySessions');
            const duration = Date.now() - startTime;
            
            if (!response.success) {
                return { success: false, sessions: [], error: response.error };
            }
            
            // Process sessions data
            const sessions = response.data || [];
            
            if (this.debugger && sessions.length > 0) {
                this.debugger.logDataRetrieved('getStudySessions', 'study_sessions', sessions, { duration });
            }
            
            return { success: true, sessions: sessions, data: sessions };
            
        } catch (error) {
            if (this.debugger) {
                this.debugger.logError('getStudySessions', error);
            }
            return { success: false, sessions: [], error: error.message };
        }
    }

    /**
     * Get study tasks for a specific session or all tasks
     * @param {string} sessionId - Optional session ID to filter by
     * @returns {Promise<Object>} Study tasks data
     */
    async getStudyTasks(sessionId = null) {
        const startTime = Date.now();
        
        // Check if demo mode is enabled
        if (this.config.DEMO_MODE) {
            console.log('%c📋 [DEMO MODE] Returning demo StudyTasks data', 'color: #f59e0b; font-weight: bold;');
            const demoTasks = this.getDemoStudyTasksData();
            const filteredTasks = sessionId ? demoTasks.filter(task => task.session_id === sessionId) : demoTasks;
            
            return {
                success: true,
                tasks: filteredTasks,
                data: filteredTasks
            };
        }
        
        try {
            const params = sessionId ? `&sessionId=${encodeURIComponent(sessionId)}` : '';
            const response = await this.getData('getStudyTasks', params);
            const duration = Date.now() - startTime;
            
            if (!response.success) {
                return { success: false, tasks: [], error: response.error };
            }
            
            // Process tasks data
            const tasks = response.data || [];
            
            if (this.debugger && tasks.length > 0) {
                this.debugger.logDataRetrieved('getStudyTasks', 'study_tasks', tasks, { duration, sessionFilter: sessionId });
            }
            
            return { success: true, tasks: tasks, data: tasks };
            
        } catch (error) {
            if (this.debugger) {
                this.debugger.logError('getStudyTasks', error, { sessionFilter: sessionId });
            }
            return { success: false, tasks: [], error: error.message };
        }
    }

    /**
     * Add a study session to the StudySessions sheet
     * @param {Object} sessionData - Session data
     * @returns {Promise<Object>} Response from Google Apps Script
     */
    async addStudySession(sessionData) {
        const startTime = Date.now();
        
        // Backend expects: [session_id, start_time, end_time, duration_minutes, total_tasks, correct_tasks, accuracy_percentage, notes]
        const orderedData = [
            sessionData.session_id || this.generateSessionId(),
            sessionData.start_time || new Date().toISOString(),
            sessionData.end_time || new Date().toISOString(),
            sessionData.duration_minutes || 0,
            sessionData.total_tasks || 0,
            sessionData.correct_tasks || 0,
            sessionData.accuracy_percentage || 0,
            sessionData.notes || ''
        ];

        try {
            const result = await this.postData('addStudySession', orderedData);
            const duration = Date.now() - startTime;
            
            if (this.debugger) {
                this.debugger.logDataRetrieved('addStudySession', 'study_session_submission', sessionData, { duration });
            }
            
            return result;
        } catch (error) {
            if (this.debugger) {
                this.debugger.logError('addStudySession', error, { sessionData, orderedData });
            }
            throw error;
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

    /**
     * Get daily statistics for analytics
     * @returns {Promise<Object>} Daily stats data
     */
    async getDailyStats() {
        const startTime = Date.now();
        
        // Check if demo mode is enabled
        if (this.config.DEMO_MODE) {
            console.log('%c📊 [DEMO MODE] Returning demo DailyStats data', 'color: #f59e0b; font-weight: bold;');
            const demoDailyStats = this.getDemoDailyStatsData();
            
            return {
                success: true,
                stats: demoDailyStats,
                data: demoDailyStats
            };
        }
        
        try {
            const response = await this.getData('getDailyStats');
            const duration = Date.now() - startTime;
            
            if (!response.success) {
                return { success: false, stats: [], error: response.error };
            }
            
            // Process stats data
            const stats = response.data || [];
            
            if (this.debugger && stats.length > 0) {
                this.debugger.logDataRetrieved('getDailyStats', 'daily_stats', stats, { duration });
            }
            
            return { success: true, stats: stats, data: stats };
            
        } catch (error) {
            if (this.debugger) {
                this.debugger.logError('getDailyStats', error);
            }
            return { success: false, stats: [], error: error.message };
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
     * Submit a study task to the StudyTasks sheet
     * @param {Object} taskData - Study task data
     * @returns {Promise<Object>} Response from Google Apps Script
     */
    async submitStudyTask(taskData) {
        const startTime = Date.now();
        
        // Backend expects: [task_id, task_name, description, categories, correctly_completed, start_time, end_time, location, subject, session_id]
        const orderedData = [
            taskData.task_id || this.generateTaskId(),
            taskData.task_name || '',
            taskData.description || '',
            taskData.categories || '',
            // Convert boolean to Yes/No string for Google Sheets
            this.convertCorrectnessToString(taskData.correctly_completed),
            taskData.start_time || new Date().toISOString(),
            taskData.end_time || new Date().toISOString(),
            taskData.location || '',
            taskData.subject || '',
            taskData.session_id || ''
        ];

        // Debug logging to help diagnose data issues
        console.log('%c📋 [DEBUG] StudyTask Submission Data:', 'color: #7c3aed; font-weight: bold;');
        console.log('Original taskData:', taskData);
        console.log('Ordered data for Google Sheets:', orderedData);
        console.log('Data mapping:');
        console.log('  task_id:', orderedData[0]);
        console.log('  task_name:', orderedData[1]);
        console.log('  description:', orderedData[2]);
        console.log('  categories:', orderedData[3]);
        console.log('  correctly_completed:', orderedData[4]);
        console.log('  start_time:', orderedData[5]);
        console.log('  end_time:', orderedData[6]);
        console.log('  location:', orderedData[7]);
        console.log('  subject:', orderedData[8]);
        console.log('  session_id:', orderedData[9]);
        
        try {
            const result = await this.postData('addStudyTask', orderedData);
            const duration = Date.now() - startTime;
            
            if (this.debugger) {
                this.debugger.logDataRetrieved('addStudyTask', 'study_task_submission', taskData, { duration });
            }
            
            return result;
        } catch (error) {
            if (this.debugger) {
                this.debugger.logError('addStudyTask', error, { taskData, orderedData });
            }
            throw error;
        }
    }

    /**
     * Add a study task to the StudyTasks sheet (alias for submitStudyTask)
     * @param {Object} taskData - Study task data
     * @returns {Promise<Object>} Response from Google Apps Script
     */
    async addStudyTask(taskData) {
        return this.submitStudyTask(taskData);
    }

    /**
     * Generate unique task ID
     * @returns {string} Task ID
     */
    generateTaskId() {
        return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
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
    
    /**
     * Get demo StudyTasks data for testing
     * @returns {Array} Demo tasks data
     */
    getDemoStudyTasksData() {
        return [
            {
                task_id: 'demo_task_1',
                task_name: 'Równania liniowe - zadanie 1',
                description: 'Rozwiązywanie równań liniowych z jedną niewiadomą',
                categories: 'Algebra, Równania',
                correctly_completed: 'Yes',
                start_time: '2024-01-15T10:00:00Z',
                end_time: '2024-01-15T10:15:00Z',
                location: 'Dom',
                subject: 'Matematyka',
                session_id: 'session_demo_1'
            },
            {
                task_id: 'demo_task_2',
                task_name: 'Analiza części mowy',
                description: 'Rozpoznawanie rzeczowników w tekście',
                categories: 'Części mowy, Składnia',
                correctly_completed: 'No',
                start_time: '2024-01-15T11:00:00Z',
                end_time: '2024-01-15T11:20:00Z',
                location: 'Biblioteka',
                subject: 'Polski',
                session_id: 'session_demo_2'
            },
            {
                task_id: 'demo_task_3',
                task_name: 'Present Simple vs Present Continuous',
                description: 'Ćwiczenia z czasów teraźniejszych',
                categories: 'Grammar, Tenses',
                correctly_completed: 'Yes',
                start_time: '2024-01-15T12:00:00Z',
                end_time: '2024-01-15T12:25:00Z',
                location: 'Dom',
                subject: 'Angielski',
                session_id: 'session_demo_3'
            },
            {
                task_id: 'demo_task_4',
                task_name: 'Funkcje kwadratowe',
                description: 'Wykresy i właściwości funkcji kwadratowych',
                categories: 'Algebra, Funkcje',
                correctly_completed: 'Yes',
                start_time: '2024-01-15T13:00:00Z',
                end_time: '2024-01-15T13:30:00Z',
                location: 'Dom',
                subject: 'Matematyka',
                session_id: 'session_demo_1'
            },
            {
                task_id: 'demo_task_5',
                task_name: 'Wypracowanie - opis krajobrazu',
                description: 'Pisanie opisu krajobrazu z użyciem środków stylistycznych',
                categories: 'Essays, World War',
                correctly_completed: 'No',
                start_time: '2024-01-15T14:00:00Z',
                end_time: '2024-01-15T14:45:00Z',
                location: 'Szkoła',
                subject: 'Historia',
                session_id: 'session_demo_4'
            },
            {
                task_id: 'demo_task_6',
                task_name: 'II Wojna Światowa - przyczyny',
                description: 'Analiza przyczyn wybuchu II wojny światowej',
                categories: 'Essays, World War',
                correctly_completed: 'Yes',
                start_time: '2024-01-15T15:00:00Z',
                end_time: '2024-01-15T15:40:00Z',
                location: 'Dom',
                subject: 'Historia',
                session_id: 'session_demo_4'
            },
            {
                task_id: 'demo_task_7',
                task_name: 'Genetyka - prawo Mendla',
                description: 'Zadania z dziedziczenia cech u organizmów',
                categories: 'Genetyka, DNA, Mendel',
                correctly_completed: 'Yes',
                start_time: '2024-01-16T09:00:00Z',
                end_time: '2024-01-16T09:35:00Z',
                location: 'Szkoła',
                subject: 'Biologia',
                session_id: 'session_demo_5'
            },
            {
                task_id: 'demo_task_8',
                task_name: 'Składnia zdania złożonego',
                description: 'Analiza składniowa zdań złożonych współrzędnie',
                categories: 'Składnia, Części mowy',
                correctly_completed: 'No',
                start_time: '2024-01-16T10:00:00Z',
                end_time: '2024-01-16T10:25:00Z',
                location: 'Dom',
                subject: 'Polski',
                session_id: 'session_demo_2'
            }
        ];
    }
    
    /**
     * Get demo StudySessions data for testing
     * @returns {Array} Demo sessions data
     */
    getDemoStudySessionsData() {
        return [
            {
                session_id: 'session_demo_1',
                start_time: '2024-01-15T10:00:00Z',
                end_time: '2024-01-15T13:30:00Z',
                duration_minutes: 210,
                total_tasks: 2,
                correct_tasks: 2,
                accuracy_percentage: 100,
                notes: 'Sesja matematyki - bardzo dobra koncentracja'
            },
            {
                session_id: 'session_demo_2',
                start_time: '2024-01-15T11:00:00Z',
                end_time: '2024-01-16T10:25:00Z',
                duration_minutes: 45,
                total_tasks: 2,
                correct_tasks: 0,
                accuracy_percentage: 0,
                notes: 'Sesja języka polskiego - trudności z analizą składniową'
            },
            {
                session_id: 'session_demo_3',
                start_time: '2024-01-15T12:00:00Z',
                end_time: '2024-01-15T12:25:00Z',
                duration_minutes: 25,
                total_tasks: 1,
                correct_tasks: 1,
                accuracy_percentage: 100,
                notes: 'Sesja języka angielskiego - gramatyka dobrze zrozumiana'
            },
            {
                session_id: 'session_demo_4',
                start_time: '2024-01-15T14:00:00Z',
                end_time: '2024-01-15T15:40:00Z',
                duration_minutes: 100,
                total_tasks: 2,
                correct_tasks: 1,
                accuracy_percentage: 50,
                notes: 'Sesja historii - potrzeba więcej pracy z wypracowaniami'
            },
            {
                session_id: 'session_demo_5',
                start_time: '2024-01-16T09:00:00Z',
                end_time: '2024-01-16T09:35:00Z',
                duration_minutes: 35,
                total_tasks: 1,
                correct_tasks: 1,
                accuracy_percentage: 100,
                notes: 'Sesja biologii - genetyka dobrze opanowana'
            }
        ];
    }
    
    /**
     * Get demo DailyStats data for testing
     * @returns {Array} Demo daily stats data
     */
    getDemoDailyStatsData() {
        return [
            {
                date: '2024-01-15',
                total_tasks: 6,
                correct_tasks: 4,
                accuracy_percentage: 67,
                total_study_time: 360,
                sessions_count: 4,
                subjects: ['Matematyka', 'Polski', 'Angielski', 'Historia'],
                top_subject: 'Matematyka',
                most_difficult_categories: ['Składnia', 'Essays']
            },
            {
                date: '2024-01-16',
                total_tasks: 2,
                correct_tasks: 1,
                accuracy_percentage: 50,
                total_study_time: 60,
                sessions_count: 2,
                subjects: ['Biologia', 'Polski'],
                top_subject: 'Biologia',
                most_difficult_categories: ['Składnia']
            },
            {
                date: '2024-01-14',
                total_tasks: 4,
                correct_tasks: 3,
                accuracy_percentage: 75,
                total_study_time: 180,
                sessions_count: 2,
                subjects: ['Matematyka', 'Fizyka'],
                top_subject: 'Matematyka',
                most_difficult_categories: ['Mechanika']
            },
            {
                date: '2024-01-13',
                total_tasks: 3,
                correct_tasks: 3,
                accuracy_percentage: 100,
                total_study_time: 120,
                sessions_count: 2,
                subjects: ['Angielski', 'Historia'],
                top_subject: 'Angielski',
                most_difficult_categories: []
            },
            {
                date: '2024-01-12',
                total_tasks: 5,
                correct_tasks: 2,
                accuracy_percentage: 40,
                total_study_time: 240,
                sessions_count: 3,
                subjects: ['Polski', 'Historia', 'Biologia'],
                top_subject: 'Historia',
                most_difficult_categories: ['Składnia', 'Genetyka']
            }
        ];
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
