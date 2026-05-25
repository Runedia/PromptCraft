import { describe, expect, it } from 'bun:test';
import { t } from '../../src/shared/i18n/t.js';

describe('CLI i18n keys', () => {
  describe('cli.unknownCommand', () => {
    it('ko: 알 수 없는 명령어 보간', () => {
      expect(t('cli.unknownCommand', 'ko', { cmd: 'foo' })).toBe('알 수 없는 명령어: foo');
    });

    it('en: unknown command interpolation', () => {
      expect(t('cli.unknownCommand', 'en', { cmd: 'foo' })).toBe('Unknown command: foo');
    });
  });

  describe('cli.portInUse', () => {
    it('ko: 포트 사용 중 보간', () => {
      expect(t('cli.portInUse', 'ko', { start: 3000, port: 3001 })).toBe('포트 3000가 사용 중입니다. 3001번으로 실행합니다.');
    });

    it('en: port in use interpolation', () => {
      expect(t('cli.portInUse', 'en', { start: 3000, port: 3001 })).toBe('Port 3000 is in use. Starting on port 3001 instead.');
    });
  });

  describe('cli.portNotFound', () => {
    it('ko: 포트 범위 오류 보간', () => {
      expect(t('cli.portNotFound', 'ko', { start: 3000, end: 3009 })).toBe('3000~3009 범위에서 사용 가능한 포트를 찾을 수 없습니다.');
    });

    it('en: port not found interpolation', () => {
      expect(t('cli.portNotFound', 'en', { start: 3000, end: 3009 })).toBe('No available port found in range 3000–3009.');
    });
  });

  describe('cli.description', () => {
    it('ko: 설명 반환', () => {
      expect(t('cli.description', 'ko')).toBe('로컬 설치형 프롬프트 설계 도구');
    });

    it('en: description returned', () => {
      expect(t('cli.description', 'en')).toBe('Local prompt design tool for coding');
    });
  });

  describe('cli.runUrl', () => {
    it('ko: URL 보간', () => {
      expect(t('cli.runUrl', 'ko', { url: 'http://localhost:3000' })).toBe('PromptCraft UI: http://localhost:3000');
    });

    it('en: URL interpolation', () => {
      expect(t('cli.runUrl', 'en', { url: 'http://localhost:3000' })).toBe('PromptCraft UI: http://localhost:3000');
    });
  });
});
