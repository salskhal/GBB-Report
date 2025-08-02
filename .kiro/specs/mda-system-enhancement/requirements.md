# Requirements Document

## Introduction

This specification outlines the enhancement of the MDA (Ministry, Department, Agency) reporting system to improve user authentication, support multiple reports per MDA, implement hierarchical admin management, and add comprehensive activity logging for audit purposes.

## Requirements

### Requirement 1

**User Story:** As a user, I want to login using my username (MDA name) and password instead of email and MDA selection, so that the login process is simplified and more intuitive.

#### Acceptance Criteria

1. WHEN a user accesses the login page THEN the system SHALL display username and password fields only
2. WHEN a user enters their username and password THEN the system SHALL authenticate them without requiring MDA selection
3. WHEN a user enters an invalid username or password THEN the system SHALL display an appropriate error message
4. WHEN a user successfully logs in THEN the system SHALL redirect them to their dashboard with access to their MDA's reports
5. WHEN creating a new user THEN the system SHALL require username, contact email, password, and MDA reference fields

### Requirement 2

**User Story:** As a user, I want to view multiple reports for my MDA with clear titles, so that I can easily identify and access different types of reports available to my organization.

#### Acceptance Criteria

1. WHEN a user accesses their dashboard THEN the system SHALL display all available reports for their MDA
2. WHEN an MDA has multiple reports THEN the system SHALL provide a selection interface (tabs or dropdown) with report titles
3. WHEN a user selects a report THEN the system SHALL display the selected report in an iframe
4. WHEN an MDA has only one report THEN the system SHALL display it directly without selection interface
5. WHEN an MDA has no reports configured THEN the system SHALL display an appropriate message with contact information
6. WHEN a user switches between reports THEN the system SHALL maintain the selection state during the session

### Requirement 3

**User Story:** As a super admin, I want to create and manage other admin accounts, so that I can delegate administrative responsibilities while maintaining system oversight.

#### Acceptance Criteria

1. WHEN the system is initialized THEN there SHALL be one super admin account that cannot be deleted
2. WHEN a super admin accesses the admin panel THEN the system SHALL provide an admin management interface
3. WHEN a super admin creates a new admin THEN the system SHALL require name, email, and password fields
4. WHEN a super admin attempts to delete another admin THEN the system SHALL allow the deletion
5. WHEN a super admin attempts to delete themselves THEN the system SHALL prevent the deletion with an appropriate message
6. WHEN a regular admin accesses the admin panel THEN the system SHALL NOT display admin management options

### Requirement 4

**User Story:** As a super admin, I want to view all administrative activities performed by other admins, so that I can maintain audit trails and system oversight.

#### Acceptance Criteria

1. WHEN any admin performs a CRUD operation THEN the system SHALL log the activity with timestamp, admin details, and action performed
2. WHEN a super admin accesses the activity log THEN the system SHALL display all administrative activities
3. WHEN viewing the activity log THEN the system SHALL show admin name, action type, resource affected, timestamp, and IP address
4. WHEN a super admin filters the activity log THEN the system SHALL support filtering by admin, action type, resource type, and date range
5. WHEN the activity log has many entries THEN the system SHALL provide pagination for performance
6. WHEN a regular admin attempts to access activity logs THEN the system SHALL deny access

### Requirement 5

**User Story:** As an admin, I want to configure multiple reports for each MDA with descriptive titles, so that users can easily identify and access the appropriate reports for their needs.

#### Acceptance Criteria

1. WHEN an admin creates or edits an MDA THEN the system SHALL allow adding multiple reports with titles and URLs
2. WHEN adding a report THEN the system SHALL require both title and URL fields
3. WHEN adding a report URL THEN the system SHALL validate that it is a proper HTTP/HTTPS URL
4. WHEN an admin removes a report THEN the system SHALL update the MDA configuration accordingly
5. WHEN an MDA has no reports THEN the system SHALL require at least one report to be added
6. WHEN displaying MDA information THEN the system SHALL show all configured reports with their titles

### Requirement 6

**User Story:** As a system administrator, I want the authentication system to be migrated from email-based to username-based login, so that the system aligns with organizational naming conventions.

#### Acceptance Criteria

1. WHEN the system is migrated THEN existing user emails SHALL be converted to contact emails
2. WHEN the system is migrated THEN users SHALL be assigned usernames based on their MDA associations
3. WHEN the migration is complete THEN the login system SHALL only accept username and password
4. WHEN user management is performed THEN the system SHALL handle both username (for login) and contact email (for communication)
5. WHEN searching users THEN the system SHALL support searching by both username and contact email

### Requirement 7

**User Story:** As a system administrator, I want comprehensive activity logging for all administrative actions, so that the system maintains proper audit trails for compliance and security purposes.

#### Acceptance Criteria

1. WHEN an admin logs in or out THEN the system SHALL record the authentication activity
2. WHEN an admin creates, updates, or deletes any resource THEN the system SHALL log the specific action with details
3. WHEN logging activities THEN the system SHALL capture admin identity, timestamp, IP address, user agent, and affected resources
4. WHEN storing activity logs THEN the system SHALL include sufficient detail for audit purposes
5. WHEN activity logs are accessed THEN the system SHALL provide comprehensive filtering and search capabilities