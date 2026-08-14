import { Setting } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getSettingsMap, setSetting } from '../services/settings.service.js';

export const getPublicSettings = asyncHandler(async (_req, res) => {
  const s = await getSettingsMap();
  return res.status(200).json({
    success: true,
    data: {
      platformName: s.platformName || 'YO1Cashback',
      supportEmail: s.supportEmail || '',
      supportPhone: s.supportPhone || '',
      minWithdrawal: Number(s.minWithdrawal ?? 0),
      maxWithdrawal: Number(s.maxWithdrawal ?? 0),
      maintenanceMode: s.maintenanceMode === true || s.maintenanceMode === 'true',
    },
  });
});

export const getAllSettings = asyncHandler(async (_req, res) => {
  const settings = await Setting.find({});
  return res.status(200).json({ success: true, data: settings });
});

export const updateSetting = asyncHandler(async (req, res) => {
  const { key, value, description } = req.body;
  if (!key) throw ApiError.badRequest('key is required');

  const setting = await setSetting(key, value, description || '');
  return res.status(200).json({ success: true, data: setting });
});

export default { getPublicSettings, getAllSettings, updateSetting };
