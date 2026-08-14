import mongoose from 'mongoose';

const walletSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    balance: { type: Number, default: 0 },
    totalEarned: { type: Number, default: 0 },
    totalPending: { type: Number, default: 0 },
    totalWithdrawn: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
  },
  { collection: 'wallets', timestamps: true },
);

export default mongoose.model('Wallet', walletSchema);
