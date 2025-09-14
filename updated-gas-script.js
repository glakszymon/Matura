/**
 * StudyFlow Google Apps Script - Updated Version
 * Handles all data operations between the web app and Google Sheets
 * Version: 2.1 - Fixed parameter handling and added missing handlers
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
      case 'addCategory':
        return handleAddCategory(e, spreadsheet);
      case 'addSubject':
        return handleAddSubject(e, spreadsheet);
      case 'update':
        return handleUpdate(e, spreadsheet);
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
      case 'getCategoriesBySubject':
        return handleGetCategoriesBySubject(e, spreadsheet);
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
      case 'getAnalyticsData':
        return handleGetAnalytics(e, spreadsheet); // Alias for getAnalytics
      case 'getCategory':
        return handleGetSingleCategory(e, spreadsheet);
      case 'getSubject':
        return handleGetSingleSubject(e, spreadsheet);
      case 'deleteCategory':
        return handleDeleteCategory(e, spreadsheet);
      case 'deleteSubject':
        return handleDeleteSubject(e, spreadsheet);
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
 * Add a new category
 */
function handleAddCategory(e, spreadsheet) {
  const sheet = spreadsheet.getSheetByName(CONFIG.SHEETS.CATEGORIES);
  if (!sheet) {
    throw new Error('Categories sheet not found');
  }
  
  const data = JSON.parse(e.parameter.data || '[]');
  console.log('Adding category:', data);
  
  // Generate ID if not provided
  const timestamp = new Date().getTime();
  const categoryData = [
    `cat_${timestamp}`, // ID
    data[0] || '', // name
    data[1] || '', // description
    true // active
  ];
  
  sheet.appendRow(categoryData);
  
  return createSuccessResponse({
    message: 'Category added successfully',
    id: `cat_${timestamp}`
  });
}

/**
 * Add a new subject
 */
function handleAddSubject(e, spreadsheet) {
  const sheet = spreadsheet.getSheetByName(CONFIG.SHEETS.SUBJECTS);
  if (!sheet) {
    throw new Error('Subjects sheet not found');
  }
  
  const data = JSON.parse(e.parameter.data || '[]');
  console.log('Adding subject:', data);
  
  // Generate ID if not provided
  const timestamp = new Date().getTime();
  const subjectData = [
    `subj_${timestamp}`, // ID
    data[0] || '', // name
    data[1] || '', // description
    true // active
  ];
  
  sheet.appendRow(subjectData);
  
  return createSuccessResponse({
    message: 'Subject added successfully',
    id: `subj_${timestamp}`
  });
}

/**
 * Handle update operations
 */
function handleUpdate(e, spreadsheet) {
  const formType = e.parameter.formType;
  const itemId = e.parameter.itemId;
  
  switch (formType) {
    case 'category':
      return handleUpdateCategory(e, spreadsheet, itemId);
    case 'subject':
      return handleUpdateSubject(e, spreadsheet, itemId);
    default:
      throw new Error('Unknown update type: ' + formType);
  }
}

/**
 * Update a category
 */
function handleUpdateCategory(e, spreadsheet, categoryId) {
  const sheet = spreadsheet.getSheetByName(CONFIG.SHEETS.CATEGORIES);
  if (!sheet) {
    throw new Error('Categories sheet not found');
  }
  
  const data = JSON.parse(e.parameter.data || '[]');
  const range = sheet.getRange(CONFIG.RANGES.CATEGORIES);
  const values = range.getValues();
  
  if (values.length <= 1) {
    throw new Error('No categories data found');
  }
  
  // Find category row
  const headers = values[0];
  const idIndex = headers.indexOf('id') >= 0 ? headers.indexOf('id') : 0;
  
  for (let i = 1; i < values.length; i++) {
    if (values[i][idIndex] === categoryId) {
      values[i][1] = data[0] || ''; // name
      values[i][2] = data[1] || ''; // description
      
      range.setValues(values);
      return createSuccessResponse({ message: 'Category updated successfully' });
    }
  }
  
  throw new Error('Category not found: ' + categoryId);
}

/**
 * Update a subject
 */
