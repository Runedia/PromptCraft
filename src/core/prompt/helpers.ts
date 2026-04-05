import Handlebars from 'handlebars';

function registerHelpers() {
  Handlebars.registerHelper('structureToText', (structure, depth) => {
    if (!structure) return '';
    const maxDepth = typeof depth === 'number' ? depth : 2;

    function walk(node, currentDepth) {
      if (!node) return '';
      const indent = '  '.repeat(currentDepth);
      let result = `${indent + node.name}/\n`;
      if (currentDepth < maxDepth - 1 && Array.isArray(node.children)) {
        for (const child of node.children) {
          result += walk(child, currentDepth + 1);
        }
      }
      return result;
    }

    return walk(structure, 0).trimEnd();
  });

  Handlebars.registerHelper('languageList', (languages) => {
    if (!Array.isArray(languages) || languages.length === 0) return '';
    return languages.map((l) => `${l.name}(${Math.round(l.percentage)}%)`).join(', ');
  });

  Handlebars.registerHelper('frameworkList', (frameworks) => {
    if (!Array.isArray(frameworks) || frameworks.length === 0) return '';
    return frameworks
      .map((f) => {
        if (f.version) {
          const major = f.version.split('.')[0];
          return `${f.name} ${major}.x`;
        }
        return f.name;
      })
      .join(', ');
  });

  Handlebars.registerHelper('codeBlock', (code, lang) => {
    if (!code) return '';
    const language = typeof lang === 'string' ? lang : '';
    return `\`\`\`${language}\n${code}\n\`\`\``;
  });

  Handlebars.registerHelper('now', () => new Date().toISOString().slice(0, 10));

  Handlebars.registerHelper('keyPaths', (structure) => {
    if (!structure?.children || !Array.isArray(structure.children)) {
      return '';
    }
    return structure.children
      .filter(
        (child) =>
          child &&
          typeof child === 'object' &&
          typeof child.name === 'string' &&
          child.name.trim() !== ''
      )
      .slice(0, 8)
      .map((child) => `/${child.name}`)
      .join(', ');
  });

  Handlebars.registerHelper('eq', (a, b) => a === b);
}

export { registerHelpers };
