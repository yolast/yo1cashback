import mongoose from 'mongoose';

const loginLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
    email: { type: String, default: '', lowercase: true },
    method: { type: String, enum: ['google', 'phone', 'email'], default: 'google' },
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    success: { type: Boolean, default: true },
    reason: { type: String, default: '' },
  },
  { collection: 'loginLogs', timestamps: true },
);

loginLogSchema.index({ email: 1, createdAt: -1 });

export default mongoose.model('LoginLog', loginLogSchema);
