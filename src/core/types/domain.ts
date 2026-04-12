export type ProgrammingDomain =
  | 'web-frontend'
  | 'web-backend'
  | 'systems'
  | 'data-ml'
  | 'mobile'
  | 'devops'
  | 'desktop'
  | 'cli'
  | 'game'
  | 'embedded'
  | 'general';

export interface DomainContext {
  primary: ProgrammingDomain;
  secondary: ProgrammingDomain | null;
  confidence: 'high' | 'medium' | 'low';
}
