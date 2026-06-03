export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore', 'perf', 'ci', 'build', 'revert'],
    ],
    'header-max-length': [2, 'always', 72],
    'subject-full-stop': [2, 'never', '.'],
    'subject-case': [0], // 한국어 대응
    'body-max-line-length': [0], // 본문 줄 길이 제한 해제
    'footer-max-line-length': [0], // 푸터 줄 길이 제한 해제
  },
};