import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Router } from 'express';
import { pickText } from '../../shared/i18n/pickLang.js';
import type { I18nText } from '../../shared/i18n/types.js';
import { cardLoader } from '../card-loader.js';
import { loadRoleMappings } from '../domain-loader.js';
import { resolveLang } from '../locale.js';

const router = Router();
const DATA_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../../data');
const TREES_DIR = path.join(DATA_DIR, 'trees');

// 트리 정의 JSON은 정적 빌드 데이터이므로 디렉토리 목록과 파일별 파싱 결과를 프로세스 수명 동안 캐시한다.
// 트리 전환·앱 로드마다 readdir + Bun.file().json()을 반복하던 비용을 제거한다.
let _treeFilesCache: string[] | null = null;
const _treeFileCache = new Map<string, Promise<Record<string, unknown>>>();

async function listTreeFiles(): Promise<string[]> {
  if (!_treeFilesCache) {
    const files = await readdir(TREES_DIR);
    _treeFilesCache = files.filter((f) => f.endsWith('.json')).sort((a, b) => a.localeCompare(b));
  }
  return _treeFilesCache;
}

function loadTreeFile(filePath: string): Promise<Record<string, unknown>> {
  let cached = _treeFileCache.get(filePath);
  if (!cached) {
    cached = (Bun.file(filePath).json() as Promise<Record<string, unknown>>).catch((err) => {
      _treeFileCache.delete(filePath);
      throw err;
    });
    _treeFileCache.set(filePath, cached);
  }
  return cached;
}

router.get('/', async (_req, res, next) => {
  try {
    const files = await listTreeFiles();
    // lang은 요청 단위로 안정적 — Promise.all 콜백마다 재호출(DB read + Intl)하지 않도록 hoist.
    const lang = resolveLang();
    const trees = await Promise.all(
      files.map(async (f) => {
        const tree = (await loadTreeFile(path.join(TREES_DIR, f))) as { id: string; label: I18nText; description: I18nText };
        // 목록에서는 카드 배열 제외, 메타만 반환
        return {
          id: tree.id,
          label: pickText(tree.label, lang),
          description: pickText(tree.description, lang),
        };
      })
    );
    res.json(trees);
  } catch (err) {
    next(err);
  }
});

router.get('/:treeId', async (req, res, next) => {
  try {
    const { treeId } = req.params;
    const treeFile = Bun.file(path.join(TREES_DIR, `${treeId}.json`));

    if (!(await treeFile.exists())) {
      res.status(404).json({ error: `트리를 찾을 수 없습니다: ${treeId}` });
      return;
    }

    const [rawTree, cardDefs] = await Promise.all([
      loadTreeFile(path.join(TREES_DIR, `${treeId}.json`)) as Promise<Record<string, unknown> & { label: I18nText; description: I18nText }>,
      cardLoader.loadCardDefinitions(),
    ]);
    const roleMappings = loadRoleMappings();
    const lang = resolveLang();

    // label/description는 display용이므로 해소된 string으로 변환. roleSuffix는 createCardSession 내부에서 lang과 함께 해소되므로 I18nText 유지.
    const tree = {
      ...rawTree,
      label: pickText(rawTree.label, lang),
      description: pickText(rawTree.description, lang),
    };

    res.json({ tree, cardDefs, roleMappings });
  } catch (err) {
    next(err);
  }
});

export default router;
