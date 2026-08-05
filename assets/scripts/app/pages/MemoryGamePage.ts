import {
  Color,
  Node,
  tween,
  Vec3,
} from 'cc';
import { getMiniGameDefinition } from '../GameRegistry';
import { miniGameProgress } from '../MiniGameProgressStore';
import {
  createSeededRandom,
  getLevelDifficulty,
  getNextLevelIndex,
  getWrappedArtworks,
  MiniGameCelebration,
  shuffleWithRandom,
} from '../MiniGameShared';
import type { PuzzleArtwork } from '../../games/puzzle/PuzzleTypes';
import { PageController } from '../PageController';

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

  constructor(app: any, private readonly onExit: () => void) {
    super(app);
  }

  show(levelIndex: number): void {
    const runId = ++this.runId;
    this.locked = false;
    this.completed = false;
    this.selected = [];
    this.cards = [];
    const allArtworks = this.puzzleArtworks as PuzzleArtwork[];
    const activeArtwork = allArtworks[levelIndex];
    if (!activeArtwork) {
      this.onExit();
      return;
    }
    const difficulty = getLevelDifficulty(levelIndex, allArtworks.length);
    const pairCount = difficulty + 1;
    const artworks = getWrappedArtworks(allArtworks, levelIndex, pairCount);
    const random = createSeededRandom(9059 + levelIndex * 131);
    const pairedArtworks: PuzzleArtwork[] = [];
    for (const artwork of artworks) {
      pairedArtworks.push(artwork, artwork);
    }
    const deck = shuffleWithRandom(
      pairedArtworks,
      random,
    );
    const definition = getMiniGameDefinition('memory');
    const root = this.resetScreen('MemoryGame');
    this.drawFullBackground(root, this.toColor(definition.palette.background));
    this.createCircle(root, -630, -330, 190, new Color(239, 142, 180, 42));
    this.createCircle(root, 625, 325, 160, new Color(255, 255, 244, 100));
    this.createBackButton(root, () => this.leave());
    this.createLabel(
      root,
      definition.instruction,
      0,
      310,
      34,
      new Color(102, 71, 88, 255),
      680,
      54,
    );

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
      this.bindCard(state, levelIndex, activeArtwork, runId);
    });
    this.createPairProgress(root, pairCount);
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
    const card = this.createUiNode(`MemoryCard-${index}`, parent, x, y, width, height);
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
      9,
      width - 16,
      height - 46,
      Math.max(16, width * 0.11),
    );
    this.createLabel(
      front,
      artwork.title,
      0,
      -height / 2 + 24,
      Math.max(18, width * 0.13),
      new Color(75, 91, 82, 255),
      width - 18,
      34,
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
      index % 2 === 0
        ? new Color(224, 135, 174, 255)
        : new Color(198, 137, 211, 255),
      Math.max(20, width * 0.14),
      new Color(255, 240, 249, 245),
      4,
    );
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
          this.evaluatePair(levelIndex, activeArtwork, runId);
        }
      });
    });
  }

  private evaluatePair(
    levelIndex: number,
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
      first.matched = true;
      second.matched = true;
      this.gameAudio?.play('success');
      void this.customVoice?.playRandom(['correct', 'great'], 1000);
      [first, second].forEach((cardState, index) => {
        tween(cardState.card)
          .delay(index * 0.08)
          .to(0.12, { scale: new Vec3(1.07, 1.07, 1) }, { easing: 'quadOut' })
          .to(0.18, { scale: Vec3.ONE }, { easing: 'backOut' })
          .start();
        this.createMatchStar(cardState.card);
      });
      tween(first.card)
        .delay(0.36)
        .call(() => {
          if (runId !== this.runId) {
            return;
          }
          this.locked = false;
          if (this.cards.every((card) => card.matched)) {
            this.completed = true;
            tween(first.card)
              .delay(0.36)
              .call(() => {
                if (runId === this.runId) {
                  this.showCompletion(activeArtwork, levelIndex);
                }
              })
              .start();
          }
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
    const star = this.createPuzzleStarMark(
      parent,
      0,
      0,
      52,
      true,
    );
    star.setPosition(0, 0, 0);
    star.setScale(new Vec3(0.12, 0.12, 1));
    tween(star)
      .delay(0.08)
      .to(0.24, { scale: new Vec3(1.18, 1.18, 1) }, { easing: 'backOut' })
      .to(0.18, { scale: new Vec3(0.72, 0.72, 1) }, { easing: 'quadInOut' })
      .start();
  }

  private createPairProgress(parent: Node, pairCount: number): void {
    for (let index = 0; index < pairCount; index++) {
      this.createCircle(
        parent,
        (index - (pairCount - 1) / 2) * 34,
        -323,
        8,
        new Color(215, 137, 173, 145),
      );
    }
  }

  private showCompletion(artwork: PuzzleArtwork, levelIndex: number): void {
    const allArtworks = this.puzzleArtworks as PuzzleArtwork[];
    const stars = getLevelDifficulty(levelIndex, allArtworks.length);
    miniGameProgress.award('memory', artwork.id, stars);
    this.gameAudio?.play('celebrate');
    void this.customVoice?.play('complete');
    new MiniGameCelebration(this.app).show(this.contentRoot as Node, {
      title: getMiniGameDefinition('memory').completionText,
      stars,
      onReplay: () => this.show(levelIndex),
      onNext: () => this.show(getNextLevelIndex(levelIndex, allArtworks.length)),
      onExit: () => this.leave(),
    });
  }

  private leave(): void {
    this.runId++;
    this.locked = true;
    this.completed = true;
    this.onExit();
  }

  private toColor(rgb: readonly [number, number, number]): Color {
    return new Color(rgb[0], rgb[1], rgb[2], 255);
  }
}
