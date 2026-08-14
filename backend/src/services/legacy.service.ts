import mongoose from 'mongoose';
import config from '../config/index.js';

let connection: mongoose.Connection | null = null;
let model: any = null;

export function isLegacyConfigured(): boolean {
  return Boolean(config.legacy.uri);
}

export function getLegacyUserModel(): any {
  if (!config.legacy.uri) return null;
  if (connection && model) return model;

  // Read-only connection to the YOlast.com legacy database.
  connection = mongoose.createConnection(config.legacy.uri, {
    serverSelectionTimeoutMS: 10000,
    readPreference: 'primary',
    ...(config.legacy.dbName ? { dbName: config.legacy.dbName } : {}),
  });

  model = connection.model(
    'LegacyUser',
    new mongoose.Schema({}, { strict: false }),
    config.legacy.usersCollection,
  );
  return model;
}

function phoneVariants(phone?: string): string[] {
  if (!phone) return [];
  const variants = [phone];
  const digits = phone.replace(/\D/g, '');
  if (digits) {
    variants.push(digits);
    if (digits.length > 10) variants.push(digits.slice(-10));
  }
  return [...new Set(variants)];
}

export async function findLegacyUser(identifier: {
  phone?: string;
  email?: string;
  firebaseUid?: string;
}): Promise<any> {
  const m = getLegacyUserModel();
  if (!m) return null;

  const field = config.legacy.matchField || 'phone';

  // Phone logins: STRICT phone match against the legacy users collection.
  if (field === 'phone' && identifier.phone) {
    const variants = phoneVariants(identifier.phone);
    if (variants.length) {
      const found = await m.findOne({ phone: { $in: variants } }).lean();
      if (found) return found;
    }
    return null; // phone logins must match by phone only
  }

  // Non-phone logins (e.g. Google): match by configured field, then email/firebaseUid.
  const primary = identifier[field as keyof typeof identifier];
  if (primary) {
    const found = await m.findOne({ [field]: primary }).lean();
    if (found) return found;
  }
  if (identifier.email) {
    const found = await m.findOne({ email: identifier.email }).lean();
    if (found) return found;
  }
  if (identifier.firebaseUid) {
    const found = await m.findOne({ firebaseUid: identifier.firebaseUid }).lean();
    if (found) return found;
  }

  return null;
}

export default { isLegacyConfigured, getLegacyUserModel, findLegacyUser };
