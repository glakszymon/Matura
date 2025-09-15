# System Zarządzania Danymi - Google Sheets Form Web App

A comprehensive vanilla JavaScript web application for managing educational tasks and data directly with Google Sheets integration. Features advanced analytics, task management, and performance tracking.

## ✨ Key Features

### 🎯 Core Functionality
- **Task Management**: Add, track, and analyze educational tasks with detailed descriptions
- **Subject Organization**: Create and manage different subjects with custom colors and icons
- **Category Management**: Organize tasks into categories with difficulty levels (Easy/Medium/Hard)
- **Real-time Validation**: Multi-layer form validation with instant feedback
- **Google Sheets Integration**: Direct data synchronization with Google Sheets using Google Apps Script

### 📊 Analytics & Reporting
- **Performance Analytics**: Detailed subject-wise performance tracking and statistics
- **Category Analysis**: Identify strong and weak areas within each subject
- **Progress Tracking**: Monitor learning progress with expandable task details
- **Statistical Insights**: Comprehensive analytics dashboard with accuracy percentages
- **Trend Analysis**: Visual indicators for improving, declining, or stable performance

### 🎨 User Experience
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Modern UI**: Clean, professional interface with smooth animations and transitions
- **Tabbed Navigation**: Easy switching between task entry, subject management, and analytics
- **Loading States**: Visual feedback during data operations with progress indicators
- **Error Handling**: Comprehensive error management with user-friendly Polish messages

## 🏷️ Application Structure

### Main Navigation Tabs
1. **Wprowadzanie Danych** - Task entry form
2. **Analiza Wyników** - Performance analytics dashboard
3. **Zarządzanie Przedmiotami** - Subject management
4. **Zarządzanie Kategoriami** - Category management

### Task Form Fields
- **Nazwa zadania** (Task Name) - Text input, max 100 characters
- **Opis** (Description) - Textarea, max 1000 characters
- **Poprawność** (Correctness) - Select dropdown (Poprawnie/Błędnie/Częściowo)
- **Kategoria** (Category) - Dynamic dropdown loaded from Google Sheets
- **Przedmiot** (Subject) - Dynamic dropdown loaded from Google Sheets

### Subject Management
- **Nazwa Przedmiotu** (Subject Name) - Text input, max 100 characters
- **Kolor** (Color) - Color picker for visual identification
- **Ikona** (Icon) - Emoji icon selector

### Category Management
- **Nazwa Kategorii** (Category Name) - Text input, max 100 characters
- **Przedmiot** (Subject) - Dropdown selection from existing subjects
- **Poziom trudności** (Difficulty Level) - Łatwy/Średni/Trudny

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome 80+, Firefox 75+, Safari 13+, Edge 80+)
- Google account with Google Sheets and Apps Script access
- Basic web server for local development

### Google Sheets Structure

The application requires the following sheets in your Google Spreadsheet:

**Tasks Sheet** (Columns A-H):
- task_name, description, category, subject, correctness, timestamp, points, session_id

**Subjects Sheet** (Columns A-D):
- subject_name, color, icon, active

**Categories Sheet** (Columns A-D):
- category_name, subject_name, difficulty, active

**Optional Sheets**:
- PomodoroSessions (A-F): id, category, subject, duration, timestamp, notes
- DailyStats (A-E): date, tasks_count, correct_tasks, streak_day, notes
- Achievements (A-D): id, name, description, unlocked_date

### Google Apps Script Setup

