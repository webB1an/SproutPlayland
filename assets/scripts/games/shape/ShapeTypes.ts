import { Color } from 'cc';
import type { ToyShape } from '../common/MatchTypes';

export type ShapeLevelConfig = {
  id: string;
  background: Color;
  accent: Color;
  shapes: readonly ToyShape[];
  colors: readonly Color[];
};
