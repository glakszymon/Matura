/**
 * Google Sheets API Integration Class
 * Handles form data submission to Google Sheets via Google Apps Script Web App
 */
class GoogleSheetsAPI {
    constructor(config) {
        this.config = config;
        this.isLoading = false;
        
        // Initialize debugger integration
        this.debugger = window.gsDebugger || null;
    }

    /**
     * Submit form data to Google Sheets
     * @param {Object} formData - Form data object with keys matching sheet columns
     * @returns {Promise<Object>} Response from the Google Apps Script
     */
    async submitData(formData) {
        if (this.isLoading) {
            throw new Error('Submission already in progress');
        }

        if (!this.config.GAS_WEB_APP_URL) {
            throw new Error('Google Apps Script Web App URL not configured');
        }

        this.isLoading = true;
        const startTime = Date.now();

        try {
            // Prepare data in the correct order for Google Sheets
            const orderedData = this.prepareDataForSheets(formData);

            // Use FormData and no explicit Content-Type to avoid CORS preflight.
            // Use no-cors mode because Google Apps Script cannot reliably set CORS headers for JSON.
            const fd = new FormData();
            fd.append('spreadsheetId', this.config.SPREADSHEET_ID);
            fd.append('sheetName', this.config.SHEETS.MAIN_FORM.SHEET_NAME);
            fd.append('range', this.config.SHEETS.MAIN_FORM.RANGE);
            fd.append('data', JSON.stringify(orderedData));
            fd.append('formType', 'main');

            const response = await fetch(this.config.GAS_WEB_APP_URL, {
                method: 'POST',
                mode: 'no-cors',
                body: fd
            });

            const duration = Date.now() - startTime;
            
            // Log successful data submission
            if (this.debugger) {
                this.debugger.logDataRetrieved('submitData', 'form_submission', formData, { duration });
            }

            // In no-cors mode, the response is opaque; we cannot read status or body.
            // Assume success if the network request did not throw. Actual failures will be visible in Apps Script logs.
            return {
                success: true,
                message: this.config.UI.SUCCESS_MESSAGE,
                data: { opaque: true }
            };

        } catch (error) {
            if (this.debugger) {
                this.debugger.logError('submitData', error, { formData });
            }
            console.error('Error submitting to Google Sheets:', error);
            throw new Error(this.config.UI.ERROR_MESSAGE);
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Prepare form data in the correct order for Google Sheets columns
     * @param {Object} formData - Form data object
     * @returns {Array} Array of values in correct column order
     */
    prepareDataForSheets(formData) {
        // Order should match: Nazwa, Treść, Poprawność, Kategorie, Przedmiot
        return [
            formData.nazwa || '',
            formData.tresc || '',
            formData.poprawnosc || '',
            formData.kategorie || '',
            formData.przedmiot || ''
        ];
    }

    /**
     * Submit quick task data (simplified task submission)
     * @param {Object} taskData - Quick task data
     * @returns {Promise<Object>} Response from the Google Apps Script
     */
    async submitQuickTask(taskData) {
        // Convert quick task format to main form format
        const formData = {
            nazwa: taskData.name,
            tresc: `Szybkie zadanie: ${taskData.name}`,
            poprawnosc: taskData.correctness ? 'Dobrze' : 'Źle',
            kategorie: taskData.category,
            przedmiot: taskData.subject
        };

        return this.submitData(formData);
    }

    /**
     * Submit Pomodoro session data to Google Sheets
     * @param {Object} sessionData - Pomodoro session data
     * @returns {Promise<Object>} Response from the Google Apps Script
     */
    async submitPomodoroSession(sessionData) {
        if (!this.config.GAS_WEB_APP_URL) {
            throw new Error('Google Apps Script Web App URL not configured');
        }

        const startTime = Date.now();

        try {
            const orderedData = [
                sessionData.category || '',
                sessionData.subject || '',
                sessionData.duration || 25,
                sessionData.startTime || new Date().toISOString(),
                sessionData.endTime || new Date().toISOString(),
                sessionData.notes || ''
            ];

            const fd = new FormData();
            fd.append('spreadsheetId', this.config.SPREADSHEET_ID);
            fd.append('sheetName', this.config.SHEETS.POMODORO_SESSIONS?.SHEET_NAME || 'PomodoroSessions');
            fd.append('range', this.config.SHEETS.POMODORO_SESSIONS?.RANGE || 'A:F');
            fd.append('data', JSON.stringify(orderedData));
            fd.append('formType', 'pomodoro');

            const response = await fetch(this.config.GAS_WEB_APP_URL, {
                method: 'POST',
                mode: 'no-cors',
                body: fd
            });

            const duration = Date.now() - startTime;
            
            if (this.debugger) {
                this.debugger.logDataRetrieved('submitPomodoroSession', 'pomodoro_session', sessionData, { duration });
            }

            return {
                success: true,
                message: 'Sesja Pomodoro zapisana pomyślnie',
                data: { opaque: true }
            };

        } catch (error) {
            if (this.debugger) {
                this.debugger.logError('submitPomodoroSession', error, { sessionData });
            }
            console.error('Error submitting Pomodoro session:', error);
            throw new Error('Błąd podczas zapisywania sesji Pomodoro');
        }
    }

    /**
     * Validate form data before submission
     * @param {Object} formData - Form data to validate
     * @returns {Object} Validation result with isValid flag and errors array
     */
    validateFormData(formData) {
        const errors = [];
        const fields = this.config.FORM_FIELDS;

        // Check required fields
        Object.keys(fields).forEach(fieldKey => {
            const field = fields[fieldKey];
            const value = formData[fieldKey];

            if (field.required && (!value || value.trim() === '')) {
                errors.push(`${field.label} jest wymagane`);
            }

            if (value && field.maxLength && value.length > field.maxLength) {
                errors.push(`${field.label} nie może przekraczać ${field.maxLength} znaków`);
            }
        });

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Fetch categories from Google Sheets
     * @returns {Promise<Object>} Response with categories data
     */
    async fetchCategories() {
        if (!this.config.GAS_WEB_APP_URL) {
            throw new Error('Google Apps Script Web App URL not configured');
        }

        const startTime = Date.now();

        try {
            const url = `${this.config.GAS_WEB_APP_URL}?action=getCategories&spreadsheetId=${encodeURIComponent(this.config.SPREADSHEET_ID)}`;

            const response = await fetch(url, {
                method: 'GET',
                mode: 'cors'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const duration = Date.now() - startTime;

            if (this.debugger && data.success && data.categories) {
                this.debugger.logDataRetrieved('fetchCategories', 'categories', data.categories, { duration });
            }

            return data;

        } catch (error) {
            if (this.debugger) {
                this.debugger.logError('fetchCategories', error);
            }
            console.error('Error fetching categories:', error);
            return {
                success: false,
                message: 'Error fetching categories',
                categories: []
            };
        }
    }

    /**
     * Fetch subjects from Google Sheets
     * @returns {Promise<Object>} Response with subjects data
     */
    async fetchSubjects() {
        if (!this.config.GAS_WEB_APP_URL) {
            throw new Error('Google Apps Script Web App URL not configured');
        }

        const startTime = Date.now();

        try {
            const url = `${this.config.GAS_WEB_APP_URL}?action=getSubjects&spreadsheetId=${encodeURIComponent(this.config.SPREADSHEET_ID)}`;

            const response = await fetch(url, {
                method: 'GET',
                mode: 'cors'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const duration = Date.now() - startTime;

            if (this.debugger && data.success && data.subjects) {
                this.debugger.logDataRetrieved('fetchSubjects', 'subjects', data.subjects, { duration });
            }

            return data;

        } catch (error) {
            if (this.debugger) {
                this.debugger.logError('fetchSubjects', error);
            }
            console.error('Error fetching subjects:', error);
            return {
                success: false,
                message: 'Error fetching subjects',
                subjects: []
            };
        }
    }

    /**
     * Get a single category by ID
     * @param {string} categoryId - The ID of the category to get
     * @returns {Promise<Object>} Response from the Google Apps Script
     */
    async getCategory(categoryId) {
        if (!this.config.GAS_WEB_APP_URL) {
            throw new Error('Google Apps Script Web App URL not configured');
        }

        const startTime = Date.now();

        try {
            const url = `${this.config.GAS_WEB_APP_URL}?action=getCategory&id=${encodeURIComponent(categoryId)}&spreadsheetId=${encodeURIComponent(this.config.SPREADSHEET_ID)}`;
            
            const response = await fetch(url, {
                method: 'GET',
                mode: 'cors'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const duration = Date.now() - startTime;

            if (this.debugger && data.success && data.category) {
                this.debugger.logDataRetrieved('getCategory', 'category', data.category, { duration, categoryId });
            }

            return data;

        } catch (error) {
            if (this.debugger) {
                this.debugger.logError('getCategory', error, { categoryId });
            }
            console.error('Error getting category:', error);
            return {
                success: false,
                message: 'Error getting category'
            };
        }
    }

    /**
     * Fetch study tasks from Google Sheets for analytics
     * @returns {Promise<Object>} Response with study tasks data
     */
    async getStudyTasks() {
        if (!this.config.GAS_WEB_APP_URL) {
            throw new Error('Google Apps Script Web App URL not configured');
        }

        const startTime = Date.now();

        try {
            const url = `${this.config.GAS_WEB_APP_URL}?action=getStudyTasks&spreadsheetId=${encodeURIComponent(this.config.SPREADSHEET_ID)}`;

            const response = await fetch(url, {
                method: 'GET',
                mode: 'cors'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const duration = Date.now() - startTime;

            if (this.debugger && data.success && data.tasks) {
                this.debugger.logDataRetrieved('getStudyTasks', 'study_tasks', data.tasks, { duration });
            }

            return {
                success: data.success || true,
                data: data.tasks || data.data || [],
                tasks: data.tasks || data.data || []
            };

        } catch (error) {
            if (this.debugger) {
                this.debugger.logError('getStudyTasks', error);
            }
            console.error('Error fetching study tasks:', error);
            
            // Return demo data for testing if in demo mode
            if (this.config.DEMO_MODE) {
                return {
                    success: true,
                    tasks: this.generateDemoStudyTasks(),
                    data: this.generateDemoStudyTasks()
                };
            }
            
            return {
                success: false,
                message: 'Error fetching study tasks',
                tasks: [],
                data: []
            };
        }
    }

    /**
     * Fetch study sessions from Google Sheets for analytics
     * @returns {Promise<Object>} Response with study sessions data
     */
    async getStudySessions() {
        if (!this.config.GAS_WEB_APP_URL) {
            throw new Error('Google Apps Script Web App URL not configured');
        }

        const startTime = Date.now();

        try {
            const url = `${this.config.GAS_WEB_APP_URL}?action=getStudySessions&spreadsheetId=${encodeURIComponent(this.config.SPREADSHEET_ID)}`;

            const response = await fetch(url, {
                method: 'GET',
                mode: 'cors'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const duration = Date.now() - startTime;

            if (this.debugger && data.success && data.sessions) {
                this.debugger.logDataRetrieved('getStudySessions', 'study_sessions', data.sessions, { duration });
            }

            return {
                success: data.success || true,
                data: data.sessions || data.data || [],
                sessions: data.sessions || data.data || []
            };

        } catch (error) {
            if (this.debugger) {
                this.debugger.logError('getStudySessions', error);
            }
            console.error('Error fetching study sessions:', error);
            
            // Return demo data for testing if in demo mode
            if (this.config.DEMO_MODE) {
                return {
                    success: true,
                    sessions: this.generateDemoStudySessions(),
                    data: this.generateDemoStudySessions()
                };
            }
            
            return {
                success: false,
                message: 'Error fetching study sessions',
                sessions: [],
                data: []
            };
        }
    }

    /**
     * Fetch daily statistics from Google Sheets for analytics
     * @returns {Promise<Object>} Response with daily stats data
     */
    async getDailyStats() {
        if (!this.config.GAS_WEB_APP_URL) {
            throw new Error('Google Apps Script Web App URL not configured');
        }

        const startTime = Date.now();

        try {
            const url = `${this.config.GAS_WEB_APP_URL}?action=getDailyStats&spreadsheetId=${encodeURIComponent(this.config.SPREADSHEET_ID)}`;

            const response = await fetch(url, {
                method: 'GET',
                mode: 'cors'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const duration = Date.now() - startTime;

            if (this.debugger && data.success && data.stats) {
                this.debugger.logDataRetrieved('getDailyStats', 'daily_stats', data.stats, { duration });
            }

            return {
                success: data.success || true,
                data: data.stats || data.data || [],
                stats: data.stats || data.data || []
            };

        } catch (error) {
            if (this.debugger) {
                this.debugger.logError('getDailyStats', error);
            }
            console.error('Error fetching daily stats:', error);
            
            // Return demo data for testing if in demo mode
            if (this.config.DEMO_MODE) {
                return {
                    success: true,
                    stats: this.generateDemoDailyStats(),
                    data: this.generateDemoDailyStats()
                };
            }
            
            return {
                success: false,
                message: 'Error fetching daily stats',
                stats: [],
                data: []
            };
        }
    }

    /**
     * Generate demo study tasks data for testing
     * @returns {Array} Array of demo study tasks
     */
    generateDemoStudyTasks() {
        const subjects = ['Matematyka', 'Polski', 'Angielski', 'Historia'];
        const categories = ['Algebra', 'Geometria', 'Gramatyka', 'Literatura', 'Vocabulary', 'Grammar', 'Ancient History', 'Modern History'];
        const locations = ['Dom', 'Biblioteka', 'Szkoła', 'Park'];
        const tasks = [];
        
        const now = new Date();
        
        for (let i = 0; i < 50; i++) {
            const date = new Date(now);
            date.setDate(date.getDate() - Math.floor(Math.random() * 30)); // Last 30 days
            
            const subject = subjects[Math.floor(Math.random() * subjects.length)];
            const category = categories[Math.floor(Math.random() * categories.length)];
            const location = locations[Math.floor(Math.random() * locations.length)];
            
            const startTime = new Date(date);
            startTime.setHours(8 + Math.floor(Math.random() * 12)); // 8 AM to 8 PM
            startTime.setMinutes(Math.floor(Math.random() * 60));
            
            const endTime = new Date(startTime);
            endTime.setMinutes(endTime.getMinutes() + 15 + Math.floor(Math.random() * 45)); // 15-60 min tasks
            
            tasks.push({
                task_id: `demo_task_${i}`,
                task_name: `Zadanie ${i + 1}: ${category}`,
                description: `Demo zadanie z kategorii ${category}`,
                categories: category,
                correctly_completed: Math.random() > 0.3 ? 'Yes' : 'No', // 70% success rate
                start_time: startTime.toISOString(),
                end_time: endTime.toISOString(),
                location: location,
                subject: subject,
                session_id: `demo_session_${Math.floor(i / 3)}`,
                timestamp: startTime.toISOString()
            });
        }
        
        return tasks.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
    }

    /**
     * Generate demo study sessions data for testing
     * @returns {Array} Array of demo study sessions
     */
    generateDemoStudySessions() {
        const sessions = [];
        const now = new Date();
        
        for (let i = 0; i < 15; i++) {
            const date = new Date(now);
            date.setDate(date.getDate() - Math.floor(Math.random() * 30));
            
            const startTime = new Date(date);
            startTime.setHours(8 + Math.floor(Math.random() * 12));
            startTime.setMinutes(Math.floor(Math.random() * 60));
            
            const endTime = new Date(startTime);
            endTime.setMinutes(endTime.getMinutes() + 30 + Math.floor(Math.random() * 90)); // 30-120 min sessions
            
            const totalTasks = 2 + Math.floor(Math.random() * 5); // 2-6 tasks per session
            const correctTasks = Math.floor(totalTasks * (0.5 + Math.random() * 0.4)); // 50-90% correct
            
            sessions.push({
                session_id: `demo_session_${i}`,
                start_time: startTime.toISOString(),
                end_time: endTime.toISOString(),
                duration_minutes: Math.floor((endTime - startTime) / (1000 * 60)),
                total_tasks: totalTasks,
                correct_tasks: correctTasks,
                accuracy_percentage: Math.round((correctTasks / totalTasks) * 100),
                notes: `Demo session ${i + 1}`
            });
        }
        
        return sessions.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
    }

    /**
     * Generate demo daily stats data for testing
     * @returns {Array} Array of demo daily stats
     */
    generateDemoDailyStats() {
        const stats = [];
        const now = new Date();
        
        for (let i = 0; i < 30; i++) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            
            const tasksCount = Math.floor(Math.random() * 8) + 1; // 1-8 tasks per day
            const correctTasks = Math.floor(tasksCount * (0.4 + Math.random() * 0.5)); // 40-90% correct
            
            stats.push({
                date: date.toISOString().split('T')[0],
                tasks_count: tasksCount,
                correct_tasks: correctTasks,
                streak_day: Math.random() > 0.2 ? 1 : 0, // 80% of days are streak days
                notes: `Demo day ${30 - i}`
            });
        }
        
        return stats.reverse(); // Chronological order
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
    module.exports = GoogleSheetsAPI;
}
