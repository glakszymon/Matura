/**
 * Left Navigation Manager
 * Handles the left sidebar navigation functionality
 */
class LeftNavigationManager {
    constructor() {
        this.navElement = document.getElementById('left-navigation');
        this.navToggle = document.getElementById('nav-toggle');
        this.navClose = document.getElementById('nav-close');
        this.navOverlay = document.getElementById('nav-overlay');
        this.subjectsNavList = document.getElementById('subjects-nav-list');
        
        this.isOpen = false;
        this.currentActiveItem = null;
        this.subjects = [];
        this.containers = {};
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupContainers();
        // Ensure currently active tab (if any) is visible
        this.normalizeActiveTabVisibility();
        // Subjects are preloaded at startup; subscribe to them
        this.initializeSubjectsFromCache();
        
        console.log('✅ Left Navigation Manager initialized');
    }
    
    setupEventListeners() {
        // Toggle button
        if (this.navToggle) {
            this.navToggle.addEventListener('click', () => this.toggleNav());
        }
        
        // Close button
        if (this.navClose) {
            this.navClose.addEventListener('click', () => this.closeNav());
        }
        
        // Overlay click
        if (this.navOverlay) {
            this.navOverlay.addEventListener('click', () => this.closeNav());
        }
        
        // Navigation items
        document.addEventListener('click', (e) => {
            // Check if clicked element or its parent is a navigation item
            const navItem = e.target.closest('.nav-item, .nav-subitem, .nav-subject-item');
            if (navItem) {
                this.handleNavItemClick(navItem);
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeNav();
            }
        });
    }
    
    setupContainers() {
        this.containers = {
            'main': document.getElementById('main-form-container'),
            'study': document.getElementById('study-container'),
            'analytics': document.getElementById('analytics-container'),
            'enhanced-analytics': document.getElementById('enhanced-analytics-container'),
            'add-tasks': document.getElementById('tasks-tab'),
            'add-subjects': document.getElementById('subjects-tab'),
            'add-categories': document.getElementById('categories-tab')
        };
    }
    
    toggleNav() {
        if (this.isOpen) {
            this.closeNav();
        } else {
            this.openNav();
        }
    }
    
    openNav() {
        this.isOpen = true;
        this.navElement.classList.add('open');
        this.navToggle.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
    
    closeNav() {
        this.isOpen = false;
        this.navElement.classList.remove('open');
        this.navToggle.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
    }
    
    handleNavItemClick(item) {
        const target = item.getAttribute('data-target');
        const subjectName = item.getAttribute('data-subject');
        
        if (target) {
            this.navigateTo(target, item);
        } else if (subjectName) {
            this.navigateToSubjectAnalytics(subjectName, item);
        }
        
        // Close navigation on mobile
        if (window.innerWidth <= 768) {
            this.closeNav();
        }
    }
    
    navigateTo(target, activeItem) {
        console.log(`🔗 Navigating to: ${target}`);
        
        // Handle special cases for form tabs
        if (target === 'add-tasks' || target === 'add-subjects' || target === 'add-categories') {
            this.showFormContainer();
            this.switchFormTab(target);
        } else {
            this.hideAllContainers();
            this.showContainer(target);
        }
        
        this.setActiveNavItem(activeItem);
        
        // Special handling for enhanced analytics
        if (target === 'enhanced-analytics') {
            this.initializeEnhancedAnalytics();
        }
    }
    
    navigateToSubjectAnalytics(subjectName, activeItem) {
        console.log(`📊 Navigating to analytics for subject: ${subjectName}`);
        
        this.hideAllContainers();
        this.showContainer('analytics');
        
        // Trigger subject-specific analytics if the analytics manager is available
        if (window.analyticsManager && window.analyticsManager.showSubjectAnalytics) {
            window.analyticsManager.showSubjectAnalytics(subjectName);
        }
        
        this.setActiveNavItem(activeItem);
    }
    
    showFormContainer() {
        this.hideAllContainers();
        const formContainer = this.containers['main'];
        if (formContainer) {
            formContainer.style.display = 'block';
            formContainer.style.visibility = 'visible';
            formContainer.style.opacity = '1';
        }
    }
    
    switchFormTab(tabName) {
        // Map navigation targets to tab IDs
        const tabMapping = {
            'add-tasks': 'tasks',
            'add-subjects': 'subjects', 
            'add-categories': 'categories'
        };
        
        const tabId = tabMapping[tabName];
        if (!tabId) return;
        
        // Remove active class from all form tabs and tab content and reset inline styles
        document.querySelectorAll('.form-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
            // Reset inline styles that could hide content
            content.style.display = '';
            content.style.visibility = '';
            content.style.opacity = '';
        });
        
        // Activate the selected tab
        const tabButton = document.querySelector(`[data-tab=\"${tabId}\"]`);
        const tabContent = document.getElementById(`${tabId}-tab`);
        
        if (tabButton) tabButton.classList.add('active');
        if (tabContent) {
            tabContent.classList.add('active');
            // Force visible in case inline styles were set elsewhere
            tabContent.style.display = 'block';
            tabContent.style.visibility = 'visible';
            tabContent.style.opacity = '1';
        }
    }
    
    normalizeActiveTabVisibility() {
        const activeTab = document.querySelector('.tab-content.active');
        if (activeTab) {
            activeTab.style.display = 'block';
            activeTab.style.visibility = 'visible';
            activeTab.style.opacity = '1';
        }
    }
    