1. **Create a new Google Apps Script project**
2. **Replace the default code with a comprehensive handler**:
   ```javascript
   function doPost(e) {
     try {
       const data = JSON.parse(e.postData.contents);
       const spreadsheet = SpreadsheetApp.openById(data.spreadsheetId);
       const sheet = spreadsheet.getSheetByName(data.sheetName);
       
       // Handle different types of operations
       switch(data.operation) {
         case 'addTask':
           // Add timestamp for task entry
           data.data.push(new Date().toISOString());
           sheet.appendRow(data.data);
           break;
         case 'addSubject':
           sheet.appendRow(data.data);
           break;
         case 'addCategory':
           sheet.appendRow(data.data);
           break;
         default:
           sheet.appendRow(data.data);
       }
       
       return ContentService
         .createTextOutput(JSON.stringify({success: true, message: 'Data added successfully'}))
         .setMimeType(ContentService.MimeType.JSON);
         
     } catch (error) {
       return ContentService
         .createTextOutput(JSON.stringify({success: false, error: error.toString()}))
         .setMimeType(ContentService.MimeType.JSON);
     }
   }
   
   function doGet(e) {
     // Handle GET requests for data retrieval
     try {
       const spreadsheetId = e.parameter.spreadsheetId;
       const sheetName = e.parameter.sheetName;
       
       const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
       const sheet = spreadsheet.getSheetByName(sheetName);
       const data = sheet.getDataRange().getValues();
       
       return ContentService
         .createTextOutput(JSON.stringify({success: true, data: data}))
         .setMimeType(ContentService.MimeType.JSON);
         
     } catch (error) {
       return ContentService
         .createTextOutput(JSON.stringify({success: false, error: error.toString()}))
         .setMimeType(ContentService.MimeType.JSON);
     }
   }
   ```

3. **Deploy the Apps Script**:
   - Go to Deploy > New Deployment
   - Choose "Web app" as the type
   - Set execute permissions to "Anyone"
   - Enable "Execute as: Me"
   - Copy the web app URL

4. **Update Application Configuration**:
   ```javascript
   // In js/config.js
   const CONFIG = {
       SPREADSHEET_ID: 'your_spreadsheet_id_here',
       GAS_WEB_APP_URL: 'your_apps_script_url_here',
       
       // Sheet configurations
       SHEETS: {
           TASKS: { SHEET_NAME: 'Tasks', RANGE: 'A:H' },
           SUBJECTS: { SHEET_NAME: 'Subjects', RANGE: 'A:D' },
           CATEGORIES: { SHEET_NAME: 'Categories', RANGE: 'A:D' }
       }
   };
   ```

### Local Development

1. **Clone/Download the project**:
   ```bash
   git clone <repository-url>
   cd google-sheets-form-webapp-new
   ```

2. **Serve the files**:
   
   **Option A: Python HTTP Server**
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Python 2
   python -m SimpleHTTPServer 8000
   ```
   
   **Option B: Node.js HTTP Server**
   ```bash
   npx serve .
   ```
   
   **Option C: VS Code Live Server Extension**
   - Install the "Live Server" extension
   - Right-click `index.html` and select "Open with Live Server"

3. **Open in browser**: Navigate to `http://localhost:8000` (or the appropriate port)

## 🔧 Configuration

### Environment Settings

Edit `js/config.js` to customize the application:

```javascript
const CONFIG = {
    // Your Google Sheets configuration
    SPREADSHEET_ID: '1a51kwcG8aT4rfTSdhJ6HKSggneURQkQsywZClCcIcJ8',
    SHEET_NAME: 'Arkusz 1',
    RANGE: 'A:E',
    
    // Your deployed Google Apps Script URL
    GAS_WEB_APP_URL: 'YOUR_APPS_SCRIPT_URL_HERE',
    
    // Development settings
    DEBUG_MODE: true,
    DEMO_MODE: false // Set to true for testing without API calls
};
```

### Demo Mode

For testing purposes, you can enable demo mode:
1. Set `DEMO_MODE: true` in `js/config.js`
2. The form will simulate submissions without making actual API calls
3. Check the browser console to see the simulated data

## 🏧 Architecture

### Frontend Structure
```
google-sheets-form-webapp-test/
├── index.html                    # Main application entry point
├── css/
│   ├── styles.css               # Main styling
│   ├── performance-table.css    # Analytics table styles
│   ├── management-styles.css    # Management forms styling
│   └── charts.css              # Chart visualization styles
├── js/
│   ├── config.js               # Application configuration
│   ├── googleSheetsAPI-v2.js   # Google Sheets API integration
│   ├── analyticsManager.js     # Analytics and reporting logic
│   ├── managementForms.js      # Subject/category management
│   ├── loadingManager.js       # Loading state management
│   ├── chartsManager.js        # Chart visualization
│   ├── googleSheetsDebugger.js # Development debugging tools
│   └── app-simplified.js       # Main application controller
├── README.md                     # This documentation
└── WARP.md                       # Development guidelines
```

