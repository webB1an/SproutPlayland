import { Color } from 'cc';
import type { MatchDifficulty } from '../common/MatchTypes';
import type { ShapeLevelConfig, ShapeStageConfig } from './ShapeTypes';

const RED = new Color(239, 87, 82, 255);
const ORANGE = new Color(247, 143, 54, 255);
const YELLOW = new Color(255, 194, 55, 255);
const BLUE = new Color(69, 151, 225, 255);
const SKY = new Color(91, 191, 231, 255);
const GREEN = new Color(82, 181, 108, 255);
const PURPLE = new Color(151, 104, 222, 255);
const PINK = new Color(239, 112, 165, 255);
const WHITE = new Color(247, 245, 234, 255);
const GREY = new Color(91, 105, 120, 255);
const BROWN = new Color(181, 117, 71, 255);

const DEFAULT_STAGES: Record<MatchDifficulty, ShapeStageConfig> = {
  1: { partCount: 4, hintOpacity: 180, snapDistance: 108, randomAngle: 0 },
  2: { partCount: 6, hintOpacity: 110, snapDistance: 86, randomAngle: 8 },
  3: { partCount: 8, hintOpacity: 64, snapDistance: 72, randomAngle: 15 },
};

export const SHAPE_LEVELS: readonly ShapeLevelConfig[] = [
  {
    id: 'rocket-workshop-v3',
    title: '火箭工坊',
    subtitle: '用形状搭一枚小火箭',
    background: new Color(220, 235, 252, 255),
    accent: BLUE,
    objectScale: 1,
    celebration: 'rocket-launch',
    stages: DEFAULT_STAGES,
    parts: [
      { id: 'body', shape: 'oval', color: WHITE, size: 185, x: 0, y: 5, angle: 90 },
      { id: 'nose', shape: 'triangle', color: RED, size: 128, x: 0, y: 154 },
      { id: 'window', shape: 'circle', color: SKY, size: 76, x: 0, y: 42 },
      { id: 'flame', shape: 'triangle', color: ORANGE, size: 94, x: 0, y: -150, angle: 180 },
      { id: 'fin-left', shape: 'triangle', color: RED, size: 100, x: -104, y: -58, angle: 28, matchKey: 'rocket-fin' },
      { id: 'fin-right', shape: 'triangle', color: RED, size: 100, x: 104, y: -58, angle: -28, matchKey: 'rocket-fin' },
      { id: 'star-left', shape: 'star', color: YELLOW, size: 50, x: -185, y: 128, matchKey: 'rocket-star' },
      { id: 'star-right', shape: 'star', color: YELLOW, size: 50, x: 185, y: 108, matchKey: 'rocket-star' },
    ],
  },
  {
    id: 'little-car-v3',
    title: '快乐小汽车',
    subtitle: '装好车身、窗户和轮胎',
    background: new Color(255, 239, 218, 255),
    accent: ORANGE,
    objectScale: 1,
    celebration: 'car-drive',
    stages: DEFAULT_STAGES,
    parts: [
      { id: 'car-body', shape: 'rectangle', color: RED, size: 190, x: 0, y: -28 },
      { id: 'car-roof', shape: 'oval', color: ORANGE, size: 142, x: 0, y: 72 },
      { id: 'wheel-left', shape: 'circle', color: GREY, size: 76, x: -91, y: -118, matchKey: 'car-wheel' },
      { id: 'wheel-right', shape: 'circle', color: GREY, size: 76, x: 91, y: -118, matchKey: 'car-wheel' },
      { id: 'window-left', shape: 'square', color: SKY, size: 61, x: -43, y: 66, matchKey: 'car-window' },
      { id: 'window-right', shape: 'square', color: SKY, size: 61, x: 43, y: 66, matchKey: 'car-window' },
      { id: 'light-left', shape: 'star', color: YELLOW, size: 43, x: -112, y: -25, matchKey: 'car-light' },
      { id: 'light-right', shape: 'star', color: YELLOW, size: 43, x: 112, y: -25, matchKey: 'car-light' },
    ],
  },
  {
    id: 'cozy-house-v3',
    title: '温暖小房子',
    subtitle: '给小动物搭一个家',
    background: new Color(235, 247, 225, 255),
    accent: GREEN,
    objectScale: 0.95,
    celebration: 'house-light',
    stages: DEFAULT_STAGES,
    parts: [
      { id: 'house-wall', shape: 'square', color: YELLOW, size: 190, x: 0, y: -42 },
      { id: 'house-roof', shape: 'triangle', color: RED, size: 210, x: 0, y: 112 },
      { id: 'house-door', shape: 'rectangle', color: BROWN, size: 82, x: 0, y: -82, angle: 90 },
      { id: 'window-left', shape: 'square', color: SKY, size: 58, x: -59, y: -24, matchKey: 'house-window' },
      { id: 'window-right', shape: 'square', color: SKY, size: 58, x: 59, y: -24, matchKey: 'house-window' },
      { id: 'chimney', shape: 'rectangle', color: ORANGE, size: 70, x: 72, y: 132, angle: 90 },
      { id: 'bush-left', shape: 'circle', color: GREEN, size: 56, x: -128, y: -111, matchKey: 'house-bush' },
      { id: 'bush-right', shape: 'circle', color: GREEN, size: 56, x: 128, y: -111, matchKey: 'house-bush' },
    ],
  },
  {
    id: 'garden-butterfly-v3',
    title: '花园蝴蝶',
    subtitle: '拼好翅膀，让蝴蝶飞起来',
    background: new Color(246, 231, 250, 255),
    accent: PURPLE,
    objectScale: 0.95,
    celebration: 'butterfly-fly',
    stages: DEFAULT_STAGES,
    parts: [
      { id: 'body', shape: 'oval', color: PURPLE, size: 118, x: 0, y: -5, angle: 90 },
      { id: 'head', shape: 'circle', color: PURPLE, size: 68, x: 0, y: 102 },
      { id: 'upper-left', shape: 'heart', color: PINK, size: 150, x: -112, y: 45, angle: -32, matchKey: 'butterfly-upper' },
      { id: 'upper-right', shape: 'heart', color: PINK, size: 150, x: 112, y: 45, angle: 32, matchKey: 'butterfly-upper' },
      { id: 'lower-left', shape: 'oval', color: SKY, size: 112, x: -96, y: -76, angle: -30, matchKey: 'butterfly-lower' },
      { id: 'lower-right', shape: 'oval', color: SKY, size: 112, x: 96, y: -76, angle: 30, matchKey: 'butterfly-lower' },
      { id: 'flower-left', shape: 'star', color: YELLOW, size: 48, x: -185, y: 142, matchKey: 'garden-flower' },
      { id: 'flower-right', shape: 'star', color: YELLOW, size: 48, x: 185, y: 122, matchKey: 'garden-flower' },
    ],
  },
];

export function getShapeStage(
  level: ShapeLevelConfig,
  difficulty: MatchDifficulty,
): ShapeStageConfig {
  return level.stages[difficulty];
}
