import { sys } from 'cc';
import type { MiniGameId } from './GameRegistry';

const STORAGE_KEY = 'sprout-playland:mini-game-progress:v1';

type GameProgress = Record<string, number>;
type ProgressData = Partial<Record<MiniGameId, GameProgress>>;

/**
 * 新增小游戏共用的本地进度存储。
 * 每个玩法以关卡素材 id 为键，只保存该关取得过的最高星级。
 */
export class MiniGameProgressStore {
  private readonly data: ProgressData = {};

  constructor() {
    this.load();
  }

  getStars(gameId: MiniGameId, levelId: string): number {
    const value = this.data[gameId]?.[levelId] ?? 0;
    return this.normalizeStars(value);
  }

  award(gameId: MiniGameId, levelId: string, stars: number): number {
    const earned = this.normalizeStars(stars);
    const previous = this.getStars(gameId, levelId);
    if (earned <= previous) {
      return earned;
    }
    const gameProgress = this.data[gameId] ?? {};
    gameProgress[levelId] = earned;
    this.data[gameId] = gameProgress;
    this.save();
    return earned;
  }

  getCompletedCount(gameId: MiniGameId): number {
    const gameProgress = this.data[gameId];
    if (!gameProgress) {
      return 0;
    }
    let completed = 0;
    for (const levelId of Object.keys(gameProgress)) {
      if (this.normalizeStars(gameProgress[levelId]) > 0) {
        completed++;
      }
    }
    return completed;
  }

  private normalizeStars(value: number): number {
    if (!Number.isFinite(value)) {
      return 0;
    }
    return Math.max(0, Math.min(3, Math.floor(value)));
  }

  private load(): void {
    try {
      const raw = sys.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as ProgressData;
      for (const gameId of ['scratch', 'shadow', 'bubble', 'memory'] as const) {
        const source = parsed[gameId];
        if (!source || typeof source !== 'object') {
          continue;
        }
        const target: GameProgress = {};
        for (const levelId of Object.keys(source)) {
          const stars = (source as Record<string, unknown>)[levelId];
          if (typeof stars === 'number') {
            target[levelId] = this.normalizeStars(stars);
          }
        }
        this.data[gameId] = target;
      }
    } catch {
      // 本地存储损坏时从空进度继续，不影响游戏运行。
    }
  }

  private save(): void {
    try {
      sys.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch {
      // 浏览器或小游戏关闭本地存储时仍允许正常游玩。
    }
  }
}

export const miniGameProgress = new MiniGameProgressStore();
