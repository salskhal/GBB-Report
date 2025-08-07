# MDA System API Documentation

## Overview

This document provides comprehensive documentation for the MDA (Ministry, Department, Agency) reporting system API. The system supports username-based authentication for users, email-based authentication for admins, multi-report management, hierarchical admin roles, and comprehensive activity logging.

## Base URL

```
http://localhost:5000/api
```

## Authentication

The API uses JWT (JSON Web Token) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## User Roles

- **User**: Can access their own profile and reports
- **Admin**: Can manage users and MDAs
- **Super Admin**: Can manage users, MDAs, other admins, and view activity logs

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information (in development mode)"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Authentication Endpoints

### User Login

**POST** `/auth/login`

Authenticate a user with username and password.

**Request Body:**
```json
{
  "username": "ministry-of-health",
  "password": "userpassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "64a1b2c3d4e5f6789012345",
      "username": "ministry-of-health",
      "name": "John Doe",
      "contactEmail": "john.doe@health.gov",
      "role": "user",
      "mda": {
        "id": "64a1b2c3d4e5f6789012346",
        "name": "Ministry of Health",
        "reports": [
          {
            "title": "Health Statistics Dashboard",
            "url": "https://dashboard.health.gov/stats",
            "isActive": true
          },
          {
            "title": "Budget Report",
            "url": "https://dashboard.health.gov/budget",
            "isActive": true
          }
        ]
      }
    }
  }
}
```

**Validation Rules:**
- `username`: Required, string, 3-50 characters
- `password`: Required, string, minimum 6 characters

### Admin Login

**POST** `/auth/admin/login`

Authenticate an admin with email and password.

**Request Body:**
```json
{
  "email": "admin@system.gov",
  "password": "adminpassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Admin login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "admin": {
      "id": "64a1b2c3d4e5f6789012347",
      "name": "System Administrator",
      "email": "admin@system.gov",
      "role": "superadmin",
      "canBeDeleted": false
    }
  }
}
```

**Validation Rules:**
- `email`: Required, valid email format
- `password`: Required, string, minimum 6 characters

### Admin Logout

**POST** `/auth/admin/logout`

**Authorization:** Bearer token required (Admin)

Log out an admin and record the logout activity.

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

## User Profile Endpoints

### Get User Profile

**GET** `/profile`

**Authorization:** Bearer token required (User)

