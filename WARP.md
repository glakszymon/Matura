# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a vanilla JavaScript web application that allows users to submit form data directly to Google Sheets. It's a static web app with no build process or dependencies - just HTML, CSS, and JavaScript files that need to be served via a web server.

## Architecture

### Modular Structure
- **`js/config.js`**: Centralized configuration including Google Sheets settings, form field definitions, and debug modes
- **`js/googleSheets.js`**: GoogleSheetsAPI class handles all data submission, validation, and demo mode
- **`js/app.js`**: FormApp class manages DOM interactions, form validation, and user feedback
- **`index.html`**: Semantic form structure with Polish field labels
- **`css/styles.css`**: Responsive design with CSS custom properties and accessibility features

### Key Design Patterns
- **Class-based ES6 JavaScript**: Uses modern ES6+ classes with async/await
- **Configuration-driven**: Form fields and validation rules are defined in CONFIG object
- **Event-driven architecture**: Real-time validation and form state management
- **Multi-layer validation**: HTML5, real-time JavaScript, and pre-submission validation

## Development Commands

### Start Development Server
```bash
# Python 3 (recommended)
python -m http.server 8000

# Python 2 (if needed)
python -m SimpleHTTPServer 8000

# Node.js alternative
npx serve .
```
Then open http://localhost:8000

### Testing in Demo Mode
To test without making actual API calls:
1. Edit `js/config.js` and set `DEMO_MODE: true`
2. Form submissions will be simulated and logged to console

### Enable Debug Mode
Set `DEBUG_MODE: true` in `js/config.js` for detailed console logging

## Configuration Management

### Critical Configuration Steps
1. **Set Google Apps Script URL**: Update `GAS_WEB_APP_URL` in `js/config.js`
2. **Google Sheets Setup**: Configure `SPREADSHEET_ID` and `SHEET_NAME`
3. **Form Fields**: All field definitions are in `CONFIG.FORM_FIELDS`

### Google Apps Script Integration
The app expects a Google Apps Script web app that accepts POST requests with this payload:
```javascript
{
    spreadsheetId: 'sheet_id',
    sheetName: 'sheet_name',
    range: 'A:E',
    data: [field1, field2, field3, field4, field5]
}
```

## Form Field System

### Current Fields (Polish labels)
- **nazwa**: Text input, max 100 chars (Name)
- **tresc**: Textarea, max 1000 chars (Content)
- **poprawnosc**: Select dropdown with 3 options (Correctness)
- **kategorie**: Text input, max 50 chars (Categories)
- **przedmiot**: Text input, max 50 chars (Subject)

### Adding New Fields
1. **Update CONFIG.FORM_FIELDS** in `js/config.js`
2. **Add HTML form element** in `index.html` with proper structure
3. **Update prepareDataForSheets()** method in `js/googleSheets.js`
4. **Ensure Google Sheets has corresponding column**

## Validation System

### Three-Layer Validation
1. **HTML5**: Basic required/maxlength attributes
2. **Real-time**: JavaScript validation on input events
3. **Pre-submission**: Final validation before API call

### Validation Configuration
Validation rules are defined in `CONFIG.FORM_FIELDS`. The system automatically:
- Validates required fields
- Enforces maxLength limits
- Shows real-time visual feedback
- Displays localized error messages in Polish

## State Management

### Form States
- **Normal**: Default state
- **Loading**: During submission (button disabled, loading text)
- **Success**: After successful submission (form resets, success message)
- **Error**: On validation or submission errors (error messages displayed)

### Visual Feedback
- Fields get `.valid` or `.error` CSS classes
- Error messages appear in `.field-error` elements
- Loading states managed through button text changes and CSS classes

## Error Handling Strategy

### Error Boundaries
- **API Level**: Network errors, invalid responses
- **Validation Level**: Field validation, form validation
- **Application Level**: General application errors

### User Feedback
All error messages are in Polish and displayed through the message system with appropriate styling.

## Browser Compatibility

### Supported Browsers
- Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- Uses modern JavaScript features (ES6 classes, async/await, fetch)
- No transpilation or polyfills currently included

### Accessibility Features
- Semantic HTML with proper form labeling
- ARIA attributes for error messages (`role="alert"`)
- Keyboard navigation support
- High contrast support through CSS

## Production Deployment

### Pre-deployment Checklist
- Set `DEBUG_MODE: false` and `DEMO_MODE: false` in `js/config.js`
- Configure actual `GAS_WEB_APP_URL`
- Test Google Apps Script deployment
- Verify mobile responsiveness

### Hosting Requirements
- Static file hosting (any web server)
- HTTPS recommended for Google Sheets API calls
- No server-side processing required

## Troubleshooting

### Common Issues
1. **CORS Errors**: Ensure serving via web server (not file:// protocol)
2. **Form not submitting**: Check `GAS_WEB_APP_URL` configuration
3. **Validation not working**: Verify form element IDs match JavaScript selectors
4. **Google Sheets not updating**: Check Apps Script permissions and deployment settings
