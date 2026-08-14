import { Setting } from '../models/index.js';

export async function getSettingsMap(): Promise<Record<string, any>> {
  const docs = await Setting.find({});
  return docs.reduce<Record<string, any>>((acc, d) => ({ ...acc, [d.key]: d.value }), {});
}

export async function getSetting(key: string, fallback: any = undefined): Promise<any> {
  const doc = await Setting.findOne({ key });
  return doc ? doc.value : fallback;
}

export async function setSetting(key: string, value: unknown, description = '') {
  return Setting.findOneAndUpdate({ key }, { value, description }, { new: true, upsert: true });
}

export async function isMaintenanceMode(): Promise<boolean> {
  const value: any = await getSetting('maintenanceMode', false);
  return value === true || value === 'true' || value === 'on' || value === '1';
}

export default { getSettingsMap, getSetting, setSetting, isMaintenanceMode };