function handleUpdateSubject(e, spreadsheet, subjectId) {
  const sheet = spreadsheet.getSheetByName(CONFIG.SHEETS.SUBJECTS);
  if (!sheet) {
    throw new Error('Subjects sheet not found');
  }
  
  const data = JSON.parse(e.parameter.data || '[]');
  const range = sheet.getRange(CONFIG.RANGES.SUBJECTS);
  const values = range.getValues();
  
  if (values.length <= 1) {
    throw new Error('No subjects data found');
  }
  
  // Find subject row
  const headers = values[0];
  const idIndex = headers.indexOf('id') >= 0 ? headers.indexOf('id') : 0;
  
  for (let i = 1; i < values.length; i++) {
    if (values[i][idIndex] === subjectId) {
      values[i][1] = data[0] || ''; // name
      values[i][2] = data[1] || ''; // description
      
      range.setValues(values);
      return createSuccessResponse({ message: 'Subject updated successfully' });
    }
  }
  
  throw new Error('Subject not found: ' + subjectId);
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
  
  // Generate session ID if not provided
  const sessionId = `pomo_${new Date().getTime()}`;
  const sessionData = [
    sessionId,
    data[4] || new Date().toISOString(), // start_time
    data[5] || new Date().toISOString(), // end_time
    data[2] || 25, // duration_minutes
    data[0] || '', // category
    data[1] || '', // subject
    data[3] || 0, // points_earned
    'completed' // status
  ];
  
  sheet.appendRow(sessionData);
  
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
  }).filter(task => task.task_name || task.nazwa); // Filter out empty rows
  
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
  }).filter(subject => (subject.subject_name || subject.name) && subject.active !== false);
  
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
  }).filter(category => (category.category_name || category.name) && category.active !== false);
  
  console.log(`Retrieved ${categories.length} categories`);
  
  return createSuccessResponse(categories);
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
    const hasName = category.category_name || category.name;
    const isActive = category.active !== false;
    const matchesSubject = !subjectFilter || category.subject_name === subjectFilter || category.subject === subjectFilter;
    return hasName && isActive && matchesSubject;
  });
  
  console.log(`Retrieved ${categories.length} categories for subject: ${subjectFilter}`);
  
  return createSuccessResponse(categories);
}


/**
 * Get single category
 */
function handleGetSingleCategory(e, spreadsheet) {
  const categoryId = e.parameter.id;
  const categories = handleGetCategories(e, spreadsheet);
  
  if (categories.success && categories.data) {
    const category = categories.data.find(cat => 
      cat.id === categoryId || cat.category_id === categoryId
    );
    
    if (category) {
      return createSuccessResponse(category);
    }
  }
  
  throw new Error('Category not found: ' + categoryId);
}

/**
 * Get single subject
 */
function handleGetSingleSubject(e, spreadsheet) {
  const subjectId = e.parameter.id;
  const subjects = handleGetSubjects(e, spreadsheet);
  
  if (subjects.success && subjects.data) {
    const subject = subjects.data.find(subj => 
      subj.id === subjectId || subj.subject_id === subjectId
    );
    
    if (subject) {
      return createSuccessResponse(subject);
    }
  }
  
  throw new Error('Subject not found: ' + subjectId);
}


/**
 * Delete category
 */
function handleDeleteCategory(e, spreadsheet) {
  const categoryId = e.parameter.id;
  const sheet = spreadsheet.getSheetByName(CONFIG.SHEETS.CATEGORIES);
  if (!sheet) {
    throw new Error('Categories sheet not found');
  }
  
  const range = sheet.getRange(CONFIG.RANGES.CATEGORIES);
  const values = range.getValues();
  
  if (values.length <= 1) {
    throw new Error('No categories data found');
  }
  
  // Find and mark as inactive instead of deleting
  const headers = values[0];
  const idIndex = headers.indexOf('id') >= 0 ? headers.indexOf('id') : 0;
  const activeIndex = headers.indexOf('active') >= 0 ? headers.indexOf('active') : 3;
  
  for (let i = 1; i < values.length; i++) {
    if (values[i][idIndex] === categoryId) {
      values[i][activeIndex] = false; // Mark as inactive
      range.setValues(values);
      return createSuccessResponse({ message: 'Category deleted successfully' });
    }
  }
  
  throw new Error('Category not found: ' + categoryId);
}

/**
 * Delete subject
 */
