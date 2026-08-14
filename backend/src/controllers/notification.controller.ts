import { Notification } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { buildPagination } from '../utils/helpers.js';

export const listNotifications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = buildPagination(req.query);
  const [notifications, total, unread] = await Promise.all([
    Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments({ user: req.user._id }),
    Notification.countDocuments({ user: req.user._id, read: false }),
  ]);

  return res.status(200).json({
    success: true,
    data: notifications,
    meta: { page, limit, total, pages: Math.ceil(total / limit), unread },
  });
});

export const markRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { read: true },
    { new: true },
  );
  if (!notification) throw ApiError.notFound('Notification not found');
  return res.status(200).json({ success: true, data: notification });
});

export const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
  return res.status(200).json({ success: true });
});
