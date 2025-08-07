# Data Export Functionality Guide

## Overview

The MDA System now includes comprehensive data export functionality that allows administrators to export user data and MDA data with their associations in both JSON and CSV formats.

## Features

### Export Types

1. **User Data Export**
   - Exports all users with their associated MDA information
   - Includes user details, MDA associations, and report information
   - Supports filtering by MDA, active status, and date range

2. **MDA Data Export**
   - Exports all MDAs with their associated user information
   - Includes MDA details, reports, and user statistics
   - Supports filtering by active status and date range

3. **Combined Data Export**
   - Exports both user and MDA data in a single file
   - Includes full associations between entities
   - Provides export metadata and statistics

### Export Formats

- **JSON**: Structured data suitable for programmatic use
- **CSV**: Spreadsheet-compatible format for Excel and other tools

### Filtering Options

- **MDA Filter**: Export data for specific MDAs (User and Combined exports only)
- **Active Status**: Filter by active/inactive status
- **Date Range**: Filter by creation date range
- **Format Selection**: Choose between JSON and CSV formats

## API Endpoints

### User Data Export
```
GET /api/admin/export/users
```

**Query Parameters:**
- `mdaId` (optional): Filter by specific MDA ID
- `isActive` (optional): Filter by active status (true/false)
- `startDate` (optional): Filter by start date (ISO string)
- `endDate` (optional): Filter by end date (ISO string)
- `format` (optional): Export format ('json' or 'csv', default: 'json')

**Example:**
```
GET /api/admin/export/users?format=csv&isActive=true&startDate=2024-01-01
```

### MDA Data Export
```
GET /api/admin/export/mdas
```

**Query Parameters:**
- `isActive` (optional): Filter by active status (true/false)
- `startDate` (optional): Filter by start date (ISO string)
- `endDate` (optional): Filter by end date (ISO string)
- `format` (optional): Export format ('json' or 'csv', default: 'json')

**Example:**
```
GET /api/admin/export/mdas?format=json&isActive=true
```

### Combined Data Export
```
GET /api/admin/export/combined
```

**Query Parameters:**
- `mdaId` (optional): Filter by specific MDA ID
- `isActive` (optional): Filter by active status (true/false)
- `startDate` (optional): Filter by start date (ISO string)
- `endDate` (optional): Filter by end date (ISO string)
- `format` (optional): Export format ('json' or 'csv', default: 'json')

**Example:**
```
GET /api/admin/export/combined?format=csv
```

## Data Structure

### User Data Export Structure (JSON)

```json
[
  {
    "userId": "64f1a2b3c4d5e6f7g8h9i0j1",
    "username": "john.doe",
    "name": "John Doe",
    "contactEmail": "john.doe@example.com",
    "role": "user",
    "isActive": true,
    "lastLogin": "2024-08-04T10:30:00.000Z",
    "userCreatedAt": "2024-01-15T09:00:00.000Z",
    "userUpdatedAt": "2024-08-04T10:30:00.000Z",
    "mdaId": "64f1a2b3c4d5e6f7g8h9i0j2",
    "mdaName": "Ministry of Health",
    "mdaIsActive": true,
    "mdaCreatedAt": "2024-01-10T08:00:00.000Z",
    "mdaUpdatedAt": "2024-07-20T14:00:00.000Z",
    "mdaReportsCount": 3,
    "mdaActiveReportsCount": 2,
    "mdaReports": [
      {
        "title": "Health Statistics Report",
        "url": "https://reports.health.gov/stats",
        "isActive": true
      },
      {
        "title": "Budget Report",
        "url": "https://reports.health.gov/budget",
        "isActive": true
      },
      {
        "title": "Legacy Report",
        "url": "https://old.health.gov/report",
        "isActive": false
      }
    ]
  }
]
```

### MDA Data Export Structure (JSON)

