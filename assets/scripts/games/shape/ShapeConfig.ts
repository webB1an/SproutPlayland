import { Color } from 'cc';
import type { MatchDifficulty } from '../common/MatchTypes';
import type { ShapeLevelConfig } from './ShapeTypes';

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

export const SHAPE_LEVELS: readonly ShapeLevelConfig[] = [
  { id: 'meadow', background: new Color(226, 245, 243, 255), accent: COLORS[4], shapes: ['square', 'circle', 'circle', 'square', 'oval', 'oval', 'square', 'hexagon'], colors: rotate(COLORS, 0) },
  { id: 'sun', background: new Color(255, 245, 218, 255), accent: COLORS[1], shapes: ['square', 'triangle', 'circle', 'oval', 'triangle', 'triangle', 'star', 'hexagon'], colors: rotate(COLORS, 1) },
  { id: 'cloud', background: new Color(229, 242, 252, 255), accent: COLORS[2], shapes: ['oval', 'triangle', 'triangle', 'circle', 'circle', 'square', 'star', 'hexagon'], colors: rotate(COLORS, 2) },
  { id: 'berry', background: new Color(247, 234, 249, 255), accent: COLORS[3], shapes: ['oval', 'circle', 'heart', 'heart', 'circle', 'circle', 'star', 'star'], colors: rotate(COLORS, 3) },
  { id: 'flower', background: new Color(255, 235, 243, 255), accent: COLORS[5], shapes: ['circle', 'oval', 'oval', 'oval', 'oval', 'oval', 'heart', 'heart'], colors: rotate(COLORS, 4) },
  { id: 'leaf', background: new Color(234, 247, 229, 255), accent: COLORS[4], shapes: ['square', 'triangle', 'square', 'square', 'square', 'circle', 'hexagon', 'star'], colors: rotate(COLORS, 5) },
  { id: 'lake', background: new Color(226, 247, 246, 255), accent: COLORS[6], shapes: ['oval', 'triangle', 'circle', 'triangle', 'triangle', 'circle', 'star', 'hexagon'], colors: rotate(COLORS, 6) },
  { id: 'orange', background: new Color(255, 239, 224, 255), accent: COLORS[7], shapes: ['square', 'circle', 'circle', 'square', 'circle', 'circle', 'star', 'hexagon'], colors: rotate(COLORS, 7) },
  { id: 'rainbow', background: new Color(241, 238, 252, 255), accent: COLORS[3], shapes: ['square', 'square', 'square', 'triangle', 'triangle', 'triangle', 'circle', 'hexagon'], colors: rotate(COLORS, 2) },
  { id: 'party', background: new Color(255, 241, 230, 255), accent: COLORS[0], shapes: ['circle', 'triangle', 'triangle', 'star', 'star', 'heart', 'oval', 'hexagon'], colors: rotate(COLORS, 5) },
];

export function getShapeCount(difficulty: MatchDifficulty): number {
  return difficulty === 1 ? 4 : difficulty === 2 ? 6 : 8;
}

export type ShapeScenePlacement = { x: number; y: number; scale: number; angle?: number };

