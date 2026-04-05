const { suggestRoles } = require('../src/core/qna/role-suggester');

describe('role-suggester', () => {
  test('scanResult가 없으면 직접 입력만 반환한다', () => {
    const roles = suggestRoles(null);
    expect(roles).toEqual([{ value: '__custom__', label: '직접 입력' }]);
  });

  test('프레임워크/언어 기반 추천을 반환한다', () => {
    const roles = suggestRoles({
      frameworks: [{ name: 'Next.js' }, { name: 'Express' }],
      languages: [{ name: 'TypeScript' }],
    });

    expect(roles[0].value).toContain('Next.js');
    expect(roles.some((r) => r.value.includes('Node.js 백엔드'))).toBe(true);
    expect(roles[roles.length - 1]).toEqual({ value: '__custom__', label: '직접 입력' });
  });
});
