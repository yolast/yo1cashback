import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    name: { type: String, trim: true, default: '' },
    avatar: { type: String, default: '' },
    role: { type: String, enum: ['superadmin'], default: 'superadmin' },
    permissions: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: null },
  },
  { collection: 'admins', timestamps: true },
);

export default mongoose.model('Admin', adminSchema);
