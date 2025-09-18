/**
 * Google Apps Script Web App for Enhanced Analytics
 * Add this code to your Google Apps Script project to support the new analytics features
 * 
 * SETUP INSTRUCTIONS:
 * 1. Open Google Apps Script (script.google.com)
 * 2. Create a new project or open your existing one
 * 3. Replace the existing Code.gs content with this code
 * 4. Save and deploy as a web app
 * 5. Set execution as "Me" and access as "Anyone"
 * 6. Copy the web app URL and update it in your config.js
 */

/**
 * Main function that handles all HTTP requests
 */
function doPost(e) {
  try {
    const params = e.parameter;
    const formType = params.formType;
    
    // Handle different form types
    switch(formType) {
      case 'main':
        return handleMainForm(params);
      case 'pomodoro':
        return handlePomodoroSession(params);
      case 'category':
        return handleCategoryForm(params);
      case 'subject':
        return handleSubjectForm(params);
      default:
        return ContentService
          .createTextOutput(JSON.stringify({success: false, message: 'Unknown form type'}))
          .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    console.error('doPost error:', error);
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle GET requests for analytics data
 */
function doGet(e) {
  try {
    const params = e.parameter;
    const action = params.action;
    const spreadsheetId = params.spreadsheetId;
    
    if (!spreadsheetId) {
      throw new Error('Spreadsheet ID is required');
    }
    
    // Handle different actions
    switch(action) {
      case 'getStudyTasks':
        return getStudyTasks(spreadsheetId);
      case 'getStudySessions':
        return getStudySessions(spreadsheetId);
      case 'getDailyStats':
        return getDailyStats(spreadsheetId);
      case 'getSubjects':
        return getSubjects(spreadsheetId);
      case 'getCategories':
        return getCategories(spreadsheetId);
      case 'getCategory':
        return getCategory(spreadsheetId, params.id);
      default:
        throw new Error('Unknown action: ' + action);
    }
  } catch (error) {
    console.error('doGet error:', error);
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Get study tasks from StudyTasks sheet for analytics
 */
function getStudyTasks(spreadsheetId) {
  try {
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName('StudyTasks');
    
    if (!sheet) {
      throw new Error('StudyTasks sheet not found');
    }
    
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    if (values.length <= 1) {
      return ContentService
        .createTextOutput(JSON.stringify({success: true, tasks: []}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const headers = values[0];
    const tasks = [];
    
    // Expected headers: task_id, task_name, description, categories, correctly_completed, start_time, end_time, location, subject, session_id
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const task = {
        task_id: row[0] || `task_${i}`,
        task_name: row[1] || '',
        description: row[2] || '',
        categories: row[3] || '',
        correctly_completed: row[4] || 'No',
        start_time: row[5] || new Date().toISOString(),
        end_time: row[6] || new Date().toISOString(),
        location: row[7] || '',
        subject: row[8] || '',
        session_id: row[9] || `session_${Math.floor(i/3)}`,
        timestamp: row[5] || new Date().toISOString()
      };
      
      tasks.push(task);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({success: true, tasks: tasks}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error getting study tasks:', error);
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: error.toString(), tasks: []}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Get study sessions from StudySessions sheet
 */
function getStudySessions(spreadsheetId) {
  try {
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName('StudySessions');
    
    if (!sheet) {
      throw new Error('StudySessions sheet not found');
    }
    
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    if (values.length <= 1) {
      return ContentService
        .createTextOutput(JSON.stringify({success: true, sessions: []}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const sessions = [];
    
    // Expected headers: session_id, start_time, end_time, duration_minutes, total_tasks, correct_tasks, accuracy_percentage, notes
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const session = {
        session_id: row[0] || `session_${i}`,
        start_time: row[1] || new Date().toISOString(),
        end_time: row[2] || new Date().toISOString(),
        duration_minutes: row[3] || 0,
        total_tasks: row[4] || 0,
        correct_tasks: row[5] || 0,
        accuracy_percentage: row[6] || 0,
        notes: row[7] || ''
      };
      
      sessions.push(session);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({success: true, sessions: sessions}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error getting study sessions:', error);
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: error.toString(), sessions: []}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Get daily statistics from DailyStats sheet
 */
function getDailyStats(spreadsheetId) {
  try {
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName('DailyStats');
    
    if (!sheet) {
      throw new Error('DailyStats sheet not found');
    }
    
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    if (values.length <= 1) {
      return ContentService
        .createTextOutput(JSON.stringify({success: true, stats: []}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const stats = [];
    
    // Expected headers: date, tasks_count, correct_tasks, streak_day, notes
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const stat = {
        date: row[0] || new Date().toISOString().split('T')[0],
        tasks_count: row[1] || 0,
        correct_tasks: row[2] || 0,
        streak_day: row[3] || 0,
        notes: row[4] || ''
      };
      
      stats.push(stat);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({success: true, stats: stats}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error getting daily stats:', error);
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: error.toString(), stats: []}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Get subjects from Subjects sheet
 */
function getSubjects(spreadsheetId) {
  try {
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName('Subjects');
    
    if (!sheet) {
      throw new Error('Subjects sheet not found');
    }
    
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    if (values.length <= 1) {
      return ContentService
        .createTextOutput(JSON.stringify({success: true, subjects: []}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const subjects = [];
    
    // Expected headers: subject_name, color, icon, active
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const subject = {
        name: row[0] || '',
        subject_name: row[0] || '',
        color: row[1] || '#667eea',
        icon: row[2] || '📚',
        active: row[3] !== false && row[3] !== 'false' && row[3] !== 0
      };
      
      if (subject.active) {
        subjects.push(subject);
      }
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({success: true, subjects: subjects}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error getting subjects:', error);
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: error.toString(), subjects: []}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Get categories from Categories sheet
 */
function getCategories(spreadsheetId) {
  try {
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName('Categories');
    
    if (!sheet) {
      throw new Error('Categories sheet not found');
    }
    
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    if (values.length <= 1) {
      return ContentService
        .createTextOutput(JSON.stringify({success: true, categories: []}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const categories = [];
    
    // Expected headers: category_name, subject_name, difficulty, active
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const category = {
        name: row[0] || '',
        category_name: row[0] || '',
        subject_name: row[1] || '',
        difficulty: row[2] || 'Średni',
        active: row[3] !== false && row[3] !== 'false' && row[3] !== 0
      };
      
      if (category.active) {
        categories.push(category);
      }
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({success: true, categories: categories}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error getting categories:', error);
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: error.toString(), categories: []}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Get a single category by ID
 */
function getCategory(spreadsheetId, categoryId) {
  try {
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName('Categories');
    
    if (!sheet) {
      throw new Error('Categories sheet not found');
    }
    
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    if (values.length <= 1) {
      return ContentService
        .createTextOutput(JSON.stringify({success: false, message: 'Category not found'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Find category by ID (assuming first column is the category name/ID)
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      if (row[0] === categoryId) {
        const category = {
          name: row[0] || '',
          category_name: row[0] || '',
          subject_name: row[1] || '',
          difficulty: row[2] || 'Średni',
          active: row[3] !== false && row[3] !== 'false' && row[3] !== 0
        };
        
        return ContentService
          .createTextOutput(JSON.stringify({success: true, category: category}))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: 'Category not found'}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error getting category:', error);
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle main form submission
 */
function handleMainForm(params) {
  try {
    const spreadsheetId = params.spreadsheetId;
    const sheetName = params.sheetName || 'StudyTasks';
    const data = JSON.parse(params.data);
    
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    let sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      // Create the sheet if it doesn't exist
      sheet = spreadsheet.insertSheet(sheetName);
      // Add headers
      sheet.getRange(1, 1, 1, 10).setValues([['task_id', 'task_name', 'description', 'categories', 'correctly_completed', 'start_time', 'end_time', 'location', 'subject', 'session_id']]);
    }
    
    // Generate task data
    const taskId = 'task_' + Date.now();
    const timestamp = new Date().toISOString();
    const sessionId = 'session_' + Date.now();
    
    const rowData = [
      taskId,
      data[0] || '', // task_name
      data[1] || '', // description
      data[3] || '', // categories
      data[2] === 'Dobrze' ? 'Yes' : 'No', // correctly_completed
      timestamp, // start_time
      timestamp, // end_time
      data[5] || '', // location
      data[4] || '', // subject
      sessionId // session_id
    ];
    
    sheet.appendRow(rowData);
    
    return ContentService
      .createTextOutput(JSON.stringify({success: true, message: 'Task added successfully'}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error handling main form:', error);
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle Pomodoro session submission
 */
function handlePomodoroSession(params) {
  try {
    const spreadsheetId = params.spreadsheetId;
    const sheetName = params.sheetName || 'StudySessions';
    const data = JSON.parse(params.data);
    
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    let sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      // Create the sheet if it doesn't exist
      sheet = spreadsheet.insertSheet(sheetName);
      // Add headers
      sheet.getRange(1, 1, 1, 8).setValues([['session_id', 'start_time', 'end_time', 'duration_minutes', 'total_tasks', 'correct_tasks', 'accuracy_percentage', 'notes']]);
    }
    
    // Generate session data
    const sessionId = 'session_' + Date.now();
    const startTime = data[3] || new Date().toISOString();
    const endTime = data[4] || new Date().toISOString();
    const duration = data[2] || 25;
    
    const rowData = [
      sessionId,
      startTime,
      endTime,
      duration,
      0, // total_tasks (to be updated)
      0, // correct_tasks (to be updated)
      0, // accuracy_percentage (to be updated)
      data[5] || '' // notes
    ];
    
    sheet.appendRow(rowData);
    
    return ContentService
      .createTextOutput(JSON.stringify({success: true, message: 'Session added successfully'}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error handling Pomodoro session:', error);
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle category form submission
 */
function handleCategoryForm(params) {
  try {
    const spreadsheetId = params.spreadsheetId;
    const sheetName = 'Categories';
    const data = JSON.parse(params.data);
    
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    let sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      // Create the sheet if it doesn't exist
      sheet = spreadsheet.insertSheet(sheetName);
      // Add headers
      sheet.getRange(1, 1, 1, 4).setValues([['category_name', 'subject_name', 'difficulty', 'active']]);
    }
    
    const rowData = [
      data[0] || '', // category_name
      data[1] || '', // subject_name
      data[2] || 'Średni', // difficulty
      true // active
    ];
    
    sheet.appendRow(rowData);
    
    return ContentService
      .createTextOutput(JSON.stringify({success: true, message: 'Category added successfully'}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error handling category form:', error);
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle subject form submission
 */
function handleSubjectForm(params) {
  try {
    const spreadsheetId = params.spreadsheetId;
    const sheetName = 'Subjects';
    const data = JSON.parse(params.data);
    
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    let sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      // Create the sheet if it doesn't exist
      sheet = spreadsheet.insertSheet(sheetName);
      // Add headers
      sheet.getRange(1, 1, 1, 4).setValues([['subject_name', 'color', 'icon', 'active']]);
    }
    
    const rowData = [
      data[0] || '', // subject_name
      data[1] || '#667eea', // color
      data[2] || '📚', // icon
      true // active
    ];
    
    sheet.appendRow(rowData);
    
    return ContentService
      .createTextOutput(JSON.stringify({success: true, message: 'Subject added successfully'}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error handling subject form:', error);
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
