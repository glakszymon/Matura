/**
 * Button Debugger Module
 * Comprehensive debugging for all interactive elements on the website
 */

class ButtonDebugger {
    constructor() {
        this.clickCount = 0;
        this.buttonRegistry = new Map();
        this.colors = [
            '#ff6b6b', '#4ecdc4', '#45b7d1', '#f7b731', '#5f27cd', '#00d2d3',
            '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff6348', '#2ed573',
            '#ffa502', '#ff4757', '#3742fa', '#2f3542', '#a4b0be', '#57606f'
        ];
        this.debugEnabled = false; // Button debugging completely disabled
        
        this.init();
    }
    
    init() {
        // Button debugging completely disabled
        // Still need to scan buttons for modal functionality to work
        this.scanAllButtons();
        
        // Only setup minimal click listener for modal debugging
        this.setupMinimalClickListener();
    }
    
    scanAllButtons() {
        // Silent scan - no console output, just register buttons for functionality
        this.buttonRegistry.clear();
        
        // Scan different types of interactive elements
        this.scanFAB();
        this.scanNavigationButtons();
        this.scanModalElements();
        this.scanQuickActionButtons();
        this.scanFormButtons();
        this.scanLinks();
        this.scanHamburgerMenu();
        this.scanCorretnessButtons();
        this.scanTabButtons();
        this.scanManagementButtons();
        this.scanTimerButtons();
        this.scanSortButtons();
        this.scanFilterButtons();
        this.scanAchievementButtons();
        this.scanSettingsButtons();
        
        // Never add visual debugging (completely disabled)
        // if (this.debugEnabled) {
        //     this.addVisualDebugging();
        // }
    }
    
    scanFAB() {
        const fab = document.getElementById('quick-task-fab');
        this.registerButton('FAB', fab, '🚀', '#4ecdc4');
        
        const fabIcon = fab?.querySelector('.fab-icon');
        if (fabIcon) {
            this.registerButton('FAB Icon', fabIcon, '➕', '#4ecdc4');
        }
    }
    
    scanNavigationButtons() {
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach((btn, index) => {
            this.registerButton(`Nav-${index}`, btn, '🧭', '#45b7d1');
        });
        
        // Sidebar specific buttons
        const hamburgerBtn = document.getElementById('hamburger-btn');
        const sidebarClose = document.getElementById('sidebar-close');
        const sidebarOverlay = document.getElementById('sidebar-overlay');
        
        this.registerButton('Hamburger', hamburgerBtn, '🍔', '#f39c12');
        this.registerButton('Sidebar Close', sidebarClose, '❌', '#e74c3c');
        this.registerButton('Sidebar Overlay', sidebarOverlay, '🌫️', '#95a5a6');
    }
    
    scanModalElements() {
        const modal = document.getElementById('quick-task-modal');
        const closeModal = document.getElementById('close-quick-task');
        const submitModal = document.getElementById('submit-quick-task');
        
        this.registerButton('Modal', modal, '🪟', '#f7b731');
        this.registerButton('Modal Close', closeModal, '✕', '#e74c3c');
        this.registerButton('Modal Submit', submitModal, '📤', '#2ecc71');
    }
    
    scanQuickActionButtons() {
        const quickActions = document.querySelectorAll('.quick-action-btn');
        quickActions.forEach((btn, index) => {
            this.registerButton(`QuickAction-${index}`, btn, '⚡', '#5f27cd');
        });
    }
    
    scanFormButtons() {
        const formButtons = document.querySelectorAll('button[type="submit"], .btn');
        formButtons.forEach((btn, index) => {
            if (!this.buttonRegistry.has(btn)) {
                this.registerButton(`Form-${index}`, btn, '📝', '#00d2d3');
            }
        });
    }
    
    scanLinks() {
        const links = document.querySelectorAll('a[href], .btn-text');
        links.forEach((link, index) => {
            this.registerButton(`Link-${index}`, link, '🔗', '#9b59b6');
        });
    }
    
    scanHamburgerMenu() {
        const hamburgerLines = document.querySelectorAll('.hamburger-line');
        hamburgerLines.forEach((line, index) => {
            this.registerButton(`HamburgerLine-${index}`, line, '➖', '#f39c12');
        });
    }
    
    scanCorretnessButtons() {
        const correctnessButtons = document.querySelectorAll('.correctness-btn');
        correctnessButtons.forEach((btn, index) => {
            const isCorrect = btn.classList.contains('correct');
            this.registerButton(`Correctness-${index}`, btn, isCorrect ? '✅' : '❌', isCorrect ? '#2ecc71' : '#e74c3c');
        });
    }
    
