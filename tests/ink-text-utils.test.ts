const { removeLastGrapheme } = require('../src/cli/ui/ink/utils/text');

describe('removeLastGrapheme', () => {
  test('한글 조합 문자를 안전하게 한 글자 단위로 지운다', () => {
    expect(removeLastGrapheme('가나다')).toBe('가나');
  });

  test('이모지 grapheme cluster를 한 번에 지운다', () => {
    expect(removeLastGrapheme('A👨‍👩‍👧‍👦')).toBe('A');
  });
});
