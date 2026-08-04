import { Color } from 'cc';
import type { MatchDifficulty, ToyShape } from '../common/MatchTypes';
import type { ColorLevelConfig } from './ColorTypes';

const RED = new Color(242, 103, 94, 255);
const YELLOW = new Color(255, 190, 55, 255);
const BLUE = new Color(72, 166, 219, 255);
const GREEN = new Color(91, 181, 112, 255);
const PURPLE = new Color(151, 112, 222, 255);
const ORANGE = new Color(244, 139, 68, 255);
const PINK = new Color(241, 116, 161, 255);
const TEAL = new Color(62, 177, 168, 255);
const LIME = new Color(158, 196, 69, 255);
const CORAL = new Color(244, 126, 103, 255);

const MARKERS: readonly ToyShape[] = [
  'circle',
  'star',
  'triangle',
  'heart',
  'diamond',
];

function level(
  id: string,
  background: Color,
  accent: Color,
  palette: readonly Color[],
  completionEffect: ColorLevelConfig['completionEffect'],
): ColorLevelConfig {
  return {
    id,
    background,
    accent,
    palette,
    markerShapes: MARKERS,
    thumbnailFrame: `color-${id}`,
    backgroundFrame: `color-${id}`,
    itemFrame: `theme-${id}-item`,
    targetFrame: `theme-${id}-target`,
    completionEffect,
  };
}

export const COLOR_LEVELS: readonly ColorLevelConfig[] = [
  level('sunny', new Color(255, 244, 225, 255), YELLOW, [RED, YELLOW, BLUE, GREEN, PURPLE], 'float'),
  level('orchard', new Color(239, 249, 225, 255), GREEN, [GREEN, ORANGE, RED, YELLOW, PURPLE], 'bounce'),
  level('ocean', new Color(226, 246, 249, 255), BLUE, [BLUE, TEAL, YELLOW, PURPLE, CORAL], 'swim'),
  level('candy', new Color(255, 235, 244, 255), PINK, [PINK, PURPLE, YELLOW, TEAL, BLUE], 'pop'),
  level('forest', new Color(232, 246, 231, 255), TEAL, [GREEN, TEAL, LIME, ORANGE, PURPLE], 'flutter'),
  level('sunset', new Color(255, 238, 222, 255), ORANGE, [ORANGE, CORAL, PURPLE, YELLOW, PINK], 'sway'),
  level('rain', new Color(229, 242, 252, 255), BLUE, [BLUE, PURPLE, TEAL, PINK, YELLOW], 'splash'),
  level('flower', new Color(248, 239, 246, 255), PINK, [PINK, YELLOW, GREEN, PURPLE, ORANGE], 'bloom'),
  level('melon', new Color(240, 249, 230, 255), LIME, [LIME, CORAL, GREEN, YELLOW, BLUE], 'bounce'),
  level('rainbow', new Color(243, 239, 252, 255), PURPLE, [RED, ORANGE, YELLOW, GREEN, BLUE], 'roll'),
];

export function getColorGroupCount(difficulty: MatchDifficulty): number {
  return difficulty === 1 ? 3 : difficulty === 2 ? 4 : 5;
}
