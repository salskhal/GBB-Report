import authService from '../service/authService.js';
import userService from '../service/userService.js';
import Activity from '../models/Activity.js';

// Helper function to extract IP address
const getClientIP = (req) => {
  return req.ip || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         '127.0.0.1';
};

// Helper function to extract user agent
const getUserAgent = (req) => {
  return req.get('User-Agent') || 'Unknown';
};

// User login
export const loginUser = async (req, res) => {
  const { username, password } = req.body;
  const ipAddress = getClientIP(req);
  const userAgent = getUserAgent(req);
  
  try {
    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username and password are required' 
      });
    }

    const result = await authService.loginUser(username, password);
    
    // Log successful login attempt (Note: Users don't have admin activities, but we can log for audit)
    // This is for user login, so we won't log to Activity table as it's for admin actions only
    
    res.status(200).json({ success: true, message: 'Login successful', data: result });
  } catch (error) {
    // Log failed login attempt with username for security monitoring
    console.log(`Failed user login attempt - Username: ${username}, IP: ${ipAddress}, UserAgent: ${userAgent}, Error: ${error.message}`);
    
    // Enhanced error handling for username-based authentication
    let statusCode = 400;
    let message = error.message;

    if (message === 'Invalid credentials') {
      statusCode = 401;
      message = 'Invalid username or password';
    } else if (message === 'MDA not found or inactive') {
      statusCode = 403;
      message = 'Your organization is currently inactive. Please contact support.';
    }

    res.status(statusCode).json({ success: false, message });
  }
};

// Admin login
export const loginAdmin = async (req, res) => {
  const { email, password } = req.body;
  const ipAddress = getClientIP(req);
  const userAgent = getUserAgent(req);
  
  try {
    const result = await authService.loginAdmin(email, password);
    
    // Only log login for regular admins, not superadmins
    if (result.admin.role === 'admin') {
      await Activity.logActivity({
        adminId: result.admin.id,
        adminName: result.admin.name,
        action: 'LOGIN',
        resourceType: 'ADMIN',
        details: {
          email: result.admin.email,
          role: result.admin.role,
          loginTime: new Date()
        },
        ipAddress,
        userAgent
      });
    }
    
    res.status(200).json({ success: true, message: 'Admin login successful', data: result });
  } catch (error) {
    // Log failed admin login attempt
    console.log(`Failed admin login attempt - Email: ${email}, IP: ${ipAddress}, UserAgent: ${userAgent}, Error: ${error.message}`);
    
    res.status(400).json({ success: false, message: error.message });
  }
};



// Get user by ID
export const getUserById = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};



// Create new user
export const createUser = async (req, res) => {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json({ success: true, message: 'User created successfully', data: user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update user
export const updateUser = async (req, res) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'User updated successfully', data: user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    await userService.deleteUser(req.params.id);
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Admin logout
export const logoutAdmin = async (req, res) => {
  const ipAddress = getClientIP(req);
  const userAgent = getUserAgent(req);
  
  try {
    // Extract admin info from the authenticated request (assuming middleware sets req.admin)
    const admin = req.admin;
    
    // Only log logout for regular admins, not superadmins
    if (admin && admin.role === 'admin') {
      await Activity.logActivity({
        adminId: admin.id,
        adminName: admin.name,
        action: 'LOGOUT',
        resourceType: 'ADMIN',
        details: {
          email: admin.email,
          role: admin.role,
          logoutTime: new Date()
        },
        ipAddress,
        userAgent
      });
    }
    
    res.status(200).json({ success: true, message: 'Logout successful' });
  } catch (error) {
    res.status(200).json({ success: true, message: 'Logout successful' }); // Always return success for logout
  }
};