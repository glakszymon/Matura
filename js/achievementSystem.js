/**
 * Achievement System
 * Handles unlocking achievements, badges, and milestone tracking
 */
class AchievementSystem {
    constructor(config) {
        this.config = config;
        this.unlockedAchievements = new Set();
        this.totalTasks = 0;
        this.totalPomodoroSessions = 0;
        this.perfectStreak = 0;
        
        this.init();
    }
    
    /**
     * Initialize achievement system
     */
    init() {
        this.loadUnlockedAchievements();
        this.updateAchievementCounts();
        
        // Achievement System initialized
    }
    
    /**
     * Load unlocked achievements from local storage
     */
    loadUnlockedAchievements() {
        const stored = localStorage.getItem(this.config.STORAGE_KEYS.UNLOCKED_ACHIEVEMENTS);
        if (stored) {
            this.unlockedAchievements = new Set(JSON.parse(stored));
        }
    }
    
    /**
     * Save unlocked achievements to local storage
     */
    saveUnlockedAchievements() {
        localStorage.setItem(
            this.config.STORAGE_KEYS.UNLOCKED_ACHIEVEMENTS,
            JSON.stringify([...this.unlockedAchievements])
        );
    }
    
    /**
     * Unlock an achievement
     */
    unlockAchievement(achievementKey) {
        if (this.unlockedAchievements.has(achievementKey)) {
            return false; // Already unlocked
        }
        
        const achievement = this.config.ACHIEVEMENTS[achievementKey];
        if (!achievement) {
            console.error('Achievement not found:', achievementKey);
            return false;
        }
        
        // Unlock achievement
        this.unlockedAchievements.add(achievementKey);
        this.saveUnlockedAchievements();
        
        // Award points
        if (window.streakManager) {
            window.streakManager.addPoints(achievement.points);
        }
        
        // Show notification
        this.showAchievementNotification(achievement);
        
        // Update display
        this.updateAchievementCounts();
        
        console.log('Achievement unlocked:', achievementKey, achievement);
        return true;
    }
    
    /**
     * Check task-related achievements
     */
    checkTaskAchievements() {
        this.totalTasks++;
        
        // First task achievement
        if (this.totalTasks === 1) {
            this.unlockAchievement('FIRST_TASK');
        }
        
        // 100 tasks achievement
        if (this.totalTasks === 100) {
            this.unlockAchievement('TASKS_100');
        }
        
        // Check perfectionist achievement (this would need more complex tracking)
        // For now, simplified implementation
        this.checkPerfectionistAchievement();
    }
    
    /**
     * Check Pomodoro-related achievements
     */
    checkPomodoroAchievements() {
        this.totalPomodoroSessions++;
        
        // Update local storage for persistence
        const today = new Date().toISOString().split('T')[0];
        const sessionsKey = `pomodoro_sessions_${today}`;
        const sessions = JSON.parse(localStorage.getItem(sessionsKey) || '[]');
        sessions.push({
            timestamp: new Date().toISOString(),
            duration: 25 // Default duration
        });
        localStorage.setItem(sessionsKey, JSON.stringify(sessions));
        
        // Pomodoro master achievement
        if (this.totalPomodoroSessions === 50) {
            this.unlockAchievement('POMODORO_MASTER');
        }
    }
    
    /**
     * Check perfectionist achievement (simplified)
     */
    checkPerfectionistAchievement() {
        // This would need more sophisticated tracking
        // For now, we'll implement a simplified version
        const recentTasks = this.getRecentTasksFromStorage();
        const correctTasks = recentTasks.filter(task => task.correctness === true);
        
        if (correctTasks.length >= 20) {
            this.unlockAchievement('PERFECTIONIST');
        }
    }
    
    /**
     * Get recent tasks from local storage (simplified)
     */
    getRecentTasksFromStorage() {
        // This is a simplified implementation
        // In a real app, you'd track this more systematically
        const today = new Date().toISOString().split('T')[0];
        const tasksKey = `tasks_${today}`;
        return JSON.parse(localStorage.getItem(tasksKey) || '[]');
    }
    
