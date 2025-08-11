#!/usr/bin/env node

/**
 * Test Activity Middleware Script
 * This script simulates the middleware behavior to test activity logging
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import Activity from "../models/Activity.js";
import Admin from "../models/Admin.js";

// Load environment variables
dotenv.config();

const testActivityMiddleware = async () => {
  try {
    console.log("🧪 Testing Activity Middleware Behavior...\n");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Get a test admin
    const testAdmin = await Admin.findOne();
    if (!testAdmin) {
      console.log("❌ No admin found - please create an admin first");
      return;
    }

    console.log(`Using admin: ${testAdmin.name} (${testAdmin.role})\n`);

    // Simulate middleware behavior
    const mockRequest = {
      method: 'POST',
      originalUrl: '/api/admin/users',
      admin: {
        id: testAdmin._id,
        name: testAdmin.name,
        role: testAdmin.role
      },
      body: {
        name: 'Test User',
        username: 'testuser',
        email: 'test@example.com'
      },
      ip: '127.0.0.1',
      get: (header) => {
        if (header === 'User-Agent') return 'Test User Agent';
        return null;
      }
    };

    const mockResponse = {
      statusCode: 201,
      data: {
        _id: 'test-user-id',
        name: 'Test User',
        username: 'testuser'
      }
    };

    // Test the middleware logic
    console.log("1. Testing middleware logic...");

    // Determine action from method
    const getActionFromMethod = (method) => {
      switch (method.toLowerCase()) {
        case 'post': return 'CREATE';
        case 'put':
        case 'patch': return 'UPDATE';
        case 'delete': return 'DELETE';
        default: return null;
      }
    };

    // Determine resource type from URL
    const getResourceTypeFromUrl = (url) => {
      if (url.includes('/users')) return 'USER';
      if (url.includes('/mdas')) return 'MDA';
      if (url.includes('/admins')) return 'ADMIN';
      return null;
    };

    const action = getActionFromMethod(mockRequest.method);
    const resourceType = getResourceTypeFromUrl(mockRequest.originalUrl);

    console.log(`   Action: ${action}`);
    console.log(`   Resource Type: ${resourceType}`);
    console.log(`   Has Admin: ${!!mockRequest.admin}`);
    console.log(`   Status Code: ${mockResponse.statusCode}`);

    if (!action || !resourceType || !mockRequest.admin) {
      console.log("❌ Middleware would skip logging due to missing requirements");
      return;
    }

    // Extract activity data like the middleware does
    const resourceId = mockResponse.data._id;
    const resourceName = mockResponse.data.name || mockResponse.data.username || 'Unknown';
    
    const activityData = {
      adminId: mockRequest.admin.id,
      adminName: mockRequest.admin.name,
      action,
      resourceType,
      resourceId: resourceId ? resourceId.toString() : null,
      resourceName,
      details: {
        method: mockRequest.method,
        url: mockRequest.originalUrl,
        created: mockResponse.data,
        timestamp: new Date()
      },
      ipAddress: mockRequest.ip || '127.0.0.1',
      userAgent: mockRequest.get('User-Agent') || 'Unknown'
    };

    console.log("\n2. Activity data to be logged:");
    console.log(JSON.stringify(activityData, null, 2));

    // Test logging
    console.log("\n3. Testing activity logging...");
    
    try {
      const result = await Activity.logActivity(activityData);
      if (result) {
        console.log("✅ Activity logged successfully!");
        console.log(`   Activity ID: ${result._id}`);
        console.log(`   Timestamp: ${result.timestamp}`);
      } else {
        console.log("❌ Activity logging returned null");
      }
    } catch (error) {
      console.log("❌ Activity logging failed:");
      console.log(`   Error: ${error.message}`);
      if (error.errors) {
        console.log("   Validation errors:");
        Object.keys(error.errors).forEach(field => {
          console.log(`     ${field}: ${error.errors[field].message}`);
        });
      }
    }

    // Check if activity was actually saved
    console.log("\n4. Verifying activity was saved...");
    const savedActivity = await Activity.findOne({
      adminId: testAdmin._id,
      action: 'CREATE',
      resourceType: 'USER'
    }).sort({ timestamp: -1 });

    if (savedActivity) {
      console.log("✅ Activity found in database:");
      console.log(`   ID: ${savedActivity._id}`);
      console.log(`   Action: ${savedActivity.action}`);
      console.log(`   Resource: ${savedActivity.resourceType}`);
      console.log(`   Admin: ${savedActivity.adminName}`);
      console.log(`   Timestamp: ${savedActivity.timestamp}`);
    } else {
      console.log("❌ Activity not found in database");
    }

    console.log("\n🎉 Middleware test completed!");

  } catch (error) {
    console.error("\n❌ Test failed:");
    console.error(error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 Database connection closed");
  }
};

// Run the test
testActivityMiddleware();