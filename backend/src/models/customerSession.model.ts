import mongoose from 'mongoose';

const customerSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    sessionId: { type: String, required: true, unique: true, index: true },
    tokenJti: { type: String, default: '' },
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    device: { type: String, default: '' },
    expiresAt: { type: Date, default: null },
    revokedAt: { type: Date, default: null },
  },
  { collection: 'customerSessions', timestamps: true },
);

export default mongoose.model('CustomerSession', customerSessionSchema);
