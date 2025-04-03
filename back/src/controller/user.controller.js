const bcrypt = require('bcryptjs');
const Users = require('../model/user.model');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');


let loggedInUsersCount = 0; 
const MAX_LOGINS = 10; 


const register = async (req, res) => {
  try {
    const { name, email, password, contact } = req.body;

    const userCount = await Users.countDocuments(); 
    if (userCount >= MAX_LOGINS) {
      return res.status(403).json({ message: 'Registration limit reached. Please try again later.' });
    }

    const existingUser = await Users.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new Users({
      name,
      email,
      password: hashedPassword,
      contact,
    });

    await user.save();

    console.log('User registered:', user);
    res.status(201).json({ message: 'User registered successfully!' });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ error: error.message });
  }
};


// Assuming you have the necessary imports
const getUsers = async (req, res) => {
  try {
    const users = await Users.find();
    const usersWithoutPassword = users.map(user => {
      user.password = undefined;  // Remove password from the response
      return user;
    });

    res.status(200).json(usersWithoutPassword); // Return array directly without 'data'
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: error.message });
  }
};



const getUserById = async (req, res) => {
  const { id } = req.params;

  // Validate the ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  try {
    const user = await Users.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    res.status(500).json({ message: 'Error fetching user data' });
  }
};




// Delete user by ID
const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedAccount = await Users.findByIdAndDelete(id);

    if (!deletedAccount) {
      return res.status(404).json({
        success: false,
        message: "Account not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Account deleted successfully",
      data: deletedAccount
    });
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
    });
  }
};

const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, email, password, contact } = req.body;

  try {
  
    const user = await Users.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (contact) user.contact = contact;

    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    
    await user.save();

    res.status(200).json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        contact: user.contact,
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: error.message });
  }
};


const login = async (req, res) => {
  const { email, password } = req.body;

  console.log('Login attempt with email:', email); 

  // Validate input
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const JWT_SECRET = process.env.JWT_SECRET || "randome#certificate"; 

  if (loggedInUsersCount >= MAX_LOGINS) {
    return res.status(403).json({ message: 'You have reached the login limit. Try again later.' });
  }

  try {
    
    const normalizedEmail = email.toLowerCase();

    const user = await Users.findOne({ email: normalizedEmail });

    if (!user) {
      console.log('User not found with email:', normalizedEmail); 
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log('Invalid password for user:', normalizedEmail); 
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT tokens
    const accessToken = jwt.sign({ userId: user._id }, JWT_SECRET); 
    const refreshToken = jwt.sign({ userId: user._id }, JWT_SECRET); 

    // Store the refresh token in the user record
    user.refreshToken = refreshToken;
    await user.save();

    loggedInUsersCount++;

    // Send the accessToken and refreshToken to the frontend
    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        contact: user.contact
      }
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Error during login. Please try again.' });
  }
};




const refreshToken = async (req, res) => {
  const { token } = req.body;

  if (!token) return res.sendStatus(401);

  const user = await Users.findOne({ refreshToken: token });
  if (!user) return res.sendStatus(403);

  jwt.verify(token, process.env.JWT_SECRET, (err) => {
    if (err) return res.sendStatus(403);

    const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
    res.json({ accessToken });
  });
};

const logout = async (req, res) => {
  const { token } = req.body;

  const user = await Users.findOne({ refreshToken: token });
  if (!user) return res.sendStatus(404);

  user.refreshToken = null;
  await user.save();

  loggedInUsersCount--;

  res.sendStatus(204); 
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getUsers,
  deleteUser,
  updateUser, 
  getUserById,
};
