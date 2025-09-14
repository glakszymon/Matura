/**
 * Streak Manager
 * Handles daily streak tracking and motivation system
 */
class StreakManager {
    constructor(config) {
        this.config = config;
        this.currentStreak = 0;
        this.lastActivityDate = null;
        this.totalPoints = 0;
        
        this.init();
    }
    
    /**
     * Initialize streak manager
     */
    init() {
        this.loadFromLocalStorage();
        this.updateStreakDisplay();
        
        // Streak Manager initialized
    }
    
    /**
     * Load streak data from local storage
     */
    loadFromLocalStorage() {
        this.currentStreak = parseInt(localStorage.getItem(this.config.STORAGE_KEYS.CURRENT_STREAK)) || 0;
        this.lastActivityDate = localStorage.getItem(this.config.STORAGE_KEYS.LAST_ACTIVITY_DATE);
        this.totalPoints = parseInt(localStorage.getItem(this.config.STORAGE_KEYS.TOTAL_POINTS)) || 0;
    }
    
    /**
     * Save streak data to local storage
     */
    saveToLocalStorage() {
        localStorage.setItem(this.config.STORAGE_KEYS.CURRENT_STREAK, this.currentStreak.toString());
        localStorage.setItem(this.config.STORAGE_KEYS.LAST_ACTIVITY_DATE, this.lastActivityDate);
        localStorage.setItem(this.config.STORAGE_KEYS.TOTAL_POINTS, this.totalPoints.toString());
    }
    
    /**
     * Record activity and update streak
     */
    recordActivity(points = 0) {
        const today = this.getTodayString();
        const yesterday = this.getYesterdayString();
        
        // Add points
        this.totalPoints += points;
        
        if (!this.lastActivityDate) {
            // First ever activity
            this.currentStreak = 1;
            this.lastActivityDate = today;
            this.addStreakPoints();
            this.showStreakMessage('Zaczynasz swoją pierwszą passę! 🔥');
            
        } else if (this.lastActivityDate === today) {
            // Activity already recorded today
            // Just add points, don't change streak
            
        } else if (this.lastActivityDate === yesterday) {
            // Continuing streak from yesterday
            this.currentStreak += 1;
            this.lastActivityDate = today;
            this.addStreakPoints();
            this.checkStreakMilestones();
            
        } else {
            // Streak broken - starting new streak
            const oldStreak = this.currentStreak;
            this.currentStreak = 1;
            this.lastActivityDate = today;
            this.addStreakPoints();
            
            if (oldStreak > 1) {
                this.showStreakMessage(`Passa przerwana po ${oldStreak} dniach. Zaczynasz od nowa! 💪`);
            } else {
                this.showStreakMessage('Nowa passa rozpoczęta! 🔥');
            }
        }
        
        this.saveToLocalStorage();
        this.updateStreakDisplay();
        this.updatePointsDisplay();
        
        return {
            streak: this.currentStreak,
            points: points,
            totalPoints: this.totalPoints
        };
    }
    
    /**
     * Add points for maintaining streak
     */
    addStreakPoints() {
        this.totalPoints += this.config.POINTS.DAILY_STREAK;
        
        // Bonus points for longer streaks
        if (this.currentStreak >= 7) {
            this.totalPoints += this.config.POINTS.WEEKLY_STREAK;
        }
        if (this.currentStreak >= 30) {
            this.totalPoints += this.config.POINTS.MONTHLY_STREAK;
        }
    }
    
    /**
     * Check for streak milestones and show achievements
     */
    checkStreakMilestones() {
        const milestones = [3, 7, 14, 30, 60, 100];
        
        if (milestones.includes(this.currentStreak)) {
            this.showStreakMilestone(this.currentStreak);
            
            // Trigger achievement if system is available
            if (window.achievementSystem) {
                if (this.currentStreak === 3) {
                    window.achievementSystem.unlockAchievement('DAILY_STREAK_3');
                } else if (this.currentStreak === 7) {
                    window.achievementSystem.unlockAchievement('DAILY_STREAK_7');
                } else if (this.currentStreak === 30) {
                    window.achievementSystem.unlockAchievement('DAILY_STREAK_30');
                }
            }
        }
    }
    