    scanTabButtons() {
        const tabs = document.querySelectorAll('.filter-tab, .category-tab, .subject-tab');
        tabs.forEach((tab, index) => {
            this.registerButton(`Tab-${index}`, tab, '📑', '#3498db');
        });
    }
    
    scanManagementButtons() {
        const managementBtns = document.querySelectorAll('.management-btn');
        managementBtns.forEach((btn, index) => {
            this.registerButton(`Management-${index}`, btn, '⚙️', '#95a5a6');
        });
    }
    
    scanTimerButtons() {
        const timerBtns = document.querySelectorAll('.timer-btn');
        timerBtns.forEach((btn, index) => {
            let emoji = '⏱️';
            if (btn.classList.contains('start')) emoji = '▶️';
            else if (btn.classList.contains('pause')) emoji = '⏸️';
            else if (btn.classList.contains('reset')) emoji = '🔄';
            
            this.registerButton(`Timer-${index}`, btn, emoji, '#e67e22');
        });
    }
    
    scanSortButtons() {
        const sortBtns = document.querySelectorAll('.sort-btn');
        sortBtns.forEach((btn, index) => {
            this.registerButton(`Sort-${index}`, btn, '📊', '#9b59b6');
        });
    }
    
    scanFilterButtons() {
        const filterBtns = document.querySelectorAll('.filter-tab');
        filterBtns.forEach((btn, index) => {
            this.registerButton(`Filter-${index}`, btn, '🔍', '#1abc9c');
        });
    }
    
    scanAchievementButtons() {
        const achievementBtns = document.querySelectorAll('.achievement-btn, .category-tab');
        achievementBtns.forEach((btn, index) => {
            this.registerButton(`Achievement-${index}`, btn, '🏆', '#f1c40f');
        });
    }
    
    scanSettingsButtons() {
        const settingsBtns = document.querySelectorAll('.toggle-switch, .danger-btn');
        settingsBtns.forEach((btn, index) => {
            const isDanger = btn.classList.contains('danger-btn');
            this.registerButton(`Settings-${index}`, btn, isDanger ? '⚠️' : '⚙️', isDanger ? '#e74c3c' : '#7f8c8d');
        });
    }
    
    registerButton(name, element, emoji, color) {
        if (!element) {
            return;
        }
        
        const info = {
            name,
            element,
            emoji,
            color,
            id: element.id,
            classes: element.className,
            text: element.textContent?.trim().substring(0, 50),
            visible: this.isVisible(element),
            clickable: this.isClickable(element),
            coordinates: this.getCoordinates(element)
        };
        
        this.buttonRegistry.set(element, info);
        // No console logging - silent registration
    }
    
    setupMinimalClickListener() {
        // Only listen for FAB clicks for modal debugging
        document.addEventListener('click', (e) => {
            if (e.target && (e.target.id === 'quick-task-fab' || e.target.closest('#quick-task-fab'))) {
                console.log('%c🚀 FAB clicked - debugging modal state...', 'color: #4ecdc4; font-weight: bold;');
                setTimeout(() => this.debugModalState(), 50);
            }
        }, true);
    }
    
    findParentButton(element) {
        let current = element.parentElement;
        while (current && current !== document.body) {
            if (this.buttonRegistry.has(current)) {
                return this.buttonRegistry.get(current);
            }
            current = current.parentElement;
        }
        return null;
    }
    
    isVisible(element) {
        if (!element) return false;
        const style = window.getComputedStyle(element);
        return style.display !== 'none' && 
               style.visibility !== 'hidden' && 
               element.offsetParent !== null;
    }
    
    isClickable(element) {
        if (!element) return false;
        const style = window.getComputedStyle(element);
        return style.pointerEvents !== 'none' && 
               !element.disabled;
    }
    
    getCoordinates(element) {
        if (!element) return { x: 0, y: 0, width: 0, height: 0 };
        const rect = element.getBoundingClientRect();
        return {
            x: Math.round(rect.left),
            y: Math.round(rect.top),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
        };
    }
    
    addVisualDebugging() {
        this.buttonRegistry.forEach((info, element) => {
            if (info.visible && info.clickable) {
                // Add visual indicator
                element.style.boxShadow = `0 0 3px ${info.color}, inset 0 0 3px rgba(255,255,255,0.3)`;
                element.style.position = 'relative';
                
                // Add emoji indicator
                const indicator = document.createElement('div');
                indicator.innerHTML = info.emoji;
                indicator.style.cssText = `
                    position: absolute;
                    top: -5px;
                    right: -5px;
                    background: ${info.color};
                    color: white;
                    border-radius: 50%;
                    width: 20px;
                    height: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 10px;
                    z-index: 10000;
                    pointer-events: none;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                `;
                indicator.className = 'debug-indicator';
                element.appendChild(indicator);
            }
        });
    }
    
