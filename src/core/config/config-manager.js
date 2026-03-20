'use strict';

const fs = require('fs');
const path = require('path');
const { DATA_DIR } = require('../../shared/constants');

const GLOBAL_CONFIG_PATH = path.join(DATA_DIR, 'config.json');

/** 설정 기본값 */
const DEFAULTS = {
  'scan.maxDepth': null,
  'scan.extraIgnore': [],
  'context.defaultFormats': 'claude,gemini,cursorrules',
  'context.maxLines.claude': 200,
  'context.maxLines.gemini': 300,
  'context.maxLines.cursorrules': 150,
};

class ConfigManager {
  /**
   * @param {string} [projectPath] - 프로젝트 루트 (프로젝트 설정 로딩용)
   */
  constructor(projectPath) {
    this.projectPath = projectPath;
    this.projectConfigPath = projectPath
      ? path.join(projectPath, '.promptcraft', 'config.json')
      : null;
  }

  /**
   * 설정 값 조회. 우선순위: 프로젝트 > 글로벌 > 기본값
   * @param {string} key
   * @returns {*}
   */
  get(key) {
    if (this.projectConfigPath) {
      const projectVal = this._readFromFile(this.projectConfigPath, key);
      if (projectVal !== undefined) return projectVal;
    }

    const globalVal = this._readFromFile(GLOBAL_CONFIG_PATH, key);
    if (globalVal !== undefined) return globalVal;

    return DEFAULTS[key] !== undefined ? DEFAULTS[key] : null;
  }

  /**
   * 설정 값 저장.
   * @param {string} key
   * @param {*} value
   * @param {'global'|'project'} [scope='global']
   */
  set(key, value, scope = 'global') {
    const filePath = scope === 'project' ? this.projectConfigPath : GLOBAL_CONFIG_PATH;
    if (!filePath) throw new Error('프로젝트 경로가 설정되지 않았습니다');

    const config = this._readFile(filePath);
    config[key] = value;
    this._writeFile(filePath, config);
  }

  /**
   * 설정 값 삭제.
   */
  delete(key, scope = 'global') {
    const filePath = scope === 'project' ? this.projectConfigPath : GLOBAL_CONFIG_PATH;
    if (!filePath) return;

    const config = this._readFile(filePath);
    delete config[key];
    this._writeFile(filePath, config);
  }

  /**
   * 현재 유효한 모든 설정을 반환한다.
   */
  list() {
    const result = {};
    for (const key of Object.keys(DEFAULTS)) {
      result[key] = { value: this.get(key), source: this._getSource(key) };
    }
    return result;
  }

  _readFromFile(filePath, key) {
    const config = this._readFile(filePath);
    return config[key];
  }

  _readFile(filePath) {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch {
      return {};
    }
  }

  _writeFile(filePath, config) {
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf8');
  }

  _getSource(key) {
    if (this.projectConfigPath) {
      const pv = this._readFromFile(this.projectConfigPath, key);
      if (pv !== undefined) return 'project';
    }
    const gv = this._readFromFile(GLOBAL_CONFIG_PATH, key);
    if (gv !== undefined) return 'global';
    return 'default';
  }
}

module.exports = { ConfigManager, DEFAULTS };
