import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    firebaseUid: { type: String, required: true, unique: true, index: true },
    email: { type: String, lowercase: true, trim: true, sparse: true, unique: true },
    phone: { type: String, sparse: true, unique: true, index: true },
    name: { type: String, trim: true, default: '' },
    avatar: { type: String, default: '' },
    customerId: { type: String, unique: true, sparse: true, index: true },

    role: { type: String, enum: ['customer'], default: 'customer' },

    referralCode: { type: String, unique: true, sparse: true, index: true },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    payout: {
      method: { type: String, enum: ['upi', 'bank', 'paypal', 'crypto'], default: 'bank' },
      upi: { type: String, default: '' },
      bankName: { type: String, default: '' },
      accountHolder: { type: String, default: '' },
      accountNumber: { type: String, default: '' },
      ifsc: { type: String, default: '' },
      paypalEmail: { type: String, default: '' },
      cryptoAddress: { type: String, default: '' },
    },

    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: Date.now },
  },
  { collection: 'users', timestamps: true },
);

userSchema.index({ referredBy: 1 });

export default mongoose.model('User', userSchema);
