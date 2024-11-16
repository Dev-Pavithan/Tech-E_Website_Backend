import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import authenticate from '../middleware/authenticate.js';
import checkAdminRole from '../middleware/checkAdminRole.js';
import sendMail from '../utils/sendMail.js';
import { body, validationResult } from 'express-validator';
import upload from '../config/multer.js';
import cloudinary from '../config/cloudinary.js';

const router = express.Router();



// Register a new user
router.post('/register',
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      if (await User.findOne({ email })) {
        return res.status(400).json({ error: 'User already exists.' });
      }

      const newUser = new User({ name, email, password });
      await newUser.save();

      const welcomeMessage = `
        <h1>Welcome to Tech-E!</h1>
        <p>We’re excited to have you join our community.</p>
        <p>Cheers,<br/>Tech-E.</p>`;

      await sendMail(
        email,
        'Welcome to Tech-E!',
        `Welcome to Our Platform, ${name}!`,
        welcomeMessage
      );

      res.status(201).json({ message: 'User registered successfully!' });
    } catch (error) {
      console.error('Error registering user:', error);
      res.status(500).json({ error: 'Server error. Please try again later.' });
    }
  }
);



// Login a user
router.post('/login',
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const user = await User.findOne({ email });
      if (!user || !(await user.comparePassword(password))) {
        return res.status(400).json({ error: 'Invalid email or password.' });
      }

      const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });

      res.status(200).json({
        message: 'Login successful!',
        token,
        userId: user._id,
        role: user.role,
        name: user.name,
        email: user.email,
        blocked: user.blocked,
        packages: user.packages,
      });
    } catch (error) {
      console.error('Error logging in user:', error);
      res.status(500).json({ error: 'Server error. Please try again later.' });
    }
  }
);



// Get all users 
router.get('/all', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Server error. Please try again later.' });
  }
});




// Get a specific user by email
router.get('/by-email/:email', authenticate, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email }).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Server error. Please try again later.' });
  }
});




// Edit name for a specific user
router.patch('/edit-name/:email',
  authenticate,
  body('name').notEmpty().withMessage('Name is required'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name } = req.body;

    try {
      const user = await User.findOneAndUpdate(
        { email: req.params.email },
        { name },
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }

      res.status(200).json({ message: 'Name updated successfully!', user });
    } catch (error) {
      console.error('Error updating name:', error);
      res.status(500).json({ error: 'Server error. Please try again later.' });
    }
  }
);

// Update password for a specific user
router.patch('/update-password/:email',
  authenticate,
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    try {
      const user = await User.findOne({ email: req.params.email });
      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }

      // Verify current password
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ error: 'Current password is incorrect.' });
      }

      // Update to the new password
      user.password = newPassword;
      await user.save();

      res.status(200).json({ message: 'Password updated successfully!' });
    } catch (error) {
      console.error('Error updating password:', error);
      res.status(500).json({ error: 'Server error. Please try again later.' });
    }
  }
);

// Delete user account
router.delete('/delete-account/:email',
  authenticate,
  body('password').notEmpty().withMessage('Password is required to confirm deletion'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { password } = req.body;

    try {
      const user = await User.findOne({ email: req.params.email });
      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }

      // Verify password before deleting account
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({ error: 'Password is incorrect.' });
      }

      // Delete the user account
      await User.deleteOne({ email: req.params.email });
      res.status(200).json({ message: 'Account deleted successfully!' });
    } catch (error) {
      console.error('Error deleting account:', error);
      res.status(500).json({ error: 'Server error. Please try again later.' });
    }
  }
);


// Block a user (Admin only)
router.patch('/:id/block', authenticate, checkAdminRole, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    user.blocked = !user.blocked;
    await user.save();
    res.status(200).json({ message: `User ${user.blocked ? 'blocked' : 'unblocked'} successfully!` });
  } catch (error) {
    console.error('Error blocking/unblocking user:', error);
    res.status(500).json({ error: 'Server error. Please try again later.' });
  }
});

