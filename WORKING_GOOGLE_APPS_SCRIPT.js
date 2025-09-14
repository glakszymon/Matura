/**
 * WORKING Google Apps Script - Copy this ENTIRE code to your Google Apps Script
 * This version removes setHeaders() which is not supported in Google Apps Script
 */

const CONFIG = {
  // Your spreadsheet ID (from the URL)
  SPREADSHEET_ID: '1a51kwcG8aT4rfTSdhJ6HKSggneURQkQsywZClCcIcJ8',
  
  // Sheet configurations
  SHEETS: {
    MAIN_FORM: {
      SHEET_NAME: 'Arkusz1',
      EXPECTED_COLUMNS: ['Nazwa', 'Treść', 'Poprawność', 'Kategorie', 'Przedmiot'],
      DATA_LENGTH: 5
    },
    CATEGORIES: {
      SHEET_NAME: 'Categories',
      EXPECTED_COLUMNS: ['Nazwa kategorii', 'Opis'],
      DATA_LENGTH: 2
    },
    SUBJECTS: {
      SHEET_NAME: 'Subjects',
      EXPECTED_COLUMNS: ['Nazwa przedmiotu', 'Opis'],
      DATA_LENGTH: 2
    }
  }
};

/**
 * Handle GET requests - fetch data from sheets
 */
