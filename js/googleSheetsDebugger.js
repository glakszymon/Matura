/**
 * Google Sheets Data Debugger
 * Centralized debugging system for tracking data retrieved from Google Sheets
 * This is the single source of debugging information about Google Sheets operations
 */
class GoogleSheetsDebugger {
    constructor(enabled = false) {
        this.enabled = enabled;
        this.dataLog = [];
        this.sessionStartTime = new Date();
        this.requestCount = 0;
        
        if (this.enabled) {
            this.initializeDebugger();
        }
    }
    
    /**
     * Initialize the debugger
     */
    initializeDebugger() {
        console.log('%c📊 GOOGLE SHEETS DATA DEBUGGER INITIALIZED', 'color: #2563eb; font-weight: bold; font-size: 16px; background: #eff6ff; padding: 8px; border-radius: 4px;');
        console.log(`%c⏰ Session started: ${this.sessionStartTime.toISOString()}`, 'color: #6b7280;');
        console.log('─'.repeat(70));
    }
    
    /**
     * Log data retrieved from Google Sheets
     */
    logDataRetrieved(operation, dataType, data, metadata = {}) {
        if (!this.enabled) return;
        
        this.requestCount++;
        const timestamp = new Date();
        const logEntry = {
            id: this.requestCount,
            timestamp,
            operation,
            dataType,
            dataCount: Array.isArray(data) ? data.length : (data ? 1 : 0),
            data,
            metadata,
            duration: metadata.duration || null
        };
        
        this.dataLog.push(logEntry);
        this.displayDataLog(logEntry);
    }
    
    /**
     * Display a formatted log entry
     */
    displayDataLog(entry) {
        const emoji = this.getEmojiForDataType(entry.dataType);
        const timeStr = entry.timestamp.toLocaleTimeString();
        
        console.group(`%c${emoji} [${entry.id}] ${entry.operation} - ${entry.dataType} (${timeStr})`, 
            'color: #059669; font-weight: bold; font-size: 14px;');
        
        // Data summary
        console.log(`%c📋 Data Count: %c${entry.dataCount}`, 
            'color: #374151; font-weight: 600;', 'color: #2563eb; font-weight: bold;');
        
        if (entry.duration) {
            console.log(`%c⏱️ Duration: %c${entry.duration}ms`, 
                'color: #374151; font-weight: 600;', 'color: #dc2626; font-weight: bold;');
        }
        
        // Display data details based on type
        if (Array.isArray(entry.data) && entry.data.length > 0) {
            this.displayArrayData(entry.dataType, entry.data);
        } else if (entry.data && typeof entry.data === 'object') {
            this.displayObjectData(entry.dataType, entry.data);
        } else {
            console.log(`%c📄 Raw Data:`, 'color: #6b7280;', entry.data);
        }
        
        // Metadata
        if (Object.keys(entry.metadata).length > 0) {
            console.log(`%c🔧 Metadata:`, 'color: #8b5cf6;', entry.metadata);
        }
        
        console.groupEnd();
        console.log('─'.repeat(50));
    }
    
    /**
     * Display array data with formatting
     */
    displayArrayData(dataType, data) {
        switch (dataType.toLowerCase()) {
            case 'subjects':
                console.log('%c📚 SUBJECTS FROM GOOGLE SHEETS:', 'color: #3b82f6; font-weight: bold;');
                data.forEach((subject, index) => {
                    console.log(`%c  ${index + 1}. ${subject.name || subject.subject_name}`, 
                        'color: #059669; font-weight: 600;',
                        `(Active: ${subject.active || 'unknown'})`);
                });
                break;
                
            case 'categories':
                console.log('%c🏷️ CATEGORIES FROM GOOGLE SHEETS:', 'color: #8b5cf6; font-weight: bold;');
                const bySubject = {};
                data.forEach(category => {
                    const subject = category.subject || category.subject_name || 'Unknown';
                    if (!bySubject[subject]) bySubject[subject] = [];
                    bySubject[subject].push(category);
                });
                
                Object.entries(bySubject).forEach(([subject, categories]) => {
                    console.log(`%c  📚 ${subject}:`, 'color: #3b82f6; font-weight: 600;');
                    categories.forEach((category, index) => {
                        console.log(`%c    ${index + 1}. ${category.name || category.category_name}`, 
                            'color: #059669;', 
                            `(Difficulty: ${category.difficulty || 'unknown'})`);
                    });
                });
                break;
                
            case 'tasks':
                console.log('%c📝 TASKS FROM GOOGLE SHEETS:', 'color: #f59e0b; font-weight: bold;');
                const taskStats = this.calculateTaskStats(data);
                console.log(`%c📊 Task Statistics:`, 'color: #374151; font-weight: 600;');
                console.log(`%c  Total: ${taskStats.total}`, 'color: #6b7280;');
                console.log(`%c  Correct: ${taskStats.correct}`, 'color: #10b981;');
                console.log(`%c  Incorrect: ${taskStats.incorrect}`, 'color: #ef4444;');
                console.log(`%c  Success Rate: ${taskStats.successRate}%`, 'color: #3b82f6; font-weight: bold;');
                
                if (data.length <= 5) {
                    console.log('%c📄 Recent Tasks:', 'color: #6b7280;');
                    data.slice(0, 5).forEach((task, index) => {
                        const status = this.isTaskCorrect(task) ? '✅' : '❌';
                        console.log(`%c  ${status} ${task.name || task.task_name}`, 'color: #374151;');
                    });
                }
                break;
                
            case 'achievements':
                console.log('%c🏆 ACHIEVEMENTS FROM GOOGLE SHEETS:', 'color: #f59e0b; font-weight: bold;');
                data.forEach((achievement, index) => {
                    const status = achievement.unlocked ? '🔓' : '🔒';
                    console.log(`%c  ${status} ${achievement.name}`, 'color: #374151;');
                });
                break;
                
            default:
                console.log(`%c📄 ${dataType.toUpperCase()} DATA:`, 'color: #6b7280; font-weight: bold;');
                console.log(data);
        }
    }
    
