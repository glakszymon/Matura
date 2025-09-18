/**
 * Test script for Enhanced Analytics functionality
 * Run this in browser console to test the integration
 */

console.log('🧪 Testing Enhanced Analytics Integration...');

// Test 1: Check if required classes are loaded
console.log('\n1. Checking class availability:');
console.log('   CONFIG:', typeof CONFIG !== 'undefined' ? '✅' : '❌');
console.log('   GoogleSheetsAPIv2:', typeof GoogleSheetsAPIv2 !== 'undefined' ? '✅' : '❌');
console.log('   EnhancedAnalytics:', typeof EnhancedAnalytics !== 'undefined' ? '✅' : '❌');
console.log('   ChartsManager:', typeof ChartsManager !== 'undefined' ? '✅' : '❌');

// Test 2: Check if navigation elements exist
console.log('\n2. Checking navigation elements:');
const enhancedAnalyticsBtn = document.getElementById('show-enhanced-analytics');
const enhancedAnalyticsContainer = document.getElementById('enhanced-analytics-container');
console.log('   Enhanced Analytics Button:', enhancedAnalyticsBtn ? '✅' : '❌');
console.log('   Enhanced Analytics Container:', enhancedAnalyticsContainer ? '✅' : '❌');

// Test 3: Check if Chart.js is loaded
console.log('\n3. Checking Chart.js:');
console.log('   Chart.js:', typeof Chart !== 'undefined' ? '✅' : '❌');

// Test 4: Test demo mode
console.log('\n4. Testing demo mode:');
if (typeof CONFIG !== 'undefined' && CONFIG.DEMO_MODE) {
    console.log('   Demo Mode: ✅ ENABLED');
    
    // Test GoogleSheetsAPIv2 with demo data
    if (typeof GoogleSheetsAPIv2 !== 'undefined') {
        try {
            const api = new GoogleSheetsAPIv2(CONFIG);
            
            // Test demo data methods
            console.log('   Testing demo data methods...');
            
            api.getStudyTasks().then(result => {
                console.log('   getStudyTasks():', result.success ? '✅' : '❌', 
                           result.success ? `${result.tasks.length} tasks` : result.error);
            });
            
            api.getStudySessions().then(result => {
                console.log('   getStudySessions():', result.success ? '✅' : '❌',
                           result.success ? `${result.sessions.length} sessions` : result.error);
            });
            
            api.getDailyStats().then(result => {
                console.log('   getDailyStats():', result.success ? '✅' : '❌',
                           result.success ? `${result.stats.length} daily stats` : result.error);
            });
            
        } catch (error) {
            console.log('   GoogleSheetsAPIv2 Error:', error);
        }
    }
} else {
    console.log('   Demo Mode: ❌ DISABLED');
    console.log('   Enable DEMO_MODE in config.js for testing');
}

// Test 5: Test initialization function
console.log('\n5. Testing initialization:');
if (typeof window.initializeEnhancedAnalytics === 'function') {
    console.log('   initializeEnhancedAnalytics function: ✅');
    
    try {
        // Don't actually run it to avoid conflicts, just check it exists
        console.log('   Function available for manual testing');
        console.log('   Run: window.initializeEnhancedAnalytics() to test');
    } catch (error) {
        console.log('   Initialization Error:', error);
    }
} else {
    console.log('   initializeEnhancedAnalytics function: ❌');
}

// Test 6: Check navigation system
console.log('\n6. Testing navigation:');
if (enhancedAnalyticsBtn && enhancedAnalyticsContainer) {
    console.log('   Navigation elements ready: ✅');
    console.log('   Click the "🚀 Zaawansowana Analityka" button to test');
} else {
    console.log('   Navigation elements: ❌');
}

console.log('\n🧪 Enhanced Analytics Integration Test Complete');
console.log('💡 Check the console for any errors when clicking the Enhanced Analytics tab');
