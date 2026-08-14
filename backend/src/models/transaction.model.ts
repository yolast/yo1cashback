import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    orderId: { type: String, required: true, unique: true, index: true },
    queueItem: { type: mongoose.Schema.Types.ObjectId, ref: 'CashbackQueue', default: null },

    storeId: { type: String, default: '' },
    storeName: { type: String, default: '' },

    orderAmount: { type: Number, required: true, default: 0 },
    cashbackAmount: { type: Number, default: 0 },
    orderStatus: { type: String, enum: ['completed', 'processing', 'cancelled', 'returned'], default: 'completed' },
    source: { type: String, enum: ['postback', 'manual', 'tracked'], default: 'manual' },
    trackedAt: { type: Date, default: Date.now },
  },
  { collection: 'transactions', timestamps: true },
);

transactionSchema.index({ user: 1, orderStatus: 1 });

export default mongoose.model('Transaction', transactionSchema);
