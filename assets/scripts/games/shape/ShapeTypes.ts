import { Color } from 'cc';
import type { ToyShape } from '../common/MatchTypes';

export type ShapeCompletionEffect =
  | 'dance'
  | 'launch'
  | 'sail'
  | 'flutter'
  | 'bloom'
  | 'house'
  | 'swim'
  | 'drive'
  | 'sparkle'
  | 'party';

export type ShapeScenePlacement = {
  x: number;
  y: number;
  scale: number;
  angle?: number;
};

/**
 * 形状主题包由积木清单、摆放位置和完成表现组成。
 * 页面只消费配置，因此新增机器人、城堡等主题无需增加关卡分支。
 */
export type ShapeLevelConfig = {
  id: string;
  background: Color;
  accent: Color;
  shapes: readonly ToyShape[];
  colors: readonly Color[];
  placements: readonly ShapeScenePlacement[];
  thumbnailFrame: string;
  referenceFrame: string;
  completionEffect: ShapeCompletionEffect;
};
