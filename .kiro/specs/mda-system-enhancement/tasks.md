# Implementation Plan

- [x] 1. Database Models and Schema Updates

  - Create new Activity model for admin action logging
  - Update User model to support username-based authentication
  - Update MDA model to support multiple reports with titles
  - Update Admin model to support hierarchical admin roles
  - _Requirements: 1.5, 2.5, 3.2, 6.1, 6.2, 7.4_

- [x] 1.1 Create Activity Model

  - Write Activity.js model with fields for adminId, adminName, action, resourceType, resourceId, resourceName, details, ipAddress, userAgent, timestamp
  - Add proper validation and indexing for activity tracking
  - Create enum constraints for action types (CREATE, UPDATE, DELETE, LOGIN, LOGOUT) and resource types (USER, MDA, ADMIN)
  - _Requirements: 4.1, 7.1, 7.2, 7.3, 7.4_

- [x] 1.2 Update User Model for Username Authentication

  - Add username field with unique constraint and proper validation
  - Rename email field to contactEmail while maintaining validation
  - Add mdaReference field as string reference to MDA name
  - Remove mdaId ObjectId reference and update related indexes
  - Update password hashing and comparison methods to work with new structure
  - _Requirements: 1.1, 1.5, 6.1, 6.2, 6.4_

- [x] 1.3 Update MDA Model for Multiple Reports

  - Replace single reportUrl field with reports array containing title and url objects
  - Add validation for reports array to ensure at least one report exists
  - Add isActive field to individual reports for granular control
  - Update MDA creation and validation logic for new report structure
  - _Requirements: 2.1, 2.2, 2.3, 5.1, 5.2, 5.3, 5.6_

- [x] 1.4 Update Admin Model for Hierarchical Roles

  - Update role enum to include both 'superadmin' and 'admin' options
  - Add canBeDeleted boolean field with default true (false for super admin)
  - Add createdBy field to track which admin created each admin account
  - Update admin validation and creation logic for new role system
  - _Requirements: 3.1, 3.2, 3.5, 3.6_

- [x] 2. Authentication System Overhaul

  - Update authentication service to support username-based login for users
  - Modify login controllers to handle new authentication flow
  - Update JWT token generation and validation for username-based auth
  - Create middleware for activity logging of authentication events
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 6.3, 7.1_

- [x] 2.1 Update Authentication Service for Username Login

  - Modify loginUser function to authenticate using username instead of email
  - Remove MDA selection requirement from user login process
  - Update user lookup logic to find users by username and validate against MDA reference
  - Update JWT token payload to include username and MDA information
  - _Requirements: 1.1, 1.2, 1.4, 6.3_

- [x] 2.2 Update Authentication Controllers

  - Modify user login endpoint to accept username and password only
  - Remove getMDAs endpoint as it's no longer needed for user login
  - Update error handling for username-based authentication failures
  - Add activity logging for successful and failed login attempts
  - _Requirements: 1.1, 1.2, 1.3, 7.1_

- [x] 2.3 Create Activity Logging Middleware

  - Write middleware to automatically capture admin actions for CRUD operations
  - Extract IP address, user agent, and admin details from requests
  - Log authentication events (login/logout) with proper context
  - Ensure activity logging doesn't interfere with normal request processing
  - _Requirements: 4.1, 7.1, 7.2, 7.3_

- [x] 3. Admin Management System Implementation

  - Create admin management service with CRUD operations
  - Implement admin management controller with role-based access control
  - Add admin management API endpoints with proper authorization
  - Create super admin seeding functionality
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 3.1 Create Admin Management Service

  - Write adminService.js with functions for creating, updating, deleting, and retrieving admins
  - Implement role-based access control logic for admin operations
  - Add validation to prevent super admin deletion and ensure proper role assignments
  - Include activity logging calls for all admin management operations
  - _Requirements: 3.2, 3.3, 3.4, 3.5_

- [x] 3.2 Implement Admin Management Controller

  - Create admin.controller.js with endpoints for admin CRUD operations
  - Add middleware to restrict admin management to super admin only
  - Implement proper error handling for admin creation, update, and deletion
  - Add validation for admin data and role assignments
  - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 3.3 Create Admin Management Routes

  - Add routes for GET, POST, PUT, DELETE operations on /admin/admins endpoints
  - Implement proper middleware for authentication and authorization
  - Add route protection to ensure only super admin can access admin management
  - Include activity logging middleware for all admin management routes
  - _Requirements: 3.2, 3.6_

- [x] 3.4 Create Super Admin Seeding Script

  - Write seed script to create initial super admin account if none exists
  - Set canBeDeleted to false for the super admin account
  - Include proper error handling and validation in seeding process
  - Add documentation for super admin account setup and management
  - _Requirements: 3.1_

