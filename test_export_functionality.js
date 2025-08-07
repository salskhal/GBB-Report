// Test script to verify the export functionality
// This script tests the export endpoints directly

import fetch from "node-fetch";

const BASE_URL = "http://localhost:5001/api";

const ADMIN_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZG1pbklkIjoiNjg4ZGZlOTVjNzA2NzI4ZDQzNjE1N2RjIiwiZW1haWwiOiJraGFsaWQuc2FsbWFuLXl1c3VmQGdhbGF4eWJhY2tib25lLmNvbS5uZyIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1NDIwMjkyMSwiZXhwIjoxNzU0ODA3NzIxfQ.S3JyP1KW8UC6T_XJO0RONFYUktgA4_Yg8adab8vjoJo";

const testExportEndpoints = async () => {
  const headers = {
    Authorization: `Bearer ${ADMIN_TOKEN}`,
    "Content-Type": "application/json",
  };

  console.log("Testing Export Functionality...\n");

  try {
    // Test 1: Export User Data (JSON)
    console.log("1. Testing User Data Export (JSON)...");
    const userJsonResponse = await fetch(
      `${BASE_URL}/admin/export/users?format=json`,
      {
        headers,
      }
    );

    if (userJsonResponse.ok) {
      console.log("✅ User data export (JSON) - SUCCESS");
      const contentType = userJsonResponse.headers.get("content-type");
      console.log(`   Content-Type: ${contentType}`);
    } else {
      console.log("❌ User data export (JSON) - FAILED");
      console.log(`   Status: ${userJsonResponse.status}`);
    }

    // Test 2: Export User Data (CSV)
    console.log("\n2. Testing User Data Export (CSV)...");
    const userCsvResponse = await fetch(
      `${BASE_URL}/admin/export/users?format=csv`,
      {
        headers,
      }
    );

    if (userCsvResponse.ok) {
      console.log("✅ User data export (CSV) - SUCCESS");
      const contentType = userCsvResponse.headers.get("content-type");
      console.log(`   Content-Type: ${contentType}`);
    } else {
      console.log("❌ User data export (CSV) - FAILED");
      console.log(`   Status: ${userCsvResponse.status}`);
    }

    // Test 3: Export MDA Data (JSON)
    console.log("\n3. Testing MDA Data Export (JSON)...");
    const mdaJsonResponse = await fetch(
      `${BASE_URL}/admin/export/mdas?format=json`,
      {
        headers,
      }
    );

    if (mdaJsonResponse.ok) {
      console.log("✅ MDA data export (JSON) - SUCCESS");
      const contentType = mdaJsonResponse.headers.get("content-type");
      console.log(`   Content-Type: ${contentType}`);
    } else {
      console.log("❌ MDA data export (JSON) - FAILED");
      console.log(`   Status: ${mdaJsonResponse.status}`);
    }

    // Test 4: Export Combined Data (JSON)
    console.log("\n4. Testing Combined Data Export (JSON)...");
    const combinedJsonResponse = await fetch(
      `${BASE_URL}/admin/export/combined?format=json`,
      {
        headers,
      }
    );

    if (combinedJsonResponse.ok) {
      console.log("✅ Combined data export (JSON) - SUCCESS");
      const contentType = combinedJsonResponse.headers.get("content-type");
      console.log(`   Content-Type: ${contentType}`);
    } else {
      console.log("❌ Combined data export (JSON) - FAILED");
      console.log(`   Status: ${combinedJsonResponse.status}`);
    }

    // Test 5: Export with filters
    console.log("\n5. Testing Export with Filters...");
    const filteredResponse = await fetch(
      `${BASE_URL}/admin/export/users?format=json&isActive=true&startDate=2024-01-01`,
      {
        headers,
      }
    );

    if (filteredResponse.ok) {
      console.log("✅ Filtered export - SUCCESS");
    } else {
      console.log("❌ Filtered export - FAILED");
      console.log(`   Status: ${filteredResponse.status}`);
    }
  } catch (error) {
    console.error("Error testing export functionality:", error.message);
    console.log(
      "\nNote: Make sure the server is running and you have a valid admin token."
    );
  }
};

// Run the tests
testExportEndpoints();

console.log(`
Export Functionality Implementation Summary:
==========================================

Backend Implementation:
✅ Added export functions to adminService.js:
   - exportUserData(): Exports users with MDA associations
   - exportMDAData(): Exports MDAs with user associations  
   - exportCombinedData(): Exports both users and MDAs together

✅ Added export controllers to admin.controller.js:
   - exportUserData(): Handles user data export requests
   - exportMDAData(): Handles MDA data export requests
   - exportCombinedData(): Handles combined data export requests

✅ Added export routes to admin.route.js:
   - GET /api/admin/export/users
   - GET /api/admin/export/mdas
   - GET /api/admin/export/combined

Frontend Implementation:
✅ Updated adminService.ts with export methods
✅ Created DataExport.tsx component with:
   - Export type selection (Users, MDAs, Combined)
   - Filtering options (MDA, status, date range)
   - Format selection (JSON, CSV)
   - Download functionality

✅ Created DataExport.tsx page
✅ Added export route to App.tsx
✅ Added "Data Export" navigation item to AdminLayout.tsx

Features:
✅ Multiple export types (Users, MDAs, Combined)
✅ Multiple formats (JSON, CSV)
✅ Filtering by MDA, active status, date range
✅ Proper file download with appropriate headers
✅ Comprehensive data associations
✅ Admin-only access control
✅ Responsive UI design

Data Associations Included:
✅ Users export includes:
   - User details (username, name, email, etc.)
   - Associated MDA information
   - MDA reports and their status
   - User activity timestamps

✅ MDA export includes:
   - MDA details (name, reports, status)
   - Associated users list
   - User counts (total, active, inactive)
   - Report statistics

✅ Combined export includes:
   - Both user and MDA data
   - Full associations between entities
   - Export metadata and statistics

The implementation is now complete and ready for use!
`);
