import express from 'express';
import upload from '../config/multer.js';
import cloudinary from '../config/cloudinary.js';
import { sendEmail } from '../config/email.js';
import Image from '../models/Image.js';

const router = express.Router();

router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: 'No image uploaded.' });
    }

    cloudinary.uploader.upload_stream(
      { resource_type: 'image' },
      async (error, result) => {
        if (error) {
          return res.status(500).json({ message: 'Cloudinary upload failed.' });
        }

        const email = req.body.email;
        const newImage = new Image({
          imageUrl: result.secure_url,
          email: email,
        });

        try {
          await newImage.save();
          res.status(200).json({ message: 'Image uploaded successfully.', imageUrl: result.secure_url });
        } catch (err) {
          res.status(500).json({ message: 'Failed to save image in DB.' });
        }
      }
    ).end(file.buffer);
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Edit an image and send an email
router.post('/edit', async (req, res) => {
  const { email, imageUrl } = req.body; // Destructure both email and imageUrl

  try {
    // Prepare the email content
    const subject = 'Request to Edit Avatar Model';
    const text = `
      Hello,

      I hope this message finds you well. I would like to request your assistance in editing my avatar model. 

      Here is the image I would like you to work on:
      ${imageUrl}
    `;

    // Send the email
    sendEmail(email, subject, text);

    res.status(200).json({ message: 'Edit request sent via email.' });
  } catch (err) {
    console.error(err); // Log error for debugging
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});


export default router;