```json
[
  {
    "mdaId": "64f1a2b3c4d5e6f7g8h9i0j2",
    "mdaName": "Ministry of Health",
    "mdaIsActive": true,
    "mdaCreatedAt": "2024-01-10T08:00:00.000Z",
    "mdaUpdatedAt": "2024-07-20T14:00:00.000Z",
    "reportsCount": 3,
    "activeReportsCount": 2,
    "inactiveReportsCount": 1,
    "reports": [
      {
        "title": "Health Statistics Report",
        "url": "https://reports.health.gov/stats",
        "isActive": true
      }
    ],
    "totalUsersCount": 5,
    "activeUsersCount": 4,
    "inactiveUsersCount": 1,
    "users": [
      {
        "userId": "64f1a2b3c4d5e6f7g8h9i0j1",
        "username": "john.doe",
        "name": "John Doe",
        "contactEmail": "john.doe@example.com",
        "isActive": true,
        "lastLogin": "2024-08-04T10:30:00.000Z",
        "createdAt": "2024-01-15T09:00:00.000Z"
      }
    ]
  }
]
```

### Combined Data Export Structure (JSON)

```json
{
  "exportInfo": {
    "timestamp": "2024-08-04T10:45:00.000Z",
    "filters": {
      "isActive": true,
      "format": "json"
    },
    "totalUsers": 25,
    "totalMDAs": 8
  },
  "users": [...], // User data array
  "mdas": [...]   // MDA data array
}
```

## Frontend Usage

### Accessing the Export Feature

1. Log in as an admin user
2. Navigate to the "Data Export" section in the admin dashboard
3. Select the export type (Users, MDAs, or Combined)
4. Apply any desired filters
5. Choose the export format (JSON or CSV)
6. Click "Export Data" to download the file

### Export Component Features

- **Export Type Selection**: Visual cards for choosing export type
- **Dynamic Filtering**: Filters adapt based on selected export type
- **Format Selection**: Radio buttons for JSON/CSV selection
- **Real-time Validation**: Date range and filter validation
- **Download Management**: Automatic file download with proper naming
- **Export Information**: Helpful descriptions and usage tips

## Security and Access Control

- **Admin Only**: All export endpoints require admin authentication
- **Role-Based Access**: Available to both regular admins and super admins
- **Activity Logging**: All export activities are logged for audit purposes
- **Data Sanitization**: Sensitive data (passwords) are excluded from exports

## File Naming Convention

Export files are automatically named with timestamps:
- User data: `user-data-export-YYYY-MM-DDTHH-mm-ss.format`
- MDA data: `mda-data-export-YYYY-MM-DDTHH-mm-ss.format`
- Combined data: `combined-data-export-YYYY-MM-DDTHH-mm-ss.format`

## Error Handling

The system includes comprehensive error handling:
- Invalid date formats return 400 Bad Request
- Missing authentication returns 401 Unauthorized
- Server errors return 500 Internal Server Error
- Frontend displays user-friendly error messages

## Performance Considerations

- Large datasets are handled efficiently with streaming
- CSV generation is optimized for memory usage
- Database queries use appropriate indexes
- Export operations are logged for monitoring

## Usage Examples

### Export All Active Users with Their MDA Data (CSV)
```javascript
// Frontend service call
const blob = await adminService.exportUserData({
  isActive: true,
  format: 'csv'
});
```

### Export MDA Data for a Specific Date Range (JSON)
```javascript
// Frontend service call
const blob = await adminService.exportMDAData({
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  format: 'json'
});
```

### Export Combined Data with All Filters (CSV)
```javascript
// Frontend service call
const blob = await adminService.exportCombinedData({
  mdaId: '64f1a2b3c4d5e6f7g8h9i0j2',
  isActive: true,
  startDate: '2024-01-01',
  format: 'csv'
});
```

## Troubleshooting

### Common Issues

1. **Export Button Not Working**
   - Check admin authentication
   - Verify server connectivity
   - Check browser console for errors

2. **Empty Export Files**
   - Verify data exists in the database
   - Check applied filters
   - Ensure proper date format

3. **CSV Format Issues**
   - Use UTF-8 encoding when opening in Excel
   - Check for special characters in data
   - Verify CSV delimiter settings

### Support

For technical support or feature requests related to the export functionality, please contact the development team or create an issue in the project repository.