    /**
     * Show achievement notification
     */
    showAchievementNotification(achievement) {
        const notification = document.getElementById('achievement-notification');
        const title = document.getElementById('achievement-title');
        const description = document.getElementById('achievement-description');
        
        if (notification && title && description) {
            title.textContent = achievement.name;
            description.textContent = achievement.description;
            
            notification.style.display = 'block';
            notification.classList.add('show');
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                this.hideAchievementNotification();
            }, 5000);
        }
        
        // Also show in navigation message system
        if (window.navigationManager) {
            window.navigationManager.showMessage(
                `🏆 Nowe osiągnięcie: ${achievement.name}!`,
                'success'
            );
        }
    }
    
    /**
     * Hide achievement notification
     */
    hideAchievementNotification() {
        const notification = document.getElementById('achievement-notification');
        if (notification) {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.style.display = 'none';
            }, 300);
        }
    }
    
    /**
     * Update achievement counts in UI
     */
    updateAchievementCounts() {
        const totalAchievements = Object.keys(this.config.ACHIEVEMENTS).length;
        const unlockedCount = this.unlockedAchievements.size;
        const lockedCount = totalAchievements - unlockedCount;
        
        // Update summary cards
        const unlockedElement = document.getElementById('unlocked-achievements');
        const lockedElement = document.getElementById('locked-achievements');
        const pointsElement = document.getElementById('achievement-points');
        
        if (unlockedElement) {
            unlockedElement.textContent = unlockedCount;
        }
        
        if (lockedElement) {
            lockedElement.textContent = lockedCount;
        }
        
        if (pointsElement) {
            const totalPoints = [...this.unlockedAchievements]
                .reduce((sum, key) => sum + (this.config.ACHIEVEMENTS[key]?.points || 0), 0);
            pointsElement.textContent = totalPoints;
        }
    }
    
    /**
     * Render achievements list
     */
    renderAchievements() {
        const achievementsList = document.getElementById('achievements-list');
        if (!achievementsList) return;
        
        const achievementsHTML = Object.entries(this.config.ACHIEVEMENTS).map(([key, achievement]) => {
            const isUnlocked = this.unlockedAchievements.has(key);
            const category = this.getAchievementCategory(key);
            
            return `
                <div class="achievement-item ${isUnlocked ? 'unlocked' : 'locked'}" data-category="${category}">
                    <div class="achievement-icon">
                        ${isUnlocked ? '🏆' : '🔒'}
                    </div>
                    <div class="achievement-content">
                        <div class="achievement-name">${achievement.name}</div>
                        <div class="achievement-description">${achievement.description}</div>
                        <div class="achievement-points">${achievement.points} punktów</div>
                    </div>
                    <div class="achievement-status">
                        ${isUnlocked ? 
                            '<span class="status-badge unlocked">Odblokowane</span>' : 
                            '<span class="status-badge locked">Zablokowane</span>'
                        }
                    </div>
                </div>
            `;
        }).join('');
        
        achievementsList.innerHTML = achievementsHTML;
        
        // Setup category filtering
        this.setupCategoryFiltering();
    }
    
    /**
     * Get achievement category
     */
    getAchievementCategory(achievementKey) {
        if (achievementKey.includes('TASK') || achievementKey === 'FIRST_TASK' || achievementKey === 'PERFECTIONIST') {
            return 'tasks';
        } else if (achievementKey.includes('STREAK')) {
            return 'streaks';
        } else if (achievementKey.includes('POMODORO')) {
            return 'pomodoro';
        }
        return 'other';
    }
    
    /**
     * Setup category filtering for achievements
     */
    setupCategoryFiltering() {
        const categoryTabs = document.querySelectorAll('.category-tab');
        
        categoryTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Update active tab
                categoryTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Filter achievements
                const category = tab.dataset.category;
                this.filterAchievementsByCategory(category);
            });
        });
    }
    
    /**
     * Filter achievements by category
     */
    filterAchievementsByCategory(category) {
        const achievementItems = document.querySelectorAll('.achievement-item');
        
        achievementItems.forEach(item => {
            if (category === 'all' || item.dataset.category === category) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }
    
    /**
     * Get achievement statistics
     */
    getAchievementStats() {
        const totalAchievements = Object.keys(this.config.ACHIEVEMENTS).length;
        const unlockedCount = this.unlockedAchievements.size;
        const totalPoints = [...this.unlockedAchievements]
            .reduce((sum, key) => sum + (this.config.ACHIEVEMENTS[key]?.points || 0), 0);
        
        return {
            total: totalAchievements,
            unlocked: unlockedCount,
            locked: totalAchievements - unlockedCount,
            totalPoints: totalPoints,
            completionPercentage: Math.round((unlockedCount / totalAchievements) * 100)
        };
    }
    
    /**
     * Check if achievement is unlocked
     */
    isAchievementUnlocked(achievementKey) {
        return this.unlockedAchievements.has(achievementKey);
    }
    
    /**
     * Reset all achievements (for testing or manual reset)
     */
    resetAllAchievements() {
        this.unlockedAchievements.clear();
        this.totalTasks = 0;
        this.totalPomodoroSessions = 0;
        this.perfectStreak = 0;
        
        localStorage.removeItem(this.config.STORAGE_KEYS.UNLOCKED_ACHIEVEMENTS);
        
        this.updateAchievementCounts();
        this.renderAchievements();
    }
}

// Initialize achievement system when DOM is ready
let achievementSystem;
document.addEventListener('DOMContentLoaded', () => {
    achievementSystem = new AchievementSystem(CONFIG);
    
    // Setup close button for achievement notification
    const closeAchievement = document.getElementById('close-achievement');
    if (closeAchievement) {
        closeAchievement.addEventListener('click', () => {
            achievementSystem.hideAchievementNotification();
        });
    }
});
