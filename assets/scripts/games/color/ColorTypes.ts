import { Color } from 'cc';
import type { MatchDifficulty, MatchLevelBase } from '../common/MatchTypes';

export type ColorId = 'red' | 'yellow' | 'blue' | 'green' | 'purple';
export type ColorCue = 'dots' | 'stripes' | 'star' | 'waves' | 'heart';
export type ColorSceneKind = 'balloon' | 'orchard' | 'fish' | 'train';
export type ColorCelebration = 'balloon-fly' | 'fruit-party' | 'fish-swim' | 'train-go';

export type ColorToken = {
  id: ColorId;
  color: Color;
  cue: ColorCue;
};

export type ColorStageConfig = {
  itemCount: 3 | 4 | 5;
  presentOneByOne: boolean;
  targetCueOpacity: number;
  snapPadding: number;
  trayAngle: number;
};

export type ColorLevelConfig = MatchLevelBase & {
  title: string;
  subtitle: string;
  sceneKind: ColorSceneKind;
  background: Color;
  accent: Color;
  palette: readonly ColorToken[];
  stages: Record<MatchDifficulty, ColorStageConfig>;
  celebration: ColorCelebration;
};
