# MDA System Enhancement Specification

## Overview
This document outlines the required changes to enhance the MDA (Ministry, Department, Agency) reporting system with improved authentication, multi-report support, super admin functionality, and activity logging.

## Current System Analysis

### Current Authentication Flow
- **User Login**: Email + Password + MDA Selection (dropdown)
- **Admin Login**: Email + Password
- **User Model**: name, email, password, role, mdaId, isActive, lastLogin
- **Admin Model**: name, email, password, role (superadmin), isActive, lastLogin
- **MDA Model**: name, reportUrl (single), isActive

### Current UI Structure
- **Client Pages**: Login, AdminLogin, Dashboard (Overview, Profile, Report), Admin (Overview, UserManagement, MDAManagement)
- **Authentication**: Email-based login for both users and admins
- **Report Display**: Single iframe showing one report URL per MDA

## Required Changes

### 1. Authentication System Overhaul

#### 1.1 User Login Changes
**Current**: Email + Password + MDA Selection
**New**: Username (MDA Name) + Password

**Implementation Requirements**:

##### Backend Changes:
- **User Model Updates**:
  - Add `username` field (required, unique, trim, maxlength: 50)
  - Change `email` field to `contactEmail` (still required for contact purposes, but not for login)
  - Add `mdaReference` field (string reference to MDA name or code)
  - Remove `mdaId` ObjectId reference (replace with string reference)
  - Update indexes: remove email index, add username index

- **Authentication Service Updates**:
  - Modify `loginUser` function to authenticate with username instead of email
  - Remove MDA selection requirement from login process
  - Update JWT token payload to include username instead of email
  - Update user lookup logic to use username

- **API Endpoint Changes**:
  - Update `/auth/login` endpoint to accept `{ username, password }` instead of `{ email, password, mdaId }`
  - Remove `/auth/mdas` endpoint (no longer needed for login dropdown)
  - Update user creation endpoints to handle new field structure

##### Frontend Changes:
- **Login Form Updates**:
  - Replace email input with username input
  - Remove MDA dropdown selection
  - Update form validation for username field
  - Update login service calls

- **User Management Updates**:
  - Update user creation forms to include username and contactEmail separately
  - Update user display components to show username as login identifier
  - Update user editing forms to handle new field structure

#### 1.2 Admin Role System Enhancement
**Current**: Single superadmin role
**New**: Hierarchical admin system with super admin and regular admins

**Implementation Requirements**:

##### Backend Changes:
- **Admin Model Updates**:
  - Update `role` enum to include `['superadmin', 'admin']`
  - Add `canBeDeleted` field (boolean, default: true, false for super admin)
  - Add `createdBy` field (ObjectId reference to creating admin)

- **Super Admin Seeding**:
  - Create seed script for initial super admin account
  - Ensure super admin cannot be deleted (`canBeDeleted: false`)

- **Admin Management Endpoints**:
  - Add `/admin/admins` CRUD endpoints for admin management
  - Add role-based access control middleware
  - Implement admin creation/deletion restrictions

##### Frontend Changes:
- **Admin Management Page**:
  - Create new admin management interface
  - Add admin creation/editing forms
  - Implement delete restrictions for super admin
  - Add role-based UI elements

### 2. Multi-Report URL Support

#### 2.1 MDA Model Enhancement
**Current**: Single `reportUrl` field
**New**: Array of report objects with titles and URLs

**Implementation Requirements**:

##### Backend Changes:
- **MDA Model Updates**:
  ```javascript
  reports: [{
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    url: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: function(url) {
          return /^https?:\/\/.+/.test(url);
        },
        message: 'Please provide a valid URL'
      }
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }]
  ```
  - Remove single `reportUrl` field
  - Add validation for reports array (minimum 1 report)
  - Update MDA creation/update logic

##### Frontend Changes:
- **MDA Management Updates**:
  - Update MDA creation/editing forms to handle multiple reports
  - Add dynamic report addition/removal functionality
  - Update MDA display components to show all reports

- **User Dashboard Updates**:
  - Replace single report iframe with report selection interface
  - Add report tabs or dropdown for multiple reports
  - Update report display logic to handle selected report

#### 2.2 User Dashboard Enhancement
**Current**: Single report iframe
**New**: Multi-report interface with selection

**Implementation Requirements**:

##### Frontend Changes:
- **Report Selection Interface**:
  - Add report tabs or dropdown menu
  - Display report titles for easy identification
  - Maintain selected report state
  - Update iframe source based on selection

- **Report Display Logic**:
  - Handle MDAs with single vs multiple reports
  - Provide fallback for MDAs with no reports
  - Add loading states for report switching

### 3. Activity Logging System

#### 3.1 Activity Model Creation
**New Model**: Admin activity tracking

**Implementation Requirements**:

##### Backend Changes:
- **Activity Model**:
  ```javascript
  {
    adminId: { type: ObjectId, ref: 'Admin', required: true },
    adminName: { type: String, required: true },
    action: { 
      type: String, 
      enum: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'],
      required: true 
    },
    resourceType: {
      type: String,
      enum: ['USER', 'MDA', 'ADMIN'],
      required: true
    },
    resourceId: { type: String },
    resourceName: { type: String },
    details: { type: Object }, // Additional action details
    ipAddress: { type: String },
    userAgent: { type: String },
    timestamp: { type: Date, default: Date.now }
  }
  ```

