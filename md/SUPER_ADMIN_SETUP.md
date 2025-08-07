# Super Admin Setup and Management Guide

## Overview

This guide provides comprehensive instructions for setting up and managing the super admin account in the MDA Reporting System. The super admin is the highest-level administrator with full system access and the ability to manage other admin accounts.

## Initial Setup

### Prerequisites

1. **Database Connection**: Ensure MongoDB is running and accessible
2. **Environment Variables**: Configure the following environment variables in your `.env` file:
   ```env
   # Database Configuration
   MONGODB_URI=mongodb://localhost:27017/mda-reporting
   
   # Super Admin Configuration (Optional - defaults will be used if not set)
   SUPER_ADMIN_NAME=Super Administrator
   SUPER_ADMIN_EMAIL=admin@mdareporting.gov
   SUPER_ADMIN_PASSWORD=SuperAdmin123!
   
   # Security Configuration
   BCRYPT_SALT_ROUNDS=12
   JWT_SECRET=your-jwt-secret-key
   ```

### Creating the Super Admin Account

#### Method 1: Using NPM Script (Recommended)

```bash
# Navigate to the Server directory
cd Server

# Run the super admin seeding script
npm run seed:superadmin
```

#### Method 2: Direct Node Execution

```bash
# Navigate to the Server directory
cd Server

# Run the seeding script directly
node src/seed/seedSuperAdmin.js
```

#### Method 3: Programmatic Usage

```javascript
import seedSuperAdmin from './src/seed/seedSuperAdmin.js';

// Call the function in your application startup
await seedSuperAdmin();
```

### Script Behavior

The super admin seeding script is designed to be **idempotent** and safe to run multiple times:

- ✅ **Safe Execution**: Won't create duplicate super admin accounts
- ✅ **Validation**: Checks if super admin already exists before creating
- ✅ **Error Handling**: Comprehensive error handling and user-friendly messages
- ✅ **Security**: Automatically sets `canBeDeleted: false` for super admin

## Super Admin Account Properties

### Default Configuration

| Property | Value | Description |
|----------|-------|-------------|
| `name` | Super Administrator | Display name for the super admin |
| `email` | admin@mdareporting.gov | Login email (must be unique) |
| `password` | SuperAdmin123! | Default password (change immediately) |
| `role` | superadmin | Highest privilege level |
| `canBeDeleted` | false | Prevents accidental deletion |
| `isActive` | true | Account is active by default |

### Environment Variable Overrides

You can customize the super admin account by setting environment variables:

```env
SUPER_ADMIN_NAME=Your Custom Admin Name
SUPER_ADMIN_EMAIL=your-admin@yourdomain.com
SUPER_ADMIN_PASSWORD=YourSecurePassword123!
```

## Security Considerations

### Password Requirements

The super admin password must meet the following criteria:
- Minimum 8 characters long
- Should contain a mix of uppercase, lowercase, numbers, and special characters
- Default password should be changed immediately after first login

### Email Requirements

- Must be a valid email format
- Must be unique in the system
- Used for login authentication

### Account Protection

- Super admin account has `canBeDeleted: false` to prevent accidental deletion
- Only one super admin account should exist in the system
- Super admin cannot be downgraded to regular admin through normal operations

## Management Operations

### Checking Super Admin Status

```javascript
import Admin from './src/models/Admin.js';

// Check if super admin exists
const superAdmin = await Admin.findOne({ role: 'superadmin' });
if (superAdmin) {
  console.log('Super Admin exists:', superAdmin.email);
} else {
  console.log('No super admin found');
}
```

### Updating Super Admin Information

```javascript
import Admin from './src/models/Admin.js';

// Update super admin (except role and canBeDeleted)
await Admin.findOneAndUpdate(
  { role: 'superadmin' },
  { 
    name: 'Updated Admin Name',
    email: 'new-email@domain.com'
  }
);
```

### Password Reset for Super Admin

```javascript
import Admin from './src/models/Admin.js';
import bcrypt from 'bcryptjs';

// Reset super admin password
const superAdmin = await Admin.findOne({ role: 'superadmin' });
if (superAdmin) {
  superAdmin.password = 'NewSecurePassword123!';
  await superAdmin.save(); // Password will be automatically hashed
}
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Database Connection Error
```
❌ Error during Super Admin seeding:
   MongoNetworkError: failed to connect to server
```

**Solution:**
- Ensure MongoDB is running
- Check the `MONGODB_URI` in your `.env` file
- Verify network connectivity to the database

#### 2. Duplicate Email Error
```
❌ Error during Super Admin seeding:
   E11000 duplicate key error collection
```

**Solution:**
- A user/admin with this email already exists
- Use a different email address
- Check existing admin accounts in the database

#### 3. Validation Error
```
❌ Error during Super Admin seeding:
   ValidationError: Admin validation failed
```

**Solution:**
- Check that all required fields are provided
- Ensure email format is valid
- Verify password meets minimum requirements

#### 4. Permission Error
```
❌ Error during Super Admin seeding:
   MongoError: not authorized on database
```

**Solution:**
- Check database user permissions
- Ensure the database user has write access
- Verify authentication credentials

### Debug Mode

For detailed debugging, you can modify the script to include more verbose logging:

```javascript
// Add to the top of seedSuperAdmin.js
process.env.DEBUG = 'mongoose:*';
```

## Best Practices

### Security Best Practices

1. **Change Default Password**: Always change the default password after first login
2. **Use Strong Passwords**: Implement strong password policies
3. **Regular Updates**: Keep the super admin information updated
4. **Access Logging**: Monitor super admin activities through the activity logging system
5. **Backup Strategy**: Ensure super admin account information is included in backup procedures

### Operational Best Practices

1. **Single Super Admin**: Maintain only one super admin account
2. **Documentation**: Keep super admin credentials documented securely
3. **Regular Testing**: Test the seeding script in development environments
4. **Monitoring**: Monitor super admin login activities
5. **Recovery Plan**: Have a recovery plan if super admin access is lost

## Integration with Application

### Startup Integration

You can integrate the super admin seeding into your application startup:

```javascript
// In your main app.js or server startup file
import seedSuperAdmin from './seed/seedSuperAdmin.js';

async function startServer() {
  try {
    // Ensure super admin exists on startup
    await seedSuperAdmin();
    
    // Start your Express server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
```

### Docker Integration

For Docker deployments, you can run the seeding script as part of your container startup:

```dockerfile
# In your Dockerfile
COPY src/seed/seedSuperAdmin.js ./src/seed/
RUN npm run seed:superadmin
```

## API Endpoints for Super Admin Management

Once the super admin is created, they can access the following endpoints:

### Authentication
- `POST /auth/admin/login` - Super admin login

### Admin Management (Super Admin Only)
- `GET /admin/admins` - List all admins
- `POST /admin/admins` - Create new admin
- `PUT /admin/admins/:id` - Update admin
- `DELETE /admin/admins/:id` - Delete admin (except super admin)

### Activity Logging (Super Admin Only)
- `GET /admin/activities` - View activity logs
- `GET /admin/activities/export` - Export activity logs

## Support and Maintenance

### Regular Maintenance Tasks

1. **Password Rotation**: Regularly update super admin password
2. **Access Review**: Review super admin access logs
3. **System Updates**: Keep the seeding script updated with system changes
4. **Backup Verification**: Ensure super admin data is properly backed up

### Getting Help

If you encounter issues with super admin setup or management:

1. Check the troubleshooting section above
2. Review the application logs for detailed error messages
3. Verify environment configuration
4. Test database connectivity
5. Consult the development team for complex issues

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Compatibility**: MDA Reporting System v2.0+