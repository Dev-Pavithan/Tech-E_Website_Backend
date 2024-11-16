import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// Route to login a user
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Basic validation
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    // Compare passwords
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    // Login successful
    res.status(200).json({ message: 'Login successful!' });
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({ error: 'Server error. Please try again later.' });
  }
});

export default router;