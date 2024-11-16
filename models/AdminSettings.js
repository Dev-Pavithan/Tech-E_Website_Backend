// import mongoose from 'mongoose';
// import bcrypt from 'bcrypt';

// const adminSettingsSchema = new mongoose.Schema({
//   username: {
//     type: String,
//     required: true,
//     unique: true,
//     trim: true,
//   },
//   email: {
//     type: String,
//     required: true,
//     unique: true,
//     trim: true,
//   },
//   password: {
//     type: String,
//     required: true,
//   },
//   theme: {
//     type: String,
//     enum: ['light', 'dark'],
//     default: 'light',
//   },
// }, { timestamps: true });

// // Hash password before saving
// adminSettingsSchema.pre('save', async function (next) {
//   if (this.isModified('password')) {
//     this.password = await bcrypt.hash(this.password, 10);
//   }
//   next();
// });

// // Method to compare passwords
// adminSettingsSchema.methods.comparePassword = async function (candidatePassword) {
//   return bcrypt.compare(candidatePassword, this.password);
// };

// const AdminSettings = mongoose.model('AdminSettings', adminSettingsSchema);
// export default AdminSettings;
