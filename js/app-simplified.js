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
        this.setupStudyTracking();
        this.showView('form'); // Default to form view
    }

    /**
     * Setup navigation between form, study, and analytics
     */
    setupNavigation() {
        const showFormBtn = document.getElementById('show-form');
        const showStudyBtn = document.getElementById('show-study');
        const showAnalyticsBtn = document.getElementById('show-analytics');

        if (showFormBtn) {
            showFormBtn.addEventListener('click', () => {
                this.showView('form');
                this.setActiveNav(showFormBtn);
            });
        }

        if (showStudyBtn) {
            showStudyBtn.addEventListener('click', () => {
                this.showView('study');
                this.setActiveNav(showStudyBtn);
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
            
            // StudyTrackingManager is disabled - no duplicate prevention needed
            
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
            // Expose globally for LeftNavigation to access
            window.analyticsManager = this.analyticsManager;
            try {
                // Preload analytics data so subject pages render instantly on navigation
                this.analyticsManager.loadAnalyticsData();
            } catch (e) {
                console.warn('Analytics preload failed:', e);
            }
        }
    }

    /**
     * Setup study tracking functionality
     */
    setupStudyTracking() {
        // DISABLED: StudyTrackingManager to prevent duplicate submissions
        // SimplifiedFormApp handles study sessions instead
        console.log('🎆 StudyTrackingManager disabled - using SimplifiedFormApp study system');
        // if (typeof StudyTrackingManager !== 'undefined') {
        //     this.studyTrackingManager = new StudyTrackingManager(this.config, this.googleSheetsAPI);
        // }
        
        // Initialize study session data for saving
        this.currentSession = null;
        this.sessionTasks = [];
        this.isSessionActive = false;
        
        // Timer management
        this.sessionTimerInterval = null;
        this.taskTimerInterval = null;
        this.sessionStartTime = null;
        this.sessionPausedTime = 0;
        this.isSessionPaused = false;
        
        // Simple caching for better performance
        this.cache = {
            subjects: null,
            categories: new Map() // Key: subject, Value: categories
        };
        
        // View mode state
        this.isMobileMode = false;
        
        // Setup study session modal controls
        this.setupStudySessionModal();
    }
    
    /**
     * Setup study session modal functionality
     */
    setupStudySessionModal() {
        const startStudyBtn = document.getElementById('start-study-button');
        const viewHistoryBtn = document.getElementById('view-history-button');
        const studyModal = document.getElementById('study-session-modal');
        const finishSessionBtn = document.getElementById('finish-session-btn');
        const pauseSessionBtn = document.getElementById('pause-session-btn');
        
        // Start Study Session button
        if (startStudyBtn) {
            startStudyBtn.addEventListener('click', () => {
                console.log('🏁 Starting study session configuration...');
                this.startStudySession();
            });
        }
        
        // View History button
        if (viewHistoryBtn) {
            viewHistoryBtn.addEventListener('click', () => {
                console.log('📅 Opening study history...');
                // TODO: Implement history view
                alert('Historia sesji nauki - funkcjonalność w przygotowaniu');
            });
        }
        
        // Task completion buttons
        const correctTaskBtn = document.getElementById('correct-task-btn');
        const incorrectTaskBtn = document.getElementById('incorrect-task-btn');
        
        if (correctTaskBtn) {
            correctTaskBtn.addEventListener('click', () => {
                console.log('✅ Correct task recorded');
                this.recordStudyTask(true);
                this.showDopamineFeedback(true, correctTaskBtn);
            });
        }
        
        if (incorrectTaskBtn) {
            incorrectTaskBtn.addEventListener('click', () => {
                console.log('❌ Incorrect task recorded');
                this.recordStudyTask(false);
                this.showDopamineFeedback(false, incorrectTaskBtn);
            });
        }
        
        // Exit Session button (new)
        const exitSessionBtn = document.getElementById('exit-session-btn');
        if (exitSessionBtn) {
            exitSessionBtn.addEventListener('click', () => {
                console.log('🚪 Exiting study session without saving...');
                this.exitStudySessionWithoutSaving();
            });
        }
        
        // Finish Session button
        if (finishSessionBtn) {
            finishSessionBtn.addEventListener('click', () => {
                console.log('🏁 Finishing study session...');
                this.finishStudySession();
                this.closeStudySessionModal();
            });
        }
        
        // Pause/Resume Session button
        if (pauseSessionBtn) {
            pauseSessionBtn.addEventListener('click', () => {
                console.log('⏸️ Toggling pause state...');
                this.togglePauseSession();
            });
        }
        
        // Submit analysis button (the main save button)
        const submitAnalysisBtn = document.getElementById('submit-analysis-btn');
        if (submitAnalysisBtn) {
            submitAnalysisBtn.addEventListener('click', () => {
                console.log('💾 Saving complete study session...');
                this.saveCompleteSession();
            });
        }
        
        // Cancel analysis button
        const cancelAnalysisBtn = document.getElementById('cancel-analysis-btn');
        if (cancelAnalysisBtn) {
            cancelAnalysisBtn.addEventListener('click', () => {
                console.log('❌ Canceling session save...');
                this.hideAnalysisModal();
            });
        }
        
        // Task form buttons
        const saveTaskBtn = document.getElementById('save-task-btn');
        const clearFormBtn = document.getElementById('clear-form-btn');
        
        if (saveTaskBtn) {
            saveTaskBtn.addEventListener('click', () => {
                console.log('💾 Manually saving current task...');
                this.saveCurrentTask();
            });
        }
        
        if (clearFormBtn) {
            clearFormBtn.addEventListener('click', () => {
                console.log('🔄 Manually clearing form...');
                this.manualClearForm();
            });
        }
        
        // View mode switcher
        const mobileToggle = document.getElementById('mobile-mode-toggle');
        const modeSlider = document.querySelector('.mode-slider');
        
        if (mobileToggle) {
            console.log('⚙️ Mobile toggle found and event listener attached');
            mobileToggle.addEventListener('change', () => {
                console.log('🔄 Mobile toggle changed to:', mobileToggle.checked);
                this.toggleViewMode(mobileToggle.checked);
            });
            
            // Backup click handler on the slider itself
            if (modeSlider) {
                modeSlider.addEventListener('click', (e) => {
                    e.preventDefault();
                    mobileToggle.checked = !mobileToggle.checked;
                    console.log('🔄 Mode slider clicked, toggle set to:', mobileToggle.checked);
                    this.toggleViewMode(mobileToggle.checked);
                });
                console.log('⚙️ Backup click handler added to mode slider');
            }
        } else {
            console.warn('⚠️ Mobile toggle not found during setup');
        }
        
        // Results modal buttons
        const saveSessionResultsBtn = document.getElementById('save-session-results');
        const editTasksDetailBtn = document.getElementById('edit-tasks-detail');
        const closeResultsModalBtn = document.getElementById('close-results-modal');
        
        if (saveSessionResultsBtn) {
            saveSessionResultsBtn.addEventListener('click', () => {
                console.log('💾 Saving session results...');
                this.saveSessionFromResults();
            });
        }
        
        if (editTasksDetailBtn) {
            editTasksDetailBtn.addEventListener('click', () => {
                console.log('✏️ Opening detailed task editing...');
                this.openDetailedTaskEditing();
            });
        }
        
        if (closeResultsModalBtn) {
            closeResultsModalBtn.addEventListener('click', () => {
                console.log('❌ Closing results modal...');
                this.hideStudyResultsModal();
            });
        }
        
        // Disable closing modal when clicking outside for fullscreen focus
        // Removed click-outside-to-close functionality for better study focus
    }
    
    /**
     * Open the study session modal
     */
    openStudySessionModal() {
        const studyModal = document.getElementById('study-session-modal');
        if (studyModal) {
            // Show modal immediately
            studyModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            // Only initialize session state if no active session exists
            if (!this.isSessionActive || !this.currentSession) {
                this.initializeSessionState();
                
                // Reset counters only for new sessions
                requestAnimationFrame(() => {
                    this.resetStudyCounters();
                });
            } else {
                // For existing sessions, just update the UI counters to current values
                requestAnimationFrame(() => {
                    this.updateTaskCounters();
                });
            }
            
            // Initialize view mode based on device
            this.initializeViewMode();
        }
            
        console.log('✅ Study session modal opened');
    }
    
    /**
     * Initialize session state when opening modal
     */
    initializeSessionState() {
        console.log('🚀 Initializing session state...');
        
        // Set session as active
        this.isSessionActive = true;
        this.isSessionPaused = false;
        
        // Initialize session data
        this.sessionStartTime = Date.now();
        this.sessionPausedTime = 0;
        this.sessionTasks = [];
        
        // Reset pause button to initial state
        const pauseBtn = document.getElementById('pause-session-btn');
        const pauseBtnIcon = document.getElementById('pause-btn-icon');
        if (pauseBtnIcon) pauseBtnIcon.textContent = '⏸️';
        if (pauseBtn) pauseBtn.title = 'Pause Session';
        
        console.log('✅ Session state initialized');
    }
    
    /**
     * Initialize view mode based on screen size and device
     */
    initializeViewMode() {
        const isMobileDevice = this.detectMobileDevice();
        const toggle = document.getElementById('mobile-mode-toggle');
        
        if (toggle) {
            toggle.checked = isMobileDevice;
            this.toggleViewMode(isMobileDevice);
            
            if (isMobileDevice) {
                console.log('📱 Auto-detected mobile device, switching to mobile mode');
            }
        }
    }
    
    /**
     * Detect if user is on a mobile device
     */
    detectMobileDevice() {
        // Check screen size
        const isSmallScreen = window.innerWidth <= 768 || window.innerHeight <= 600;
        
        // Check user agent for mobile devices
        const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // Check for touch support
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        return isSmallScreen || isMobileUserAgent || (isTouchDevice && window.innerWidth <= 1024);
    }
    
    /**
     * Toggle between mobile and desktop view modes
     */
    toggleViewMode(isMobile) {
        this.isMobileMode = isMobile;
        const studyModal = document.getElementById('study-session-modal');
        const modalContent = studyModal?.querySelector('.study-session-content');
        const modeLabel = document.getElementById('current-mode-label');
        
        console.log('🔄 toggleViewMode called with:', isMobile);
        console.log('📱 Modal found:', !!studyModal);
        console.log('📱 Modal content found:', !!modalContent);
        
        if (modalContent) {
            if (isMobile) {
                modalContent.classList.add('mobile-mode');
                if (modeLabel) modeLabel.textContent = 'Mobile';
                this.setupMobileEnhancements();
                console.log('📱 Switched to mobile view mode - classes:', modalContent.classList.toString());
            } else {
                modalContent.classList.remove('mobile-mode');
                if (modeLabel) modeLabel.textContent = 'Desktop';
                this.removeMobileEnhancements();
                console.log('💻 Switched to desktop view mode - classes:', modalContent.classList.toString());
            }
            
            // Trigger a small animation to indicate the change
            this.showModeChangeAnimation(isMobile);
        } else {
            console.warn('⚠️ Could not find modal content for view mode switch');
        }
    }
    
    /**
     * Show visual feedback when mode changes
     */
    showModeChangeAnimation(isMobile) {
        const studyModal = document.getElementById('study-session-modal');
        const modalContent = studyModal?.querySelector('.study-session-content');
        
        if (modalContent) {
            // Brief scale animation to indicate change
            modalContent.style.transform = 'scale(0.98)';
            modalContent.style.transition = 'transform 0.2s ease';
            
            requestAnimationFrame(() => {
                modalContent.style.transform = 'scale(1)';
                
                setTimeout(() => {
                    modalContent.style.transition = '';
                }, 200);
            });
        }
        
        // Show brief toast message
        const mode = isMobile ? 'Mobile' : 'Desktop';
        this.showBriefToast(`🔄 Przełączono na widok ${mode}`);
    }
    
    /**
     * Show brief toast message
     */
    showBriefToast(message) {
        // Create toast if it doesn't exist
        let toast = document.getElementById('mode-change-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'mode-change-toast';
            toast.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #1e293b;
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                font-size: 0.9rem;
                font-weight: 500;
                z-index: 10000;
                opacity: 0;
                transform: translateX(100px);
                transition: all 0.3s ease;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                border: 1px solid #475569;
            `;
            document.body.appendChild(toast);
        }
        
        toast.textContent = message;
        
        // Show toast
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        });
        
        // Hide toast after delay
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100px)';
        }, 2000);
    }
    
    /**
     * Show success notification
     */
    showSuccessNotification(title, subtitle = '') {
        this.showNotification(title, subtitle, 'success');
    }
    
    /**
     * Show error notification
     */
    showErrorNotification(title, subtitle = '') {
        this.showNotification(title, subtitle, 'error');
    }
    
    /**
     * Show enhanced notification toast
     */
    showNotification(title, subtitle = '', type = 'info') {
        // Create unique toast ID based on content and timestamp
        const toastId = `notification-toast-${Date.now()}`;
        
        // Determine colors based on type
        let colors = {
            background: '#1e293b',
            border: '#475569',
            titleColor: 'white',
            subtitleColor: '#d1d5db'
        };
        
        if (type === 'success') {
            colors = {
                background: 'linear-gradient(135deg, #10b981, #059669)',
                border: '#10b981',
                titleColor: 'white',
                subtitleColor: '#dcfce7'
            };
        } else if (type === 'error') {
            colors = {
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                border: '#ef4444',
                titleColor: 'white',
                subtitleColor: '#fee2e2'
            };
        }
        
        const toast = document.createElement('div');
        toast.id = toastId;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors.background};
            color: ${colors.titleColor};
            padding: 16px 20px;
            border-radius: 12px;
            font-size: 0.95rem;
            font-weight: 600;
            z-index: 10001;
            opacity: 0;
            transform: translateX(100px) scale(0.95);
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
            border: 1px solid ${colors.border};
            min-width: 300px;
            max-width: 400px;
            backdrop-filter: blur(8px);
        `;
        
        // Build content
        let content = `<div style="display: flex; align-items: flex-start; gap: 12px;">`;
        
        // Add icon based on type
        if (type === 'success') {
            content += `<div style="font-size: 1.5rem; margin-top: -2px;">✅</div>`;
        } else if (type === 'error') {
            content += `<div style="font-size: 1.5rem; margin-top: -2px;">⚠️</div>`;
        } else {
            content += `<div style="font-size: 1.5rem; margin-top: -2px;">ℹ️</div>`;
        }
        
        content += `<div style="flex: 1;">`;
        content += `<div style="font-weight: 700; margin-bottom: ${subtitle ? '4px' : '0'}; line-height: 1.3;">${title}</div>`;
        
        if (subtitle) {
            content += `<div style="font-size: 0.8rem; color: ${colors.subtitleColor}; font-weight: 400; line-height: 1.4;">${subtitle}</div>`;
        }
        
        content += `</div></div>`;
        
        toast.innerHTML = content;
        document.body.appendChild(toast);
        
        // Show toast with animation
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0) scale(1)';
        });
        
        // Auto-hide after delay (longer for errors)
        const hideDelay = type === 'error' ? 5000 : 3500;
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100px) scale(0.95)';
            
            // Remove from DOM after animation
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 400);
        }, hideDelay);
        
        // Add click to dismiss
        toast.addEventListener('click', () => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100px) scale(0.95)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 400);
        });
    }
    
    /**
     * Setup mobile-specific enhancements
     */
    setupMobileEnhancements() {
        const categorySelect = document.querySelector('#task-edit-form select[name="category"]');
        if (categorySelect) {
            // Enhance multi-select for mobile
            this.enhanceMobileMultiSelect(categorySelect);
        }
        
        // Add touch-friendly interactions
        this.addMobileTouchEnhancements();
        
        // Auto-save form data more frequently in mobile mode
        this.setupMobileAutoSave();
        
        console.log('📱 Mobile enhancements activated');
    }
    
    /**
     * Remove mobile-specific enhancements
     */
    removeMobileEnhancements() {
        // Clean up mobile-specific event listeners and modifications
        this.removeMobileTouchEnhancements();
        this.removeMobileAutoSave();
        
        console.log('💻 Mobile enhancements removed');
    }
    
    /**
     * Enhance multi-select for mobile devices
     */
    enhanceMobileMultiSelect(selectElement) {
        // Set up custom mobile category selector
        this.setupMobileCategorySelector();
    }
    
    /**
     * Setup custom mobile-friendly category selector
     */
    setupMobileCategorySelector() {
        const mobileCategorySelector = document.getElementById('mobile-category-selector');
        const hiddenSelect = document.getElementById('category-select-hidden');
        const countDisplay = document.getElementById('category-count');
        
        if (!mobileCategorySelector || !hiddenSelect) return;
        
        // Clear any existing categories
        mobileCategorySelector.innerHTML = '';
        
        // Prefer categories filtered by current session subject from cache
        const sessionSubject = this.currentSession?.subject;
        let model = [];
        if (sessionSubject && this.cache && this.cache.categories && this.cache.categories.get(sessionSubject)) {
            model = this.cache.categories.get(sessionSubject).map(cat => ({
                value: (cat.category_name || cat.name || ''),
                text:  (cat.category_name || cat.name || ''),
                // Selected if it exists as selected in hidden select
                selected: !!Array.from(hiddenSelect.selectedOptions).find(opt => opt.value === (cat.category_name || cat.name || ''))
            }));
        } else {
            // Fallback to whatever is present in the hidden select
            model = Array.from(hiddenSelect.options).map(option => ({
                value: option.value,
                text: option.textContent,
                selected: option.selected
            }));
        }
        
        // Create mobile category items (only for the current subject)
        model.forEach(category => {
            const categoryItem = document.createElement('div');
            categoryItem.className = 'category-item';
            categoryItem.dataset.value = category.value;
            
            if (category.selected) {
                categoryItem.classList.add('selected');
            }
            
            categoryItem.innerHTML = `
                <span class="category-name">${category.text}</span>
            `;
            
            // Add click handler
            categoryItem.addEventListener('click', () => {
                this.toggleMobileCategory(categoryItem, hiddenSelect, countDisplay);
            });
            
            mobileCategorySelector.appendChild(categoryItem);
        });
        
        // Update count display
        this.updateCategoryCount(hiddenSelect, countDisplay);
    }
    
    /**
     * Toggle mobile category selection
     */
    toggleMobileCategory(categoryItem, hiddenSelect, countDisplay) {
        const categoryValue = categoryItem.dataset.value;
        const isSelected = categoryItem.classList.contains('selected');
        
        // Toggle visual state
        if (isSelected) {
            categoryItem.classList.remove('selected');
        } else {
            categoryItem.classList.add('selected');
        }
        
        // Update hidden select
        const option = hiddenSelect.querySelector(`option[value="${categoryValue}"]`);
        if (option) {
            option.selected = !isSelected;
        }
        
        // Update count
        this.updateCategoryCount(hiddenSelect, countDisplay);
        
        // Add touch feedback
        categoryItem.style.transform = 'scale(0.95)';
        setTimeout(() => {
            categoryItem.style.transform = 'scale(1)';
        }, 100);
    }
    
    /**
     * Update category count display
     */
    updateCategoryCount(hiddenSelect, countDisplay) {
        const selectedCount = hiddenSelect.selectedOptions.length;
        
        // Remove all classes first
        countDisplay.classList.remove('has-selection', 'error');
        
        if (selectedCount === 0) {
            countDisplay.textContent = 'Tap categories to select';
            countDisplay.classList.add('error');
        } else {
            countDisplay.textContent = `✓ ${selectedCount} selected`;
            countDisplay.classList.add('has-selection');
        }
    }
    
    /**
     * Add mobile touch enhancements
     */
    addMobileTouchEnhancements() {
        const buttons = document.querySelectorAll('.mobile-mode .btn');
        buttons.forEach(button => {
            button.addEventListener('touchstart', () => {
                button.style.transform = 'scale(0.95)';
                button.style.opacity = '0.8';
            });
            
            button.addEventListener('touchend', () => {
                setTimeout(() => {
                    button.style.transform = 'scale(1)';
                    button.style.opacity = '1';
                }, 100);
            });
        });
    }
    
    /**
     * Remove mobile touch enhancements
     */
    removeMobileTouchEnhancements() {
        // Reset any transform/opacity changes
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(button => {
            button.style.transform = '';
            button.style.opacity = '';
        });
    }
    
    /**
     * Setup mobile auto-save (save form data when switching between fields)
     */
    setupMobileAutoSave() {
        const formInputs = document.querySelectorAll('#task-edit-form input, #task-edit-form select, #task-edit-form textarea');
        formInputs.forEach(input => {
            input.addEventListener('blur', () => {
                // Auto-save form state in mobile mode
                this.saveMobileFormState();
            });
        });
    }
    
    /**
     * Remove mobile auto-save
     */
    removeMobileAutoSave() {
        // Auto-save is removed when desktop mode is restored
        // No explicit cleanup needed as event listeners are passive
    }
    
    /**
     * Save form state for mobile mode
     */
    saveMobileFormState() {
        if (!this.isMobileMode) return;
        
        const form = document.getElementById('task-edit-form');
        if (form) {
            const formData = new FormData(form);
            const data = {
                taskName: formData.get('task_name') || '',
                categories: Array.from(formData.getAll('category')),
                description: formData.get('description') || ''
            };
            
            // Store in session for mobile mode persistence
            sessionStorage.setItem('mobile_form_state', JSON.stringify(data));
        }
    }
    
    /**
     * Close the study session modal
     */
    closeStudySessionModal() {
        const studyModal = document.getElementById('study-session-modal');
        if (studyModal) {
            studyModal.style.display = 'none';
            document.body.style.overflow = 'auto'; // Restore scrolling
            console.log('✅ Study session modal closed');
            
            // Session cleanup disabled - keeping session data persistent
            // this.cleanupSessionState();
            console.log('🔒 Session data preserved (cleanup disabled)');
        }
    }
    
    /**
     * Exit study session without saving any data
     */
    exitStudySessionWithoutSaving() {
        if (confirm('🚪 Czy na pewno chcesz wyjść bez zapisywania sesji nauki? Wszystkie postępy zostaną utracone.')) {
            console.log('🚪 Exiting session without saving - user confirmed');
            // Ensure session is fully cleaned so a new session can be started
            this.cleanupSessionState();
            this.closeStudySessionModal();
        }
    }
    
    /**
     * Clean up session state and timers
     */
    cleanupSessionState() {
        console.log('🧹 Cleaning up session state...');
        
        // Clear all timers
        if (this.sessionTimerInterval) {
            clearInterval(this.sessionTimerInterval);
            this.sessionTimerInterval = null;
        }
        
        if (this.taskTimerInterval) {
            clearInterval(this.taskTimerInterval);
            this.taskTimerInterval = null;
        }
        
        // Remove keyboard event listeners
        if (this.pauseKeyboardHandler) {
            document.removeEventListener('keydown', this.pauseKeyboardHandler);
            this.pauseKeyboardHandler = null;
        }
        
        // Reset session state
        this.currentSession = null;
        this.sessionTasks = [];
        this.isSessionActive = false;
        this.sessionStartTime = null;
        this.sessionPausedTime = 0;
        this.isSessionPaused = false;
        
        // Clear any existing animations or overlays
        this.cleanupAnimations();
        
        console.log('✅ Session state cleaned up');
    }
    
    /**
     * Toggle pause/resume session
     */
    togglePauseSession() {
        const pauseBtn = document.getElementById('pause-session-btn');
        const pauseBtnIcon = document.getElementById('pause-btn-icon');
        
        if (!this.isSessionActive) {
            console.log('⚠️ No active session to pause');
            this.showBriefToast('⚠️ Brak aktywnej sesji do wstrzymania');
            return;
        }
        
        this.isSessionPaused = !this.isSessionPaused;
        
        if (this.isSessionPaused) {
            // Pause session
            console.log('⏸️ Session paused');
            if (pauseBtnIcon) pauseBtnIcon.textContent = '▶️';
            if (pauseBtn) pauseBtn.title = 'Resume Session';
            
            // Store pause start time
            this.pauseStartTime = Date.now();
            
            // Pause timers
            this.pauseTimers();
            
            // Show pause overlay
            this.showPauseOverlay();
            
            // Show brief feedback
            this.showBriefToast('⏸️ Sesja wstrzymana');
            
        } else {
            // Resume session
            console.log('▶️ Session resumed');
            if (pauseBtnIcon) pauseBtnIcon.textContent = '⏸️';
            if (pauseBtn) pauseBtn.title = 'Pause Session';
            
            // Add paused time to total
            if (this.pauseStartTime) {
                this.sessionPausedTime += Date.now() - this.pauseStartTime;
                this.pauseStartTime = null;
            }
            
            // Resume timers
            this.resumeTimers();
            
            // Hide pause overlay
            this.hidePauseOverlay();
            
            // Show brief feedback
            this.showBriefToast('▶️ Sesja wznowiona - kontynuuj naukę!');
            
            // Add a small celebration effect
            this.showResumeAnimation();
        }
    }
    
    /**
     * Pause session timers
     */
    pauseTimers() {
        // Implementation will depend on how timers are currently managed
        console.log('⏸️ Timers paused');
    }
    
    /**
     * Resume session timers
     */
    resumeTimers() {
        // Implementation will depend on how timers are currently managed
        console.log('▶️ Timers resumed');
    }
    
    /**
     * Show pause overlay
     */
    showPauseOverlay() {
        let overlay = document.getElementById('pause-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'pause-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10002;
                backdrop-filter: blur(8px);
                cursor: pointer;
                user-select: none;
            `;
            
            overlay.innerHTML = `
                <div style="text-align: center; color: white; pointer-events: none;">
                    <div style="font-size: 4rem; margin-bottom: 20px; animation: pausePulse 2s infinite ease-in-out;">⏸️</div>
                    <h2 style="font-size: 2rem; margin-bottom: 15px; font-weight: 600;">Sesja Wstrzymana</h2>
                    <p style="font-size: 1.2rem; opacity: 0.9; margin-bottom: 25px;">Kliknij gdziekolwiek aby wznowić</p>
                    <div style="display: flex; gap: 15px; justify-content: center; align-items: center;">
                        <button id="resume-btn" style="
                            background: linear-gradient(135deg, #10b981, #059669);
                            color: white;
                            border: none;
                            padding: 12px 24px;
                            border-radius: 8px;
                            font-size: 1.1rem;
                            font-weight: 600;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                            transition: all 0.2s ease;
                            pointer-events: auto;
                            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
                        " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                            <span>▶️</span> Wznów Sesję
                        </button>
                        <button id="exit-from-pause-btn" style="
                            background: rgba(255, 255, 255, 0.2);
                            color: white;
                            border: 1px solid rgba(255, 255, 255, 0.3);
                            padding: 12px 24px;
                            border-radius: 8px;
                            font-size: 1.1rem;
                            font-weight: 600;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                            transition: all 0.2s ease;
                            pointer-events: auto;
                            backdrop-filter: blur(10px);
                        " onmouseover="this.style.background='rgba(255, 255, 255, 0.3)'" onmouseout="this.style.background='rgba(255, 255, 255, 0.2)'">
                            <span>✕</span> Zakończ Sesję
                        </button>
                    </div>
                </div>
            `;
            
            // Add click handler to overlay (anywhere to resume)
            overlay.addEventListener('click', (e) => {
                // Only resume if clicking the overlay itself, not the buttons
                if (e.target === overlay) {
                    this.togglePauseSession();
                }
            });
            
            document.body.appendChild(overlay);
            
            // Add event listeners to buttons
            const resumeBtn = overlay.querySelector('#resume-btn');
            const exitBtn = overlay.querySelector('#exit-from-pause-btn');
            
            if (resumeBtn) {
                resumeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.togglePauseSession();
                });
            }
            
            if (exitBtn) {
                exitBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.exitStudySessionWithoutSaving();
                });
            }
        }
        
        // Add keyboard listener for spacebar to resume
        this.pauseKeyboardHandler = (e) => {
            if (e.code === 'Space' || e.code === 'Enter') {
                e.preventDefault();
                this.togglePauseSession();
            } else if (e.code === 'Escape') {
                e.preventDefault();
                this.exitStudySessionWithoutSaving();
            }
        };
        
        document.addEventListener('keydown', this.pauseKeyboardHandler);
        
        console.log('⏸️ Pause overlay shown with interactive controls');
    }
    
    /**
     * Hide pause overlay
     */
    hidePauseOverlay() {
        const overlay = document.getElementById('pause-overlay');
        if (overlay) {
            overlay.remove();
        }
        
        // Remove keyboard event listener
        if (this.pauseKeyboardHandler) {
            document.removeEventListener('keydown', this.pauseKeyboardHandler);
            this.pauseKeyboardHandler = null;
        }
        
        console.log('▶️ Pause overlay hidden and keyboard handlers removed');
    }
    
    /**
     * Show resume animation for visual feedback
     */
    showResumeAnimation() {
        // Create a brief resume flash animation
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 70%);
            pointer-events: none;
            z-index: 9997;
            animation: resumeFlash 0.6s ease-out;
        `;
        
        document.body.appendChild(flash);
        
        // Remove flash after animation
        setTimeout(() => {
            if (flash.parentNode) {
                flash.parentNode.removeChild(flash);
            }
        }, 600);
        
        // Animate the pause button for extra feedback
        const pauseBtn = document.getElementById('pause-session-btn');
        if (pauseBtn) {
            pauseBtn.style.animation = 'resumeBtnPulse 0.6s ease-out';
            setTimeout(() => {
                pauseBtn.style.animation = '';
            }, 600);
        }
    }
    
    /**
     * Show dopamine feedback animation
     */
    showDopamineFeedback(isCorrect, buttonElement) {
        console.log(`🎉 Showing ${isCorrect ? 'success' : 'error'} feedback animation`);
        
        // Add screen flash effect
        this.triggerScreenFlash(isCorrect);
        
        // Add button pulse effect
        const pulseClass = isCorrect ? 'success-pulse' : 'error-pulse';
        buttonElement.classList.add(pulseClass);
        
        // Remove pulse class after animation
        setTimeout(() => {
            buttonElement.classList.remove(pulseClass);
        }, 800);
        
        // Show large feedback animation
        this.showFeedbackOverlay(isCorrect);
        
        // Animate stat counter
        this.animateStatCounter(isCorrect);
        
        // Add confetti and sound effects for correct answers
        if (isCorrect) {
            this.triggerEnhancedConfetti();
            // Optional: Add success sound
            this.playSuccessSound();
        } else {
            // Add error feedback sound
            this.playErrorSound();
        }
    }
    
    /**
     * Show feedback overlay animation
     */
    showFeedbackOverlay(isCorrect) {
        const overlay = document.createElement('div');
        overlay.className = 'task-feedback-overlay';
        
        const animation = document.createElement('div');
        animation.className = `feedback-animation ${isCorrect ? 'correct' : 'incorrect'}`;
        animation.textContent = isCorrect ? '✓' : '×';
        
        overlay.appendChild(animation);
        document.body.appendChild(overlay);
        
        // Remove overlay after animation completes
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        }, 800);
    }
    
    /**
     * Animate stat counter when task is recorded
     */
    animateStatCounter(isCorrect) {
        const counterSelector = isCorrect ? '.counter-item.correct' : '.counter-item.incorrect';
        const counter = document.querySelector(counterSelector);
        
        if (counter) {
            counter.classList.add('celebrate');
            setTimeout(() => {
                counter.classList.remove('celebrate');
            }, 800);
        }
        
        // Also animate the total counter
        const totalCounter = document.querySelector('.counter-item:not(.correct):not(.incorrect)');
        if (totalCounter) {
            totalCounter.classList.add('celebrate');
            setTimeout(() => {
                totalCounter.classList.remove('celebrate');
            }, 800);
        }
    }
    
    /**
     * Trigger enhanced confetti animation for correct answers
     */
    triggerEnhancedConfetti() {
        const colors = ['#10b981', '#667eea', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];
        const confettiCount = 80; // More confetti pieces
        
        // Create multiple bursts for more dramatic effect
        for (let burst = 0; burst < 3; burst++) {
            setTimeout(() => {
                for (let i = 0; i < confettiCount / 3; i++) {
                    setTimeout(() => {
                        const confetti = document.createElement('div');
                        confetti.className = 'confetti';
                        
                        // More varied positioning
                        confetti.style.left = (Math.random() * 120 - 10) + 'vw'; // Can go slightly off-screen
                        confetti.style.top = (Math.random() * 20 - 10) + 'vh'; // Start from different heights
                        
                        const colorIndex = Math.floor(Math.random() * colors.length);
                        confetti.style.backgroundColor = colors[colorIndex];
                        confetti.style.animationDelay = Math.random() * 1 + 's';
                        
                        // Add rotation animation
                        confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
                        
                        document.body.appendChild(confetti);
                        
                        // Remove confetti after animation
                        setTimeout(() => {
                            if (confetti.parentNode) {
                                confetti.parentNode.removeChild(confetti);
                            }
                        }, 4500);
                    }, Math.random() * 200);
                }
            }, burst * 150); // Stagger the bursts
        }
    }
    
    /**
     * Trigger screen flash effect
     */
    triggerScreenFlash(isCorrect) {
        const flash = document.createElement('div');
        flash.className = `screen-flash ${isCorrect ? 'success' : 'error'}`;
        
        document.body.appendChild(flash);
        
        // Remove flash after animation
        setTimeout(() => {
            if (flash.parentNode) {
                flash.parentNode.removeChild(flash);
            }
        }, 500);
    }
    
    /**
     * Play success sound (visual feedback only for now)
     */
    playSuccessSound() {
        // For now, just add visual indication
        // In the future, could add actual audio feedback
        console.log('🎵 Success sound effect (visual feedback)');
    }
    
    /**
     * Play error sound (visual feedback only for now)
     */
    playErrorSound() {
        // For now, just add visual indication
        // In the future, could add actual audio feedback
        console.log('🔊 Error sound effect (visual feedback)');
    }
    
    /**
     * Clean up all animations and overlays
     */
    cleanupAnimations() {
        // Remove any existing feedback overlays
        const feedbackOverlays = document.querySelectorAll('.task-feedback-overlay');
        feedbackOverlays.forEach(overlay => overlay.remove());
        
        // Remove pause overlay
        const pauseOverlay = document.getElementById('pause-overlay');
        if (pauseOverlay) pauseOverlay.remove();
        
        // Remove screen flash effects
        const screenFlashes = document.querySelectorAll('.screen-flash');
        screenFlashes.forEach(flash => flash.remove());
        
        // Remove confetti
        const confetti = document.querySelectorAll('.confetti');
        confetti.forEach(piece => piece.remove());
        
        // Remove animation classes
        document.querySelectorAll('.success-pulse, .error-pulse, .celebrate').forEach(el => {
            el.classList.remove('success-pulse', 'error-pulse', 'celebrate');
        });
        
        console.log('🧹 Enhanced animations cleaned up');
    }
    
    /**
     * Reset study session counters
     */
    resetStudyCounters() {
        const totalCounter = document.getElementById('total-tasks-counter');
        const correctCounter = document.getElementById('correct-tasks-counter');
        const incorrectCounter = document.getElementById('incorrect-tasks-counter');
        const currentTaskNumber = document.getElementById('current-task-number');
        const currentTaskTime = document.getElementById('current-task-time');
        const sessionTimer = document.getElementById('session-timer');
        
        if (totalCounter) totalCounter.textContent = '0';
        if (correctCounter) correctCounter.textContent = '0';
        if (incorrectCounter) incorrectCounter.textContent = '0';
        if (currentTaskNumber) currentTaskNumber.textContent = '1';
        if (currentTaskTime) currentTaskTime.textContent = '00:00';
        if (sessionTimer) sessionTimer.textContent = '00:00';
        
        console.log('🔄 Study counters reset');
    }
    
    /**
     * Start a study session for data tracking
     */
    startStudySession() {
        if (this.isSessionActive) {
            console.warn('Session already active');
            return;
        }
        
        // Show session configuration modal first
        this.showSessionConfigModal();
        
        return null; // Will be set after configuration
    }
    
    /**
     * Show session configuration modal to set session-wide settings
     */
    async showSessionConfigModal() {
        const modal = document.getElementById('session-config-modal');
        if (!modal) {
            // Create modal if it doesn't exist
            this.createSessionConfigModal();
        }
        
        // Show modal immediately for better UX
        document.getElementById('session-config-modal').style.display = 'flex';
        
        // Populate dropdowns asynchronously without blocking UI
        this.populateSessionConfigDropdowns();
        
        console.log('🔧 Session configuration modal shown');
    }
    
    /**
     * Create session configuration modal
     */
    createSessionConfigModal() {
        const modalHTML = `
            <div class="modal-overlay" id="session-config-modal" style="display: none;">
                <div class="modal-content session-config-content">
                    <div class="modal-header">
                        <h3 class="modal-title">🎯 Konfiguracja Sesji Nauki</h3>
                        <p class="modal-subtitle">Ustaw parametry dla całej sesji nauki</p>
                    </div>
                    <div class="modal-body">
                        <form id="session-config-form">
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">Przedmiot <span class="required">*</span></label>
                                    <select name="session_subject" class="form-control" required>
                                        <option value="">Wybierz przedmiot...</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Miejsce nauki <span class="required">*</span></label>
                                    <select name="session_location" class="form-control" required>
                                        <option value="">Wybierz miejsce...</option>
                                        <option value="W szkole">🏫 W szkole</option>
                                        <option value="W domu">🏠 W domu</option>
                                        <option value="Na korepetycjach">👨‍🏫 Na korepetycjach</option>
                                        <option value="W bibliotece">📚 W bibliotece</option>
                                        <option value="Inne">📍 Inne miejsce</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Notatki sesji</label>
                                <textarea name="session_notes" class="form-control" rows="2" 
                                          placeholder="Opcjonalne notatki o sesji nauki..."></textarea>
                            </div>
                            <div class="form-actions">
                                <button type="button" id="start-session-btn" class="btn btn-primary">
                                    <span class="btn-icon">🚀</span> Rozpocznij Sesję
                                </button>
                                <button type="button" id="cancel-session-btn" class="btn btn-secondary">
                                    <span class="btn-icon">❌</span> Anuluj
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Setup event listeners
        document.getElementById('start-session-btn').addEventListener('click', () => this.confirmSessionStart());
        document.getElementById('cancel-session-btn').addEventListener('click', () => this.cancelSessionConfig());
    }
    
    /**
     * Populate dropdowns in session config modal
     */
    async populateSessionConfigDropdowns() {
        const subjectSelect = document.querySelector('#session-config-modal select[name="session_subject"]');
        if (!subjectSelect) return;
        
        // Show loading state immediately
        subjectSelect.innerHTML = '<option value="">Ładowanie przedmiotów...</option>';
        subjectSelect.disabled = true;
        
        try {
            // Check cache first
            let subjects = this.cache.subjects;
            if (!subjects) {
                const subjectsResponse = await this.googleSheetsAPI.fetchSubjects();
                if (subjectsResponse.success) {
                    subjects = subjectsResponse.subjects || [];
                    this.cache.subjects = subjects; // Cache the results
                }
            }
            
            if (subjects) {
                // Build options string in one go for better performance
                let optionsHTML = '<option value="">Wybierz przedmiot...</option>';
                subjects.forEach(subject => {
                    const name = subject.subject_name || subject.name || subject;
                    optionsHTML += `<option value="${name}">${name}</option>`;
                });
                
                subjectSelect.innerHTML = optionsHTML;
                subjectSelect.disabled = false;
            }
        } catch (error) {
            console.warn('Could not load subjects for session config:', error);
            subjectSelect.innerHTML = '<option value="">Błąd ładowania - spróbuj ponownie</option>';
            subjectSelect.disabled = false;
        }
    }
    
    /**
     * Confirm and start the session with configured settings
     */
    async confirmSessionStart() {
        const form = document.getElementById('session-config-form');
        const formData = new FormData(form);
        
        const sessionSubject = formData.get('session_subject');
        const sessionLocation = formData.get('session_location');
        const sessionNotes = formData.get('session_notes');
        
        // Validate required fields
        if (!sessionSubject || !sessionLocation) {
            alert('⚠️ Uzupełnij wszystkie wymagane pola!');
            return;
        }
        
        // Create session with configuration
        this.currentSession = {
            sessionId: this.generateSessionId(),
            startTime: new Date().toISOString(),
            endTime: null,
            durationMinutes: 0,
            totalTasks: 0,
            correctTasks: 0,
            incorrectTasks: 0,
            accuracyPercentage: 0,
            notes: sessionNotes || '',
            // Session-wide settings
            subject: sessionSubject,
            location: sessionLocation
        };
        
        this.sessionTasks = [];
        this.isSessionActive = true;
        
        // Start session timer
        this.startSessionTimer();
        
        // Hide config modal
        document.getElementById('session-config-modal').style.display = 'none';
        
        // Open session modal immediately, then initialize form asynchronously
        this.openStudySessionModal();
        this.initializeTaskForm(); // Non-blocking
        
        console.log('🎯 Study session started with config:', {
            id: this.currentSession.sessionId,
            subject: sessionSubject,
            location: sessionLocation
        });
        
        return this.currentSession.sessionId;
    }
    
    /**
     * Cancel session configuration
     */
    cancelSessionConfig() {
        document.getElementById('session-config-modal').style.display = 'none';
        console.log('❌ Session configuration cancelled');
    }
    
    /**
     * Record a task during the session - saves with current form data
     */
    recordStudyTask(isCorrect) {
        if (!this.isSessionActive || !this.currentSession) {
            this.startStudySession();
            return;
        }
        
        // Immediate visual feedback
        this.showTaskRecordingFeedback(isCorrect);
        
        // Store the correctness for when the task is saved
        this.pendingTaskCorrectness = isCorrect;
        
        // Save the task with current form data
        this.saveCurrentTask();
        
        console.log('📝 Task correctness recorded:', isCorrect, 'saving with form data');
    }
    
    /**
     * Show immediate visual feedback for task recording
     */
    showTaskRecordingFeedback(isCorrect) {
        const button = isCorrect ? 
            document.getElementById('correct-task-btn') : 
            document.getElementById('incorrect-task-btn');
            
        if (button) {
            // Add immediate visual feedback
            button.style.transform = 'scale(0.95)';
            button.style.opacity = '0.8';
            
            requestAnimationFrame(() => {
                button.style.transform = 'scale(1)';
                button.style.opacity = '1';
            });
        }
    }
    
    /**
     * Initialize the task form when session starts
     */
    async initializeTaskForm() {
        const taskEditSection = document.getElementById('task-edit-section');
        const taskEditForm = document.getElementById('task-edit-form');
        
        if (!taskEditSection || !taskEditForm) {
            console.error('Task editing elements not found');
            return;
        }
        
        // Form is always visible during session
        taskEditSection.style.display = 'block';
        
        // Reset first to ensure a clean slate
        taskEditForm.reset();
        
        // Load and populate categories for the session subject
        await this.populateTaskCategories();
        
        // Apply saved defaults (if any) after categories are populated
        this.applyTaskDefaultsToForm();
        
        console.log('📋 Task form initialized for session (with defaults if available)');
    }
    
    /**
     * Populate categories dropdown for task editing
     */
    async populateTaskCategories() {
        const categorySelect = document.querySelector('#task-edit-form select[name="category"]');
        const hiddenCategorySelect = document.getElementById('category-select-hidden');
        const targetSelect = hiddenCategorySelect || categorySelect;
        
        if (!targetSelect || !this.currentSession?.subject) {
            return;
        }
        
        // Show loading state immediately
        if (categorySelect) {
            categorySelect.innerHTML = '<option value="" disabled>Loading categories...</option>';
            categorySelect.disabled = true;
        }
        if (hiddenCategorySelect) {
            hiddenCategorySelect.innerHTML = '<option value="" disabled>Loading categories...</option>';
            hiddenCategorySelect.disabled = true;
        }
        
        try {
            const subject = this.currentSession.subject;
            // Check cache first
            let categories = this.cache.categories.get(subject);
            if (!categories) {
                const categoriesResponse = await this.googleSheetsAPI.fetchCategories(subject);
                if (categoriesResponse.success) {
                    categories = categoriesResponse.categories || [];
                    this.cache.categories.set(subject, categories); // Cache the results
                }
            }
            
            if (categories) {
                // Build options string in one go for better performance
                let optionsHTML = '';
                categories.forEach(category => {
                    const name = category.category_name || category.name || category;
                    optionsHTML += `<option value="${name}">${name}</option>`;
                });
                
                // Update both selects
                if (categorySelect) {
                    categorySelect.innerHTML = optionsHTML;
                    categorySelect.disabled = false;
                }
                if (hiddenCategorySelect) {
                    hiddenCategorySelect.innerHTML = optionsHTML;
                    hiddenCategorySelect.disabled = false;
                }
                
                // Set up mobile category selector if in mobile mode
                if (this.isMobileMode) {
                    this.setupMobileCategorySelector();
                }
            }
        } catch (error) {
            console.warn('Could not load categories for task editing:', error);
            const errorMessage = '<option value="" disabled>Error loading categories</option>';
            if (categorySelect) {
                categorySelect.innerHTML = errorMessage;
                setTimeout(() => categorySelect.disabled = false, 1000);
            }
            if (hiddenCategorySelect) {
                hiddenCategorySelect.innerHTML = errorMessage;
                setTimeout(() => hiddenCategorySelect.disabled = false, 1000);
            }
        }
    }
    
    /**
     * Save the current task with details from the form
     */
    saveCurrentTask() {
        const taskEditForm = document.getElementById('task-edit-form');
        const formData = new FormData(taskEditForm);
        
        const taskName = formData.get('task_name');
        const description = formData.get('description') || ''; // Optional field
        
        // Get multiple selected categories
        const categorySelect = taskEditForm.querySelector('select[name="category"]');
        const selectedCategories = Array.from(categorySelect.selectedOptions).map(option => option.value);
        const category = selectedCategories.join(', '); // Join multiple categories with comma
        
        // Validate required fields only
        if (!taskName || selectedCategories.length === 0) {
            alert('⚠️ Uzupełnij nazwę zadania i wybierz przynajmniej jedną kategorię!');
            return;
        }
        
        const taskOrder = this.sessionTasks.length + 1;
        
        // Create complete task object
        const task = {
            task_id: this.generateTaskId(),
            task_name: taskName,
            description: description,
            category: category,
            subject: this.currentSession.subject,
            correctness: this.pendingTaskCorrectness,
            timestamp: new Date().toISOString(),
            session_id: this.currentSession.sessionId,
            task_order: taskOrder,
            location: this.currentSession.location
        };
        
        console.log(`📝 Saving complete task ${taskOrder}:`, task);
        
        this.sessionTasks.push(task);
        
        // Update session counters
        this.currentSession.totalTasks++;
        if (this.pendingTaskCorrectness) {
            this.currentSession.correctTasks++;
        } else {
            this.currentSession.incorrectTasks++;
        }
        
        // Calculate accuracy
        this.currentSession.accuracyPercentage = this.currentSession.totalTasks > 0 ? 
            Math.round((this.currentSession.correctTasks / this.currentSession.totalTasks) * 100) : 0;
        
        // Update UI counters
        this.updateTaskCounters();
        
        // Persist current form values as defaults for the next task (per subject)
        this.saveTaskDefaults({
            task_name: taskName,
            description: description,
            categories: selectedCategories
        });
        
        // Clear form for next task and apply defaults
        this.clearTaskForm();
        
        console.log('✅ Task saved successfully:', task.task_name);
        
        return task;
    }
    
    /**
     * Clear the task form for next task
     */
    clearTaskForm() {
        const taskEditForm = document.getElementById('task-edit-form');
        if (taskEditForm) {
            taskEditForm.reset();
            
            // Apply saved defaults (if any) for the next task
            this.applyTaskDefaultsToForm();
            
            // Focus on first field for next task
            const firstInput = taskEditForm.querySelector('input[name="task_name"]');
            if (firstInput) {
                // Use requestAnimationFrame for smoother focus
                requestAnimationFrame(() => firstInput.focus());
            }
        }
        
        this.pendingTaskCorrectness = null;
        console.log('🔄 Task form cleared for next task (defaults applied if available)');
    }
    
    /**
     * Manual clear form button handler
     */
    manualClearForm() {
        this.clearTaskForm();
        console.log('🔄 Task form manually cleared');
    }
    
    /**
     * Save current form values as defaults in localStorage (scoped per subject)
     */
    saveTaskDefaults(defaults) {
        try {
            if (!this.currentSession) return;
            
            // Analyze task_name and auto-increment for the next default (supports pure numbers and trailing number patterns)
            const rawName = (defaults.task_name || '').trim();
            const { nextName, autoIncrementInfo } = this.incrementTaskName(rawName);
            
            const payload = {
                task_name: nextName,
                description: defaults.description || '',
                categories: Array.isArray(defaults.categories) ? defaults.categories : [],
                autoIncrementInfo
            };
            
            // Store only for the current study session
            this.currentSession.taskDefaults = payload;
            console.log('💾 Saved task defaults for current session:', payload);
        } catch (e) {
            console.warn('Unable to save task defaults:', e);
        }
    }
    
    /**
     * Load saved defaults for the current subject from localStorage
     */
    loadTaskDefaults() {
        try {
            // Read only from current session memory
            if (!this.currentSession || !this.currentSession.taskDefaults) return null;
            return this.currentSession.taskDefaults;
        } catch (e) {
            console.warn('Unable to load task defaults:', e);
            return null;
        }
    }
    
    /**
     * Apply saved defaults (if any) to the task form and mobile selector
     */
    applyTaskDefaultsToForm() {
        const defaults = this.loadTaskDefaults();
        if (!defaults) return;
        
        const form = document.getElementById('task-edit-form');
        if (!form) return;
        
        // Apply text fields
        const nameInput = form.querySelector('input[name="task_name"]');
        const descTextarea = form.querySelector('textarea[name="description"]');
        if (nameInput && defaults.task_name) nameInput.value = defaults.task_name;
        if (descTextarea && typeof defaults.description === 'string') descTextarea.value = defaults.description;
        
        // Show or clear auto-increment hint
        if (defaults.autoIncrementInfo && nameInput) {
            this.showTaskNameAutoHint(defaults.autoIncrementInfo);
        } else {
            this.clearTaskNameAutoHint();
        }
        
        // Hide the hint as soon as user edits the Task Name manually
        if (nameInput && !nameInput.dataset.hintListener) {
            nameInput.addEventListener('input', () => this.clearTaskNameAutoHint());
            nameInput.dataset.hintListener = 'true';
        }
        
        // Apply categories to both the hidden and visible selects if present
        const hiddenSelect = document.getElementById('category-select-hidden');
        const visibleSelect = form.querySelector('select[name="category"]');
        const categories = Array.isArray(defaults.categories) ? defaults.categories : [];
        
        const applySelection = (selectEl) => {
            if (!selectEl) return;
            Array.from(selectEl.options).forEach(opt => {
                opt.selected = categories.includes(opt.value);
            });
        };
        
        applySelection(hiddenSelect);
        applySelection(visibleSelect);
        
        // Update mobile selector/count to reflect selection
        const countDisplay = document.getElementById('category-count');
        if (this.isMobileMode) {
            // Rebuild UI from hidden select and preserve selections
            this.setupMobileCategorySelector();
        }
        if (hiddenSelect && countDisplay) {
            this.updateCategoryCount(hiddenSelect, countDisplay);
        }
        
        console.log('✅ Applied saved task defaults to form');
    }
    
    /**
     * Determine the next default task name based on current value.
     * - If the whole value is numeric, increment it (preserve leading zeros)
     * - Else, if there's a trailing number, increment that and keep the prefix
     * - Else, return unchanged
     */
    incrementTaskName(rawName) {
        try {
            if (!rawName) return { nextName: rawName, autoIncrementInfo: null };
            const trimmed = rawName.trim();
            // Case 1: pure number
            if (/^\d+$/.test(trimmed)) {
                const to = this.incrementNumberString(trimmed);
                return { nextName: to, autoIncrementInfo: { from: trimmed, to } };
            }
            // Case 2: trailing number in a larger string, e.g. "Task 16" or "Zadanie_007"
            const match = trimmed.match(/^(.*?)(\d+)(\s*)$/);
            if (match) {
                const prefix = match[1];
                const digits = match[2];
                const toDigits = this.incrementNumberString(digits);
                const to = `${prefix}${toDigits}`;
                return { nextName: to, autoIncrementInfo: { from: trimmed, to } };
            }
            // Default: unchanged
            return { nextName: rawName, autoIncrementInfo: null };
        } catch (e) {
            return { nextName: rawName, autoIncrementInfo: null };
        }
    }

    /**
     * Increment a numeric string preserving leading zeros when possible
     */
    incrementNumberString(numStr) {
        try {
            const originalLength = numStr.length;
            const n = parseInt(numStr, 10);
            const incremented = (n + 1).toString();
            // Preserve zero padding if length allows
            if (incremented.length < originalLength) {
                return incremented.padStart(originalLength, '0');
            }
            return incremented;
        } catch (e) {
            return numStr; // Fallback to original if anything goes wrong
        }
    }
    
    /**
     * Show a small info hint for auto-increment applied to task name
     */
    showTaskNameAutoHint(info) {
        const input = document.querySelector('#task-edit-form input[name="task_name"]');
        const formGroup = input ? input.closest('.form-group') : null;
        if (!formGroup) return;
        
        let hint = document.getElementById('task-name-hint');
        if (!hint) {
            hint = document.createElement('div');
            hint.id = 'task-name-hint';
            hint.className = 'field-help';
            formGroup.appendChild(hint);
        }
        
        const from = info.from;
        const to = info.to;
        hint.innerHTML = `✨ Auto +1: ustawiono <strong>${to}</strong> (z ${from})`;
        hint.style.display = 'block';
    }
    
    /**
     * Clear the auto-increment hint if present
     */
    clearTaskNameAutoHint() {
        const hint = document.getElementById('task-name-hint');
        if (hint) {
            hint.style.display = 'none';
            hint.textContent = '';
        }
    }
    
    /**
     * Update task counters in the UI
     */
    updateTaskCounters() {
        const totalCounter = document.getElementById('total-tasks-counter');
        const correctCounter = document.getElementById('correct-tasks-counter');
        const incorrectCounter = document.getElementById('incorrect-tasks-counter');
        const currentTaskNumber = document.getElementById('current-task-number');
        
        if (totalCounter) totalCounter.textContent = this.currentSession?.totalTasks || 0;
        if (correctCounter) correctCounter.textContent = this.currentSession?.correctTasks || 0;
        if (incorrectCounter) incorrectCounter.textContent = this.currentSession?.incorrectTasks || 0;
        if (currentTaskNumber) currentTaskNumber.textContent = (this.sessionTasks.length + 1) || 1;
    }
    
    /**
     * End session and show results modal
     */
    finishStudySession() {
        if (!this.isSessionActive || !this.currentSession) {
            console.warn('No active session to finish');
            return;
        }
        
        this.currentSession.endTime = new Date().toISOString();
        
        // Stop session timer
        this.stopSessionTimer();
        
        // Calculate duration
        const startTime = new Date(this.currentSession.startTime);
        const endTime = new Date(this.currentSession.endTime);
        this.currentSession.durationMinutes = Math.round((endTime - startTime) / (1000 * 60));
        
        console.log('🏁 Session finished:', this.currentSession.sessionId);
        
        // Show simplified results modal
        this.showStudyResultsModal();
        
        return this.currentSession;
    }
    
    /**
     * Show study results modal with session summary
     */
    showStudyResultsModal() {
        const resultsModal = document.getElementById('study-results-modal');
        if (!resultsModal) {
            console.error('Results modal not found');
            return;
        }
        
        // Show modal immediately for better UX
        resultsModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Update content asynchronously using requestAnimationFrame for smoother rendering
        requestAnimationFrame(() => {
            this.updateResultsDisplay();
        });
        
        console.log('📊 Showing session results modal');
    }
    
    /**
     * Update results display content
     */
    updateResultsDisplay() {
        // Update timer display
        const finalSessionTime = document.getElementById('final-session-time');
        if (finalSessionTime && this.currentSession) {
            const minutes = this.currentSession.durationMinutes;
            const hours = Math.floor(minutes / 60);
            const remainingMinutes = minutes % 60;
            
            if (hours > 0) {
                finalSessionTime.textContent = `${hours}h ${remainingMinutes}m`;
            } else {
                finalSessionTime.textContent = `${remainingMinutes}m`;
            }
        }
        
        // Update counters
        this.updateResultsCounters();
    }
    
    /**
     * Update counters in results modal
     */
    updateResultsCounters() {
        if (!this.currentSession) return;
        
        const finalTotalTasks = document.getElementById('final-total-tasks');
        const finalCorrectTasks = document.getElementById('final-correct-tasks');
        const finalIncorrectTasks = document.getElementById('final-incorrect-tasks');
        const finalAccuracy = document.getElementById('final-accuracy');
        
        if (finalTotalTasks) finalTotalTasks.textContent = this.currentSession.totalTasks || 0;
        if (finalCorrectTasks) finalCorrectTasks.textContent = this.currentSession.correctTasks || 0;
        if (finalIncorrectTasks) finalIncorrectTasks.textContent = this.currentSession.incorrectTasks || 0;
        if (finalAccuracy) finalAccuracy.textContent = `${this.currentSession.accuracyPercentage || 0}%`;
    }
    
    /**
     * Hide study results modal
     */
    hideStudyResultsModal() {
        const resultsModal = document.getElementById('study-results-modal');
        if (resultsModal) {
            resultsModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }
    
    /**
     * Save session directly from results modal
     */
    async saveSessionFromResults() {
        if (!this.currentSession || !this.sessionTasks.length) {
            console.warn('No session data to save');
            return;
        }
        
        // Get additional notes from results modal
        const sessionNotesAdjustment = document.getElementById('session-notes-adjustment');
        if (sessionNotesAdjustment && sessionNotesAdjustment.value.trim()) {
            this.currentSession.notes = `${this.currentSession.notes || ''}\n${sessionNotesAdjustment.value.trim()}`;
        }
        
        try {
            console.log('💾 Saving complete session with', this.sessionTasks.length, 'tasks');
            
            // Show enhanced loading with specific message
            this.setLoadingState(true, 'Zapisywanie sesji do Google Sheets...');
            
            // Save session and tasks to Google Sheets
            const result = await this.saveCompleteSession();
            
            if (result && result.success) {
                // Show success notification
                this.showSuccessNotification('✅ Sesja zapisana pomyślnie!', `ID: ${result.sessionId || 'N/A'} | Zadań: ${result.tasksCount || this.sessionTasks.length}`);
                
                // Session reset disabled - keeping session data persistent
                // this.resetSessionState();
                console.log('🔒 Session data preserved after save (reset disabled)');
                
                // Hide results modal
                this.hideStudyResultsModal();
                
                console.log('✅ Session saved successfully');
            } else {
                throw new Error('Failed to save session');
            }
        } catch (error) {
            console.error('❌ Error saving session:', error);
            this.showErrorNotification('⚠️ Błąd zapisywania sesji', 'Spróbuj ponownie lub skontaktuj się z administratorem');
        } finally {
            // Always hide loading state
            this.setLoadingState(false);
        }
    }
    
    /**
     * Open detailed task editing (shows the original analysis modal)
     */
    openDetailedTaskEditing() {
        // Hide results modal
        this.hideStudyResultsModal();
        
        // Show the original analysis modal for detailed editing
        this.populateAnalysisModal();
        this.showAnalysisModal();
        
        console.log('✏️ Opened detailed task editing modal');
    }
    
    /**
     * Reset session state after saving
     */
    resetSessionState() {
        this.currentSession = null;
        this.sessionTasks = [];
        this.isSessionActive = false;
        this.pendingTaskCorrectness = null;
        
        // Reset UI elements
        this.resetStudyCounters();
        
        console.log('🔄 Session state reset');
    }
    
    /**
     * Show analysis modal with session data
     */
    showAnalysisModal() {
        const modal = document.getElementById('study-analysis-modal');
        if (modal) {
            // Show modal immediately
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            // Update content asynchronously
            requestAnimationFrame(() => {
                this.updateSessionSummary();
            });
            
            console.log('📋 Analysis modal shown');
        }
    }
    
    /**
     * Populate analysis modal with forms for each task
     */
    async populateAnalysisModal() {
        const container = document.getElementById('analysis-form-container');
        if (!container) {
            console.error('Analysis form container not found');
            return;
        }
        
        // Clear existing content
        container.innerHTML = '';
        
        if (!this.sessionTasks || this.sessionTasks.length === 0) {
            container.innerHTML = `
                <div class="no-tasks-message">
                    <div class="no-tasks-icon">📝</div>
                    <h4>Brak zadań do analizy</h4>
                    <p>Nie zarejestrowano żadnych zadań w tej sesji.</p>
                </div>
            `;
            return;
        }
        
        console.log('📝 Populating analysis modal with', this.sessionTasks.length, 'tasks');
        
        // Load subjects and categories for dropdowns
        let subjects = [];
        let categories = [];
        
        try {
            const subjectsResponse = await this.googleSheetsAPI.fetchSubjects();
            if (subjectsResponse.success) {
                subjects = subjectsResponse.subjects || [];
            }
            
            // Fetch categories filtered by session subject
            const categoriesResponse = await this.googleSheetsAPI.fetchCategories(this.currentSession?.subject);
            if (categoriesResponse.success) {
                categories = categoriesResponse.categories || [];
            }
        } catch (error) {
            console.warn('Could not load subjects/categories for forms:', error);
        }
        
        // Create form for each task
        this.sessionTasks.forEach((task, index) => {
            const taskForm = this.createTaskForm(task, index, subjects, categories);
            container.appendChild(taskForm);
        });
        
        console.log('✅ Analysis modal populated with', this.sessionTasks.length, 'task forms');
    }
    
    /**
     * Create individual task form for analysis modal - adapted for original form structure
     */
    createTaskForm(task, index, subjects, categories) {
        const taskDiv = document.createElement('div');
        taskDiv.className = 'task-analysis-form';
        taskDiv.innerHTML = `
            <div class="task-header">
                <h4 class="task-title">
                    <span class="task-number">Zadanie ${index + 1}</span>
                    <span class="correctness-badge ${task.correctness === true ? 'correct' : 'incorrect'}">
                        ${task.correctness === true ? '✅ Poprawnie' : '❌ Błędnie'}
                    </span>
                </h4>
            </div>
            <div class="task-form-content">
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Nazwa zadania <span class="required">*</span></label>
                        <input type="text" name="task_name" class="form-control" 
                               placeholder="Opisz zadanie..." maxlength="100" required
                               value="${task.task_name || ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Przedmiot (z sesji)</label>
                        <input type="text" name="subject" class="form-control" 
                               value="${task.subject || ''}" readonly>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Kategorie (wybierz wszystkie pasujące) <span class="required">*</span></label>
                    <div class="category-selection-instructions">
                        <div class="instruction-icon">📝</div>
                        <div class="instruction-text">Dotknij kategorii aby je zaznaczyć. Możesz wybrać kilka kategorii.</div>
                    </div>
                    <div class="category-selection-grid" data-task-index="${index}">
                        ${this.generateCategorySelection(categories, task.category || '')}
                    </div>
                    <div class="selected-categories-summary" style="display: none;">
                        <div class="summary-title">Wybrane kategorie:</div>
                        <div class="selected-categories-list"></div>
                    </div>
                    <input type="hidden" name="categories" class="categories-input">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Miejsce (z sesji)</label>
                        <input type="text" name="location" class="form-control" 
                               value="${task.location || ''}" readonly>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Opis zadania</label>
                    <textarea name="description" class="form-control" 
                              placeholder="Opcjonalny opis zadania..." 
                              maxlength="1000" rows="3">${task.description || ''}</textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">ID Sesji</label>
                        <input type="text" name="session_id" class="form-control" 
                               value="${task.session_id || ''}" readonly>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Kolejność w sesji</label>
                        <input type="number" name="task_order" class="form-control" 
                               value="${task.task_order || index + 1}" readonly>
                    </div>
                </div>
            </div>
        `;
        
        // Store task reference for later retrieval
        taskDiv.dataset.taskIndex = index;
        
        // Setup category selection after creating the form
        setTimeout(() => {
            this.setupCategorySelection(taskDiv, index);
        }, 100);
        
        return taskDiv;
    }
    
    /**
     * Generate category selection HTML
     */
    generateCategorySelection(categories, selectedCategories = '') {
        if (!categories || categories.length === 0) {
            return `
                <div class="no-categories-message">
                    <div style="text-align: center; padding: 20px; color: #6b7280;">
                        <div style="font-size: 24px; margin-bottom: 8px;">📂</div>
                        <div>Brak kategorii dla tego przedmiotu</div>
                    </div>
                </div>
            `;
        }
        
        const selectedArray = selectedCategories.split(',').map(c => c.trim()).filter(c => c);
        
        return categories.map(category => {
            const name = category.category_name || category.name || category;
            const difficulty = category.difficulty || 'Średni';
            const isSelected = selectedArray.includes(name);
            const difficultyClass = this.getDifficultyClass(difficulty);
            
            return `
                <div class="category-selection-item ${isSelected ? 'selected' : ''}" 
                     data-category="${name}" data-difficulty="${difficulty}">
                    <div class="category-item-content">
                        <div class="category-item-name">${name}</div>
                        <div class="category-item-difficulty">
                            <span class="difficulty-badge ${difficultyClass}">
                                ${this.getDifficultyIcon(difficulty)} ${difficulty}
                            </span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    /**
     * Setup category selection interactions
     */
    setupCategorySelection(taskDiv, taskIndex) {
        const grid = taskDiv.querySelector('.category-selection-grid');
        const hiddenInput = taskDiv.querySelector('.categories-input');
        const summary = taskDiv.querySelector('.selected-categories-summary');
        const summaryList = taskDiv.querySelector('.selected-categories-list');
        
        if (!grid || !hiddenInput || !summary || !summaryList) return;
        
        // Add click handlers to category items
        const categoryItems = grid.querySelectorAll('.category-selection-item');
        categoryItems.forEach(item => {
            item.addEventListener('click', () => {
                const isSelected = item.classList.contains('selected');
                
                if (isSelected) {
                    item.classList.remove('selected');
                } else {
                    item.classList.add('selected');
                }
                
                // Update hidden input and summary
                this.updateCategorySelection(grid, hiddenInput, summary, summaryList);
            });
        });
        
        // Initialize with current selection
        this.updateCategorySelection(grid, hiddenInput, summary, summaryList);
    }
    
    /**
     * Update category selection hidden input and summary
     */
    updateCategorySelection(grid, hiddenInput, summary, summaryList) {
        const selectedItems = grid.querySelectorAll('.category-selection-item.selected');
        const selectedCategories = Array.from(selectedItems).map(item => item.getAttribute('data-category'));
        
        // Update hidden input
        hiddenInput.value = selectedCategories.join(', ');
        
        // Update summary
        if (selectedCategories.length > 0) {
            summary.style.display = 'block';
            summaryList.innerHTML = selectedCategories.map(category => `
                <span class="selected-category-tag">
                    ${category}
                    <button type="button" class="remove-category" onclick="this.closest('.task-analysis-form').querySelector('[data-category=\"${category}\"]').click()">
                        ×
                    </button>
                </span>
            `).join('');
        } else {
            summary.style.display = 'none';
        }
    }
    
    /**
     * Get CSS class for difficulty level
     */
    getDifficultyClass(difficulty) {
        if (!difficulty) return 'medium';
        const level = difficulty.toLowerCase();
        if (level.includes('łatwy') || level.includes('easy')) return 'easy';
        if (level.includes('trudny') || level.includes('hard')) return 'hard';
        return 'medium';
    }
    
    /**
     * Get icon for difficulty level
     */
    getDifficultyIcon(difficulty) {
        if (!difficulty) return '⚖️';
        const level = difficulty.toLowerCase();
        if (level.includes('łatwy') || level.includes('easy')) return '😊';
        if (level.includes('trudny') || level.includes('hard')) return '😰';
        return '⚖️';
    }
    
    /**
     * Update session summary in modal header
     */
    updateSessionSummary() {
        const totalEl = document.getElementById('summary-total');
        const correctEl = document.getElementById('summary-correct');
        const incorrectEl = document.getElementById('summary-incorrect');
        
        if (totalEl) totalEl.textContent = this.currentSession?.totalTasks || 0;
        if (correctEl) correctEl.textContent = this.currentSession?.correctTasks || 0;
        if (incorrectEl) incorrectEl.textContent = this.currentSession?.incorrectTasks || 0;
    }
    
    /**
     * Hide analysis modal
     */
    hideAnalysisModal() {
        const modal = document.getElementById('study-analysis-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    /**
     * Save complete session data to Google Sheets
     */
    async saveCompleteSession() {
        // StudyTrackingManager is disabled - no duplicate prevention needed
        
        if (!this.isSessionActive || !this.currentSession) {
            console.error('No active session to save');
            alert('⚠️ Brak aktywnej sesji do zapisania');
            return;
        }
        
        if (!this.sessionTasks || this.sessionTasks.length === 0) {
            console.error('No tasks to save in session');
            alert('⚠️ Brak zadań do zapisania w sesji');
            return;
        }
        
        try {
            // Show loading state
            this.setLoadingState(true, 'Przygotowywanie danych...');
            
            // Use tasks that are already stored in sessionTasks (from recordStudyTask/saveCurrentTask)
            const tasksForSaving = this.prepareTasksForSaving();
            
            // Quick validation
            if (tasksForSaving.length === 0) {
                this.setLoadingState(false);
                alert('⚠️ Brak zadań do zapisania');
                return;
            }
            
            this.setLoadingState(true, 'Zapisywanie sesji...');
            
            // Prepare data for Google Sheets
            const sessionData = {
                sessionData: {
                    session_id: this.currentSession.sessionId,
                    start_time: this.currentSession.startTime,
                    end_time: this.currentSession.endTime,
                    duration_minutes: this.currentSession.durationMinutes,
                    total_tasks: this.currentSession.totalTasks,
                    correct_tasks: this.currentSession.correctTasks,
                    accuracy_percentage: this.currentSession.accuracyPercentage,
                    notes: this.currentSession.notes || 'Study session completed'
                },
                tasks: tasksForSaving // Use prepared tasks data
            };
            
            console.log('📤 Sending session data to Google Sheets:', sessionData);
            
            // Send to Google Sheets using GoogleSheetsAPI-v2 for consistency
            const response = await this.saveSessionUsingAPI(sessionData);
            
            if (response.success) {
                console.log('✅ Session saved successfully:', response);
                this.showSuccessNotification('✅ Sesja zapisana pomyślnie!', `ID: ${response.sessionId} | Zadań: ${response.tasksCount}`);
                this.resetSession();
                this.hideAnalysisModal();
                return response;
            } else {
                console.error('❌ Failed to save session:', response.error);
                this.showErrorNotification('❌ Błąd zapisywania sesji', response.error || 'Nieznany błąd');
                return response;
            }
            
        } catch (error) {
            console.error('❌ Error saving session:', error);
            this.showErrorNotification('❌ Błąd zapisywania sesji', error.message);
            return { success: false, error: error.message };
        } finally {
            this.setLoadingState(false);
        }
    }
    
    /**
     * Prepare tasks for saving - converts sessionTasks to the format expected by Google Sheets
     */
    prepareTasksForSaving() {
        if (!this.sessionTasks || this.sessionTasks.length === 0) {
            console.warn('No tasks to prepare for saving');
            return [];
        }
        
        console.log('📦 Preparing', this.sessionTasks.length, 'tasks for saving...');
        
        const preparedTasks = this.sessionTasks.map((task, index) => {
            console.log(`📝 Preparing task ${index + 1}:`, task);
            
            // Convert correctness to Yes/No format for Google Sheets
            const correctnessString = this.convertCorrectnessToString(task.correctness);
            console.log(`  - Correctness: ${task.correctness} → ${correctnessString}`);
            
            // Create task object with field names matching backend expectations
            const preparedTask = {
                task_id: task.task_id || this.generateTaskId(),
                task_name: task.task_name || '',
                description: task.description || '',
                categories: task.category || '', // Backend expects 'categories' (plural) but our form uses 'category' (singular)
                correctly_completed: correctnessString, // Backend expects 'correctly_completed' 
                start_time: task.timestamp || new Date().toISOString(),
                end_time: task.timestamp || new Date().toISOString(),
                location: task.location || this.currentSession?.location || '',
                subject: task.subject || this.currentSession?.subject || '',
                session_id: task.session_id || this.currentSession?.sessionId || ''
            };
            
            console.log(`  - Prepared task:`, preparedTask);
            return preparedTask;
        });
        
        console.log('✅ All tasks prepared for saving:', preparedTasks);
        return preparedTasks;
    }
    
    /**
     * Collect form data from all task forms in analysis modal
     */
    collectTaskFormData() {
        const formContainer = document.getElementById('analysis-form-container');
        if (!formContainer) {
            console.error('Analysis form container not found');
            return [];
        }
        
        const taskForms = formContainer.querySelectorAll('.task-analysis-form');
        const tasksWithData = [];
        
        taskForms.forEach((form, index) => {
            const taskIndex = parseInt(form.dataset.taskIndex);
            const originalTask = this.sessionTasks[taskIndex];
            
            if (!originalTask) {
                console.warn(`Original task not found for index ${taskIndex}`);
                return;
            }
            
            // Extract form data
            const taskName = form.querySelector('input[name="task_name"]')?.value?.trim() || '';
            const subject = form.querySelector('input[name="subject"]')?.value?.trim() || ''; // Readonly from session
            
            // Handle multiple categories selection - using hidden input from category selection interface
            const categoryInput = form.querySelector('input[name="categories"], input.categories-input');
            const category = categoryInput?.value?.trim() || ''; // Categories already joined with comma in hidden input
            
            console.log(`📁 Category debug for task ${index + 1}:`);
            console.log('  - Category input found:', !!categoryInput);
            console.log('  - Category input value:', categoryInput?.value);
            console.log('  - Final category value:', category);
            
            const description = form.querySelector('textarea[name="description"]')?.value?.trim() || '';
            const location = form.querySelector('input[name="location"]')?.value?.trim() || ''; // Readonly from session
            const sessionId = form.querySelector('input[name="session_id"]')?.value?.trim() || '';
            const taskOrder = form.querySelector('input[name="task_order"]')?.value?.trim() || '';
            
            // Convert correctness to Yes/No format for Google Sheets
            console.log(`📊 Correctness debug for task ${index + 1}:`);
            console.log('  - Original task:', originalTask);
            console.log('  - Original correctness:', originalTask.correctness, '(type:', typeof originalTask.correctness, ')');
            
            const correctnessString = this.convertCorrectnessToString(originalTask.correctness);
            console.log('  - Converted correctness:', correctnessString);
            
            // Create complete task object with field names matching backend expectations
            const completeTask = {
                task_id: originalTask.task_id || this.generateTaskId(),
                task_name: taskName,
                description: description,
                categories: category, // Backend expects 'categories' (plural)
                correctly_completed: correctnessString, // Backend expects 'correctly_completed' 
                start_time: originalTask.timestamp || new Date().toISOString(),
                end_time: originalTask.timestamp || new Date().toISOString(),
                location: location,
                subject: subject,
                session_id: sessionId
            };
            
            console.log(`📦 Final task ${index + 1} data:`, completeTask);
            tasksWithData.push(completeTask);
        });
        
        console.log('📝 Collected form data for', tasksWithData.length, 'tasks');
        console.log('📦 All tasks data:', tasksWithData);
        return tasksWithData;
    }
    
    /**
     * Validate that all task forms have required fields filled
     */
    validateTaskForms(tasks) {
        const errors = [];
        
        tasks.forEach((task, index) => {
            const taskNum = index + 1;
            
            if (!task.task_name) {
                errors.push(`Zadanie ${taskNum}: Brak nazwy zadania`);
            }
            // Note: subject and location are set at session level, so always present
            // Note: description is now optional
            if (!task.categories || task.categories.trim() === '') {
                errors.push(`Zadanie ${taskNum}: Wybierz przynajmniej jedną kategorię`);
            }
        });
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
    
    /**
     * Save session data using GoogleSheetsAPI-v2 for consistent field mapping
     */
    async saveSessionUsingAPI(sessionData) {
        try {
            let tasksSaved = 0;
            let sessionSaved = false;
            
            console.log('💾 Starting to save session using GoogleSheetsAPI-v2...');
            
            // Save each task using GoogleSheetsAPI-v2's submitStudyTask method
            for (const task of sessionData.tasks) {
                console.log('💾 Saving task:', task);
                
                // Map fields to what submitStudyTask expects
                const taskDataForAPI = {
                    task_id: task.task_id,
                    task_name: task.task_name,
                    description: task.description,
                    categories: task.categories, // This will be mapped correctly
                    correctly_completed: task.correctly_completed, // This is already 'Yes'/'No'
                    start_time: task.start_time,
                    end_time: task.end_time,
                    location: task.location,
                    subject: task.subject,
                    session_id: task.session_id
                };
                
                try {
                    await this.googleSheetsAPI.submitStudyTask(taskDataForAPI);
                    tasksSaved++;
                    console.log(`✅ Task ${tasksSaved} saved successfully`);
                } catch (taskError) {
                    console.error(`❌ Error saving task ${tasksSaved + 1}:`, taskError);
                    throw new Error(`Failed to save task ${tasksSaved + 1}: ${taskError.message}`);
                }
            }
            
            // Save session summary
            try {
                await this.googleSheetsAPI.addStudySession(sessionData.sessionData);
                sessionSaved = true;
                console.log('✅ Session summary saved successfully');
            } catch (sessionError) {
                console.error('❌ Error saving session summary:', sessionError);
                // Don't fail the entire operation if session summary fails
                console.warn('Session summary save failed, but tasks were saved');
            }
            
            return {
                success: true,
                message: 'Session saved using GoogleSheetsAPI-v2',
                sessionId: sessionData.sessionData.session_id,
                tasksCount: tasksSaved,
                sessionSummaryStatus: sessionSaved ? 'saved' : 'failed'
            };
            
        } catch (error) {
            console.error('❌ Error in saveSessionUsingAPI:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Legacy save method (kept for fallback)
     */
    async saveToGoogleSheets(sessionData) {
        try {
            const formData = new FormData();
            formData.append('action', 'saveCompleteStudySession');
            formData.append('spreadsheetId', this.config.SPREADSHEET_ID);
            formData.append('data', JSON.stringify(sessionData));
            
            const response = await fetch(this.config.GAS_WEB_APP_URL, {
                method: 'POST',
                mode: 'no-cors',
                body: formData
            });
            
            // Note: no-cors mode means we can't read the response body
            // We assume success if no error is thrown
            return {
                success: true,
                message: 'Session saved successfully',
                sessionId: sessionData.sessionData.session_id,
                tasksCount: sessionData.tasks.length
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Reset session data
     */
    resetSession() {
        // Stop any running timers
        this.stopSessionTimer();
        
        this.currentSession = null;
        this.sessionTasks = [];
        this.isSessionActive = false;
        console.log('🔄 Session reset');
    }
    
    /**
     * Show success message
     */
    showSuccessMessage(response) {
        const message = `✅ Sesja zapisana pomyślnie!\n` +
                       `ID sesji: ${response.sessionId}\n` +
                       `Zadań: ${response.tasksCount}`;
        alert(message);
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
     * Start session timer
     */
    startSessionTimer() {
        // Clear any existing timer
        if (this.sessionTimerInterval) {
            clearInterval(this.sessionTimerInterval);
        }
        
        this.sessionTimerInterval = setInterval(() => {
            this.updateSessionTimer();
        }, 1000); // Update every second
        
        console.log('⏱️ Session timer started');
    }
    
    /**
     * Stop session timer
     */
    stopSessionTimer() {
        if (this.sessionTimerInterval) {
            clearInterval(this.sessionTimerInterval);
            this.sessionTimerInterval = null;
            console.log('⏱️ Session timer stopped');
        }
    }
    
    /**
     * Update session timer display
     */
    updateSessionTimer() {
        if (!this.isSessionActive || !this.currentSession) {
            return;
        }
        
        const now = new Date();
        const startTime = new Date(this.currentSession.startTime);
        const elapsed = Math.floor((now - startTime) / 1000); // Total seconds
        
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Update session timer display
        const sessionTimerEl = document.getElementById('session-timer');
        if (sessionTimerEl) {
            sessionTimerEl.textContent = timeString;
        }
        
        // Also update task timer (time since last task)
        // For now, we'll just show session time, but this could be enhanced
        const currentTaskTimeEl = document.getElementById('current-task-time');
        if (currentTaskTimeEl) {
            // Simple implementation: show time since session start
            // In a more advanced version, this could track individual task time
            currentTaskTimeEl.textContent = timeString;
        }
    }
    
    /**
     * Generate unique session ID
     */
    generateSessionId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        return `session_${timestamp}_${random}`;
    }
    
    /**
     * Generate unique task ID
     */
    generateTaskId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        return `task_${timestamp}_${random}`;
    }
    
    /**
     * Set loading state with custom message
     */
    setLoadingState(loading, message = 'Przetwarzanie...') {
        const submitButton = document.getElementById('submit-analysis-btn');
        const saveResultsButton = document.getElementById('save-session-results');
        const loadingOverlay = document.getElementById('loading-overlay');
        const loadingText = document.getElementById('loading-text');

        // Update analysis modal submit button
        if (submitButton) {
            submitButton.disabled = loading;
            submitButton.innerHTML = loading ? 
                '<span class="btn-icon spinning">⏳</span> Zapisywanie...' : 
                '<span class="btn-icon">💾</span> Zapisz Wszystkie Dane';
        }
        
        // Update results modal save button
        if (saveResultsButton) {
            saveResultsButton.disabled = loading;
            saveResultsButton.innerHTML = loading ? 
                '<span class="btn-icon spinning">🔄</span> Zapisywanie...' : 
                '<span class="btn-icon">💾</span> Zapisz Sesję';
        }

        // Show/hide loading overlay with animation
        if (loadingOverlay) {
            if (loading) {
                loadingOverlay.style.display = 'flex';
                loadingOverlay.classList.add('fade-in');
                // Add pulsing animation to the spinner
                const spinner = loadingOverlay.querySelector('.loading-spinner');
                if (spinner) {
                    spinner.classList.add('pulse-animation');
                }
            } else {
                loadingOverlay.classList.remove('fade-in');
                loadingOverlay.classList.add('fade-out');
                const spinner = loadingOverlay.querySelector('.loading-spinner');
                if (spinner) {
                    spinner.classList.remove('pulse-animation');
                }
                // Hide after animation completes
                setTimeout(() => {
                    loadingOverlay.style.display = 'none';
                    loadingOverlay.classList.remove('fade-out');
                }, 300);
            }
        }
        
        // Update loading text with typing animation
        if (loadingText && loading) {
            this.animateLoadingText(loadingText, message);
        }
        
        console.log(loading ? `🔄 Loading started: ${message}` : '✅ Loading completed');
    }
    
    /**
     * Animate loading text with typing effect
     */
    animateLoadingText(element, text) {
        // Clear any existing intervals
        if (element.typingInterval) {
            clearInterval(element.typingInterval);
        }
        if (element.dotsInterval) {
            clearInterval(element.dotsInterval);
        }
        
        element.textContent = '';
        let i = 0;
        const typingInterval = setInterval(() => {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
            } else {
                clearInterval(typingInterval);
                element.typingInterval = null;
                // Add dots animation after text is complete
                this.animateLoadingDots(element, text);
            }
        }, 50);
        
        // Store interval for cleanup
        element.typingInterval = typingInterval;
    }
    
    /**
     * Animate loading dots after text
     */
    animateLoadingDots(element, baseText) {
        let dotCount = 0;
        const dotsInterval = setInterval(() => {
            const dots = '.'.repeat((dotCount % 3) + 1);
            element.textContent = baseText + dots;
            dotCount++;
            
            // Stop dots animation when loading is complete (element gets hidden)
            if (element.parentElement && element.parentElement.style.display === 'none') {
                clearInterval(dotsInterval);
            }
        }, 500);
        
        // Store interval ID for cleanup
        element.dotsInterval = dotsInterval;
    }
    
    /**
     * Show enhanced loading overlay for specific operations
     */
    showEnhancedLoading(title = 'Przetwarzanie', message = 'Proszę czekać...') {
        // Create enhanced loading overlay if it doesn't exist
        let overlay = document.getElementById('enhanced-loading-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'enhanced-loading-overlay';
            overlay.className = 'enhanced-loading-overlay';
            overlay.innerHTML = `
                <div class="enhanced-loading-content">
                    <div class="enhanced-loading-spinner">
                        <div class="spinner-ring"></div>
                        <div class="spinner-ring"></div>
                        <div class="spinner-ring"></div>
                    </div>
                    <h3 class="enhanced-loading-title">${title}</h3>
                    <p class="enhanced-loading-message">${message}</p>
                    <div class="loading-progress-bar">
                        <div class="loading-progress-fill"></div>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
        } else {
            // Update existing overlay
            overlay.querySelector('.enhanced-loading-title').textContent = title;
            overlay.querySelector('.enhanced-loading-message').textContent = message;
        }
        
        overlay.style.display = 'flex';
        overlay.classList.add('fade-in');
    }
    
    /**
     * Hide enhanced loading overlay
     */
    hideEnhancedLoading() {
        const overlay = document.getElementById('enhanced-loading-overlay');
        if (overlay) {
            overlay.classList.remove('fade-in');
            overlay.classList.add('fade-out');
            setTimeout(() => {
                overlay.style.display = 'none';
                overlay.classList.remove('fade-out');
            }, 300);
        }
    }
    
    /**
     * Update study dashboard with current statistics
     */
    updateStudyDashboard() {
        // Update today's statistics
        this.updateTodayStats();
        
        // Update recent sessions list
        this.updateRecentSessions();
        
        console.log('📊 Study dashboard updated');
    }

    /**
     * Update today's statistics
     */
    async updateTodayStats() {
        try {
            const todaySessionsEl = document.getElementById('today-sessions');
            const todayTasksEl = document.getElementById('today-tasks');
            const todayAccuracyEl = document.getElementById('today-accuracy');

            // For now, show placeholder values
            // In a real implementation, you would fetch data from Google Sheets
            if (todaySessionsEl) todaySessionsEl.textContent = '0';
            if (todayTasksEl) todayTasksEl.textContent = '0';
            if (todayAccuracyEl) todayAccuracyEl.textContent = '0%';

            // TODO: Implement actual data fetching from Google Sheets
            // const todayStats = await this.googleSheetsAPI.getTodayStudyStats();
            
        } catch (error) {
            console.error('Error updating today stats:', error);
        }
    }

    /**
     * Update recent sessions list
     */
    async updateRecentSessions() {
        try {
            const recentSessionsList = document.getElementById('recent-sessions-list');
            if (!recentSessionsList) return;

            // For now, show placeholder
            // TODO: Implement actual recent sessions fetching
            recentSessionsList.innerHTML = `
                <div class="no-sessions-placeholder">
                    <div class="placeholder-icon">📈</div>
                    <p>Brak ostatnich sesji nauki</p>
                    <p class="placeholder-description">Rozpocznij pierwszą sesję, aby zobaczyć historię</p>
                </div>
            `;
            
        } catch (error) {
            console.error('Error updating recent sessions:', error);
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
            
            // Prepare data for Google Apps Script backend using StudyTasks structure
            // Backend expects StudyTasks format: task_id, task_name, description, categories, correctly_completed, start_time, end_time, location, subject, session_id
            const taskData = {
                task_name: formData.task_name,
                description: formData.description,
                categories: formData.categories,
                correctly_completed: formData.correctly_completed,
                location: formData.location || '',
                subject: formData.subject,
                start_time: new Date().toISOString(),
                end_time: new Date().toISOString(),
                session_id: '' // Individual tasks don't belong to sessions
            };
            
            console.log('Submitting StudyTask data:', taskData);
            const result = await this.googleSheetsAPI.addStudyTask(taskData);
            
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

            // Categories are now a text input field (no longer a dropdown)
            // Skip category dropdown population since we changed to text input
            updateLoadingStep(loadingId, 1, 'completed');
            updateLoadingStep(loadingId, 2, 'active');
            updateLoadingText(loadingId, 'Konfigurowanie pól formularza...');
            
            console.log('%c📝 Categories field now uses text input instead of dropdown', 'color: #8b5cf6; font-weight: bold;');
            console.log('%c💡 Users can enter comma-separated categories like "Algebra, Equations"', 'color: #6366f1; font-weight: 600;');
            
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
            
            console.log('%c📊 Subjects loaded: %c' + subjectsCount, 'color: #374151; font-weight: 600;', subjectsCount > 0 ? 'color: #10b981; font-weight: bold;' : 'color: #ef4444; font-weight: bold;');
            console.log('%c📝 Categories field: %cText input (comma-separated)', 'color: #374151; font-weight: 600;', 'color: #8b5cf6; font-weight: bold;');
            
            console.log('%c🎉 Total dropdown options: %c' + subjectsCount, 'color: #374151; font-weight: 600;', 'color: #7c3aed; font-weight: bold;');
            
            if (subjectsCount > 0) {
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
     * Show specific view (form, study, or analytics)
     */
    showView(viewName) {
        console.log(`🔄 Switching to view: ${viewName}`);
        this.currentView = viewName;

        // Get all containers
        const formContainer = document.getElementById('main-form-container');
        const studyContainer = document.getElementById('study-container');
        const analyticsContainer = document.getElementById('analytics-container');

        console.log('📋 Container elements found:', {
            formContainer: !!formContainer,
            studyContainer: !!studyContainer,
            analyticsContainer: !!analyticsContainer
        });

        // Hide all containers first
        if (formContainer) formContainer.style.display = 'none';
        if (studyContainer) studyContainer.style.display = 'none';
        if (analyticsContainer) analyticsContainer.style.display = 'none';

        // Show the selected container
        switch (viewName) {
            case 'form':
                if (formContainer) {
                    formContainer.style.display = 'block';
                    console.log('✅ Form container shown');
                }
                break;
                
            case 'study':
                if (studyContainer) {
                    studyContainer.style.display = 'block';
                    console.log('✅ Study container shown');
                    this.updateStudyDashboard();
                } else {
                    console.error('❌ Study container not found!');
                }
                break;
                
            case 'analytics':
                if (analyticsContainer) {
                    analyticsContainer.style.display = 'block';
                    console.log('✅ Analytics container shown');
                    if (this.analyticsManager) {
                        this.analyticsManager.loadAnalyticsData();
                    }
                }
                break;
                
            default:
                console.warn(`Unknown view: ${viewName}`);
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
