import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subject: { type: String, required: true, trim: true },
    category: { type: String, enum: ['cashback', 'withdrawal', 'account', 'store', 'other'], default: 'other' },
    status: { type: String, enum: ['open', 'in_progress', 'closed'], default: 'open', index: true },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    lastMessageAt: { type: Date, default: Date.now },
  },
  { collection: 'tickets', timestamps: true },
);

ticketSchema.index({ user: 1, status: 1 });

export default mongoose.model('Ticket', ticketSchema);
