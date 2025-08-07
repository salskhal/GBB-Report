// Test script to verify CRUD logging is working

const API_BASE = "http://localhost:5001/api";

// You'll need to replace these with actual tokens from your login
const ADMIN_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZG1pbklkIjoiNjg4ZGZlOTVjNzA2NzI4ZDQzNjE1N2RjIiwiZW1haWwiOiJraGFsaWQuc2FsbWFuLXl1c3VmQGdhbGF4eWJhY2tib25lLmNvbS5uZyIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1NDIwMjkyMSwiZXhwIjoxNzU0ODA3NzIxfQ.S3JyP1KW8UC6T_XJO0RONFYUktgA4_Yg8adab8vjoJo"; // Regular admin token
const SUPERADMIN_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZG1pbklkIjoiNjg4Y2EwMDFkZmU0MWY4MGE5NDQ2NGQwIiwiZW1haWwiOiJhZG1pbkBtZGFyZXBvcnRpbmcuZ292Iiwicm9sZSI6InN1cGVyYWRtaW4iLCJpYXQiOjE3NTQyMDI4NjMsImV4cCI6MTc1NDgwNzY2M30.5ygeLu7XDnbnDiDi-lnjlLMoyiELNo1MVa29a_yMbM0"; // Superadmin token

async function testCRUDLogging() {
  console.log("🧪 Testing CRUD Activity Logging...\n");

  try {
    // Test 1: Create a user as regular admin
    console.log("1️⃣ Testing CREATE operation (as regular admin)...");
    try {
      const createResponse = await fetch(`${API_BASE}/admin/users`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ADMIN_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Test User",
          username: "testuser123",
          contactEmail: "test@example.com",
          password: "password123",
          mdaId: "688effbf3a949e92b4231848", // Replace with actual MDA ID
        }),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(errorData.message || createResponse.statusText);
      }

      const createData = await createResponse.json();
      console.log("✅ User created successfully");
      console.log("   User ID:", createData.data._id);
    } catch (error) {
      console.log("❌ Failed to create user:", error.message);
    }

    // Test 2: Check if activities are being logged
    console.log("\n2️⃣ Checking activity logs (as superadmin)...");
    try {
      const activitiesResponse = await fetch(
        `${API_BASE}/admin/activities?limit=5`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${SUPERADMIN_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!activitiesResponse.ok) {
        const errorData = await activitiesResponse.json();
        throw new Error(errorData.message || activitiesResponse.statusText);
      }

      const activitiesData = await activitiesResponse.json();
      console.log("✅ Retrieved activity logs");
      console.log("   Total activities:", activitiesData.data.totalCount);
      console.log("   Recent activities:");

      activitiesData.data.activities.forEach((activity, index) => {
        console.log(
          `   ${index + 1}. ${activity.adminName} - ${activity.action} ${
            activity.resourceType
          } - ${activity.resourceName}`
        );
      });
    } catch (error) {
      console.log("❌ Failed to get activities:", error.message);
    }
  } catch (error) {
    console.error("💥 Test failed:", error.message);
  }

  console.log("\n📋 Manual Testing Instructions:");
  console.log("1. Start the server: cd Server && npm run dev");
  console.log("2. Login as regular admin and get the token");
  console.log("3. Login as superadmin and get the token");
  console.log("4. Replace the tokens in this script");
  console.log("5. Run this script: node test_crud_logging.js");
  console.log("6. Check server console for debug logs");
  console.log("7. Check activity logs page in the admin dashboard");
}

testCRUDLogging();
