/**
 * Quick Task Manager
 * Handles the floating action button and quick task addition modal
 */
class QuickTaskManager {
    constructor(config, googleSheetsAPI) {
        this.config = config;
        this.googleSheetsAPI = googleSheetsAPI;
        this.subjects = [];
        this.categories = [];
        this.selectedCorrectness = null;
        
        this.elements = {
            fab: document.getElementById('quick-task-fab'),
            modal: document.getElementById('quick-task-modal'),
            closeModal: document.getElementById('close-quick-task'),
            form: document.getElementById('quick-task-form'),
            nameInput: document.getElementById('quick-task-name'),
            subjectSelect: document.getElementById('quick-task-subject'),
            categorySelect: document.getElementById('quick-task-category'),
            correctnessButtons: document.querySelectorAll('.correctness-btn'),
            submitButton: document.getElementById('submit-quick-task')
        };
        
        this.init();
    }
    
    /**
     * Initialize quick task manager
     */
    init() {
        this.setupEventListeners();
        
        // Check if data is already loaded from AppLoader
        if (window.appData) {
            this.setLoadedData(window.appData);
        }
        
        // Quick Task Manager initialized
    }
    
    /**
     * Set loaded data from AppLoader
     */
    setLoadedData(loadedData) {
        if (loadedData) {
            this.subjects = loadedData.subjects || [];
            this.categories = loadedData.categories || [];
            
            // Data set from AppLoader
            
            this.updateSubjectDropdown();
        }
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // FAB click
        if (this.elements.fab) {
            this.elements.fab.addEventListener('click', () => {
                // console.log('🚀 QuickTask: FAB button clicked');
                this.openModal();
            });
        } else {
            // console.warn('⚠️ QuickTask: FAB button not found');
        }
        
        // Quick actions from dashboard
        const addTaskQuick = document.getElementById('add-task-quick');
        if (addTaskQuick) {
            addTaskQuick.addEventListener('click', () => this.openModal());
        }
        
        // Modal close
        if (this.elements.closeModal) {
            this.elements.closeModal.addEventListener('click', () => this.closeModal());
        }
        
        // Click outside modal to close
        if (this.elements.modal) {
            this.elements.modal.addEventListener('click', (e) => {
                if (e.target === this.elements.modal) {
                    this.closeModal();
                }
            });
        }
        
        // Escape key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isModalOpen()) {
                this.closeModal();
            }
        });
        
        // Subject selection change
        if (this.elements.subjectSelect) {
            this.elements.subjectSelect.addEventListener('change', (e) => {
                this.updateCategoriesForSubject(e.target.value);
            });
        }
        
        // Correctness button selection
        this.elements.correctnessButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.selectCorrectness(button);
            });
        });
        
        // Form submission
        if (this.elements.form) {
            this.elements.form.addEventListener('submit', (e) => {
                this.handleSubmit(e);
            });
        }
    }
    
    /**
     * Load subjects and categories from Google Sheets
     */
    async loadSubjectsAndCategories() {
        // console.group('%c📦 [QUICKTASK DATA] Loading Subjects & Categories', 'color: #9b59b6; font-weight: bold; font-size: 14px;');
        // console.log('GoogleSheetsAPI instance:', !!this.googleSheetsAPI);
        // console.log('Demo mode:', this.googleSheetsAPI?.config?.DEMO_MODE);
        
        try {
            // console.log('Starting parallel data fetch...');
            
            // Load subjects and categories in parallel
            const [subjectsResponse, categoriesResponse] = await Promise.all([
                this.googleSheetsAPI.fetchSubjects(),
                this.googleSheetsAPI.fetchCategories()
            ]);
            
            // console.log('Parallel fetch completed:');
            // console.log('- Subjects response:', subjectsResponse);
            // console.log('- Categories response:', categoriesResponse);
            
            if (subjectsResponse.success) {
                this.subjects = subjectsResponse.subjects || [];
                // console.log('Subjects stored:', this.subjects);
                // console.log('Updating subject dropdown...');
                this.updateSubjectDropdown();
                // console.log('Subject dropdown updated');
            } else {
                // console.warn('Subjects fetch failed:', subjectsResponse);
                this.subjects = [];
            }
            
            if (categoriesResponse.success) {
                this.categories = categoriesResponse.categories || [];
                // console.log('Categories stored:', this.categories);
            } else {
                // console.warn('Categories fetch failed:', categoriesResponse);
                this.categories = [];
            }
            
            // Final state processed
            
            // console.groupEnd();
            
        } catch (error) {
            // console.error('ERROR loading subjects and categories:', error);
            // Error details logged
            // console.groupEnd();
            this.showError('Błąd ładowania danych');
        }
    }
    
    /**
     * Update subject dropdown
     */
    updateSubjectDropdown() {
        // console.group('%c📋 [QUICKTASK UI] Updating Subject Dropdown', 'color: #3498db; font-weight: bold;');
        // console.log('Subject select element exists:', !!this.elements.subjectSelect);
        // console.log('Subjects to populate:', this.subjects);
        
        if (!this.elements.subjectSelect) {
            // console.error('Subject select element not found!');
            // console.groupEnd();
            return;
        }
        
        // Clear existing options
        // console.log('Clearing existing options...');
        this.elements.subjectSelect.innerHTML = '';
        
        // Add default option
        // console.log('Adding default option...');
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Wybierz przedmiot...';
        this.elements.subjectSelect.appendChild(defaultOption);
        
        // Add subjects
        // console.log('Adding subject options...');
        this.subjects.forEach((subject, index) => {
            // console.log(`Adding subject ${index + 1}:`, subject);
            const option = document.createElement('option');
            option.value = subject.name;
            option.textContent = subject.name;
            this.elements.subjectSelect.appendChild(option);
        });
        
        // console.log('Dropdown updated. Total options:', this.elements.subjectSelect.children.length);
        // console.log('Options HTML:', this.elements.subjectSelect.innerHTML);
        // console.groupEnd();
    }
    
    /**
     * Update categories dropdown based on selected subject
     */
    updateCategoriesForSubject(subjectName) {
        if (!this.elements.categorySelect) return;
        
        // Clear existing options
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
        
        // Filter categories for selected subject (if needed)
        // For now, show all categories
        this.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.name;
            option.textContent = category.name;
            this.elements.categorySelect.appendChild(option);
        });
    }
    
    /**
     * Select correctness button
     */
    selectCorrectness(selectedButton) {
        // Remove active class from all buttons
        this.elements.correctnessButtons.forEach(button => {
            button.classList.remove('active');
        });
        
        // Add active class to selected button
        selectedButton.classList.add('active');
        
        // Store selected value
        this.selectedCorrectness = selectedButton.dataset.value === 'true';
        
        // console.log('Correctness selected:', this.selectedCorrectness);
    }
    
    /**
     * Open modal
     */
    openModal() {
        // QuickTask: Opening modal
        
        if (this.elements.modal) {
            // Force clear all styles first
            this.elements.modal.style.cssText = '';
            
            // Force remove active class first to start fresh
            this.elements.modal.classList.remove('active');
            
            // Apply styles explicitly
            this.elements.modal.style.display = 'flex';
            this.elements.modal.style.opacity = '0';
            this.elements.modal.style.visibility = 'visible';
            this.elements.modal.style.zIndex = '1000';
            
            // Then add active class for animation (with delay to ensure CSS transition works)
            setTimeout(() => {
                this.elements.modal.classList.add('active');
                this.elements.modal.style.opacity = '1';
                
                // QuickTask: Modal active class added
            }, 50);

            // Focus on name input
            if (this.elements.nameInput) {
                setTimeout(() => {
                    this.elements.nameInput.focus();
                    // console.log('🔤 QuickTask: Input focused');
                }, 200);
            }

            // Add modal-open class to body to prevent scrolling
            document.body.classList.add('modal-open');
            
            // console.log('✅ QuickTask: Modal opened successfully');
        } else {
            // console.error('❌ QuickTask: Modal element not found!');
        }
    }

    /**
     * Close modal
     */
    closeModal() {
        // console.log('💫 QuickTask: Closing modal');
        
        if (this.elements.modal) {
            // Remove active class first
            this.elements.modal.classList.remove('active');
            
            // Wait for animation to complete, then hide
            setTimeout(() => {
                this.elements.modal.style.display = 'none';
            }, 300);
            
            this.resetForm();

            // Remove modal-open class from body
            document.body.classList.remove('modal-open');
            
            // console.log('✅ QuickTask: Modal closed successfully');
        }
    }

    /**
     * Check if modal is open
     */
    isModalOpen() {
        return this.elements.modal && this.elements.modal.classList.contains('active');
    }
    
    /**
     * Reset form to initial state
     */
    resetForm() {
        if (this.elements.form) {
            this.elements.form.reset();
        }
        
        // Reset correctness selection
        this.selectedCorrectness = null;
        this.elements.correctnessButtons.forEach(button => {
            button.classList.remove('active');
        });
        
        // Reset category dropdown
        this.updateCategoriesForSubject('');
    }
    
    /**
     * Handle form submission
     */
    async handleSubmit(event) {
        event.preventDefault();
        
        const formData = new FormData(this.elements.form);
        const taskData = {
            name: formData.get('name').trim(),
            subject: formData.get('subject'),
            category: formData.get('category'),
            correctness: this.selectedCorrectness,
            timestamp: new Date().toISOString()
        };
        
        // Validate form
        const validation = this.validateTaskData(taskData);
        if (!validation.isValid) {
            this.showValidationErrors(validation.errors);
            return;
        }
        
        try {
            this.setSubmitting(true);
            
            // Submit task
            await this.submitTask(taskData);
            
            // Record activity in streak manager
            const points = taskData.correctness ? 
                this.config.POINTS.CORRECT_TASK : 
                this.config.POINTS.INCORRECT_TASK;
                
            if (window.streakManager) {
                window.streakManager.recordActivity(points);
            }
            
            // Check for achievements
            if (window.achievementSystem) {
                window.achievementSystem.checkTaskAchievements();
            }
            
            // Show success message
            this.showSuccess('Zadanie zostało dodane pomyślnie!');
            
            // Close modal
            this.closeModal();
            
            // Update dashboard if visible
            if (window.dashboardManager && window.navigationManager?.currentForm === 'dashboard') {
                window.dashboardManager.loadDashboardData();
            }
            
        } catch (error) {
            // console.error('Error submitting quick task:', error);
            this.showError('Błąd podczas dodawania zadania');
        } finally {
            this.setSubmitting(false);
        }
    }
    
    /**
     * Submit task to Google Sheets
     */
    async submitTask(taskData) {
        const orderedData = [
            taskData.name,
            taskData.category,
            taskData.subject,
            taskData.correctness ? 'Poprawnie' : 'Błędnie',
            taskData.timestamp,
            taskData.correctness ? this.config.POINTS.CORRECT_TASK : this.config.POINTS.INCORRECT_TASK,
            '' // session_id (empty for manual tasks)
        ];
        
        const fd = new FormData();
        fd.append('spreadsheetId', this.config.SPREADSHEET_ID);
        fd.append('sheetName', this.config.SHEETS.TASKS.SHEET_NAME);
        fd.append('range', this.config.SHEETS.TASKS.RANGE);
        fd.append('data', JSON.stringify(orderedData));
        fd.append('formType', 'task');
        
        if (this.config.DEBUG_MODE) {
            // console.log('=== QUICK TASK SUBMISSION ===');
            // console.log('Task data:', taskData);
            // console.log('Ordered data:', orderedData);
            // console.log('=============================');
        }
        
        const response = await fetch(this.config.GAS_WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: fd
        });
        
        return { success: true, data: { opaque: true } };
    }
    
    /**
     * Validate task data
     */
    validateTaskData(taskData) {
        const errors = [];
        
        if (!taskData.name) {
            errors.push('Nazwa zadania jest wymagana');
        }
        
        if (!taskData.subject) {
            errors.push('Przedmiot jest wymagany');
        }
        
        if (!taskData.category) {
            errors.push('Kategoria jest wymagana');
        }
        
        if (taskData.correctness === null) {
            errors.push('Wybierz czy zadanie było poprawne');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
    
    /**
     * Show validation errors
     */
    showValidationErrors(errors) {
        const errorMessage = errors.join(', ');
        this.showError(errorMessage);
    }
    
    /**
     * Set submitting state
     */
    setSubmitting(submitting) {
        if (!this.elements.submitButton) return;
        
        if (submitting) {
            this.elements.submitButton.disabled = true;
            this.elements.submitButton.innerHTML = `
                <span class="btn-icon">⏳</span>
                Dodawanie...
            `;
        } else {
            this.elements.submitButton.disabled = false;
            this.elements.submitButton.innerHTML = `
                <span class="btn-icon">🚀</span>
                Dodaj zadanie
            `;
        }
    }
    
    /**
     * Show success message
     */
    showSuccess(message) {
        if (window.navigationManager) {
            window.navigationManager.showMessage(message, 'success');
        } else {
            // console.log('Success:', message);
        }
    }
    
    /**
     * Show error message
     */
    showError(message) {
        if (window.navigationManager) {
            window.navigationManager.showMessage(message, 'error');
        } else {
            // console.error('Error:', message);
        }
    }
    
    /**
     * Refresh data (called when subjects/categories are updated)
     */
    async refreshData() {
        await this.loadSubjectsAndCategories();
    }
}

// Initialize quick task manager when DOM is ready
let quickTaskManager;
document.addEventListener('DOMContentLoaded', () => {
    // console.log('%c🚀 [QUICKTASK INIT] Initializing QuickTaskManager...', 'color: #9b59b6; font-weight: bold;');
    
    // Wait for Google Sheets API to be available
    const initQuickTaskManager = () => {
        // Checking for GoogleSheetsAPIv2 and CONFIG...
        
        if (window.GoogleSheetsAPIv2 && CONFIG) {
            // console.log('Dependencies available, creating instances...');
            const googleSheetsAPI = new GoogleSheetsAPIv2(CONFIG);
            quickTaskManager = new QuickTaskManager(CONFIG, googleSheetsAPI);
            window.quickTaskManager = quickTaskManager;
            // console.log('%c✅ [QUICKTASK INIT] QuickTaskManager initialized successfully', 'color: #2ecc71; font-weight: bold;');
        } else {
            // console.log('Dependencies not ready, retrying in 50ms...');
            setTimeout(initQuickTaskManager, 50);
        }
    };
    
    initQuickTaskManager();
});