const SCENE_LAYOUTS: Record<string, readonly ShapeScenePlacement[]> = {
  meadow: [{ x: 0, y: 120, scale: 1.05 }, { x: -30, y: 132, scale: 0.32 }, { x: 30, y: 132, scale: 0.32 }, { x: 0, y: 5, scale: 1.15 }, { x: -92, y: 8, scale: 0.55, angle: 20 }, { x: 92, y: 8, scale: 0.55, angle: -20 }, { x: -38, y: -105, scale: 0.48 }, { x: 38, y: -105, scale: 0.48 }],
  sun: [{ x: 0, y: 20, scale: 1.28 }, { x: 0, y: 145, scale: 0.95 }, { x: 0, y: 35, scale: 0.42 }, { x: 0, y: -108, scale: 0.58 }, { x: -88, y: -28, scale: 0.66, angle: -18 }, { x: 88, y: -28, scale: 0.66, angle: 18 }, { x: 0, y: -165, scale: 0.42 }, { x: 0, y: -58, scale: 0.35 }],
  cloud: [{ x: 0, y: -55, scale: 1.5 }, { x: -62, y: 38, scale: 1.0 }, { x: 55, y: 48, scale: 0.9 }, { x: -55, y: -82, scale: 0.34 }, { x: 5, y: -82, scale: 0.34 }, { x: 72, y: -80, scale: 0.42 }, { x: 0, y: 118, scale: 0.35 }, { x: -110, y: -45, scale: 0.35 }],
  berry: [{ x: 0, y: 0, scale: 0.72 }, { x: 0, y: 105, scale: 0.44 }, { x: -78, y: 45, scale: 0.88, angle: -28 }, { x: 78, y: 45, scale: 0.88, angle: 28 }, { x: -70, y: -58, scale: 0.45 }, { x: 70, y: -58, scale: 0.45 }, { x: -28, y: 132, scale: 0.25 }, { x: 28, y: 132, scale: 0.25 }],
  flower: [{ x: 0, y: 55, scale: 0.55 }, { x: 0, y: 135, scale: 0.72 }, { x: 75, y: 75, scale: 0.72, angle: 55 }, { x: 48, y: -5, scale: 0.72, angle: 120 }, { x: -48, y: -5, scale: 0.72, angle: -120 }, { x: -75, y: 75, scale: 0.72, angle: -55 }, { x: -45, y: -105, scale: 0.48, angle: -35 }, { x: 45, y: -105, scale: 0.48, angle: 35 }],
  leaf: [{ x: 0, y: -10, scale: 1.35 }, { x: 0, y: 125, scale: 1.25 }, { x: -48, y: -15, scale: 0.38 }, { x: 48, y: -15, scale: 0.38 }, { x: 0, y: -82, scale: 0.48 }, { x: 0, y: 18, scale: 0.28 }, { x: -92, y: -100, scale: 0.3 }, { x: 92, y: -100, scale: 0.3 }],
  lake: [{ x: 0, y: 15, scale: 1.28 }, { x: 105, y: 15, scale: 0.9, angle: 90 }, { x: -42, y: 30, scale: 0.34 }, { x: -5, y: 92, scale: 0.48 }, { x: -5, y: -65, scale: 0.48, angle: 180 }, { x: -105, y: 10, scale: 0.24 }, { x: 48, y: -5, scale: 0.24 }, { x: 25, y: 22, scale: 0.24 }],
  orange: [{ x: 0, y: 5, scale: 1.55 }, { x: -72, y: -72, scale: 0.48 }, { x: 72, y: -72, scale: 0.48 }, { x: 0, y: 65, scale: 0.75 }, { x: -72, y: -72, scale: 0.25 }, { x: 72, y: -72, scale: 0.25 }, { x: -95, y: 20, scale: 0.28 }, { x: 98, y: 15, scale: 0.28 }],
  rainbow: [{ x: 0, y: -25, scale: 1.1 }, { x: -90, y: -20, scale: 0.82 }, { x: 90, y: -20, scale: 0.82 }, { x: 0, y: 95, scale: 0.72 }, { x: -90, y: 78, scale: 0.62 }, { x: 90, y: 78, scale: 0.62 }, { x: 0, y: -48, scale: 0.34 }, { x: 0, y: 25, scale: 0.28 }],
  party: [{ x: 0, y: 0, scale: 1.45 }, { x: -42, y: 32, scale: 0.22 }, { x: 42, y: 32, scale: 0.22 }, { x: -85, y: 110, scale: 0.28 }, { x: 85, y: 110, scale: 0.28 }, { x: 0, y: -48, scale: 0.34 }, { x: 0, y: 112, scale: 0.55 }, { x: 0, y: 0, scale: 0.22 }],
};

export function getShapeSceneLayout(levelId: string, count: number): readonly ShapeScenePlacement[] {
  return (SCENE_LAYOUTS[levelId] ?? SCENE_LAYOUTS.meadow).slice(0, count);
}
