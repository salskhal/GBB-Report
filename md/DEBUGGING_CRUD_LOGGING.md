# Debugging CRUD Activity Logging

## Current Issue
CRUD operations (CREATE, UPDATE, DELETE) are not being logged in the activity logs, only LOGIN activities are showing up.

## Debugging Steps Added

### 1. Activity Logger Middleware Debug
Added comprehensive logging to `Server/src/middleware/activityLogger.js`:
- Logs when middleware is called
- Shows admin info availability
- Tracks response data and status codes
- Shows activity data being saved

### 2. Auth Middleware Debug  
Added logging to `Server/src/middleware/auth.js`:
- Shows when `req.admin` is set
- Displays admin info (id, name, role)

### 3. Activity Model Debug
Added logging to `Server/src/models/Activity.js`:
- Shows when activity save is attempted
- Logs success/failure of database saves
- Shows validation errors if any

## Potential Issues and Fixes Applied

### Issue 1: Response Data Parsing
**Problem**: Response data might be captured as string instead of object
**Fix**: Added JSON parsing for string responses in middleware

### Issue 2: Resource ID Extraction
**Problem**: Looking for `responseData.data.id` but MongoDB uses `_id`
**Fix**: Updated to check for both `_id` and `id`

### Issue 3: Middleware Order
**Problem**: Activity logging middleware might not have access to `req.admin`
**Status**: Verified middleware order is correct in routes

## Testing Instructions

### 1. Start Server with Debug Logs
```bash
cd Server
npm run dev
```

### 2. Test CRUD Operations
1. Login as regular admin (not superadmin)
2. Perform a CRUD operation (create/update/delete user or MDA)
3. Check server console for debug logs

### 3. Expected Debug Output
You should see logs like:
```
🔐 Admin set for activity logging: { id: '...', name: '...', role: 'admin' }
🔍 Activity Logger Debug: { method: 'POST', url: '/api/admin/users', action: 'CREATE', resourceType: 'USER', hasAdmin: true, ... }
📝 Processing activity log - Status: 201
🗃️ Activity Model: Attempting to save activity: { adminName: '...', action: 'CREATE', ... }
✅ Activity Model: Successfully saved activity with ID: ...
```

### 4. Check Activity Logs
1. Login as superadmin
2. Navigate to Activity Logs page
3. Look for the CRUD operations

## Common Issues to Check

### 1. Admin Not Set
If you see: `⚠️ Activity Logger: No admin info available`
- Check if user is properly authenticated
- Verify `checkUserStatus` middleware is running
- Check if admin exists in database

### 2. Middleware Not Called
If you don't see: `🔍 Activity Logger Debug`
- Check if `logActivity()` is applied to the route
- Verify route is being hit
- Check middleware order

### 3. Database Save Fails
If you see: `💥 Activity Model: Failed to log activity`
- Check MongoDB connection
- Verify activity data format
- Check for validation errors

### 4. Wrong Status Code
If you see: `❌ Skipping log - Status code: XXX`
- Check if controller is returning proper status codes
- Verify no errors in the main operation

## Manual Testing Checklist

- [ ] Server starts without errors
- [ ] Admin login works and sets `req.admin`
- [ ] CRUD operation executes successfully
- [ ] Activity logger middleware is called
- [ ] Activity data is saved to database
- [ ] Activity appears in superadmin dashboard
- [ ] Only regular admin activities are shown (not superadmin)

## Next Steps

1. Run the server with debug logs enabled
2. Perform a CRUD operation as regular admin
3. Check console output for debug information
4. Identify where the logging process is failing
5. Apply targeted fixes based on debug output

## Files Modified for Debugging

- `Server/src/middleware/activityLogger.js` - Added comprehensive debug logging
- `Server/src/middleware/auth.js` - Added admin setup logging  
- `Server/src/models/Activity.js` - Added database save logging

## Removing Debug Logs

Once the issue is identified and fixed, remove the debug console.log statements from:
- Activity logger middleware
- Auth middleware  
- Activity model

The debug logs will help identify exactly where the CRUD logging process is failing.