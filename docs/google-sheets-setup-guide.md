# 📊 Google Sheets Setup Guide for StudyFlow App

This comprehensive guide will help you set up Google Sheets integration for the StudyFlow exam preparation app.

## 🎯 Overview

The setup involves three main steps:
1. **Create Google Sheets** with the required structure
2. **Deploy Google Apps Script** to handle data operations  
3. **Configure the website** with URLs and IDs

---

## 📋 Step 1: Create Google Sheets Structure

### 1.1 Create New Google Sheets File

1. Go to [Google Sheets](https://sheets.google.com)
2. Click **"+ Blank"** to create a new spreadsheet
3. Rename it to **"StudyFlow - Exam Prep Data"**
4. Copy the **Spreadsheet ID** from the URL (the long string between `/d/` and `/edit`)
   - Example: `https://docs.google.com/spreadsheets/d/1ABC123XYZ789/edit#gid=0`
   - Spreadsheet ID: `1ABC123XYZ789`

### 1.2 Create Required Sheets

Create the following 7 tabs (sheets) in your Google Sheets file:

#### Sheet 1: **Tasks**
1. Right-click on "Sheet1" → Rename to **"Tasks"**
2. Add headers in row 1:
   ```
   A1: task_name
   B1: category  
   C1: subject
   D1: correctness
   E1: timestamp
   F1: points
   G1: session_id
   ```

#### Sheet 2: **Subjects**
1. Add new sheet → Name it **"Subjects"**
2. Add headers in row 1:
   ```
   A1: subject_name
   B1: color
   C1: icon
   D1: active
   ```
3. Add sample data in row 2-5:
   ```
   Row 2: Matematyka    #FF6B6B    📐    TRUE
   Row 3: Polski        #4ECDC4    📝    TRUE
   Row 4: Angielski     #45B7D1    🇬🇧   TRUE
   Row 5: Historia      #F7B731    📚    TRUE
   ```

#### Sheet 3: **Categories**
1. Add new sheet → Name it **"Categories"**
2. Add headers in row 1:
   ```
   A1: category_name
   B1: subject_name
   C1: difficulty
   D1: active
   ```
3. Add sample data in rows 2-7:
   ```
   Row 2: Algebra          Matematyka    Średni    TRUE
   Row 3: Geometria        Matematyka    Trudny    TRUE
   Row 4: Części mowy      Polski        Łatwy     TRUE
   Row 5: Składnia         Polski        Trudny    TRUE
   Row 6: Grammar          Angielski     Średni    TRUE
   Row 7: Vocabulary       Angielski     Łatwy     TRUE
   ```

#### Sheet 4: **Achievements**
1. Add new sheet → Name it **"Achievements"**
2. Add headers in row 1:
   ```
   A1: achievement_id
   B1: name
   C1: description
   D1: icon
   E1: type
   F1: target_value
   G1: points_reward
   H1: unlocked
   I1: unlock_date
   ```
3. Add sample data in rows 2-4:
   ```
   Row 2: first_task     Pierwsze kroki       Wykonaj pierwsze zadanie      🎯    tasks      1     10    FALSE    
   Row 3: streak_7       Tydzień pasma        Utrzymaj passę przez 7 dni    🔥    streak     7     50    FALSE
   Row 4: pomodoro_10    Skupiony            Ukończ 10 sesji Pomodoro      🍅    pomodoro   10    30    FALSE
   ```

#### Sheet 5: **Pomodoro_Sessions**
1. Add new sheet → Name it **"Pomodoro_Sessions"**
2. Add headers in row 1:
   ```
   A1: session_id
   B1: start_time
   C1: end_time
   D1: duration_minutes
   E1: subject
   F1: category
   G1: completed
   H1: tasks_completed
   ```

#### Sheet 6: **Settings**
1. Add new sheet → Name it **"Settings"**
2. Add headers in row 1:
   ```
   A1: setting_key
   B1: setting_value
   C1: setting_type
   D1: description
   ```
3. Add default settings in rows 2-7:
   ```
   Row 2: exam_date        2024-06-15           date     Data egzaminu maturalnego
   Row 3: exam_name        Matura 2024          string   Nazwa egzaminu
   Row 4: daily_goal       10                   number   Dzienny cel zadań
   Row 5: work_duration    25                   number   Czas pracy Pomodoro (minuty)
   Row 6: short_break      5                    number   Krótka przerwa (minuty)
   Row 7: long_break       15                   number   Długa przerwa (minuty)
   ```

#### Sheet 7: **User_Stats**
1. Add new sheet → Name it **"User_Stats"**
2. Add headers in row 1:
   ```
   A1: date
   B1: tasks_completed
   C1: correct_tasks
   D1: points_earned
   E1: pomodoro_sessions
   F1: study_time_minutes
   ```

---

## ⚙️ Step 2: Deploy Google Apps Script

### 2.1 Create Apps Script Project

1. In your Google Sheets file, go to **Extensions** → **Apps Script**
2. Delete the default code in `Code.gs`
3. Copy and paste the complete code from `google-apps-script/Code.gs` (found in this repository)
4. Save the project (Ctrl+S)
5. Rename the project to **"StudyFlow Data Handler"**

### 2.2 Deploy as Web App

1. Click **Deploy** → **New Deployment**
2. Settings:
   - **Type**: Web app
   - **Description**: StudyFlow API v2.0
   - **Execute as**: Me (your email)
   - **Who has access**: Anyone
3. Click **Deploy**
4. **Authorize access** when prompted:
   - Review permissions
   - Click **Advanced** → **Go to StudyFlow Data Handler (unsafe)** if needed
   - Click **Allow**
5. **Copy the Web App URL** - you'll need this for the website configuration
   - Example: `https://script.google.com/macros/s/AKfyc...abc123/exec`

### 2.3 Test the Deployment

1. In Apps Script editor, run the `doGet` function manually
2. Check execution logs for any errors
3. Test API endpoints by visiting:
   ```
   https://YOUR_WEB_APP_URL?action=getSubjects&spreadsheetId=YOUR_SPREADSHEET_ID
   ```

---

## 🌐 Step 3: Configure Website

### 3.1 Update CONFIG in `js/config.js`

Open `js/config.js` and update these values:

```javascript
const CONFIG = {
    // ✅ UPDATE THESE VALUES:
    SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID_HERE',  // From Step 1.1
    GAS_WEB_APP_URL: 'YOUR_WEB_APP_URL_HERE',    // From Step 2.2
    
    // Sheet configuration
    SHEETS: {
        TASKS: {
            SHEET_NAME: 'Tasks',
            RANGE: 'A:G'
        },
        SUBJECTS: {
            SHEET_NAME: 'Subjects', 
            RANGE: 'A:D'
        },
        CATEGORIES: {
            SHEET_NAME: 'Categories',
            RANGE: 'A:D'
        },
        ACHIEVEMENTS: {
            SHEET_NAME: 'Achievements',
            RANGE: 'A:I'
        },
        POMODORO_SESSIONS: {
            SHEET_NAME: 'Pomodoro_Sessions',
            RANGE: 'A:H'
        },
        SETTINGS: {
            SHEET_NAME: 'Settings',
            RANGE: 'A:D'
        },
        USER_STATS: {
            SHEET_NAME: 'User_Stats',
            RANGE: 'A:F'
        }
    },
    
    // Set to false for production, true for testing
    DEMO_MODE: false,
    DEBUG_MODE: true  // Set to false in production
};
```

### 3.2 Update HTML to Use New API

Replace the old GoogleSheetsAPI include in `index.html`:

**Replace:**
```html
<script src="js/googleSheets.js"></script>
```

**With:**
```html
<script src="js/googleSheetsAPI-v2.js"></script>
```

### 3.3 Update JavaScript Initialization

In `js/app.js`, update the API initialization:

**Replace:**
```javascript
const googleSheetsAPI = new GoogleSheetsAPI(CONFIG);
```

**With:**
```javascript
const googleSheetsAPI = new GoogleSheetsAPIv2(CONFIG);
```

---

## 🔧 Step 4: Testing & Verification

### 4.1 Test Basic Functionality

1. **Start local server**: `python -m http.server 8081`
2. **Open app**: `http://localhost:8081`
3. **Check console**: Look for "📊 GoogleSheetsAPI v2.0 initialized"
4. **Test FAB**: Click the floating action button to add a task

### 4.2 Test Data Flow

1. **Add a task** via the quick task modal
2. **Check Google Sheets** - verify the task appears in the Tasks sheet
3. **Check User_Stats** - verify daily stats are updated
4. **Test analytics** - navigate to the analytics page

### 4.3 Debug Issues

If something doesn't work:

1. **Check browser console** for JavaScript errors
2. **Check Apps Script logs**:
   - Go to Apps Script editor → **Executions**
   - Look for failed executions and error messages
3. **Verify CORS settings** - make sure the Web App is deployed as "Anyone" access
4. **Check sheet names** - ensure exact spelling matches CONFIG

---

## 🔒 Step 5: Security & Production Setup

### 5.1 Production Configuration

Before going live:

```javascript
// In js/config.js
const CONFIG = {
    DEMO_MODE: false,        // ✅ Disable demo mode
    DEBUG_MODE: false,       // ✅ Disable debug logs
    // ... rest of config
};
```

### 5.2 Access Control (Optional)

For better security, you can:

1. **Restrict Apps Script access** to specific Google accounts
2. **Use API keys** for additional authentication
3. **Set up domain restrictions** in Google Apps Script

### 5.3 Backup Strategy

- **Regularly export** your Google Sheets data
- **Version control** your Apps Script code
- **Document** any customizations made

---

## 📊 Step 6: Data Operations Reference

### Available API Methods

#### Task Operations
- `addTask(taskData)` - Add new task
- `getTasks()` - Get all tasks

#### Subject & Category Operations  
- `fetchSubjects()` - Get all subjects
- `fetchCategories(subjectName)` - Get categories (optionally filtered)

#### Pomodoro Operations
- `addPomodoroSession(sessionData)` - Add session
- `getPomodoroSessions()` - Get all sessions

#### Analytics Operations
- `getAnalytics()` - Get comprehensive analytics data

#### Achievement Operations
- `getAchievements()` - Get all achievements
- `updateAchievement(id, unlocked)` - Update achievement status

#### Settings Operations
- `getSettings()` - Get app settings
- `updateSetting(key, value)` - Update a setting

---

## 🆘 Troubleshooting Common Issues

### Issue 1: "Apps Script URL not configured"
**Solution**: Update `GAS_WEB_APP_URL` in `js/config.js`

### Issue 2: "Spreadsheet ID not configured"  
**Solution**: Update `SPREADSHEET_ID` in `js/config.js`

### Issue 3: CORS errors
**Solution**: Ensure Apps Script is deployed with "Anyone" access

### Issue 4: Tasks not appearing in sheets
**Solution**: Check sheet names match exactly (case-sensitive)

### Issue 5: Permission denied errors
**Solution**: Re-authorize the Apps Script deployment

---

## ✅ Success Checklist

- [ ] Google Sheets created with all 7 required sheets
- [ ] Headers added to all sheets with correct spelling
- [ ] Sample data added to Subjects, Categories, Achievements, and Settings
- [ ] Apps Script deployed as Web App with "Anyone" access
- [ ] Apps Script URL and Spreadsheet ID updated in config.js
- [ ] Website updated to use GoogleSheetsAPI-v2.js
- [ ] Basic functionality tested (add task, view analytics)
- [ ] Data appears correctly in Google Sheets
- [ ] Production settings applied (DEMO_MODE: false)

---

## 🎉 You're All Set!

Your StudyFlow app is now fully integrated with Google Sheets! The app can:

- ✅ Store tasks, subjects, and categories
- ✅ Track Pomodoro study sessions  
- ✅ Manage achievements and progress
- ✅ Generate detailed analytics
- ✅ Sync settings and user preferences
- ✅ Maintain daily study statistics

For support or questions, check the browser console and Apps Script execution logs for detailed error information.
