import mongoose from 'mongoose';

const packageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    version: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    price: {
        type: String,
        required: true,
    },
    images: [String], 
    updatedAt: {
        type: Date,
        default: Date.now,
    }
});

const Package = mongoose.model('Package', packageSchema);
export default Package;
