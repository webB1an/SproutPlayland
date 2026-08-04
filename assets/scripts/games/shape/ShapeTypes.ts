import { Color } from 'cc';
import type {
  MatchDifficulty,
  MatchLevelBase,
  ToyShape,
} from '../common/MatchTypes';

export type ShapeCelebration =
  | 'rocket-launch'
  | 'car-drive'
  | 'house-light'
  | 'butterfly-fly';

export type ShapePartConfig = {
  id: string;
  shape: ToyShape;
  color: Color;
  size: number;
  x: number;
  y: number;
  angle?: number;
  matchKey?: string;
};

export type ShapeStageConfig = {
  partCount: 4 | 6 | 8;
  hintOpacity: number;
  snapDistance: number;
  randomAngle: number;
};

export type ShapeLevelConfig = MatchLevelBase & {
  title: string;
  subtitle: string;
  background: Color;
  accent: Color;
  objectScale: number;
  parts: readonly ShapePartConfig[];
  stages: Record<MatchDifficulty, ShapeStageConfig>;
  celebration: ShapeCelebration;
};
