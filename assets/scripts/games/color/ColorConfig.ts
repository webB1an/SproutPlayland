import { Color } from 'cc';
import type { MatchDifficulty } from '../common/MatchTypes';
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

const SHAPES = [
  'circle', 'triangle', 'hexagon', 'star', 'oval',
  'square', 'heart', 'diamond', 'circle', 'star',
] as const;

export const COLOR_LEVELS: readonly ColorLevelConfig[] = [
  { id: 'sunny', background: new Color(255, 244, 225, 255), accent: YELLOW, palette: [RED, YELLOW, BLUE, GREEN, PURPLE], toyShapes: SHAPES },
  { id: 'orchard', background: new Color(239, 249, 225, 255), accent: GREEN, palette: [GREEN, ORANGE, RED, YELLOW, PURPLE], toyShapes: [...SHAPES].reverse() },
  { id: 'ocean', background: new Color(226, 246, 249, 255), accent: BLUE, palette: [BLUE, TEAL, YELLOW, PURPLE, CORAL], toyShapes: ['oval', 'star', 'circle', 'diamond', 'triangle', 'heart', 'hexagon', 'square', 'star', 'circle'] },
  { id: 'candy', background: new Color(255, 235, 244, 255), accent: PINK, palette: [PINK, PURPLE, YELLOW, TEAL, BLUE], toyShapes: ['heart', 'circle', 'star', 'square', 'oval', 'diamond', 'triangle', 'hexagon', 'heart', 'star'] },
  { id: 'forest', background: new Color(232, 246, 231, 255), accent: TEAL, palette: [GREEN, TEAL, LIME, ORANGE, PURPLE], toyShapes: ['hexagon', 'oval', 'triangle', 'circle', 'diamond', 'star', 'square', 'heart', 'oval', 'circle'] },
  { id: 'sunset', background: new Color(255, 238, 222, 255), accent: ORANGE, palette: [ORANGE, CORAL, PURPLE, YELLOW, PINK], toyShapes: ['triangle', 'circle', 'heart', 'star', 'square', 'oval', 'diamond', 'hexagon', 'circle', 'star'] },
  { id: 'rain', background: new Color(229, 242, 252, 255), accent: BLUE, palette: [BLUE, PURPLE, TEAL, PINK, YELLOW], toyShapes: ['diamond', 'oval', 'circle', 'hexagon', 'star', 'triangle', 'heart', 'square', 'oval', 'circle'] },
  { id: 'flower', background: new Color(248, 239, 246, 255), accent: PINK, palette: [PINK, YELLOW, GREEN, PURPLE, ORANGE], toyShapes: ['heart', 'star', 'circle', 'oval', 'triangle', 'square', 'diamond', 'hexagon', 'star', 'heart'] },
  { id: 'melon', background: new Color(240, 249, 230, 255), accent: LIME, palette: [LIME, CORAL, GREEN, YELLOW, BLUE], toyShapes: ['oval', 'circle', 'triangle', 'square', 'star', 'heart', 'hexagon', 'diamond', 'circle', 'oval'] },
  { id: 'rainbow', background: new Color(243, 239, 252, 255), accent: PURPLE, palette: [RED, ORANGE, YELLOW, GREEN, BLUE], toyShapes: ['star', 'heart', 'circle', 'triangle', 'diamond', 'square', 'oval', 'hexagon', 'heart', 'star'] },
];

export function getColorGroupCount(difficulty: MatchDifficulty): number {
  return difficulty === 1 ? 3 : difficulty === 2 ? 4 : 5;
}
