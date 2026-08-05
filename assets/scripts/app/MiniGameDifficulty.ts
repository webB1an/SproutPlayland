import {
  Color,
  Node,
} from 'cc';
import type { DifficultyStars } from './MiniGameShared';

export type MiniGameDifficultyOption = {
  value: DifficultyStars;
  label: string;
  shortLabel: string;
};

export const MINI_GAME_DIFFICULTIES: readonly MiniGameDifficultyOption[] = [
  { value: 1, label: '简单', shortLabel: '易' },
  { value: 2, label: '普通', shortLabel: '中' },
  { value: 3, label: '困难', shortLabel: '难' },
] as const;

export function getMiniGameDifficultyOption(
  difficulty: DifficultyStars,
): MiniGameDifficultyOption {
  return MINI_GAME_DIFFICULTIES[difficulty - 1] ?? MINI_GAME_DIFFICULTIES[0];
}

export function createMiniGameDifficultyBadge(
  app: any,
  parent: Node,
  difficulty: DifficultyStars,
  x: number,
  y: number,
  accent: Color,
): Node {
  const option = getMiniGameDifficultyOption(difficulty);
  const badge = app.createPanel(
    parent,
    'MiniGameDifficultyBadge',
    x,
    y,
    136,
    52,
    new Color(255, 255, 247, 224),
    24,
    new Color(accent.r, accent.g, accent.b, 170),
    3,
  );
  app.createLabel(
    badge,
    option.label,
    -22,
    1,
    21,
    new Color(70, 89, 76, 255),
    72,
    34,
  );
  for (let index = 0; index < 3; index++) {
    app.createCircle(
      badge,
      28 + index * 15,
      0,
      5,
      index < difficulty
        ? accent
        : new Color(accent.r, accent.g, accent.b, 52),
    );
  }
  return badge;
}
