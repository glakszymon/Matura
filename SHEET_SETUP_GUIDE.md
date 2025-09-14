# Google Sheets Setup Guide

## Issue Resolution
The error "Main form sheet not found" occurs because your Google Sheets document doesn't have the expected "Arkusz1" sheet that the app is looking for.

## Quick Solution Options

### Option 1: Let the App Create the Sheet (Recommended)
1. **Update your Google Apps Script** with the fixed version (`updated-gas-script.js`)
2. **Redeploy the web app** 
3. The app will now automatically create the "Arkusz1" sheet when needed
4. No manual sheet creation required!

### Option 2: Create the Sheet Manually
If you prefer to create the sheet manually:

1. **Open your Google Sheets document**: https://docs.google.com/spreadsheets/d/1a51kwcG8aT4rfTSdhJ6HKSggneURQkQsywZClCcIcJ8/edit
2. **Add a new sheet** by clicking the "+" button at the bottom
3. **Rename the sheet** to "Arkusz1" (right-click → Rename)
4. **Add headers** in row 1:
   - A1: `nazwa`
   - B1: `tresc` 
   - C1: `poprawnosc`
   - D1: `kategorie`
   - E1: `przedmiot`
   - F1: `timestamp`

### Option 3: Use a Different Sheet Name
If you already have a sheet with your data but it has a different name:

1. **Find your main data sheet** in the Google Sheets document
2. **Rename it** to "Arkusz1" (right-click → Rename)
3. **Or** update the config in `js/config.js`:
   ```javascript
   MAIN_FORM: {
       SHEET_NAME: 'YourActualSheetName', // Replace with your sheet name
       RANGE: 'A:F'
   }
   ```

## What the Fixes Do

### 1. **Client-Side Fix** (`googleSheetsAPI-v2.js`)
- The app now handles missing sheets gracefully
- Returns empty data instead of throwing errors
- Logs warnings instead of errors for missing sheets

### 2. **Server-Side Fix** (`updated-gas-script.js`)  
- `handleGetMainEntries()` returns empty array if sheet doesn't exist
- `handleAddMainFormEntry()` creates the sheet automatically if missing
- Better error handling and logging

## Required Sheets for Full Functionality
For the complete app to work, you should have these sheets:

### Essential Sheets:
- **Arkusz1** - Main form submissions (legacy)
- **Tasks** - Task submissions  
- **Subjects** - Subject definitions
- **Categories** - Category definitions

### Optional Sheets:
- **Achievements** - Achievement tracking
- **Pomodoro_Sessions** - Pomodoro session data
- **Settings** - App settings
- **User_Stats** - Daily statistics

## Testing After Setup
1. **Deploy the updated Google Apps Script**
2. **Refresh your web app** at http://localhost:8081
3. **Check browser console** - should see "Main form sheet does not exist - returning empty entries" instead of errors
4. **Try submitting a form** - it should work and create the sheet if needed

## Sheet Headers Reference
Here are the expected headers for each sheet:

### Tasks Sheet
```
task_name | category | subject | correctness | timestamp | points | session_id
```

### Subjects Sheet  
```
id | name | description | active
```

### Categories Sheet
```
id | name | description | active
```

### Arkusz1 (Main Form) Sheet
```
nazwa | tresc | poprawnosc | kategorie | przedmiot | timestamp
```

## After Setup
Once the sheets are properly configured:
- The loading screen should work correctly
- Dashboard should display subjects and categories
- Form submissions should work without errors
- No more "sheet not found" errors in the console
