import { describe, expect, test } from 'bun:test';
import { parseRefineResponse, RefineParseError } from '../../../src/core/refine/parse.js';

const base = { level: 'L3', quality: 70, dimensions: [{ dimension: 'DECOMP', level: 'L3', note: 'ok' }] };

describe('parseRefineResponse', () => {
  test('polished 응답 파싱', () => {
    const r = parseRefineResponse(JSON.stringify({ ...base, verdict: 'polished', refined: '다듬은 프롬프트' }));
    expect(r.verdict).toBe('polished');
    expect(r.refined).toBe('다듬은 프롬프트');
  });

  test('코드펜스로 감싼 JSON도 파싱', () => {
    const raw = '```json\n' + JSON.stringify({ ...base, verdict: 'polished', refined: 'x' }) + '\n```';
    expect(parseRefineResponse(raw).refined).toBe('x');
  });

  test('needs-improvement → coaching 배열', () => {
    const r = parseRefineResponse(JSON.stringify({ ...base, verdict: 'needs-improvement', coaching: ['파일 경로를 추가하세요'] }));
    expect(r.verdict).toBe('needs-improvement');
    expect(r.coaching).toEqual(['파일 경로를 추가하세요']);
  });

  test('잘못된 JSON → RefineParseError', () => {
    expect(() => parseRefineResponse('not json')).toThrow(RefineParseError);
  });

  test('polished인데 refined 없음 → 에러', () => {
    expect(() => parseRefineResponse(JSON.stringify({ ...base, verdict: 'polished' }))).toThrow(RefineParseError);
  });

  test('잘못된 level → 에러', () => {
    expect(() => parseRefineResponse(JSON.stringify({ ...base, level: 'L9', verdict: 'polished', refined: 'x' }))).toThrow(RefineParseError);
  });

  test('배열 JSON → RefineParseError', () => {
    expect(() => parseRefineResponse('[1,2,3]')).toThrow(RefineParseError);
  });

  test('잘못된 verdict → 에러', () => {
    expect(() => parseRefineResponse(JSON.stringify({ ...base, verdict: 'maybe', refined: 'x' }))).toThrow(RefineParseError);
  });

  test('quality 범위 초과 → 에러', () => {
    expect(() => parseRefineResponse(JSON.stringify({ ...base, quality: 150, verdict: 'polished', refined: 'x' }))).toThrow(RefineParseError);
  });

  test('needs-improvement인데 coaching 빈 배열 → 에러', () => {
    expect(() => parseRefineResponse(JSON.stringify({ ...base, verdict: 'needs-improvement', coaching: [] }))).toThrow(RefineParseError);
  });
});
