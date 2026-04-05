/**
 * 비밀 정보 감지용 정규식 패턴들.
 */
const SECRET_PATTERNS = [
  { name: 'AWS Access Key', pattern: /AKIA[0-9A-Z]{16}/g },
  { name: 'AWS Secret Key', pattern: /(?:aws_secret_access_key|secret_key)\s*[=:]\s*\S+/gi },
  {
    name: 'Generic API Key',
    pattern: /(?:api[_-]?key|apikey)\s*[=:]\s*['"]?[A-Za-z0-9_-]{20,}['"]?/gi,
  },
  {
    name: 'Generic Secret',
    pattern: /(?:secret|password|passwd|token)\s*[=:]\s*['"]?[A-Za-z0-9_-]{8,}['"]?/gi,
  },
  { name: 'Private Key Header', pattern: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/g },
  { name: 'Bearer Token', pattern: /Bearer\s+[A-Za-z0-9_\-.]{20,}/g },
  { name: 'Database URL', pattern: /(?:postgres|mysql|mongodb|redis):\/\/[^\s'"]+/gi },
];

/**
 * 텍스트에서 비밀 정보 패턴을 감지한다.
 * @param {string} content
 * @returns {{ found: boolean, matches: { name: string, count: number }[] }}
 */
function detectSecrets(content) {
  const matches = [];

  for (const { name, pattern } of SECRET_PATTERNS) {
    pattern.lastIndex = 0;
    const found = content.match(pattern);
    if (found && found.length > 0) {
      matches.push({ name, count: found.length });
    }
  }

  return { found: matches.length > 0, matches };
}

/**
 * 텍스트에서 감지된 비밀 정보를 [REDACTED]로 대체한다.
 * @param {string} content
 * @returns {{ filtered: string, redactedCount: number }}
 */
function filterSecrets(content) {
  let filtered = content;
  let redactedCount = 0;

  for (const { pattern } of SECRET_PATTERNS) {
    pattern.lastIndex = 0;
    filtered = filtered.replace(pattern, () => {
      redactedCount++;
      return '[REDACTED]';
    });
  }

  return { filtered, redactedCount };
}

export { detectSecrets, filterSecrets, SECRET_PATTERNS };
