import { Color } from 'cc';
import type { MatchDifficulty } from '../common/MatchTypes';
import type { ColorLevelConfig, ColorStageConfig, ColorToken } from './ColorTypes';

const TOKENS: Record<ColorToken['id'], ColorToken> = {
  red: { id: 'red', color: new Color(244, 91, 96, 255), cue: 'dots' },
  yellow: { id: 'yellow', color: new Color(255, 193, 52, 255), cue: 'stripes' },
  blue: { id: 'blue', color: new Color(67, 157, 229, 255), cue: 'star' },
  green: { id: 'green', color: new Color(77, 184, 110, 255), cue: 'waves' },
  purple: { id: 'purple', color: new Color(154, 105, 224, 255), cue: 'heart' },
};

const DEFAULT_STAGES: Record<MatchDifficulty, ColorStageConfig> = {
  1: {
    itemCount: 3,
    presentOneByOne: true,
    targetCueOpacity: 225,
    snapPadding: 96,
    trayAngle: 0,
  },
  2: {
    itemCount: 4,
    presentOneByOne: false,
    targetCueOpacity: 155,
    snapPadding: 72,
    trayAngle: 5,
  },
  3: {
    itemCount: 5,
    presentOneByOne: false,
    targetCueOpacity: 105,
    snapPadding: 54,
    trayAngle: 9,
  },
};

export const COLOR_LEVELS: readonly ColorLevelConfig[] = [
  {
    id: 'balloon-party-v3',
    title: '气球派对',
    subtitle: '给气球涂上颜色',
    sceneKind: 'balloon',
    background: new Color(224, 244, 255, 255),
    accent: new Color(244, 91, 112, 255),
    palette: [TOKENS.red, TOKENS.yellow, TOKENS.blue, TOKENS.green, TOKENS.purple],
    stages: DEFAULT_STAGES,
    celebration: 'balloon-fly',
  },
  {
    id: 'orchard-paint-v3',
    title: '果园丰收',
    subtitle: '让果实变得香甜',
    sceneKind: 'orchard',
    background: new Color(235, 249, 221, 255),
    accent: new Color(88, 178, 103, 255),
    palette: [TOKENS.red, TOKENS.yellow, TOKENS.green, TOKENS.purple, TOKENS.blue],
    stages: DEFAULT_STAGES,
    celebration: 'fruit-party',
  },
  {
    id: 'ocean-friends-v3',
    title: '海底朋友',
    subtitle: '给小鱼穿上新衣',
    sceneKind: 'fish',
    background: new Color(217, 244, 249, 255),
    accent: new Color(54, 164, 194, 255),
    palette: [TOKENS.blue, TOKENS.yellow, TOKENS.green, TOKENS.purple, TOKENS.red],
    stages: DEFAULT_STAGES,
    celebration: 'fish-swim',
  },
  {
    id: 'rainbow-train-v3',
    title: '彩虹火车',
    subtitle: '点亮每一节车厢',
    sceneKind: 'train',
    background: new Color(255, 241, 211, 255),
    accent: new Color(239, 128, 53, 255),
    palette: [TOKENS.red, TOKENS.blue, TOKENS.yellow, TOKENS.green, TOKENS.purple],
    stages: DEFAULT_STAGES,
    celebration: 'train-go',
  },
];

export function getColorStage(
  level: ColorLevelConfig,
  difficulty: MatchDifficulty,
): ColorStageConfig {
  return level.stages[difficulty];
}
