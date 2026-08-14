import bcrypt from 'bcryptjs';
import { connectDB } from '../config/db.js';
import mongoose from '../config/db.js';
import { Setting, Admin } from '../models/index.js';
import config from '../config/index.js';
import logger from './logger.js';

const settings = [
  { key: 'platformName', value: 'YO1Cashback', description: 'Platform / brand name' },
  { key: 'supportEmail', value: 'support@yo1cashback.com', description: 'Support email' },
  { key: 'supportPhone', value: '+919999999999', description: 'Support phone' },
  { key: 'minWithdrawal', value: 10, description: 'Minimum withdrawal amount' },
  { key: 'maxWithdrawal', value: 0, description: 'Maximum withdrawal amount (0 = unlimited)' },
  { key: 'maintenanceMode', value: false, description: 'Maintenance mode (true/false)' },
  { key: 'referralBonusRate', value: 10, description: 'Referral bonus % of referee cashback' },
  { key: 'cashbackConfirmDays', value: 30, description: 'Pending cashback confirmation window (days)' },
  { key: 'defaultCashbackRate', value: 5, description: 'Default cashback % for new merchants' },
];

async function seed() {
  try {
    await connectDB();

    await Setting.deleteMany({});
    await Setting.insertMany(settings);
    logger.info(`Seeded ${settings.length} settings`);

    if (config.adminEmail && config.adminPassword) {
      const email = config.adminEmail.toLowerCase();
      const existing = await Admin.findOne({ email });
      if (!existing) {
        const passwordHash = await bcrypt.hash(config.adminPassword, 12);
        await Admin.create({ email, passwordHash, name: 'Super Admin', role: 'superadmin' });
        logger.info(`Seeded super admin: ${email}`);
      } else {
        logger.info(`Super admin already exists: ${email}`);
      }
    } else {
      logger.warn('ADMIN_EMAIL/ADMIN_PASSWORD not set — skipping super admin creation');
    }

    logger.info('Seed complete. (Store catalog will be seeded once the store schema is provided.)');
  } catch (err) {
    logger.error(`Seed failed: ${err.stack}`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seed();
