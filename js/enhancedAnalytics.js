/**
 * Enhanced Analytics Module
 * Provides comprehensive analytics including performance over time, consistency tracking,
 * time of day analysis, location impact, and progress tracking
 */
class EnhancedAnalytics {
    constructor(config, googleSheetsAPI) {
        this.config = config;
        this.googleSheetsAPI = googleSheetsAPI;
        this.tasks = [];
        this.sessions = [];
        this.dailyStats = [];
        this.subjects = [];
        this.categories = [];
        
        // Analytics data structures
        this.analyticsData = {
            performanceOverTime: {},
            studyConsistency: {},
            timeOfDayAnalysis: {},
            subjectAnalysis: {},
            locationAnalysis: {},
            progressTracking: {}
        };
        
        this.init();
    }
    
    /**
     * Initialize enhanced analytics
     */
    init() {
        console.log('🚀 Enhanced Analytics initialized');
        
        // Ensure config has all required analytics settings
        this.validateAndSetupConfig();
    }
    
    /**
     * Validate and setup configuration with fallbacks
     */
    validateAndSetupConfig() {
        // Ensure ANALYTICS config exists with fallbacks
        if (!this.config.ANALYTICS) {
            this.config.ANALYTICS = {
                PERFORMANCE_OVER_TIME: {
                    TIME_PERIODS: {
                        WEEK: { days: 7, label: 'Ostatni tydzień' },
                        MONTH: { days: 30, label: 'Ostatni miesiąc' },
                        QUARTER: { days: 90, label: 'Ostatnie 3 miesiące' },
                        ALL: { days: null, label: 'Cały okres' }
                    }
                },
                CONSISTENCY: {
                    STREAK_THRESHOLD: 1,
                    CONSISTENCY_LEVELS: {
                        EXCELLENT: { threshold: 0.9, label: 'Doskonała', emoji: '🔥' },
                        GOOD: { threshold: 0.7, label: 'Dobra', emoji: '👍' },
                        AVERAGE: { threshold: 0.5, label: 'Średnia', emoji: '📊' },
                        POOR: { threshold: 0.3, label: 'Słaba', emoji: '⚠️' },
                        CRITICAL: { threshold: 0, label: 'Wymagająca poprawy', emoji: '🚨' }
                    }
                },
                TIME_OF_DAY: {
                    PERIODS: {
                        MORNING: { start: 6, end: 12, label: 'Rano (6:00-12:00)', emoji: '🌅' },
                        AFTERNOON: { start: 12, end: 18, label: 'Popołudnie (12:00-18:00)', emoji: '☀️' },
                        EVENING: { start: 18, end: 24, label: 'Wieczór (18:00-24:00)', emoji: '🌙' },
                        NIGHT: { start: 0, end: 6, label: 'Noc (0:00-6:00)', emoji: '🌃' }
                    },
                    PERFORMANCE_THRESHOLDS: { HIGH: 80, MEDIUM: 60, LOW: 40 }
                },
                SUBJECT_ANALYSIS: {
                    MIN_TASKS_FOR_ANALYSIS: 5,
                    PERFORMANCE_CATEGORIES: {
                        EXCELLENT: { min: 90, color: '#10b981', label: 'Doskonały' },
                        GOOD: { min: 80, color: '#3b82f6', label: 'Dobry' },
                        SATISFACTORY: { min: 70, color: '#f59e0b', label: 'Zadowalający' },
                        NEEDS_IMPROVEMENT: { min: 60, color: '#ef4444', label: 'Wymaga poprawy' },
                        CRITICAL: { min: 0, color: '#991b1b', label: 'Krytyczny' }
                    }
                },
                LOCATION_ANALYSIS: {
                    DEFAULT_LOCATIONS: ['Dom', 'Biblioteka', 'Szkoła', 'Inne'],
                    PERFORMANCE_COMPARISON: {
                        MIN_TASKS_PER_LOCATION: 3,
                        SIGNIFICANCE_THRESHOLD: 10
                    }
                },
                PROGRESS_TRACKING: {
                    IMPROVEMENT_INDICATORS: {
                        EXCELLENT: { threshold: 15, label: 'Doskonały postęp', emoji: '🚀', color: '#10b981' },
                        GOOD: { threshold: 10, label: 'Dobry postęp', emoji: '📈', color: '#3b82f6' },
                        MODERATE: { threshold: 5, label: 'Umiarkowany postęp', emoji: '📊', color: '#f59e0b' },
                        STABLE: { threshold: 0, label: 'Stabilny poziom', emoji: '➡️', color: '#6b7280' },
                        DECLINING: { threshold: -5, label: 'Spadek', emoji: '📉', color: '#ef4444' }
                    },
                    STREAK_REWARDS: {
                        BRONZE: { days: 3, title: 'Brązowa passa', emoji: '🥉', points: 10 },
                        SILVER: { days: 7, title: 'Srebrna passa', emoji: '🥈', points: 25 },
                        GOLD: { days: 14, title: 'Złota passa', emoji: '🥇', points: 50 },
                        DIAMOND: { days: 30, title: 'Diamentowa passa', emoji: '💎', points: 100 }
                    }
                }
            };
        }
    }
    
