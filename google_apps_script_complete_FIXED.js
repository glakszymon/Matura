/**
 * StudyFlow Google Apps Script - Fixed Version
 * Handles all data operations between the web app and Google Sheets
 * Version: 6.1 - Fixed Study Task handling and improved error handling
 * 
 * Key fixes:
 * - Enhanced error handling for categories field processing
 * - Better data type validation
 * - Consistent field mapping with frontend expectations
 * - Better debugging and logging
 */

// Configuration
const CONFIG = {
  SHEETS: {
    SUBJECTS: 'Subjects', 
    CATEGORIES: 'Categories',
    ACHIEVEMENTS: 'Achievements',
    POMODORO_SESSIONS: 'Pomodoro_Sessions',
    SETTINGS: 'Settings',
    USER_STATS: 'User_Stats',
    STUDY_SESSIONS: 'StudySessions',
    STUDY_TASKS: 'StudyTasks'
  },
  RANGES: {
    SUBJECTS: 'A:D', // subject_name, color, icon, active
    CATEGORIES: 'A:D', // category_name, subject_name, difficulty, active
    ACHIEVEMENTS: 'A:I', // achievement_id, name, description, icon, type, target_value, points_reward, unlocked, unlock_date
    POMODORO_SESSIONS: 'A:H', // session_id, start_time, end_time, duration_minutes, category, subject, points_earned, status
    SETTINGS: 'A:D', // setting_key, value, type, description
    USER_STATS: 'A:F', // date, tasks_completed, correct_tasks, points_earned, pomodoro_sessions, study_time_minutes
    STUDY_SESSIONS: 'A:H', // session_id, start_time, end_time, duration_minutes, total_tasks, correct_tasks, accuracy_percentage, notes
    STUDY_TASKS: 'A:J' // task_id, task_name, description, categories, correctly_completed, start_time, end_time, location, subject, session_id
  }
};

/**
 * Main entry point for POST requests from web app
 */
function doPost(e) {
  try {
    console.log('POST request received:', JSON.stringify(e?.parameter || {}, null, 2));
    
    if (!e || !e.parameter) {
      console.error('Event object or parameters missing');
      return createErrorResponse('Missing request parameters');
    }
    
    const action = e.parameter.action || 'addTask';
    const spreadsheetId = e.parameter.spreadsheetId;
    
    if (!spreadsheetId) {
      console.error('Missing spreadsheetId parameter');
      return createErrorResponse('Missing spreadsheetId parameter');
    }
    
    let spreadsheet;
    try {
      spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    } catch (spreadsheetError) {
      console.error('Failed to open spreadsheet:', spreadsheetError);
      return createErrorResponse('Failed to open spreadsheet: ' + spreadsheetError.toString());
    }
    
    console.log('Processing action:', action);
    
    switch (action) {
      case 'addTask':
        return handleAddTask(e, spreadsheet);
      case 'addStudyTask':
        return handleAddStudyTask(e, spreadsheet);
      case 'addPomodoroSession':
        return handleAddPomodoroSession(e, spreadsheet);
      case 'addStudySession':
        return handleAddStudySession(e, spreadsheet);
      case 'saveCompleteStudySession':
        return handleSaveCompleteStudySession(e, spreadsheet);
      case 'updateAchievement':
        return handleUpdateAchievement(e, spreadsheet);
      case 'updateSetting':
        return handleUpdateSetting(e, spreadsheet);
      case 'addUserStat':
        return handleAddUserStat(e, spreadsheet);
      case 'addCategory':
        return handleAddCategory(e, spreadsheet);
      case 'addSubject':
        return handleAddSubject(e, spreadsheet);
      case 'update':
        return handleUpdate(e, spreadsheet);
      default:
        console.error('Unknown action:', action);
        return createErrorResponse('Unknown action: ' + action);
    }
    
  } catch (error) {
    console.error('Error in doPost:', error);
    return createErrorResponse('Server error: ' + error.toString());
  }
}

/**
 * Main entry point for GET requests from web app
 */
