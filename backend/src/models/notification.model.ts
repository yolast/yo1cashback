import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    body: { type: String, default: '' },
    type: { type: String, enum: ['cashback', 'withdrawal', 'referral', 'ticket', 'system'], default: 'system' },
    read: { type: Boolean, default: false },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { collection: 'notifications', timestamps: true },
);

notificationSchema.index({ user: 1, read: 1 });

export default mongoose.model('Notification', notificationSchema);
