/**
 * Navigation Manager Class
 * Handles form switching, menu navigation, and category management
 */
class NavigationManager {
    constructor(config, googleSheetsAPI) {
        this.config = config;
        this.googleSheetsAPI = googleSheetsAPI;
        this.currentForm = null;
        this.categories = [];
        this.subjects = [];
        this.dataCache = {
            categories: null,
            subjects: null,
            mainEntries: null,
            lastFetch: {}
        };
        this.cacheExpiry = 30000; // 30 seconds cache

        this.init();
    }

    /**
     * Initialize navigation
     */
    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupNavigation());
        } else {
            this.setupNavigation();
        }
    }

    /**
     * Set up navigation event listeners
     */
    setupNavigation() {
        // Hamburger menu elements
        const hamburgerBtn = document.getElementById('hamburger-btn');
        const sidebarNav = document.getElementById('sidebar-nav');
        const sidebarClose = document.getElementById('sidebar-close');
        const sidebarOverlay = document.getElementById('sidebar-overlay');
        
        // Navigation buttons
        const showDashboardBtn = document.getElementById('show-dashboard');
        const showMainFormBtn = document.getElementById('show-main-form');
        const showCategoryFormBtn = document.getElementById('show-category-form');
        const showSubjectFormBtn = document.getElementById('show-subject-form');
        const showEntriesFormBtn = document.getElementById('show-entries-form');
        
        // Hamburger menu functionality
        if (hamburgerBtn) {
            hamburgerBtn.addEventListener('click', (e) => {
                // console.log('%c🍔 [NAV] Hamburger clicked (NavigationManager)', 'color: #2ecc71; font-weight: bold;');
                // console.log('Click target:', e.target);
                // console.log('Current target:', e.currentTarget);
                this.toggleSidebar();
            });
        }
        
        if (sidebarClose) {
            sidebarClose.addEventListener('click', () => this.closeSidebar());
        }
        
        if (sidebarOverlay) {
            sidebarOverlay.addEventListener('click', () => this.closeSidebar());
        }
        
        // Close sidebar on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeSidebar();
            }
        });

        // New navigation buttons for exam prep app
        if (showDashboardBtn) {
            showDashboardBtn.addEventListener('click', () => {
                // console.log('🏠 Navigation: Dashboard button clicked');
                this.showForm('dashboard');
                this.closeSidebar();
            });
        } else {
            console.warn('⚠️ Navigation: Dashboard button not found');
        }

        const showAnalyticsBtn = document.getElementById('show-analytics');
        if (showAnalyticsBtn) {
            showAnalyticsBtn.addEventListener('click', () => {
                this.showForm('analytics');
                this.closeSidebar();
            });
        }

        const showPomodoroBtn = document.getElementById('show-pomodoro');
        if (showPomodoroBtn) {
            showPomodoroBtn.addEventListener('click', () => {
                this.showForm('pomodoro');
                this.closeSidebar();
            });
        }

        const showAchievementsBtn = document.getElementById('show-achievements');
        if (showAchievementsBtn) {
            showAchievementsBtn.addEventListener('click', () => {
                this.showForm('achievements');
                this.closeSidebar();
            });
        }

        const showSettingsBtn = document.getElementById('show-settings');
        if (showSettingsBtn) {
            showSettingsBtn.addEventListener('click', () => {
                this.showForm('settings');
                this.closeSidebar();
            });
        }
        
        // Legacy buttons (kept for backward compatibility)
        if (showMainFormBtn) {
            showMainFormBtn.addEventListener('click', () => {
                this.showForm('main');
                this.closeSidebar();
            });
        }

        if (showCategoryFormBtn) {
            showCategoryFormBtn.addEventListener('click', () => {
                this.showForm('category');
                this.closeSidebar();
            });
        }

        if (showSubjectFormBtn) {
            showSubjectFormBtn.addEventListener('click', () => {
                this.showForm('subject');
                this.closeSidebar();
            });
        }

        if (showEntriesFormBtn) {
            showEntriesFormBtn.addEventListener('click', () => {
                this.showForm('entries');
                this.closeSidebar();
            });
        }

        // Category form submission
        const categoryForm = document.getElementById('category-form');
        if (categoryForm) {
            categoryForm.addEventListener('submit', (e) => this.handleCategorySubmit(e));
        }

        // Subject form submission
        const subjectForm = document.getElementById('subject-form');
        if (subjectForm) {
            subjectForm.addEventListener('submit', (e) => this.handleSubjectSubmit(e));
        }

        // Refresh categories button
        const refreshBtn = document.getElementById('refresh-categories');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadCategories());
        }

        // Refresh subjects button
        const refreshSubjectsBtn = document.getElementById('refresh-subjects');
        if (refreshSubjectsBtn) {
            refreshSubjectsBtn.addEventListener('click', () => this.loadSubjects());
        }

        // Refresh entries button
        const refreshEntriesBtn = document.getElementById('refresh-entries');
        if (refreshEntriesBtn) {
            refreshEntriesBtn.addEventListener('click', () => this.loadMainEntries());
        }

        // Set current date
        this.updateCurrentDate();
        
        // Navigation manager initialized
    }

    /**
     * Show specific form
     */
    showForm(formType) {
        // Get all page containers
        const dashboardContainer = document.getElementById('dashboard-container');
        const analyticsContainer = document.getElementById('analytics-container');
        const pomodoroContainer = document.getElementById('pomodoro-container');
        const achievementsContainer = document.getElementById('achievements-container');
        const settingsContainer = document.getElementById('settings-container');
        
        // Legacy containers
        const mainFormContainer = document.getElementById('main-form-container');
        const categoryFormContainer = document.getElementById('category-form-container');
        const subjectFormContainer = document.getElementById('subject-form-container');
        const entriesFormContainer = document.getElementById('entries-form-container');
        
        // Hide all containers first
        const allContainers = [
            dashboardContainer, analyticsContainer, pomodoroContainer, 
            achievementsContainer, settingsContainer, mainFormContainer,
            categoryFormContainer, subjectFormContainer, entriesFormContainer
        ];
        
        allContainers.forEach(container => {
            if (container) container.style.display = 'none';
        });

        // Handle different form types
        if (formType === 'dashboard') {
            if (dashboardContainer) dashboardContainer.style.display = 'block';
            this.currentForm = 'dashboard';

            // Trigger dashboard rendering when switching to dashboard
            if (window.dashboardManager) {
                // console.log('Triggering dashboard render from navigation...');
                // Use force render method to ensure dashboard is displayed
                if (typeof window.dashboardManager.forceRender === 'function') {
                    window.dashboardManager.forceRender();
                } else {
                    // console.log('Dashboard data set by AppLoader, trying to render...');
                    if (typeof window.dashboardManager.tryRenderDashboard === 'function') {
                        window.dashboardManager.tryRenderDashboard();
                    }
                }
            } else {
                console.warn('Dashboard manager not found!');
            }
            
        } else if (formType === 'analytics') {
            if (analyticsContainer) analyticsContainer.style.display = 'block';
            this.currentForm = 'analytics';
            
            // Load analytics data with progress indication
            if (window.analyticsManager) {
                // console.log('⚡ Fast-loading analytics...');
                // Start loading immediately - analytics will show loading indicators
                window.analyticsManager.loadAnalyticsData();
            } else {
                console.warn('Analytics manager not available yet');
            }
            
        } else if (formType === 'pomodoro') {
            if (pomodoroContainer) pomodoroContainer.style.display = 'block';
            this.currentForm = 'pomodoro';
            
            // Refresh Pomodoro data
            if (window.pomodoroTimer) {
                window.pomodoroTimer.loadSubjectsAndCategories();
                window.pomodoroTimer.updateSessionStats();
            }
            
        } else if (formType === 'achievements') {
            if (achievementsContainer) achievementsContainer.style.display = 'block';
            this.currentForm = 'achievements';
            
            // Load achievements
            if (window.achievementSystem) {
                window.achievementSystem.renderAchievements();
            }
            
        } else if (formType === 'settings') {
            if (settingsContainer) settingsContainer.style.display = 'block';
            this.currentForm = 'settings';
            
            // Load current settings
            if (window.settingsManager) {
                window.settingsManager.loadCurrentSettings();
            }

        } else if (formType === 'main') {
            if (dashboardContainer) dashboardContainer.style.display = 'none';
            if (mainFormContainer) mainFormContainer.style.display = 'block';
            if (categoryFormContainer) categoryFormContainer.style.display = 'none';
            if (subjectFormContainer) subjectFormContainer.style.display = 'none';
            if (entriesFormContainer) entriesFormContainer.style.display = 'none';
            this.currentForm = 'main';

            // Load categories for the dropdown (if needed)
            this.loadCategoriesForMainForm();

        } else if (formType === 'category') {
            if (dashboardContainer) dashboardContainer.style.display = 'none';
            if (mainFormContainer) mainFormContainer.style.display = 'none';
            if (categoryFormContainer) categoryFormContainer.style.display = 'block';
            if (subjectFormContainer) subjectFormContainer.style.display = 'none';
            if (entriesFormContainer) entriesFormContainer.style.display = 'none';
            this.currentForm = 'category';

            // Load existing categories
            this.loadCategories();
        } else if (formType === 'subject') {
            if (dashboardContainer) dashboardContainer.style.display = 'none';
            if (mainFormContainer) mainFormContainer.style.display = 'none';
            if (categoryFormContainer) categoryFormContainer.style.display = 'none';
            if (subjectFormContainer) subjectFormContainer.style.display = 'block';
            if (entriesFormContainer) entriesFormContainer.style.display = 'none';
            this.currentForm = 'subject';

            // Load existing subjects
            this.loadSubjects();
        } else if (formType === 'entries') {
            if (dashboardContainer) dashboardContainer.style.display = 'none';
            if (mainFormContainer) mainFormContainer.style.display = 'none';
            if (categoryFormContainer) categoryFormContainer.style.display = 'none';
            if (subjectFormContainer) subjectFormContainer.style.display = 'none';
            if (entriesFormContainer) entriesFormContainer.style.display = 'block';
            this.currentForm = 'entries';

            // Load existing main entries
            this.loadMainEntries();
        }

        // console.log(`Switched to ${formType} form`);
    }
    
    /**
     * Update current date display
     */
    updateCurrentDate() {
        const dateElement = document.getElementById('current-date');
        if (dateElement) {
            const today = new Date();
            const options = {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            };
            dateElement.textContent = today.toLocaleDateString('pl-PL', options);
        }
    }

    /**
     * Show main menu (not needed with sidebar, but keeping for compatibility)
     */
    showMenu() {
        const dashboardContainer = document.getElementById('dashboard-container');
        const mainFormContainer = document.getElementById('main-form-container');
        const categoryFormContainer = document.getElementById('category-form-container');
        const subjectFormContainer = document.getElementById('subject-form-container');
        const entriesFormContainer = document.getElementById('entries-form-container');

        // Hide all form containers
        if (dashboardContainer) dashboardContainer.style.display = 'none';
        if (mainFormContainer) mainFormContainer.style.display = 'none';
        if (categoryFormContainer) categoryFormContainer.style.display = 'none';
        if (subjectFormContainer) subjectFormContainer.style.display = 'none';
        if (entriesFormContainer) entriesFormContainer.style.display = 'none';

        this.currentForm = null;

        // Clear any messages
        const messageContainer = document.getElementById('message-container');
        if (messageContainer) {
            messageContainer.innerHTML = '';
            messageContainer.style.display = 'none';
        }

        // console.log('All forms hidden, sidebar menu available');
    }

    /**
     * Handle category form submission
     */
    async handleCategorySubmit(event) {
        event.preventDefault();

        const form = event.target;
        const formData = new FormData(form);
        const categoryData = {
            name: formData.get('name').trim(),
            description: formData.get('description').trim()
        };

        // Validate
        if (!categoryData.name) {
            this.showMessage('Nazwa kategorii jest wymagana', 'error');
            return;
        }

        // Check for duplicates
        if (this.categories.some(cat => cat.name.toLowerCase() === categoryData.name.toLowerCase())) {
            this.showMessage('Kategoria o tej nazwie już istnieje', 'error');
            return;
        }

        try {
            this.setLoading(true, 'category');
            
            // Submit to Categories sheet
            await this.submitCategory(categoryData);
            
            this.showMessage('Kategoria została dodana pomyślnie!', 'success');
            form.reset();
            
            // Refresh categories list and main form dropdown immediately
            this.loadCategories();
            this.refreshMainFormDropdowns();
            
        } catch (error) {
            console.error('Category submission error:', error);
            this.showMessage('Błąd podczas dodawania kategorii', 'error');
        } finally {
            this.setLoading(false, 'category');
        }
    }

    /**
     * Handle subject form submission
     */
    async handleSubjectSubmit(event) {
        event.preventDefault();

        const form = event.target;
        const formData = new FormData(form);
        const subjectData = {
            name: formData.get('name').trim(),
            description: formData.get('description').trim()
        };

        // Validate
        if (!subjectData.name) {
            this.showMessage('Nazwa przedmiotu jest wymagana', 'error');
            return;
        }

        // Check for duplicates
        if (this.subjects && this.subjects.some(sub => sub.name.toLowerCase() === subjectData.name.toLowerCase())) {
            this.showMessage('Przedmiot o tej nazwie już istnieje', 'error');
            return;
        }

        try {
            this.setLoading(true, 'subject');
            
            // Submit to Subjects sheet
            await this.submitSubject(subjectData);
            
            this.showMessage('Przedmiot został dodany pomyślnie!', 'success');
            form.reset();
            
            // Refresh subjects list and main form dropdown immediately
            this.loadSubjects();
            this.refreshMainFormDropdowns();
            
        } catch (error) {
            console.error('Subject submission error:', error);
            this.showMessage('Błąd podczas dodawania przedmiotu', 'error');
        } finally {
            this.setLoading(false, 'subject');
        }
    }

    /**
     * Submit category to Google Sheets
     */
    async submitCategory(categoryData) {
        const orderedData = [
            categoryData.name,
            categoryData.description || ''
        ];

        const fd = new FormData();
        fd.append('spreadsheetId', this.config.SPREADSHEET_ID);
        fd.append('sheetName', this.config.SHEETS.CATEGORIES.SHEET_NAME);
        fd.append('range', this.config.SHEETS.CATEGORIES.RANGE);
        fd.append('data', JSON.stringify(orderedData));
        fd.append('formType', 'category');

        if (this.config.DEBUG_MODE) {
            // console.log('=== CATEGORY SUBMISSION ===');
            // console.log('Category data:', categoryData);
            // console.log('Ordered data:', orderedData);
            // console.log('============================');
        }

        const response = await fetch(this.config.GAS_WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: fd
        });

        if (this.config.DEBUG_MODE) {
            // console.log('Category submission response type:', response.type);
        }

        return { success: true, data: { opaque: true } };
    }

    /**
     * Submit subject to Google Sheets
     */
    async submitSubject(subjectData) {
        const orderedData = [
            subjectData.name,
            subjectData.description || ''
        ];

        const fd = new FormData();
        fd.append('spreadsheetId', this.config.SPREADSHEET_ID);
        fd.append('sheetName', this.config.SHEETS.SUBJECTS.SHEET_NAME);
        fd.append('range', this.config.SHEETS.SUBJECTS.RANGE);
        fd.append('data', JSON.stringify(orderedData));
        fd.append('formType', 'subject');

        if (this.config.DEBUG_MODE) {
            // console.log('=== SUBJECT SUBMISSION ===');
            // console.log('Subject data:', subjectData);
            // console.log('Ordered data:', orderedData);
            // console.log('============================');
        }

        const response = await fetch(this.config.GAS_WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: fd
        });

        if (this.config.DEBUG_MODE) {
            // console.log('Subject submission response type:', response.type);
        }

        return { success: true, data: { opaque: true } };
    }

    /**
     * Load categories from Google Sheets (with caching)
     */
    async loadCategories() {
        const categoriesList = document.getElementById('categories-list');
        if (!categoriesList) return;

        // Check cache first
        const now = Date.now();
        if (this.dataCache.categories && 
            this.dataCache.lastFetch.categories && 
            (now - this.dataCache.lastFetch.categories) < this.cacheExpiry) {
            // console.log('Using cached categories data');
            this.displayCategories(this.dataCache.categories);
            return;
        }

        try {
            categoriesList.innerHTML = '<div class="loading-categories">🔄 Ładowanie kategorii...</div>';

            // Fetch categories from Google Sheets
            const response = await this.googleSheetsAPI.fetchCategories();

            if (response.success) {
                this.dataCache.categories = response.categories;
                this.dataCache.lastFetch.categories = now;
                this.displayCategories(response.categories);
            } else {
                console.error('Failed to fetch categories:', response.message);
                this.displayCategories([]);
            }

        } catch (error) {
            console.error('Error loading categories:', error);
            categoriesList.innerHTML = '<div class="loading-categories">❌ Błąd podczas ładowania kategorii</div>';
        }
    }

    /**
     * Load subjects from Google Sheets
     */
    async loadSubjects() {
        const subjectsList = document.getElementById('subjects-list');
        if (!subjectsList) return;

        try {
            subjectsList.innerHTML = '<div class="loading-subjects">🔄 Ładowanie przedmiotów...</div>';

            // Fetch subjects from Google Sheets
            const response = await this.googleSheetsAPI.fetchSubjects();

            if (response.success) {
                this.displaySubjects(response.subjects);
            } else {
                console.error('Failed to fetch subjects:', response.message);
                this.displaySubjects([]);
            }

        } catch (error) {
            console.error('Error loading subjects:', error);
            subjectsList.innerHTML = '<div class="loading-subjects">❌ Błąd podczas ładowania przedmiotów</div>';
        }
    }

    /**
     * Display categories in the list
     */
    displayCategories(categories) {
        const categoriesList = document.getElementById('categories-list');
        if (!categoriesList) return;

        if (categories.length === 0) {
            categoriesList.innerHTML = `
                <div class="loading-categories">
                    📝 Brak kategorii. Dodaj pierwszą kategorię używając formularza powyżej.
                </div>
            `;
            return;
        }

        const categoriesHtml = categories.map(category => `
            <div class="category-item">
                <div class="category-info">
                    <div class="category-name">${this.escapeHtml(category.name)}</div>
                    ${category.description ? `<div class="category-description">${this.escapeHtml(category.description)}</div>` : ''}
                </div>
                <div class="category-actions">
                    <button type="button" class="btn btn-small btn-secondary" onclick="navigationManager.editCategory('${category.id}')">
                        ✏️ Edytuj
                    </button>
                    <button type="button" class="btn btn-small" style="background: #dc2626; color: white;" onclick="navigationManager.deleteCategory('${category.id}')">
                        🗑️ Usuń
                    </button>
                </div>
            </div>
        `).join('');

        categoriesList.innerHTML = categoriesHtml;
        this.categories = categories;
    }

    /**
     * Display subjects in the list
     */
    displaySubjects(subjects) {
        const subjectsList = document.getElementById('subjects-list');
        if (!subjectsList) return;

        if (subjects.length === 0) {
            subjectsList.innerHTML = `
                <div class="loading-subjects">
                    📚 Brak przedmiotów. Dodaj pierwszy przedmiot używając formularza powyżej.
                </div>
            `;
            return;
        }

        const subjectsHtml = subjects.map(subject => `
            <div class="subject-item">
                <div class="subject-info">
                    <div class="subject-name">${this.escapeHtml(subject.name)}</div>
                    ${subject.description ? `<div class="subject-description">${this.escapeHtml(subject.description)}</div>` : ''}
                </div>
                <div class="subject-actions">
                    <button type="button" class="btn btn-small btn-secondary" onclick="navigationManager.editSubject('${subject.id}')">
                        ✏️ Edytuj
                    </button>
                    <button type="button" class="btn btn-small" style="background: #dc2626; color: white;" onclick="navigationManager.deleteSubject('${subject.id}')">
                        🗑️ Usuń
                    </button>
                </div>
            </div>
        `).join('');

        subjectsList.innerHTML = subjectsHtml;
        this.subjects = subjects || [];
    }

    /**
     * Load categories and subjects for main form dropdowns
     */
    async loadCategoriesForMainForm() {
        // console.log('Loading categories and subjects for main form dropdowns');
        
        try {
            // Load both categories and subjects in parallel
            const [categoriesResponse, subjectsResponse] = await Promise.all([
                this.googleSheetsAPI.fetchCategories(),
                this.googleSheetsAPI.fetchSubjects()
            ]);
            
            // Update categories dropdown
            this.updateMainFormDropdown('kategorie', categoriesResponse.categories || []);
            
            // Update subjects dropdown
            this.updateMainFormDropdown('przedmiot', subjectsResponse.subjects || []);
            
            if (this.config.DEBUG_MODE) {
                // Main form dropdowns updated
            }
            
        } catch (error) {
            console.error('Error loading data for main form:', error);
            
            // Set error states for dropdowns
            this.setDropdownError('kategorie', 'Błąd ładowania kategorii');
            this.setDropdownError('przedmiot', 'Błąd ładowania przedmiotów');
        }
    }
    
    /**
     * Update dropdown options in main form
     */
    updateMainFormDropdown(fieldName, items) {
        const dropdown = document.getElementById(fieldName);
        if (!dropdown) {
            console.warn(`Dropdown ${fieldName} not found`);
            return;
        }
        
        // Clear existing options
        dropdown.innerHTML = '';
        
        // Add default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = `Wybierz ${fieldName === 'kategorie' ? 'kategorię' : 'przedmiot'}...`;
        dropdown.appendChild(defaultOption);
        
        // Add items
        if (items && items.length > 0) {
            items.forEach(item => {
                const option = document.createElement('option');
                option.value = item.name;
                option.textContent = item.name;
                if (item.description) {
                    option.title = item.description; // Show description as tooltip
                }
                dropdown.appendChild(option);
            });
        } else {
            // Add "no items" option
            const noItemsOption = document.createElement('option');
            noItemsOption.value = '';
            noItemsOption.textContent = `Brak ${fieldName === 'kategorie' ? 'kategorii' : 'przedmiotów'}. Dodaj je w zarządzaniu.`;
            noItemsOption.disabled = true;
            dropdown.appendChild(noItemsOption);
        }
    }
    
    /**
     * Set dropdown to error state
     */
    setDropdownError(fieldName, errorMessage) {
        const dropdown = document.getElementById(fieldName);
        if (!dropdown) return;
        
        dropdown.innerHTML = '';
        const errorOption = document.createElement('option');
        errorOption.value = '';
        errorOption.textContent = errorMessage;
        errorOption.disabled = true;
        dropdown.appendChild(errorOption);
    }
    
    /**
     * Refresh main form dropdowns (called after adding categories/subjects)
     */
    async refreshMainFormDropdowns() {
        // Only refresh if main form is currently visible
        const mainFormContainer = document.getElementById('main-form-container');
        if (mainFormContainer && mainFormContainer.style.display !== 'none') {
            await this.loadCategoriesForMainForm();
            // console.log('Main form dropdowns refreshed');
        }
    }

    /**
     * Show message
     */
    showMessage(message, type = 'info') {
        const messageContainer = document.getElementById('message-container');
        if (!messageContainer) return;

        messageContainer.innerHTML = `
            <div class="message ${type}">
                ${message}
            </div>
        `;
        messageContainer.style.display = 'block';

        // Auto-hide success messages after 3 seconds (reduced from 5)
        if (type === 'success') {
            setTimeout(() => {
                messageContainer.innerHTML = '';
                messageContainer.style.display = 'none';
            }, 3000);
        }
    }

    /**
     * Set loading state for forms
     */
    setLoading(loading, formType = 'category') {
        const submitButton = document.getElementById(`${formType}-submit-button`);
        const form = document.getElementById(`${formType}-form`);

        if (submitButton) {
            if (loading) {
                submitButton.disabled = true;
                if (formType === 'category') {
                    submitButton.textContent = 'Dodawanie...';
                } else if (formType === 'subject') {
                    submitButton.textContent = 'Dodawanie...';
                } else {
                    submitButton.textContent = 'Wysyłanie...';
                }
                submitButton.classList.add('loading');
            } else {
                submitButton.disabled = false;
                if (formType === 'category') {
                    submitButton.textContent = 'Dodaj kategorię';
                } else if (formType === 'subject') {
                    submitButton.textContent = 'Dodaj przedmiot';
                } else {
                    submitButton.textContent = 'Wyślij';
                }
                submitButton.classList.remove('loading');
            }
        }

        if (form) {
            if (loading) {
                form.classList.add('submitting');
            } else {
                form.classList.remove('submitting');
            }
        }
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Edit category functionality
     */
    async editCategory(categoryId) {
        // console.log('Edit category:', categoryId);
        
        try {
            // Get the current category data
            const response = await this.googleSheetsAPI.getCategory(categoryId);
            
            if (response.success && response.category) {
                this.showEditCategoryModal(response.category);
            } else {
                this.showMessage('Nie można pobrać danych kategorii', 'error');
            }
        } catch (error) {
            console.error('Error editing category:', error);
            this.showMessage('Błąd podczas edycji kategorii', 'error');
        }
    }

    /**
     * Delete category with confirmation
     */
    async deleteCategory(categoryId) {
        // console.log('Delete category:', categoryId);
        
        // Get category name for confirmation
        const categoryName = this.categories.find(cat => cat.id === categoryId)?.name || 'nieznana kategoria';
        
        if (confirm(`Czy na pewno chcesz usunąć kategorię "${categoryName}"?\n\nTa operacja jest nieodwracalna.`)) {
            try {
                this.setLoading(true, 'category');
                
                const response = await this.googleSheetsAPI.deleteCategory(categoryId);
                
                if (response.success) {
                    this.showMessage('Kategoria została usunięta pomyślnie!', 'success');
                    
                    // Refresh the lists immediately
                    this.loadCategories();
                    this.refreshMainFormDropdowns();
                    
                } else {
                    this.showMessage('Błąd podczas usuwania kategorii: ' + (response.message || 'Nieznany błąd'), 'error');
                }
                
            } catch (error) {
                console.error('Error deleting category:', error);
                this.showMessage('Błąd podczas usuwania kategorii', 'error');
            } finally {
                this.setLoading(false, 'category');
            }
        }
    }

    /**
     * Edit subject functionality
     */
    async editSubject(subjectId) {
        // console.log('Edit subject:', subjectId);
        
        try {
            // Get the current subject data
            const response = await this.googleSheetsAPI.getSubject(subjectId);
            
            if (response.success && response.subject) {
                this.showEditSubjectModal(response.subject);
            } else {
                this.showMessage('Nie można pobrać danych przedmiotu', 'error');
            }
        } catch (error) {
            console.error('Error editing subject:', error);
            this.showMessage('Błąd podczas edycji przedmiotu', 'error');
        }
    }

    /**
     * Delete subject with confirmation
     */
    async deleteSubject(subjectId) {
        // console.log('Delete subject:', subjectId);
        
        // Get subject name for confirmation
        const subjectName = this.subjects.find(sub => sub.id === subjectId)?.name || 'nieznany przedmiot';
        
        if (confirm(`Czy na pewno chcesz usunąć przedmiot "${subjectName}"?\n\nTa operacja jest nieodwracalna.`)) {
            try {
                this.setLoading(true, 'subject');
                
                const response = await this.googleSheetsAPI.deleteSubject(subjectId);
                
                if (response.success) {
                    this.showMessage('Przedmiot został usunięty pomyślnie!', 'success');
                    
                    // Refresh the lists immediately
                    this.loadSubjects();
                    this.refreshMainFormDropdowns();
                    
                } else {
                    this.showMessage('Błąd podczas usuwania przedmiotu: ' + (response.message || 'Nieznany błąd'), 'error');
                }
                
            } catch (error) {
                console.error('Error deleting subject:', error);
                this.showMessage('Błąd podczas usuwania przedmiotu', 'error');
            } finally {
                this.setLoading(false, 'subject');
            }
        }
    }
    
    /**
     * Show edit category modal
     */
    showEditCategoryModal(category) {
        // Create modal HTML
        const modalHtml = `
            <div class="edit-modal-overlay" id="edit-category-modal">
                <div class="edit-modal">
                    <div class="edit-modal-header">
                        <h3>✏️ Edytuj kategorię</h3>
                        <button type="button" class="close-modal" onclick="navigationManager.closeEditModal()">&times;</button>
                    </div>
                    <form id="edit-category-form">
                        <div class="form-group">
                            <label for="edit-category-name">Nazwa kategorii *</label>
                            <input type="text" id="edit-category-name" name="name" value="${this.escapeHtml(category.name)}" maxlength="100" required>
                        </div>
                        <div class="form-group">
                            <label for="edit-category-description">Opis kategorii</label>
                            <textarea id="edit-category-description" name="description" maxlength="500">${this.escapeHtml(category.description)}</textarea>
                        </div>
                        <div class="modal-actions">
                            <button type="submit" class="btn btn-primary">💾 Zapisz zmiany</button>
                            <button type="button" class="btn btn-secondary" onclick="navigationManager.closeEditModal()">Anuluj</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        // Add modal to DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Add form submit handler
        document.getElementById('edit-category-form').addEventListener('submit', (e) => {
            this.handleEditCategorySubmit(e, category.id);
        });
    }
    
    /**
     * Show edit subject modal
     */
    showEditSubjectModal(subject) {
        // Create modal HTML
        const modalHtml = `
            <div class="edit-modal-overlay" id="edit-subject-modal">
                <div class="edit-modal">
                    <div class="edit-modal-header">
                        <h3>✏️ Edytuj przedmiot</h3>
                        <button type="button" class="close-modal" onclick="navigationManager.closeEditModal()">&times;</button>
                    </div>
                    <form id="edit-subject-form">
                        <div class="form-group">
                            <label for="edit-subject-name">Nazwa przedmiotu *</label>
                            <input type="text" id="edit-subject-name" name="name" value="${this.escapeHtml(subject.name)}" maxlength="100" required>
                        </div>
                        <div class="form-group">
                            <label for="edit-subject-description">Opis przedmiotu</label>
                            <textarea id="edit-subject-description" name="description" maxlength="500">${this.escapeHtml(subject.description)}</textarea>
                        </div>
                        <div class="modal-actions">
                            <button type="submit" class="btn btn-primary">💾 Zapisz zmiany</button>
                            <button type="button" class="btn btn-secondary" onclick="navigationManager.closeEditModal()">Anuluj</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        // Add modal to DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Add form submit handler
        document.getElementById('edit-subject-form').addEventListener('submit', (e) => {
            this.handleEditSubjectSubmit(e, subject.id);
        });
    }
    
    /**
     * Handle edit category form submission
     */
    async handleEditCategorySubmit(event, categoryId) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        const categoryData = {
            name: formData.get('name').trim(),
            description: formData.get('description').trim()
        };
        
        if (!categoryData.name) {
            this.showMessage('Nazwa kategorii jest wymagana', 'error');
            return;
        }
        
        try {
            const submitButton = form.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.textContent = '💾 Zapisywanie...';
            
            const response = await this.googleSheetsAPI.updateCategory(categoryId, categoryData);
            
            if (response.success) {
                this.showMessage('Kategoria została zaktualizowana pomyślnie!', 'success');
                this.closeEditModal();
                
                // Refresh the lists immediately
                this.loadCategories();
                this.refreshMainFormDropdowns();
                
            } else {
                this.showMessage('Błąd podczas aktualizacji kategorii', 'error');
            }
            
        } catch (error) {
            console.error('Error updating category:', error);
            this.showMessage('Błąd podczas aktualizacji kategorii', 'error');
        }
    }
    
    /**
     * Handle edit subject form submission
     */
    async handleEditSubjectSubmit(event, subjectId) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        const subjectData = {
            name: formData.get('name').trim(),
            description: formData.get('description').trim()
        };
        
        if (!subjectData.name) {
            this.showMessage('Nazwa przedmiotu jest wymagana', 'error');
            return;
        }
        
        try {
            const submitButton = form.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.textContent = '💾 Zapisywanie...';
            
            const response = await this.googleSheetsAPI.updateSubject(subjectId, subjectData);
            
            if (response.success) {
                this.showMessage('Przedmiot został zaktualizowany pomyślnie!', 'success');
                this.closeEditModal();
                
                // Refresh the lists immediately
                this.loadSubjects();
                this.refreshMainFormDropdowns();
                
            } else {
                this.showMessage('Błąd podczas aktualizacji przedmiotu', 'error');
            }
            
        } catch (error) {
            console.error('Error updating subject:', error);
            this.showMessage('Błąd podczas aktualizacji przedmiotu', 'error');
        }
    }
    
    /**
     * Close edit modal
     */
    closeEditModal() {
        const modal = document.querySelector('.edit-modal-overlay');
        if (modal) {
            modal.remove();
        }
    }
    
    /**
     * Load main form entries from Google Sheets - DEPRECATED
     * This function has been replaced by the Tasks system
     */
    async loadMainEntries() {
        const entriesList = document.getElementById('entries-list');
        if (!entriesList) return;

        entriesList.innerHTML = `
            <div class="loading-entries">
                📋 Stary system "Wpisy Główne" został zastąpiony systemem "Zadania".<br>
                Przejdź do sekcji Dashboard lub Analytics, aby zobaczyć swoje zadania.
            </div>
        `;
        
        console.warn('⚠️ loadMainEntries() is deprecated. Use Tasks system instead.');
    }
    
    /**
     * Display main entries in the list
     */
    displayMainEntries(entries) {
        const entriesList = document.getElementById('entries-list');
        if (!entriesList) return;

        if (entries.length === 0) {
            entriesList.innerHTML = `
                <div class="loading-entries">
                    📋 Brak wpisów. Dodaj pierwszy wpis używając formularza głównego.
                </div>
            `;
            return;
        }

        const entriesHtml = entries.map(entry => `
            <div class="entry-item">
                <div class="entry-info">
                    <div class="entry-header">
                        <div class="entry-name">${this.escapeHtml(entry.nazwa)}</div>
                        <div class="entry-date">${this.formatDate(entry.timestamp)}</div>
                    </div>
                    <div class="entry-content">${this.escapeHtml(entry.tresc).substring(0, 100)}${entry.tresc.length > 100 ? '...' : ''}</div>
                    <div class="entry-details">
                        <span class="entry-detail">✅ <strong>Poprawność:</strong> ${this.escapeHtml(entry.poprawnosc)}</span>
                        <span class="entry-detail">🏷️ <strong>Kategoria:</strong> ${this.escapeHtml(entry.kategorie)}</span>
                        <span class="entry-detail">📚 <strong>Przedmiot:</strong> ${this.escapeHtml(entry.przedmiot)}</span>
                    </div>
                </div>
                <div class="entry-actions">
                    <button type="button" class="btn btn-small btn-secondary" onclick="navigationManager.editMainEntry('${entry.id}')">
                        ✏️ Edytuj
                    </button>
                    <button type="button" class="btn btn-small" style="background: #dc2626; color: white;" onclick="navigationManager.deleteMainEntry('${entry.id}')">
                        🗑️ Usuń
                    </button>
                </div>
            </div>
        `).join('');

        entriesList.innerHTML = entriesHtml;
        this.mainEntries = entries;
    }
    
    /**
     * Edit main entry functionality - DEPRECATED
     */
    async editMainEntry(entryId) {
        console.warn('⚠️ editMainEntry() is deprecated. Use Tasks system instead.');
        this.showMessage('Edycja wpisów głównych nie jest już dostępna. Użyj nowego systemu Zadań.', 'error');
    }

    /**
     * Delete main entry with confirmation - DEPRECATED
     */
    async deleteMainEntry(entryId) {
        console.warn('⚠️ deleteMainEntry() is deprecated. Use Tasks system instead.');
        this.showMessage('Usuwanie wpisów głównych nie jest już dostępne. Użyj nowego systemu Zadań.', 'error');
    }
    
    /**
     * Show edit main entry modal
     */
    showEditMainEntryModal(entry) {
        // Get categories and subjects for dropdowns
        const categoryOptions = this.categories.map(cat => 
            `<option value="${this.escapeHtml(cat.name)}" ${entry.kategorie === cat.name ? 'selected' : ''}>${this.escapeHtml(cat.name)}</option>`
        ).join('');
        
        const subjectOptions = this.subjects.map(sub => 
            `<option value="${this.escapeHtml(sub.name)}" ${entry.przedmiot === sub.name ? 'selected' : ''}>${this.escapeHtml(sub.name)}</option>`
        ).join('');
        
        // Create modal HTML
        const modalHtml = `
            <div class="edit-modal-overlay" id="edit-entry-modal">
                <div class="edit-modal">
                    <div class="edit-modal-header">
                        <h3>✏️ Edytuj wpis główny</h3>
                        <button type="button" class="close-modal" onclick="navigationManager.closeEditModal()">&times;</button>
                    </div>
                    <form id="edit-entry-form">
                        <div class="form-group">
                            <label for="edit-entry-nazwa">Nazwa *</label>
                            <input type="text" id="edit-entry-nazwa" name="nazwa" value="${this.escapeHtml(entry.nazwa)}" maxlength="100" required>
                        </div>
                        <div class="form-group">
                            <label for="edit-entry-tresc">Treść *</label>
                            <textarea id="edit-entry-tresc" name="tresc" maxlength="1000" rows="4" required>${this.escapeHtml(entry.tresc)}</textarea>
                        </div>
                        <div class="form-group">
                            <label for="edit-entry-poprawnosc">Poprawność *</label>
                            <select id="edit-entry-poprawnosc" name="poprawnosc" required>
                                <option value="Dobrze" ${entry.poprawnosc === 'Dobrze' ? 'selected' : ''}>Dobrze</option>
                                <option value="Źle" ${entry.poprawnosc === 'Źle' ? 'selected' : ''}>Źle</option>
                                <option value="50/50" ${entry.poprawnosc === '50/50' ? 'selected' : ''}>50/50</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="edit-entry-kategorie">Kategorie *</label>
                            <select id="edit-entry-kategorie" name="kategorie" required>
                                <option value="">Wybierz kategorię...</option>
                                ${categoryOptions}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="edit-entry-przedmiot">Przedmiot *</label>
                            <select id="edit-entry-przedmiot" name="przedmiot" required>
                                <option value="">Wybierz przedmiot...</option>
                                ${subjectOptions}
                            </select>
                        </div>
                        <div class="modal-actions">
                            <button type="submit" class="btn btn-primary">💾 Zapisz zmiany</button>
                            <button type="button" class="btn btn-secondary" onclick="navigationManager.closeEditModal()">Anuluj</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        // Add modal to DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Add form submit handler
        document.getElementById('edit-entry-form').addEventListener('submit', (e) => {
            this.handleEditMainEntrySubmit(e, entry.id);
        });
    }
    
    /**
     * Handle edit main entry form submission - DEPRECATED
     */
    async handleEditMainEntrySubmit(event, entryId) {
        event.preventDefault();
        console.warn('⚠️ handleEditMainEntrySubmit() is deprecated. Use Tasks system instead.');
        this.showMessage('Edycja wpisów głównych nie jest już dostępna. Użyj nowego systemu Zadań.', 'error');
    }
    
    /**
     * Format date for display
     */
    formatDate(dateString) {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('pl-PL', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return dateString;
        }
    }
    
    /**
     * Toggle sidebar visibility
     */
    toggleSidebar() {
        const sidebarNav = document.getElementById('sidebar-nav');
        const hamburgerBtn = document.getElementById('hamburger-btn');
        
        if (sidebarNav && sidebarNav.classList.contains('open')) {
            this.closeSidebar();
        } else {
            this.openSidebar();
        }
    }
    
    /**
     * Open sidebar
     */
    openSidebar() {
        const sidebarNav = document.getElementById('sidebar-nav');
        const sidebarOverlay = document.getElementById('sidebar-overlay');
        const hamburgerBtn = document.getElementById('hamburger-btn');
        
        if (sidebarNav) {
            sidebarNav.classList.add('open');
        }
        
        if (sidebarOverlay) {
            sidebarOverlay.classList.add('show');
        }
        
        if (hamburgerBtn) {
            hamburgerBtn.classList.add('active');
        }
        
        // Prevent body scroll when sidebar is open
        document.body.style.overflow = 'hidden';
    }
    
    /**
     * Close sidebar
     */
    closeSidebar() {
        const sidebarNav = document.getElementById('sidebar-nav');
        const sidebarOverlay = document.getElementById('sidebar-overlay');
        const hamburgerBtn = document.getElementById('hamburger-btn');
        
        if (sidebarNav) {
            sidebarNav.classList.remove('open');
        }
        
        if (sidebarOverlay) {
            sidebarOverlay.classList.remove('show');
        }
        
        if (hamburgerBtn) {
            hamburgerBtn.classList.remove('active');
        }
        
        // Restore body scroll
        document.body.style.overflow = '';
    }
}

// Global navigation manager instance
let navigationManager;
