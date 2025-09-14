/**
 * Management Forms - Subject and Category CRUD Operations
 * Handles all operations for managing subjects and categories
 * Works with Google Apps Script API endpoints
 */

class ManagementForms {
    constructor() {
        this.currentEditId = null;
        this.currentEditType = null;
        this.subjects = [];
        this.categories = [];
        
        this.init();
    }

    /**
     * Initialize management forms
     */
    init() {
        console.log('🔧 Initializing Management Forms');
        
        // Bind navigation events
        this.bindNavigationEvents();
        
        // Bind form events
        this.bindFormEvents();
        
        // Bind modal events
        this.bindModalEvents();
        
        // Initial load when page loads
        if (typeof CONFIG !== 'undefined' && CONFIG.GAS_WEB_APP_URL) {
            // Add some debug fallback data
            this.subjects = [
                { subject_name: 'Matematyka', color: '#FF6B6B', icon: '📐', active: true },
                { subject_name: 'Polski', color: '#4ECDC4', icon: '📝', active: true }
            ];
            this.categories = [
                { category_name: 'Algebra', subject_name: 'Matematyka', difficulty: 'Średni', active: true },
                { category_name: 'Gramatyka', subject_name: 'Polski', difficulty: 'Łatwy', active: true }
            ];
            
            // Try to load from API, but fallback to debug data
            this.loadSubjects();
            this.loadCategories();
            // Load subjects for category form dropdown
            this.loadSubjectsForDropdown('category-subject');
            
            // Show initial data
            setTimeout(() => {
                this.renderSubjectsList();
                this.renderCategoriesList();
            }, 1000);
        }
    }

    /**
     * Bind navigation and tab events
     */
    bindNavigationEvents() {
        // Main navigation buttons
        const showFormBtn = document.getElementById('show-form');
        const showAnalyticsBtn = document.getElementById('show-analytics');

        if (showFormBtn) {
            showFormBtn.addEventListener('click', () => {
                this.showSection('main-form-container');
                this.showTab('tasks'); // Default to tasks tab
            });
        }

        if (showAnalyticsBtn) {
            showAnalyticsBtn.addEventListener('click', () => {
                this.showSection('analytics-container');
            });
        }

        // Tab switching within the unified form
        this.bindTabEvents();
    }

