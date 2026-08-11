import {
  Color,
  Node,
  tween,
  UIOpacity,
  Vec3,
} from 'cc';
import { GameCompletionModal } from '../GameCompletionModal';
import { getMiniGameDefinition } from '../GameRegistry';
import { miniGameProgress } from '../MiniGameProgressStore';
import {
  type DifficultyStars,
  getArtworksForMiniGame,
  getNextLevelIndex,
  getWrappedArtworks,
  shuffleWithRandom,
} from '../MiniGameShared';
import type { PuzzleArtwork } from '../../games/puzzle/PuzzleTypes';
import { PageController } from '../PageController';
import { toColor } from '../ui/UiTheme';

type MemoryCardState = {
  card: Node;
  front: Node;
  back: Node;
  artwork: PuzzleArtwork;
  flipped: boolean;
  matched: boolean;
};

export class MemoryGamePage extends PageController {
  private runId = 0;
  private locked = false;
  private completed = false;
  private selected: MemoryCardState[] = [];
  private cards: MemoryCardState[] = [];
  private pairDots: Node[] = [];

  constructor(app: any, private readonly onExit: () => void) {
    super(app);
  }

  show(levelIndex: number, difficulty: DifficultyStars = 1): void {
    const runId = ++this.runId;
    this.locked = false;
    this.completed = false;
    this.selected = [];
    this.cards = [];
    const allArtworks = getArtworksForMiniGame(
      'memory',
      this.puzzleArtworks as PuzzleArtwork[],
    );
    const activeArtwork = allArtworks[levelIndex];
    if (!activeArtwork) {
      this.onExit();
      return;
    }
    const pairCount = difficulty + 1;
    const artworks = getWrappedArtworks(allArtworks, levelIndex, pairCount);
    const pairedArtworks: PuzzleArtwork[] = [];
    for (const artwork of artworks) {
      pairedArtworks.push(artwork, artwork);
    }
    const deck = shuffleWithRandom(pairedArtworks, Math.random);
    const definition = getMiniGameDefinition('memory');
    const accent = toColor(definition.palette.accent);
    const root = this.resetScreen('MemoryGame');
    this.drawFullBackground(root, toColor(definition.palette.background));
    this.createCircle(root, -630, -330, 190, new Color(239, 142, 180, 42));
    this.createCircle(root, 625, 325, 160, new Color(255, 255, 244, 100));
    this.createBackButton(root, () => this.leave());
    this.createPanel(
      root,
      'MemoryTargetDepth',
      4,
      302,
      88,
      88,
      new Color(accent.r, accent.g, accent.b, 48),
      22,
    );
    if (this.frames.has(activeArtwork.thumbnailFrame)) {
      this.createCoverImage(
        root,
        activeArtwork.thumbnailFrame,
        0,
        310,
        82,
        82,
        20,
      );
    } else {
      this.createPanel(
        root,
        'MemoryTargetFallback',
        0,
        310,
        82,
        82,
        activeArtwork.fallbackColor,
        20,
      );
    }
    const layout = this.getLayout(pairCount);
    deck.forEach((artwork, index) => {
      const column = index % layout.columns;
      const row = Math.floor(index / layout.columns);
      const x = (column - (layout.columns - 1) / 2) * layout.stepX;
      const y = layout.centerY - row * layout.stepY;
      const state = this.createCard(
        root,
        artwork,
        x,
        y,
        layout.width,
        layout.height,
        index,
      );
      this.cards.push(state);
      this.bindCard(state, levelIndex, difficulty, activeArtwork, runId);
      // 卡片错峰弹入，弱化整屏同时出现的生硬感。
      state.card.setScale(Vec3.ZERO);
      tween(state.card)
        .delay(0.12 + index * 0.05)
        .to(0.28, { scale: Vec3.ONE }, { easing: 'backOut' })
        .start();
    });
    // 只需要找到选关时指定的目标配对，因此进度只显示一个目标点。
    this.createPairProgress(root, 1);
  }

