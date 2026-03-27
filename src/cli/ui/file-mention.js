'use strict';

const path = require('path');
const fs = require('fs');
const { glob } = require('glob');

// 이진 파일 확장자 목록
const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.webp', '.svg',
  '.exe', '.dll', '.so', '.dylib', '.bin',
  '.zip', '.tar', '.gz', '.7z', '.rar',
  '.pdf', '.docx', '.xlsx', '.pptx',
  '.mp3', '.mp4', '.avi', '.mov',
  '.ttf', '.woff', '.woff2', '.eot'
]);

const MAX_FILE_SIZE = 100 * 1024; // 100KB
const MAX_LINES = 200;

/**
 * 단일 멘션 파일 읽기
 * @param {string} relPath - 상대 경로
 * @param {string} projectRoot - 프로젝트 루트 절대 경로
 * @returns {string} 파일 내용 또는 에러 메시지
 */
function readMentionedFile(relPath, projectRoot) {
  // 경로 정규화
  const absPath = path.resolve(projectRoot, relPath);

  // 경로 탈출 방지 (projectRoot 밖으로 나가는 경로 차단)
  const normalizedRoot = path.resolve(projectRoot);
  if (!absPath.startsWith(normalizedRoot + path.sep) && absPath !== normalizedRoot) {
    return `[경로 탈출 시도: ${relPath}]`;
  }

  // .env 파일 차단
  const basename = path.basename(absPath);
  if (basename === '.env' || basename.startsWith('.env.')) {
    return `[보안: .env 파일은 멘션 불가]`;
  }

  // 이진 파일 차단
  const ext = path.extname(absPath).toLowerCase();
  if (BINARY_EXTENSIONS.has(ext)) {
    return `[이진 파일: ${relPath} — 내용 생략]`;
  }

  // 파일 존재 확인
  try {
    fs.accessSync(absPath, fs.constants.R_OK);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return `[파일 없음: ${relPath}]`;
    }
    return `[접근 불가: ${relPath}]`;
  }

  // 파일 크기 확인 및 읽기
  try {
    const stat = fs.statSync(absPath);
    const content = fs.readFileSync(absPath, 'utf8');
    const lines = content.split('\n');

    if (stat.size > MAX_FILE_SIZE || lines.length > MAX_LINES) {
      const truncated = lines.slice(0, MAX_LINES).join('\n');
      return `[파일: ${relPath}]\n${truncated}\n[파일 잘림: ${lines.length}줄 중 ${MAX_LINES}줄]`;
    }

    return `[파일: ${relPath}]\n${content}`;
  } catch (err) {
    return `[읽기 오류: ${relPath}]`;
  }
}

/**
 * 텍스트 내 @경로 멘션을 파일 내용으로 치환
 * @param {string} text - 입력 텍스트
 * @param {string} projectRoot - 프로젝트 루트 절대 경로
 * @returns {string} 치환된 텍스트
 */
function parseMentions(text, projectRoot) {
  if (!text || !projectRoot) return text || '';

  // @경로 패턴: @ 뒤에 경로 문자 (알파벳, 숫자, ., /, \, -, _)
  return text.replace(/@([\w./\\\-]+)/g, (match, relPath) => {
    // Windows 경로 구분자 정규화
    const normalizedPath = relPath.replace(/\\/g, '/');
    return readMentionedFile(normalizedPath, projectRoot);
  });
}

/**
 * 파일 경로 자동완성
 * @param {string} partial - 현재 입력 중인 경로 (@ 이후)
 * @param {string} projectRoot - 프로젝트 루트 절대 경로
 * @returns {Promise<string[]>} 매칭되는 경로 목록
 */
async function autocompleteFilePath(partial, projectRoot) {
  try {
    const pattern = partial ? `${partial}*` : '**';
    const matches = await glob(pattern, {
      cwd: projectRoot,
      nodir: false,
      ignore: ['node_modules/**', '.git/**', 'dist/**', '.next/**'],
      dot: false,
      maxDepth: 4
    });
    return matches.slice(0, 20); // 최대 20개
  } catch {
    return [];
  }
}

/**
 * 파일 경로 동기 자동완성 (readline completer 전용)
 * readline의 completer는 동기 반환만 지원하므로 fs.readdirSync 사용
 * @param {string} partial - @ 이후 입력된 부분 경로
 * @param {string} projectRoot - 프로젝트 루트 절대 경로
 * @returns {string[]} 매칭되는 상대 경로 목록
 */
function autocompleteFilePathSync(partial, projectRoot) {
  try {
    const IGNORE_DIRS = new Set(['node_modules', '.git', 'dist', '.next', 'build']);
    const normalizedRoot = path.resolve(projectRoot);

    // Windows 경로 구분자 정규화
    const normalizedPartial = partial.replace(/\\/g, '/');

    // "src/cli/com" → dir="src/cli", prefix="com"
    const lastSlash = normalizedPartial.lastIndexOf('/');
    const dir = lastSlash === -1 ? '' : normalizedPartial.slice(0, lastSlash);
    const prefix = lastSlash === -1 ? normalizedPartial : normalizedPartial.slice(lastSlash + 1);

    const absDir = path.resolve(normalizedRoot, dir);

    // 경로 탈출 방지
    if (!absDir.startsWith(normalizedRoot)) return [];

    let entries;
    try {
      entries = fs.readdirSync(absDir, { withFileTypes: true });
    } catch {
      return [];
    }

    const matches = [];
    for (const entry of entries) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      if (prefix && !entry.name.startsWith(prefix)) continue;

      const relPath = dir ? `${dir}/${entry.name}` : entry.name;
      // 디렉토리면 '/' 접미사 추가하여 연속 탐색 유도
      matches.push(entry.isDirectory() ? `${relPath}/` : relPath);
      if (matches.length >= 20) break;
    }

    return matches;
  } catch {
    return [];
  }
}

module.exports = { parseMentions, readMentionedFile, autocompleteFilePath, autocompleteFilePathSync };
