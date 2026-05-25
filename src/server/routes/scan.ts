import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Router } from 'express';
import { resolveRoleSuggestions } from '../../core/builder/role-resolver.js';
import { scan } from '../../core/scanner/index.js';
import { pickText } from '../../shared/i18n/pickLang.js';
import { loadDomainOverlay, loadRoleMappings, loadTreesMeta } from '../domain-loader.js';
import { resolveLang } from '../locale.js';
import { writeScanDebugLog } from '../scan-debug.js';

const router = Router();
const LAST_SCAN_PATH = path.join(os.homedir(), '.promptcraft', 'last-scan.json');

router.post('/', async (req, res, next) => {
  try {
    const { path: scanPath } = req.body as { path: string };
    if (!scanPath || typeof scanPath !== 'string') {
      res.status(400).json({ error: 'path 필드가 필요합니다.' });
      return;
    }

    const startTime = new Date().toISOString();
    const start = Date.now();
    const result = await scan(scanPath);
    const endTime = new Date().toISOString();
    const elapsedMs = Date.now() - start;

    // 도메인 오버레이 로딩 (domainContext가 있을 때)
    const domainOverlay = result.domainContext ? loadDomainOverlay(result.domainContext.primary) : null;

    // 역할 제안 목록
    // - roleSuggestions: 트리 미선택 시 메인 화면용 fallback (default, base 우선)
    // - roleSuggestionsByTree: 5개 트리 각각의 5개 역할. 워크스페이스 카드 옵션과 1:1 일치
    const roleMappings = loadRoleMappings();
    const lang = resolveLang();
    const roleSuggestions = roleMappings
      ? resolveRoleSuggestions(result, 'default', roleMappings, undefined, lang)
          .map((o) => o.value)
          .slice(0, 5)
      : [];

    const roleSuggestionsByTree: Record<string, string[]> = {};
    if (roleMappings) {
      for (const treeMeta of loadTreesMeta()) {
        const roleSuffix = treeMeta.roleSuffix ? pickText(treeMeta.roleSuffix, lang) : undefined;
        roleSuggestionsByTree[treeMeta.id] = resolveRoleSuggestions(result, treeMeta.id, roleMappings, roleSuffix, lang)
          .map((o) => o.value)
          .slice(0, 5);
      }
    }

    const responseData = { ...result, elapsedMs, domainOverlay, roleSuggestions, roleSuggestionsByTree };

    res.json(responseData);

    // 디버그 로그 저장 (DEBUG_SCAN=true 일 때만)
    writeScanDebugLog({ startTime, endTime, elapsedMs, scanPath, result: responseData });

    // 마지막 스캔 결과 저장 (응답 후 fire-and-forget)
    void fs
      .mkdir(path.dirname(LAST_SCAN_PATH), { recursive: true })
      .then(() => fs.writeFile(LAST_SCAN_PATH, JSON.stringify(responseData, null, 2)))
      .catch(() => {});
  } catch (err) {
    next(err);
  }
});

router.get('/last', async (_req, res, _next) => {
  const file = Bun.file(LAST_SCAN_PATH);
  if (!(await file.exists())) {
    res.status(404).json({ error: '이전 스캔 결과가 없습니다.' });
    return;
  }
  try {
    res.json(await file.json());
  } catch {
    res.status(404).json({ error: '이전 스캔 결과가 없습니다.' });
  }
});

export default router;