    hideAllContainers() {
        Object.values(this.containers).forEach(container => {
            if (container) {
                container.style.display = 'none';
                container.style.visibility = 'hidden';
                container.style.opacity = '0';
            }
        });
    }
    
    showContainer(containerKey) {
        const container = this.containers[containerKey];
        if (container) {
            container.style.display = 'block';
            container.style.visibility = 'visible';
            container.style.opacity = '1';
            console.log(`✅ ${containerKey} container shown`);
        }
    }
    
    setActiveNavItem(activeItem) {
        // Remove active class from all nav items
        document.querySelectorAll('.nav-item, .nav-subitem, .nav-subject-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Add active class to clicked item
        if (activeItem) {
            activeItem.classList.add('active');
            this.currentActiveItem = activeItem;
        }
    }
    
    // NO LONGER loads from API; subjects provided by bootstrap
    // Initialize subjects from global cache or wait for event
    initializeSubjectsFromCache() {
        if (!this.subjectsNavList) return;
        
        console.log('🔄 Initializing subjects for navigation from cache...');

        // If already available, render immediately
        if (window.appData && Array.isArray(window.appData.subjects)) {
            this.subjects = window.appData.subjects;
            if (this.subjects.length > 0) {
                this.renderSubjectsNav();
                return;
            }
        }

        // Otherwise wait for the bootstrap event
        const onLoaded = (e) => {
            const subjects = e?.detail?.subjects || [];
            this.subjects = subjects;
            if (this.subjects.length > 0) {
                this.renderSubjectsNav();
            } else {
                this.showNoSubjectsMessage();
            }
            window.removeEventListener('subjectsLoaded', onLoaded);
        };
        window.addEventListener('subjectsLoaded', onLoaded);

        // If nothing arrives after a short grace period, show placeholder
        setTimeout(() => {
            if (!this.subjects || this.subjects.length === 0) {
                this.showNoSubjectsMessage();
            }
        }, 3000);

        return;
        
        // No further action needed; subjects will arrive via event or cache
    }
    
    // Legacy API wait removed (navigation no longer fetches subjects)
    async waitForAPIs(timeout = 5000) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            // We only need the API constructor or instance; CONFIG may be a top-level const (not on window)
            if (window.googleSheetsAPI || window.GoogleSheetsAPIv2) {
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        return false;
    }
    
    renderSubjectsNav() {
        if (!this.subjectsNavList || !this.subjects.length) return;
        
        const subjectsHTML = this.subjects.map(subject => `
            <button type=\"button\" class=\"nav-subject-item\" data-subject=\"${subject.name}\" title=\"View analytics for ${subject.name}\">
                <span class=\"nav-icon\">${subject.icon || '📚'}</span>
                <span class=\"nav-label\">${subject.name}</span>
            </button>
        `).join('');
        
        this.subjectsNavList.innerHTML = subjectsHTML;
        console.log(`✅ Loaded ${this.subjects.length} subjects in navigation`);
    }
    
    showNoSubjectsMessage() {
        if (this.subjectsNavList) {
            this.subjectsNavList.innerHTML = `
                <div class=\"nav-loading\">
                    <span class=\"loading-text\" style=\"color: #6b7280;\">No subjects available</span>
                </div>
            `;
        }
    }
    
    showSubjectsError() {
        if (this.subjectsNavList) {
            this.subjectsNavList.innerHTML = `
                <div class=\"nav-loading\">
                    <span class=\"loading-text\" style=\"color: #ef4444;\">Error loading subjects</span>
                </div>
            `;
        }
    }
    
    // Method to refresh subjects list
    async refreshSubjects() {
        if (this.subjectsNavList) {
            this.subjectsNavList.innerHTML = `
                <div class=\"nav-loading\">
                    <span class=\"loading-text\">Loading subjects...</span>
                </div>
            `;
        }
        const subjects = (window.appData && Array.isArray(window.appData.subjects)) ? window.appData.subjects : [];
        this.subjects = subjects;
        if (this.subjects.length > 0) {
            this.renderSubjectsNav();
        } else {
            this.showNoSubjectsMessage();
        }
    }
    
    initializeEnhancedAnalytics() {
        if (!window.enhancedAnalyticsApp && window.initializeEnhancedAnalytics) {
            window.initializeEnhancedAnalytics();
        }
    }
    
    // Public method to set active navigation item programmatically
    setActiveByTarget(target) {
        const navItem = document.querySelector(`[data-target=\"${target}\"]`);
        if (navItem) {
            this.setActiveNavItem(navItem);
        }
    }
    
    // Public method to set active subject
    setActiveSubject(subjectName) {
        const navItem = document.querySelector(`[data-subject=\"${subjectName}\"]`);
        if (navItem) {
            this.setActiveNavItem(navItem);
        }
    }
}

// Initialize Left Navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure other components are initialized
    setTimeout(() => {
        if (!window.leftNavigationManager) {
            window.leftNavigationManager = new LeftNavigationManager();
            
            // Set default active state to Main
            const mainNavItem = document.querySelector('[data-target=\"main\"]');
            if (mainNavItem) {
                window.leftNavigationManager.setActiveNavItem(mainNavItem);
            }
        }
    }, 100);
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LeftNavigationManager;
}