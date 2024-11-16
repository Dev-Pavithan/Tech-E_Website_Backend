import multer from 'multer';
import path from 'path';

// Set up storage for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Set the destination folder for uploads
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Set a unique filename
  },
});

// Initialize multer with the storage configuration
const upload = multer({ storage });

// Export the upload middleware to be used in the routes
export default upload;