function handleDeleteSubject(e, spreadsheet) {
  const subjectId = e.parameter.id;
  const sheet = spreadsheet.getSheetByName(CONFIG.SHEETS.SUBJECTS);
  if (!sheet) {
    throw new Error('Subjects sheet not found');
  }
  
  const range = sheet.getRange(CONFIG.RANGES.SUBJECTS);
  const values = range.getValues();
  
  if (values.length <= 1) {
    throw new Error('No subjects data found');
  }
  
  // Find and mark as inactive instead of deleting
  const headers = values[0];
  const idIndex = headers.indexOf('id') >= 0 ? headers.indexOf('id') : 0;
  const activeIndex = headers.indexOf('active') >= 0 ? headers.indexOf('active') : 3;
  
  for (let i = 1; i < values.length; i++) {
    if (values[i][idIndex] === subjectId) {
      values[i][activeIndex] = false; // Mark as inactive
      range.setValues(values);
      return createSuccessResponse({ message: 'Subject deleted successfully' });
    }
  }
  
  throw new Error('Subject not found: ' + subjectId);
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
 * Get Pomodoro sessions
 */
function handleGetPomodoroSessions(e, spreadsheet) {
  const sheet = spreadsheet.getSheetByName(CONFIG.SHEETS.POMODORO_SESSIONS);
  if (!sheet) {
    return createSuccessResponse([]);
  }
  
  const range = sheet.getRange(CONFIG.RANGES.POMODORO_SESSIONS);
  const values = range.getValues();
  
  if (values.length <= 1) {
    return createSuccessResponse([]);
  }
  
  const headers = values[0];
  const sessions = values.slice(1).map(row => {
    const session = {};
    headers.forEach((header, index) => {
      session[header] = row[index];
    });
    return session;
  }).filter(session => session.session_id || session.id);
  
  console.log(`Retrieved ${sessions.length} Pomodoro sessions`);
  
  return createSuccessResponse(sessions);
}

/**
 * Get user stats
 */
function handleGetUserStats(e, spreadsheet) {
  const sheet = spreadsheet.getSheetByName(CONFIG.SHEETS.USER_STATS);
  if (!sheet) {
    return createSuccessResponse([]);
  }
  
  const range = sheet.getRange(CONFIG.RANGES.USER_STATS);
  const values = range.getValues();
  
  if (values.length <= 1) {
    return createSuccessResponse([]);
  }
  
  const headers = values[0];
  const stats = values.slice(1).map(row => {
    const stat = {};
    headers.forEach((header, index) => {
      stat[header] = row[index];
    });
    return stat;
  }).filter(stat => stat.date);
  
  console.log(`Retrieved ${stats.length} user stats`);
  
  return createSuccessResponse(stats);
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
    
    // Analyze tasks from Tasks sheet
    if (tasksSheet) {
      const taskRange = tasksSheet.getRange(CONFIG.RANGES.TASKS);
      const taskValues = taskRange.getValues();
      
      if (taskValues.length > 1) {
        const taskHeaders = taskValues[0];
        const tasks = taskValues.slice(1).filter(row => row[0]); // Filter non-empty rows
        
        analytics.totalTasks += tasks.length;
        
        tasks.forEach(row => {
          const correctnessIndex = taskHeaders.indexOf('correctness');
          const pointsIndex = taskHeaders.indexOf('points');
          const subjectIndex = taskHeaders.indexOf('subject');
          const categoryIndex = taskHeaders.indexOf('category');
          
          if (row[correctnessIndex] === 'Poprawnie' || row[correctnessIndex] === true) {
            analytics.correctTasks++;
          }
          
          const points = Number(row[pointsIndex]) || 0;
          analytics.totalPoints += points;
          
          const subject = row[subjectIndex];
          const category = row[categoryIndex];
          
          if (subject) {
            analytics.subjectStats[subject] = (analytics.subjectStats[subject] || 0) + points;
          }
          
          if (category) {
            analytics.categoryStats[category] = (analytics.categoryStats[category] || 0) + points;
          }
        });
        
        // Recent tasks (last 10)
        analytics.recentTasks = [...analytics.recentTasks, ...tasks.slice(-10).reverse()];
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
 * Update setting
 */
function handleUpdateSetting(e, spreadsheet) {
  const sheet = spreadsheet.getSheetByName(CONFIG.SHEETS.SETTINGS);
  if (!sheet) {
    // Create settings sheet if it doesn't exist
    const newSheet = spreadsheet.insertSheet(CONFIG.SHEETS.SETTINGS);
    newSheet.getRange('A1:D1').setValues([['setting_key', 'value', 'type', 'description']]);
  }
  
  const settingKey = e.parameter.settingKey;
  const value = e.parameter.value;
  const type = e.parameter.type || 'string';
  const description = e.parameter.description || '';
  
  const range = sheet.getRange(CONFIG.RANGES.SETTINGS);
  const values = range.getValues();
  
  // Find existing setting or add new one
  let updated = false;
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === settingKey) {
      values[i][1] = value;
      values[i][2] = type;
      values[i][3] = description;
      updated = true;
      break;
    }
  }
  
  if (!updated) {
    sheet.appendRow([settingKey, value, type, description]);
  } else {
    range.setValues(values);
  }
  
  return createSuccessResponse({
    message: 'Setting updated successfully'
  });
}

/**
 * Add user stat
 */
function handleAddUserStat(e, spreadsheet) {
  const sheet = spreadsheet.getSheetByName(CONFIG.SHEETS.USER_STATS);
  if (!sheet) {
    throw new Error('User_Stats sheet not found');
  }
  
  const data = JSON.parse(e.parameter.data || '[]');
  console.log('Adding user stat:', data);
  
  sheet.appendRow(data);
  
  return createSuccessResponse({
    message: 'User stat added successfully'
  });
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
        let rowDate;
        const cellValue = values[i][dateIndex];
        
        if (cellValue instanceof Date) {
          rowDate = Utilities.formatDate(cellValue, Session.getScriptTimeZone(), 'yyyy-MM-dd');
        } else if (typeof cellValue === 'string') {
          // If it's already a string, try to parse it first
          const parsedDate = new Date(cellValue);
          rowDate = Utilities.formatDate(parsedDate, Session.getScriptTimeZone(), 'yyyy-MM-dd');
        } else {
          // Skip invalid dates
          continue;
        }
        
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
  
  // Calculate task stats from Tasks sheet
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
          let taskDate;
          const timestampValue = row[timestampIndex];
          
          if (timestampValue instanceof Date) {
            taskDate = Utilities.formatDate(timestampValue, Session.getScriptTimeZone(), 'yyyy-MM-dd');
          } else if (typeof timestampValue === 'string') {
            const parsedDate = new Date(timestampValue);
            if (!isNaN(parsedDate.getTime())) {
              taskDate = Utilities.formatDate(parsedDate, Session.getScriptTimeZone(), 'yyyy-MM-dd');
            } else {
              return; // Skip invalid dates
            }
          } else {
            return; // Skip invalid timestamps
          }
          
          if (taskDate === today) {
            stats.tasks_completed++;
            if (row[correctnessIndex] === 'Poprawnie' || row[correctnessIndex] === true) {
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
          let sessionDate;
          const startTimeValue = row[1];
          
          if (startTimeValue instanceof Date) {
            sessionDate = Utilities.formatDate(startTimeValue, Session.getScriptTimeZone(), 'yyyy-MM-dd');
          } else if (typeof startTimeValue === 'string') {
            const parsedDate = new Date(startTimeValue);
            if (!isNaN(parsedDate.getTime())) {
              sessionDate = Utilities.formatDate(parsedDate, Session.getScriptTimeZone(), 'yyyy-MM-dd');
            } else {
              return; // Skip invalid dates
            }
          } else {
            return; // Skip invalid timestamps
          }
          
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
    { id: 'subj_1', subject_name: 'Matematyka', name: 'Matematyka', color: '#FF6B6B', icon: '📐', active: true },
    { id: 'subj_2', subject_name: 'Polski', name: 'Polski', color: '#4ECDC4', icon: '📝', active: true },
    { id: 'subj_3', subject_name: 'Angielski', name: 'Angielski', color: '#45B7D1', icon: '🇬🇧', active: true },
    { id: 'subj_4', subject_name: 'Historia', name: 'Historia', color: '#F7B731', icon: '📚', active: true }
  ];
}

/**
 * Default categories if sheet is empty
 */
function getDefaultCategories() {
  return [
    { id: 'cat_1', category_name: 'Algebra', name: 'Algebra', subject_name: 'Matematyka', subject: 'Matematyka', difficulty: 'Średni', active: true },
    { id: 'cat_2', category_name: 'Geometria', name: 'Geometria', subject_name: 'Matematyka', subject: 'Matematyka', difficulty: 'Trudny', active: true },
    { id: 'cat_3', category_name: 'Części mowy', name: 'Części mowy', subject_name: 'Polski', subject: 'Polski', difficulty: 'Łatwy', active: true },
    { id: 'cat_4', category_name: 'Składnia', name: 'Składnia', subject_name: 'Polski', subject: 'Polski', difficulty: 'Trudny', active: true },
    { id: 'cat_5', category_name: 'Grammar', name: 'Grammar', subject_name: 'Angielski', subject: 'Angielski', difficulty: 'Średni', active: true },
    { id: 'cat_6', category_name: 'Vocabulary', name: 'Vocabulary', subject_name: 'Angielski', subject: 'Angielski', difficulty: 'Łatwy', active: true }
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
 * Test function for debugging - can be run manually
 */
function testDoGet() {
  console.log('Testing doGet function...');
  
  // Simulate GET request
  const testEvent = {
    parameter: {
      action: 'getSubjects',
      spreadsheetId: '1a51kwcG8aT4rfTSdhJ6HKSggneURQkQsywZClCcIcJ8'
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
      spreadsheetId: '1a51kwcG8aT4rfTSdhJ6HKSggneURQkQsywZClCcIcJ8',
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
