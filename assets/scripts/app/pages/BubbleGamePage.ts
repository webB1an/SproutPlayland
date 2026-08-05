import {
  Color,
  Node,
  tween,
  UIOpacity,
  Vec3,
} from 'cc';
import { GameCompletionModal } from '../GameCompletionModal';
import { getMiniGameDefinition } from '../GameRegistry';
import { createMiniGameDifficultyBadge } from '../MiniGameDifficulty';
import { miniGameProgress } from '../MiniGameProgressStore';
import {
  createSeededRandom,
  type DifficultyStars,
  getNextLevelIndex,
  getWrappedArtworks,
  shuffleWithRandom,
} from '../MiniGameShared';
import type { PuzzleArtwork } from '../../games/puzzle/PuzzleTypes';
import { PageController } from '../PageController';

export class BubbleGamePage extends PageController {
  private runId = 0;
  private stageIndex = 0;
  private stageSequence = 0;
  private stageRoot: Node | null = null;
  private stageLocked = false;
  private activeArtwork: PuzzleArtwork | null = null;
  private targetSequence: PuzzleArtwork[] = [];

  constructor(app: any, private readonly onExit: () => void) {
    super(app);
  }

  show(levelIndex: number, difficulty: DifficultyStars = 1): void {
    const runId = ++this.runId;
    this.stageIndex = 0;
    this.stageSequence = 0;
    this.stageLocked = false;
    const artworks = this.puzzleArtworks as PuzzleArtwork[];
    const artwork = artworks[levelIndex];
    if (!artwork) {
      this.onExit();
      return;
    }
    this.activeArtwork = artwork;
    const targetCount = difficulty === 1 ? 2 : 3;
    this.targetSequence = getWrappedArtworks(artworks, levelIndex, targetCount);
    const definition = getMiniGameDefinition('bubble');
    const accent = this.toColor(definition.palette.accent);
    const root = this.resetScreen('BubbleGame');
    this.drawFullBackground(root, this.toColor(definition.palette.background));
    this.createCircle(root, -640, -335, 200, new Color(119, 207, 231, 48));
    this.createCircle(root, 625, 330, 165, new Color(255, 255, 255, 118));
    this.createBackButton(root, () => this.leave());
    this.createLabel(
      root,
      definition.instruction,
      0,
      310,
      34,
      new Color(57, 93, 109, 255),
      720,
      54,
    );
    createMiniGameDifficultyBadge(
      this.app,
      root,
      difficulty,
      this.visibleWidth / 2 - 110,
      310,
      accent,
    );
    this.renderStage(root, levelIndex, difficulty, runId);
  }

  private renderStage(
    root: Node,
    levelIndex: number,
    difficulty: DifficultyStars,
    runId: number,
  ): void {
    if (runId !== this.runId || !root.isValid) {
      return;
    }
    if (this.stageRoot?.isValid) {
      this.stageRoot.destroy();
    }
    const stageSequence = ++this.stageSequence;
    this.stageLocked = false;
    const allArtworks = this.puzzleArtworks as PuzzleArtwork[];
    const target = this.targetSequence[this.stageIndex];
    if (!target) {
      this.finishLevel(levelIndex, difficulty);
      return;
    }
    const bubbleCount = 3 + difficulty;
    const targetIndex = Math.max(
      0,
      allArtworks.findIndex((item) => item.id === target.id),
    );
    const random = createSeededRandom(
      1201 + levelIndex * 83 + this.stageIndex * 419 + difficulty * 977,
    );
    const candidates = shuffleWithRandom(
      getWrappedArtworks(allArtworks, targetIndex, bubbleCount),
      random,
    );

    const stageRoot = this.createUiNode(
      'BubbleStage',
      root,
      0,
      -22,
      this.visibleWidth,
      620,
    );
    this.stageRoot = stageRoot;
    this.createTargetPanel(stageRoot, target);
    this.createStageDots(stageRoot);

    const bubbleSize = difficulty === 1 ? 174 : difficulty === 2 ? 160 : 146;
    const positions = this.getBubblePositions(candidates.length);
    candidates.forEach((artwork, index) => {
      const position = positions[index];
      const bubble = this.createBubble(
        stageRoot,
        artwork,
        position.x,
        position.y,
        bubbleSize,
        index,
      );
      this.bindBubble(
        bubble,
        artwork,
        target,
        position,
        index,
        levelIndex,
        difficulty,
        runId,
        stageSequence,
      );
    });
  }

