import { Ticket, TicketMessage } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { buildPagination } from '../utils/helpers.js';
import { TICKET_STATUS } from '../utils/constants.js';

export const createTicket = asyncHandler(async (req, res) => {
  const { subject, category, message } = req.body;
  if (!subject) throw ApiError.badRequest('Subject is required');
  if (!message) throw ApiError.badRequest('Message is required');

  const ticket = await Ticket.create({
    user: req.user._id,
    subject,
    category: category || 'other',
    status: TICKET_STATUS.OPEN,
    lastMessageAt: new Date(),
  });

  await TicketMessage.create({
    ticket: ticket._id,
    sender: req.user._id,
    senderType: 'user',
    message,
  });

  return res.status(201).json({ success: true, data: ticket });
});

export const listMyTickets = asyncHandler(async (req, res) => {
  const { page, limit, skip } = buildPagination(req.query);
  const [tickets, total] = await Promise.all([
    Ticket.find({ user: req.user._id }).sort({ lastMessageAt: -1 }).skip(skip).limit(limit),
    Ticket.countDocuments({ user: req.user._id }),
  ]);
  return res.status(200).json({
    success: true,
    data: tickets,
    meta: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const getTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) throw ApiError.notFound('Ticket not found');

  if (req.entityType !== 'admin' && ticket.user.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('Not authorized');
  }

  const messages = await TicketMessage.find({ ticket: ticket._id }).sort({ createdAt: 1 });
  return res.status(200).json({ success: true, data: { ticket, messages } });
});

export const addMessage = asyncHandler(async (req, res) => {
  const { message } = req.body;
  if (!message) throw ApiError.badRequest('Message is required');

  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) throw ApiError.notFound('Ticket not found');

  const isAdmin = req.entityType === 'admin';
  if (!isAdmin && ticket.user.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('Not authorized');
  }

  await TicketMessage.create({
    ticket: ticket._id,
    sender: req.user._id,
    senderType: isAdmin ? 'admin' : 'user',
    message,
  });

  if (ticket.status === TICKET_STATUS.CLOSED) {
    ticket.status = TICKET_STATUS.OPEN;
  } else if (isAdmin) {
    ticket.status = TICKET_STATUS.IN_PROGRESS;
  } else {
    ticket.status = TICKET_STATUS.OPEN;
  }
  ticket.lastMessageAt = new Date();
  await ticket.save();

  return res.status(201).json({ success: true, data: { ticket, message } });
});

export const updateTicketStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) throw ApiError.notFound('Ticket not found');
  if (status && !Object.values(TICKET_STATUS).includes(status)) {
    throw ApiError.badRequest('Invalid ticket status');
  }
  ticket.status = status || ticket.status;
  await ticket.save();
  return res.status(200).json({ success: true, data: ticket });
});