function doGet(e) {
  try {
    console.log('GET request received:', JSON.stringify(e?.parameter || {}, null, 2));
    
    if (!e || !e.parameter) {
      console.error('Event object or parameters missing');
      return createErrorResponse('Missing request parameters');
    }
    
    const action = e.parameter.action || 'getTasks';
    const spreadsheetId = e.parameter.spreadsheetId;
    
    if (!spreadsheetId) {
      console.error('Missing spreadsheetId parameter');
      return createErrorResponse('Missing spreadsheetId parameter');
    }
    
    let spreadsheet;
    try {
      spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    } catch (spreadsheetError) {
      console.error('Failed to open spreadsheet:', spreadsheetError);
      return createErrorResponse('Failed to open spreadsheet: ' + spreadsheetError.toString());
    }
    
    console.log('Processing GET action:', action);
    
    switch (action) {
      case 'getTasks':
        return handleGetTasks(e, spreadsheet);
      case 'getStudyTasks':
        return handleGetStudyTasks(e, spreadsheet);
      case 'getSubjects':
        return handleGetSubjects(e, spreadsheet);
      case 'getCategories':
        return handleGetCategories(e, spreadsheet);
      case 'getCategoriesBySubject':
        return handleGetCategoriesBySubject(e, spreadsheet);
      case 'getAchievements':
        return handleGetAchievements(e, spreadsheet);
      case 'getPomodoroSessions':
        return handleGetPomodoroSessions(e, spreadsheet);
      case 'getStudySessions':
        return handleGetStudySessions(e, spreadsheet);
      case 'getTodayStats':
        return handleGetTodayStats(e, spreadsheet);
      case 'getRecentSessions':
        return handleGetRecentSessions(e, spreadsheet);
      case 'getSessionDetails':
        return handleGetSessionDetails(e, spreadsheet);
      case 'getSettings':
        return handleGetSettings(e, spreadsheet);
      case 'getUserStats':
        return handleGetUserStats(e, spreadsheet);
      case 'getAnalytics':
        return handleGetAnalytics(e, spreadsheet);
      case 'getAnalyticsData':
        return handleGetAnalytics(e, spreadsheet);
      case 'getCategory':
        return handleGetSingleCategory(e, spreadsheet);
      case 'getSubject':
        return handleGetSingleSubject(e, spreadsheet);
      case 'deleteCategory':
        return handleDeleteCategory(e, spreadsheet);
      case 'deleteSubject':
        return handleDeleteSubject(e, spreadsheet);
      default:
        console.error('Unknown GET action:', action);
        return createErrorResponse('Unknown action: ' + action);
    }
    
  } catch (error) {
    console.error('Error in doGet:', error);
    return createErrorResponse('Server error: ' + error.toString());
  }
}

/**
 * FIXED: Enhanced handleAddStudyTask with proper data validation
 * Expected data: [task_id, task_name, description, categories, correctly_completed, start_time, end_time, location, subject, session_id]
 */
function handleAddStudyTask(e, spreadsheet) {
  console.log('=== HANDLEADDSTUDYTASK START ===');
  console.log('Parameters received:', JSON.stringify(e.parameter, null, 2));
  
  let sheet = spreadsheet.getSheetByName(CONFIG.SHEETS.STUDY_TASKS);
  
  // Create StudyTasks sheet if it doesn't exist
  if (!sheet) {
    try {
      sheet = spreadsheet.insertSheet(CONFIG.SHEETS.STUDY_TASKS);
      const headers = [
        'task_id', 'task_name', 'description', 'categories', 'correctly_completed', 
        'start_time', 'end_time', 'location', 'subject', 'session_id'
      ];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      console.log('Created StudyTasks sheet with headers:', headers);
    } catch (sheetError) {
      console.error('Failed to create StudyTasks sheet:', sheetError);
      return createErrorResponse('Failed to create StudyTasks sheet: ' + sheetError.toString());
    }
  }
  
  // Parse the data with comprehensive error handling
  let data;
  try {
    const rawData = e.parameter.data;
    if (!rawData) {
      console.error('No data parameter provided');
      return createErrorResponse('No data parameter provided');
    }
    
    console.log('Raw data string:', rawData);
    console.log('Raw data type:', typeof rawData);
    
    if (typeof rawData === 'string') {
      data = JSON.parse(rawData);
    } else {
      data = rawData; // Already parsed
    }
    
    console.log('Parsed data:', JSON.stringify(data, null, 2));
    console.log('Data type:', typeof data);
    console.log('Is array:', Array.isArray(data));
    console.log('Data length:', data ? data.length : 'undefined');
    
  } catch (parseError) {
    console.error('JSON Parse Error:', parseError);
    return createErrorResponse('Failed to parse data: ' + parseError.toString());
  }
  
  // Validate data structure
  if (!Array.isArray(data)) {
    console.error('Data is not an array. Received type:', typeof data);
    return createErrorResponse('Data must be an array, received: ' + typeof data);
  }
  
  if (data.length < 5) {
    console.error('Insufficient data fields. Expected at least 5, received:', data.length);
    console.log('Received data:', data);
    return createErrorResponse(`Insufficient data fields. Expected at least 5, received: ${data.length}`);
  }
  
  // Log each field for debugging
  console.log('=== FIELD ANALYSIS ===');
  const fieldNames = ['task_id', 'task_name', 'description', 'categories', 'correctly_completed', 
                     'start_time', 'end_time', 'location', 'subject', 'session_id'];
  
  for (let i = 0; i < Math.max(data.length, fieldNames.length); i++) {
    console.log(`Field ${i} (${fieldNames[i] || 'unknown'}):`, data[i], 'Type:', typeof data[i]);
  }
  
  // Ensure we have exactly 10 fields
  const originalLength = data.length;
  while (data.length < 10) {
    data.push('');
  }
  
  if (data.length !== originalLength) {
    console.log('Padded data from', originalLength, 'to', data.length, 'fields');
  }
  
  // Generate task_id if not provided
  if (!data[0] || data[0] === '') {
    data[0] = generateTaskId();
    console.log('Generated new task_id:', data[0]);
  }
  
  // Add timestamps if not provided
  const now = new Date().toISOString();
  if (!data[5] || data[5] === '') {
    data[5] = now;
    console.log('Generated start_time:', data[5]);
  }
  if (!data[6] || data[6] === '') {
    data[6] = now;
    console.log('Generated end_time:', data[6]);
  }
  
  // Enhanced boolean conversion for correctly_completed
  const originalCorrectness = data[4];
  console.log('=== BOOLEAN CONVERSION ANALYSIS ===');
  console.log('Original correctly_completed value:', originalCorrectness);
  console.log('Original type:', typeof originalCorrectness);
  
  let convertedCorrectness = convertCorrectnessValue(originalCorrectness);
  data[4] = convertedCorrectness;
  console.log('Final correctly_completed value:', data[4]);
  console.log('Final type:', typeof data[4]);
  
  // Validate categories field (common issue)
  if (!data[3] || data[3] === '') {
    console.warn('Categories field is empty - this might cause frontend issues');
  } else {
    console.log('Categories field populated:', data[3]);
  }
  
  // Final validation
  console.log('=== FINAL DATA VALIDATION ===');
  console.log('Complete data array:', JSON.stringify(data, null, 2));
  
  const requiredFields = ['task_id', 'task_name'];
  for (let i = 0; i < requiredFields.length; i++) {
    if (!data[i] || data[i] === '') {
      console.error(`Required field ${requiredFields[i]} is empty`);
      return createErrorResponse(`Required field ${requiredFields[i]} is empty`);
    }
  }
  
  // Add task to sheet
  try {
    sheet.appendRow(data);
    console.log('Successfully added row to StudyTasks sheet');
  } catch (sheetError) {
    console.error('Error adding row to sheet:', sheetError);
    return createErrorResponse('Failed to add row to sheet: ' + sheetError.toString());
  }
  
  // Update daily stats
  try {
    updateDailyStats(spreadsheet);
    console.log('Daily stats updated successfully');
  } catch (statsError) {
    console.warn('Failed to update daily stats:', statsError);
    // Don't fail the request if stats update fails
  }
  
  console.log('=== HANDLEADDSTUDYTASK SUCCESS ===');
  console.log('Study task added successfully with ID:', data[0]);
  
  return createSuccessResponse({
    message: 'Study task added successfully',
    taskId: data[0],
    originalCorrectness: originalCorrectness,
    convertedCorrectness: convertedCorrectness,
    categories: data[3],
    debugInfo: {
      originalDataLength: originalLength,
      finalDataLength: data.length,
      allFieldsPopulated: data.every(field => field !== ''),
      timestamp: now
    }
  });
}