- **Activity Logging Middleware**:
  - Create middleware to automatically log admin actions
  - Capture request details (IP, user agent)
  - Log CRUD operations on users, MDAs, and admins

- **Activity Service**:
  - Create service for activity logging
  - Add methods for different activity types
  - Implement activity retrieval with filtering/pagination

##### Frontend Changes:
- **Activity Dashboard**:
  - Create activity log viewing interface
  - Add filtering by admin, action type, resource type, date range
  - Implement pagination for large activity logs
  - Add export functionality for activity reports

#### 3.2 Activity Logging Integration
**Implementation Requirements**:

##### Backend Integration:
- **Controller Updates**:
  - Add activity logging to all admin CRUD operations
  - Log login/logout activities
  - Include relevant context in activity logs

- **API Endpoints**:
  - Add `/admin/activities` endpoint for super admin
  - Implement filtering and pagination
  - Add activity export endpoint

##### Frontend Integration:
- **Navigation Updates**:
  - Add "Activity Log" menu item for super admin
  - Implement role-based menu visibility

## Database Migration Requirements

### Migration Script Needs:
1. **User Collection Migration**:
   - Add `username` field to existing users
   - Rename `email` to `contactEmail`
   - Add `mdaReference` field
   - Remove `mdaId` ObjectId references
   - Update indexes

2. **MDA Collection Migration**:
   - Convert single `reportUrl` to `reports` array
   - Migrate existing URLs to report objects with default titles

3. **Admin Collection Migration**:
   - Add `canBeDeleted` field to existing admins
   - Set super admin as non-deletable
   - Add `createdBy` references where applicable

## UI/UX Changes Summary

### Login Interface Changes:
- **User Login**: Remove MDA dropdown, replace email with username field
- **Form Validation**: Update validation rules for username
- **Error Messages**: Update error handling for username-based authentication

### Dashboard Changes:
- **Report Interface**: Add multi-report selection (tabs/dropdown)
- **Report Display**: Dynamic iframe source based on selection
- **Navigation**: Maintain report selection state

### Admin Interface Changes:
- **Admin Management**: New admin CRUD interface
- **Activity Logging**: New activity dashboard for super admin
- **Role-Based Access**: Different UI elements based on admin role
- **MDA Management**: Enhanced forms for multiple reports per MDA

### User Management Changes:
- **User Forms**: Update to handle username and contactEmail separately
- **User Display**: Show username as primary identifier
- **User Search**: Update search functionality for username

## Security Considerations

### Authentication Security:
- Maintain password hashing and validation
- Update JWT token structure for username-based auth
- Implement proper session management

### Authorization Security:
- Role-based access control for admin functions
- Super admin privilege protection
- Activity logging for audit trails

### Data Security:
- Validate all new field inputs
- Sanitize report URLs and titles
- Protect against unauthorized admin creation

## Testing Requirements

### Backend Testing:
- Unit tests for new authentication flow
- Integration tests for multi-report functionality
- Activity logging verification tests
- Migration script testing

### Frontend Testing:
- Login flow testing with username
- Multi-report interface testing
- Admin management functionality testing
- Activity dashboard testing

## Implementation Priority

### Phase 1: Authentication Changes
1. Backend user model and authentication updates
2. Frontend login interface updates
3. Database migration for user authentication

### Phase 2: Multi-Report Support
1. MDA model updates for multiple reports
2. Frontend report selection interface
3. Database migration for report structure

### Phase 3: Admin Management & Activity Logging
1. Admin role system implementation
2. Activity logging system
3. Admin and activity management interfaces

### Phase 4: Testing & Refinement
1. Comprehensive testing of all changes
2. UI/UX refinements
3. Performance optimization
4. Documentation updates

## Files Requiring Changes

### Backend Files:
- `Server/src/models/User.js` - Major updates for username auth
- `Server/src/models/Admin.js` - Role system updates
- `Server/src/models/MDA.js` - Multi-report structure
- `Server/src/models/Activity.js` - New model
- `Server/src/service/authService.js` - Authentication logic updates
- `Server/src/controller/auth.controller.js` - Login endpoint updates
- `Server/src/controller/user.controller.js` - User management updates
- `Server/src/controller/admin.controller.js` - New admin management
- `Server/src/controller/activity.controller.js` - New activity controller
- `Server/src/routes/` - All route files for new endpoints
- `Server/src/middleware/` - Activity logging middleware

### Frontend Files:
- `Client/src/components/login/login-form.tsx` - Username-based login
- `Client/src/pages/auth/Login.tsx` - Login interface updates
- `Client/src/pages/dashboard/Report.tsx` - Multi-report interface
- `Client/src/pages/admin/UserManagement.tsx` - Username handling
- `Client/src/pages/admin/MDAManagement.tsx` - Multi-report management
- `Client/src/pages/admin/AdminManagement.tsx` - New admin interface
- `Client/src/pages/admin/ActivityLog.tsx` - New activity dashboard
- `Client/src/services/authService.ts` - Authentication service updates
- `Client/src/services/adminService.ts` - Admin management services
- `Client/src/store/authStore.ts` - Authentication state updates

This specification provides a comprehensive roadmap for implementing all the requested changes while maintaining system integrity and user experience.