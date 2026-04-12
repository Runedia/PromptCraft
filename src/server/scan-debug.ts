import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

export interface ScanDebugEntry {
  startTime: string;
  endTime: string;
  elapsedMs: number;
  scanPath: string;
  result: unknown;
}

const DEBUG_DIR = path.join(os.homedir(), '.promptcraft', 'debug');

export function writeScanDebugLog(entry: ScanDebugEntry): void {
  if (process.env.DEBUG_SCAN !== 'true') return;

  const safeTimestamp = entry.startTime.replace(/:/g, '-');
  const filePath = path.join(DEBUG_DIR, `scan-${safeTimestamp}.json`);

  void fs
    .mkdir(DEBUG_DIR, { recursive: true })
    .then(() => fs.writeFile(filePath, JSON.stringify(entry, null, 2)))
    .catch((err) => console.error('[scan-debug] 로그 저장 실패:', err));
}