- [x] 4. Activity Logging System Implementation

  - Create activity service for logging and retrieving admin actions
  - Implement activity controller with filtering and pagination
  - Add activity logging API endpoints with proper access control
  - Create activity export functionality for audit purposes
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 4.1 Create Activity Service

  - Write activityService.js with functions for logging activities and retrieving activity logs
  - Implement filtering capabilities by admin, action type, resource type, and date range
  - Add pagination support for large activity log datasets
  - Include activity export functionality with proper data formatting
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 4.2 Implement Activity Controller

  - Create activity.controller.js with endpoints for retrieving and exporting activity logs
  - Add middleware to restrict activity log access to super admin only
  - Implement filtering and pagination query parameter handling
  - Add proper error handling for activity log retrieval and export
  - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 4.3 Create Activity Routes and Middleware Integration

  - Add routes for activity log retrieval and export endpoints
  - Integrate activity logging middleware into all admin CRUD operations
  - Ensure activity logging captures all required information without performance impact
  - Add route protection for activity log access
  - _Requirements: 4.1, 4.2, 4.6_

- [x] 5. Frontend Authentication Updates

  - Update user login form to use username instead of email
  - Remove MDA selection dropdown from user login interface
  - Update authentication service calls for new login flow
  - Update error handling and validation for username-based login
  - _Requirements: 1.1, 1.2, 1.3, 6.3_

- [x] 5.1 Update User Login Form Component

  - Modify login-form.tsx to replace email input with username input
  - Remove MDA selection dropdown and related query logic
  - Update form validation rules for username field requirements
  - Update submit handler to send username and password only
  - _Requirements: 1.1, 1.2_

- [x] 5.2 Update Authentication Service

  - Modify authService.ts to remove MDA parameter from login requests
  - Update LoginRequest interface to use username instead of email
  - Remove getMDAs function as it's no longer needed for user login
  - Update error handling for username-based authentication responses
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 5.3 Update Authentication Store and State Management

  - Modify auth store to handle username-based user data
  - Update user state structure to include username and contactEmail separately
  - Ensure proper state management for MDA information from authentication response
  - Update logout and session management for new authentication flow
  - _Requirements: 1.4, 6.4_

- [x] 6. Multi-Report Dashboard Implementation

  - Create multi-report interface component for report selection
  - Update report display logic to handle multiple reports per MDA
  - Implement report tabs or dropdown for easy report navigation
  - Add proper loading states and error handling for report switching
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 6.1 Create Multi-Report Interface Component

  - Write MultiReportInterface component with tabs or dropdown for report selection
  - Implement state management for selected report and report switching
  - Add proper loading states when switching between reports
  - Handle cases where MDA has single report, multiple reports, or no reports
  - _Requirements: 2.1, 2.2, 2.4, 2.5_

- [x] 6.2 Update Report Display Component

  - Modify Report.tsx to use new multi-report interface
  - Update report loading logic to handle selected report from interface
  - Implement proper error handling for missing or invalid report URLs
  - Add session state persistence for selected report across page refreshes
  - _Requirements: 2.3, 2.5, 2.6_

- [x] 6.3 Update Report Data Handling

  - Modify report data fetching to work with new MDA reports array structure
  - Update report URL validation and iframe source management
  - Implement proper fallback handling for MDAs with no configured reports
  - Add report title display and proper report identification
  - _Requirements: 2.1, 2.2, 2.5_

- [x] 7. Admin Interface Updates for Multi-Report Management

  - Update MDA management forms to handle multiple reports
  - Create dynamic report addition and removal functionality
  - Update MDA display components to show all configured reports
  - Add proper validation for report titles and URLs
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 7.1 Update MDA Management Forms

  - Modify CreateMDAModal and UpdateMDAModal to handle reports array
  - Add dynamic form fields for adding and removing reports
  - Implement proper validation for report titles and URLs
  - Update form submission logic to handle new MDA structure with multiple reports
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 7.2 Update MDA Display Components

  - Modify MDAManagement.tsx to display all reports for each MDA
  - Update MDA card layout to show multiple reports with titles
  - Add proper handling for MDAs with varying numbers of reports
  - Implement report URL validation and display in management interface
  - _Requirements: 5.6_

- [x] 7.3 Update MDA Service and API Integration

  - Modify MDA service calls to handle new reports array structure
  - Update MDA creation and update API calls for multiple reports
  - Add proper error handling for report validation failures
  - Ensure backward compatibility during transition period
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 8. User Management Updates for Username System

  - Update user creation and editing forms for username and contactEmail
  - Modify user display components to show username as primary identifier
  - Update user search and filtering to work with username
  - Add proper validation for username uniqueness and format
  - _Requirements: 1.5, 6.4, 6.5_

- [x] 8.1 Update User Management Forms

  - Modify CreateUserModal and UpdateUserModal to include username and contactEmail fields
  - Add proper validation for username uniqueness and format requirements
  - Update form submission logic to handle new user data structure
  - Implement proper error handling for username conflicts and validation failures
  - _Requirements: 1.5, 6.4_

- [x] 8.2 Update User Display and Search Components

  - Modify UserManagement.tsx to display username as primary identifier
  - Update user search functionality to search by both username and contactEmail
  - Add proper user filtering and sorting based on new field structure
  - Update user card layout to clearly distinguish between username and contactEmail
  - _Requirements: 6.4, 6.5_