    /**
     * Show streak milestone message
     */
    showStreakMilestone(streak) {
        const messages = {
            3: 'Świetnie! 3 dni z rzędu! 🔥',
            7: 'Niesamowite! Cały tydzień! 🚀',
            14: 'Fantastyczne! 2 tygodnie! ⭐',
            30: 'Mistrzostwo! Cały miesiąc! 👑',
            60: 'Legenda! 2 miesiące! 🏆',
            100: 'Nie do uwierzenia! 100 dni! 🎯'
        };
        
        const message = messages[streak] || `Niesamowita passa ${streak} dni! 🌟`;
        this.showStreakMessage(message);
    }
    
    /**
     * Show streak message to user
     */
    showStreakMessage(message) {
        // Try to use the navigation manager's message system
        if (window.navigationManager) {
            window.navigationManager.showMessage(message, 'success');
        } else {
            console.log('Streak message:', message);
        }
    }
    
    /**
     * Update streak display in UI
     */
    updateStreakDisplay() {
        const streakElement = document.getElementById('streak-count');
        const currentStreakElement = document.getElementById('current-streak');
        const streakMessageElement = document.getElementById('streak-message');
        
        if (streakElement) {
            streakElement.textContent = this.currentStreak;
        }
        
        if (currentStreakElement) {
            currentStreakElement.textContent = this.currentStreak;
        }
        
        if (streakMessageElement) {
            if (this.currentStreak === 0) {
                streakMessageElement.textContent = 'Zacznij naukę, aby rozpocząć passę!';
            } else if (this.currentStreak === 1) {
                streakMessageElement.textContent = 'Nowa passa rozpoczęta! 🔥';
            } else {
                streakMessageElement.textContent = `${this.currentStreak} dni z rzędu! Tak trzymaj! 💪`;
            }
        }
    }
    
    /**
     * Update points display in UI
     */
    updatePointsDisplay() {
        const pointsElement = document.getElementById('total-points');
        
        if (pointsElement) {
            pointsElement.textContent = this.totalPoints.toLocaleString();
        }
    }
    
    /**
     * Get today's date as string
     */
    getTodayString() {
        const today = new Date();
        return today.toISOString().split('T')[0]; // YYYY-MM-DD format
    }
    
    /**
     * Get yesterday's date as string
     */
    getYesterdayString() {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday.toISOString().split('T')[0];
    }
    
    /**
     * Check if user has activity today
     */
    hasActivityToday() {
        return this.lastActivityDate === this.getTodayString();
    }
    
    /**
     * Get current streak
     */
    getCurrentStreak() {
        return this.currentStreak;
    }
    
    /**
     * Get total points
     */
    getTotalPoints() {
        return this.totalPoints;
    }
    
    /**
     * Add points without affecting streak
     */
    addPoints(points) {
        this.totalPoints += points;
        this.saveToLocalStorage();
        this.updatePointsDisplay();
    }
    
    /**
     * Reset streak (for testing or manual reset)
     */
    resetStreak() {
        this.currentStreak = 0;
        this.lastActivityDate = null;
        this.saveToLocalStorage();
        this.updateStreakDisplay();
    }
    
    /**
     * Reset all progress
     */
    resetAllProgress() {
        this.currentStreak = 0;
        this.lastActivityDate = null;
        this.totalPoints = 0;
        
        // Clear local storage
        localStorage.removeItem(this.config.STORAGE_KEYS.CURRENT_STREAK);
        localStorage.removeItem(this.config.STORAGE_KEYS.LAST_ACTIVITY_DATE);
        localStorage.removeItem(this.config.STORAGE_KEYS.TOTAL_POINTS);
        
        this.updateStreakDisplay();
        this.updatePointsDisplay();
    }
    
    /**
     * Get streak statistics for analytics
     */
    getStreakStats() {
        const today = this.getTodayString();
        const hasActivityToday = this.lastActivityDate === today;
        
        return {
            currentStreak: this.currentStreak,
            hasActivityToday: hasActivityToday,
            lastActivityDate: this.lastActivityDate,
            totalPoints: this.totalPoints,
            daysActive: this.lastActivityDate ? 1 : 0 // Simplified for now
        };
    }
}

// Initialize streak manager when DOM is ready
let streakManager;
document.addEventListener('DOMContentLoaded', () => {
    streakManager = new StreakManager(CONFIG);
});
