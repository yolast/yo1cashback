import mongoose from 'mongoose';

const ticketMessageSchema = new mongoose.Schema(
  {
    ticket: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, required: true },
    senderType: { type: String, enum: ['user', 'admin'], required: true },
    message: { type: String, required: true },
  },
  { collection: 'ticketMessages', timestamps: true },
);

ticketMessageSchema.index({ ticket: 1, createdAt: 1 });

export default mongoose.model('TicketMessage', ticketMessageSchema);
