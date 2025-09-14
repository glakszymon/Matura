# Google Sheets Data Debugging System

This application now features a clean, centralized debugging system specifically designed for tracking data retrieved from Google Sheets. All previous debugging code has been removed and replaced with this focused solution.

## Overview

The new debugging system provides:
- **Clean console output** with organized, colored formatting
- **Data-focused logging** - tracks only Google Sheets operations
- **Zero interference** with application performance when disabled
- **Easy control** - enable/disable with simple commands

## Quick Start

### Enable Debugging
Open browser console and run:
```javascript
enableGSDebug()
```

### Disable Debugging
```javascript
disableGSDebug()
```

### View Session Summary
```javascript
showGSSummary()
```

### Clear Debug Log
```javascript
clearGSDebug()
```

## What Gets Tracked

The debugger automatically tracks:

### 📚 Subjects Data
- Number of subjects loaded
- Subject names and properties
- Request duration

### 🏷️ Categories Data  
- Categories organized by subject
- Difficulty levels
- Filtering information

### 📝 Tasks Data
- Task statistics (total, correct, incorrect)
- Success rates
- Recent task previews

### 🏆 Achievements Data
- Achievement counts
- Unlock status

### 📊 Analytics Data
- Performance metrics
- Data processing times

### ⚙️ Settings Data
- Configuration changes
- System settings

## Console Output Examples

When debugging is enabled, you'll see formatted output like:

```
📊 GOOGLE SHEETS DATA DEBUGGER INITIALIZED
⏰ Session started: 2024-01-15T10:30:00.000Z
─────────────────────────────────────────────

📚 [1] fetchSubjects - subjects (10:30:01)
📋 Data Count: 3
⏱️ Duration: 250ms
📚 SUBJECTS FROM GOOGLE SHEETS:
  1. Matematyka (Active: true)
  2. Polski (Active: true)  
  3. Angielski (Active: true)
📊 Total: 3 subjects imported from Google Sheets
──────────────────────────────────────────────────────────────
```

## Integration

The debugger is automatically integrated into:
- `GoogleSheetsAPI` class
- `GoogleSheetsAPIv2` class  
- All data retrieval methods

No code changes needed - just enable debugging when needed.

## Files

- **`js/googleSheetsDebugger.js`** - Main debugger class
- **`test-debug.html`** - Test page for debugging features
- **`DEBUGGING.md`** - This documentation

## Benefits

✅ **Clean codebase** - No debug code scattered throughout files
✅ **Performance** - Zero overhead when disabled  
✅ **Focused** - Only tracks Google Sheets data operations
✅ **Professional** - Clean, organized console output
✅ **Flexible** - Easy to enable/disable as needed

## Migration from Old System

The previous `DEBUG_MODE` and `DEMO_MODE` system has been completely removed. The new system:

- **Replaces** all previous debug logging
- **Eliminates** performance impact of debug code
- **Centralizes** all debugging in one location  
- **Simplifies** debugging workflow

## Usage Tips

1. **Enable only when needed** - Leave disabled during normal operation
2. **Use session summary** - Great overview of data operations
3. **Check data counts** - Quickly verify if data is loading correctly
4. **Monitor request times** - Identify slow API calls
5. **Track errors** - See detailed error information with context

## Browser Console Commands

| Command | Purpose |
|---------|---------|
| `enableGSDebug()` | Start tracking Google Sheets operations |
| `disableGSDebug()` | Stop tracking operations |  
| `showGSSummary()` | Display session statistics |
| `clearGSDebug()` | Reset all logged data |
| `window.gsDebugger.getLoggedData()` | Access raw debug data |

## Example Use Cases

### Debugging Data Loading Issues
1. Enable debugging: `enableGSDebug()`
2. Reload the page or trigger data loading
3. Check console for data counts and error messages
4. View summary: `showGSSummary()`

### Performance Analysis
1. Enable debugging before heavy operations
2. Monitor request durations in console output
3. Use session summary to see total request counts
4. Identify slow operations for optimization

### Data Validation
1. Enable debugging to see actual data retrieved
2. Verify subject/category structures
3. Check data counts match expectations
4. Ensure proper data transformations
