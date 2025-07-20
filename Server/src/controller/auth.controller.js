import authService from '../service/authService.js';
import userService from '../service/userService.js';

// User login
export const loginUser = async (req, res) => {
  try {
    const { email, password, mdaId } = req.body;
    const result = await authService.loginUser(email, password, mdaId);
    res.status(200).json({ success: true, message: 'Login successful', data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Admin login
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginAdmin(email, password);
    res.status(200).json({ success: true, message: 'Admin login successful', data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get MDAs for login dropdown
export const getMDAs = async (req, res) => {
  try {
    const mdas = await authService.getMDAs();
    res.status(200).json({ success: true, data: mdas });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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