    flashElement(element, color) {
        const originalTransition = element.style.transition;
        const originalBackground = element.style.backgroundColor;
        
        element.style.transition = 'background-color 0.2s ease';
        element.style.backgroundColor = color + '33'; // Add transparency
        
        setTimeout(() => {
            element.style.backgroundColor = originalBackground;
            setTimeout(() => {
                element.style.transition = originalTransition;
            }, 200);
        }, 200);
    }
    
    rescanButtons() {
        this.scanAllButtons();
    }
    
    toggleDebugging() {
        this.debugEnabled = !this.debugEnabled;
        
        // Remove existing indicators
        document.querySelectorAll('.debug-indicator').forEach(indicator => {
            indicator.remove();
        });
        
        // Remove visual debugging
        this.buttonRegistry.forEach((info, element) => {
            element.style.boxShadow = '';
        });
        
        // Debugging toggled silently
        
        if (this.debugEnabled) {
            this.addVisualDebugging();
        }
    }
    
    getDebugStats() {
        const stats = {
            totalButtons: this.buttonRegistry.size,
            visibleButtons: 0,
            clickableButtons: 0,
            totalClicks: this.clickCount,
            buttonTypes: {}
        };
        
        this.buttonRegistry.forEach((info) => {
            if (info.visible) stats.visibleButtons++;
            if (info.clickable) stats.clickableButtons++;
            
            const type = info.name.split('-')[0];
            stats.buttonTypes[type] = (stats.buttonTypes[type] || 0) + 1;
        });
        
        return stats;
    }
    
    showStats() {
        const stats = this.getDebugStats();
        console.group('%c📊 BUTTON DEBUGGING STATISTICS', 'color: #3498db; font-weight: bold; font-size: 14px;');
        console.log('Total registered buttons:', stats.totalButtons);
        console.log('Visible buttons:', stats.visibleButtons);
        console.log('Clickable buttons:', stats.clickableButtons);
        console.log('Total clicks recorded:', stats.totalClicks);
        console.log('Button types:', stats.buttonTypes);
        console.groupEnd();
    }
    
    debugModalState() {
        const modal = document.getElementById('quick-task-modal');
        if (modal) {
            const computedStyle = window.getComputedStyle(modal);
            console.group('%c🪟 MODAL DEBUG INFO', 'color: #e74c3c; font-weight: bold;');
            console.log('Modal element found:', !!modal);
            console.log('Display:', computedStyle.display);
            console.log('Visibility:', computedStyle.visibility);
            console.log('Opacity:', computedStyle.opacity);
            console.log('Z-index:', computedStyle.zIndex);
            console.log('Position:', computedStyle.position);
            console.log('Classes:', modal.className);
            console.log('Inline style:', modal.style.cssText);
            console.log('Computed dimensions:', {
                width: computedStyle.width,
                height: computedStyle.height,
                top: computedStyle.top,
                left: computedStyle.left
            });
            
            // Check if modal content exists
            const modalContent = modal.querySelector('.modal-content');
            if (modalContent) {
                const contentStyle = window.getComputedStyle(modalContent);
                console.log('Modal content transform:', contentStyle.transform);
            }
            
            console.groupEnd();
            
            // Try to force show modal for testing
            setTimeout(() => {
                console.log('%c🔧 Attempting to force show modal...', 'color: #f39c12; font-weight: bold;');
                modal.style.display = 'flex';
                modal.style.opacity = '1';
                modal.style.visibility = 'visible';
                modal.classList.add('active');
                console.log('%c✅ Modal forced visible', 'color: #2ecc71; font-weight: bold;');
            }, 100);
        } else {
            console.error('%c❌ Modal element not found!', 'color: #e74c3c; font-weight: bold;');
        }
    }
}

// Button debugging completely disabled

// Only modal debugging helper (if needed)
window.debugModal = () => {
    const modal = document.getElementById('quick-task-modal');
    if (modal) {
        const style = window.getComputedStyle(modal);
        console.log('%c🪟 Modal State:', 'color: #e74c3c; font-weight: bold;', {
            display: style.display,
            visibility: style.visibility,
            opacity: style.opacity,
            zIndex: style.zIndex,
            classes: modal.className
        });
        
        // Force modal to be visible
        console.log('%c🔧 Forcing modal visibility...', 'color: #f39c12; font-weight: bold;');
        modal.style.display = 'flex';
        modal.style.visibility = 'visible';
        modal.style.opacity = '1';
        modal.style.zIndex = '2000';
        modal.classList.add('active');
        
        console.log('%c✅ Modal forced visible', 'color: #2ecc71; font-weight: bold;');
    } else {
        console.error('%c❌ Modal element not found!', 'color: #e74c3c; font-weight: bold;');
    }
};
