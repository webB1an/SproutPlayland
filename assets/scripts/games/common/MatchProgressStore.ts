import { sys } from 'cc';

/** 保存每个玩法各关卡的最高星级，存储失败时不影响儿童继续游戏。 */
export class MatchProgressStore {
  private stars: Record<string, number> = {};

  constructor(
    private readonly storageKey: string,
    private readonly validLevelIds: readonly string[],
  ) {
    this.load();
  }

  get(levelId: string): number {
    return Math.max(0, Math.min(3, Math.floor(this.stars[levelId] ?? 0)));
  }

  award(levelId: string, stars: number): number {
    const earned = Math.max(1, Math.min(3, Math.floor(stars)));
    if (earned <= this.get(levelId)) {
      return earned;
    }
    this.stars[levelId] = earned;
    try {
      sys.localStorage.setItem(this.storageKey, JSON.stringify(this.stars));
    } catch {
      // 无本地存储权限时仍允许正常游玩。
    }
    return earned;
  }

  private load(): void {
    try {
      const saved = sys.localStorage.getItem(this.storageKey);
      if (!saved) {
        return;
      }
      const parsed = JSON.parse(saved) as Record<string, unknown>;
      for (const levelId of this.validLevelIds) {
        const value = parsed[levelId];
        if (typeof value === 'number' && Number.isFinite(value)) {
          this.stars[levelId] = Math.max(0, Math.min(3, Math.floor(value)));
        }
      }
    } catch {
      this.stars = {};
    }
  }
}
