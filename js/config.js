// Configuration settings for the Exam Preparation Application
const CONFIG = {
    // Feature flags
    DARK_MODE_EXTRAS_ENABLED: false,

    // Google Sheets Configuration
    SPREADSHEET_ID: '1a51kwcG8aT4rfTSdhJ6HKSggneURQkQsywZClCcIcJ8',
    
    // Sheet configurations for different data types
    SHEETS: {
        CATEGORIES: {
            SHEET_NAME: 'Categories',
            RANGE: 'A:D' // category_name, subject_name, difficulty, active
        },
        SUBJECTS: {
            SHEET_NAME: 'Subjects',
            RANGE: 'A:D' // subject_name, color, icon, active
        },
        DAILY_STATS: {
            SHEET_NAME: 'DailyStats',
            RANGE: 'A:E' // date, tasks_count, correct_tasks, streak_day, notes
        },
        ACHIEVEMENTS: {
            SHEET_NAME: 'Achievements',
            RANGE: 'A:D' // id, name, description, unlocked_date
        },
        STUDY_TASKS: {
            SHEET_NAME: 'StudyTasks',
            RANGE: 'A:J' // task_id, task_name, description, categories, correctly_completed, start_time, end_time, location, subject, session_id
        },
        STUDY_SESSIONS: {
            SHEET_NAME: 'StudySessions',
            RANGE: 'A:H' // session_id, start_time, end_time, duration_minutes, total_tasks, correct_tasks, accuracy_percentage, notes
        }
    },
    
    // Exam Configuration
    EXAM: {
        DATE: '2026-06-15', // Default exam date (can be configured by user)
        NAME: 'Egzamin Główny',
        COUNTDOWN_UPDATE_INTERVAL: 1000 // Update every second
    },
    // Optional: multiple exams (up to 5) for multi-countdown
    EXAMS: [
        { name: 'Język polski – pp',     date: '2026-05-04T09:00:00' },
        { name: 'Matematyka – pp',       date: '2026-05-05T09:00:00' },
        { name: 'Język angielski – pp',  date: '2026-05-06T09:00:00' },
        { name: 'Język angielski – pr',  date: '2026-05-07T09:00:00' },
        { name: 'Matematyka – pr',       date: '2026-05-11T09:00:00' },
        { name: 'Informatyka – pr',      date: '2026-05-14T09:00:00' }
    ],
    
    // Google Apps Script Web App URL
    GAS_WEB_APP_URL: 'https://script.google.com/macros/s/AKfycbzoBNAoL9hsXgGkChm5JTUCnQPLrstVRFlqqYNTXs1Sj6aWpT9x-5aFG2EjGAP6ieQ/exec',
    
    // Demo mode for testing analytics without real Google Sheets data
    DEMO_MODE: false, // Set to false when using real Google Sheets data
    DEBUG_MODE: true, // Set to false in production
    
    
    
    // Achievement System - REMOVED - Only use imported data
    ACHIEVEMENTS: {},
    
    // Task field configuration
    TASK_FIELDS: {
        name: {
            label: 'Nazwa zadania',
            type: 'text',
            required: true,
            maxLength: 100
        },
        category: {
            label: 'Kategoria',
            type: 'select',
            required: true
        },
        subject: {
            label: 'Przedmiot',
            type: 'select',
            required: true
        },
        correctness: {
            label: 'Poprawność',
            type: 'boolean',
            required: true
        }
    },
    
    // Form field configuration - matches StudyTasks structure in Google Apps Script backend
    FORM_FIELDS: {
        task_name: {
            name: 'task_name',
            label: 'Nazwa zadania',
            type: 'text',
            required: true,
            maxLength: 100
        },
        description: {
            name: 'description',
            label: 'Opis',
            type: 'textarea',
            required: true,
            maxLength: 1000
        },
        categories: {
            name: 'categories',
            label: 'Kategorie',
            type: 'text',
            required: true,
            maxLength: 200,
            placeholder: 'np. Części mowy, Składnia lub Essays, World War'
        },
        correctly_completed: {
            name: 'correctly_completed',
            label: 'Wykonano poprawnie',
            type: 'select',
            required: true,
            options: ['Yes', 'No']
        },
        location: {
            name: 'location',
            label: 'Miejsce',
            type: 'text',
            required: false,
            maxLength: 100,
            placeholder: 'np. Dom, Biblioteka'
        },
        subject: {
            name: 'subject',
            label: 'Przedmiot',
            type: 'select',
            required: true,
            maxLength: 50
        }
    },
    
    // Category form fields configuration - Updated for new structure
    CATEGORY_FORM_FIELDS: {
        category_name: {
            name: 'category_name',
            label: 'Nazwa kategorii',
            type: 'text',
            required: true,
            maxLength: 100
        },
        subject_name: {
            name: 'subject_name',
            label: 'Przedmiot',
            type: 'select',
            required: true,
            options: [] // Will be populated dynamically from subjects
        },
        difficulty: {
            name: 'difficulty',
            label: 'Poziom trudności',
            type: 'select',
            required: true,
            options: ['Łatwy', 'Średni', 'Trudny']
        }
    },
    
    // Subject form fields configuration - Updated for new structure
    SUBJECT_FORM_FIELDS: {
        subject_name: {
            name: 'subject_name',
            label: 'Nazwa przedmiotu',
            type: 'text',
            required: true,
            maxLength: 100
        },
        color: {
            name: 'color',
            label: 'Kolor',
            type: 'color',
            required: false,
            defaultValue: '#667eea'
        },
        icon: {
            name: 'icon',
            label: 'Ikona',
            type: 'text',
            required: false,
            maxLength: 10,
            defaultValue: '📚',
            placeholder: 'np. 📚, 🔬, 📐'
        }
    },
    
    // UI Configuration
    UI: {
        LOADING_TEXT: 'Wysyłanie zadania...',
        SUCCESS_MESSAGE: 'Zadanie zostało pomyślnie dodane!',
        ERROR_MESSAGE: 'Wystąpił błąd podczas dodawania zadania. Spróbuj ponownie.',
        VALIDATION_ERROR: 'Wypełnij wszystkie wymagane pola poprawnie.',
        TIMER_MESSAGES: {
            WORK_START: 'Czas na naukę! 📚',
            BREAK_START: 'Czas na przerwę! ☕',
            SESSION_COMPLETE: 'Świetna robota! 🎉',
            FOCUS_REMINDER: 'Zostań skupiony! 💪'
        },
        STREAK_MESSAGES: {
            NEW_STREAK: 'Nowa passa! 🔥',
            STREAK_BROKEN: 'Passa przerwana, ale nie poddawaj się! 💪',
            STREAK_MILESTONE: 'Gratulacje! Osiągnąłeś kamień milowy! 🏆'
        }
    },
    
    // Dashboard configuration
    DASHBOARD: {
        CORRECTNESS_MAPPING: {
            'Dobrze': 'correct',
            'Źle': 'incorrect', 
            '50/50': 'partial'
        },
        CORRECTNESS_WEIGHTS: {
            'correct': 1.0,
            'incorrect': 0.0,
            'partial': 0.5
        }
    },
    
    // Local Storage Keys
    STORAGE_KEYS: {
        EXAM_DATE: 'examDate',
        CURRENT_STREAK: 'currentStreak',
        LAST_ACTIVITY_DATE: 'lastActivityDate',
        TOTAL_POINTS: 'totalPoints',
        UNLOCKED_ACHIEVEMENTS: 'unlockedAchievements',
        POMODORO_COUNT: 'pomodoroCount',
        TIMER_SETTINGS: 'timerSettings',
        THEME_PREFERENCE: 'themePreference'
    },
    
    // Goals
    GOALS: {
        weeklyTasksTarget: 50
    },

    // Theme Configuration
    THEME: {
        PRIMARY_COLOR: '#667eea',
        SECONDARY_COLOR: '#764ba2',
        SUCCESS_COLOR: '#10b981',
        WARNING_COLOR: '#f59e0b',
        ERROR_COLOR: '#ef4444',
        BACKGROUND: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        CARD_BACKGROUND: 'rgba(255, 255, 255, 0.95)',
        SHADOW: '0 8px 32px rgba(0, 0, 0, 0.1)'
    },
    
    // Animation and UX Settings
    ANIMATIONS: {
        DURATION_FAST: 200,
        DURATION_NORMAL: 300,
        DURATION_SLOW: 500,
        EASING: 'cubic-bezier(0.4, 0, 0.2, 1)'
    },
    
    // Analytics Configuration for Enhanced Features
    ANALYTICS: {
        // Performance Over Time Settings
        PERFORMANCE_OVER_TIME: {
            DEFAULT_RANGE: 30, // Days to show by default
            CHART_TYPES: {
                ACCURACY_TREND: 'line',
                DAILY_TASKS: 'bar',
                CUMULATIVE_PROGRESS: 'line'
            },
            TIME_PERIODS: {
                WEEK: { days: 7, label: 'Ostatni tydzień' },
                MONTH: { days: 30, label: 'Ostatni miesiąc' },
                QUARTER: { days: 90, label: 'Ostatnie 3 miesiące' },
                ALL: { days: null, label: 'Cały okres' }
            }
        },
        
        // Study Consistency Settings
        CONSISTENCY: {
            STREAK_THRESHOLD: 1, // Minimum tasks per day to count as active
            CONSISTENCY_LEVELS: {
                EXCELLENT: { threshold: 0.9, label: 'Doskonała', emoji: '🔥' },
                GOOD: { threshold: 0.7, label: 'Dobra', emoji: '👍' },
                AVERAGE: { threshold: 0.5, label: 'Średnia', emoji: '📊' },
                POOR: { threshold: 0.3, label: 'Słaba', emoji: '⚠️' },
                CRITICAL: { threshold: 0, label: 'Wymagająca poprawy', emoji: '🚨' }
            }
        },
        
        // Time of Day Analysis
        TIME_OF_DAY: {
            PERIODS: {
                MORNING: { start: 6, end: 12, label: 'Rano (6:00-12:00)', emoji: '🌅' },
                AFTERNOON: { start: 12, end: 18, label: 'Popołudnie (12:00-18:00)', emoji: '☀️' },
                EVENING: { start: 18, end: 24, label: 'Wieczór (18:00-24:00)', emoji: '🌙' },
                NIGHT: { start: 0, end: 6, label: 'Noc (0:00-6:00)', emoji: '🌃' }
            },
            PERFORMANCE_THRESHOLDS: {
                HIGH: 80,
                MEDIUM: 60,
                LOW: 40
            }
        },
        
        // Subject Analysis Settings
        SUBJECT_ANALYSIS: {
            MIN_TASKS_FOR_ANALYSIS: 5,
            PERFORMANCE_CATEGORIES: {
                EXCELLENT: { min: 90, color: '#10b981', label: 'Doskonały' },
                GOOD: { min: 80, color: '#3b82f6', label: 'Dobry' },
                SATISFACTORY: { min: 70, color: '#f59e0b', label: 'Zadowalający' },
                NEEDS_IMPROVEMENT: { min: 60, color: '#ef4444', label: 'Wymaga poprawy' },
                CRITICAL: { min: 0, color: '#991b1b', label: 'Krytyczny' }
            },
            TIME_TRACKING: {
                EFFICIENT_THRESHOLD: 0.8, // Tasks completed correctly in reasonable time
                SLOW_THRESHOLD: 0.5
            }
        },
        
        // Location Impact Analysis
        LOCATION_ANALYSIS: {
            DEFAULT_LOCATIONS: ['Dom', 'Biblioteka', 'Szkoła', 'Inne'],
            PERFORMANCE_COMPARISON: {
                MIN_TASKS_PER_LOCATION: 3,
                SIGNIFICANCE_THRESHOLD: 10 // % difference to consider significant
            }
        },
        
        // Progress Tracking
        PROGRESS_TRACKING: {
            IMPROVEMENT_INDICATORS: {
                STRONG_IMPROVEMENT: { threshold: 20, emoji: '📈', color: '#10b981' },
                MODERATE_IMPROVEMENT: { threshold: 10, emoji: '⬆️', color: '#3b82f6' },
                SLIGHT_IMPROVEMENT: { threshold: 5, emoji: '↗️', color: '#f59e0b' },
                STABLE: { threshold: -5, emoji: '➡️', color: '#6b7280' },
                SLIGHT_DECLINE: { threshold: -10, emoji: '↘️', color: '#f59e0b' },
                MODERATE_DECLINE: { threshold: -20, emoji: '⬇️', color: '#ef4444' },
                STRONG_DECLINE: { threshold: -100, emoji: '📉', color: '#991b1b' }
            },
            STREAK_REWARDS: {
                WEEK: { days: 7, title: 'Tygodniowy mistrz!', emoji: '🔥' },
                BIWEEK: { days: 14, title: 'Dwutygodniowa passa!', emoji: '⚡' },
                MONTH: { days: 30, title: 'Miesięczny bohater!', emoji: '🏆' },
                QUARTER: { days: 90, title: 'Kwartalny mistrz!', emoji: '👑' }
            }
        },
        
        // Chart Display Settings
        CHARTS: {
            COLORS: {
                PRIMARY: '#667eea',
                SECONDARY: '#764ba2',
                SUCCESS: '#10b981',
                WARNING: '#f59e0b',
                ERROR: '#ef4444',
                INFO: '#3b82f6',
                PURPLE: '#8b5cf6',
                TEAL: '#06b6d4'
            },
            SUBJECT_COLORS: [
                '#4f46e5', '#0ea5e9', '#10b981', '#f59e0b',
                '#ef4444', '#6366f1', '#14b8a6', '#a855f7',
                '#84cc16', '#fb7185', '#f97316', '#22c55e'
            ],
            DEFAULT_HEIGHT: 300,
            RESPONSIVE_BREAKPOINTS: {
                MOBILE: 768,
                TABLET: 1024,
                DESKTOP: 1200
            }
        },
        
        // Data Export Settings
        EXPORT: {
            FORMATS: ['CSV', 'JSON', 'PDF'],
            DEFAULT_FILENAME_PREFIX: 'analytics_report_',
            INCLUDE_CHARTS: true,
            INCLUDE_RAW_DATA: true
        }
    },
    
    // Development settings removed - use Google Sheets Data Debugger instead
};

// Export configuration for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
