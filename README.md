# Google Sheets Form Web Application

A modern, responsive web application that allows users to submit form data directly to Google Sheets. Built with vanilla JavaScript, HTML, and CSS.

## 🚀 Features

- **Direct Google Sheets Integration**: Submit form data directly to your Google Sheets spreadsheet
- **Real-time Validation**: Client-side form validation with visual feedback
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Error Handling**: Comprehensive error handling and user feedback
- **Demo Mode**: Test the application without making actual API calls
- **Accessibility**: Built with accessibility best practices (ARIA labels, keyboard navigation)
- **Modern UI**: Clean, professional interface with loading states and animations

## 📋 Form Fields

The form captures the following data that maps to your Google Sheets columns:

- **Nazwa** (Name) - Text input, max 100 characters
- **Treść** (Content) - Textarea, max 1000 characters  
- **Poprawność** (Correctness) - Select dropdown (Prawda, Fałsz, Częściowo prawda)
- **Kategorie** (Categories) - Text input, max 50 characters
- **Przedmiot** (Subject) - Text input, max 50 characters

## 🛠️ Setup Instructions

### Prerequisites

- A Google account with access to Google Sheets
- Basic web server to serve the HTML files (can be local development server)

### Google Sheets Setup

1. **Open your Google Sheet**: 
   - The application is configured to work with: `https://docs.google.com/spreadsheets/d/1a51kwcG8aT4rfTSdhJ6HKSggneURQkQsywZClCcIcJ8/edit`
   - Sheet name: "Arkusz 1"
   - Columns A-E should contain: Nazwa, Treść, Poprawność, Kategorie, Przedmiot

2. **Create a Google Apps Script**:
   ```javascript
   function doPost(e) {
     try {
       const data = JSON.parse(e.postData.contents);
       const sheet = SpreadsheetApp.openById(data.spreadsheetId).getSheetByName(data.sheetName);
       
       // Append the data to the sheet
       sheet.appendRow(data.data);
       
       return ContentService
         .createTextOutput(JSON.stringify({success: true, message: 'Data added successfully'}))
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
   - Copy the web app URL

4. **Update Configuration**:
   - Open `js/config.js`
   - Replace the empty `GAS_WEB_APP_URL` with your Apps Script web app URL

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

## 📁 Project Structure

```
google-sheets-form-webapp-new/
├── index.html              # Main HTML file
├── css/
│   └── styles.css          # Application styles
├── js/
│   ├── config.js           # Configuration settings
│   ├── googleSheets.js     # Google Sheets API integration
│   └── app.js              # Main application logic
├── README.md               # This file
├── WARP.md                 # Development guide
└── .git/                   # Git repository
```

## 🎨 Customization

### Styling
- Modify `css/styles.css` to change the appearance
- The design uses CSS custom properties for easy theming
- Responsive breakpoints are included for mobile optimization

### Form Fields
- Update `js/config.js` to modify field configurations
- Add/remove fields by updating the `FORM_FIELDS` object
- Remember to update the HTML form in `index.html` accordingly

### Validation Rules
- Validation logic is in `js/googleSheets.js`
- Modify the `validateFormData` method to change validation rules
- Add custom validation messages in the config

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**: 
   - Ensure your Google Apps Script is deployed with "Anyone" access
   - Make sure you're serving the HTML files through a web server

2. **Form Not Submitting**:
   - Check that `GAS_WEB_APP_URL` is correctly set in `js/config.js`
   - Verify your Google Apps Script is properly deployed
   - Check browser console for error messages

3. **Data Not Appearing in Sheets**:
   - Verify the spreadsheet ID and sheet name are correct
   - Ensure the Google Apps Script has permissions to write to the sheet
   - Check that column headers match the expected format

### Debug Mode

Enable debug mode in `js/config.js` to see detailed logging:
```javascript
DEBUG_MODE: true
```

This will log API responses and other debugging information to the browser console.

## 🔒 Security Considerations

- The Google Apps Script web app URL is public but can only append data to your sheet
- Consider implementing additional server-side validation in your Apps Script
- Be cautious with the data you collect and ensure compliance with privacy regulations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 📞 Support

For issues and questions:
1. Check the troubleshooting section above
2. Review the browser console for error messages
3. Verify your Google Sheets and Apps Script configuration
4. Create an issue in the repository if needed

---

**Built with ❤️ for seamless Google Sheets integration**
