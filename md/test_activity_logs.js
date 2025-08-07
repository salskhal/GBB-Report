// Simple test script to verify activity logs functionality
import axios from 'axios';

const API_BASE = 'http://localhost:5001/api';

async function testActivityLogs() {
  try {
    console.log('🧪 Testing Activity Logs API...\n');
    
    // Test 1: Try to access activities without authentication (should fail)
    try {
      await axios.get(`${API_BASE}/admin/activities`);
      console.log('❌ Test 1 FAILED: Should require authentication');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Test 1 PASSED: Properly requires authentication');
      } else {
        console.log('❌ Test 1 FAILED: Unexpected error:', error.message);
      }
    }
    
    // Test 2: Check if server is running
    try {
      const response = await axios.get(`${API_BASE.replace('/api', '')}/health`);
      console.log('✅ Test 2 PASSED: Server is running');
      console.log('   Server status:', response.data);
    } catch (error) {
      console.log('❌ Test 2 FAILED: Server not running:', error.message);
      console.log('   Make sure to start the server first: cd Server && npm run dev');
    }
    
    console.log('\n📋 Manual Testing Checklist:');
    console.log('1. ✅ Start the server: cd Server && npm run dev');
    console.log('2. ✅ Start the client: cd Client && npm run dev');
    console.log('3. 🔐 Login as regular admin (not superadmin)');
    console.log('4. 📝 Perform CRUD operations (create/update/delete users or MDAs)');
    console.log('5. 🔐 Login as superadmin');
    console.log('6. 📊 Navigate to Activity Logs page');
    console.log('7. ✅ Verify activities from step 4 are visible');
    console.log('8. ✅ Verify superadmin login is NOT logged');
    console.log('9. 🔍 Test search functionality');
    console.log('10. 📅 Test date filtering');
    console.log('11. 📤 Test CSV export');
    
    console.log('\n🎯 Expected Results:');
    console.log('- Only regular admin activities should be visible');
    console.log('- Superadmin activities should be filtered out');
    console.log('- All CRUD operations should be logged');
    console.log('- Search and filtering should work properly');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testActivityLogs();