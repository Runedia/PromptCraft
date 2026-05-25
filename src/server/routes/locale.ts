import { Router } from 'express';
import { resolveLang } from '../locale.js';

const router = Router();

/** 현재 해소된 언어를 반환한다. config ui.language(유효하면) 우선, 없으면 OS 감지. */
router.get('/', (_req, res, next) => {
  try {
    // DB는 서버 startup의 initialize에 의존(peer route와 동일). resolveLang의 try/catch가 DB 미준비를 흡수.
    res.json({ lang: resolveLang() });
  } catch (err) {
    next(err);
  }
});

export default router;
