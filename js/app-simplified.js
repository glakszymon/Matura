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
        this.showView('form'); // Default to form view
    }

    /**
     * Setup navigation between form and analytics
     */
    setupNavigation() {
        const showFormBtn = document.getElementById('show-form');
        const showAnalyticsBtn = document.getElementById('show-analytics');

        if (showFormBtn) {
            showFormBtn.addEventListener('click', () => {
                this.showView('form');
                this.setActiveNav(showFormBtn);
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
            
            // Prepare data for Google Apps Script backend
            // Backend expects: [task_name, description, category, subject, correctness, timestamp, points, session_id]
            const taskData = {
                name: formData.task_name,
                description: formData.description,
                category: formData.category,
                subject: formData.subject,
                correctness: formData.correctness === 'Poprawnie',
                sessionId: ''
            };
            
            console.log('Submitting task data:', taskData);
            const result = await this.googleSheetsAPI.addTask(taskData);
            
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

            // Update loading for categories
            updateLoadingStep(loadingId, 1, 'completed');
            updateLoadingStep(loadingId, 2, 'active');
            updateLoadingText(loadingId, 'Pobieranie kategorii z Google Sheets');

            // Load categories
            const categoriesResponse = await this.googleSheetsAPI.fetchCategories();
            if (categoriesResponse.success) {
                console.log('%c🌩 POPULATING CATEGORY DROPDOWN...', 'color: #8b5cf6; font-weight: bold;');
                this.populateSelect('category', categoriesResponse.categories || []);
                if (!categoriesResponse.categories || categoriesResponse.categories.length === 0) {
                    console.log('%c⚠️ No categories found in Google Sheets', 'color: #f59e0b; font-weight: 600;');
                } else {
                    console.log(`%c✅ Successfully populated category dropdown with ${categoriesResponse.categories.length} options`, 'color: #10b981; font-weight: 600;');
                }
            } else {
                console.error('%c❌ FAILED TO LOAD CATEGORIES:', 'color: #ef4444; font-weight: bold;', categoriesResponse.error);
                this.populateSelect('category', []); // Empty - no data
            }
            
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
            const categoriesCount = (categoriesResponse.success && categoriesResponse.categories) ? categoriesResponse.categories.length : 0;
            
            console.log('%c📊 Subjects loaded: %c' + subjectsCount, 'color: #374151; font-weight: 600;', subjectsCount > 0 ? 'color: #10b981; font-weight: bold;' : 'color: #ef4444; font-weight: bold;');
            console.log('%c🏷️ Categories loaded: %c' + categoriesCount, 'color: #374151; font-weight: 600;', categoriesCount > 0 ? 'color: #10b981; font-weight: bold;' : 'color: #ef4444; font-weight: bold;');
            
            const totalOptions = subjectsCount + categoriesCount;
            console.log('%c🎉 Total dropdown options: %c' + totalOptions, 'color: #374151; font-weight: 600;', 'color: #7c3aed; font-weight: bold;');
            
            if (totalOptions > 0) {
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
     * Show specific view (form or analytics)
     */
    showView(viewName) {
        this.currentView = viewName;

        // Hide all containers
        const formContainer = document.getElementById('main-form-container');
        const analyticsContainer = document.getElementById('analytics-container');

        if (formContainer) {
            formContainer.style.display = viewName === 'form' ? 'block' : 'none';
        }

        if (analyticsContainer) {
            analyticsContainer.style.display = viewName === 'analytics' ? 'block' : 'none';
        }

        // Load analytics data if switching to analytics view
        if (viewName === 'analytics' && this.analyticsManager) {
            this.analyticsManager.loadAnalyticsData();
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