    /**
     * Display object data with formatting
     */
    displayObjectData(dataType, data) {
        console.log(`%c📄 ${dataType.toUpperCase()} OBJECT:`, 'color: #6b7280; font-weight: bold;');
        console.table(data);
    }
    
    /**
     * Get appropriate emoji for data type
     */
    getEmojiForDataType(dataType) {
        const emojis = {
            subjects: '📚',
            categories: '🏷️',
            tasks: '📝',
            achievements: '🏆',
            analytics: '📊',
            sessions: '⏲️',
            settings: '⚙️'
        };
        return emojis[dataType.toLowerCase()] || '📋';
    }
    
    /**
     * Calculate task statistics
     */
    calculateTaskStats(tasks) {
        const total = tasks.length;
        let correct = 0;
        
        tasks.forEach(task => {
            if (this.isTaskCorrect(task)) correct++;
        });
        
        const incorrect = total - correct;
        const successRate = total > 0 ? Math.round((correct / total) * 100) : 0;
        
        return { total, correct, incorrect, successRate };
    }
    
    /**
     * Check if task is correct
     */
    isTaskCorrect(task) {
        if (typeof task.correctness === 'boolean') {
            return task.correctness === true;
        } else if (typeof task.correctness === 'string') {
            const corrValue = task.correctness.toLowerCase();
            return corrValue === 'poprawnie' || corrValue === 'dobrze' || corrValue === 'correct';
        }
        return false;
    }
    
    /**
     * Log an error in data retrieval
     */
    logError(operation, error, context = {}) {
        if (!this.enabled) return;
        
        console.group('%c❌ GOOGLE SHEETS DATA ERROR', 'color: #dc2626; font-weight: bold; font-size: 14px;');
        console.log(`%c🔧 Operation: %c${operation}`, 'color: #374151; font-weight: 600;', 'color: #dc2626; font-weight: bold;');
        console.log(`%c📝 Error Message: %c${error.message}`, 'color: #374151; font-weight: 600;', 'color: #dc2626;');
        
        if (context.url) {
            console.log(`%c🔗 URL: %c${context.url}`, 'color: #374151; font-weight: 600;', 'color: #6b7280;');
        }
        
        if (context.requestData) {
            console.log(`%c📤 Request Data:`, 'color: #374151; font-weight: 600;', context.requestData);
        }
        
        console.groupEnd();
    }
    
    /**
     * Display session summary
     */
    showSessionSummary() {
        if (!this.enabled) return;
        
        const now = new Date();
        const duration = Math.round((now - this.sessionStartTime) / 1000);
        
        console.group('%c📊 GOOGLE SHEETS DATA SESSION SUMMARY', 'color: #2563eb; font-weight: bold; font-size: 16px;');
        console.log(`%c⏰ Session Duration: %c${duration}s`, 'color: #374151; font-weight: 600;', 'color: #2563eb; font-weight: bold;');
        console.log(`%c📡 Total Requests: %c${this.requestCount}`, 'color: #374151; font-weight: 600;', 'color: #059669; font-weight: bold;');
        
        // Group by data type
        const byType = {};
        this.dataLog.forEach(entry => {
            if (!byType[entry.dataType]) byType[entry.dataType] = [];
            byType[entry.dataType].push(entry);
        });
        
        console.log('%c📋 Data Retrieved by Type:', 'color: #374151; font-weight: 600;');
        Object.entries(byType).forEach(([type, entries]) => {
            const totalItems = entries.reduce((sum, entry) => sum + entry.dataCount, 0);
            console.log(`%c  ${this.getEmojiForDataType(type)} ${type}: ${entries.length} requests, ${totalItems} items`, 'color: #059669;');
        });
        
        console.groupEnd();
    }
    
    /**
     * Enable debugging
     */
    enable() {
        this.enabled = true;
        this.initializeDebugger();
    }
    
    /**
     * Disable debugging
     */
    disable() {
        this.enabled = false;
        console.log('%c🔕 Google Sheets Data Debugger Disabled', 'color: #6b7280; font-style: italic;');
    }
    
    /**
     * Clear all logged data
     */
    clear() {
        this.dataLog = [];
        this.requestCount = 0;
        this.sessionStartTime = new Date();
        if (this.enabled) {
            console.clear();
            this.initializeDebugger();
        }
    }
    
    /**
     * Get all logged data
     */
    getLoggedData() {
        return {
            sessionStartTime: this.sessionStartTime,
            requestCount: this.requestCount,
            dataLog: this.dataLog
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GoogleSheetsDebugger;
}

// Make available globally
window.GoogleSheetsDebugger = GoogleSheetsDebugger;

// Global debugger instance - disabled by default
window.gsDebugger = new GoogleSheetsDebugger(false);

// Utility functions for console access
window.enableGSDebug = () => window.gsDebugger.enable();
window.disableGSDebug = () => window.gsDebugger.disable();
window.showGSSummary = () => window.gsDebugger.showSessionSummary();
window.clearGSDebug = () => window.gsDebugger.clear();
