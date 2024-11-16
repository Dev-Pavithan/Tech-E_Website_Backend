import express from 'express';
import multer from 'multer';
import cloudinary from 'cloudinary';
import User from '../models/User.js';
import Package from '../models/packageModel.js';

const router = express.Router();

// Cloudinary configuration
cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Set up multer for handling multipart/form-data
const storage = multer.memoryStorage();
const upload = multer({ storage });

// POST (create) a new package with images
router.post('/', upload.array('images', 10), async (req, res) => {
    const { name, version, description, price } = req.body;
    try {
        const uploadedImages = [];

        // Check if any files were uploaded
        if (req.files) {
            // Upload images to Cloudinary
            const uploadPromises = req.files.map(file =>
                new Promise((resolve, reject) => {
                    const stream = cloudinary.v2.uploader.upload_stream(
                        { folder: 'packages' },
                        (error, result) => {
                            if (error) {
                                console.error('Cloudinary upload error:', error);
                                return reject(error);
                            }
                            resolve(result.secure_url);
                        }
                    );
                    stream.end(file.buffer);
                })
            );

            // Wait for all uploads to finish
            uploadedImages.push(...await Promise.all(uploadPromises));
        }

        const newPackage = new Package({ name, version, description, price, images: uploadedImages });
        await newPackage.save();
        res.status(201).json(newPackage);
    } catch (error) {
        console.error('Error creating package:', error);
        res.status(500).json({ message: 'Error creating package', error });
    }
});

// PUT (update) an existing package by ID with optional new images
router.put('/:id', upload.array('images', 10), async (req, res) => {
    const { id } = req.params;
    const { name, version, description, price } = req.body;
    try {
        const uploadedImages = [];

        // Check if any files were uploaded
        if (req.files) {
            const uploadPromises = req.files.map(file =>
                new Promise((resolve, reject) => {
                    const stream = cloudinary.v2.uploader.upload_stream(
                        { folder: 'packages' },
                        (error, result) => {
                            if (error) {
                                console.error('Cloudinary upload error:', error);
                                return reject(error);
                            }
                            resolve(result.secure_url);
                        }
                    );
                    stream.end(file.buffer);
                })
            );

            // Wait for all uploads to finish
            uploadedImages.push(...await Promise.all(uploadPromises));
        }

        const updatedPackage = await Package.findByIdAndUpdate(
            id,
            {
                name,
                version,
                description,
                price,
                images: uploadedImages.length > 0 ? uploadedImages : undefined,
                updatedAt: Date.now()
            },
            { new: true }
        );

        if (!updatedPackage) {
            return res.status(404).json({ message: 'Package not found' });
        }

        res.status(200).json(updatedPackage);
    } catch (error) {
        console.error('Error updating package:', error);
        res.status(500).json({ message: 'Error updating package', error });
    }
});

// GET all packages
router.get('/', async (req, res) => {
    try {
        const packages = await Package.find();
        res.status(200).json(packages);
    } catch (error) {
        console.error('Error fetching packages:', error);
        res.status(500).json({ message: 'Error fetching packages', error });
    }
});

// Route for user to purchase a package
router.post('/purchase', async (req, res) => {
    const { userId, packageId } = req.body;

    // Basic validation
    if (!userId || !packageId) {
        return res.status(400).json({ error: 'User ID and Package ID are required.' });
    }

    try {
        // Find the user and the package
        const user = await User.findById(userId);
        const packageData = await Package.findById(packageId);
        
        if (!user || !packageData) {
            return res.status(404).json({ error: 'User or Package not found.' });
        }

        // Add package to user's profile
        user.packages.push(packageData._id);
        await user.save();

        res.status(200).json({ message: 'Package purchased successfully!', user });
    } catch (error) {
        console.error('Error purchasing package:', error);
        res.status(500).json({ error: 'Server error. Please try again later.' });
    }
});

// GET a package by ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const packageData = await Package.findById(id);
        if (!packageData) {
            return res.status(404).json({ message: 'Package not found' });
        }
        res.status(200).json(packageData);
    } catch (error) {
        console.error('Error fetching package:', error);
        res.status(500).json({ message: 'Error fetching package', error });
    }
});

// DELETE a package by ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const deletedPackage = await Package.findByIdAndDelete(id);
        if (!deletedPackage) {
            return res.status(404).json({ message: 'Package not found' });
        }
        res.status(200).json({ message: 'Package deleted successfully' });
    } catch (error) {
        console.error('Error deleting package:', error);
        res.status(500).json({ message: 'Error deleting package', error });
    }
});

export default router;
