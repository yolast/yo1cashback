import dns from 'node:dns';
import mongoose from 'mongoose';
import config from './index.js';
import logger from '../utils/logger.js';

// Workaround for local DNS proxies (VPN clients, DNS tools) that refuse SRV/TXT queries,
// which breaks `mongodb+srv://` URIs. Override Node's resolver with public DNS servers.
// Configure via DNS_SERVERS (comma-separated) in .env.
const dnsServers = (process.env.DNS_SERVERS || '8.8.8.8,1.1.1.1')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
if (dnsServers.length) {
  dns.setServers(dnsServers);
}

export async function connectDB() {
  mongoose.set('strictQuery', true);

  mongoose.connection.on('connected', () => logger.info('MongoDB connected'));
  mongoose.connection.on('error', (err) => logger.error(`MongoDB error: ${err.message}`));
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));

  try {
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 15000,
      maxPoolSize: 10,
    });
  } catch (err) {
    logger.error(`MongoDB connection failed: ${err.message}`);
    process.exit(1);
  }
}

export default mongoose;
