# 📊 Google Sheets Structure for StudyFlow App

## Overview
This document describes the complete Google Sheets structure needed for the StudyFlow exam preparation app. The spreadsheet should contain multiple tabs (sheets) to store different types of data.

## 📋 Required Sheets Structure

### 1. **Tasks** Sheet
**Purpose**: Store all completed tasks/exercises
**Columns**:
- A: `task_name` (text) - Name of the task
- B: `category` (text) - Category name
- C: `subject` (text) - Subject name  
- D: `correctness` (text) - "Poprawnie" or "Błędnie"
- E: `timestamp` (datetime) - When task was completed
- F: `points` (number) - Points earned (5 for correct, 2 for incorrect)
- G: `session_id` (text) - Pomodoro session ID (if applicable)

**Example data**:
```
task_name           category        subject     correctness  timestamp           points  session_id
Równania kwadratowe Algebra         Matematyka  Poprawnie   2024-01-15 14:30:00 5       
Gramatyka           Części mowy     Polski      Błędnie     2024-01-15 15:00:00 2       pom_001
```

### 2. **Subjects** Sheet  
**Purpose**: Define available subjects
**Columns**:
- A: `subject_name` (text) - Name of the subject
- B: `color` (text) - Hex color code for UI
- C: `icon` (text) - Emoji or icon identifier
- D: `active` (boolean) - TRUE/FALSE if subject is active

**Example data**:
```
subject_name  color     icon  active
Matematyka    #FF6B6B   📐    TRUE
Polski        #4ECDC4   📝    TRUE
Angielski     #45B7D1   🇬🇧   TRUE
Historia      #F7B731   📚    TRUE
```

### 3. **Categories** Sheet
**Purpose**: Define categories within subjects
**Columns**:
- A: `category_name` (text) - Name of the category
- B: `subject_name` (text) - Parent subject
- C: `difficulty` (text) - "Łatwy", "Średni", "Trudny"
- D: `active` (boolean) - TRUE/FALSE if category is active

**Example data**:
```
category_name       subject_name  difficulty  active
Algebra             Matematyka    Średni      TRUE
Geometria           Matematyka    Trudny      TRUE
Części mowy         Polski        Łatwy       TRUE
Składnia            Polski        Trudny      TRUE
Grammar             Angielski     Średni      TRUE
```

### 4. **Achievements** Sheet
**Purpose**: Store achievement definitions and progress
**Columns**:
- A: `achievement_id` (text) - Unique identifier
- B: `name` (text) - Achievement name
- C: `description` (text) - Achievement description
- D: `icon` (text) - Emoji or icon
- E: `type` (text) - "tasks", "streak", "pomodoro", "points"
- F: `target_value` (number) - Target to unlock
- G: `points_reward` (number) - Points awarded
- H: `unlocked` (boolean) - TRUE/FALSE if unlocked
- I: `unlock_date` (datetime) - When it was unlocked

**Example data**:
```
achievement_id  name            description                    icon  type    target_value  points_reward  unlocked  unlock_date
first_task      Pierwsze kroki  Wykonaj pierwsze zadanie      🎯    tasks   1             10             TRUE      2024-01-15 10:00:00
streak_7        Tydzień pasma   Utrzymaj passę przez 7 dni    🔥    streak  7             50             FALSE     
pomodoro_10     Skupiony        Ukończ 10 sesji Pomodoro      🍅    pomodoro 10           30             FALSE     
```

### 5. **Pomodoro_Sessions** Sheet
**Purpose**: Track Pomodoro study sessions
**Columns**:
- A: `session_id` (text) - Unique session identifier
- B: `start_time` (datetime) - Session start time
- C: `end_time` (datetime) - Session end time
- D: `duration_minutes` (number) - Session duration
- E: `subject` (text) - Subject studied
- F: `category` (text) - Category studied
- G: `completed` (boolean) - TRUE/FALSE if completed
- H: `tasks_completed` (number) - Number of tasks done in session

**Example data**:
```
session_id  start_time          end_time            duration_minutes  subject     category    completed  tasks_completed
pom_001     2024-01-15 14:00:00 2024-01-15 14:25:00 25               Matematyka  Algebra     TRUE       3
pom_002     2024-01-15 15:00:00 2024-01-15 15:25:00 25               Polski      Składnia    TRUE       2
```

### 6. **Settings** Sheet
**Purpose**: Store app configuration and user preferences
**Columns**:
- A: `setting_key` (text) - Setting identifier
- B: `setting_value` (text) - Setting value
- C: `setting_type` (text) - "string", "number", "boolean", "date"
- D: `description` (text) - Setting description

**Example data**:
```
setting_key         setting_value        setting_type  description
exam_date          2024-06-15           date          Data egzaminu maturalnego
exam_name          Matura 2024          string        Nazwa egzaminu
daily_goal         10                   number        Dzienny cel zadań
work_duration      25                   number        Czas pracy Pomodoro (minuty)
short_break        5                    number        Krótka przerwa (minuty)
long_break         15                   number        Długa przerwa (minuty)
app_version        2.0                  string        Wersja aplikacji
```

### 7. **User_Stats** Sheet (Optional)
**Purpose**: Store daily/weekly statistics
**Columns**:
- A: `date` (date) - Date of statistics
- B: `tasks_completed` (number) - Tasks completed that day
- C: `correct_tasks` (number) - Correctly answered tasks
- D: `points_earned` (number) - Points earned that day
- E: `pomodoro_sessions` (number) - Pomodoro sessions completed
- F: `study_time_minutes` (number) - Total study time

**Example data**:
```
date        tasks_completed  correct_tasks  points_earned  pomodoro_sessions  study_time_minutes
2024-01-15  8               6              34             3                  75
2024-01-16  12              10             58             4                  100
```

## 🔧 Implementation Notes

### Sheet Names (Exact names to use):
- `Tasks`
- `Subjects` 
- `Categories`
- `Achievements`
- `Pomodoro_Sessions`
- `Settings`
- `User_Stats`

### Data Ranges:
- **Tasks**: `A:G` (7 columns)
- **Subjects**: `A:D` (4 columns)
- **Categories**: `A:D` (4 columns)  
- **Achievements**: `A:I` (9 columns)
- **Pomodoro_Sessions**: `A:H` (8 columns)
- **Settings**: `A:D` (4 columns)
- **User_Stats**: `A:F` (6 columns)

### Headers Row:
Each sheet should have headers in row 1. The Apps Script will read from row 2 onwards for data.

### Required Permissions:
The Google Apps Script will need:
- Read access to all sheets
- Write access to all sheets
- Ability to add new rows
- Ability to update existing rows

This structure provides complete data storage for:
- ✅ Task tracking and analytics
- ✅ Subject and category management
- ✅ Achievement system
- ✅ Pomodoro timer sessions
- ✅ User preferences and settings
- ✅ Statistical analysis and reporting
