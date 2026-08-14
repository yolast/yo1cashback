import logger from '../utils/logger.js';

const jobs = [];

export function registerJob(name, fn, intervalMs) {
  jobs.push({ name, fn, intervalMs });
}

export function startScheduler() {
  for (const job of jobs) {
    const run = async () => {
      try {
        await job.fn();
      } catch (err) {
        logger.error(`Job "${job.name}" failed: ${err.message}`);
      }
    };
    setInterval(run, job.intervalMs).unref();
    logger.info(`Job "${job.name}" scheduled every ${job.intervalMs}ms`);
  }
}

export default { registerJob, startScheduler };
