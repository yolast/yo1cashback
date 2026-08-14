import mongoose from 'mongoose';

const cashbackQueueSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    transaction: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction', default: null },

    storeId: { type: String, default: '' },
    storeName: { type: String, default: '' },
    storeUrl: { type: String, default: '' },

    orderId: { type: String, required: true, unique: true, index: true },
    orderAmount: { type: Number, required: true, default: 0 },
    cashbackAmount: { type: Number, required: true, default: 0 },
    rate: { type: Number, default: 0 },
    rateType: { type: String, enum: ['percent', 'fixed'], default: 'percent' },

    type: { type: String, enum: ['purchase', 'referral', 'signup_bonus', 'adjustment'], default: 'purchase' },
    status: { type: String, enum: ['pending', 'processing', 'completed', 'rejected'], default: 'pending', index: true },
    position: { type: Number, index: true },
    source: { type: String, enum: ['postback', 'manual', 'tracked', 'referral'], default: 'manual' },
    clickId: { type: String, default: '' },

    trackedAt: { type: Date, default: Date.now },
    confirmedAt: { type: Date, default: null },
    rejectedReason: { type: String, default: '' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { collection: 'cashbackQueue', timestamps: true },
);

cashbackQueueSchema.index({ user: 1, status: 1 });
cashbackQueueSchema.index({ storeId: 1 });

export default mongoose.model('CashbackQueue', cashbackQueueSchema);
