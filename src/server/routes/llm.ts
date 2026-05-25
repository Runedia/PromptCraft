import { Router } from 'express';
import { initialize } from '../../core/db/index.js';
import { getRefineConfig } from '../refine/config.js';
import * as refineService from '../refine/refineService.js';

const router = Router();

router.get('/status', async (_req, res, next) => {
  try {
    await initialize();
    const status = await refineService.fetchStatus(getRefineConfig());
    res.json(status);
  } catch (err) {
    next(err);
  }
});

export default router;
