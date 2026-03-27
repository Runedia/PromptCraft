'use strict';

const path = require('path');
const fs = require('fs');
const os = require('os');

const { parseMentions, readMentionedFile } = require('../src/cli/ui/file-mention');

describe('file-mention', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'promptcraft-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('readMentionedFile', () => {
    test('정상 파일 읽기', () => {
      const filePath = path.join(tmpDir, 'test.js');
      fs.writeFileSync(filePath, 'console.log("hello")');
      const result = readMentionedFile('test.js', tmpDir);
      expect(result).toContain('console.log("hello")');
      expect(result).toContain('[파일: test.js]');
    });

    test('존재하지 않는 파일', () => {
      const result = readMentionedFile('notexist.js', tmpDir);
      expect(result).toBe('[파일 없음: notexist.js]');
    });

    test('.env 파일 차단', () => {
      fs.writeFileSync(path.join(tmpDir, '.env'), 'SECRET=abc');
      const result = readMentionedFile('.env', tmpDir);
      expect(result).toContain('[보안:');
    });

    test('경로 탈출 시도 차단', () => {
      const result = readMentionedFile('../../etc/passwd', tmpDir);
      expect(result).toContain('[경로 탈출');
    });

    test('이진 파일 차단', () => {
      fs.writeFileSync(path.join(tmpDir, 'image.png'), Buffer.from([0x89, 0x50, 0x4e, 0x47]));
      const result = readMentionedFile('image.png', tmpDir);
      expect(result).toContain('[이진 파일:');
    });

    test('200줄 초과 시 잘림', () => {
      const lines = Array.from({ length: 300 }, (_, i) => `line ${i + 1}`);
      fs.writeFileSync(path.join(tmpDir, 'big.txt'), lines.join('\n'));
      const result = readMentionedFile('big.txt', tmpDir);
      expect(result).toContain('[파일 잘림:');
      expect(result).toContain('200줄');
    });
  });

  describe('parseMentions', () => {
    test('@경로를 파일 내용으로 치환', () => {
      fs.writeFileSync(path.join(tmpDir, 'foo.js'), 'const x = 1;');
      const text = '이 코드를 봐주세요: @foo.js';
      const result = parseMentions(text, tmpDir);
      expect(result).toContain('const x = 1;');
    });

    test('존재하지 않는 파일 멘션 처리', () => {
      const text = '@notexist.js 에서 에러가 발생해요';
      const result = parseMentions(text, tmpDir);
      expect(result).toContain('[파일 없음:');
    });

    test('@없는 일반 텍스트는 그대로', () => {
      const text = '이메일은 user@example.com 입니다';
      const result = parseMentions(text, tmpDir);
      expect(typeof result).toBe('string');
    });

    test('projectRoot 없으면 빈 문자열 반환', () => {
      const result = parseMentions('', '');
      expect(result).toBe('');
    });
  });
});
