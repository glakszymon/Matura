/**
 * Main Form Application Class
 * Handles form interactions, validation, and submission to Google Sheets
 * Works in conjunction with NavigationManager for multi-form support
 */
class FormApp {
    constructor() {
        this.form = null;
        this.submitButton = null;
        this.messageContainer = null;
        this.googleSheetsAPI = new GoogleSheetsAPIv2(CONFIG);

        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupEventListeners());
        } else {
            this.setupEventListeners();
        }
    }

    /**
     * Set up event listeners and form elements
     */
    setupEventListeners() {

        this.form = document.getElementById('google-sheets-form');
        this.submitButton = document.getElementById('submit-button');
        this.messageContainer = document.getElementById('message-container');

        if (!this.form || !this.submitButton) {
            console.error('❌ Required form elements not found');
            return;
        }

        // Form submission handler
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Real-time validation
        this.form.addEventListener('input', (e) => this.handleInput(e));

        // Clear messages when user starts typing after an error
        this.form.addEventListener('input', () => this.clearMessages());

    }

    /**
     * Handle form submission
     * @param {Event} event - Form submit event
     */
    async handleSubmit(event) {
        event.preventDefault();

        const formData = this.getFormData();
        const validation = this.googleSheetsAPI.validateFormData(formData);

        if (!validation.isValid) {
            this.showValidationErrors(validation.errors);
            return;
        }

        try {
            this.setLoading(true);
            this.clearMessages();

            const result = await this.googleSheetsAPI.submitData(formData);

            if (result.success) {
                this.showSuccessMessage(result.message);
                this.resetForm();
            }

        } catch (error) {
            console.error('Submission error:', error);
            this.showErrorMessage(error.message);
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Handle input events for real-time validation
     * @param {Event} event - Input event
     */
    handleInput(event) {
        const field = event.target;
        this.validateField(field);
    }

    /**
     * Validate individual field
     * @param {HTMLElement} field - Form field element
     */
    validateField(field) {
        const fieldConfig = CONFIG.FORM_FIELDS[field.name];
        if (!fieldConfig) return;

        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        // Required field validation
        if (fieldConfig.required && !value) {
            isValid = false;
            errorMessage = `${fieldConfig.label} jest wymagane`;
        }

        // Length validation
        if (value && fieldConfig.maxLength && value.length > fieldConfig.maxLength) {
            isValid = false;
            errorMessage = `${fieldConfig.label} nie może przekraczać ${fieldConfig.maxLength} znaków`;
        }

        // Update field appearance
        this.updateFieldAppearance(field, isValid, errorMessage);
    }

    /**
     * Update field appearance based on validation
     * @param {HTMLElement} field - Form field element
     * @param {boolean} isValid - Whether field is valid
     * @param {string} errorMessage - Error message if invalid
     */
    updateFieldAppearance(field, isValid, errorMessage) {
        const fieldGroup = field.closest('.form-group');
        const errorElement = fieldGroup?.querySelector('.field-error');

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
     * Get form data as object
     * @returns {Object} Form data object
     */
    getFormData() {
        const formData = new FormData(this.form);
        const data = {};

        for (const [key, value] of formData.entries()) {
            data[key] = value.trim();
        }

        return data;
    }

    /**
     * Show validation errors
     * @param {Array} errors - Array of error messages
     */
    showValidationErrors(errors) {
        const errorMessage = errors.join('<br>');
        this.showMessage(errorMessage, 'error');
    }

    /**
     * Show success message
     * @param {string} message - Success message
     */
    showSuccessMessage(message) {
        this.showMessage(message, 'success');
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showErrorMessage(message) {
        this.showMessage(message, 'error');
    }

    /**
     * Show message with specified type
     * @param {string} message - Message text
     * @param {string} type - Message type (success, error, info)
     */
    showMessage(message, type = 'info') {
        if (!this.messageContainer) return;

        this.messageContainer.innerHTML = `
            <div class="message ${type}">
                ${message}
            </div>
        `;
        this.messageContainer.style.display = 'block';

        // Auto-hide success messages after 5 seconds
        if (type === 'success') {
            setTimeout(() => this.clearMessages(), 5000);
        }
    }

    /**
     * Clear all messages
     */
    clearMessages() {
        if (this.messageContainer) {
            this.messageContainer.innerHTML = '';
            this.messageContainer.style.display = 'none';
        }
    }

    /**
     * Set loading state
     * @param {boolean} loading - Whether to show loading state
     */
    setLoading(loading) {
        if (!this.submitButton) return;

        if (loading) {
            this.submitButton.disabled = true;
            this.submitButton.textContent = CONFIG.UI.LOADING_TEXT;
            this.submitButton.classList.add('loading');
            this.form.classList.add('submitting');
        } else {
            this.submitButton.disabled = false;
            this.submitButton.textContent = 'Wyślij';
            this.submitButton.classList.remove('loading');
            this.form.classList.remove('submitting');
        }
    }

    /**
     * Reset form to initial state
     */
    resetForm() {
        this.form.reset();
        
        // Clear all field validations
        const fields = this.form.querySelectorAll('input, textarea, select');
        fields.forEach(field => {
            field.classList.remove('valid', 'error');
            const fieldGroup = field.closest('.form-group');
            const errorElement = fieldGroup?.querySelector('.field-error');
            if (errorElement) {
                errorElement.textContent = '';
                errorElement.style.display = 'none';
            }
        });
    }
}

// FormApp class is now initialized by AppLoader
// All initialization is handled centrally by the AppLoader
