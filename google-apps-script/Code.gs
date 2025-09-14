/**
 * StudyFlow Google Apps Script
 * Handles all data operations between the web app and Google Sheets
 * Version: 2.0
 */

// Configuration
const CONFIG = {
  SHEETS: {
    TASKS: 'Tasks',
    SUBJECTS: 'Subjects', 
    CATEGORIES: 'Categories',
    ACHIEVEMENTS: 'Achievements',
    POMODORO_SESSIONS: 'Pomodoro_Sessions',
    SETTINGS: 'Settings',
    USER_STATS: 'User_Stats'
  },
  RANGES: {
    TASKS: 'A:G',
    SUBJECTS: 'A:D',
    CATEGORIES: 'A:D', 
    ACHIEVEMENTS: 'A:I',
    POMODORO_SESSIONS: 'A:H',
    SETTINGS: 'A:D',
    USER_STATS: 'A:F'
  }
};

/**
 * Main entry point for POST requests from web app
 */
function doPost(e) {
  try {
    console.log('POST request received:', e);
    
    // Handle case where e or e.parameter might be undefined
    if (!e || !e.parameter) {
      console.log('Event object or parameters missing:', e);
      return createErrorResponse('Missing request parameters');
    }
    
    console.log('Parameters:', e.parameter);
    
    const action = e.parameter.action || 'addTask';
    const spreadsheetId = e.parameter.spreadsheetId;
    
    if (!spreadsheetId) {
      throw new Error('Missing spreadsheetId parameter');
    }
    
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    
    switch (action) {
      case 'addTask':
        return handleAddTask(e, spreadsheet);
      case 'addPomodoroSession':
        return handleAddPomodoroSession(e, spreadsheet);
      case 'updateAchievement':
        return handleUpdateAchievement(e, spreadsheet);
      case 'updateSetting':
        return handleUpdateSetting(e, spreadsheet);
      case 'addUserStat':
        return handleAddUserStat(e, spreadsheet);
      default:
        throw new Error('Unknown action: ' + action);
    }
    
  } catch (error) {
    console.error('Error in doPost:', error);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Main entry point for GET requests from web app
 */
function doGet(e) {
  try {
    console.log('GET request received:', e);
    
    // Handle case where e or e.parameter might be undefined
    if (!e || !e.parameter) {
      console.log('Event object or parameters missing:', e);
      return createErrorResponse('Missing request parameters');
    }
    
    console.log('Parameters:', e.parameter);
    
    const action = e.parameter.action || 'getTasks';
    const spreadsheetId = e.parameter.spreadsheetId;
    
    if (!spreadsheetId) {
      throw new Error('Missing spreadsheetId parameter');
    }
    
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    
    switch (action) {
      case 'getTasks':
        return handleGetTasks(e, spreadsheet);
      case 'getSubjects':
        return handleGetSubjects(e, spreadsheet);
      case 'getCategories':
        return handleGetCategories(e, spreadsheet);
      case 'getAchievements':
        return handleGetAchievements(e, spreadsheet);
      case 'getPomodoroSessions':
        return handleGetPomodoroSessions(e, spreadsheet);
      case 'getSettings':
        return handleGetSettings(e, spreadsheet);
      case 'getUserStats':
        return handleGetUserStats(e, spreadsheet);
      case 'getAnalytics':
        return handleGetAnalytics(e, spreadsheet);
      default:
        throw new Error('Unknown action: ' + action);
    }
    
  } catch (error) {
    console.error('Error in doGet:', error);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Add a new task to the Tasks sheet
 */
function handleAddTask(e, spreadsheet) {
  const sheet = spreadsheet.getSheetByName(CONFIG.SHEETS.TASKS);
  if (!sheet) {
    throw new Error('Tasks sheet not found');
  }
  
  const data = JSON.parse(e.parameter.data || '[]');
  console.log('Adding task:', data);
  
  // Validate data
  if (!Array.isArray(data) || data.length < 6) {
    throw new Error('Invalid task data format');
  }
  
  // Add task to sheet
  sheet.appendRow(data);
  
  // Update daily stats
  updateDailyStats(spreadsheet);
  
  return ContentService
    .createTextOutput(JSON.stringify({
      success: true,
      message: 'Task added successfully'
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Add a Pomodoro session
 */
function handleAddPomodoroSession(e, spreadsheet) {
  const sheet = spreadsheet.getSheetByName(CONFIG.SHEETS.POMODORO_SESSIONS);
  if (!sheet) {
    throw new Error('Pomodoro_Sessions sheet not found');
  }
  
  const data = JSON.parse(e.parameter.data || '[]');
  console.log('Adding Pomodoro session:', data);
  
  sheet.appendRow(data);
  
  // Update daily stats
  updateDailyStats(spreadsheet);
  
  return ContentService
    .createTextOutput(JSON.stringify({
      success: true,
      message: 'Pomodoro session added successfully'
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Get all tasks
 */
function handleGetTasks(e, spreadsheet) {
  const sheet = spreadsheet.getSheetByName(CONFIG.SHEETS.TASKS);
  if (!sheet) {
    throw new Error('Tasks sheet not found');
  }
  
  const range = sheet.getRange(CONFIG.RANGES.TASKS);
  const values = range.getValues();
  
  if (values.length <= 1) {
    return createSuccessResponse([]);
  }
  
  // Skip header row and convert to objects
  const headers = values[0];
  const tasks = values.slice(1).map(row => {
    const task = {};
    headers.forEach((header, index) => {
      task[header] = row[index];
    });
    return task;
  }).filter(task => task.task_name); // Filter out empty rows
  
  console.log(`Retrieved ${tasks.length} tasks`);
  
  return createSuccessResponse(tasks);
}

/**
 * Get all subjects
 */
function handleGetSubjects(e, spreadsheet) {
  const sheet = spreadsheet.getSheetByName(CONFIG.SHEETS.SUBJECTS);
  if (!sheet) {
    // Create default subjects if sheet doesn't exist
    return createSuccessResponse(getDefaultSubjects());
  }
  
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
}

/**
 * Get all categories
 */
function handleGetCategories(e, spreadsheet) {
  const sheet = spreadsheet.getSheetByName(CONFIG.SHEETS.CATEGORIES);
  if (!sheet) {
    return createSuccessResponse(getDefaultCategories());
  }
  
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
  
  const subjectFilter = e.parameter.subject;
  let filteredCategories = categories;
  
  if (subjectFilter) {
    filteredCategories = categories.filter(cat => cat.subject_name === subjectFilter);
  }
  
  console.log(`Retrieved ${filteredCategories.length} categories`);
  
  return createSuccessResponse(filteredCategories);
}

/**
 * Get all achievements
 */
function handleGetAchievements(e, spreadsheet) {
  const sheet = spreadsheet.getSheetByName(CONFIG.SHEETS.ACHIEVEMENTS);
  if (!sheet) {
    return createSuccessResponse(getDefaultAchievements());
  }
  
  const range = sheet.getRange(CONFIG.RANGES.ACHIEVEMENTS);
  const values = range.getValues();
  
  if (values.length <= 1) {
    return createSuccessResponse(getDefaultAchievements());
  }
  
  const headers = values[0];
  const achievements = values.slice(1).map(row => {
    const achievement = {};
    headers.forEach((header, index) => {
      achievement[header] = row[index];
    });
    return achievement;
  }).filter(achievement => achievement.achievement_id);
  
  console.log(`Retrieved ${achievements.length} achievements`);
  
  return createSuccessResponse(achievements);
}

/**
 * Get analytics data
 */
function handleGetAnalytics(e, spreadsheet) {
  try {
    const tasksSheet = spreadsheet.getSheetByName(CONFIG.SHEETS.TASKS);
    const pomodoroSheet = spreadsheet.getSheetByName(CONFIG.SHEETS.POMODORO_SESSIONS);
    
    let analytics = {
      totalTasks: 0,
      correctTasks: 0,
      totalPoints: 0,
      totalSessions: 0,
      totalStudyTime: 0,
      subjectStats: {},
      categoryStats: {},
      recentTasks: [],
      weeklyProgress: []
    };
    
    // Analyze tasks
    if (tasksSheet) {
      const taskRange = tasksSheet.getRange(CONFIG.RANGES.TASKS);
      const taskValues = taskRange.getValues();
      
      if (taskValues.length > 1) {
        const taskHeaders = taskValues[0];
        const tasks = taskValues.slice(1).filter(row => row[0]); // Filter non-empty rows
        
        analytics.totalTasks = tasks.length;
        analytics.correctTasks = tasks.filter(row => {
          const correctnessIndex = taskHeaders.indexOf('correctness');
          return row[correctnessIndex] === 'Poprawnie';
        }).length;
        
        analytics.totalPoints = tasks.reduce((sum, row) => {
          const pointsIndex = taskHeaders.indexOf('points');
          return sum + (Number(row[pointsIndex]) || 0);
        }, 0);
        
        // Subject and category stats
        tasks.forEach(row => {
          const subjectIndex = taskHeaders.indexOf('subject');
          const categoryIndex = taskHeaders.indexOf('category');
          const pointsIndex = taskHeaders.indexOf('points');
          
          const subject = row[subjectIndex];
          const category = row[categoryIndex];
          const points = Number(row[pointsIndex]) || 0;
          
          if (subject) {
            analytics.subjectStats[subject] = (analytics.subjectStats[subject] || 0) + points;
          }
          
          if (category) {
            analytics.categoryStats[category] = (analytics.categoryStats[category] || 0) + points;
          }
        });
        
        // Recent tasks (last 10)
        analytics.recentTasks = tasks.slice(-10).reverse();
      }
    }
    
    // Analyze Pomodoro sessions
    if (pomodoroSheet) {
      const pomodoroRange = pomodoroSheet.getRange(CONFIG.RANGES.POMODORO_SESSIONS);
      const pomodoroValues = pomodoroRange.getValues();
      
      if (pomodoroValues.length > 1) {
        const sessions = pomodoroValues.slice(1).filter(row => row[0]); // Filter non-empty rows
        analytics.totalSessions = sessions.length;
        
        analytics.totalStudyTime = sessions.reduce((sum, row) => {
          const durationIndex = 3; // duration_minutes column
          return sum + (Number(row[durationIndex]) || 0);
        }, 0);
      }
    }
    
    console.log('Analytics generated:', analytics);
    
    return createSuccessResponse(analytics);
    
  } catch (error) {
    console.error('Error generating analytics:', error);
    throw error;
  }
}

/**
 * Update achievement status
 */
function handleUpdateAchievement(e, spreadsheet) {
  const sheet = spreadsheet.getSheetByName(CONFIG.SHEETS.ACHIEVEMENTS);
  if (!sheet) {
    throw new Error('Achievements sheet not found');
  }
  
  const achievementId = e.parameter.achievementId;
  const unlocked = e.parameter.unlocked === 'true';
  const unlockDate = e.parameter.unlockDate;
  
  const range = sheet.getRange(CONFIG.RANGES.ACHIEVEMENTS);
  const values = range.getValues();
  
  if (values.length <= 1) {
    throw new Error('No achievements data found');
  }
  
  // Find achievement row
  const headers = values[0];
  const idIndex = headers.indexOf('achievement_id');
  const unlockedIndex = headers.indexOf('unlocked');
  const dateIndex = headers.indexOf('unlock_date');
  
  for (let i = 1; i < values.length; i++) {
    if (values[i][idIndex] === achievementId) {
      values[i][unlockedIndex] = unlocked;
      if (unlocked && unlockDate) {
        values[i][dateIndex] = new Date(unlockDate);
      }
      
      // Update the sheet
      range.setValues(values);
      
      return createSuccessResponse({
        message: 'Achievement updated successfully'
      });
    }
  }
  
  throw new Error('Achievement not found: ' + achievementId);
}

/**
 * Update daily statistics
 */
function updateDailyStats(spreadsheet) {
  try {
    const sheet = spreadsheet.getSheetByName(CONFIG.SHEETS.USER_STATS);
    if (!sheet) {
      console.log('User_Stats sheet not found, skipping stats update');
      return;
    }
    
    const today = new Date();
    const todayString = Utilities.formatDate(today, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    
    // Get current stats
    const range = sheet.getRange(CONFIG.RANGES.USER_STATS);
    const values = range.getValues();
    
    // Calculate today's stats from Tasks and Pomodoro sheets
    const todayStats = calculateTodayStats(spreadsheet, today);
    
    let updated = false;
    
    // Check if today's stats already exist
    if (values.length > 1) {
      const headers = values[0];
      const dateIndex = headers.indexOf('date');
      
      for (let i = 1; i < values.length; i++) {
        const rowDate = Utilities.formatDate(values[i][dateIndex], Session.getScriptTimeZone(), 'yyyy-MM-dd');
        if (rowDate === todayString) {
          // Update existing row
          values[i] = [
            values[i][dateIndex], // Keep original date
            todayStats.tasks_completed,
            todayStats.correct_tasks,
            todayStats.points_earned,
            todayStats.pomodoro_sessions,
            todayStats.study_time_minutes
          ];
          range.setValues(values);
          updated = true;
          break;
        }
      }
    }
    
    // Add new row if not updated
    if (!updated) {
      sheet.appendRow([
        today,
        todayStats.tasks_completed,
        todayStats.correct_tasks,
        todayStats.points_earned,
        todayStats.pomodoro_sessions,
        todayStats.study_time_minutes
      ]);
    }
    
    console.log('Daily stats updated:', todayStats);
    
  } catch (error) {
    console.error('Error updating daily stats:', error);
  }
}

/**
 * Calculate today's statistics
 */
function calculateTodayStats(spreadsheet, date) {
  const today = Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  
  let stats = {
    tasks_completed: 0,
    correct_tasks: 0,
    points_earned: 0,
    pomodoro_sessions: 0,
    study_time_minutes: 0
  };
  
  // Calculate task stats
  const tasksSheet = spreadsheet.getSheetByName(CONFIG.SHEETS.TASKS);
  if (tasksSheet) {
    const taskRange = tasksSheet.getRange(CONFIG.RANGES.TASKS);
    const taskValues = taskRange.getValues();
    
    if (taskValues.length > 1) {
      const headers = taskValues[0];
      const timestampIndex = headers.indexOf('timestamp');
      const correctnessIndex = headers.indexOf('correctness');
      const pointsIndex = headers.indexOf('points');
      
      taskValues.slice(1).forEach(row => {
        if (row[timestampIndex]) {
          const taskDate = Utilities.formatDate(new Date(row[timestampIndex]), Session.getScriptTimeZone(), 'yyyy-MM-dd');
          if (taskDate === today) {
            stats.tasks_completed++;
            if (row[correctnessIndex] === 'Poprawnie') {
              stats.correct_tasks++;
            }
            stats.points_earned += Number(row[pointsIndex]) || 0;
          }
        }
      });
    }
  }
  
  // Calculate Pomodoro stats
  const pomodoroSheet = spreadsheet.getSheetByName(CONFIG.SHEETS.POMODORO_SESSIONS);
  if (pomodoroSheet) {
    const pomodoroRange = pomodoroSheet.getRange(CONFIG.RANGES.POMODORO_SESSIONS);
    const pomodoroValues = pomodoroRange.getValues();
    
    if (pomodoroValues.length > 1) {
      pomodoroValues.slice(1).forEach(row => {
        if (row[1]) { // start_time
          const sessionDate = Utilities.formatDate(new Date(row[1]), Session.getScriptTimeZone(), 'yyyy-MM-dd');
          if (sessionDate === today) {
            stats.pomodoro_sessions++;
            stats.study_time_minutes += Number(row[3]) || 0; // duration_minutes
          }
        }
      });
    }
  }
  
  return stats;
}

/**
 * Default subjects if sheet is empty
 */
function getDefaultSubjects() {
  return [
    { subject_name: 'Matematyka', color: '#FF6B6B', icon: '📐', active: true },
    { subject_name: 'Polski', color: '#4ECDC4', icon: '📝', active: true },
    { subject_name: 'Angielski', color: '#45B7D1', icon: '🇬🇧', active: true },
    { subject_name: 'Historia', color: '#F7B731', icon: '📚', active: true }
  ];
}

/**
 * Default categories if sheet is empty
 */
function getDefaultCategories() {
  return [
    { category_name: 'Algebra', subject_name: 'Matematyka', difficulty: 'Średni', active: true },
    { category_name: 'Geometria', subject_name: 'Matematyka', difficulty: 'Trudny', active: true },
    { category_name: 'Części mowy', subject_name: 'Polski', difficulty: 'Łatwy', active: true },
    { category_name: 'Składnia', subject_name: 'Polski', difficulty: 'Trudny', active: true },
    { category_name: 'Grammar', subject_name: 'Angielski', difficulty: 'Średni', active: true },
    { category_name: 'Vocabulary', subject_name: 'Angielski', difficulty: 'Łatwy', active: true }
  ];
}

/**
 * Default achievements if sheet is empty
 */
function getDefaultAchievements() {
  return [
    { 
      achievement_id: 'first_task', 
      name: 'Pierwsze kroki', 
      description: 'Wykonaj pierwsze zadanie', 
      icon: '🎯', 
      type: 'tasks', 
      target_value: 1, 
      points_reward: 10, 
      unlocked: false,
      unlock_date: null
    },
    { 
      achievement_id: 'streak_7', 
      name: 'Tydzień pasma', 
      description: 'Utrzymaj passę przez 7 dni', 
      icon: '🔥', 
      type: 'streak', 
      target_value: 7, 
      points_reward: 50, 
      unlocked: false,
      unlock_date: null
    },
    { 
      achievement_id: 'pomodoro_10', 
      name: 'Skupiony', 
      description: 'Ukończ 10 sesji Pomodoro', 
      icon: '🍅', 
      type: 'pomodoro', 
      target_value: 10, 
      points_reward: 30, 
      unlocked: false,
      unlock_date: null
    }
  ];
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
 * Get settings
 */
function handleGetSettings(e, spreadsheet) {
  const sheet = spreadsheet.getSheetByName(CONFIG.SHEETS.SETTINGS);
  if (!sheet) {
    return createSuccessResponse(getDefaultSettings());
  }
  
  const range = sheet.getRange(CONFIG.RANGES.SETTINGS);
  const values = range.getValues();
  
  if (values.length <= 1) {
    return createSuccessResponse(getDefaultSettings());
  }
  
  const settings = {};
  values.slice(1).forEach(row => {
    if (row[0]) { // setting_key
      settings[row[0]] = {
        value: row[1],
        type: row[2] || 'string',
        description: row[3] || ''
      };
    }
  });
  
  return createSuccessResponse(settings);
}

/**
 * Default settings
 */
function getDefaultSettings() {
  return {
    exam_date: { value: '2024-06-15', type: 'date', description: 'Data egzaminu maturalnego' },
    exam_name: { value: 'Matura 2024', type: 'string', description: 'Nazwa egzaminu' },
    daily_goal: { value: '10', type: 'number', description: 'Dzienny cel zadań' },
    work_duration: { value: '25', type: 'number', description: 'Czas pracy Pomodoro (minuty)' },
    short_break: { value: '5', type: 'number', description: 'Krótka przerwa (minuty)' },
    long_break: { value: '15', type: 'number', description: 'Długa przerwa (minuty)' }
  };
}

/**
 * Test function for debugging - can be run manually
 */
function testDoGet() {
  console.log('Testing doGet function...');
  
  // Simulate GET request
  const testEvent = {
    parameter: {
      action: 'getSubjects',
      spreadsheetId: 'test_spreadsheet_id'
    }
  };
  
  try {
    const result = doGet(testEvent);
    console.log('Test doGet result:', result);
    return result;
  } catch (error) {
    console.error('Test doGet error:', error);
    return error;
  }
}

/**
 * Test function for doPost - can be run manually
 */
function testDoPost() {
  console.log('Testing doPost function...');
  
  // Simulate POST request
  const testEvent = {
    parameter: {
      action: 'addTask',
      spreadsheetId: 'test_spreadsheet_id',
      data: JSON.stringify(['Test Task', 'Test Category', 'Test Subject', 'Poprawnie', new Date().toISOString(), 5, ''])
    }
  };
  
  try {
    const result = doPost(testEvent);
    console.log('Test doPost result:', result);
    return result;
  } catch (error) {
    console.error('Test doPost error:', error);
    return error;
  }
}

/**
 * Test function with empty parameters - should handle gracefully
 */
function testEmptyParameters() {
  console.log('Testing with empty parameters...');
  
  try {
    // Test with undefined
    const result1 = doGet(undefined);
    console.log('Test with undefined result:', result1);
    
    // Test with empty object
    const result2 = doGet({});
    console.log('Test with empty object result:', result2);
    
    // Test with null parameter
    const result3 = doGet({ parameter: null });
    console.log('Test with null parameter result:', result3);
    
    return 'All empty parameter tests completed';
  } catch (error) {
    console.error('Empty parameter test error:', error);
    return error;
  }
}
