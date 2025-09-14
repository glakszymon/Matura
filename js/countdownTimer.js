/**
 * Countdown Timer Manager
 * Handles the exam countdown display in the header
 */
class CountdownTimer {
    constructor(config) {
        this.config = config;
        this.examDate = null;
        this.intervalId = null;
        this.elements = {
            days: document.getElementById('days'),
            hours: document.getElementById('hours'),
            minutes: document.getElementById('minutes'),
            seconds: document.getElementById('seconds')
        };
        
        this.init();
    }
    
    /**
     * Initialize countdown timer
     */
    init() {
        // Get exam date from local storage or use default
        const storedDate = localStorage.getItem(this.config.STORAGE_KEYS.EXAM_DATE);
        this.examDate = storedDate ? new Date(storedDate) : new Date(this.config.EXAM.DATE);
        
        // Start countdown if all elements are available
        if (this.elements.days && this.elements.hours && this.elements.minutes && this.elements.seconds) {
            this.startCountdown();
        }
        
        // Countdown Timer initialized
    }
    
    /**
     * Start the countdown timer
     */
    startCountdown() {
        // Clear any existing interval
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
        
        // Update immediately
        this.updateCountdown();
        
        // Update every second
        this.intervalId = setInterval(() => {
            this.updateCountdown();
        }, this.config.EXAM.COUNTDOWN_UPDATE_INTERVAL);
    }
    
    /**
     * Update countdown display
     */
    updateCountdown() {
        const now = new Date().getTime();
        const examTime = this.examDate.getTime();
        const timeLeft = examTime - now;
        
        if (timeLeft > 0) {
            const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
            
            this.elements.days.textContent = days;
            this.elements.hours.textContent = hours.toString().padStart(2, '0');
            this.elements.minutes.textContent = minutes.toString().padStart(2, '0');
            this.elements.seconds.textContent = seconds.toString().padStart(2, '0');
            
            // Change styling based on time left
            this.updateCountdownStyling(days);
            
        } else {
            // Exam has passed
            this.showExamPassed();
        }
    }
    
    /**
     * Update countdown styling based on urgency
     */
    updateCountdownStyling(daysLeft) {
        const countdownDisplay = document.getElementById('countdown-display');
        if (!countdownDisplay) return;
        
        // Remove existing urgency classes
        countdownDisplay.classList.remove('urgent', 'critical', 'warning');
        
        if (daysLeft <= 1) {
            countdownDisplay.classList.add('critical');
        } else if (daysLeft <= 7) {
            countdownDisplay.classList.add('urgent');
        } else if (daysLeft <= 30) {
            countdownDisplay.classList.add('warning');
        }
    }
    
    /**
     * Show exam passed message
     */
    showExamPassed() {
        const countdownDisplay = document.getElementById('countdown-display');
        if (countdownDisplay) {
            countdownDisplay.innerHTML = `
                <div class="exam-passed">
                    <div class="exam-passed-icon">🎉</div>
                    <div class="exam-passed-text">
                        <div>Egzamin się odbył!</div>
                        <div class="exam-passed-small">Mam nadzieję, że poszło świetnie!</div>
                    </div>
                </div>
            `;
        }
        
        // Stop the countdown
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
    
    /**
     * Set new exam date
     */
    setExamDate(date) {
        this.examDate = new Date(date);
        localStorage.setItem(this.config.STORAGE_KEYS.EXAM_DATE, date);
        
        // Restart countdown with new date
        this.startCountdown();
        
        console.log('Exam date updated to:', this.examDate);
    }
    
    /**
     * Get current exam date
     */
    getExamDate() {
        return this.examDate;
    }
    
    /**
     * Get time left in days
     */
    getDaysLeft() {
        const now = new Date().getTime();
        const examTime = this.examDate.getTime();
        const timeLeft = examTime - now;
        
        if (timeLeft > 0) {
            return Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        }
        return 0;
    }
    
    /**
     * Check if exam is today
     */
    isExamToday() {
        const today = new Date();
        const examDay = new Date(this.examDate);
        
        return today.getDate() === examDay.getDate() &&
               today.getMonth() === examDay.getMonth() &&
               today.getFullYear() === examDay.getFullYear();
    }
    
    /**
     * Check if exam has passed
     */
    hasExamPassed() {
        return new Date() > this.examDate;
    }
    
    /**
     * Destroy countdown timer
     */
    destroy() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
}

// Initialize countdown timer when DOM is ready
let countdownTimer;
document.addEventListener('DOMContentLoaded', () => {
    countdownTimer = new CountdownTimer(CONFIG);
});
