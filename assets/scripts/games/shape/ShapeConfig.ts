import { Color } from 'cc';
import type { MatchDifficulty, ToyShape } from '../common/MatchTypes';
import type {
  ShapeCompletionEffect,
  ShapeLevelConfig,
  ShapeScenePlacement,
} from './ShapeTypes';

const COLORS = [
  new Color(244, 117, 103, 255),
  new Color(255, 193, 67, 255),
  new Color(82, 176, 220, 255),
  new Color(153, 119, 225, 255),
  new Color(86, 185, 126, 255),
  new Color(239, 116, 163, 255),
  new Color(62, 177, 168, 255),
  new Color(244, 143, 72, 255),
] as const;

function rotate<T>(values: readonly T[], amount: number): T[] {
  return values.map((_, index) => values[(index + amount) % values.length]);
}

function level(
  id: string,
  background: Color,
  accent: Color,
  shapes: readonly ToyShape[],
  colors: readonly Color[],
  placements: readonly ShapeScenePlacement[],
  completionEffect: ShapeCompletionEffect,
): ShapeLevelConfig {
  return {
    id,
    background,
    accent,
    shapes,
    colors,
    placements,
    thumbnailFrame: `shape-${id}`,
    referenceFrame: `shape-${id}`,
    completionEffect,
  };
}

