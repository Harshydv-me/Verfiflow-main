const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: false },
    phone: { type: String, required: false },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['farmer', 'marketplaceuser', 'admin'], default: 'farmer' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    verificationStatus: { type: String, enum: ['unverified', 'verified'], default: 'unverified' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);