function doGet(e) {
  try {
    const params = e.parameter || {};
    const action = params.action;

    if (action === 'getCategories') {
      return getCategories();
    } else if (action === 'getSubjects') {
      return getSubjects();
    } else {
      // Default status response
      const data = {
        status: 'ready',
        message: 'Google Sheets Form API is running',
        timestamp: new Date().toISOString(),
        method: 'GET'
      };

      return ContentService
        .createTextOutput(JSON.stringify(data))
        .setMimeType(ContentService.MimeType.JSON);
    }

  } catch (error) {
    console.error('Error in doGet:', error);
    const errorData = {
      status: 'error',
      message: 'Service unavailable',
      timestamp: new Date().toISOString()
    };

    return ContentService
      .createTextOutput(JSON.stringify(errorData))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Get categories from the Categories sheet
 */
function getCategories() {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(CONFIG.SHEETS.CATEGORIES.SHEET_NAME);

    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          message: 'Categories sheet not found',
          categories: []
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const data = sheet.getDataRange().getValues();

    // Skip header row and map data
    const categories = data.slice(1).map(row => ({
      id: row[0], // Timestamp as ID
      name: row[1] || '',
      description: row[2] || ''
    })).filter(cat => cat.name.trim() !== ''); // Filter out empty entries

    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'Categories retrieved successfully',
        categories: categories
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    console.error('Error getting categories:', error);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: 'Error retrieving categories',
        categories: []
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Get subjects from the Subjects sheet
 */
function getSubjects() {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(CONFIG.SHEETS.SUBJECTS.SHEET_NAME);

    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          message: 'Subjects sheet not found',
          subjects: []
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const data = sheet.getDataRange().getValues();

    // Skip header row and map data
    const subjects = data.slice(1).map(row => ({
      id: row[0], // Timestamp as ID
      name: row[1] || '',
      description: row[2] || ''
    })).filter(sub => sub.name.trim() !== ''); // Filter out empty entries

    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'Subjects retrieved successfully',
        subjects: subjects
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    console.error('Error getting subjects:', error);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: 'Error retrieving subjects',
        subjects: []
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle POST requests - main form submission handler
 */
function doPost(e) {
  console.log('=== doPost called ===');
  console.log('Event object keys:', Object.keys(e || {}));
  console.log('postData:', e.postData);
  console.log('parameter:', e.parameter);
  
  const response = {
    success: false,
    message: '',
    timestamp: new Date().toISOString(),
    method: 'POST'
  };

  try {
    // Parse the incoming data (supports both JSON and FormData)
    let requestData;
    
    try {
      console.log('Processing request...');
      
      // Check if it's a JSON POST request
      if (e && e.postData && e.postData.type === 'application/json') {
        requestData = JSON.parse(e.postData.contents);
        console.log('Parsed JSON data');
      } 
      // Check if it's a FormData request (from our no-cors mode)
      else if (e && e.parameter && e.parameter.data) {
        const formType = e.parameter.formType || 'main';
        const sheetConfig = formType === 'category' ? CONFIG.SHEETS.CATEGORIES : (formType === 'subject' ? CONFIG.SHEETS.SUBJECTS : CONFIG.SHEETS.MAIN_FORM);
        
        const sheetName = (e.parameter.sheetName && e.parameter.sheetName.trim()) ? e.parameter.sheetName : sheetConfig.SHEET_NAME;
        
        requestData = {
          spreadsheetId: e.parameter.spreadsheetId || CONFIG.SPREADSHEET_ID,
          sheetName: sheetName,
          range: e.parameter.range || (formType === 'main' ? 'B:F' : 'B:C'),
          data: JSON.parse(e.parameter.data),
          formType: formType
        };
        console.log('Parsed FormData for', formType, 'form');
      } else {
        throw new Error('No valid data found in request');
      }
    } catch (parseError) {
      console.error('Parsing error:', parseError);
      response.message = 'Invalid request format';
      return createResponse(response);
    }

    // Validate required fields
    if (!requestData.data || !Array.isArray(requestData.data)) {
      response.message = 'Missing or invalid data array';
      return createResponse(response);
    }

    // Determine expected data length based on form type
    const formType = requestData.formType || 'main';
    const sheetConfig = formType === 'category' ? CONFIG.SHEETS.CATEGORIES : (formType === 'subject' ? CONFIG.SHEETS.SUBJECTS : CONFIG.SHEETS.MAIN_FORM);
    const expectedLength = sheetConfig.DATA_LENGTH;
    
    if (requestData.data.length !== expectedLength) {
      response.message = `Expected ${expectedLength} data fields for ${formType} form, got ${requestData.data.length}`;
      return createResponse(response);
    }

    // Get the spreadsheet and sheet
    let spreadsheet;
    try {
      spreadsheet = SpreadsheetApp.openById(requestData.spreadsheetId || CONFIG.SPREADSHEET_ID);
      console.log('Spreadsheet opened successfully');
    } catch (spreadsheetError) {
      console.error('Spreadsheet access error:', spreadsheetError);
      response.message = 'Unable to access spreadsheet';
      return createResponse(response);
    }

    let sheet;
    try {
      const sheetName = requestData.sheetName;
      sheet = spreadsheet.getSheetByName(sheetName);
      if (!sheet) {
        // Only create new sheets for category and subject forms, not for main form
        if (formType === 'category' || formType === 'subject') {
          sheet = spreadsheet.insertSheet(sheetName);
          console.log(`Created new ${formType.charAt(0).toUpperCase() + formType.slice(1)} sheet:`, sheetName);
          
          // Add headers for Categories or Subjects sheet
          const headers = ['Timestamp'].concat(formType === 'category' ? CONFIG.SHEETS.CATEGORIES.EXPECTED_COLUMNS : CONFIG.SHEETS.SUBJECTS.EXPECTED_COLUMNS);
          sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
          console.log(`Added headers to ${formType.charAt(0).toUpperCase() + formType.slice(1)} sheet:`, headers);
        } else {
          // For main form, the sheet should already exist
          response.message = `Main form sheet "${sheetName}" not found. Please check your spreadsheet.`;
          console.error('Main form sheet not found:', sheetName);
          return createResponse(response);
        }
      } else {
        console.log('Found existing sheet:', sheetName);
      }
    } catch (sheetError) {
      console.error('Sheet access error:', sheetError);
      response.message = 'Unable to access sheet';
      return createResponse(response);
    }

    // Sanitize and validate the data
    const sanitizedData = requestData.data.map(function(cell) {
      if (typeof cell === 'string') {
        return cell.substring(0, 1000).trim();
      }
      return cell || '';
    });

    console.log('Data sanitized');

    // Prepare row data with timestamp
    const rowData = [new Date().toISOString()].concat(sanitizedData);

    // Append the data to the sheet
    try {
      sheet.appendRow(rowData);
      console.log('Data added to sheet successfully');
      
      response.success = true;
      response.message = 'Data successfully added to Google Sheets';
      response.rowData = sanitizedData;
      
    } catch (appendError) {
      console.error('Error appending data:', appendError);
      response.message = 'Failed to add data to sheet';
      return createResponse(response);
    }

  } catch (error) {
    console.error('Unexpected error in doPost:', error);
    response.message = 'Internal server error';
    return createResponse(response);
  }

  return createResponse(response);
}

/**
 * Create a response (simplified without headers)
 */
function createResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Initialize the sheet with proper headers
 */
function initializeSheet() {
  try {
    console.log('Initializing sheet...');
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    let sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);
    
    if (!sheet) {
      console.log('Creating new sheet...');
      sheet = spreadsheet.insertSheet(CONFIG.SHEET_NAME);
    }

    // Add headers if they don't exist
    const headers = ['Timestamp'].concat(CONFIG.EXPECTED_COLUMNS);
    const range = sheet.getRange(1, 1, 1, headers.length);
    
    // Check if first row is empty or doesn't have our headers
    const firstRow = range.getValues()[0];
    if (!firstRow[0] || firstRow[0] !== 'Timestamp') {
      range.setValues([headers]);
      
      // Format headers
      range.setFontWeight('bold');
      range.setBackground('#4285f4');
      range.setFontColor('white');
      
      console.log('Headers added:', headers);
    } else {
      console.log('Headers already exist');
    }
    
    return 'Sheet initialized successfully';
    
  } catch (error) {
    console.error('Error initializing sheet:', error);
    return 'Error initializing sheet: ' + error.toString();
  }
}

/**
 * Test function
 */
function testScript() {
  console.log('Running test...');
  
  const testData = {
    spreadsheetId: CONFIG.SPREADSHEET_ID,
    sheetName: CONFIG.SHEET_NAME,
    data: ['Test Name', 'Test Content', 'Prawda', 'Test Category', 'Test Subject']
  };

  const mockEvent = {
    postData: {
      contents: JSON.stringify(testData),
      type: 'application/json'
    }
  };

  try {
    const result = doPost(mockEvent);
    const content = result.getContent();
    console.log('Test result:', content);
    return content;
  } catch (error) {
    console.error('Test failed:', error);
    return 'Test failed: ' + error.toString();
  }
}

/**
 * Simple test to check if script is working
 */
function simpleTest() {
  console.log('Simple test starting...');
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    console.log('Spreadsheet access: OK');
    
    let sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);
    if (!sheet) {
      sheet = spreadsheet.insertSheet(CONFIG.SHEET_NAME);
      console.log('Sheet created: OK');
    } else {
      console.log('Sheet access: OK');
    }
    
    return 'Simple test passed!';
  } catch (error) {
    console.error('Simple test failed:', error);
    return 'Simple test failed: ' + error.toString();
  }
}