## 📚 Usage Guide

### Adding Tasks
1. Navigate to "Wprowadzanie Danych" tab
2. Fill in task details:
   - **Nazwa zadania**: Task name (max 100 chars)
   - **Opis**: Task description (max 1000 chars)
   - **Poprawność**: Correctness level (Poprawnie/Błędnie/Częściowo)
   - **Kategoria**: Select from available categories
   - **Przedmiot**: Select from available subjects
3. Click "Wyślij" to submit

### Managing Subjects
1. Go to "Zarządzanie Przedmiotami" tab
2. Add new subjects with:
   - Name, color, and emoji icon
3. View and manage existing subjects
4. Edit or deactivate subjects as needed

### Managing Categories
1. Access "Zarządzanie Kategoriami" tab
2. Create categories with:
   - Name, associated subject, difficulty level
3. Organize tasks by categories
4. Track performance by category

### Analytics Dashboard
1. Click "Analiza Wyników" in navigation
2. Select a subject from the left panel
3. View detailed analytics:
   - Overall performance statistics
   - Category-wise breakdown
   - Strong and weak areas
   - Detailed task listings with expandable rows

## 🐛 Troubleshooting

### Common Issues

**CORS Errors**:
- Ensure serving via web server (not file:// protocol)
- Check Google Apps Script deployment settings
- Verify "Anyone" access permissions

**Form not submitting**:
- Verify `GAS_WEB_APP_URL` in config
- Check Google Apps Script permissions
- Review browser console for API errors

**Validation errors**:
- Verify form element IDs match JavaScript selectors
- Check required field configurations
- Ensure proper data format

**Analytics not loading**:
- Ensure Google Sheets has proper data structure
- Check console for API errors
- Verify subject and category data exists

**Data not appearing in sheets**:
- Check spreadsheet ID and sheet names
- Verify Google Apps Script permissions
- Ensure proper column structure

### Development Features

**Debug Mode**: Enable detailed logging
```javascript
// In browser console
enableGSDebug(); // Enable Google Sheets debug logging
```

**Demo Mode**: Test without API calls
```javascript
// In js/config.js
const CONFIG = {
    DEMO_MODE: true  // Simulates API responses
}
```

**Data Validation**: Multi-layer validation system
- **HTML5 Validation**: Basic required/maxlength attributes
- **Real-time Validation**: JavaScript validation on input events  
- **Pre-submission**: Final validation before API calls

### Debug Commands
```javascript
// In browser console
window.enableGSDebug();                    // Enable debug logging
window.analyticsManager.getAnalyticsStats(); // View analytics state
window.appData;                            // Check loaded data
window.navigationManager.showMessage('Test', 'success'); // Test messages
```

## 🔒 Security Considerations

- **Input Sanitization**: All user inputs are properly escaped
- **XSS Prevention**: HTML content is sanitized before rendering
- **HTTPS Recommended**: For Google Sheets API calls
- **No Sensitive Data Storage**: All data stored in Google Sheets
- **Access Control**: Google Apps Script handles permissions

## 📱 Browser Compatibility

### Supported Browsers
- **Chrome**: 80+
- **Firefox**: 75+
- **Safari**: 13+
- **Edge**: 80+

### Features Used
- ES6+ Classes and async/await
- CSS Custom Properties
- Fetch API
- Modern JavaScript features

## 🤝 Contributing

This is a vanilla JavaScript project with no build process. To contribute:

1. Follow existing code patterns
2. Use ES6+ features consistently
3. Maintain responsive design principles
4. Test across supported browsers
5. Update documentation for new features

---

**Built with ❤️ using vanilla JavaScript, modern CSS, and Google Sheets integration**
