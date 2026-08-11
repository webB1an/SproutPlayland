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
