import express from 'express';
import Contact from '../models/Contact.js';
import { body, validationResult } from 'express-validator';
import authenticate from '../middleware/authenticate.js'; 
import checkAdminRole from '../middleware/checkAdminRole.js'; 
import sendMail from '../utils/sendMail.js';

const router = express.Router();

// Middleware for input validation
const validateContact = [
  body('name').notEmpty().withMessage('Name is required.'),
  body('email').isEmail().withMessage('Valid email is required.'),
  body('phone').matches(/^\+?[1-9]\d{1,14}$/).withMessage('Valid phone number is required.'),
  body('message').notEmpty().withMessage('Message is required.'),
];

// Create a new contact message
router.post('/', validateContact, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, phone, message } = req.body;

  try {
    // Create and save new contact message
    const newContact = new Contact({
      name,
      email,
      phone,
      message,
    });

    await newContact.save();

    // Send email to the EMAIL_USER to notify about the new contact message
    const emailSubject = 'New Contact Message Submitted';
    const emailText = `You have received a new contact message from ${name} (${email}).\n\nPhone: ${phone}\n\nMessage: ${message}`;
    const emailHtml = `
      <h1>New Contact Message</h1>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Message:</strong><br/>${message}</p>
    `;

    // Send email to the EMAIL_USER
    await sendMail(process.env.EMAIL_USER, emailSubject, emailText, emailHtml);

    res.status(201).json({ message: 'Contact message submitted successfully!' });
  } catch (error) {
    console.error('Error submitting contact message:', error);
    res.status(500).json({ error: 'Server error. Please try again later.' });
  }
});

// Get all contact messages (Admin only)
router.get('/all', authenticate, checkAdminRole, async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ _id: -1 }); 
    res.status(200).json(contacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Server error. Please try again later.' });
  }
});

// Delete a contact message (Admin only)
router.delete('/:id', authenticate, checkAdminRole, async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found.' });
    }
    res.status(200).json({ message: 'Contact deleted successfully!' });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({ error: 'Server error. Please try again later.' });
  }
});


// Get a specific contact message by ID (Admin only)
router.get('/:id', authenticate, checkAdminRole, async (req, res) => {
  const { id } = req.params;

  try {
    const contact = await Contact.findById(id);
    if (!contact) {
      return res.status(404).json({ error: 'Contact message not found.' });
    }
    res.status(200).json(contact);
  } catch (error) {
    console.error('Error fetching contact message:', error);
    res.status(500).json({ error: 'Server error. Please try again later.' });
  }
});
// Reply to a contact message (Admin only)
router.post(
  '/reply',
  authenticate,
  checkAdminRole,
  [
    body('to').isEmail().withMessage('A valid recipient email is required.'),
    body('subject').notEmpty().withMessage('Subject is required.'),
    body('message').notEmpty().withMessage('Message content is required.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { from, to, subject, message } = req.body;

    try {
      // Send reply email
      await sendMail(to, subject, message, `<p>${message}</p>`);

      res.status(200).json({ message: 'Reply sent successfully!' });
    } catch (error) {
      console.error('Error sending reply:', error);
      res.status(500).json({ error: 'Failed to send reply. Please try again later.' });
    }
  }
);

export default router;

