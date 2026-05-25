import { describe, expect, test } from 'bun:test';
import { parseRefineResponse, RefineParseError } from '../../../src/core/refine/parse.js';

describe('parseRefineResponse', () => {
  test('정상 응답 파싱', () => {
    const r = parseRefineResponse(JSON.stringify({ refined: '다듬은 프롬프트', suggestions: ['파일 경로를 추가하세요'], rationale: '구조화함' }));
    expect(r.refined).toBe('다듬은 프롬프트');
    expect(r.suggestions).toEqual(['파일 경로를 추가하세요']);
    expect(r.rationale).toBe('구조화함');
  });

  test('suggestions 빈 배열 허용', () => {
    const r = parseRefineResponse(JSON.stringify({ refined: 'x', suggestions: [] }));
    expect(r.suggestions).toEqual([]);
    expect(r.rationale).toBeUndefined();
  });

  test('코드펜스로 감싼 JSON도 파싱', () => {
    const raw = `\`\`\`json\n${JSON.stringify({ refined: 'x', suggestions: [] })}\n\`\`\``;
    expect(parseRefineResponse(raw).refined).toBe('x');
  });

  test('suggestions 항목은 문자열로 강제', () => {
    const r = parseRefineResponse(JSON.stringify({ refined: 'x', suggestions: [1, true] }));
    expect(r.suggestions).toEqual(['1', 'true']);
  });

  test('잘못된 JSON → RefineParseError', () => {
    expect(() => parseRefineResponse('not json')).toThrow(RefineParseError);
  });

  test('배열 JSON → RefineParseError', () => {
    expect(() => parseRefineResponse('[1,2,3]')).toThrow(RefineParseError);
  });

  test('refined 누락 → 에러', () => {
    expect(() => parseRefineResponse(JSON.stringify({ suggestions: [] }))).toThrow(RefineParseError);
  });

  test('refined 빈 문자열 → 에러', () => {
    expect(() => parseRefineResponse(JSON.stringify({ refined: '   ', suggestions: [] }))).toThrow(RefineParseError);
  });

  test('suggestions 비배열 → 에러', () => {
    expect(() => parseRefineResponse(JSON.stringify({ refined: 'x', suggestions: 'nope' }))).toThrow(RefineParseError);
  });
});