/**
 * FIXED: Enhanced correctness conversion function
 */
function convertCorrectnessValue(value) {
  console.log('Converting correctness value:', value, 'Type:', typeof value);
  
  // Handle boolean values
  if (typeof value === 'boolean') {
    const result = value ? 'Yes' : 'No';
    console.log('Boolean conversion:', value, '→', result);
    return result;
  }
  
  // Handle string values
  if (typeof value === 'string') {
    const lowerValue = value.toLowerCase().trim();
    console.log('String conversion, lowercase trimmed:', lowerValue);
    
    // Positive values
    if (lowerValue === 'true' || lowerValue === 'yes' || 
        lowerValue === 'poprawnie' || lowerValue === 'dobrze' || 
        lowerValue === 'correct' || lowerValue === '1') {
      console.log('String represents positive → "Yes"');
      return 'Yes';
    }
    
    // Negative values
    if (lowerValue === 'false' || lowerValue === 'no' || 
        lowerValue === 'błędnie' || lowerValue === 'źle' || 
        lowerValue === 'incorrect' || lowerValue === '0') {
      console.log('String represents negative → "No"');
      return 'No';
    }
    
    // Already correct format
    if (lowerValue === 'yes') {
      console.log('Already "Yes" format');
      return 'Yes';
    }
    if (lowerValue === 'no') {
      console.log('Already "No" format');
      return 'No';
    }
    
    // Unknown string value
    console.log('Unknown string value, defaulting to "No"');
    return 'No';
  }
  
  // Handle number values
  if (typeof value === 'number') {
    const result = value > 0 ? 'Yes' : 'No';
    console.log('Number conversion:', value, '→', result);
    return result;
  }
  
  // Handle null/undefined
  if (value === null || value === undefined) {
    console.log('Null/undefined value, defaulting to "No"');
    return 'No';
  }
  
  // Fallback for any other type
  console.log('Unknown data type, defaulting to "No"');
  return 'No';
}

/**
 * Enhanced: Get analytics data including study sessions and tasks
 */
