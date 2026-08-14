import mongoose from 'mongoose';

const withdrawalRequestSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true },
    upiId: { type: String, default: '' },
    remarks: { type: String, default: '' },

    fee: { type: Number, default: 0 },
    netAmount: { type: Number, required: true },
    method: { type: String, default: 'upi' },

    status: { type: String, enum: ['pending', 'approved', 'rejected', 'paid'], default: 'pending', index: true },
    processedAt: { type: Date, default: null },
    note: { type: String, default: '' },

    statusHistory: [
      {
        status: { type: String, enum: ['pending', 'approved', 'rejected', 'paid'] },
        note: { type: String, default: '' },
        by: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { collection: 'withdrawalRequests', timestamps: true },
);

withdrawalRequestSchema.index({ user: 1, status: 1 });

export default mongoose.model('WithdrawalRequest', withdrawalRequestSchema);
