// import express from 'express';
// import AdminSettings from '../models/AdminSettings.js';

// const router = express.Router();

// // Get admin settings (Read)
// router.get('/', async (req, res) => {
//   try {
//     const adminSettings = await AdminSettings.findOne(); // Assuming only one settings document
//     res.json(adminSettings);
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to retrieve admin settings' });
//   }
// });

// // Update admin settings
// router.put('/', async (req, res) => {
//   try {
//     const { username, email, password, theme } = req.body;
//     const updatedSettings = {};

//     if (username) updatedSettings.username = username;
//     if (email) updatedSettings.email = email;
//     if (password) updatedSettings.password = password;
//     if (theme) updatedSettings.theme = theme;

//     const adminSettings = await AdminSettings.findOneAndUpdate({}, updatedSettings, {
//       new: true,
//       upsert: true, // Create if it doesn't exist
//     });

//     res.json(adminSettings);
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to update admin settings' });
//   }
// });

// // Delete admin settings (Optional)
// router.delete('/', async (req, res) => {
//   try {
//     await AdminSettings.deleteOne();
//     res.json({ message: 'Admin settings deleted' });
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to delete admin settings' });
//   }
// });

// export default router;