function handleGetAnalytics(e, spreadsheet) {
  try {
    const tasksSheet = spreadsheet.getSheetByName(CONFIG.SHEETS.TASKS);
    const studyTasksSheet = spreadsheet.getSheetByName(CONFIG.SHEETS.STUDY_TASKS);
    const pomodoroSheet = spreadsheet.getSheetByName(CONFIG.SHEETS.POMODORO_SESSIONS);
    const studySessionsSheet = spreadsheet.getSheetByName(CONFIG.SHEETS.STUDY_SESSIONS);
    
    let analytics = {
      totalTasks: 0,
      correctTasks: 0,
      totalPoints: 0,
      totalSessions: 0,
      totalStudyTime: 0,
      studySessions: 0,
      studySessionTime: 0,
      studyTasksCount: 0,
      subjectStats: {},
      categoryStats: {},
      recentTasks: [],
      weeklyProgress: []
    };
    
    // Analyze study tasks from StudyTasks sheet
    if (studyTasksSheet) {
      try {
        const studyTaskRange = studyTasksSheet.getRange(CONFIG.RANGES.STUDY_TASKS);
        const studyTaskValues = studyTaskRange.getValues();
        
        if (studyTaskValues.length > 1) {
          const studyTaskHeaders = studyTaskValues[0];
          const studyTasks = studyTaskValues.slice(1).filter(row => row[0]);
          
          analytics.studyTasksCount = studyTasks.length;
          analytics.totalTasks += studyTasks.length;
          
          studyTasks.forEach(row => {
            const correctnessIndex = studyTaskHeaders.indexOf('correctly_completed');
            const subjectIndex = studyTaskHeaders.indexOf('subject');
            const categoriesIndex = studyTaskHeaders.indexOf('categories');
            
            if (row[correctnessIndex] === 'Yes' || row[correctnessIndex] === true) {
              analytics.correctTasks++;
            }
            
            const subject = row[subjectIndex];
            const categories = row[categoriesIndex];
            
            if (subject) {
              analytics.subjectStats[subject] = (analytics.subjectStats[subject] || 0) + 1;
            }
            
            // FIXED: Enhanced categories processing with better error handling
            if (categories) {
              try {
                let categoriesStr = categories;
                
                // Convert to string if it's not already a string
                if (typeof categories !== 'string') {
                  if (typeof categories === 'number') {
                    categoriesStr = categories.toString();
                  } else if (categories && typeof categories === 'object') {
                    categoriesStr = categories.toString();
                  } else {
                    categoriesStr = String(categories);
                  }
                }
                
                // Handle edge cases
                if (!categoriesStr || categoriesStr === 'null' || categoriesStr === 'undefined' || categoriesStr === '[object Object]') {
                  categoriesStr = 'Unknown';
                }
                
                // Split and process categories
                categoriesStr.split(',').forEach(cat => {
                  const category = cat.trim();
                  if (category) {
                    analytics.categoryStats[category] = (analytics.categoryStats[category] || 0) + 1;
                  }
                });
              } catch (categoryError) {
                console.warn('Error processing categories for task:', categoryError);
                // Fallback: treat as single category
                analytics.categoryStats['Unknown'] = (analytics.categoryStats['Unknown'] || 0) + 1;
              }
            }
          });
        }
      } catch (error) {
        console.error('Error analyzing study tasks sheet:', error);
      }
    }
    
    // Analyze Pomodoro sessions
    if (pomodoroSheet) {
      try {
        const pomodoroRange = pomodoroSheet.getRange(CONFIG.RANGES.POMODORO_SESSIONS);
        const pomodoroValues = pomodoroRange.getValues();
        
        if (pomodoroValues.length > 1) {
          const sessions = pomodoroValues.slice(1).filter(row => row[0]);
          analytics.totalSessions = sessions.length;
          
          analytics.totalStudyTime = sessions.reduce((sum, row) => {
            const durationIndex = 3;
            return sum + (Number(row[durationIndex]) || 0);
          }, 0);
        }
      } catch (error) {
        console.error('Error analyzing Pomodoro sessions sheet:', error);
      }
    }
    
    // Analyze Study sessions
    if (studySessionsSheet) {
      try {
        const studyRange = studySessionsSheet.getRange(CONFIG.RANGES.STUDY_SESSIONS);
        const studyValues = studyRange.getValues();
        
        if (studyValues.length > 1) {
          const sessions = studyValues.slice(1).filter(row => row[0]);
          analytics.studySessions = sessions.length;
          
          analytics.studySessionTime = sessions.reduce((sum, row) => {
            const durationIndex = 3;
            return sum + (Number(row[durationIndex]) || 0);
          }, 0);
        }
      } catch (error) {
        console.error('Error analyzing study sessions sheet:', error);
      }
    }
    
    // Calculate total points based on tasks and sessions
    analytics.totalPoints = analytics.totalTasks + (analytics.studySessions * 5);
    
    console.log('Enhanced analytics generated:', analytics);
    
    return createSuccessResponse(analytics);
    
  } catch (error) {
    console.error('Error generating analytics:', error);
    throw error;
  }
}

// ... [All other existing functions from the original script remain the same] ...

/**
 * Generate unique task ID
 */
function generateTaskId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `task_${timestamp}_${random}`;
}

/**
 * Generate unique session ID
 */
function generateSessionId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `session_${timestamp}_${random}`;
}

/**
 * Create success response
 */
function createSuccessResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify({
      success: true,
      data: data
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Create error response
 */
function createErrorResponse(error) {
  return ContentService
    .createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Add a new task to the StudyTasks sheet - Updated to use StudyTasks structure
 */
function handleAddTask(e, spreadsheet) {
  // Redirect to handleAddStudyTask for unified task handling
  return handleAddStudyTask(e, spreadsheet);
}

/**
 * Get study tasks with optional session filtering
 */
function handleGetStudyTasks(e, spreadsheet) {
  const sheet = spreadsheet.getSheetByName(CONFIG.SHEETS.STUDY_TASKS);
  if (!sheet) {
    return createSuccessResponse([]);
  }
  
  const sessionId = e.parameter.sessionId; // Optional session filter
  
  try {
    const range = sheet.getRange(CONFIG.RANGES.STUDY_TASKS);
    const values = range.getValues();
    
    if (values.length <= 1) {
      return createSuccessResponse([]);
    }
    
    // Skip header row and convert to objects
    const headers = values[0];
    const sessionIdIndex = headers.indexOf('session_id');
    
    let tasks = values.slice(1).map(row => {
      const task = {};
      headers.forEach((header, index) => {
        task[header] = row[index];
      });
      return task;
    }).filter(task => task.task_id); // Filter out empty rows
    
    // Apply session filter if provided
    if (sessionId && sessionIdIndex >= 0) {
      tasks = tasks.filter(task => task.session_id === sessionId);
      console.log(`Retrieved ${tasks.length} study tasks for session: ${sessionId}`);
    } else {
      console.log(`Retrieved ${tasks.length} study tasks (all)`);
    }
    
    return createSuccessResponse(tasks);
    
  } catch (error) {
    console.error('Error getting study tasks:', error);
    return createErrorResponse(error.toString());
  }
}

/**
 * Get all tasks from StudyTasks sheet
 */
function handleGetTasks(e, spreadsheet) {
  // Redirect to handleGetStudyTasks for unified task handling
  return handleGetStudyTasks(e, spreadsheet);
}

/**
 * Get all subjects with new structure
 */
function handleGetSubjects(e, spreadsheet) {
  let sheet = spreadsheet.getSheetByName(CONFIG.SHEETS.SUBJECTS);
  if (!sheet) {
    return createSuccessResponse(getDefaultSubjects());
  }
  
  try {
    const range = sheet.getRange(CONFIG.RANGES.SUBJECTS);
    const values = range.getValues();
    
    if (values.length <= 1) {
      return createSuccessResponse(getDefaultSubjects());
    }
    
    const headers = values[0];
    const subjects = values.slice(1).map(row => {
      const subject = {};
      headers.forEach((header, index) => {
        subject[header] = row[index];
      });
      return subject;
    }).filter(subject => subject.subject_name && subject.active !== false);
    
    console.log(`Retrieved ${subjects.length} subjects`);
    
    return createSuccessResponse(subjects);
    
  } catch (error) {
    console.error('Error getting subjects:', error);
    return createSuccessResponse(getDefaultSubjects());
  }
}

/**
 * Get all categories with new structure
 */
function handleGetCategories(e, spreadsheet) {
  let sheet = spreadsheet.getSheetByName(CONFIG.SHEETS.CATEGORIES);
  if (!sheet) {
    return createSuccessResponse(getDefaultCategories());
  }
  
  try {
    const range = sheet.getRange(CONFIG.RANGES.CATEGORIES);
    const values = range.getValues();
    
    if (values.length <= 1) {
      return createSuccessResponse(getDefaultCategories());
    }
    
    const headers = values[0];
    const categories = values.slice(1).map(row => {
      const category = {};
      headers.forEach((header, index) => {
        category[header] = row[index];
      });
      return category;
    }).filter(category => category.category_name && category.active !== false);
    
    console.log(`Retrieved ${categories.length} categories`);
    
    return createSuccessResponse(categories);
    
  } catch (error) {
    console.error('Error getting categories:', error);
    return createSuccessResponse(getDefaultCategories());
  }
}

/**
 * Get categories filtered by subject
 */
function handleGetCategoriesBySubject(e, spreadsheet) {
  const subjectFilter = e.parameter.subject;
  
  const sheet = spreadsheet.getSheetByName(CONFIG.SHEETS.CATEGORIES);
  if (!sheet) {
    return createSuccessResponse([]);
  }
  
  try {
    const range = sheet.getRange(CONFIG.RANGES.CATEGORIES);
    const values = range.getValues();
    
    if (values.length <= 1) {
      return createSuccessResponse([]);
    }
    
    const headers = values[0];
    const categories = values.slice(1).map(row => {
      const category = {};
      headers.forEach((header, index) => {
        category[header] = row[index];
      });
      return category;
    }).filter(category => {
      const hasName = category.category_name;
      const isActive = category.active !== false;
      const matchesSubject = !subjectFilter || category.subject_name === subjectFilter;
      return hasName && isActive && matchesSubject;
    });
    
    console.log(`Retrieved ${categories.length} categories for subject: ${subjectFilter}`);
    
    return createSuccessResponse(categories);
    
  } catch (error) {
    console.error('Error getting categories by subject:', error);
    return createSuccessResponse([]);
  }
}

/**
 * Get single category
 */
function handleGetSingleCategory(e, spreadsheet) {
  const categoryName = e.parameter.name || e.parameter.id;
  const categories = handleGetCategories(e, spreadsheet);
  
  if (categories.success && categories.data) {
    const category = categories.data.find(cat => cat.category_name === categoryName);
    
    if (category) {
      return createSuccessResponse(category);
    }
  }
  
  throw new Error('Category not found: ' + categoryName);
}

/**
 * Get single subject
 */
function handleGetSingleSubject(e, spreadsheet) {
  const subjectName = e.parameter.name || e.parameter.id;
  const subjects = handleGetSubjects(e, spreadsheet);
  
  if (subjects.success && subjects.data) {
    const subject = subjects.data.find(subj => subj.subject_name === subjectName);
    
    if (subject) {
      return createSuccessResponse(subject);
    }
  }
  
  throw new Error('Subject not found: ' + subjectName);
}

/**
 * Delete category (mark as inactive)
 */
function handleDeleteCategory(e, spreadsheet) {
  const categoryName = e.parameter.name || e.parameter.id;
  const sheet = spreadsheet.getSheetByName(CONFIG.SHEETS.CATEGORIES);
  if (!sheet) {
    throw new Error('Categories sheet not found');
  }
  
  const range = sheet.getRange(CONFIG.RANGES.CATEGORIES);
  const values = range.getValues();
  
  if (values.length <= 1) {
    throw new Error('No categories data found');
  }
  
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === categoryName) {
      values[i][3] = false;
      range.setValues(values);
      return createSuccessResponse({ message: 'Category deleted successfully' });
    }
  }
  
  throw new Error('Category not found: ' + categoryName);
}

/**
 * Delete subject (mark as inactive)
 */
function handleDeleteSubject(e, spreadsheet) {
  const subjectName = e.parameter.name || e.parameter.id;
  const sheet = spreadsheet.getSheetByName(CONFIG.SHEETS.SUBJECTS);
  if (!sheet) {
    throw new Error('Subjects sheet not found');
  }
  
  const range = sheet.getRange(CONFIG.RANGES.SUBJECTS);
  const values = range.getValues();
  
  if (values.length <= 1) {
    throw new Error('No subjects data found');
  }
  
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === subjectName) {
      values[i][3] = false;
      range.setValues(values);
      return createSuccessResponse({ message: 'Subject deleted successfully' });
    }
  }
  
  throw new Error('Subject not found: ' + subjectName);
}

