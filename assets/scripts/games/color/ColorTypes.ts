import { Color } from 'cc';
import type { ToyShape } from '../common/MatchTypes';

export type ColorCompletionEffect =
  | 'float'
  | 'bounce'
  | 'swim'
  | 'pop'
  | 'flutter'
  | 'sway'
  | 'splash'
  | 'bloom'
  | 'roll';

/**
 * 一个颜色主题包只描述资源和表现，不包含页面分支逻辑。
 * 后续增加主题时，只需增加资源并追加一条配置。
 */
export type ColorLevelConfig = {
  id: string;
  background: Color;
  accent: Color;
  palette: readonly Color[];
  markerShapes: readonly ToyShape[];
  thumbnailFrame: string;
  backgroundFrame: string;
  itemFrame: string;
  targetFrame: string;
  completionEffect: ColorCompletionEffect;
};
