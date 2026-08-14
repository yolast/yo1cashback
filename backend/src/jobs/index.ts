import { registerJob, startScheduler } from './scheduler.js';
import { cashbackAutoConfirmJob } from './cashbackAutoConfirm.job.js';
import logger from '../utils/logger.js';

export function startJobs() {
  registerJob(cashbackAutoConfirmJob.name, cashbackAutoConfirmJob.run, cashbackAutoConfirmJob.intervalMs);
  startScheduler();
  logger.info('Background jobs started');
}

export default { startJobs };
