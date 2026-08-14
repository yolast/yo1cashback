import mongoose from 'mongoose';

const customerCashbackSummarySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    totalOrders: { type: Number, default: 0 },
    totalOrderValue: { type: Number, default: 0 },
    totalEarned: { type: Number, default: 0 },
    totalCompleted: { type: Number, default: 0 },
    totalPending: { type: Number, default: 0 },
    totalRejected: { type: Number, default: 0 },
    totalWithdrawn: { type: Number, default: 0 },
    lastEarnedAt: { type: Date, default: null },
  },
  { collection: 'customerCashbackSummary', timestamps: true },
);

export default mongoose.model('CustomerCashbackSummary', customerCashbackSummarySchema);
