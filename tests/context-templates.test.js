'use strict';

const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const { registerHelpers } = require('../src/core/prompt/helpers');

registerHelpers();

function renderTemplate(templateName, data) {
  const templatePath = path.join(__dirname, '..', 'data', 'templates', templateName);
  const source = fs.readFileSync(templatePath, 'utf-8');
  const template = Handlebars.compile(source);
  return template(data);
}

const fullData = {
  projectName: 'MyApp',
  languages: [
    { name: 'JavaScript', count: 40, percentage: 62.5 },
    { name: 'TypeScript', count: 24, percentage: 37.5 },
  ],
  frameworks: [
    { name: 'Express', version: '4.18.2' },
    { name: 'React', version: '18.2.0' },
  ],
  packageManager: 'npm',
  structure: {
    name: 'root',
    children: [
      { name: 'src', children: [{ name: 'index.js', children: [] }] },
      { name: 'tests', children: [] },
    ],
  },
  codingConventions: 'camelCase functions, kebab-case files',
  constraints: 'No external API calls in core layer',
  currentTask: 'Implement context file generator',
};

describe('claude.hbs 렌더링', () => {
  test('projectName이 포함된다', () => {
    const result = renderTemplate('claude.hbs', fullData);
    expect(result).toContain('MyApp');
  });

  test('언어 목록이 포함된다', () => {
    const result = renderTemplate('claude.hbs', fullData);
    expect(result).toContain('JavaScript');
    expect(result).toContain('TypeScript');
  });

  test('프레임워크 목록이 포함된다', () => {
    const result = renderTemplate('claude.hbs', fullData);
    expect(result).toContain('Express 4.x');
    expect(result).toContain('React 18.x');
  });

  test('디렉토리 구조 섹션이 포함된다', () => {
    const result = renderTemplate('claude.hbs', fullData);
    expect(result).toContain('Directory Structure');
    expect(result).toContain('root/');
  });

  test('codingConventions 섹션이 포함된다', () => {
    const result = renderTemplate('claude.hbs', fullData);
    expect(result).toContain('Coding Conventions');
    expect(result).toContain('camelCase functions');
  });

  test('constraints 섹션이 포함된다', () => {
    const result = renderTemplate('claude.hbs', fullData);
    expect(result).toContain('Constraints');
    expect(result).toContain('No external API calls');
  });

  test('currentTask 섹션이 포함된다', () => {
    const result = renderTemplate('claude.hbs', fullData);
    expect(result).toContain('Current Task');
    expect(result).toContain('context file generator');
  });

  test('날짜 주석이 포함된다', () => {
    const result = renderTemplate('claude.hbs', fullData);
    expect(result).toMatch(/<!-- Generated: \d{4}-\d{2}-\d{2} -->/);
  });
});

describe('gemini.hbs 렌더링', () => {
  test('projectName이 포함된다', () => {
    const result = renderTemplate('gemini.hbs', fullData);
    expect(result).toContain('MyApp');
  });

  test('언어 목록이 포함된다', () => {
    const result = renderTemplate('gemini.hbs', fullData);
    expect(result).toContain('JavaScript');
  });

  test('프레임워크 목록이 포함된다', () => {
    const result = renderTemplate('gemini.hbs', fullData);
    expect(result).toContain('Express 4.x');
  });

  test('디렉토리 구조 섹션이 포함된다', () => {
    const result = renderTemplate('gemini.hbs', fullData);
    expect(result).toContain('Directory Structure');
    expect(result).toContain('root/');
  });

  test('codingConventions와 constraints가 Additional Context에 포함된다', () => {
    const result = renderTemplate('gemini.hbs', fullData);
    expect(result).toContain('Additional Context');
    expect(result).toContain('camelCase functions');
    expect(result).toContain('No external API calls');
  });

  test('날짜 주석이 포함된다', () => {
    const result = renderTemplate('gemini.hbs', fullData);
    expect(result).toMatch(/<!-- Generated: \d{4}-\d{2}-\d{2} -->/);
  });
});

describe('최소 데이터 처리', () => {
  const minimalData = {
    projectName: 'TinyProject',
    languages: [{ name: 'Python', count: 10, percentage: 100 }],
    frameworks: [],
    packageManager: 'pip',
    structure: { name: 'root', children: [] },
  };

  test('claude.hbs — 선택 필드 없어도 에러 없이 렌더링된다', () => {
    expect(() => renderTemplate('claude.hbs', minimalData)).not.toThrow();
    const result = renderTemplate('claude.hbs', minimalData);
    expect(result).toContain('TinyProject');
    expect(result).toContain('Python');
  });

  test('claude.hbs — 선택 섹션이 출력되지 않는다', () => {
    const result = renderTemplate('claude.hbs', minimalData);
    expect(result).not.toContain('Coding Conventions');
    expect(result).not.toContain('Constraints');
    expect(result).not.toContain('Current Task');
  });

  test('gemini.hbs — 선택 필드 없어도 에러 없이 렌더링된다', () => {
    expect(() => renderTemplate('gemini.hbs', minimalData)).not.toThrow();
    const result = renderTemplate('gemini.hbs', minimalData);
    expect(result).toContain('TinyProject');
    expect(result).toContain('Python');
  });

  test('gemini.hbs — Additional Context 섹션이 출력되지 않는다', () => {
    const result = renderTemplate('gemini.hbs', minimalData);
    expect(result).not.toContain('Additional Context');
  });
});
