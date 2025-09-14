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