// Upload user profile image
router.post('/upload-image', authenticate, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Upload image to Cloudinary from memory buffer
    const result = await cloudinary.uploader.upload_stream({
      resource_type: 'image',
      // You can add more options like folder, width, height, etc.
    }, async (error, result) => {
      if (error) {
        return res.status(500).json({ error: 'Error uploading image to Cloudinary' });
      }

      // Update user's profileImageUrl in the database
      const user = await User.findByIdAndUpdate(
        req.user.id,
        { profileImageUrl: result.secure_url },
        { new: true, runValidators: true }
      ).select('-password');

      res.status(200).json({
        message: 'Profile image uploaded successfully!',
        user,
      });
    });

    // Pipe the file buffer to Cloudinary
    const stream = cloudinary.uploader.upload_stream({ resource_type: 'image' }, async (error, result) => {
      if (error) {
        return res.status(500).json({ error: 'Cloudinary upload error' });
      }
      // Update the user's profile image URL
      await User.findByIdAndUpdate(req.user.id, { profileImageUrl: result.secure_url });
      res.status(200).json({
        message: 'Profile image uploaded successfully!',
        user: await User.findById(req.user.id).select('-password'), // Fetch updated user
      });
    });

    // Convert buffer to stream and upload to Cloudinary
    stream.end(req.file.buffer);
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Server error. Please try again later.' });
  }
});
// Get user profile image
router.get('/profile-image', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('profileImageUrl -_id'); // Select only the profileImageUrl
    if (!user || !user.profileImageUrl) {
      return res.status(404).json({ error: 'Profile image not found.' });
    }
    res.status(200).json({ profileImageUrl: user.profileImageUrl });
  } catch (error) {
    console.error('Error fetching user profile image:', error);
    res.status(500).json({ error: 'Server error. Please try again later.' });
  }
});

// Update user profile image
router.patch('/update-profile-image', authenticate, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Upload image to Cloudinary from memory buffer
    const result = await cloudinary.uploader.upload_stream({
      resource_type: 'image',
      // You can add more options like folder, width, height, etc.
    }, async (error, result) => {
      if (error) {
        return res.status(500).json({ error: 'Error uploading image to Cloudinary' });
      }

      // Update user's profileImageUrl in the database
      const user = await User.findByIdAndUpdate(
        req.user.id,
        { profileImageUrl: result.secure_url },
        { new: true, runValidators: true }
      ).select('-password');

      res.status(200).json({
        message: 'Profile image updated successfully!',
        user,
      });
    });

    // Pipe the file buffer to Cloudinary
    const stream = cloudinary.uploader.upload_stream({ resource_type: 'image' }, async (error, result) => {
      if (error) {
        return res.status(500).json({ error: 'Cloudinary upload error' });
      }
      // Update the user's profile image URL
      await User.findByIdAndUpdate(req.user.id, { profileImageUrl: result.secure_url });
      res.status(200).json({
        message: 'Profile image uploaded successfully!',
        user: await User.findById(req.user.id).select('-password'), // Fetch updated user
      });
    });

    // Convert buffer to stream and upload to Cloudinary
    stream.end(req.file.buffer);
  } catch (error) {
    console.error('Error updating profile image:', error);
    res.status(500).json({ error: 'Server error. Please try again later.' });
  }
});

// Remove user profile image
router.delete('/remove-profile-image', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.profileImageUrl) {
      return res.status(404).json({ error: 'No profile image to remove.' });
    }

    // Remove the profile image URL from the user document
    user.profileImageUrl = null; // Set the URL to null or empty
    await user.save();

    res.status(200).json({ message: 'Profile image removed successfully!' });
  } catch (error) {
    console.error('Error removing profile image:', error);
    res.status(500).json({ error: 'Server error. Please try again later.' });
  }
});






// Edit user role (Admin Only)
router.patch('/edit-role/:id', authenticate, checkAdminRole, async (req, res) => {
  const { role } = req.body;

  // Validate that role is either 'user' or 'admin'
  if (!['user', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role. Role must be either "user" or "admin".' });
  }

  try {
    // Fetch the user based on the ID from params
    const user = await User.findById(req.params.id);
    
    // If the user is not found, return an error
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    let emailSuccess = false;

    // If changing the role to 'admin', send email
    if (role === 'admin' && user.role !== 'admin') {
      const emailMessage = `
        <h1>Congratulations!</h1>
        <p>You have been assigned the Admin role on Tech-E.</p>
        <p>If you have any questions, feel free to reach out to us.</p>
        <p>Cheers,<br/>Tech-E Team</p>
      `;
      
      // Send email
      try {
        const emailResponse = await sendMail(
          user.email, 
          'Your Role has been Updated', 
          'Congratulations! You are now an Admin.', 
          emailMessage
        );

        if (emailResponse) {
          emailSuccess = true;
        } else {
        }
      } catch (emailError) {
        // Log the detailed error from email service
        console.error('Error sending email:', emailError);
      }
    }

    // Proceed to update the role
    user.role = role;
    await user.save();

    // Respond to client
    const message = emailSuccess
      ? 'User role updated successfully and email sent!'
      : 'User role updated successfully.';
    res.status(200).json({
      message: message,
      emailSent: emailSuccess,
    });

  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Server error. Please try again later.' });
  }
});

router.get('/test', async (req, res) => {
  try {
    const users = await User.find();
    // res.status(200).json(users);
    res.send('<h1>TEST  Successfully</h1>')
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Server error. Please try again later.' });
  }
});


export default router;
