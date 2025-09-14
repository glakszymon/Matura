/**
 * Loading Screen Manager
 * Comprehensive loading system for Google Sheets form webapp
 * Handles multiple loading states with beautiful animations
 */
class LoadingManager {
    constructor() {
        this.currentLoadingId = null;
        this.loadingStack = [];
        this.init();
    }

    /**
     * Initialize loading manager
     */
    init() {
        this.createLoadingOverlay();
        this.bindEvents();
        console.log('%c🔄 Loading Manager Initialized', 'color: #3b82f6; font-weight: bold;');
    }

    /**
     * Create the global loading overlay
     */
    createLoadingOverlay() {
        // Remove existing overlay if present
        const existingOverlay = document.getElementById('global-loading-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }

        const overlay = document.createElement('div');
        overlay.id = 'global-loading-overlay';
        overlay.className = 'loading-overlay';
        
        overlay.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <div class="loading-text" id="loading-text">Ładowanie...</div>
                <div class="loading-subtext" id="loading-subtext">Proszę czekać</div>
                <div class="loading-progress">
                    <div class="loading-progress-bar" id="loading-progress-bar"></div>
                </div>
                <div class="loading-steps" id="loading-steps"></div>
            </div>
        `;
        
        document.body.appendChild(overlay);
    }

    /**
     * Show loading screen with optional configuration
     */
    show(config = {}) {
        const loadingId = config.id || 'loading-' + Date.now();
        
        // Default configuration
        const defaultConfig = {
            text: 'Ładowanie...',
            subtext: 'Proszę czekać',
            steps: null,
            progress: false,
            spinner: 'default', // 'default', 'dots', 'pulse'
            backdrop: true,
            timeout: null
        };

        const finalConfig = { ...defaultConfig, ...config };
        
        console.log(`%c🔄 [LOADING] Showing: ${finalConfig.text}`, 'color: #3b82f6; font-weight: 600;');

        // Add to loading stack
        this.loadingStack.push({ id: loadingId, config: finalConfig });
        this.currentLoadingId = loadingId;

        // Update UI
        this.updateLoadingContent(finalConfig);
        this.showOverlay();

        // Auto-hide with timeout
        if (finalConfig.timeout) {
            setTimeout(() => {
                this.hide(loadingId);
            }, finalConfig.timeout);
        }

        return loadingId;
    }

    /**
     * Update loading content
     */
    updateLoadingContent(config) {
        const textEl = document.getElementById('loading-text');
        const subtextEl = document.getElementById('loading-subtext');
        const stepsEl = document.getElementById('loading-steps');
        const progressEl = document.getElementById('loading-progress-bar');

        if (textEl) textEl.textContent = config.text;
        if (subtextEl) subtextEl.textContent = config.subtext;

        // Update steps
        if (stepsEl) {
            if (config.steps && config.steps.length > 0) {
                stepsEl.innerHTML = config.steps.map((step, index) => `
                    <div class="loading-step ${step.status || ''}" data-step="${index}">
                        <div class="loading-step-icon">
                            ${step.status === 'completed' ? '✓' : 
                              step.status === 'active' ? '●' : (index + 1)}
                        </div>
                        <span>${step.text}</span>
                    </div>
                `).join('');
                stepsEl.style.display = 'block';
            } else {
                stepsEl.style.display = 'none';
            }
        }

        // Update progress bar
        if (progressEl) {
            progressEl.style.display = config.progress ? 'block' : 'none';
        }
    }

    /**
     * Update loading progress
     */
    updateProgress(loadingId, progress) {
        if (this.currentLoadingId !== loadingId) return;

        const progressEl = document.querySelector('.loading-progress');
        const progressBar = document.getElementById('loading-progress-bar');

        if (progressEl && progressBar) {
            progressEl.style.display = 'block';
            progressBar.style.transform = `translateX(-${100 - progress}%)`;
            progressBar.style.animation = 'none';
        }
    }

    /**
     * Update loading steps
     */
    updateStep(loadingId, stepIndex, status = 'active') {
        if (this.currentLoadingId !== loadingId) return;

        const stepEl = document.querySelector(`[data-step="${stepIndex}"]`);
        if (stepEl) {
            stepEl.className = `loading-step ${status}`;
            const icon = stepEl.querySelector('.loading-step-icon');
            if (icon) {
                if (status === 'completed') {
                    icon.textContent = '✓';
                } else if (status === 'active') {
                    icon.textContent = '●';
                } else {
                    icon.textContent = stepIndex + 1;
                }
            }
        }
    }

    /**
     * Update loading text
     */
    updateText(loadingId, text, subtext = null) {
        if (this.currentLoadingId !== loadingId) return;

        const textEl = document.getElementById('loading-text');
        const subtextEl = document.getElementById('loading-subtext');

        if (textEl) textEl.textContent = text;
        if (subtext && subtextEl) subtextEl.textContent = subtext;

        console.log(`%c🔄 [LOADING] Updated text: ${text}`, 'color: #3b82f6; font-weight: 500;');
    }

    /**
     * Hide loading screen
     */
    hide(loadingId = null) {
        if (loadingId) {
            // Remove specific loading from stack
            this.loadingStack = this.loadingStack.filter(item => item.id !== loadingId);
            
            // If hiding current loading, switch to next in stack
            if (this.currentLoadingId === loadingId) {
                if (this.loadingStack.length > 0) {
                    const nextLoading = this.loadingStack[this.loadingStack.length - 1];
                    this.currentLoadingId = nextLoading.id;
                    this.updateLoadingContent(nextLoading.config);
                } else {
                    this.currentLoadingId = null;
                    this.hideOverlay();
                }
            }
        } else {
            // Hide all loading screens
            this.loadingStack = [];
            this.currentLoadingId = null;
            this.hideOverlay();
        }

        console.log(`%c✅ [LOADING] Hidden: ${loadingId || 'all'}`, 'color: #10b981; font-weight: 600;');
    }

    /**
     * Show the overlay
     */
    showOverlay() {
        const overlay = document.getElementById('global-loading-overlay');
        if (overlay) {
            overlay.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }

    /**
     * Hide the overlay
     */
    hideOverlay() {
        const overlay = document.getElementById('global-loading-overlay');
        if (overlay) {
            overlay.classList.remove('show');
            document.body.style.overflow = '';
        }
    }

    /**
     * Show data loading with steps
     */
    showDataLoading(steps = []) {
        const defaultSteps = [
            { text: 'Łączenie z Google Sheets...', status: 'active' },
            { text: 'Pobieranie danych...', status: '' },
            { text: 'Przetwarzanie wyników...', status: '' },
            { text: 'Finalizowanie...', status: '' }
        ];

        const loadingSteps = steps.length > 0 ? steps : defaultSteps;

        return this.show({
            id: 'data-loading',
            text: 'Pobieranie danych z Google Sheets',
            subtext: 'Synchronizacja z chmurą w toku...',
            steps: loadingSteps,
            progress: true
        });
    }

    /**
     * Show form submission loading
     */
    showFormSubmission() {
        return this.show({
            id: 'form-submit',
            text: 'Wysyłanie danych',
            subtext: 'Zapisywanie do Google Sheets...',
            steps: [
                { text: 'Walidacja danych', status: 'completed' },
                { text: 'Przygotowywanie wysyłki', status: 'completed' },
                { text: 'Wysyłanie do Google Sheets', status: 'active' },
                { text: 'Potwierdzanie zapisu', status: '' }
            ]
        });
    }

    /**
     * Show analytics loading
     */
    showAnalyticsLoading() {
        return this.show({
            id: 'analytics-loading',
            text: 'Generowanie analityki',
            subtext: 'Analizowanie wyników z Google Sheets...',
            steps: [
                { text: 'Pobieranie zadań', status: 'active' },
                { text: 'Grupowanie według przedmiotów', status: '' },
                { text: 'Obliczanie statystyk', status: '' },
                { text: 'Generowanie wykresów', status: '' }
            ]
        });
    }

    /**
     * Show quick loading (no steps)
     */
    showQuickLoading(text = 'Ładowanie...', subtext = 'Proszę czekać') {
        return this.show({
            id: 'quick-loading',
            text: text,
            subtext: subtext,
            timeout: 3000
        });
    }

    /**
     * Bind keyboard events
     */
    bindEvents() {
        // ESC key to hide loading (for development)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.currentLoadingId) {
                console.log('%c⚠️ [LOADING] Force closed with ESC', 'color: #f59e0b; font-weight: 600;');
                this.hide();
            }
        });
    }

    /**
     * Simulate data loading process
     */
    async simulateDataLoading(duration = 3000) {
        const loadingId = this.showDataLoading();
        
        const steps = 4;
        const stepDuration = duration / steps;
        
        for (let i = 0; i < steps; i++) {
            await new Promise(resolve => setTimeout(resolve, stepDuration));
            this.updateStep(loadingId, i, 'completed');
            if (i < steps - 1) {
                this.updateStep(loadingId, i + 1, 'active');
            }
            this.updateProgress(loadingId, ((i + 1) / steps) * 100);
        }
        
        setTimeout(() => {
            this.hide(loadingId);
        }, 500);
    }

    /**
     * Get current loading state
     */
    isLoading() {
        return this.currentLoadingId !== null;
    }

    /**
     * Get loading stack info
     */
    getLoadingInfo() {
        return {
            current: this.currentLoadingId,
            stack: this.loadingStack.map(item => ({ id: item.id, text: item.config.text })),
            isLoading: this.isLoading()
        };
    }
}

// Create global loading manager instance
window.loadingManager = new LoadingManager();

// Utility functions for easy access
window.showLoading = (config) => window.loadingManager.show(config);
window.hideLoading = (id) => window.loadingManager.hide(id);
window.updateLoadingText = (id, text, subtext) => window.loadingManager.updateText(id, text, subtext);
window.updateLoadingProgress = (id, progress) => window.loadingManager.updateProgress(id, progress);
window.updateLoadingStep = (id, step, status) => window.loadingManager.updateStep(id, step, status);

// Specific loading functions
window.showDataLoading = (steps) => window.loadingManager.showDataLoading(steps);
window.showFormSubmission = () => window.loadingManager.showFormSubmission();
window.showAnalyticsLoading = () => window.loadingManager.showAnalyticsLoading();
window.showQuickLoading = (text, subtext) => window.loadingManager.showQuickLoading(text, subtext);

// Make LoadingManager available globally
window.LoadingManager = LoadingManager;

console.log('%c🎉 Loading Manager ready!', 'color: #10b981; font-weight: bold; font-size: 14px;');
