import { CashbackQueue } from '../models/index.js';
import { getSetting } from '../services/settings.service.js';
import { updateQueueStatus } from '../services/queue.service.js';
import { CASHBACK_STATUS } from '../utils/constants.js';
import logger from '../utils/logger.js';

export const cashbackAutoConfirmJob = {
  name: 'cashback-auto-confirm',
  intervalMs: 60 * 60 * 1000,
  run: async () => {
    const enabled: any = await getSetting('autoConfirmCashback', false);
    if (enabled !== true && enabled !== 'true') return;

    const days = Number(await getSetting('cashbackConfirmDays', 30));
    if (!days || days <= 0) return;

    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const items = await CashbackQueue.find({
      status: CASHBACK_STATUS.PENDING,
      trackedAt: { $lte: cutoff },
    }).limit(200);

    for (const item of items) {
      await updateQueueStatus(item._id, CASHBACK_STATUS.COMPLETED);
    }

    if (items.length) logger.info(`Auto-confirmed ${items.length} queue item(s)`);
  },
};

export default cashbackAutoConfirmJob;