    /**
     * Bind tab switching events
     */
    bindTabEvents() {
        const tabButtons = document.querySelectorAll('.form-tab');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabName = button.getAttribute('data-tab');
                this.showTab(tabName);
                
                // Load data when switching to management tabs
                if (tabName === 'subjects') {
                    this.loadSubjects();
                } else if (tabName === 'categories') {
                    this.loadCategories();
                    // Also load subjects for the category form dropdown
                    this.loadSubjectsForDropdown('category-subject');
                }
            });
        });
    }

    /**
     * Show specific section and hide others
     */
    showSection(sectionId) {
        // Hide all sections
        const sections = [
            'main-form-container',
            'analytics-container'
        ];

        sections.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.style.display = 'none';
            }
        });

        // Show target section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.style.display = 'block';
        }

        // Update navigation buttons
        this.updateNavigationButtons(sectionId);
    }

    /**
     * Show specific tab within the unified form
     */
    showTab(tabName) {
        // Hide all tab contents
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(content => {
            content.classList.remove('active');
        });

        // Remove active class from all tab buttons
        const tabButtons = document.querySelectorAll('.form-tab');
        tabButtons.forEach(button => {
            button.classList.remove('active');
        });

        // Show target tab content
        const targetTab = document.getElementById(tabName + '-tab');
        if (targetTab) {
            targetTab.classList.add('active');
        }

        // Activate corresponding tab button
        const activeButton = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
        }
    }

    /**
     * Update navigation button states
     */
    updateNavigationButtons(activeSectionId) {
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => btn.classList.remove('active'));

        let activeButtonId;
        switch (activeSectionId) {
            case 'main-form-container':
                activeButtonId = 'show-form';
                break;
            case 'analytics-container':
                activeButtonId = 'show-analytics';
                break;
        }

        const activeButton = document.getElementById(activeButtonId);
        if (activeButton) {
            activeButton.classList.add('active');
        }
    }

    /**
     * Bind form submission events
     */
    bindFormEvents() {
        // Subject form
        const addSubjectForm = document.getElementById('add-subject-form');
        if (addSubjectForm) {
            addSubjectForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddSubject();
            });
        }

        // Category form
        const addCategoryForm = document.getElementById('add-category-form');
        if (addCategoryForm) {
            addCategoryForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddCategory();
            });
        }

        // Edit form
        const editForm = document.getElementById('edit-form');
        if (editForm) {
            editForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleEditSubmit();
            });
        }

        // Refresh buttons
        const refreshSubjects = document.getElementById('refresh-subjects');
        const refreshCategories = document.getElementById('refresh-categories');

        if (refreshSubjects) {
            refreshSubjects.addEventListener('click', () => this.loadSubjects());
        }

        if (refreshCategories) {
            refreshCategories.addEventListener('click', () => this.loadCategories());
        }
    }

    /**
     * Bind modal events
     */
    bindModalEvents() {
        const closeModalBtn = document.getElementById('close-edit-modal');
        const cancelEditBtn = document.getElementById('cancel-edit');
        const modalOverlay = document.getElementById('edit-modal-overlay');

        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => this.closeEditModal());
        }

        if (cancelEditBtn) {
            cancelEditBtn.addEventListener('click', () => this.closeEditModal());
        }

        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) {
                    this.closeEditModal();
                }
            });
        }
    }

    /**
     * Handle adding new subject - Updated for new structure
     */
    async handleAddSubject() {
        const form = document.getElementById('add-subject-form');
        const submitBtn = form.querySelector('button[type="submit"]');
        let originalText = submitBtn.innerHTML;
        
        try {
            const formData = new FormData(form);
            
            const subject_name = formData.get('subject_name').trim();
            const color = formData.get('color') || '#667eea';
            const icon = formData.get('icon').trim() || '📚';

            if (!subject_name) {
                this.showError('Nazwa przedmiotu jest wymagana');
                return;
            }

            // Show loading state
            originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span class="btn-icon">⏳</span> Dodawanie...';
            submitBtn.disabled = true;

            // Prepare data for API - New structure: [subject_name, color, icon]
            const data = [subject_name, color, icon];

            const response = await fetch(CONFIG.GAS_WEB_APP_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'addSubject',
                    spreadsheetId: CONFIG.SPREADSHEET_ID,
                    data: JSON.stringify(data)
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess('Przedmiot został dodany pomyślnie!');
                form.reset();
                this.loadSubjects(); // Refresh the list
                
                // Refresh dropdowns in main form
                if (typeof window.app !== 'undefined') {
                    window.app.loadSubjects();
                }
            } else {
                throw new Error(result.error || 'Błąd podczas dodawania przedmiotu');
            }

        } catch (error) {
            console.error('Error adding subject:', error);
            this.showError('Błąd podczas dodawania przedmiotu: ' + error.message);
        } finally {
            // Restore button state
            if (submitBtn) {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        }
    }

    /**
     * Handle adding new category - Updated for new structure
     */
    async handleAddCategory() {
        const form = document.getElementById('add-category-form');
        const submitBtn = form.querySelector('button[type="submit"]');
        let originalText = submitBtn.innerHTML;
        
        try {
            const formData = new FormData(form);
            
            const category_name = formData.get('category_name').trim();
            const subject_name = formData.get('subject_name');
            const difficulty = formData.get('difficulty');

            if (!category_name) {
                this.showError('Nazwa kategorii jest wymagana');
                return;
            }

            if (!subject_name) {
                this.showError('Przedmiot jest wymagany');
                return;
            }

            if (!difficulty) {
                this.showError('Poziom trudności jest wymagany');
                return;
            }

            // Show loading state
            originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span class="btn-icon">⏳</span> Dodawanie...';
            submitBtn.disabled = true;

            // Prepare data for API - New structure: [category_name, subject_name, difficulty]
            const data = [category_name, subject_name, difficulty];

            const response = await fetch(CONFIG.GAS_WEB_APP_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'addCategory',
                    spreadsheetId: CONFIG.SPREADSHEET_ID,
                    data: JSON.stringify(data)
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess('Kategoria została dodana pomyślnie!');
                form.reset();
                this.loadCategories(); // Refresh the list
                
                // Refresh dropdowns in main form
                if (typeof window.app !== 'undefined') {
                    window.app.loadCategories();
                }
            } else {
                throw new Error(result.error || 'Błąd podczas dodawania kategorii');
            }

        } catch (error) {
            console.error('Error adding category:', error);
            this.showError('Błąd podczas dodawania kategorii: ' + error.message);
        } finally {
            // Restore button state
            if (submitBtn) {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        }
    }

    /**
     * Load subjects from API
     */
    async loadSubjects() {
        try {
            const subjectsList = document.getElementById('subjects-list');
            if (!subjectsList) return;

            subjectsList.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><span>Ładowanie przedmiotów...</span></div>';

            const response = await fetch(CONFIG.GAS_WEB_APP_URL + '?' + new URLSearchParams({
                action: 'getSubjects',
                spreadsheetId: CONFIG.SPREADSHEET_ID
            }));

            const result = await response.json();

            if (result.success) {
                this.subjects = result.data || [];
                console.log('Loaded subjects data:', this.subjects);
                this.renderSubjectsList();
            } else {
                throw new Error(result.error || 'Błąd podczas ładowania przedmiotów');
            }

        } catch (error) {
            console.error('Error loading subjects:', error);
            const subjectsList = document.getElementById('subjects-list');
            if (subjectsList) {
                subjectsList.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">⚠️</div>
                        <div class="empty-state-title">Błąd ładowania</div>
                        <div class="empty-state-description">${error.message}</div>
                    </div>
                `;
            }
        }
    }

    /**
     * Load categories from API
     */
    async loadCategories() {
        try {
            const categoriesList = document.getElementById('categories-list');
            if (!categoriesList) return;

            categoriesList.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><span>Ładowanie kategorii...</span></div>';

            const response = await fetch(CONFIG.GAS_WEB_APP_URL + '?' + new URLSearchParams({
                action: 'getCategories',
                spreadsheetId: CONFIG.SPREADSHEET_ID
            }));

            const result = await response.json();

            if (result.success) {
                this.categories = result.data || [];
                console.log('Loaded categories data:', this.categories);
                this.renderCategoriesList();
            } else {
                throw new Error(result.error || 'Błąd podczas ładowania kategorii');
            }

        } catch (error) {
            console.error('Error loading categories:', error);
            const categoriesList = document.getElementById('categories-list');
            if (categoriesList) {
                categoriesList.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">⚠️</div>
                        <div class="empty-state-title">Błąd ładowania</div>
                        <div class="empty-state-description">${error.message}</div>
                    </div>
                `;
            }
        }
    }

    /**
     * Render subjects list
     */
    renderSubjectsList() {
        const subjectsList = document.getElementById('subjects-list');
        if (!subjectsList) return;
        
        console.log('Rendering subjects list. Data:', this.subjects);

        if (this.subjects.length === 0) {
            subjectsList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📚</div>
                    <div class="empty-state-title">Brak przedmiotów</div>
                    <div class="empty-state-description">Dodaj pierwszy przedmiot korzystając z formularza powyżej</div>
                </div>
            `;
            return;
        }

        const itemsHtml = this.subjects.map((subject, index) => {
            console.log(`Processing subject ${index}:`, subject);
            
            // Safety checks for data integrity
            if (!subject || typeof subject !== 'object') {
                console.warn('Invalid subject data at index', index, subject);
                return '';
            }
            
            const name = String(subject.subject_name || 'Bez nazwy');
            const color = String(subject.color || '#667eea');
            const icon = String(subject.icon || '📚');
            const subjectId = String(subject.subject_name || ''); // Using subject_name as ID

            return `
                <div class="management-item" data-id="${this.escapeHtml(subjectId)}">
                    <div class="item-info">
                        <div class="item-header">
                            <div class="item-icon" style="background-color: ${this.escapeHtml(color)}">${this.escapeHtml(icon)}</div>
                            <div class="item-name">${this.escapeHtml(name)}</div>
                        </div>
                        <div class="item-details">
                            <span class="detail-badge" style="background-color: ${this.escapeHtml(color)}20; color: ${this.escapeHtml(color)};">Kolor: ${this.escapeHtml(color)}</span>
                            <span class="detail-badge">Ikona: ${this.escapeHtml(icon)}</span>
                        </div>
                    </div>
                    <div class="item-actions">
                        <button class="btn btn-edit" onclick="managementForms.editSubject('${this.escapeHtml(subjectId)}')">
                            <span class="btn-icon">✏️</span>
                            Edytuj
                        </button>
                        <button class="btn btn-delete" onclick="managementForms.deleteSubject('${this.escapeHtml(subjectId)}')">
                            <span class="btn-icon">🗑️</span>
                            Usuń
                        </button>
                    </div>
                </div>
            `;
        }).filter(html => html.trim() !== '').join('');

        subjectsList.innerHTML = itemsHtml;
    }

    /**
     * Render categories list
     */
    renderCategoriesList() {
        const categoriesList = document.getElementById('categories-list');
        if (!categoriesList) return;

        if (this.categories.length === 0) {
            categoriesList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🏷️</div>
                    <div class="empty-state-title">Brak kategorii</div>
                    <div class="empty-state-description">Dodaj pierwszą kategorię korzystając z formularza powyżej</div>
                </div>
            `;
            return;
        }

        const itemsHtml = this.categories.map((category, index) => {
            console.log(`Processing category ${index}:`, category);
            
            // Safety checks for data integrity
            if (!category || typeof category !== 'object') {
                console.warn('Invalid category data at index', index, category);
                return '';
            }
            
            const name = String(category.category_name || 'Bez nazwy');
            const subject_name = String(category.subject_name || 'Brak przedmiotu');
            const difficulty = String(category.difficulty || 'Nieokreślony');
            const categoryId = String(category.category_name || ''); // Using category_name as ID
            
            // Get difficulty color
            const difficultyColors = {
                'Łatwy': '#10b981',
                'Średni': '#f59e0b', 
                'Trudny': '#ef4444'
            };
            const difficultyColor = difficultyColors[difficulty] || '#6b7280';

            return `
                <div class="management-item" data-id="${this.escapeHtml(categoryId)}">
                    <div class="item-info">
                        <div class="item-header">
                            <div class="item-name">${this.escapeHtml(name)}</div>
                            <div class="difficulty-badge" style="background-color: ${this.escapeHtml(difficultyColor)}; color: white;">
                                ${this.escapeHtml(difficulty)}
                            </div>
                        </div>
                        <div class="item-details">
                            <span class="detail-badge">Przedmiot: ${this.escapeHtml(subject_name)}</span>
                        </div>
                    </div>
                    <div class="item-actions">
                        <button class="btn btn-edit" onclick="managementForms.editCategory('${this.escapeHtml(categoryId)}')">
                            <span class="btn-icon">✏️</span>
                            Edytuj
                        </button>
                        <button class="btn btn-delete" onclick="managementForms.deleteCategory('${this.escapeHtml(categoryId)}')">
                            <span class="btn-icon">🗑️</span>
                            Usuń
                        </button>
                    </div>
                </div>
            `;
        }).filter(html => html.trim() !== '').join('');

        categoriesList.innerHTML = itemsHtml;
    }

    /**
     * Edit subject - Updated for new structure
     */
    editSubject(subjectId) {
        const subject = this.subjects.find(s => s.subject_name === subjectId);
        if (!subject) {
            this.showError('Nie znaleziono przedmiotu');
            return;
        }

        this.openEditModal('subject', subjectId, {
            subject_name: subject.subject_name || '',
            color: subject.color || '#667eea',
            icon: subject.icon || '📚'
        });
    }

    /**
     * Edit category - Updated for new structure
     */
    editCategory(categoryId) {
        const category = this.categories.find(c => c.category_name === categoryId);
        if (!category) {
            this.showError('Nie znaleziono kategorii');
            return;
        }

        this.openEditModal('category', categoryId, {
            category_name: category.category_name || '',
            subject_name: category.subject_name || '',
            difficulty: category.difficulty || 'Średni'
        });
    }

    /**
     * Open edit modal - Updated for new structure
     */
    async openEditModal(type, id, data) {
        this.currentEditType = type;
        this.currentEditId = id;

        // Update modal title
        const modalTitle = document.getElementById('edit-modal-title');
        if (modalTitle) {
            modalTitle.textContent = type === 'subject' ? '✏️ Edytuj Przedmiot' : '✏️ Edytuj Kategorię';
        }

        // Show/hide field groups based on type
        const subjectFields = document.querySelectorAll('.subject-only');
        const categoryFields = document.querySelectorAll('.category-only');
        
        if (type === 'subject') {
            subjectFields.forEach(field => field.style.display = 'block');
            categoryFields.forEach(field => field.style.display = 'none');
            
            // Fill subject form
            document.getElementById('edit-name').value = data.subject_name;
            document.getElementById('edit-color').value = data.color;
            document.getElementById('edit-icon').value = data.icon;
        } else {
            subjectFields.forEach(field => field.style.display = 'none');
            categoryFields.forEach(field => field.style.display = 'block');
            
            // Fill category form
            document.getElementById('edit-name').value = data.category_name;
            document.getElementById('edit-difficulty').value = data.difficulty;
            
            // Load subjects for dropdown
            await this.loadSubjectsForDropdown('edit-subject');
            document.getElementById('edit-subject').value = data.subject_name;
        }

        // Fill hidden form fields
        document.getElementById('edit-item-id').value = id;
        document.getElementById('edit-form-type').value = type;

        // Show modal
        const modalOverlay = document.getElementById('edit-modal-overlay');
        if (modalOverlay) {
            modalOverlay.style.display = 'flex';
        }
    }

    /**
     * Close edit modal
     */
    closeEditModal() {
        const modalOverlay = document.getElementById('edit-modal-overlay');
        if (modalOverlay) {
            modalOverlay.style.display = 'none';
        }

        this.currentEditType = null;
        this.currentEditId = null;

        // Reset form
        const form = document.getElementById('edit-form');
        if (form) {
            form.reset();
        }
    }

    /**
     * Handle edit form submission - Updated for new structure
     */
    async handleEditSubmit() {
        const form = document.getElementById('edit-form');
        const submitBtn = form.querySelector('button[type="submit"]');
        let originalText = submitBtn.innerHTML;
        
        try {
            const formData = new FormData(form);
            
            const name = formData.get('name').trim();
            const itemId = formData.get('id');
            const formType = formData.get('formType');

            if (!name) {
                this.showError('Nazwa jest wymagana');
                return;
            }

            let data;
            if (formType === 'subject') {
                const color = formData.get('color') || '#667eea';
                const icon = formData.get('icon').trim() || '📚';
                data = [name, color, icon]; // [subject_name, color, icon]
            } else {
                const subject_name = formData.get('subject_name');
                const difficulty = formData.get('difficulty');
                
                if (!subject_name) {
                    this.showError('Przedmiot jest wymagany');
                    return;
                }
                
                if (!difficulty) {
                    this.showError('Poziom trudności jest wymagany');
                    return;
                }
                
                data = [name, subject_name, difficulty]; // [category_name, subject_name, difficulty]
            }

            // Show loading state
            originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span class="btn-icon">⏳</span> Zapisywanie...';
            submitBtn.disabled = true;

            const response = await fetch(CONFIG.GAS_WEB_APP_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'update',
                    formType: formType,
                    itemId: itemId,
                    spreadsheetId: CONFIG.SPREADSHEET_ID,
                    data: JSON.stringify(data)
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess(`${formType === 'subject' ? 'Przedmiot' : 'Kategoria'} został zaktualizowany pomyślnie!`);
                this.closeEditModal();
                
                // Refresh appropriate list
                if (formType === 'subject') {
                    this.loadSubjects();
                    if (typeof window.app !== 'undefined') {
                        window.app.loadSubjects();
                    }
                } else {
                    this.loadCategories();
                    if (typeof window.app !== 'undefined') {
                        window.app.loadCategories();
                    }
                }
            } else {
                throw new Error(result.error || 'Błąd podczas aktualizacji');
            }

        } catch (error) {
            console.error('Error updating item:', error);
            this.showError('Błąd podczas aktualizacji: ' + error.message);
        } finally {
            // Restore button state
            if (submitBtn) {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        }
    }

    /**
     * Delete subject - Updated for new structure
     */
    async deleteSubject(subjectId) {
        const subject = this.subjects.find(s => s.subject_name === subjectId);
        const subjectName = subject ? subject.subject_name : 'przedmiot';

        if (!confirm(`Czy na pewno chcesz usuńąć przedmiot "${subjectName}"?`)) {
            return;
        }

        try {
            const response = await fetch(CONFIG.GAS_WEB_APP_URL + '?' + new URLSearchParams({
                action: 'deleteSubject',
                name: subjectId, // Using subject name as identifier
                spreadsheetId: CONFIG.SPREADSHEET_ID
            }));

            const result = await response.json();

            if (result.success) {
                this.showSuccess('Przedmiot został usunięty pomyślnie!');
                this.loadSubjects();
                
                // Refresh dropdowns in main form
                if (typeof window.app !== 'undefined') {
                    window.app.loadSubjects();
                }
            } else {
                throw new Error(result.error || 'Błąd podczas usuwania przedmiotu');
            }

        } catch (error) {
            console.error('Error deleting subject:', error);
            this.showError('Błąd podczas usuwania przedmiotu: ' + error.message);
        }
    }
    /**
     * Delete category - Updated for new structure
     */
    async deleteCategory(categoryId) {
        const category = this.categories.find(c => c.category_name === categoryId);
        const categoryName = category ? category.category_name : 'kategoria';

        if (!confirm(`Czy na pewno chcesz usuńąć kategorię "${categoryName}"?`)) {
            return;
        }

        try {
            const response = await fetch(CONFIG.GAS_WEB_APP_URL + '?' + new URLSearchParams({
                action: 'deleteCategory',
                name: categoryId, // Using category name as identifier
                spreadsheetId: CONFIG.SPREADSHEET_ID
            }));

            const result = await response.json();

            if (result.success) {
                this.showSuccess('Kategoria została usunięta pomyślnie!');
                this.loadCategories();
                
                // Refresh dropdowns in main form
                if (typeof window.app !== 'undefined') {
                    window.app.loadCategories();
                }
            } else {
                throw new Error(result.error || 'Błąd podczas usuwania kategorii');
            }

        } catch (error) {
            console.error('Error deleting category:', error);
            this.showError('Błąd podczas usuwania kategorii: ' + error.message);
        }
    }

    /**
     * Load subjects for dropdown
     */
    async loadSubjectsForDropdown(selectElementId) {
        try {
            const selectElement = document.getElementById(selectElementId);
            if (!selectElement) return;

            // Show loading
            selectElement.innerHTML = '<option value="">Ładowanie przedmiotów...</option>';

            // Load subjects if not already loaded
            if (this.subjects.length === 0) {
                await this.loadSubjects();
            }

            // Populate dropdown
            let optionsHtml = '<option value="">Wybierz przedmiot...</option>';
            this.subjects.forEach(subject => {
                const name = String(subject.subject_name || 'Bez nazwy');
                optionsHtml += `<option value="${this.escapeHtml(name)}">${this.escapeHtml(name)}</option>`;
            });

            selectElement.innerHTML = optionsHtml;

        } catch (error) {
            console.error('Error loading subjects for dropdown:', error);
            const selectElement = document.getElementById(selectElementId);
            if (selectElement) {
                selectElement.innerHTML = '<option value="">Błąd ładowania</option>';
            }
        }
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    /**
     * Show error message
     */
    showError(message) {
        this.showMessage(message, 'error');
    }

    /**
     * Show message
     */
    showMessage(message, type = 'info') {
        const messageContainer = document.getElementById('message-container');
        if (!messageContainer) return;

        const messageElement = document.createElement('div');
        messageElement.className = `message ${type}`;
        messageElement.innerHTML = `
            <span class="message-text">${this.escapeHtml(message)}</span>
            <button class="message-close" onclick="this.parentElement.remove()">×</button>
        `;

        messageContainer.appendChild(messageElement);
        messageContainer.style.display = 'block';

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (messageElement.parentElement) {
                messageElement.remove();
                if (messageContainer.children.length === 0) {
                    messageContainer.style.display = 'none';
                }
            }
        }, 5000);
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        // Convert to string and handle null/undefined
        if (text === null || text === undefined) {
            return '';
        }
        
        const str = String(text);
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return str.replace(/[&<>"']/g, function(m) { return map[m]; });
    }
}

// Initialize management forms when DOM is loaded
let managementForms;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        managementForms = new ManagementForms();
    });
} else {
    managementForms = new ManagementForms();
}

// Export for global access
window.managementForms = managementForms;
