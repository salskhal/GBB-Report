# User Creation Issue Fix

## Problem Description
Users can create one user successfully, but subsequent user creation attempts fail with a 500 Internal Server Error. This is typically caused by duplicate email addresses or missing unique constraints.

## Root Cause
The issue is likely caused by:
1. Missing unique constraint on the `contactEmail` field
2. Existing duplicate email addresses in the database
3. Index mismatches in the User model

## Solution

### Step 1: Apply the Database Fix

Run the migration script on your Ubuntu server:

```bash
# Navigate to your server directory
cd /path/to/your/server

# Run the fix script
npm run fix-email-constraint
```

This script will:
- ✅ Find and handle any duplicate email addresses
- ✅ Add unique constraint to the `contactEmail` field
- ✅ Update database indexes
- ✅ Clean up any inconsistent data

### Step 2: Restart Your Server

After running the migration, restart your Node.js server:

```bash
# If using PM2
pm2 restart your-app-name

# If using systemd
sudo systemctl restart your-service-name

# If running directly
# Stop the current process and restart
npm start
```

### Step 3: Test User Creation

Try creating users with:
1. ✅ Different usernames and different emails - Should work
2. ❌ Same username - Should fail with "Username already registered"
3. ❌ Same email - Should fail with "Email already registered"

## Manual Fix (Alternative)

If the script doesn't work, you can manually fix the issue:

### 1. Connect to MongoDB

```bash
# Connect to your MongoDB instance
mongo your-database-name

# Or if using MongoDB Atlas
mongo "mongodb+srv://your-connection-string"
```

### 2. Find Duplicate Emails

```javascript
db.users.aggregate([
  {
    $group: {
      _id: "$contactEmail",
      count: { $sum: 1 },
      users: { $push: { _id: "$_id", username: "$username" } }
    }
  },
  {
    $match: { count: { $gt: 1 } }
  }
])
```

### 3. Fix Duplicate Emails

For each duplicate email found, update all but one:

```javascript
// Example: Update duplicate emails
db.users.updateOne(
  { _id: ObjectId("duplicate-user-id") },
  { $set: { contactEmail: "new-unique-email@example.com" } }
)
```

### 4. Add Unique Index

```javascript
// Create unique index on contactEmail
db.users.createIndex({ "contactEmail": 1 }, { unique: true })

// Verify the index was created
db.users.getIndexes()
```

## Code Changes Applied

### 1. Updated User Model (`Server/src/models/User.js`)
- ✅ Added `unique: true` to `contactEmail` field
- ✅ Fixed index references from `mdaReference` to `mdaId`

### 2. Updated User Service (`Server/src/service/userService.js`)
- ✅ Added email duplicate check in `createUser`
- ✅ Added email duplicate check in `updateUser`

### 3. Updated User Controller (`Server/src/controller/user.controller.js`)
- ✅ Added error handling for email duplicates
- ✅ Added MongoDB duplicate key error handling (code 11000)
- ✅ Improved error logging

## Verification Steps

### 1. Check Database Indexes
```javascript
// In MongoDB shell
db.users.getIndexes()

// Should show:
// - { "username": 1 } with unique: true
// - { "contactEmail": 1 } with unique: true
// - { "mdaId": 1 }
// - { "username": 1, "mdaId": 1 }
```

### 2. Test API Endpoints

```bash
# Test 1: Create first user (should succeed)
curl -X POST http://your-server/api/admin/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-admin-token" \
  -d '{
    "name": "John Doe",
    "username": "john.doe",
    "contactEmail": "john@example.com",
    "password": "password123",
    "mdaId": "your-mda-id"
  }'

# Test 2: Create second user with different email (should succeed)
curl -X POST http://your-server/api/admin/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-admin-token" \
  -d '{
    "name": "Jane Smith",
    "username": "jane.smith",
    "contactEmail": "jane@example.com",
    "password": "password123",
    "mdaId": "your-mda-id"
  }'

# Test 3: Create user with duplicate email (should fail)
curl -X POST http://your-server/api/admin/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-admin-token" \
  -d '{
    "name": "Bob Wilson",
    "username": "bob.wilson",
    "contactEmail": "john@example.com",
    "password": "password123",
    "mdaId": "your-mda-id"
  }'
```

## Expected Responses

### Success Response (201)
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "_id": "user-id",
    "name": "John Doe",
    "username": "john.doe",
    "contactEmail": "john@example.com",
    "role": "user",
    "mdaId": { ... },
    "isActive": true,
    "createdAt": "2024-08-04T...",
    "updatedAt": "2024-08-04T..."
  }
}
```

### Duplicate Email Error (400)
```json
{
  "success": false,
  "message": "Email already registered"
}
```

### Duplicate Username Error (400)
```json
{
  "success": false,
  "message": "Username already registered"
}
```

## Troubleshooting

### Issue: Migration Script Fails
**Solution:**
1. Check MongoDB connection string in `.env`
2. Ensure database user has proper permissions
3. Check server logs for detailed error messages

### Issue: Still Getting 500 Errors
**Solution:**
1. Check server logs: `tail -f /path/to/your/logs`
2. Verify all code changes were applied
3. Restart the server completely
4. Check MongoDB connection

### Issue: Frontend Still Shows Generic Error
**Solution:**
1. Clear browser cache
2. Check network tab in browser dev tools
3. Verify API endpoint URLs are correct
4. Check CORS settings

## Prevention

To prevent similar issues in the future:

1. **Always add unique constraints** to fields that should be unique
2. **Test with duplicate data** during development
3. **Use proper error handling** for database constraints
4. **Monitor server logs** for early detection of issues
5. **Use database migrations** for schema changes

## Support

If you continue to experience issues:

1. Check the server logs for detailed error messages
2. Verify the database connection and permissions
3. Test the API endpoints directly using curl or Postman
4. Ensure all environment variables are properly set

The fix should resolve the user creation issue and provide proper error messages for duplicate data attempts.