  private getLayout(pairCount: number): {
    columns: number;
    stepX: number;
    stepY: number;
    centerY: number;
    width: number;
    height: number;
  } {
    if (pairCount === 2) {
      return {
        columns: 4,
        stepX: 226,
        stepY: 0,
        centerY: -8,
        width: 184,
        height: 236,
      };
    }
    if (pairCount === 3) {
      return {
        columns: 3,
        stepX: 222,
        stepY: 226,
        centerY: 104,
        width: 172,
        height: 204,
      };
    }
    return {
      columns: 4,
      stepX: 188,
      stepY: 210,
      centerY: 98,
      width: 148,
      height: 180,
    };
  }

  private createCard(
    parent: Node,
    artwork: PuzzleArtwork,
    x: number,
    y: number,
    width: number,
    height: number,
    index: number,
  ): MemoryCardState {
    const card = this.createUiNode(
      `MemoryCard-${index}`,
      parent,
      x,
      y,
      width,
      height,
    );
    this.createPanel(
      card,
      'MemoryCardDepth',
      4,
      -8,
      width,
      height,
      new Color(124, 73, 99, 45),
      Math.max(20, width * 0.14),
    );

    const front = this.createUiNode('MemoryFront', card, 0, 0, width, height);
    this.createPanel(
      front,
      'MemoryFrontMat',
      0,
      0,
      width,
      height,
      new Color(255, 255, 246, 255),
      Math.max(20, width * 0.14),
      new Color(255, 255, 255, 245),
      4,
    );
    this.createCoverImage(
      front,
      artwork.thumbnailFrame,
      0,
      0,
      width - 16,
      height - 16,
      Math.max(16, width * 0.11),
    );
    front.active = false;

    const back = this.createUiNode('MemoryBack', card, 0, 0, width, height);
    this.createPanel(
      back,
      'MemoryBackFace',
      0,
      0,
      width,
      height,
      new Color(224, 135, 174, 255),
      Math.max(20, width * 0.14),
      new Color(255, 240, 249, 245),
      4,
    );
    if (this.frames.has('memory-card-back-v1')) {
      this.createCoverImage(
        back,
        'memory-card-back-v1',
        0,
        0,
        width - 12,
        height - 12,
        Math.max(16, width * 0.11),
      );
    } else {
      this.createPanel(
        back,
        'MemoryBackInset',
        0,
        0,
        width - 24,
        height - 24,
        new Color(255, 255, 255, 26),
        Math.max(16, width * 0.11),
        new Color(255, 255, 255, 82),
        3,
      );
      this.createSproutMark(back, 0, 0, Math.max(0.34, width / 500));
    }

    return {
      card,
      front,
      back,
      artwork,
      flipped: false,
      matched: false,
    };
  }

  private bindCard(
    state: MemoryCardState,
    levelIndex: number,
    difficulty: DifficultyStars,
    activeArtwork: PuzzleArtwork,
    runId: number,
  ): void {
    state.card.on(Node.EventType.TOUCH_END, () => {
      if (
        this.locked
        || this.completed
        || state.flipped
        || state.matched
        || runId !== this.runId
      ) {
        return;
      }
      this.gameAudio?.play('tap');
      state.flipped = true;
      this.flipCard(state, true, () => {
        if (runId !== this.runId) {
          return;
        }
        this.selected.push(state);
        if (this.selected.length === 2) {
          this.evaluatePair(
            levelIndex,
            difficulty,
            activeArtwork,
            runId,
          );
        }
      });
    });
  }

