/**
 * Context 파일 포맷터의 기본 인터페이스.
 * 각 포맷(claude, gemini, cursorrules)은 이 클래스를 상속한다.
 */
class BaseFormatter {
  formatName: string;
  fileName: string;
  templateFile: string;
  maxLines: number;

  /**
   * @param {string} formatName - 포맷 식별자 (예: 'claude')
   * @param {string} fileName - 출력 파일명 (예: 'CLAUDE.md')
   * @param {string} templateFile - Handlebars 템플릿 파일명 (예: 'claude.hbs')
   * @param {{ maxLines?: number }} [limits] - 권장 제한
   */
  constructor(
    formatName: string,
    fileName: string,
    templateFile: string,
    limits: { maxLines?: number } = {}
  ) {
    this.formatName = formatName;
    this.fileName = fileName;
    this.templateFile = templateFile;
    this.maxLines = limits.maxLines || Infinity;
  }

  /**
   * CanonicalContext → Handlebars 템플릿 컨텍스트 변환.
   * 서브클래스에서 오버라이드하여 포맷별 특화 가능.
   * @param {object} canonicalCtx - buildCanonicalContext() 반환값
   * @returns {object} Handlebars 템플릿에 전달할 컨텍스트
   */
  toTemplateContext(canonicalCtx) {
    return {
      projectName: canonicalCtx.projectName,
      languages: canonicalCtx.techStack.languages,
      frameworks: canonicalCtx.techStack.frameworks,
      packageManager: canonicalCtx.techStack.packageManager,
      structure: canonicalCtx.structure,
      codingConventions: canonicalCtx.conventions.coding,
      constraints: canonicalCtx.constraints,
      currentTask: canonicalCtx.currentTask,
    };
  }
}

export { BaseFormatter };
