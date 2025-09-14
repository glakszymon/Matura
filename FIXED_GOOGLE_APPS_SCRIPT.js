/**
 * FIXED Google Apps Script - Copy this ENTIRE code to your Google Apps Script
 * This version fixes the data reading functions for categories and subjects
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
    } else if (action === 'deleteCategory') {
      return deleteCategory(params.id);
    } else if (action === 'deleteSubject') {
      return deleteSubject(params.id);
    } else if (action === 'getCategory') {
      return getCategory(params.id);
    } else if (action === 'getSubject') {
      return getSubject(params.id);
    } else if (action === 'getMainEntries') {
      return getMainEntries();
    } else if (action === 'getMainEntry') {
      return getMainEntry(params.id);
    } else if (action === 'deleteMainEntry') {
      return deleteMainEntry(params.id);
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
 * Get categories from the Categories sheet - FIXED VERSION
 */
function getCategories() {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    let sheet = spreadsheet.getSheetByName(CONFIG.SHEETS.CATEGORIES.SHEET_NAME);

    if (!sheet) {
      // Create the Categories sheet if it doesn't exist
      sheet = spreadsheet.insertSheet(CONFIG.SHEETS.CATEGORIES.SHEET_NAME);
      
      // Add headers
      const headers = ['Timestamp', 'Nazwa kategorii', 'Opis'];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      console.log('Created Categories sheet with headers');
      
      return ContentService
        .createTextOutput(JSON.stringify({
          success: true,
          message: 'Categories sheet created but no data yet',
          categories: []
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const data = sheet.getDataRange().getValues();
    console.log('Categories sheet data:', data);
    console.log('Categories sheet data length:', data.length);
    if (data.length > 0) {
      console.log('First row (headers):', data[0]);
      if (data.length > 1) {
        console.log('Second row (first data):', data[1]);
        console.log('Second row types:', data[1].map(cell => typeof cell));
      }
    }

    // If only headers exist or sheet is empty
    if (data.length <= 1) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: true,
          message: 'No categories found',
          categories: []
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Skip header row and map data correctly
    // Data structure: [Timestamp, Nazwa kategorii, Opis]
    const categories = data.slice(1).map((row, index) => {
      console.log(`Processing category row ${index}:`, row);
      const category = {
        id: `cat_${index + 1}`, // Generate a simple ID
        name: String(row[1] || '').trim(), // Column B: Nazwa kategorii (ensure string)
        description: String(row[2] || '').trim() // Column C: Opis (ensure string)
      };
      console.log(`Mapped category ${index}:`, category);
      return category;
    }).filter(cat => {
      const isValid = cat.name !== '';
      console.log(`Category "${cat.name}" is valid:`, isValid);
      return isValid;
    }); // Filter out empty entries

    console.log('Processed categories:', categories);

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
        message: 'Error retrieving categories: ' + error.toString(),
        categories: []
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Get subjects from the Subjects sheet - FIXED VERSION
 */
function getSubjects() {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    let sheet = spreadsheet.getSheetByName(CONFIG.SHEETS.SUBJECTS.SHEET_NAME);

    if (!sheet) {
      // Create the Subjects sheet if it doesn't exist
      sheet = spreadsheet.insertSheet(CONFIG.SHEETS.SUBJECTS.SHEET_NAME);
      
      // Add headers
      const headers = ['Timestamp', 'Nazwa przedmiotu', 'Opis'];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      console.log('Created Subjects sheet with headers');
      
      return ContentService
        .createTextOutput(JSON.stringify({
          success: true,
          message: 'Subjects sheet created but no data yet',
          subjects: []
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const data = sheet.getDataRange().getValues();
    console.log('Subjects sheet data:', data);
    console.log('Subjects sheet data length:', data.length);
    if (data.length > 0) {
      console.log('First row (headers):', data[0]);
      if (data.length > 1) {
        console.log('Second row (first data):', data[1]);
        console.log('Second row types:', data[1].map(cell => typeof cell));
      }
    }

    // If only headers exist or sheet is empty
    if (data.length <= 1) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: true,
          message: 'No subjects found',
          subjects: []
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Skip header row and map data correctly
    // Data structure: [Timestamp, Nazwa przedmiotu, Opis]
    const subjects = data.slice(1).map((row, index) => {
      console.log(`Processing subject row ${index}:`, row);
      const subject = {
        id: `sub_${index + 1}`, // Generate a simple ID
        name: String(row[1] || '').trim(), // Column B: Nazwa przedmiotu (ensure string)
        description: String(row[2] || '').trim() // Column C: Opis (ensure string)
      };
      console.log(`Mapped subject ${index}:`, subject);
      return subject;
    }).filter(sub => {
      const isValid = sub.name !== '';
      console.log(`Subject "${sub.name}" is valid:`, isValid);
      return isValid;
    }); // Filter out empty entries

    console.log('Processed subjects:', subjects);

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
        message: 'Error retrieving subjects: ' + error.toString(),
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
          formType: formType,
          action: e.parameter.action || 'create',
          itemId: e.parameter.itemId || null
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

    // Handle different actions (create vs update)
    try {
      if (requestData.action === 'update' && requestData.itemId) {
        // Update existing item
        if (formType === 'category') {
          const updateResult = updateCategory(requestData.itemId, sanitizedData);
          const updateData = JSON.parse(updateResult.getContent());
          if (updateData.success) {
            response.success = true;
            response.message = 'Data successfully updated in Google Sheets';
            response.rowData = sanitizedData;
          } else {
            response.message = updateData.message;
            return createResponse(response);
          }
        } else if (formType === 'subject') {
          const updateResult = updateSubject(requestData.itemId, sanitizedData);
          const updateData = JSON.parse(updateResult.getContent());
          if (updateData.success) {
            response.success = true;
            response.message = 'Data successfully updated in Google Sheets';
            response.rowData = sanitizedData;
          } else {
            response.message = updateData.message;
            return createResponse(response);
          }
        } else if (formType === 'main') {
          const updateResult = updateMainEntry(requestData.itemId, sanitizedData);
          const updateData = JSON.parse(updateResult.getContent());
          if (updateData.success) {
            response.success = true;
            response.message = 'Data successfully updated in Google Sheets';
            response.rowData = sanitizedData;
          } else {
            response.message = updateData.message;
            return createResponse(response);
          }
        } else {
          response.message = 'Update not supported for this form type';
          return createResponse(response);
        }
      } else {
        // Create new item (append)
        const rowData = [new Date().toISOString()].concat(sanitizedData);
        sheet.appendRow(rowData);
        console.log('Data added to sheet successfully');
        
        response.success = true;
        response.message = 'Data successfully added to Google Sheets';
        response.rowData = sanitizedData;
      }
    } catch (operationError) {
      console.error('Error processing data:', operationError);
      response.message = 'Failed to process data';
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
    let sheet = spreadsheet.getSheetByName(CONFIG.SHEETS.MAIN_FORM.SHEET_NAME);
    
    if (!sheet) {
      console.log('Creating new sheet...');
      sheet = spreadsheet.insertSheet(CONFIG.SHEETS.MAIN_FORM.SHEET_NAME);
    }

    // Add headers if they don't exist
    const headers = ['Timestamp'].concat(CONFIG.SHEETS.MAIN_FORM.EXPECTED_COLUMNS);
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
    sheetName: CONFIG.SHEETS.MAIN_FORM.SHEET_NAME,
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
 * Test categories function
 */
function testGetCategories() {
  console.log('Testing categories...');
  try {
    const result = getCategories();
    const content = result.getContent();
    console.log('Categories test result:', content);
    return content;
  } catch (error) {
    console.error('Categories test failed:', error);
    return 'Categories test failed: ' + error.toString();
  }
}

/**
 * Test subjects function
 */
function testGetSubjects() {
  console.log('Testing subjects...');
  try {
    const result = getSubjects();
    const content = result.getContent();
    console.log('Subjects test result:', content);
    return content;
  } catch (error) {
    console.error('Subjects test failed:', error);
    return 'Subjects test failed: ' + error.toString();
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
    
    let sheet = spreadsheet.getSheetByName(CONFIG.SHEETS.MAIN_FORM.SHEET_NAME);
    if (!sheet) {
      sheet = spreadsheet.insertSheet(CONFIG.SHEETS.MAIN_FORM.SHEET_NAME);
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

/**
 * Debug categories sheet structure
 */
function debugCategoriesSheet() {
  try {
    console.log('=== DEBUGGING CATEGORIES SHEET ===');
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName('Categories');
    
    if (!sheet) {
      console.log('Categories sheet does not exist');
      return 'Categories sheet not found';
    }
    
    const data = sheet.getDataRange().getValues();
    console.log('Sheet data:', data);
    console.log('Data length:', data.length);
    console.log('Column count:', data[0] ? data[0].length : 0);
    
    data.forEach((row, index) => {
      console.log(`Row ${index}:`, row);
      console.log(`Row ${index} types:`, row.map(cell => `${typeof cell}(${cell})`));
    });
    
    return JSON.stringify({
      exists: true,
      rows: data.length,
      columns: data[0] ? data[0].length : 0,
      data: data
    });
  } catch (error) {
    console.error('Debug failed:', error);
    return 'Debug failed: ' + error.toString();
  }
}

/**
 * Get a single category by ID
 */
function getCategory(categoryId) {
  try {
    console.log('Getting category with ID:', categoryId);
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(CONFIG.SHEETS.CATEGORIES.SHEET_NAME);
    
    if (!sheet) {
      return createResponse({
        success: false,
        message: 'Categories sheet not found'
      });
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return createResponse({
        success: false,
        message: 'Category not found'
      });
    }
    
    // Find category by ID (ID format: cat_1, cat_2, etc)
    const categoryIndex = parseInt(categoryId.replace('cat_', '')) - 1;
    const rowIndex = categoryIndex + 1; // +1 because we skip header row
    
    if (rowIndex >= data.length || rowIndex < 1) {
      return createResponse({
        success: false,
        message: 'Category not found'
      });
    }
    
    const row = data[rowIndex];
    const category = {
      id: categoryId,
      name: String(row[1] || '').trim(),
      description: String(row[2] || '').trim(),
      rowIndex: rowIndex + 1 // +1 for sheet row number (1-based)
    };
    
    return createResponse({
      success: true,
      category: category
    });
    
  } catch (error) {
    console.error('Error getting category:', error);
    return createResponse({
      success: false,
      message: 'Error retrieving category: ' + error.toString()
    });
  }
}

/**
 * Get a single subject by ID
 */
function getSubject(subjectId) {
  try {
    console.log('Getting subject with ID:', subjectId);
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(CONFIG.SHEETS.SUBJECTS.SHEET_NAME);
    
    if (!sheet) {
      return createResponse({
        success: false,
        message: 'Subjects sheet not found'
      });
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return createResponse({
        success: false,
        message: 'Subject not found'
      });
    }
    
    // Find subject by ID (ID format: sub_1, sub_2, etc)
    const subjectIndex = parseInt(subjectId.replace('sub_', '')) - 1;
    const rowIndex = subjectIndex + 1; // +1 because we skip header row
    
    if (rowIndex >= data.length || rowIndex < 1) {
      return createResponse({
        success: false,
        message: 'Subject not found'
      });
    }
    
    const row = data[rowIndex];
    const subject = {
      id: subjectId,
      name: String(row[1] || '').trim(),
      description: String(row[2] || '').trim(),
      rowIndex: rowIndex + 1 // +1 for sheet row number (1-based)
    };
    
    return createResponse({
      success: true,
      subject: subject
    });
    
  } catch (error) {
    console.error('Error getting subject:', error);
    return createResponse({
      success: false,
      message: 'Error retrieving subject: ' + error.toString()
    });
  }
}

/**
 * Delete a category by ID
 */
function deleteCategory(categoryId) {
  try {
    console.log('Deleting category with ID:', categoryId);
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(CONFIG.SHEETS.CATEGORIES.SHEET_NAME);
    
    if (!sheet) {
      return createResponse({
        success: false,
        message: 'Categories sheet not found'
      });
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return createResponse({
        success: false,
        message: 'Category not found'
      });
    }
    
    // Find category by ID
    const categoryIndex = parseInt(categoryId.replace('cat_', '')) - 1;
    const rowIndex = categoryIndex + 1; // +1 because we skip header row
    const sheetRowIndex = rowIndex + 1; // +1 for sheet row number (1-based)
    
    if (rowIndex >= data.length || rowIndex < 1) {
      return createResponse({
        success: false,
        message: 'Category not found'
      });
    }
    
    // Delete the row
    sheet.deleteRow(sheetRowIndex);
    
    console.log('Category deleted successfully');
    return createResponse({
      success: true,
      message: 'Category deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting category:', error);
    return createResponse({
      success: false,
      message: 'Error deleting category: ' + error.toString()
    });
  }
}

/**
 * Delete a subject by ID
 */
function deleteSubject(subjectId) {
  try {
    console.log('Deleting subject with ID:', subjectId);
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(CONFIG.SHEETS.SUBJECTS.SHEET_NAME);
    
    if (!sheet) {
      return createResponse({
        success: false,
        message: 'Subjects sheet not found'
      });
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return createResponse({
        success: false,
        message: 'Subject not found'
      });
    }
    
    // Find subject by ID
    const subjectIndex = parseInt(subjectId.replace('sub_', '')) - 1;
    const rowIndex = subjectIndex + 1; // +1 because we skip header row
    const sheetRowIndex = rowIndex + 1; // +1 for sheet row number (1-based)
    
    if (rowIndex >= data.length || rowIndex < 1) {
      return createResponse({
        success: false,
        message: 'Subject not found'
      });
    }
    
    // Delete the row
    sheet.deleteRow(sheetRowIndex);
    
    console.log('Subject deleted successfully');
    return createResponse({
      success: true,
      message: 'Subject deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting subject:', error);
    return createResponse({
      success: false,
      message: 'Error deleting subject: ' + error.toString()
    });
  }
}

/**
 * Update a category by ID
 */
function updateCategory(categoryId, newData) {
  try {
    console.log('Updating category with ID:', categoryId, 'Data:', newData);
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(CONFIG.SHEETS.CATEGORIES.SHEET_NAME);
    
    if (!sheet) {
      return createResponse({
        success: false,
        message: 'Categories sheet not found'
      });
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return createResponse({
        success: false,
        message: 'Category not found'
      });
    }
    
    // Find category by ID
    const categoryIndex = parseInt(categoryId.replace('cat_', '')) - 1;
    const rowIndex = categoryIndex + 1; // +1 because we skip header row
    const sheetRowIndex = rowIndex + 1; // +1 for sheet row number (1-based)
    
    if (rowIndex >= data.length || rowIndex < 1) {
      return createResponse({
        success: false,
        message: 'Category not found'
      });
    }
    
    // Update the row - keep timestamp, update name and description
    const currentTimestamp = data[rowIndex][0];
    const updatedRow = [
      currentTimestamp, // Keep original timestamp
      String(newData[0] || '').trim(), // New name
      String(newData[1] || '').trim()  // New description
    ];
    
    sheet.getRange(sheetRowIndex, 1, 1, updatedRow.length).setValues([updatedRow]);
    
    console.log('Category updated successfully');
    return createResponse({
      success: true,
      message: 'Category updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating category:', error);
    return createResponse({
      success: false,
      message: 'Error updating category: ' + error.toString()
    });
  }
}

/**
 * Update a subject by ID
 */
function updateSubject(subjectId, newData) {
  try {
    console.log('Updating subject with ID:', subjectId, 'Data:', newData);
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(CONFIG.SHEETS.SUBJECTS.SHEET_NAME);
    
    if (!sheet) {
      return createResponse({
        success: false,
        message: 'Subjects sheet not found'
      });
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return createResponse({
        success: false,
        message: 'Subject not found'
      });
    }
    
    // Find subject by ID
    const subjectIndex = parseInt(subjectId.replace('sub_', '')) - 1;
    const rowIndex = subjectIndex + 1; // +1 because we skip header row
    const sheetRowIndex = rowIndex + 1; // +1 for sheet row number (1-based)
    
    if (rowIndex >= data.length || rowIndex < 1) {
      return createResponse({
        success: false,
        message: 'Subject not found'
      });
    }
    
    // Update the row - keep timestamp, update name and description
    const currentTimestamp = data[rowIndex][0];
    const updatedRow = [
      currentTimestamp, // Keep original timestamp
      String(newData[0] || '').trim(), // New name
      String(newData[1] || '').trim()  // New description
    ];
    
    sheet.getRange(sheetRowIndex, 1, 1, updatedRow.length).setValues([updatedRow]);
    
    console.log('Subject updated successfully');
    return createResponse({
      success: true,
      message: 'Subject updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating subject:', error);
    return createResponse({
      success: false,
      message: 'Error updating subject: ' + error.toString()
    });
  }
}

/**
 * Get all main form entries
 */
function getMainEntries() {
  try {
    console.log('Getting all main form entries');
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(CONFIG.SHEETS.MAIN_FORM.SHEET_NAME);
    
    if (!sheet) {
      return createResponse({
        success: false,
        message: 'Main form sheet not found',
        entries: []
      });
    }
    
    const data = sheet.getDataRange().getValues();
    console.log('Main form sheet data:', data);
    
    if (data.length <= 1) {
      return createResponse({
        success: true,
        message: 'No main form entries found',
        entries: []
      });
    }
    
    // Skip header row and map data correctly
    // Data structure: [Timestamp, Nazwa, Treść, Poprawność, Kategorie, Przedmiot]
    const entries = data.slice(1).map((row, index) => {
      console.log(`Processing main entry row ${index}:`, row);
      const entry = {
        id: `main_${index + 1}`, // Generate a simple ID
        timestamp: row[0] || '',
        nazwa: String(row[1] || '').trim(), // Column B: Nazwa
        tresc: String(row[2] || '').trim(), // Column C: Treść
        poprawnosc: String(row[3] || '').trim(), // Column D: Poprawność
        kategorie: String(row[4] || '').trim(), // Column E: Kategorie
        przedmiot: String(row[5] || '').trim(), // Column F: Przedmiot
        rowIndex: index + 2 // +2 for sheet row number (1-based + header)
      };
      console.log(`Mapped main entry ${index}:`, entry);
      return entry;
    }).filter(entry => {
      const isValid = entry.nazwa !== '';
      console.log(`Main entry "${entry.nazwa}" is valid:`, isValid);
      return isValid;
    });
    
    console.log('Processed main entries:', entries);
    
    return createResponse({
      success: true,
      message: 'Main entries retrieved successfully',
      entries: entries
    });
    
  } catch (error) {
    console.error('Error getting main entries:', error);
    return createResponse({
      success: false,
      message: 'Error retrieving main entries: ' + error.toString(),
      entries: []
    });
  }
}

/**
 * Get a single main form entry by ID
 */
function getMainEntry(entryId) {
  try {
    console.log('Getting main entry with ID:', entryId);
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(CONFIG.SHEETS.MAIN_FORM.SHEET_NAME);
    
    if (!sheet) {
      return createResponse({
        success: false,
        message: 'Main form sheet not found'
      });
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return createResponse({
        success: false,
        message: 'Main entry not found'
      });
    }
    
    // Find entry by ID (ID format: main_1, main_2, etc)
    const entryIndex = parseInt(entryId.replace('main_', '')) - 1;
    const rowIndex = entryIndex + 1; // +1 because we skip header row
    
    if (rowIndex >= data.length || rowIndex < 1) {
      return createResponse({
        success: false,
        message: 'Main entry not found'
      });
    }
    
    const row = data[rowIndex];
    const entry = {
      id: entryId,
      timestamp: row[0] || '',
      nazwa: String(row[1] || '').trim(),
      tresc: String(row[2] || '').trim(),
      poprawnosc: String(row[3] || '').trim(),
      kategorie: String(row[4] || '').trim(),
      przedmiot: String(row[5] || '').trim(),
      rowIndex: rowIndex + 1 // +1 for sheet row number (1-based)
    };
    
    return createResponse({
      success: true,
      entry: entry
    });
    
  } catch (error) {
    console.error('Error getting main entry:', error);
    return createResponse({
      success: false,
      message: 'Error retrieving main entry: ' + error.toString()
    });
  }
}

/**
 * Delete a main form entry by ID
 */
function deleteMainEntry(entryId) {
  try {
    console.log('Deleting main entry with ID:', entryId);
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(CONFIG.SHEETS.MAIN_FORM.SHEET_NAME);
    
    if (!sheet) {
      return createResponse({
        success: false,
        message: 'Main form sheet not found'
      });
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return createResponse({
        success: false,
        message: 'Main entry not found'
      });
    }
    
    // Find entry by ID
    const entryIndex = parseInt(entryId.replace('main_', '')) - 1;
    const rowIndex = entryIndex + 1; // +1 because we skip header row
    const sheetRowIndex = rowIndex + 1; // +1 for sheet row number (1-based)
    
    if (rowIndex >= data.length || rowIndex < 1) {
      return createResponse({
        success: false,
        message: 'Main entry not found'
      });
    }
    
    // Delete the row
    sheet.deleteRow(sheetRowIndex);
    
    console.log('Main entry deleted successfully');
    return createResponse({
      success: true,
      message: 'Main entry deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting main entry:', error);
    return createResponse({
      success: false,
      message: 'Error deleting main entry: ' + error.toString()
    });
  }
}

/**
 * Update a main form entry by ID
 */
function updateMainEntry(entryId, newData) {
  try {
    console.log('Updating main entry with ID:', entryId, 'Data:', newData);
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(CONFIG.SHEETS.MAIN_FORM.SHEET_NAME);
    
    if (!sheet) {
      return createResponse({
        success: false,
        message: 'Main form sheet not found'
      });
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return createResponse({
        success: false,
        message: 'Main entry not found'
      });
    }
    
    // Find entry by ID
    const entryIndex = parseInt(entryId.replace('main_', '')) - 1;
    const rowIndex = entryIndex + 1; // +1 because we skip header row
    const sheetRowIndex = rowIndex + 1; // +1 for sheet row number (1-based)
    
    if (rowIndex >= data.length || rowIndex < 1) {
      return createResponse({
        success: false,
        message: 'Main entry not found'
      });
    }
    
    // Update the row - keep timestamp, update other fields
    const currentTimestamp = data[rowIndex][0];
    const updatedRow = [
      currentTimestamp, // Keep original timestamp
      String(newData[0] || '').trim(), // Nazwa
      String(newData[1] || '').trim(), // Treść
      String(newData[2] || '').trim(), // Poprawność
      String(newData[3] || '').trim(), // Kategorie
      String(newData[4] || '').trim()  // Przedmiot
    ];
    
    sheet.getRange(sheetRowIndex, 1, 1, updatedRow.length).setValues([updatedRow]);
    
    console.log('Main entry updated successfully');
    return createResponse({
      success: true,
      message: 'Main entry updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating main entry:', error);
    return createResponse({
      success: false,
      message: 'Error updating main entry: ' + error.toString()
    });
  }
}

/**
 * Debug subjects sheet structure
 */
function debugSubjectsSheet() {
  try {
    console.log('=== DEBUGGING SUBJECTS SHEET ===');
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName('Subjects');
    
    if (!sheet) {
      console.log('Subjects sheet does not exist');
      return 'Subjects sheet not found';
    }
    
    const data = sheet.getDataRange().getValues();
    console.log('Sheet data:', data);
    console.log('Data length:', data.length);
    console.log('Column count:', data[0] ? data[0].length : 0);
    
    data.forEach((row, index) => {
      console.log(`Row ${index}:`, row);
      console.log(`Row ${index} types:`, row.map(cell => `${typeof cell}(${cell})`));
    });
    
    return JSON.stringify({
      exists: true,
      rows: data.length,
      columns: data[0] ? data[0].length : 0,
      data: data
    });
  } catch (error) {
    console.error('Debug failed:', error);
    return 'Debug failed: ' + error.toString();
  }
}
