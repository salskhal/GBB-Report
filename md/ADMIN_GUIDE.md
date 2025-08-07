# MDA System Administrator Guide

## Overview

This comprehensive guide covers all administrative functions in the enhanced MDA (Ministry, Department, Agency) reporting system. As an administrator, you have access to user management, MDA configuration, and system oversight capabilities.

## Table of Contents

1. [Administrator Roles](#administrator-roles)
2. [Getting Started](#getting-started)
3. [User Management](#user-management)
4. [MDA Management](#mda-management)
5. [Admin Management (Super Admin Only)](#admin-management-super-admin-only)
6. [Activity Monitoring (Super Admin Only)](#activity-monitoring-super-admin-only)
7. [System Migration](#system-migration)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)
10. [FAQ](#frequently-asked-questions)

---

## Administrator Roles

### Role Hierarchy

The system supports two levels of administrators:

#### Super Administrator
- **Full system access**: Can manage all users, MDAs, and other administrators
- **Activity monitoring**: Can view and export all administrative activity logs
- **Admin management**: Can create, update, and delete other administrator accounts
- **System oversight**: Has access to all system functions and reports
- **Cannot be deleted**: Super admin accounts are protected from deletion

#### Administrator
- **User management**: Can create, update, and delete user accounts
- **MDA management**: Can create, update, and delete MDA configurations
- **Limited access**: Cannot manage other administrators or view activity logs
- **Can be managed**: Super admins can modify or delete admin accounts

### Determining Your Role

To check your administrator role:
1. Log in to the admin panel
2. Your role is displayed in the header next to your name
3. Available menu options indicate your permission level

---

## Getting Started

### Admin Login Process

1. Navigate to the admin login page (typically `/admin/login`)
2. Enter your email address and password
3. Click "Login"
4. You'll be redirected to the admin dashboard

**Note**: Administrators use email-based login, while users use username-based login.

### Admin Dashboard Overview

After logging in, you'll see:

1. **Navigation Menu**:
   - Dashboard (overview)
   - User Management
   - MDA Management
   - Admin Management (Super Admin only)
   - Activity Logs (Super Admin only)

2. **Dashboard Statistics**:
   - Total users
   - Total MDAs
   - Recent activity
   - System status

3. **Quick Actions**:
   - Create new user
   - Create new MDA
   - View recent activities

---

## User Management

### Understanding the New User System

The enhanced system uses username-based authentication:
- **Username**: Organization-based identifier (e.g., "ministry-of-health")
- **Contact Email**: For communication purposes (not for login)
- **MDA Reference**: String reference to the user's organization

### Viewing Users

#### User List
1. Navigate to "User Management"
2. View all users with pagination
3. Use search and filters:
   - Search by username or contact email
   - Filter by MDA
   - Filter by active status

#### User Information Display
Each user entry shows:
- Username (primary identifier)
- Full name
- Contact email
- Associated MDA
- Active status
- Last login date
- Creation date

### Creating New Users

#### Step-by-Step User Creation

1. **Access Creation Form**:
   - Click "Create User" button
   - Fill out the user creation form

2. **Required Information**:
   - **Username**: Unique identifier (typically MDA-based)
   - **Full Name**: User's complete name
   - **Contact Email**: Valid email address
   - **Password**: Initial password (user can change later)
   - **MDA Reference**: Select from existing MDAs

3. **Username Guidelines**:
   - Use lowercase letters and hyphens
   - Base on organization name (e.g., "ministry-of-health")
   - Ensure uniqueness across the system
   - Avoid special characters except hyphens

4. **Validation Rules**:
   - Username: 3-50 characters, unique
   - Name: 2-100 characters
   - Email: Valid email format
   - Password: Minimum 6 characters
   - MDA Reference: Must exist in system

#### Best Practices for User Creation
- Use consistent username patterns
- Verify MDA exists before creating users
- Use strong initial passwords
- Document username patterns for your organization

### Updating Users

#### Editable Fields
- Full name
- Contact email
- MDA reference
- Active status

#### Non-Editable Fields
- Username (contact super admin if change needed)
- Creation date
- User ID

#### Update Process
1. Find the user in the user list
2. Click "Edit" button
3. Modify the desired fields
4. Save changes
5. User will be notified of changes (if applicable)

### User Password Management

#### Resetting User Passwords
1. Navigate to the user's profile
2. Click "Reset Password"
3. Enter a new temporary password
4. Inform the user of the new password
5. Advise user to change password on next login

#### Password Requirements
- Minimum 6 characters
- Mix of letters and numbers recommended
- No maximum length limit
- Case-sensitive

### Deactivating Users

#### Soft Delete Process
1. Edit the user account
2. Set "Active Status" to "Inactive"
3. Save changes
4. User will no longer be able to log in
5. User data is preserved for audit purposes

#### When to Deactivate Users
- Employee leaves organization
- Account security concerns
- Temporary access suspension
- Organizational restructuring

---

## MDA Management

### Understanding Multi-Report MDAs

The enhanced system supports multiple reports per MDA:
- Each MDA can have multiple reports with descriptive titles
- Reports are displayed as tabs or dropdown for users
- Each report has its own URL and active status

### Viewing MDAs

#### MDA List Display
- MDA name
- Number of configured reports
- Active status
- Creation date
- Quick actions (edit, delete)

#### MDA Details
Click on an MDA to view:
- Complete report list with titles and URLs
- Associated users
- Configuration history
- Status information

### Creating New MDAs

#### MDA Creation Process

1. **Basic Information**:
   - **MDA Name**: Official organization name
   - Must be unique in the system
   - Used for user MDA references

2. **Report Configuration**:
   - **Minimum Requirement**: At least one report
   - **Report Fields**:
     - Title: Descriptive name for the report
     - URL: Valid HTTP/HTTPS URL to the report
     - Active Status: Whether report is available to users

3. **Validation Requirements**:
   - MDA name: 2-100 characters, unique
   - Report title: 2-100 characters
   - Report URL: Valid HTTP/HTTPS format
   - At least one active report required

#### Example MDA Configuration

```
MDA Name: Ministry of Health
Reports:
  1. Title: "Health Statistics Dashboard"
     URL: "https://dashboard.health.gov/stats"
     Active: Yes
  
  2. Title: "Budget and Finance Report"
     URL: "https://dashboard.health.gov/budget"
     Active: Yes
  
  3. Title: "Performance Metrics"
     URL: "https://dashboard.health.gov/performance"
     Active: No (under maintenance)
```

### Managing MDA Reports

#### Adding Reports to Existing MDAs
1. Edit the MDA
2. Click "Add Report"
3. Enter report title and URL
4. Set active status
5. Save changes

#### Modifying Existing Reports
1. Edit the MDA
2. Find the report to modify
3. Update title, URL, or active status
4. Save changes

#### Removing Reports
1. Edit the MDA
2. Click "Remove" next to the report
3. Confirm deletion
4. **Note**: Must maintain at least one report per MDA

#### Report URL Guidelines
- Use HTTPS when possible for security
- Ensure URLs are accessible from user networks
- Test URLs before adding to system
- Consider mobile compatibility
- Verify report permissions and access

### MDA Status Management

#### Deactivating MDAs
- Set MDA status to "Inactive"
- Users associated with inactive MDAs cannot log in
- MDA data is preserved for reactivation

#### Reactivating MDAs
- Change status back to "Active"
- Ensure at least one active report exists
- Verify associated users can access reports

---

## Admin Management (Super Admin Only)

### Admin Account Overview

Super administrators can manage other admin accounts:
- Create new administrator accounts
- Modify existing admin permissions
- Deactivate admin accounts
- Monitor admin activities

### Creating Administrator Accounts

#### Admin Creation Process

1. **Access Admin Management**:
   - Navigate to "Admin Management" (Super Admin only)
   - Click "Create Admin"

2. **Required Information**:
   - **Full Name**: Administrator's complete name
   - **Email Address**: Valid email (used for login)
   - **Password**: Initial password
   - **Role**: Choose "Admin" or "Super Admin"

3. **Role Selection Guidelines**:
   - **Admin**: For regional or departmental administrators
   - **Super Admin**: Only for system-wide administrators
   - Limit Super Admin accounts to essential personnel

#### Admin Account Security
- Use strong passwords for admin accounts
- Require password changes on first login
- Monitor admin login activities
- Regular review of admin permissions

### Managing Existing Admins

#### Viewing Admin Information
- Admin name and email
- Role (Admin/Super Admin)
- Creation date and creator
- Last login information
- Active status

#### Updating Admin Accounts
- Modify name and email
- Change role (with caution)
- Update active status
- Reset passwords

#### Admin Account Restrictions
- Super Admin accounts cannot be deleted
- Cannot delete your own account
- Role changes require careful consideration
- Maintain audit trail of admin changes

### Admin Security Best Practices

#### Account Management
- Regular review of admin accounts
- Remove unused admin accounts
- Monitor admin login patterns
- Implement strong password policies

#### Permission Management
- Follow principle of least privilege
- Regular permission audits
- Document admin responsibilities
- Clear role definitions

---

## Activity Monitoring (Super Admin Only)

### Activity Logging System

The system automatically logs all administrative activities:
- User creation, updates, and deletions
- MDA configuration changes
- Admin account management
- Login and logout events
- System configuration changes

### Viewing Activity Logs

#### Activity Log Interface
1. Navigate to "Activity Logs"
2. View chronological list of activities
3. Use filters and search options
4. Export logs for external analysis

#### Activity Information Display
Each log entry shows:
- Timestamp of activity
- Administrator who performed the action
- Action type (CREATE, UPDATE, DELETE, LOGIN, LOGOUT)
- Resource affected (USER, MDA, ADMIN)
- Resource name/identifier
- IP address and user agent
- Additional details

### Filtering and Searching Activities

#### Available Filters
- **Admin**: Filter by specific administrator
- **Action Type**: CREATE, UPDATE, DELETE, LOGIN, LOGOUT
- **Resource Type**: USER, MDA, ADMIN
- **Date Range**: Custom date range selection
- **IP Address**: Filter by source IP

#### Search Functionality
- Search by admin name
- Search by resource name
- Search by IP address
- Full-text search in activity details

### Activity Log Export

#### Export Options
1. **CSV Format**: For spreadsheet analysis
2. **JSON Format**: For programmatic processing
3. **Date Range Selection**: Export specific time periods
4. **Filtered Exports**: Export only filtered results

#### Export Use Cases
- Compliance reporting
- Security audits
- Performance analysis
- Incident investigation

### Activity Statistics

#### Available Statistics
- Total activities by time period
- Activity breakdown by type
- Admin activity comparison
- Resource modification frequency
- Login/logout patterns

#### Using Statistics for System Management
- Identify high-activity periods
- Monitor admin workload distribution
- Detect unusual activity patterns
- Plan system maintenance windows

---

## System Migration

### Understanding the Migration Process

The system has been migrated from the previous version with significant changes:

#### Database Changes
- User email field renamed to contactEmail
- Added username field for users
- MDA reportUrl converted to reports array
- Added admin hierarchy and activity logging

#### Migration Scripts

The system includes migration scripts for:
1. **User Collection Migration**: Email to contactEmail, added usernames
2. **MDA Collection Migration**: Single report to multiple reports
3. **Admin Collection Migration**: Added role hierarchy and permissions

### Post-Migration Tasks

#### User Account Verification
1. Verify all users have proper usernames
2. Confirm MDA references are correct
3. Test user login functionality
4. Update user documentation

#### MDA Configuration Review
1. Verify report URLs are accessible
2. Confirm report titles are descriptive
3. Test multi-report functionality
4. Update MDA documentation

#### Admin Account Setup
1. Confirm super admin account exists
2. Verify admin role assignments
3. Test admin management functions
4. Set up activity monitoring

### Migration Troubleshooting

#### Common Migration Issues
- Username conflicts or duplicates
- Invalid MDA references
- Broken report URLs
- Permission assignment errors

#### Resolution Steps
1. Review migration logs
2. Identify specific issues
3. Use rollback procedures if necessary
4. Contact technical support for complex issues

---

## Best Practices

### User Management Best Practices

#### Username Standards
- Use consistent naming conventions
- Base usernames on organization names
- Use lowercase and hyphens only
- Document username patterns

#### Account Security
- Enforce strong password policies
- Regular password updates
- Monitor login activities
- Deactivate unused accounts promptly

#### Data Management
- Regular user data audits
- Maintain accurate contact information
- Document organizational changes
- Backup user data regularly

### MDA Management Best Practices

#### Report Configuration
- Use descriptive report titles
- Test all report URLs regularly
- Maintain at least one active report per MDA
- Document report purposes and audiences

#### URL Management
- Use HTTPS when possible
- Verify report accessibility
- Monitor report performance
- Plan for report maintenance

#### Organization Structure
- Align MDA names with official designations
- Regular review of MDA configurations
- Document organizational changes
- Maintain MDA hierarchy consistency

### Security Best Practices

#### Access Control
- Regular review of admin permissions
- Implement principle of least privilege
- Monitor admin activities
- Document access changes

#### Activity Monitoring
- Regular review of activity logs
- Set up alerts for unusual activities
- Export logs for compliance
- Investigate security incidents promptly

#### System Maintenance
- Regular system updates
- Monitor system performance
- Backup system data
- Plan for disaster recovery

---

## Troubleshooting

### Common User Issues

#### Login Problems
**Issue**: User cannot log in with new username
**Solutions**:
1. Verify username spelling and case
2. Check if user account is active
3. Confirm MDA reference is correct
4. Reset user password if needed

**Issue**: User sees "No reports available"
**Solutions**:
1. Check MDA has active reports configured
2. Verify report URLs are accessible
3. Confirm user's MDA reference is correct
4. Test report URLs manually

#### Report Access Issues
**Issue**: Reports not loading for users
**Solutions**:
1. Test report URLs from admin panel
2. Check report server status
3. Verify network connectivity
4. Review browser compatibility

### Common Admin Issues

#### Admin Panel Access
**Issue**: Cannot access admin management features
**Solutions**:
1. Verify admin role (Super Admin required)
2. Check session hasn't expired
3. Confirm account is active
4. Review permission settings

#### Activity Log Issues
**Issue**: Activity logs not showing recent activities
**Solutions**:
1. Check activity logging middleware is active
2. Verify database connectivity
3. Review log retention settings
4. Check for system errors

### System Performance Issues

#### Slow Response Times
**Causes and Solutions**:
1. **Database Performance**: Optimize queries, check indexes
2. **Network Issues**: Verify connectivity, check bandwidth
3. **Server Load**: Monitor server resources, scale if needed
4. **Browser Issues**: Clear cache, update browser

#### Report Loading Issues
**Causes and Solutions**:
1. **External Report Servers**: Check report server status
2. **Network Connectivity**: Verify network access to report URLs
3. **Browser Compatibility**: Test with different browsers
4. **URL Configuration**: Verify report URLs are correct

### Data Integrity Issues

#### User Data Inconsistencies
**Issue**: User MDA references don't match existing MDAs
**Solutions**:
1. Run data validation scripts
2. Update user MDA references
3. Create missing MDAs if needed
4. Document data corrections

#### Report Configuration Problems
**Issue**: MDA reports not displaying correctly
**Solutions**:
1. Verify report URL accessibility
2. Check report active status
3. Test report URLs manually
4. Update report configurations

---

## Frequently Asked Questions

### General Administration

**Q: What's the difference between Admin and Super Admin roles?**
A: Admins can manage users and MDAs. Super Admins can additionally manage other admins and view activity logs. Super Admins have full system access.

**Q: Can I change a user's username after creation?**
A: Usernames cannot be changed through the admin interface. Contact technical support for username changes as they require database-level modifications.

**Q: How do I know if the system migration was successful?**
A: Check that all users can log in with their new usernames, all MDAs have properly configured reports, and admin functions work correctly.

### User Management

**Q: Why do users now use usernames instead of emails for login?**
A: Username-based login aligns with organizational naming conventions and simplifies the login process by eliminating MDA selection.

**Q: What happens to a user's access when I change their MDA reference?**
A: The user will see reports from the new MDA on their next login. Ensure the new MDA has properly configured reports.

**Q: Can multiple users have the same username?**
A: No, usernames must be unique across the entire system. The system will prevent duplicate username creation.

### MDA Management

**Q: What's the minimum number of reports an MDA must have?**
A: Each MDA must have at least one active report. Users cannot access MDAs with no active reports.

**Q: Can I temporarily disable a report without deleting it?**
A: Yes, set the report's active status to "Inactive". Users won't see inactive reports, but the configuration is preserved.

**Q: What happens if a report URL becomes inaccessible?**
A: Users will see an error when trying to access that report. Update the URL or deactivate the report until it's fixed.

### Security and Monitoring

**Q: How long are activity logs retained?**
A: Activity logs are retained according to your organization's data retention policy. Super Admins can configure log cleanup schedules.

**Q: Can I see who created or modified a specific user account?**
A: Yes, check the activity logs for CREATE and UPDATE actions on the specific user. All administrative actions are logged.

**Q: What should I do if I suspect unauthorized admin activity?**
A: Immediately review activity logs, check for unusual login patterns, verify admin account integrity, and contact technical support if needed.

### Technical Issues

**Q: What browsers are supported for admin functions?**
A: The admin panel works with modern browsers: Chrome 90+, Firefox 88+, Safari 14+, and Edge 90+.

**Q: Can I bulk import users or MDAs?**
A: The current interface supports individual creation. Contact technical support for bulk import requirements.

**Q: How do I backup admin configurations?**
A: Activity logs serve as an audit trail. For full backups, coordinate with your technical support team for database backups.

---

## Contact and Support

### Getting Help

For administrative support:

1. **Technical Issues**: Contact your IT support team
2. **System Configuration**: Refer to this guide or contact system administrators
3. **User Training**: Use the User Guide and provide training sessions
4. **Security Concerns**: Immediately contact technical support

### Documentation Updates

This guide reflects the current system version (2.0). Updates will be provided as the system evolves.

**Last Updated**: January 2024
**Version**: 2.0.0
**Next Review**: Quarterly