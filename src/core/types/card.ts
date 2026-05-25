import type { I18nText, I18nTextArray } from '../../shared/i18n/types.js';
import type { ScanResult } from '../types.js';

export type InputType = 'text' | 'multiline' | 'select' | 'select-or-text' | 'multiline-mention';

// runtime select option (resolved — plain strings)
export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

// disk-definition select option (both languages)
// value is i18n because select-or-text options inject their value into the output prompt
export interface SelectOptionDef {
  value: I18nText;
  label: I18nText;
  description?: I18nText;
}

// SectionCard holds resolved (runtime) values — all text fields are plain strings
export interface SectionCard {
  id: string;
  label: string;
  required: boolean;
  active: boolean;
  order: number;
  inputType: InputType;
  value: string;
  template: string;
  hint?: string;
  examples?: string[];
  options?: SelectOption[];
  scanSuggested?: boolean;
}

export interface CardSession {
  treeId: string;
  cards: SectionCard[];
  scanResult: ScanResult | null;
  createdAt: Date;
}

// TreeConfig is the disk-level tree definition — UI/output text fields are i18n objects
export interface TreeConfig {
  id: string;
  label: I18nText;
  description: I18nText;
  defaultActiveCards: string[];
  cardPool: string[];
  cardOverrides?: Record<string, Partial<CardDefinition>>;
  roleSuffix?: I18nText;
}

// CardDefinition is the disk-level definition — text fields are i18n objects
export interface CardDefinition {
  label: I18nText;
  required: boolean;
  inputType: InputType;
  template: I18nText;
  hint?: I18nText;
  examples?: I18nTextArray;
  options?: SelectOptionDef[];
  scanSuggested?: boolean;
  defaultValue?: I18nText;
}
