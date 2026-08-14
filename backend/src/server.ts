import app from './app.js';
import config from './config/index.js';
import { connectDB } from './config/db.js';
import { startJobs } from './jobs/index.js';
import logger from './utils/logger.js';

async function start() {
  await connectDB();

  const server = app.listen(config.port, () => {
    logger.info(`YO1Cashback API listening on port ${config.port} (${config.env})`);
  });

  const isPrimaryInstance = !process.env.NODE_APP_INSTANCE || process.env.NODE_APP_INSTANCE === '0';
  if (isPrimaryInstance) {
    startJobs();
  }

  const shutdown = (signal) => {
    logger.info(`${signal} received — shutting down gracefully`);
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start();