- [x] 8.3 Update User Service Integration

  - Modify user service calls to handle new user data structure
  - Update user creation, update, and retrieval API calls
  - Add proper error handling for username-related operations
  - Ensure data consistency between frontend and backend user representations
  - _Requirements: 1.5, 6.4_

- [x] 9. Admin Management Frontend Implementation

  - Create admin management interface for super admin
  - Implement admin creation, editing, and deletion forms
  - Add role-based UI elements and access control
  - Create proper admin display with role indicators
  - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 9.1 Create Admin Management Page

  - Write AdminManagement.tsx page component for admin CRUD operations
  - Implement admin list display with role indicators and action buttons
  - Add proper access control to show admin management only to super admin
  - Include admin creation, editing, and deletion functionality
  - _Requirements: 3.2, 3.6_

- [x] 9.2 Create Admin Management Modal Components

  - Write CreateAdminModal component for admin creation
  - Write UpdateAdminModal component for admin editing
  - Add proper form validation for admin data and role selection
  - Implement deletion confirmation with super admin protection
  - _Requirements: 3.3, 3.4, 3.5_

- [x] 9.3 Create Admin Service Integration

  - Write admin service functions for CRUD operations
  - Add proper error handling for admin management operations
  - Implement role-based access control in service calls
  - Add proper state management for admin data
  - _Requirements: 3.2, 3.3, 3.4, 3.5_

- [x] 10. Activity Log Frontend Implementation

  - Create activity log viewing interface for super admin
  - Implement filtering and search functionality for activity logs
  - Add pagination support for large activity datasets
  - Create activity export functionality
  - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 10.1 Create Activity Log Page

  - Write ActivityLog.tsx page component for viewing admin activities
  - Implement activity list display with proper formatting and details
  - Add access control to restrict activity log viewing to super admin only
  - Include proper loading states and error handling for activity data
  - _Requirements: 4.2, 4.6_

- [x] 10.2 Create Activity Filtering and Search Components

  - Write ActivityFilters component for filtering by admin, action type, resource type, and date range
  - Implement search functionality for activity logs
  - Add pagination controls for large activity datasets
  - Create export functionality for activity reports
  - _Requirements: 4.3, 4.4, 4.5_

- [x] 10.3 Create Activity Service Integration

  - Write activity service functions for retrieving and filtering activity logs
  - Add proper error handling for activity log operations
  - Implement pagination and filtering in service calls
  - Add export functionality with proper data formatting
  - _Requirements: 4.2, 4.3, 4.4, 4.5_

- [x] 11. Database Migration Scripts

  - Create migration script for User collection updates
  - Create migration script for MDA collection updates
  - Create migration script for Admin collection updates
  - Add rollback capabilities and data validation
  - _Requirements: 6.1, 6.2, 5.5, 3.1_

- [x] 11.1 Create User Collection Migration Script

  - Write migration script to add username field to existing users
  - Rename email field to contactEmail while preserving data
  - Add mdaReference field and populate from existing mdaId relationships
  - Remove mdaId ObjectId references and update indexes accordingly
  - _Requirements: 6.1, 6.2_

- [x] 11.2 Create MDA Collection Migration Script

  - Write migration script to convert single reportUrl to reports array
  - Create report objects with title and url from existing reportUrl data
  - Set default titles for existing reports where titles are not available
  - Validate all report URLs and ensure proper data structure
  - _Requirements: 5.5_

- [x] 11.3 Create Admin Collection Migration Script

  - Write migration script to add canBeDeleted field to existing admins
  - Set canBeDeleted to false for super admin accounts
  - Add createdBy field where applicable and update role enum
  - Validate admin data and ensure proper role assignments
  - _Requirements: 3.1_

- [x] 11.4 Create Migration Validation and Rollback Scripts

  - Write validation scripts to verify migration success and data integrity
  - Create rollback scripts for each migration step
  - Add comprehensive error handling and logging for migration processes
  - Include performance monitoring and progress tracking for large datasets
  - _Requirements: 6.1, 6.2, 5.5, 3.1_

- [x] 12. Documentation and Deployment Preparation

  - Update API documentation for all new endpoints
  - Create user guides for new authentication and multi-report features
  - Write admin guides for admin management and activity logging
  - Prepare deployment scripts and monitoring setup
  - _Requirements: System documentation and deployment readiness_

- [x] 12.1 Update API Documentation

  - Document all new API endpoints for admin management and activity logging
  - Update existing endpoint documentation for authentication changes
  - Add proper request/response examples and error handling documentation
  - Include authentication and authorization requirements for each endpoint
  - _Requirements: Complete API documentation_

- [x] 12.2 Create User and Admin Guides

  - Write user guide for new username-based login and multi-report interface
  - Create admin guide for managing users with new username system
  - Write super admin guide for admin management and activity log monitoring
  - Include troubleshooting guides and FAQ sections
  - _Requirements: User documentation and training materials_

- [x] 12.3 Prepare Deployment and Monitoring
  - Create deployment scripts for database migrations and application updates
  - Set up monitoring and alerting for new authentication flows and admin activities
  - Prepare rollback procedures and emergency response plans
  - Include performance monitoring for new features and database changes
  - _Requirements: Production deployment readiness_