  private createTargetPanel(parent: Node, artwork: PuzzleArtwork): void {
    this.createPanel(
      parent,
      'BubbleTargetDepth',
      -426,
      -26,
      288,
      382,
      new Color(48, 123, 155, 42),
      46,
    );
    const panel = this.createPanel(
      parent,
      'BubbleTargetPanel',
      -430,
      -16,
      288,
      382,
      new Color(255, 255, 247, 245),
      46,
      new Color(255, 255, 255, 240),
      4,
    );
    this.createLabel(
      panel,
      '找一找',
      0,
      145,
      30,
      new Color(69, 113, 132, 255),
      220,
      45,
    );
    this.createCircle(panel, 0, 16, 116, new Color(204, 239, 249, 255));
    this.createCoverImage(
      panel,
      artwork.thumbnailFrame,
      0,
      16,
      218,
      218,
      109,
    );
    this.createLabel(
      panel,
      artwork.title,
      0,
      -132,
      27,
      new Color(74, 96, 94, 255),
      238,
      42,
    );
  }

  private createStageDots(parent: Node): void {
    const count = this.targetSequence.length;
    for (let index = 0; index < count; index++) {
      const active = index <= this.stageIndex;
      this.createCircle(
        parent,
        -430 + (index - (count - 1) / 2) * 40,
        -244,
        active ? 10 : 8,
        active
          ? new Color(84, 174, 214, 255)
          : new Color(167, 205, 217, 145),
      );
    }
  }

  private getBubblePositions(count: number): Array<{ x: number; y: number }> {
    const positions = [
      { x: -58, y: 148 },
      { x: 190, y: 166 },
      { x: 432, y: 126 },
      { x: 18, y: -116 },
      { x: 278, y: -132 },
      { x: 505, y: -90 },
    ];
    if (count === 4) {
      return [positions[0], positions[1], positions[3], positions[4]];
    }
    if (count === 5) {
      return [
        positions[0],
        positions[1],
        positions[2],
        positions[3],
        positions[4],
      ];
    }
    return positions.slice(0, count);
  }

  private createBubble(
    parent: Node,
    artwork: PuzzleArtwork,
    x: number,
    y: number,
    size: number,
    index: number,
  ): Node {
    const bubble = this.createUiNode(
      `Bubble-${artwork.id}`,
      parent,
      x,
      y,
      size,
      size,
    );
    this.createCircle(
      bubble,
      5,
      -9,
      size / 2,
      new Color(54, 129, 158, 35),
    );
    this.createCircle(
      bubble,
      0,
      0,
      size / 2,
      new Color(225, 249, 255, 225),
    );
    this.createCircle(
      bubble,
      0,
      0,
      size / 2 - 7,
      new Color(255, 255, 255, 235),
    );
    this.createCoverImage(
      bubble,
      artwork.thumbnailFrame,
      0,
      0,
      size - 25,
      size - 25,
      (size - 25) / 2,
    );
    this.createCircle(
      bubble,
      -size * 0.2,
      size * 0.21,
      size * 0.065,
      new Color(255, 255, 255, 190),
    );
    bubble.addComponent(UIOpacity).opacity = 255;
    this.startFloating(bubble, new Vec3(x, y, 0), index);
    return bubble;
  }

