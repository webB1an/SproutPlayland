import type { MatchDifficulty } from '../common/MatchTypes';
import { MatchProgressStore } from '../common/MatchProgressStore';
import { SHAPE_LEVELS } from './ShapeConfig';
import { ShapeGamePage } from './ShapeGamePage';
import { ShapeSelectPage } from './ShapeSelectPage';
import type { ShapeLevelConfig } from './ShapeTypes';

export class ShapeGameFlow {
  private selectedLevelIndex = 0;
  private difficulty: MatchDifficulty = 1;
  private readonly progress = new MatchProgressStore(
    'sprout-playland:shape-stars:v1',
    SHAPE_LEVELS.map((level) => level.id),
  );
  private readonly selectPage: ShapeSelectPage;
  private readonly gamePage: ShapeGamePage;

  constructor(app: any) {
    this.selectPage = new ShapeSelectPage(app, this);
    this.gamePage = new ShapeGamePage(app, this);
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

  getCurrentLevel(): ShapeLevelConfig { return SHAPE_LEVELS[this.selectedLevelIndex]; }
  getDifficulty(): MatchDifficulty { return this.difficulty; }
  getStars(levelId: string): number { return this.progress.get(levelId); }
  complete(): number { return this.progress.award(this.getCurrentLevel().id, this.difficulty); }

  private getNextDifficulty(levelId: string): MatchDifficulty {
    const stars = this.progress.get(levelId);
    return Math.min(3, stars + 1) as MatchDifficulty;
  }

  private normalizeIndex(index: number): number {
    return ((index % SHAPE_LEVELS.length) + SHAPE_LEVELS.length) % SHAPE_LEVELS.length;
  }
}