/**
 * Enhanced: Add a new study session to the StudySessions sheet
 */
function handleAddStudySession(e, spreadsheet) {
  let sheet = spreadsheet.getSheetByName(CONFIG.SHEETS.STUDY_SESSIONS);
  
  // Create StudySessions sheet if it doesn't exist
  if (!sheet) {
    sheet = spreadsheet.insertSheet(CONFIG.SHEETS.STUDY_SESSIONS);
    const headers = ['session_id', 'start_time', 'end_time', 'duration_minutes', 'total_tasks', 'correct_tasks', 'accuracy_percentage', 'notes'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    console.log('Created StudySessions sheet with headers');
  }
  
  const data = JSON.parse(e.parameter.data || '[]');
  console.log('Adding study session:', data);
  
  // Validate data - expecting 8 fields
  if (!Array.isArray(data) || data.length < 5) {
    throw new Error('Invalid study session data format - expected at least 5 fields');
  }
  
  // Ensure we have 8 fields and generate missing values
  while (data.length < 8) {
    if (data.length === 6) {
      // Calculate accuracy percentage if missing
      const accuracy = data[4] > 0 ? Math.round((data[5] || 0) / data[4] * 100) : 0;
      data.push(accuracy);
    } else {
      data.push('');
    }
  }
  
  // Generate session ID if not provided
  if (!data[0]) {
    data[0] = generateSessionId();
  }
  
  // Add timestamps if not provided
  if (!data[1]) data[1] = new Date().toISOString(); // start_time
  if (!data[2]) data[2] = new Date().toISOString(); // end_time
  
  // Add session to sheet
  sheet.appendRow(data);
  
  // Update daily stats
  updateDailyStats(spreadsheet);
  
  return createSuccessResponse({
    message: 'Study session added successfully',
    sessionId: data[0]
  });
}

/**
 * Enhanced: Get all study sessions with better error handling
 */
function handleGetStudySessions(e, spreadsheet) {
  const sheet = spreadsheet.getSheetByName(CONFIG.SHEETS.STUDY_SESSIONS);
  if (!sheet) {
    return createSuccessResponse([]);
  }
  
  try {
    const range = sheet.getRange(CONFIG.RANGES.STUDY_SESSIONS);
    const values = range.getValues();
    
    if (values.length <= 1) {
      return createSuccessResponse([]);
    }
    
    // Skip header row and convert to objects
    const headers = values[0];
    const sessions = values.slice(1).map(row => {
      const session = {};
      headers.forEach((header, index) => {
        session[header] = row[index];
      });
      return session;
    }).filter(session => session.session_id); // Filter out empty rows
    
    // Sort by start_time descending (newest first)
    sessions.sort((a, b) => {
      const dateA = new Date(a.start_time || 0);
      const dateB = new Date(b.start_time || 0);
      return dateB - dateA;
    });
    
    console.log(`Retrieved ${sessions.length} study sessions`);
    
    return createSuccessResponse(sessions);
    
  } catch (error) {
    console.error('Error getting study sessions:', error);
    return createErrorResponse(error.toString());
  }
}

/**
 * Enhanced: Get detailed session information including associated tasks
 */
function handleGetSessionDetails(e, spreadsheet) {
  const sessionId = e.parameter.sessionId;
  if (!sessionId) {
    throw new Error('Missing sessionId parameter');
  }
  
  try {
    // Get session data
    const sessionResponse = handleGetStudySessions(e, spreadsheet);
    if (!sessionResponse.success) {
      throw new Error('Failed to get session data');
    }
    
    const sessionContent = JSON.parse(sessionResponse.getContent());
    const session = sessionContent.data.find(s => s.session_id === sessionId);
    if (!session) {
      throw new Error('Session not found: ' + sessionId);
    }
    
    // Get associated tasks using the same event object but with sessionId
    const taskEvent = {
      parameter: {
        ...e.parameter,
        sessionId: sessionId
      }
    };
    
    const tasksResponse = handleGetStudyTasks(taskEvent, spreadsheet);
    const tasksContent = JSON.parse(tasksResponse.getContent());
    const tasks = tasksContent.success ? tasksContent.data : [];
    
    const sessionDetails = {
      session: session,
      tasks: tasks,
      tasksCount: tasks.length,
      correctTasks: tasks.filter(t => 
        t.correctly_completed === 'Yes' || 
        t.correctly_completed === true || 
        t.correctly_completed === 'Poprawnie'
      ).length
    };
    
    console.log(`Retrieved session details for ${sessionId}: ${tasks.length} tasks`);
    
    return createSuccessResponse(sessionDetails);
    
  } catch (error) {
    console.error('Error getting session details:', error);
    return createErrorResponse(error.toString());
  }
}

/**
 * Default subjects with new structure
 */
function getDefaultSubjects() {
  return [
    { subject_name: 'Matematyka', color: '#FF6B6B', icon: '📐', active: true },
    { subject_name: 'Polski', color: '#4ECDC4', icon: '📝', active: true },
    { subject_name: 'Angielski', color: '#45B7D1', icon: '🇬🇧', active: true },
    { subject_name: 'Historia', color: '#F7B731', icon: '📚', active: true },
    { subject_name: 'Study Session', color: '#10b981', icon: '🎯', active: true }
  ];
}

/**
 * Default categories with new structure
 */
function getDefaultCategories() {
  return [
    { category_name: 'Algebra', subject_name: 'Matematyka', difficulty: 'Średni', active: true },
    { category_name: 'Geometria', subject_name: 'Matematyka', difficulty: 'Trudny', active: true },
    { category_name: 'Części mowy', subject_name: 'Polski', difficulty: 'Łatwy', active: true },
    { category_name: 'Składnia', subject_name: 'Polski', difficulty: 'Trudny', active: true },
    { category_name: 'Grammar', subject_name: 'Angielski', difficulty: 'Średni', active: true },
    { category_name: 'Vocabulary', subject_name: 'Angielski', difficulty: 'Łatwy', active: true },
    { category_name: 'Study Session', subject_name: 'Study Session', difficulty: 'Średni', active: true }
  ];
}

// Placeholder functions for missing handlers - you can implement these based on your original script
function handleAddCategory(e, spreadsheet) {
  // Implementation from original script
  return createSuccessResponse({ message: 'Category handling not fully implemented' });
}

function handleAddSubject(e, spreadsheet) {
  // Implementation from original script  
  return createSuccessResponse({ message: 'Subject handling not fully implemented' });
}

function handleUpdate(e, spreadsheet) {
  // Implementation from original script
  return createSuccessResponse({ message: 'Update handling not fully implemented' });
}

function handleAddPomodoroSession(e, spreadsheet) {
  // Implementation from original script
  return createSuccessResponse({ message: 'Pomodoro session handling not fully implemented' });
}

function handleGetAchievements(e, spreadsheet) {
  // Implementation from original script
  return createSuccessResponse([]);
}

function handleGetPomodoroSessions(e, spreadsheet) {
  // Implementation from original script
  return createSuccessResponse([]);
}

function handleGetUserStats(e, spreadsheet) {
  // Implementation from original script
  return createSuccessResponse([]);
}

function handleGetTodayStats(e, spreadsheet) {
  // Implementation from original script
  return createSuccessResponse({ sessions: 0, tasks: 0, accuracy: 0, studyTime: 0 });
}

function handleGetRecentSessions(e, spreadsheet) {
  // Implementation from original script
  return createSuccessResponse([]);
}

function handleGetSettings(e, spreadsheet) {
  // Implementation from original script
  return createSuccessResponse({});
}

function handleUpdateAchievement(e, spreadsheet) {
  // Implementation from original script
  return createSuccessResponse({ message: 'Achievement update not fully implemented' });
}

function handleUpdateSetting(e, spreadsheet) {
  // Implementation from original script
  return createSuccessResponse({ message: 'Settings update not fully implemented' });
}

function handleAddUserStat(e, spreadsheet) {
  // Implementation from original script
  return createSuccessResponse({ message: 'User stat handling not fully implemented' });
}

/**
 * Enhanced: Save complete study session with all tasks
 */
function handleSaveCompleteStudySession(e, spreadsheet) {
  console.log('=== SAVE COMPLETE STUDY SESSION START ===');
  
  try {
    const rawData = e.parameter.data;
    if (!rawData) {
      console.error('No data parameter provided');
      return createErrorResponse('No data parameter provided');
    }
    
    let data;
    try {
      data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
    } catch (parseError) {
      console.error('Failed to parse session data:', parseError);
      return createErrorResponse('Failed to parse session data: ' + parseError.toString());
    }
    
    console.log('Session data received:', JSON.stringify(data, null, 2));
    
    if (!data.sessionData || !data.tasks) {
      console.error('Missing sessionData or tasks in request');
      return createErrorResponse('Missing sessionData or tasks in request');
    }
    
    const sessionId = data.sessionData.session_id || generateSessionId();
    console.log('Processing session:', sessionId);
    
    // Save session to StudySessions sheet
    console.log('Saving session data...');
    const sessionResult = saveSessionToSheet(spreadsheet, {
      ...data.sessionData,
      session_id: sessionId
    });
    
    if (!sessionResult.success) {
      console.error('Failed to save session:', sessionResult.error);
      return createErrorResponse('Failed to save session: ' + sessionResult.error);
    }
    
    // Save all tasks to StudyTasks sheet
    console.log('Saving', data.tasks.length, 'tasks...');
    const tasksResults = [];
    
    for (let i = 0; i < data.tasks.length; i++) {
      const task = {
        ...data.tasks[i],
        session_id: sessionId,
        task_order: i + 1
      };
      
      console.log(`Saving task ${i + 1}:`, JSON.stringify(task, null, 2));
      
      // Convert task to array format
      const taskArray = [
        task.task_id || generateTaskId(),
        task.task_name || '',
        task.description || '',
        task.categories || '',
        task.correctly_completed || 'No',
        task.start_time || new Date().toISOString(),
        task.end_time || new Date().toISOString(),
        task.location || '',
        task.subject || '',
        sessionId
      ];
      
      // Create fake event for handleAddStudyTask
      const taskEvent = {
        parameter: {
          action: 'addStudyTask',
          spreadsheetId: e.parameter.spreadsheetId,
          data: JSON.stringify(taskArray)
        }
      };
      
      try {
        const taskResult = handleAddStudyTask(taskEvent, spreadsheet);
        const taskResponse = JSON.parse(taskResult.getContent());
        
        if (taskResponse.success) {
          tasksResults.push({ 
            success: true, 
            taskId: taskResponse.taskId
          });
          console.log(`Task ${i + 1} saved successfully:`, taskResponse.taskId);
        } else {
          console.error(`Task ${i + 1} failed:`, taskResponse.error);
          tasksResults.push({ 
            success: false, 
            error: taskResponse.error 
          });
        }
      } catch (taskError) {
        console.error(`Error saving task ${i + 1}:`, taskError);
        tasksResults.push({ 
          success: false, 
          error: taskError.toString() 
        });
      }
    }
    
    const successfulTasks = tasksResults.filter(r => r.success).length;
    console.log(`Session saved with ${successfulTasks}/${data.tasks.length} tasks successful`);
    
    return createSuccessResponse({
      message: 'Complete study session saved',
      sessionId: sessionId,
      totalTasks: data.tasks.length,
      successfulTasks: successfulTasks,
      sessionResult: sessionResult,
      tasksResults: tasksResults
    });
    
  } catch (error) {
    console.error('Error saving complete study session:', error);
    return createErrorResponse('Error saving complete study session: ' + error.toString());
  }
}

/**
 * Save session data to StudySessions sheet
 */
function saveSessionToSheet(spreadsheet, sessionData) {
  console.log('Saving session to sheet:', JSON.stringify(sessionData, null, 2));
  
  let sheet = spreadsheet.getSheetByName(CONFIG.SHEETS.STUDY_SESSIONS);
  
  if (!sheet) {
    try {
      sheet = spreadsheet.insertSheet(CONFIG.SHEETS.STUDY_SESSIONS);
      const headers = [
        'session_id', 'start_time', 'end_time', 'duration_minutes', 
        'total_tasks', 'correct_tasks', 'accuracy_percentage', 'notes'
      ];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      console.log('Created StudySessions sheet');
    } catch (sheetError) {
      console.error('Failed to create StudySessions sheet:', sheetError);
      return { success: false, error: sheetError.toString() };
    }
  }
  
  const sessionId = sessionData.session_id || generateSessionId();
  
  const sessionRow = [
    sessionId,
    sessionData.start_time || new Date().toISOString(),
    sessionData.end_time || new Date().toISOString(),
    sessionData.duration_minutes || 0,
    sessionData.total_tasks || 0,
    sessionData.correct_tasks || 0,
    sessionData.accuracy_percentage || 0,
    sessionData.notes || ''
  ];
  
  try {
    sheet.appendRow(sessionRow);
    console.log('Session saved to sheet:', sessionId);
    return { success: true, sessionId: sessionId };
  } catch (error) {
    console.error('Failed to save session to sheet:', error);
    return { success: false, error: error.toString() };
  }
}

function updateDailyStats(spreadsheet) {
  // Implementation from original script - placeholder
  console.log('Daily stats update - placeholder implementation');
}
