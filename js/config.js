// Configuration settings for the Exam Preparation Application
const CONFIG = {
    // Google Sheets Configuration
    SPREADSHEET_ID: '1a51kwcG8aT4rfTSdhJ6HKSggneURQkQsywZClCcIcJ8',
    
    // Sheet configurations for different data types
    SHEETS: {
        TASKS: {
            SHEET_NAME: 'Tasks',
            RANGE: 'A:H' // task_name, description, category, subject, correctness, timestamp, points, session_id
        },
        CATEGORIES: {
            SHEET_NAME: 'Categories',
            RANGE: 'A:D' // category_name, subject_name, difficulty, active
        },
        SUBJECTS: {
            SHEET_NAME: 'Subjects',
            RANGE: 'A:D' // subject_name, color, icon, active
        },
        POMODORO_SESSIONS: {
            SHEET_NAME: 'PomodoroSessions',
            RANGE: 'A:F' // id, category, subject, duration, timestamp, notes
        },
        DAILY_STATS: {
            SHEET_NAME: 'DailyStats',
            RANGE: 'A:E' // date, tasks_count, correct_tasks, streak_day, notes
        },
        ACHIEVEMENTS: {
            SHEET_NAME: 'Achievements',
            RANGE: 'A:D' // id, name, description, unlocked_date
        }
    },
    
    // Exam Configuration
    EXAM: {
        DATE: '2026-06-15', // Default exam date (can be configured by user)
        NAME: 'Egzamin Główny',
        COUNTDOWN_UPDATE_INTERVAL: 1000 // Update every second
    },
    
    // Google Apps Script Web App URL
    GAS_WEB_APP_URL: 'https://script.google.com/macros/s/AKfycbwf5dkSIry0HoZ7y57lq_dorJhiBv5XdUKoNqqgwG3XUUZM0kUWGYx2LBp2zsIa-40/exec',
    
    // Pomodoro Timer Configuration
    POMODORO: {
        WORK_DURATION: 25 * 60, // 25 minutes in seconds
        SHORT_BREAK: 5 * 60, // 5 minutes in seconds
        LONG_BREAK: 15 * 60, // 15 minutes in seconds
        LONG_BREAK_INTERVAL: 4, // Long break after every 4 sessions
        AUTO_START_BREAKS: false,
        AUTO_START_WORK: false,
        SOUND_ENABLED: true
    },
    
    
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
    
    // Form field configuration - matches Google Apps Script backend
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
        correctness: {
            name: 'correctness',
            label: 'Poprawność',
            type: 'select',
            required: true,
            options: ['Poprawnie', 'Błędnie', 'Częściowo']
        },
        category: {
            name: 'category',
            label: 'Kategoria',
            type: 'select',
            required: true,
            maxLength: 50
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
    
    // Development settings removed - use Google Sheets Data Debugger instead
};

// Export configuration for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
