import type { TreeConfig } from '@core/types/card.js';
import type { I18nText } from '@shared/i18n/types.js';

/**
 * 서버가 /api/trees·/api/trees/:treeId 에서 반환하는 tree 데이터 형태.
 * - label/description: 서버가 현재 lang으로 해소한 string (display 전용).
 * - roleSuffix: 서버는 raw I18nText로 보낸다. createCardSession이 내부에서
 *   pickText(roleSuffix, lang)로 해소하므로 I18nText를 그대로 유지한다.
 *
 * core의 TreeConfig(label/description도 I18nText)와 달리 web 레이어에서만 사용한다.
 */
export type ResolvedTree = Omit<TreeConfig, 'label' | 'description'> & {
  label: string;
  description: string;
  roleSuffix?: I18nText;
};