Get the authenticated user's profile information.

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "64a1b2c3d4e5f6789012345",
      "username": "ministry-of-health",
      "name": "John Doe",
      "contactEmail": "john.doe@health.gov",
      "role": "user",
      "mda": {
        "name": "Ministry of Health",
        "reports": [
          {
            "title": "Health Statistics Dashboard",
            "url": "https://dashboard.health.gov/stats",
            "isActive": true
          }
        ]
      },
      "lastLogin": "2024-01-08T10:30:00.000Z"
    }
  }
}
```

### Change User Password

**PUT** `/profile/password`

**Authorization:** Bearer token required (User)

Change the authenticated user's password.

**Request Body:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Validation Rules:**
- `currentPassword`: Required, string
- `newPassword`: Required, string, minimum 6 characters

---

## User Management Endpoints (Admin)

### Get All Users

**GET** `/admin/users`

**Authorization:** Bearer token required (Admin)

Retrieve all users with pagination and filtering options.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search by username or contact email
- `mda` (optional): Filter by MDA name
- `isActive` (optional): Filter by active status (true/false)

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "64a1b2c3d4e5f6789012345",
        "username": "ministry-of-health",
        "name": "John Doe",
        "contactEmail": "john.doe@health.gov",
        "mdaReference": "Ministry of Health",
        "isActive": true,
        "lastLogin": "2024-01-08T10:30:00.000Z",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalUsers": 50,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### Get Single User

**GET** `/admin/users/:id`

**Authorization:** Bearer token required (Admin)

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "64a1b2c3d4e5f6789012345",
      "username": "ministry-of-health",
      "name": "John Doe",
      "contactEmail": "john.doe@health.gov",
      "mdaReference": "Ministry of Health",
      "isActive": true,
      "lastLogin": "2024-01-08T10:30:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### Create User

**POST** `/admin/users`

**Authorization:** Bearer token required (Admin)

**Request Body:**
```json
{
  "username": "ministry-of-education",
  "name": "Jane Smith",
  "contactEmail": "jane.smith@education.gov",
  "password": "userpassword123",
  "mdaReference": "Ministry of Education"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user": {
      "id": "64a1b2c3d4e5f6789012348",
      "username": "ministry-of-education",
      "name": "Jane Smith",
      "contactEmail": "jane.smith@education.gov",
      "mdaReference": "Ministry of Education",
      "isActive": true,
      "createdAt": "2024-01-08T12:00:00.000Z"
    }
  }
}
```

**Validation Rules:**
- `username`: Required, string, 3-50 characters, unique
- `name`: Required, string, 2-100 characters
- `contactEmail`: Required, valid email format
- `password`: Required, string, minimum 6 characters
- `mdaReference`: Required, string, must reference existing MDA

### Update User

**PUT** `/admin/users/:id`

**Authorization:** Bearer token required (Admin)

**Request Body:**
```json
{
  "name": "Jane Smith Updated",
  "contactEmail": "jane.smith.updated@education.gov",
  "mdaReference": "Ministry of Education",
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "user": {
      "id": "64a1b2c3d4e5f6789012348",
      "username": "ministry-of-education",
      "name": "Jane Smith Updated",
      "contactEmail": "jane.smith.updated@education.gov",
      "mdaReference": "Ministry of Education",
      "isActive": true,
      "updatedAt": "2024-01-08T12:30:00.000Z"
    }
  }
}
```

### Delete User

**DELETE** `/admin/users/:id`

**Authorization:** Bearer token required (Admin)

Soft delete a user (sets isActive to false).

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

### Reset User Password

**PUT** `/admin/users/:id/reset-password`

**Authorization:** Bearer token required (Admin)

**Request Body:**
```json
{
  "newPassword": "newpassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User password reset successfully"
}
```

---

## MDA Management Endpoints (Admin)

### Get All MDAs

**GET** `/admin/mdas`

**Authorization:** Bearer token required (Admin)

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search by MDA name
- `isActive` (optional): Filter by active status (true/false)

**Response:**
```json
{
  "success": true,
  "data": {
    "mdas": [
      {
        "id": "64a1b2c3d4e5f6789012346",
        "name": "Ministry of Health",
        "reports": [
          {
            "title": "Health Statistics Dashboard",
            "url": "https://dashboard.health.gov/stats",
            "isActive": true
          },
          {
            "title": "Budget Report",
            "url": "https://dashboard.health.gov/budget",
            "isActive": true
          }
        ],
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalMDAs": 25,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### Get Single MDA

**GET** `/admin/mdas/:id`

**Authorization:** Bearer token required (Admin)

**Response:**
```json
{
  "success": true,
  "data": {
    "mda": {
      "id": "64a1b2c3d4e5f6789012346",
      "name": "Ministry of Health",
      "reports": [
        {
          "title": "Health Statistics Dashboard",
          "url": "https://dashboard.health.gov/stats",
          "isActive": true
        }
      ],
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### Create MDA

**POST** `/admin/mdas`

**Authorization:** Bearer token required (Admin)

**Request Body:**
```json
{
  "name": "Ministry of Transportation",
  "reports": [
    {
      "title": "Traffic Statistics",
      "url": "https://dashboard.transport.gov/traffic",
      "isActive": true
    },
    {
      "title": "Infrastructure Report",
      "url": "https://dashboard.transport.gov/infrastructure",
      "isActive": true
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "MDA created successfully",
  "data": {
    "mda": {
      "id": "64a1b2c3d4e5f6789012349",
      "name": "Ministry of Transportation",
      "reports": [
        {
          "title": "Traffic Statistics",
          "url": "https://dashboard.transport.gov/traffic",
          "isActive": true
        },
        {
          "title": "Infrastructure Report",
          "url": "https://dashboard.transport.gov/infrastructure",
          "isActive": true
        }
      ],
      "isActive": true,
      "createdAt": "2024-01-08T13:00:00.000Z"
    }
  }
}
```

**Validation Rules:**
- `name`: Required, string, 2-100 characters, unique
- `reports`: Required, array with at least one report
- `reports[].title`: Required, string, 2-100 characters
- `reports[].url`: Required, valid HTTP/HTTPS URL
- `reports[].isActive`: Optional, boolean (default: true)

### Update MDA

**PUT** `/admin/mdas/:id`

**Authorization:** Bearer token required (Admin)

**Request Body:**
```json
{
  "name": "Ministry of Transportation Updated",
  "reports": [
    {
      "title": "Updated Traffic Statistics",
      "url": "https://dashboard.transport.gov/traffic-v2",
      "isActive": true
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "MDA updated successfully",
  "data": {
    "mda": {
      "id": "64a1b2c3d4e5f6789012349",
      "name": "Ministry of Transportation Updated",
      "reports": [
        {
          "title": "Updated Traffic Statistics",
          "url": "https://dashboard.transport.gov/traffic-v2",
          "isActive": true
        }
      ],
      "isActive": true,
      "updatedAt": "2024-01-08T13:30:00.000Z"
    }
  }
}
```

### Delete MDA

**DELETE** `/admin/mdas/:id`

**Authorization:** Bearer token required (Admin)

Soft delete an MDA (sets isActive to false).

**Response:**
```json
{
  "success": true,
  "message": "MDA deleted successfully"
}
```

---

## Admin Management Endpoints (Super Admin Only)

### Get All Admins

**GET** `/admin/admins`

**Authorization:** Bearer token required (Super Admin)

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search by name or email
- `role` (optional): Filter by role (admin/superadmin)
- `isActive` (optional): Filter by active status (true/false)

**Response:**
```json
{
  "success": true,
  "data": {
    "admins": [
      {
        "id": "64a1b2c3d4e5f6789012347",
        "name": "System Administrator",
        "email": "admin@system.gov",
        "role": "superadmin",
        "canBeDeleted": false,
        "isActive": true,
        "lastLogin": "2024-01-08T09:00:00.000Z",
        "createdAt": "2024-01-01T00:00:00.000Z"
      },
      {
        "id": "64a1b2c3d4e5f678901234a",
        "name": "Regional Administrator",
        "email": "regional@system.gov",
        "role": "admin",
        "canBeDeleted": true,
        "createdBy": "64a1b2c3d4e5f6789012347",
        "isActive": true,
        "createdAt": "2024-01-05T00:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalAdmins": 2,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

### Get Single Admin

**GET** `/admin/admins/:id`

**Authorization:** Bearer token required (Super Admin)

**Response:**
```json
{
  "success": true,
  "data": {
    "admin": {
      "id": "64a1b2c3d4e5f678901234a",
      "name": "Regional Administrator",
      "email": "regional@system.gov",
      "role": "admin",
      "canBeDeleted": true,
      "createdBy": "64a1b2c3d4e5f6789012347",
      "isActive": true,
      "lastLogin": "2024-01-07T14:30:00.000Z",
      "createdAt": "2024-01-05T00:00:00.000Z"
    }
  }
}
```

### Create Admin

**POST** `/admin/admins`

**Authorization:** Bearer token required (Super Admin)

**Request Body:**
```json
{
  "name": "New Administrator",
  "email": "newadmin@system.gov",
  "password": "adminpassword123",
  "role": "admin"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Admin created successfully",
  "data": {
    "admin": {
      "id": "64a1b2c3d4e5f678901234b",
      "name": "New Administrator",
      "email": "newadmin@system.gov",
      "role": "admin",
      "canBeDeleted": true,
      "createdBy": "64a1b2c3d4e5f6789012347",
      "isActive": true,
      "createdAt": "2024-01-08T14:00:00.000Z"
    }
  }
}
```

**Validation Rules:**
- `name`: Required, string, 2-100 characters
- `email`: Required, valid email format, unique
- `password`: Required, string, minimum 6 characters
- `role`: Required, enum: "admin" or "superadmin"

### Update Admin

**PUT** `/admin/admins/:id`

**Authorization:** Bearer token required (Super Admin)

**Request Body:**
```json
{
  "name": "Updated Administrator",
  "email": "updatedadmin@system.gov",
  "role": "admin",
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Admin updated successfully",
  "data": {
    "admin": {
      "id": "64a1b2c3d4e5f678901234b",
      "name": "Updated Administrator",
      "email": "updatedadmin@system.gov",
      "role": "admin",
      "canBeDeleted": true,
      "isActive": true,
      "updatedAt": "2024-01-08T14:30:00.000Z"
    }
  }
}
```

### Delete Admin

**DELETE** `/admin/admins/:id`

**Authorization:** Bearer token required (Super Admin)

Delete an admin account. Super admin accounts cannot be deleted.

**Response:**
```json
{
  "success": true,
  "message": "Admin deleted successfully"
}
```

**Error Response (if trying to delete super admin):**
```json
{
  "success": false,
  "message": "Super admin cannot be deleted"
}
```

### Reset Admin Password

**PUT** `/admin/admins/:id/reset-password`

**Authorization:** Bearer token required (Super Admin)

**Request Body:**
```json
{
  "newPassword": "newadminpassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Admin password reset successfully"
}
```

---

## Activity Logging Endpoints (Super Admin Only)

### Get Activity Logs

**GET** `/admin/activities`

**Authorization:** Bearer token required (Super Admin)

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `adminId` (optional): Filter by admin ID
- `adminName` (optional): Filter by admin name
- `action` (optional): Filter by action (CREATE, UPDATE, DELETE, LOGIN, LOGOUT)
- `resourceType` (optional): Filter by resource type (USER, MDA, ADMIN)
- `resourceId` (optional): Filter by resource ID
- `startDate` (optional): Filter from date (ISO format)
- `endDate` (optional): Filter to date (ISO format)
- `ipAddress` (optional): Filter by IP address

**Response:**
```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "id": "64a1b2c3d4e5f678901234c",
        "adminId": "64a1b2c3d4e5f6789012347",
        "adminName": "System Administrator",
        "action": "CREATE",
        "resourceType": "USER",
        "resourceId": "64a1b2c3d4e5f6789012348",
        "resourceName": "ministry-of-education",
        "details": {
          "name": "Jane Smith",
          "contactEmail": "jane.smith@education.gov",
          "mdaReference": "Ministry of Education"
        },
        "ipAddress": "192.168.1.100",
        "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "timestamp": "2024-01-08T12:00:00.000Z"
      },
      {
        "id": "64a1b2c3d4e5f678901234d",
        "adminId": "64a1b2c3d4e5f6789012347",
        "adminName": "System Administrator",
        "action": "LOGIN",
        "resourceType": "ADMIN",
        "resourceId": "64a1b2c3d4e5f6789012347",
        "resourceName": "admin@system.gov",
        "details": {
          "loginMethod": "email",
          "success": true
        },
        "ipAddress": "192.168.1.100",
        "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "timestamp": "2024-01-08T09:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalActivities": 200,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### Export Activity Logs

**GET** `/admin/activities/export`

**Authorization:** Bearer token required (Super Admin)

**Query Parameters:** Same as Get Activity Logs
**Additional Parameters:**
- `format` (optional): Export format (csv, json) - default: csv

**Response:**
- Content-Type: `text/csv` or `application/json`
- Content-Disposition: `attachment; filename="activity_logs_YYYY-MM-DD.csv"`

**CSV Format:**
```csv
Timestamp,Admin Name,Action,Resource Type,Resource Name,IP Address,Details
2024-01-08T12:00:00.000Z,System Administrator,CREATE,USER,ministry-of-education,192.168.1.100,"User created with email jane.smith@education.gov"
2024-01-08T09:00:00.000Z,System Administrator,LOGIN,ADMIN,admin@system.gov,192.168.1.100,"Admin login successful"
```

### Get Activity Statistics

**GET** `/admin/activities/stats`

**Authorization:** Bearer token required (Super Admin)

**Query Parameters:**
- `period` (optional): Time period (day, week, month) - default: week
- `startDate` (optional): Start date for custom period
- `endDate` (optional): End date for custom period

**Response:**
```json
{
  "success": true,
  "data": {
    "totalActivities": 1250,
    "period": "week",
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2024-01-08T23:59:59.999Z",
    "actionBreakdown": {
      "CREATE": 45,
      "UPDATE": 78,
      "DELETE": 12,
      "LOGIN": 89,
      "LOGOUT": 67
    },
    "resourceBreakdown": {
      "USER": 135,
      "MDA": 23,
      "ADMIN": 156
    },
    "adminBreakdown": {
      "System Administrator": 189,
      "Regional Administrator": 102
    },
    "dailyActivity": [
      {
        "date": "2024-01-01",
        "count": 45
      },
      {
        "date": "2024-01-02",
        "count": 67
      }
    ]
  }
}
```

### Clean Up Old Activity Logs

**DELETE** `/admin/activities/cleanup`

**Authorization:** Bearer token required (Super Admin)

**Query Parameters:**
- `olderThan` (optional): Delete logs older than X days (default: 365)
- `dryRun` (optional): Preview deletion without actually deleting (true/false)

**Response:**
```json
{
  "success": true,
  "message": "Activity logs cleanup completed",
  "data": {
    "deletedCount": 1500,
    "oldestRemainingLog": "2023-01-08T00:00:00.000Z",
    "dryRun": false
  }
}
```

---

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Authentication endpoints**: 5 requests per minute per IP
- **General API endpoints**: 100 requests per minute per authenticated user
- **Activity export**: 2 requests per minute per admin

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1641648000
```

## Changelog

### Version 2.0.0 (Current)
- Added username-based authentication for users
- Implemented multi-report support for MDAs
- Added hierarchical admin management (super admin/admin roles)
- Introduced comprehensive activity logging
- Enhanced security with role-based access control

### Version 1.0.0
- Basic email-based authentication
- Single report per MDA
- Basic user and MDA management
- Simple admin interface

---

## Support

For API support and questions, contact the development team or refer to the system documentation.