  private bindBubble(
    bubble: Node,
    artwork: PuzzleArtwork,
    target: PuzzleArtwork,
    rest: { x: number; y: number },
    index: number,
    levelIndex: number,
    difficulty: DifficultyStars,
    runId: number,
    stageSequence: number,
  ): void {
    bubble.on(Node.EventType.TOUCH_START, () => {
      if (
        this.stageLocked
        || runId !== this.runId
        || stageSequence !== this.stageSequence
      ) {
        return;
      }
      tween(bubble).stop();
      tween(bubble)
        .to(
          0.08,
          { scale: new Vec3(0.94, 0.94, 1) },
          { easing: 'quadOut' },
        )
        .start();
    });
    bubble.on(Node.EventType.TOUCH_CANCEL, () => {
      if (!bubble.isValid || this.stageLocked) {
        return;
      }
      bubble.setScale(Vec3.ONE);
      this.startFloating(bubble, new Vec3(rest.x, rest.y, 0), index);
    });
    bubble.on(Node.EventType.TOUCH_END, () => {
      if (
        this.stageLocked
        || runId !== this.runId
        || stageSequence !== this.stageSequence
        || !bubble.isValid
      ) {
        return;
      }
      if (artwork.id === target.id) {
        this.stageLocked = true;
        this.gameAudio?.play('success');
        void this.customVoice?.playRandom(['correct', 'great'], 1000);
        this.createBubblePop(
          this.stageRoot as Node,
          bubble.position,
          bubble.scale.x * 78,
        );
        const opacity = bubble.getComponent(UIOpacity)!;
        tween(opacity).stop().to(0.22, { opacity: 0 }).start();
        tween(bubble)
          .stop()
          .to(
            0.1,
            { scale: new Vec3(1.18, 1.18, 1) },
            { easing: 'quadOut' },
          )
          .to(
            0.18,
            { scale: new Vec3(0.08, 0.08, 1) },
            { easing: 'quadIn' },
          )
          .delay(0.2)
          .call(() => {
            if (runId !== this.runId || stageSequence !== this.stageSequence) {
              return;
            }
            this.stageIndex++;
            this.renderStage(
              this.contentRoot as Node,
              levelIndex,
              difficulty,
              runId,
            );
          })
          .start();
        return;
      }
      this.gameAudio?.play('drop');
      void this.customVoice?.play('retry', 2600);
      tween(bubble)
        .stop()
        .to(
          0.07,
          { position: new Vec3(rest.x - 12, rest.y, 0), scale: Vec3.ONE },
        )
        .to(0.07, { position: new Vec3(rest.x + 12, rest.y, 0) })
        .to(0.07, { position: new Vec3(rest.x - 8, rest.y, 0) })
        .to(0.09, { position: new Vec3(rest.x, rest.y, 0) })
        .call(() => (
          this.startFloating(bubble, new Vec3(rest.x, rest.y, 0), index)
        ))
        .start();
    });
  }

  private startFloating(bubble: Node, rest: Vec3, index: number): void {
    if (!bubble.isValid) {
      return;
    }
    bubble.setScale(Vec3.ONE);
    tween(bubble)
      .stop()
      .delay(index * 0.04)
      .repeatForever(
        tween<Node>()
          .to(
            1.25 + (index % 3) * 0.12,
            {
              position: new Vec3(
                rest.x + (index % 2 === 0 ? 5 : -5),
                rest.y + 9,
                0,
              ),
              scale: new Vec3(1.018, 1.018, 1),
            },
            { easing: 'sineInOut' },
          )
          .to(
            1.25 + (index % 3) * 0.12,
            {
              position: new Vec3(rest.x, rest.y - 6, 0),
              scale: new Vec3(0.992, 0.992, 1),
            },
            { easing: 'sineInOut' },
          ),
      )
      .start();
  }

  private createBubblePop(parent: Node, position: Vec3, radius: number): void {
    const colors = [
      new Color(102, 201, 230, 230),
      new Color(255, 255, 255, 240),
      new Color(255, 205, 91, 230),
    ];
    for (let index = 0; index < 14; index++) {
      const angle = index * Math.PI * 2 / 14;
      const dot = this.createCircle(
        parent,
        position.x,
        position.y,
        5 + (index % 3) * 2,
        colors[index % colors.length],
      );
      tween(dot)
        .to(
          0.34,
          {
            position: new Vec3(
              position.x + Math.cos(angle) * radius,
              position.y + Math.sin(angle) * radius,
              0,
            ),
            scale: new Vec3(0.12, 0.12, 1),
          },
          { easing: 'quadOut' },
        )
        .call(() => {
          if (dot.isValid) {
            dot.destroy();
          }
        })
        .start();
    }
  }

  private finishLevel(
    levelIndex: number,
    difficulty: DifficultyStars,
  ): void {
    const artworks = this.puzzleArtworks as PuzzleArtwork[];
    const artwork = this.activeArtwork;
    if (!artwork) {
      this.onExit();
      return;
    }
    miniGameProgress.award('bubble', artwork.id, difficulty);
    this.gameAudio?.play('celebrate');
    void this.customVoice?.play('complete');
    new GameCompletionModal(this.app).show(this.contentRoot as Node, {
      stars: difficulty,
      onReplay: () => this.show(levelIndex, difficulty),
      onNext: () => this.show(
        getNextLevelIndex(levelIndex, artworks.length),
        difficulty,
      ),
      onMenu: () => this.leave(),
    });
  }

  private leave(): void {
    this.runId++;
    this.stageSequence++;
    this.stageLocked = true;
    this.onExit();
  }

  private toColor(rgb: readonly [number, number, number]): Color {
    return new Color(rgb[0], rgb[1], rgb[2], 255);
  }
}