  private evaluatePair(
    levelIndex: number,
    difficulty: DifficultyStars,
    activeArtwork: PuzzleArtwork,
    runId: number,
  ): void {
    const [first, second] = this.selected;
    this.selected = [];
    if (!first || !second) {
      return;
    }
    this.locked = true;
    if (first.artwork.id === second.artwork.id) {
      const matchedTarget = first.artwork.id === activeArtwork.id;
      first.matched = true;
      second.matched = true;
      if (matchedTarget) {
        this.completed = true;
      }
      this.gameAudio?.play('success');
      void this.customVoice?.playRandom(['correct', 'great'], 1000);
      [first, second].forEach((cardState, index) => {
        tween(cardState.card)
          .delay(index * 0.08)
          .to(
            0.12,
            { scale: new Vec3(1.07, 1.07, 1) },
            { easing: 'quadOut' },
          )
          .to(0.18, { scale: Vec3.ONE }, { easing: 'backOut' })
          .start();
        this.createMatchStar(cardState.card);
      });
      if (matchedTarget) {
        this.refreshPairProgress();
      }
      tween(first.card)
        .delay(0.36)
        .call(() => {
          if (runId !== this.runId) {
            return;
          }
          if (matchedTarget) {
            tween(first.card)
              .delay(0.36)
              .call(() => {
                if (runId === this.runId) {
                  this.showCompletion(
                    activeArtwork,
                    levelIndex,
                    difficulty,
                  );
                }
              })
              .start();
            return;
          }
          this.locked = false;
        })
        .start();
      return;
    }

    this.gameAudio?.play('drop');
    void this.customVoice?.play('retry', 2600);
    tween(first.card)
      .delay(0.72)
      .call(() => {
        if (runId !== this.runId) {
          return;
        }
        let remaining = 2;
        const finish = (): void => {
          remaining--;
          if (remaining === 0 && runId === this.runId) {
            this.locked = false;
          }
        };
        first.flipped = false;
        second.flipped = false;
        this.flipCard(first, false, finish);
        this.flipCard(second, false, finish);
      })
      .start();
  }

  private flipCard(
    state: MemoryCardState,
    showFront: boolean,
    onComplete?: () => void,
  ): void {
    tween(state.card)
      .stop()
      .to(
        0.13,
        { scale: new Vec3(0.05, 1, 1) },
        { easing: 'quadIn' },
      )
      .call(() => {
        state.front.active = showFront;
        state.back.active = !showFront;
      })
      .to(
        0.16,
        { scale: Vec3.ONE },
        { easing: 'backOut' },
      )
      .call(() => onComplete?.())
      .start();
  }

  private createMatchStar(parent: Node): void {
    const star = this.createPuzzleStarMark(parent, 0, 0, 52, true);
    star.setPosition(0, 0, 0);
    star.setScale(new Vec3(0.12, 0.12, 1));
    tween(star)
      .delay(0.08)
      .to(
        0.24,
        { scale: new Vec3(1.18, 1.18, 1) },
        { easing: 'backOut' },
      )
      .to(
        0.18,
        { scale: new Vec3(0.72, 0.72, 1) },
        { easing: 'quadInOut' },
      )
      .start();
  }

  private createPairProgress(parent: Node, pairCount: number): void {
    this.pairDots = [];
    for (let index = 0; index < pairCount; index++) {
      const dot = this.createCircle(
        parent,
        (index - (pairCount - 1) / 2) * 34,
        -323,
        8,
        new Color(215, 137, 173, 255),
      );
      dot.addComponent(UIOpacity).opacity = 80;
      this.pairDots.push(dot);
    }
  }

  // 配对成功的圆点点亮并弹跳，让底部圆点成为真实的对局进度。
  private refreshPairProgress(): void {
    const matchedPairs = this.cards.filter((card) => card.matched).length / 2;
    this.pairDots.forEach((dot, index) => {
      if (!dot.isValid || index >= matchedPairs) {
        return;
      }
      const opacity = dot.getComponent(UIOpacity)!;
      if (opacity.opacity === 255) {
        return;
      }
      opacity.opacity = 255;
      tween(dot)
        .to(0.14, { scale: new Vec3(1.6, 1.6, 1) }, { easing: 'quadOut' })
        .to(0.2, { scale: Vec3.ONE }, { easing: 'backOut' })
        .start();
    });
  }

  private showCompletion(
    artwork: PuzzleArtwork,
    levelIndex: number,
    difficulty: DifficultyStars,
  ): void {
    const allArtworks = getArtworksForMiniGame(
      'memory',
      this.puzzleArtworks as PuzzleArtwork[],
    );
    miniGameProgress.award('memory', artwork.id, difficulty);
    this.gameAudio?.play('celebrate');
    void this.customVoice?.play('complete');
    new GameCompletionModal(this.app).show(this.contentRoot as Node, {
      stars: difficulty,
      onReplay: () => this.show(levelIndex, difficulty),
      onNext: () => this.show(
        getNextLevelIndex(levelIndex, allArtworks.length),
        difficulty,
      ),
      onMenu: () => this.leave(),
    });
  }

  private leave(): void {
    this.runId++;
    this.locked = true;
    this.completed = true;
    this.onExit();
  }
}