    /**
     * Load and process all analytics data
     */
    async loadAnalyticsData() {
        try {
            console.log('📊 Loading enhanced analytics data...');
            
            // Load all required data in parallel
            const [tasksResult, sessionsResult, dailyStatsResult, subjectsResult, categoriesResult] = await Promise.all([
                this.googleSheetsAPI.getStudyTasks(),
                this.googleSheetsAPI.getStudySessions(),
                this.googleSheetsAPI.getDailyStats(),
                this.googleSheetsAPI.fetchSubjects(),
                this.googleSheetsAPI.fetchCategories()
            ]);
            
            // Store data
            this.tasks = tasksResult.success ? (tasksResult.data || tasksResult.tasks || []) : [];
            this.sessions = sessionsResult.success ? (sessionsResult.data || sessionsResult.sessions || []) : [];
            this.dailyStats = dailyStatsResult.success ? (dailyStatsResult.data || dailyStatsResult.stats || []) : [];
            this.subjects = subjectsResult.success ? (subjectsResult.subjects || []) : [];
            this.categories = categoriesResult.success ? (categoriesResult.categories || []) : [];
            
            // Process all analytics
            this.processAllAnalytics();
            
            console.log('✅ Enhanced analytics data loaded and processed');
            return { success: true, data: this.analyticsData };
            
        } catch (error) {
            console.error('❌ Error loading enhanced analytics data:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Process all analytics categories
     */
    processAllAnalytics() {
        console.log('🔄 Processing all analytics categories...');
        
        this.processPerformanceOverTime();
        this.processStudyConsistency();
        this.processTimeOfDayAnalysis();
        this.processSubjectAnalysis();
        this.processLocationAnalysis();
        this.processProgressTracking();
        
        console.log('✅ All analytics processed');
    }
    
    /**
     * 1. Performance Over Time Analysis
     */
    processPerformanceOverTime() {
        const timeConfig = this.config.ANALYTICS.PERFORMANCE_OVER_TIME;
        
        // Group tasks by date
        const dateGroups = {};
        this.tasks.forEach(task => {
            const date = this.extractDate(task.start_time || task.timestamp);
            if (!dateGroups[date]) {
                dateGroups[date] = { 
                    date, 
                    tasks: [], 
                    total: 0, 
                    correct: 0, 
                    accuracy: 0,
                    subjects: new Set()
                };
            }
            dateGroups[date].tasks.push(task);
            dateGroups[date].total++;
            dateGroups[date].subjects.add(task.subject);
            if (this.isTaskCorrect(task)) {
                dateGroups[date].correct++;
            }
        });
        
        // Calculate daily accuracy and trends
        const dailyData = Object.values(dateGroups).map(day => {
            day.accuracy = day.total > 0 ? Math.round((day.correct / day.total) * 100) : 0;
            return day;
        }).sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Calculate trends for different time periods
        const trends = {};
        Object.keys(timeConfig.TIME_PERIODS).forEach(period => {
            const periodConfig = timeConfig.TIME_PERIODS[period];
            const periodData = periodConfig.days ? 
                dailyData.slice(-periodConfig.days) : dailyData;
            
            trends[period] = this.calculateTrend(periodData);
        });
        
        // Calculate rolling averages
        const rollingAverages = this.calculateRollingAverages(dailyData, [7, 14, 30]);
        
        this.analyticsData.performanceOverTime = {
            dailyData,
            trends,
            rollingAverages,
            totalDays: dailyData.length,
            averageAccuracy: this.calculateAverageAccuracy(dailyData),
            bestDay: this.findBestDay(dailyData),
            worstDay: this.findWorstDay(dailyData),
            consistency: this.calculateConsistencyScore(dailyData)
        };
    }
    
    /**
     * 2. Study Consistency Analysis
     */
    processStudyConsistency() {
        const consistencyConfig = this.config.ANALYTICS.CONSISTENCY;
        
        // Calculate daily activity
        const dailyActivity = {};
        const today = new Date();
        
        // Initialize last 90 days
        for (let i = 89; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            dailyActivity[dateStr] = {
                date: dateStr,
                tasks: 0,
                sessions: 0,
                active: false,
                subjects: new Set()
            };
        }
        
        // Fill with actual data
        this.tasks.forEach(task => {
            const date = this.extractDate(task.start_time || task.timestamp);
            if (dailyActivity[date]) {
                dailyActivity[date].tasks++;
                dailyActivity[date].subjects.add(task.subject);
                dailyActivity[date].active = dailyActivity[date].tasks >= consistencyConfig.STREAK_THRESHOLD;
            }
        });
        
        this.sessions.forEach(session => {
            const date = this.extractDate(session.start_time);
            if (dailyActivity[date]) {
                dailyActivity[date].sessions++;
            }
        });
        
        // Calculate streaks
        const streaks = this.calculateStreaks(Object.values(dailyActivity));
        const currentStreak = this.getCurrentStreak(Object.values(dailyActivity));
        
        // Calculate consistency metrics
        const activeDays = Object.values(dailyActivity).filter(day => day.active).length;
        const totalDays = Object.keys(dailyActivity).length;
        const consistencyScore = totalDays > 0 ? activeDays / totalDays : 0;
        
        // Determine consistency level
        const consistencyLevel = this.getConsistencyLevel(consistencyScore, consistencyConfig.CONSISTENCY_LEVELS);
        
        this.analyticsData.studyConsistency = {
            dailyActivity: Object.values(dailyActivity),
            streaks,
            currentStreak,
            activeDays,
            totalDays,
            consistencyScore: Math.round(consistencyScore * 100),
            consistencyLevel,
            averageTasksPerDay: activeDays > 0 ? Math.round(this.tasks.length / activeDays * 10) / 10 : 0,
            longestStreak: Math.max(...streaks.map(s => s.length), 0)
        };
    }
    
    /**
     * 3. Time of Day Analysis
     */
    processTimeOfDayAnalysis() {
        const timeConfig = this.config.ANALYTICS.TIME_OF_DAY;
        
        // Group tasks by time period
        const timePeriods = {};
        Object.keys(timeConfig.PERIODS).forEach(period => {
            timePeriods[period] = {
                ...timeConfig.PERIODS[period],
                tasks: [],
                total: 0,
                correct: 0,
                accuracy: 0,
                averageSessionTime: 0,
                subjects: {}
            };
        });
        
        this.tasks.forEach(task => {
            const hour = this.extractHour(task.start_time || task.timestamp);
            const period = this.getTimePeriod(hour, timeConfig.PERIODS);
            
            if (timePeriods[period]) {
                timePeriods[period].tasks.push(task);
                timePeriods[period].total++;
                if (this.isTaskCorrect(task)) {
                    timePeriods[period].correct++;
                }
                
                // Track subjects
                if (!timePeriods[period].subjects[task.subject]) {
                    timePeriods[period].subjects[task.subject] = { total: 0, correct: 0 };
                }
                timePeriods[period].subjects[task.subject].total++;
                if (this.isTaskCorrect(task)) {
                    timePeriods[period].subjects[task.subject].correct++;
                }
            }
        });
        
        // Calculate accuracy and performance levels
        Object.keys(timePeriods).forEach(period => {
            const periodData = timePeriods[period];
            periodData.accuracy = periodData.total > 0 ? 
                Math.round((periodData.correct / periodData.total) * 100) : 0;
            periodData.performanceLevel = this.getPerformanceLevel(
                periodData.accuracy, 
                timeConfig.PERFORMANCE_THRESHOLDS
            );
        });
        
        // Find best and worst times
        const bestTime = Object.entries(timePeriods)
            .filter(([_, data]) => data.total >= 3) // Minimum tasks for reliable analysis
            .sort(([_, a], [__, b]) => b.accuracy - a.accuracy)[0];
        
        const worstTime = Object.entries(timePeriods)
            .filter(([_, data]) => data.total >= 3)
            .sort(([_, a], [__, b]) => a.accuracy - b.accuracy)[0];
        
        this.analyticsData.timeOfDayAnalysis = {
            timePeriods,
            bestTime: bestTime ? { period: bestTime[0], data: bestTime[1] } : null,
            worstTime: worstTime ? { period: worstTime[0], data: worstTime[1] } : null,
            totalTasks: this.tasks.length,
            recommendations: this.generateTimeRecommendations(timePeriods)
        };
    }
    
    /**
     * 4. Enhanced Subject-Based Analysis
     */
    processSubjectAnalysis() {
        const subjectConfig = this.config.ANALYTICS.SUBJECT_ANALYSIS;
        
        const subjectAnalysis = {};
        
        // Group tasks by subject
        this.tasks.forEach(task => {
            const subject = task.subject || 'Unknown';
            
            if (!subjectAnalysis[subject]) {
                subjectAnalysis[subject] = {
                    name: subject,
                    tasks: [],
                    categories: {},
                    locations: {},
                    timeSpent: 0,
                    sessions: [],
                    performance: {
                        total: 0,
                        correct: 0,
                        accuracy: 0,
                        category: null,
                        trend: null
                    },
                    timeAnalysis: {
                        averageTaskDuration: 0,
                        totalTime: 0,
                        efficiency: 0
                    }
                };
            }
            
            const subjectData = subjectAnalysis[subject];
            subjectData.tasks.push(task);
            subjectData.performance.total++;
            
            if (this.isTaskCorrect(task)) {
                subjectData.performance.correct++;
            }
            
            // Track categories
            const categories = this.parseCategoriesString(task.categories);
            categories.forEach(category => {
                if (!subjectData.categories[category]) {
                    subjectData.categories[category] = { total: 0, correct: 0 };
                }
                subjectData.categories[category].total++;
                if (this.isTaskCorrect(task)) {
                    subjectData.categories[category].correct++;
                }
            });
            
            // Track locations
            const location = task.location || 'Nie określono';
            if (!subjectData.locations[location]) {
                subjectData.locations[location] = { total: 0, correct: 0 };
            }
            subjectData.locations[location].total++;
            if (this.isTaskCorrect(task)) {
                subjectData.locations[location].correct++;
            }
            
            // Calculate time spent (if available)
            if (task.end_time && task.start_time) {
                const duration = new Date(task.end_time) - new Date(task.start_time);
                subjectData.timeAnalysis.totalTime += duration;
            }
        });
        
        // Process each subject's analysis
        Object.keys(subjectAnalysis).forEach(subjectName => {
            const subject = subjectAnalysis[subjectName];
            
            // Calculate accuracy
            subject.performance.accuracy = subject.performance.total > 0 ? 
                Math.round((subject.performance.correct / subject.performance.total) * 100) : 0;
            
            // Determine performance category
            subject.performance.category = this.getSubjectPerformanceCategory(
                subject.performance.accuracy, 
                subjectConfig.PERFORMANCE_CATEGORIES
            );
            
            // Calculate trend
            subject.performance.trend = this.calculateSubjectTrend(subject.tasks);
            
            // Calculate time efficiency
            if (subject.tasks.length > 0 && subject.timeAnalysis.totalTime > 0) {
                subject.timeAnalysis.averageTaskDuration = subject.timeAnalysis.totalTime / subject.tasks.length;
                subject.timeAnalysis.efficiency = this.calculateSubjectEfficiency(subject);
            }
            
            // Find best and worst categories
            const categoryPerformance = Object.entries(subject.categories).map(([name, data]) => ({
                name,
                ...data,
                accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0
            })).sort((a, b) => b.accuracy - a.accuracy);
            
            subject.bestCategories = categoryPerformance.slice(0, 3);
            subject.worstCategories = categoryPerformance.slice(-3).reverse();
        });
        
        this.analyticsData.subjectAnalysis = {
            subjects: subjectAnalysis,
            totalSubjects: Object.keys(subjectAnalysis).length,
            bestSubject: this.findBestSubject(subjectAnalysis),
            worstSubject: this.findWorstSubject(subjectAnalysis),
            subjectRanking: this.createSubjectRanking(subjectAnalysis),
            timeDistribution: this.calculateSubjectTimeDistribution(subjectAnalysis)
        };
    }
    
    /**
     * 5. Location Impact Analysis
     */
    processLocationAnalysis() {
        const locationConfig = this.config.ANALYTICS.LOCATION_ANALYSIS;
        
        const locationAnalysis = {};
        
        // Group tasks by location
        this.tasks.forEach(task => {
            const location = task.location || 'Nie określono';
            
            if (!locationAnalysis[location]) {
                locationAnalysis[location] = {
                    name: location,
                    tasks: [],
                    total: 0,
                    correct: 0,
                    accuracy: 0,
                    subjects: {},
                    timeOfDay: {},
                    averagePerformance: 0
                };
            }
            
            const locationData = locationAnalysis[location];
            locationData.tasks.push(task);
            locationData.total++;
            
            if (this.isTaskCorrect(task)) {
                locationData.correct++;
            }
            
            // Track subjects at this location
            const subject = task.subject || 'Unknown';
            if (!locationData.subjects[subject]) {
                locationData.subjects[subject] = { total: 0, correct: 0 };
            }
            locationData.subjects[subject].total++;
            if (this.isTaskCorrect(task)) {
                locationData.subjects[subject].correct++;
            }
            
            // Track time of day
            const hour = this.extractHour(task.start_time || task.timestamp);
            const timePeriod = this.getTimePeriod(hour, this.config.ANALYTICS.TIME_OF_DAY.PERIODS);
            if (!locationData.timeOfDay[timePeriod]) {
                locationData.timeOfDay[timePeriod] = { total: 0, correct: 0 };
            }
            locationData.timeOfDay[timePeriod].total++;
            if (this.isTaskCorrect(task)) {
                locationData.timeOfDay[timePeriod].correct++;
            }
        });
        
        // Calculate accuracy for each location
        Object.keys(locationAnalysis).forEach(locationName => {
            const location = locationAnalysis[locationName];
            location.accuracy = location.total > 0 ? 
                Math.round((location.correct / location.total) * 100) : 0;
        });
        
        // Find significant differences
        const significantComparisons = this.findSignificantLocationDifferences(
            locationAnalysis, 
            locationConfig.PERFORMANCE_COMPARISON
        );
        
        this.analyticsData.locationAnalysis = {
            locations: locationAnalysis,
            totalLocations: Object.keys(locationAnalysis).length,
            bestLocation: this.findBestLocation(locationAnalysis),
            worstLocation: this.findWorstLocation(locationAnalysis),
            significantDifferences: significantComparisons,
            recommendations: this.generateLocationRecommendations(locationAnalysis)
        };
    }
    
    /**
     * 6. Progress Over Sessions Analysis
     */
    processProgressTracking() {
        const progressConfig = this.config.ANALYTICS?.PROGRESS_TRACKING || {
            IMPROVEMENT_INDICATORS: {
                EXCELLENT: { threshold: 15, label: 'Doskonały postęp', emoji: '🚀', color: '#10b981' },
                GOOD: { threshold: 10, label: 'Dobry postęp', emoji: '📈', color: '#3b82f6' },
                MODERATE: { threshold: 5, label: 'Umiarkowany postęp', emoji: '📊', color: '#f59e0b' },
                STABLE: { threshold: 0, label: 'Stabilny poziom', emoji: '➡️', color: '#6b7280' },
                DECLINING: { threshold: -5, label: 'Spadek', emoji: '📉', color: '#ef4444' }
            },
            STREAK_REWARDS: {
                BRONZE: { days: 3, title: 'Brązowa passa', emoji: '🥉', points: 10 },
                SILVER: { days: 7, title: 'Srebrna passa', emoji: '🥈', points: 25 },
                GOLD: { days: 14, title: 'Złota passa', emoji: '🥇', points: 50 },
                DIAMOND: { days: 30, title: 'Diamentowa passa', emoji: '💎', points: 100 }
            }
        };
        
        // Group tasks by session or time periods
        const sessionGroups = this.groupTasksBySessions();
        const weeklyProgress = this.calculateWeeklyProgress();
        const monthlyProgress = this.calculateMonthlyProgress();
        
        // Calculate improvement indicators
        const improvementTrend = this.calculateOverallImprovementTrend();
        const improvementLevel = this.getImprovementLevel(
            improvementTrend.percentageChange,
            progressConfig.IMPROVEMENT_INDICATORS
        );
        
        // Calculate streaks and achievements
        const streakData = this.calculateDetailedStreaks();
        const achievements = this.calculateAchievements(streakData, progressConfig.STREAK_REWARDS);
        
        this.analyticsData.progressTracking = {
            sessionGroups,
            weeklyProgress,
            monthlyProgress,
            improvementTrend,
            improvementLevel,
            streakData,
            achievements,
            overallProgress: this.calculateOverallProgress(),
            milestones: this.identifyMilestones()
        };
    }
    
    // Helper Methods
    
    extractDate(timestamp) {
        if (!timestamp) return new Date().toISOString().split('T')[0];
        return new Date(timestamp).toISOString().split('T')[0];
    }
    
    extractHour(timestamp) {
        if (!timestamp) return new Date().getHours();
        return new Date(timestamp).getHours();
    }
    
    isTaskCorrect(task) {
        if (typeof task.correctly_completed === 'string') {
            return task.correctly_completed.toLowerCase() === 'yes';
        }
        return task.correctly_completed === true || task.correctness === true;
    }
    
    parseCategoriesString(categoriesString) {
        // Handle null, undefined, or empty values
        if (!categoriesString || categoriesString === 'Unknown') {
            return ['Unknown'];
        }
        
        // Convert to string if it's not already a string
        let categoriesStr;
        if (typeof categoriesString === 'string') {
            categoriesStr = categoriesString;
        } else if (typeof categoriesString === 'number') {
            categoriesStr = categoriesString.toString();
        } else if (categoriesString && typeof categoriesString === 'object') {
            // If it's an object, try to stringify it or extract meaningful data
            categoriesStr = categoriesString.toString();
        } else {
            // Fallback for any other data type
            categoriesStr = String(categoriesString);
        }
        
        // Handle edge cases where conversion might result in problematic strings
        if (!categoriesStr || categoriesStr === 'null' || categoriesStr === 'undefined' || categoriesStr === '[object Object]') {
            return ['Unknown'];
        }
        
        return categoriesStr
            .split(',')
            .map(cat => cat.trim())
            .filter(cat => cat && cat.length > 0);
    }
    
    calculateTrend(data) {
        if (data.length < 2) return { direction: 'neutral', percentage: 0 };
        
        const recent = data.slice(-7); // Last 7 data points
        const earlier = data.slice(0, Math.min(7, data.length - 7));
        
        if (earlier.length === 0) return { direction: 'neutral', percentage: 0 };
        
        const recentAvg = recent.reduce((sum, item) => sum + item.accuracy, 0) / recent.length;
        const earlierAvg = earlier.reduce((sum, item) => sum + item.accuracy, 0) / earlier.length;
        
        const change = recentAvg - earlierAvg;
        const direction = change > 5 ? 'improving' : change < -5 ? 'declining' : 'stable';
        
        return { direction, percentage: Math.round(change) };
    }
    
    calculateRollingAverages(dailyData, windows) {
        const averages = {};
        
        windows.forEach(window => {
            averages[`${window}day`] = dailyData.map((_, index) => {
                const start = Math.max(0, index - window + 1);
                const windowData = dailyData.slice(start, index + 1);
                const avg = windowData.reduce((sum, day) => sum + day.accuracy, 0) / windowData.length;
                return Math.round(avg);
            });
        });
        
        return averages;
    }
    
    calculateAverageAccuracy(dailyData) {
        if (dailyData.length === 0) return 0;
        const sum = dailyData.reduce((total, day) => total + day.accuracy, 0);
        return Math.round(sum / dailyData.length);
    }
    
    findBestDay(dailyData) {
        return dailyData.reduce((best, current) => 
            current.accuracy > best.accuracy ? current : best
        , { accuracy: -1 });
    }
    
    findWorstDay(dailyData) {
        return dailyData.reduce((worst, current) => 
            current.accuracy < worst.accuracy ? current : worst
        , { accuracy: 101 });
    }
    
    calculateConsistencyScore(dailyData) {
        if (dailyData.length < 2) return 0;
        
        const accuracies = dailyData.map(day => day.accuracy);
        const mean = accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length;
        const variance = accuracies.reduce((sum, acc) => sum + Math.pow(acc - mean, 2), 0) / accuracies.length;
        const standardDeviation = Math.sqrt(variance);
        
        // Lower standard deviation = higher consistency
        // Convert to 0-100 scale (100 = perfect consistency)
        return Math.max(0, Math.round(100 - standardDeviation));
    }
    
    calculateStreaks(dailyActivity) {
        const streaks = [];
        let currentStreak = null;
        
        dailyActivity.forEach(day => {
            if (day.active) {
                if (!currentStreak) {
                    currentStreak = { start: day.date, end: day.date, length: 1 };
                } else {
                    currentStreak.end = day.date;
                    currentStreak.length++;
                }
            } else {
                if (currentStreak) {
                    streaks.push(currentStreak);
                    currentStreak = null;
                }
            }
        });
        
        if (currentStreak) {
            streaks.push(currentStreak);
        }
        
        return streaks.sort((a, b) => b.length - a.length);
    }
    
    getCurrentStreak(dailyActivity) {
        let streak = 0;
        for (let i = dailyActivity.length - 1; i >= 0; i--) {
            if (dailyActivity[i].active) {
                streak++;
            } else {
                break;
            }
        }
        return streak;
    }
    
    getConsistencyLevel(score, levels) {
        const levelEntries = Object.entries(levels).sort((a, b) => b[1].threshold - a[1].threshold);
        
        for (const [key, level] of levelEntries) {
            if (score >= level.threshold) {
                return { key, ...level };
            }
        }
        
        return levelEntries[levelEntries.length - 1][1]; // Return lowest level
    }
    
    getTimePeriod(hour, periods) {
        for (const [periodName, periodData] of Object.entries(periods)) {
            if (periodData.start <= periodData.end) {
                if (hour >= periodData.start && hour < periodData.end) {
                    return periodName;
                }
            } else {
                // Handle periods that cross midnight (like NIGHT: 0-6)
                if (hour >= periodData.start || hour < periodData.end) {
                    return periodName;
                }
            }
        }
        return 'UNKNOWN';
    }
    
    getPerformanceLevel(accuracy, thresholds) {
        if (accuracy >= thresholds.HIGH) return 'HIGH';
        if (accuracy >= thresholds.MEDIUM) return 'MEDIUM';
        return 'LOW';
    }
    
    generateTimeRecommendations(timePeriods) {
        const recommendations = [];
        
        const bestPeriod = Object.entries(timePeriods)
            .filter(([_, data]) => data.total >= 3)
            .sort(([_, a], [__, b]) => b.accuracy - a.accuracy)[0];
        
        if (bestPeriod) {
            recommendations.push({
                type: 'best_time',
                message: `Najlepiej pracujesz ${bestPeriod[1].label.toLowerCase()} z dokładnością ${bestPeriod[1].accuracy}%`,
                emoji: bestPeriod[1].emoji
            });
        }
        
        const inconsistentPeriods = Object.entries(timePeriods)
            .filter(([_, data]) => data.total >= 5 && data.accuracy < 60);
        
        if (inconsistentPeriods.length > 0) {
            recommendations.push({
                type: 'avoid_time',
                message: `Rozważ unikanie nauki w godzinach ${inconsistentPeriods[0][1].label.toLowerCase()} - niska skuteczność`,
                emoji: '⚠️'
            });
        }
        
        return recommendations;
    }
    
    // Additional helper methods for missing functionality
    
    getSubjectPerformanceCategory(accuracy, categories) {
        const categoryEntries = Object.entries(categories).sort((a, b) => b[1].min - a[1].min);
        
        for (const [key, category] of categoryEntries) {
            if (accuracy >= category.min) {
                return { key, ...category };
            }
        }
        
        return categoryEntries[categoryEntries.length - 1][1]; // Return lowest category
    }
    
    calculateSubjectTrend(tasks) {
        if (tasks.length < 4) return { direction: 'neutral', percentage: 0 };
        
        const sortedTasks = tasks.sort((a, b) => new Date(a.start_time || a.timestamp) - new Date(b.start_time || b.timestamp));
        const recent = sortedTasks.slice(-5); // Last 5 tasks
        const earlier = sortedTasks.slice(0, Math.min(5, sortedTasks.length - 5));
        
        if (earlier.length === 0) return { direction: 'neutral', percentage: 0 };
        
        const recentCorrect = recent.filter(task => this.isTaskCorrect(task)).length;
        const earlierCorrect = earlier.filter(task => this.isTaskCorrect(task)).length;
        
        const recentPercentage = (recentCorrect / recent.length) * 100;
        const earlierPercentage = (earlierCorrect / earlier.length) * 100;
        
        const change = recentPercentage - earlierPercentage;
        const direction = change > 10 ? 'improving' : change < -10 ? 'declining' : 'stable';
        
        return { direction, percentage: Math.round(change) };
    }
    
    calculateSubjectEfficiency(subject) {
        const avgDuration = subject.timeAnalysis.averageTaskDuration;
        const accuracy = subject.performance.accuracy;
        
        if (avgDuration <= 0) return 0;
        
        // Efficiency = accuracy per minute * 100
        return Math.round((accuracy / (avgDuration / (1000 * 60))) * 100) / 100;
    }
    
    findBestSubject(subjectAnalysis) {
        const subjects = Object.values(subjectAnalysis);
        if (subjects.length === 0) return null;
        
        return subjects.reduce((best, current) => 
            current.performance.accuracy > best.performance.accuracy ? current : best
        );
    }
    
    findWorstSubject(subjectAnalysis) {
        const subjects = Object.values(subjectAnalysis);
        if (subjects.length === 0) return null;
        
        return subjects.reduce((worst, current) => 
            current.performance.accuracy < worst.performance.accuracy ? current : worst
        );
    }
    
    createSubjectRanking(subjectAnalysis) {
        return Object.values(subjectAnalysis)
            .sort((a, b) => b.performance.accuracy - a.performance.accuracy)
            .map((subject, index) => ({ ...subject, rank: index + 1 }));
    }
    
    calculateSubjectTimeDistribution(subjectAnalysis) {
        const totalTime = Object.values(subjectAnalysis)
            .reduce((sum, subject) => sum + subject.timeAnalysis.totalTime, 0);
        
        if (totalTime === 0) return {};
        
        const distribution = {};
        Object.keys(subjectAnalysis).forEach(subjectName => {
            const subject = subjectAnalysis[subjectName];
            distribution[subjectName] = {
                time: subject.timeAnalysis.totalTime,
                percentage: Math.round((subject.timeAnalysis.totalTime / totalTime) * 100)
            };
        });
        
        return distribution;
    }
    
    findBestLocation(locationAnalysis) {
        const locations = Object.values(locationAnalysis).filter(loc => loc.total >= 3);
        if (locations.length === 0) return null;
        
        return locations.reduce((best, current) => 
            current.accuracy > best.accuracy ? current : best
        );
    }
    
    findWorstLocation(locationAnalysis) {
        const locations = Object.values(locationAnalysis).filter(loc => loc.total >= 3);
        if (locations.length === 0) return null;
        
        return locations.reduce((worst, current) => 
            current.accuracy < worst.accuracy ? current : worst
        );
    }
    
    findSignificantLocationDifferences(locationAnalysis, comparisonConfig) {
        const locations = Object.values(locationAnalysis)
            .filter(loc => loc.total >= comparisonConfig.MIN_TASKS_PER_LOCATION);
        
        const differences = [];
        
        for (let i = 0; i < locations.length; i++) {
            for (let j = i + 1; j < locations.length; j++) {
                const diff = Math.abs(locations[i].accuracy - locations[j].accuracy);
                if (diff >= comparisonConfig.SIGNIFICANCE_THRESHOLD) {
                    differences.push({
                        location1: locations[i],
                        location2: locations[j],
                        difference: diff,
                        significant: true
                    });
                }
            }
        }
        
        return differences.sort((a, b) => b.difference - a.difference);
    }
    
    generateLocationRecommendations(locationAnalysis) {
        const recommendations = [];
        const best = this.findBestLocation(locationAnalysis);
        const worst = this.findWorstLocation(locationAnalysis);
        
        if (best) {
            recommendations.push({
                type: 'best_location',
                message: `Najlepiej uczysz się w lokalizacji: ${best.name} (${best.accuracy}% skuteczności)`,
                emoji: '🏠'
            });
        }
        
        if (worst && best && worst.name !== best.name) {
            recommendations.push({
                type: 'avoid_location',
                message: `Rozważ unikanie nauki w: ${worst.name} - niższa skuteczność (${worst.accuracy}%)`,
                emoji: '⚠️'
            });
        }
        
        return recommendations;
    }
    
    groupTasksBySessions() {
        // Group tasks by session_id or by time proximity
        const sessionGroups = {};
        
        this.tasks.forEach(task => {
            const sessionId = task.session_id || 'no_session';
            if (!sessionGroups[sessionId]) {
                sessionGroups[sessionId] = [];
            }
            sessionGroups[sessionId].push(task);
        });
        
        return sessionGroups;
    }
    
    calculateWeeklyProgress() {
        const weeklyData = {};
        const now = new Date();
        
        for (let i = 0; i < 12; i++) { // Last 12 weeks
            const weekStart = new Date(now);
            weekStart.setDate(weekStart.getDate() - (i * 7));
            weekStart.setHours(0, 0, 0, 0);
            
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            weekEnd.setHours(23, 59, 59, 999);
            
            const weekKey = `week_${i}`;
            const weekTasks = this.tasks.filter(task => {
                const taskDate = new Date(task.start_time || task.timestamp);
                return taskDate >= weekStart && taskDate <= weekEnd;
            });
            
            weeklyData[weekKey] = {
                week: i,
                startDate: weekStart,
                endDate: weekEnd,
                tasks: weekTasks,
                totalTasks: weekTasks.length,
                correctTasks: weekTasks.filter(task => this.isTaskCorrect(task)).length,
                accuracy: weekTasks.length > 0 ? Math.round((weekTasks.filter(task => this.isTaskCorrect(task)).length / weekTasks.length) * 100) : 0
            };
        }
        
        return weeklyData;
    }
    
    calculateMonthlyProgress() {
        const monthlyData = {};
        const now = new Date();
        
        for (let i = 0; i < 6; i++) { // Last 6 months
            const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
            
            const monthKey = `month_${i}`;
            const monthTasks = this.tasks.filter(task => {
                const taskDate = new Date(task.start_time || task.timestamp);
                return taskDate >= monthStart && taskDate <= monthEnd;
            });
            
            monthlyData[monthKey] = {
                month: i,
                startDate: monthStart,
                endDate: monthEnd,
                tasks: monthTasks,
                totalTasks: monthTasks.length,
                correctTasks: monthTasks.filter(task => this.isTaskCorrect(task)).length,
                accuracy: monthTasks.length > 0 ? Math.round((monthTasks.filter(task => this.isTaskCorrect(task)).length / monthTasks.length) * 100) : 0
            };
        }
        
        return monthlyData;
    }
    
    calculateOverallImprovementTrend() {
        if (this.tasks.length < 10) return { direction: 'neutral', percentageChange: 0 };
        
        const sortedTasks = this.tasks.sort((a, b) => new Date(a.start_time || a.timestamp) - new Date(b.start_time || b.timestamp));
        const firstHalf = sortedTasks.slice(0, Math.floor(sortedTasks.length / 2));
        const secondHalf = sortedTasks.slice(Math.floor(sortedTasks.length / 2));
        
        const firstAccuracy = (firstHalf.filter(task => this.isTaskCorrect(task)).length / firstHalf.length) * 100;
        const secondAccuracy = (secondHalf.filter(task => this.isTaskCorrect(task)).length / secondHalf.length) * 100;
        
        const change = secondAccuracy - firstAccuracy;
        const direction = change > 5 ? 'improving' : change < -5 ? 'declining' : 'stable';
        
        return { direction, percentageChange: Math.round(change) };
    }
    
    getImprovementLevel(percentageChange, indicators) {
        const indicatorEntries = Object.entries(indicators).sort((a, b) => b[1].threshold - a[1].threshold);
        
        for (const [key, indicator] of indicatorEntries) {
            if (percentageChange >= indicator.threshold) {
                return { key, ...indicator };
            }
        }
        
        return indicatorEntries[indicatorEntries.length - 1][1];
    }
    
    calculateDetailedStreaks() {
        const streaks = this.analyticsData.studyConsistency.streaks || [];
        const currentStreak = this.analyticsData.studyConsistency.currentStreak || 0;
        const longestStreak = this.analyticsData.studyConsistency.longestStreak || 0;
        
        return {
            all: streaks,
            current: currentStreak,
            longest: longestStreak,
            total: streaks.length
        };
    }
    
    calculateAchievements(streakData, rewardConfig) {
        const achievements = [];
        
        Object.entries(rewardConfig).forEach(([key, reward]) => {
            if (streakData.current >= reward.days) {
                achievements.push({
                    id: key,
                    ...reward,
                    achieved: true,
                    achievedDate: new Date().toISOString()
                });
            } else {
                achievements.push({
                    id: key,
                    ...reward,
                    achieved: false,
                    progress: Math.min((streakData.current / reward.days) * 100, 100)
                });
            }
        });
        
        return achievements;
    }
    
    calculateOverallProgress() {
        const totalTasks = this.tasks.length;
        const totalCorrect = this.tasks.filter(task => this.isTaskCorrect(task)).length;
        const overallAccuracy = totalTasks > 0 ? (totalCorrect / totalTasks) * 100 : 0;
        
        return {
            totalTasks,
            totalCorrect,
            overallAccuracy: Math.round(overallAccuracy),
            improvementTrend: this.calculateOverallImprovementTrend()
        };
    }
    
    identifyMilestones() {
        const milestones = [];
        const totalTasks = this.tasks.length;
        const totalCorrect = this.tasks.filter(task => this.isTaskCorrect(task)).length;
        const overallAccuracy = totalTasks > 0 ? (totalCorrect / totalTasks) * 100 : 0;
        
        // Task count milestones
        const taskMilestones = [10, 25, 50, 100, 200, 500];
        taskMilestones.forEach(milestone => {
            milestones.push({
                type: 'tasks',
                target: milestone,
                achieved: totalTasks >= milestone,
                progress: Math.min((totalTasks / milestone) * 100, 100),
                title: `${milestone} zadań`,
                emoji: '🎯'
            });
        });
        
        // Accuracy milestones
        const accuracyMilestones = [50, 60, 70, 80, 90, 95];
        accuracyMilestones.forEach(milestone => {
            milestones.push({
                type: 'accuracy',
                target: milestone,
                achieved: overallAccuracy >= milestone,
                progress: Math.min((overallAccuracy / milestone) * 100, 100),
                title: `${milestone}% skuteczności`,
                emoji: '🏆'
            });
        });
        
        return milestones.sort((a, b) => b.progress - a.progress);
    }
    
    /**
     * Get processed analytics data
     */
    getAnalyticsData() {
        return this.analyticsData;
    }
    
    /**
     * Generate comprehensive analytics report
     */
    generateReport() {
        return {
            summary: {
                totalTasks: this.tasks.length,
                totalSessions: this.sessions.length,
                overallAccuracy: this.calculateOverallAccuracy(),
                studyDays: this.getUniqueDaysCount(),
                currentStreak: this.analyticsData.studyConsistency.currentStreak || 0
            },
            insights: this.generateKeyInsights(),
            recommendations: this.generateRecommendations(),
            data: this.analyticsData
        };
    }
    
    calculateOverallAccuracy() {
        if (this.tasks.length === 0) return 0;
        const correctTasks = this.tasks.filter(task => this.isTaskCorrect(task)).length;
        return Math.round((correctTasks / this.tasks.length) * 100);
    }
    
    getUniqueDaysCount() {
        const uniqueDates = new Set();
        this.tasks.forEach(task => {
            uniqueDates.add(this.extractDate(task.start_time || task.timestamp));
        });
        return uniqueDates.size;
    }
    
    generateKeyInsights() {
        const insights = [];
        
        // Performance trend insight
        const performanceData = this.analyticsData.performanceOverTime;
        if (performanceData && performanceData.trends) {
            const monthlyTrend = performanceData.trends.MONTH;
            if (monthlyTrend && monthlyTrend.direction === 'improving') {
                insights.push({
                    type: 'positive',
                    title: 'Postęp w nauce!',
                    message: `Twoja skuteczność poprawiła się o ${monthlyTrend.percentage}% w ostatnim miesiącu`,
                    emoji: '📈'
                });
            }
        }
        
        // Best subject insight
        const subjectData = this.analyticsData.subjectAnalysis;
        if (subjectData && subjectData.bestSubject) {
            insights.push({
                type: 'info',
                title: 'Najlepszy przedmiot',
                message: `Świetnie radzisz sobie z przedmiotem ${subjectData.bestSubject.name} (${subjectData.bestSubject.accuracy}% skuteczności)`,
                emoji: '🏆'
            });
        }
        
        // Consistency insight
        const consistencyData = this.analyticsData.studyConsistency;
        if (consistencyData && consistencyData.currentStreak > 7) {
            insights.push({
                type: 'achievement',
                title: 'Fantastyczna passa!',
                message: `Masz aktualnie passę ${consistencyData.currentStreak} dni!`,
                emoji: '🔥'
            });
        }
        
        return insights;
    }
    
    generateRecommendations() {
        const recommendations = [];
        
        // Time of day recommendations
        const timeData = this.analyticsData.timeOfDayAnalysis;
        if (timeData && timeData.recommendations) {
            recommendations.push(...timeData.recommendations);
        }
        
        // Location recommendations
        const locationData = this.analyticsData.locationAnalysis;
        if (locationData && locationData.recommendations) {
            recommendations.push(...locationData.recommendations);
        }
        
        return recommendations;
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.EnhancedAnalytics = EnhancedAnalytics;
}
