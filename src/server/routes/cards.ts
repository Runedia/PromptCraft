import { Router } from 'express';
import { cardLoader } from '../card-loader.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const defs = await cardLoader.loadCardDefinitions();
    res.json(defs);
  } catch (err) {
    next(err);
  }
});

export default router;