export const SHAPE_LEVELS: readonly ShapeLevelConfig[] = [
  level(
    'meadow',
    new Color(226, 245, 243, 255),
    COLORS[4],
    ['square', 'rectangle', 'circle', 'circle', 'rectangle', 'rectangle', 'square', 'star'],
    rotate(COLORS, 0),
    [
      { x: 0, y: 118, scale: 0.78 },
      { x: 0, y: 12, scale: 1.05, angle: 90 },
      { x: -26, y: 128, scale: 0.18 },
      { x: 26, y: 128, scale: 0.18 },
      { x: -105, y: 18, scale: 0.58 },
      { x: 105, y: 18, scale: 0.58 },
      { x: -42, y: -106, scale: 0.46 },
      { x: 0, y: 12, scale: 0.27 },
    ],
    'dance',
  ),
  level(
    'sun',
    new Color(255, 245, 218, 255),
    COLORS[1],
    ['rectangle', 'triangle', 'circle', 'oval', 'triangle', 'triangle', 'star', 'circle'],
    rotate(COLORS, 1),
    [
      { x: 0, y: 10, scale: 1.18, angle: 90 },
      { x: 0, y: 148, scale: 0.78 },
      { x: 0, y: 48, scale: 0.34 },
      { x: 0, y: -132, scale: 0.62, angle: 90 },
      { x: -78, y: -45, scale: 0.58, angle: 90 },
      { x: 78, y: -45, scale: 0.58, angle: -90 },
      { x: 0, y: -182, scale: 0.32 },
      { x: 0, y: 48, scale: 0.12 },
    ],
    'launch',
  ),
  level(
    'cloud',
    new Color(229, 242, 252, 255),
    COLORS[2],
    ['oval', 'rectangle', 'triangle', 'triangle', 'circle', 'star', 'oval', 'circle'],
    rotate(COLORS, 2),
    [
      { x: 0, y: -80, scale: 1.35 },
      { x: 0, y: 18, scale: 0.86, angle: 90 },
      { x: -58, y: 34, scale: 0.92 },
      { x: 54, y: 42, scale: 0.78 },
      { x: -135, y: 125, scale: 0.38 },
      { x: -135, y: 125, scale: 0.18 },
      { x: 0, y: -112, scale: 0.72 },
      { x: 85, y: -87, scale: 0.18 },
    ],
    'sail',
  ),
  level(
    'berry',
    new Color(247, 234, 249, 255),
    COLORS[3],
    ['oval', 'heart', 'heart', 'circle', 'circle', 'oval', 'star', 'star'],
    rotate(COLORS, 3),
    [
      { x: 0, y: 0, scale: 0.88, angle: 90 },
      { x: -76, y: 42, scale: 0.88, angle: -22 },
      { x: 76, y: 42, scale: 0.88, angle: 22 },
      { x: -23, y: 68, scale: 0.2 },
      { x: 23, y: 68, scale: 0.2 },
      { x: 0, y: -88, scale: 0.48, angle: 90 },
      { x: -112, y: -42, scale: 0.24 },
      { x: 112, y: -42, scale: 0.24 },
    ],
    'flutter',
  ),
  level(
    'flower',
    new Color(255, 235, 243, 255),
    COLORS[5],
    ['circle', 'oval', 'oval', 'oval', 'oval', 'oval', 'heart', 'heart'],
    rotate(COLORS, 4),
    [
      { x: 0, y: 62, scale: 0.52 },
      { x: 0, y: 145, scale: 0.68, angle: 90 },
      { x: 78, y: 78, scale: 0.68, angle: 32 },
      { x: 48, y: -2, scale: 0.68, angle: -35 },
      { x: -48, y: -2, scale: 0.68, angle: 35 },
      { x: -78, y: 78, scale: 0.68, angle: -32 },
      { x: -42, y: -116, scale: 0.44, angle: -28 },
      { x: 42, y: -116, scale: 0.44, angle: 28 },
    ],
    'bloom',
  ),
  level(
    'leaf',
    new Color(234, 247, 229, 255),
    COLORS[4],
    ['square', 'triangle', 'rectangle', 'square', 'square', 'circle', 'star', 'heart'],
    rotate(COLORS, 5),
    [
      { x: 0, y: -5, scale: 1.18 },
      { x: 0, y: 132, scale: 1.08 },
      { x: 0, y: -52, scale: 0.55, angle: 90 },
      { x: -53, y: 8, scale: 0.34 },
      { x: 53, y: 8, scale: 0.34 },
      { x: 0, y: -58, scale: 0.12 },
      { x: -105, y: 116, scale: 0.26 },
      { x: 105, y: 116, scale: 0.26 },
    ],
    'house',
  ),
  level(
    'lake',
    new Color(226, 247, 246, 255),
    COLORS[6],
    ['oval', 'triangle', 'circle', 'circle', 'triangle', 'oval', 'circle', 'circle'],
    rotate(COLORS, 6),
    [
      { x: 0, y: 8, scale: 1.24 },
      { x: -122, y: 8, scale: 0.72, angle: 90 },
      { x: 66, y: 42, scale: 0.2 },
      { x: 66, y: 42, scale: 0.08 },
      { x: 8, y: -68, scale: 0.42, angle: 180 },
      { x: 58, y: 5, scale: 0.32 },
      { x: 132, y: 100, scale: 0.18 },
      { x: 172, y: 142, scale: 0.12 },
    ],
    'swim',
  ),
  level(
    'orange',
    new Color(255, 239, 224, 255),
    COLORS[7],
    ['rectangle', 'circle', 'circle', 'square', 'square', 'circle', 'star', 'heart'],
    rotate(COLORS, 7),
    [
      { x: 0, y: 18, scale: 1.42 },
      { x: -78, y: -82, scale: 0.46 },
      { x: 78, y: -82, scale: 0.46 },
      { x: -42, y: 45, scale: 0.38 },
      { x: 42, y: 45, scale: 0.38 },
      { x: 0, y: -10, scale: 0.16 },
      { x: -128, y: 30, scale: 0.22 },
      { x: 128, y: 30, scale: 0.22 },
    ],
    'drive',
  ),
  level(
    'rainbow',
    new Color(241, 238, 252, 255),
    COLORS[3],
    ['square', 'square', 'square', 'triangle', 'triangle', 'triangle', 'rectangle', 'star'],
    rotate(COLORS, 2),
    [
      { x: 0, y: -32, scale: 1.02 },
      { x: -92, y: -18, scale: 0.78 },
      { x: 92, y: -18, scale: 0.78 },
      { x: 0, y: 92, scale: 0.68 },
      { x: -92, y: 82, scale: 0.58 },
      { x: 92, y: 82, scale: 0.58 },
      { x: 0, y: -72, scale: 0.38, angle: 90 },
      { x: 0, y: 18, scale: 0.26 },
    ],
    'sparkle',
  ),
  level(
    'party',
    new Color(255, 241, 230, 255),
    COLORS[0],
    ['circle', 'triangle', 'circle', 'circle', 'star', 'heart', 'oval', 'rectangle'],
    rotate(COLORS, 5),
    [
      { x: 0, y: -5, scale: 1.36 },
      { x: 0, y: 142, scale: 0.72 },
      { x: -42, y: 30, scale: 0.18 },
      { x: 42, y: 30, scale: 0.18 },
      { x: -92, y: 125, scale: 0.24 },
      { x: 92, y: 125, scale: 0.24 },
      { x: 0, y: -50, scale: 0.34 },
      { x: 0, y: 82, scale: 0.24 },
    ],
    'party',
  ),
];

export function getShapeCount(difficulty: MatchDifficulty): number {
  return difficulty === 1 ? 4 : difficulty === 2 ? 6 : 8;
}

export function getShapeSceneLayout(
  level: ShapeLevelConfig,
  count: number,
): readonly ShapeScenePlacement[] {
  return level.placements.slice(0, count);
}
