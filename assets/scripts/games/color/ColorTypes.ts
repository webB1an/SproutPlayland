import { Color } from 'cc';
import type { ToyShape } from '../common/MatchTypes';

export type ColorLevelConfig = {
  id: string;
  background: Color;
  accent: Color;
  palette: readonly Color[];
  toyShapes: readonly ToyShape[];
};
