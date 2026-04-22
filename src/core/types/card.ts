import type { ScanResult } from '../types.js';

export type InputType = 'text' | 'multiline' | 'select' | 'select-or-text' | 'multiline-mention';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

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

export interface TreeConfig {
  id: string;
  label: string;
  description: string;
  icon: string;
  defaultActiveCards: string[];
  cardPool: string[];
  cardOverrides?: Record<string, Partial<CardDefinition>>;
  roleSuffix?: string;
}

export interface CardDefinition {
  label: string;
  required: boolean;
  inputType: InputType;
  template: string;
  hint?: string;
  examples?: string[];
  options?: SelectOption[];
  scanSuggested?: boolean;
  defaultValue?: string;
}
