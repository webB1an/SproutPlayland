import type { MatchDifficulty } from '../common/MatchTypes';
import { MatchProgressStore } from '../common/MatchProgressStore';
import { COLOR_LEVELS } from './ColorConfig';
import { ColorGamePage } from './ColorGamePage';
import { ColorSelectPage } from './ColorSelectPage';
import type { ColorLevelConfig } from './ColorTypes';

export class ColorGameFlow {
  private selectedLevelIndex = 0;
  private difficulty: MatchDifficulty = 1;
  private readonly progress = new MatchProgressStore(
    'sprout-playland:color-stars:v1',
    COLOR_LEVELS.map((level) => level.id),
  );
  private readonly selectPage: ColorSelectPage;
  private readonly gamePage: ColorGamePage;

  constructor(app: any) {
    this.selectPage = new ColorSelectPage(app, this);
    this.gamePage = new ColorGamePage(app, this);
  }

  showLoading(): void { this.selectPage.showLoading(); }
  showSelect(): void { this.selectPage.show(); }

  startLevel(index: number): void {
    this.selectedLevelIndex = this.normalizeIndex(index);
    this.difficulty = this.getNextDifficulty(this.getCurrentLevel().id);
    this.gamePage.show();
  }

  replay(): void { this.gamePage.show(); }

  next(): void {
    if (this.difficulty < 3) {
      this.difficulty = (this.difficulty + 1) as MatchDifficulty;
      this.gamePage.show();
      return;
    }
    this.selectedLevelIndex = this.normalizeIndex(this.selectedLevelIndex + 1);
    this.difficulty = this.getNextDifficulty(this.getCurrentLevel().id);
    this.gamePage.show();
  }

  getCurrentLevel(): ColorLevelConfig { return COLOR_LEVELS[this.selectedLevelIndex]; }
  getDifficulty(): MatchDifficulty { return this.difficulty; }
  getStars(levelId: string): number { return this.progress.get(levelId); }
  complete(): number { return this.progress.award(this.getCurrentLevel().id, this.difficulty); }

  private getNextDifficulty(levelId: string): MatchDifficulty {
    const stars = this.progress.get(levelId);
    return Math.min(3, stars + 1) as MatchDifficulty;
  }

  private normalizeIndex(index: number): number {
    return ((index % COLOR_LEVELS.length) + COLOR_LEVELS.length) % COLOR_LEVELS.length;
  }
}
