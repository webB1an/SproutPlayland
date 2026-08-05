import {
  Color,
  Node,
  tween,
  Vec3,
} from 'cc';
import { GameCompletionModal } from '../GameCompletionModal';
import { getMiniGameDefinition } from '../GameRegistry';
import { createMiniGameDifficultyBadge } from '../MiniGameDifficulty';
import { miniGameProgress } from '../MiniGameProgressStore';
import {
  createArtworkTile,
  createSeededRandom,
  type DifficultyStars,
  DragMatchController,
  type DragMatchItemState,
  type DragMatchTargetState,
  getNextLevelIndex,
  getWrappedArtworks,
  setArtworkAppearance,
  shuffleWithRandom,
} from '../MiniGameShared';
import type { PuzzleArtwork } from '../../games/puzzle/PuzzleTypes';
import { PageController } from '../PageController';

export class ShadowGamePage extends PageController {
  private runId = 0;
  private completed = false;

  constructor(app: any, private readonly onExit: () => void) {
    super(app);
  }

  show(levelIndex: number, difficulty: DifficultyStars = 1): void {
    const runId = ++this.runId;
    this.completed = false;
    const allArtworks = this.puzzleArtworks as PuzzleArtwork[];
    const activeArtwork = allArtworks[levelIndex];
    if (!activeArtwork) {
      this.onExit();
      return;
    }
    const matchCount = difficulty;
    const artworks = getWrappedArtworks(allArtworks, levelIndex, matchCount);
    const definition = getMiniGameDefinition('shadow');
    const accent = this.toColor(definition.palette.accent);
    const root = this.resetScreen('ShadowGame');
    this.drawFullBackground(root, this.toColor(definition.palette.background));
    this.createCircle(root, -635, -320, 185, new Color(179, 151, 231, 52));
    this.createCircle(root, 625, 325, 150, new Color(255, 255, 244, 100));
    this.createBackButton(root, () => this.leave());
    this.createLabel(
      root,
      definition.instruction,
      0,
      310,
      34,
      new Color(79, 79, 101, 255),
      690,
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

    const size = matchCount === 1 ? 238 : matchCount === 2 ? 216 : 186;
    const targetY = 92;
    const itemY = -195;
    const gap = matchCount === 1 ? 0 : matchCount === 2 ? 235 : 220;
    const targetStates: DragMatchTargetState[] = [];
    const itemStates: DragMatchItemState[] = [];

    artworks.forEach((artwork, index) => {
      const x = (index - (matchCount - 1) / 2) * gap;
      const target = this.createTarget(root, artwork, x, targetY, size);
      targetStates.push({
        node: target,
        position: target.position.clone(),
        matchKey: artwork.id,
        occupied: false,
        snapDistance: size * (
          difficulty === 1 ? 0.82 : difficulty === 2 ? 0.72 : 0.64
        ),
      });
    });

    const random = createSeededRandom(
      773 + levelIndex * 53 + difficulty * 887,
    );
    const shuffled = shuffleWithRandom(artworks, random);
    shuffled.forEach((artwork, index) => {
      const x = (index - (matchCount - 1) / 2) * gap;
      const angle = difficulty === 1
        ? 0
        : (random() - 0.5) * (difficulty === 2 ? 6 : 10);
      const item = createArtworkTile(
        this.app,
        root,
        artwork,
        x,
        itemY,
        size,
        {
          cornerRadius: Math.max(22, size * 0.12),
          borderColor: new Color(255, 255, 248, 245),
          borderWidth: 4,
        },
      );
      item.name = `ShadowItem-${artwork.id}`;
      item.angle = angle;
      itemStates.push({
        node: item,
        start: item.position.clone(),
        matchKey: artwork.id,
        matched: false,
        restAngle: angle,
      });
    });

    this.createDirectionHint(root, targetY, itemY);
    const controller = new DragMatchController({
      touchToRoot: (event) => this.touchToRoot(event),
      isCompleted: () => this.completed || runId !== this.runId,
      onPickup: () => {
        this.gameAudio?.play('pickup');
      },
      onWrong: () => {
        this.gameAudio?.play('drop');
        void this.customVoice?.play('retry', 3000);
      },
      onTargetFocus: (_item, target) => {
        for (const candidate of targetStates) {
          tween(candidate.node)
            .stop()
            .to(
              0.1,
              {
                scale: candidate === target
                  ? new Vec3(1.045, 1.045, 1)
                  : Vec3.ONE,
              },
              { easing: 'quadOut' },
            )
            .start();
        }
      },
      onMatched: (_item, target) => {
        this.gameAudio?.play('success');
        void this.customVoice?.playRandom(['correct', 'great'], 1200);
        tween(target.node)
          .stop()
          .to(0.12, { scale: new Vec3(1.07, 1.07, 1) }, { easing: 'quadOut' })
          .to(0.18, { scale: Vec3.ONE }, { easing: 'backOut' })
          .start();
        this.createMatchedSpark(root, target.position, size);
      },
      onAllMatched: () => {
        if (this.completed || runId !== this.runId) {
          return;
        }
        this.completed = true;
        tween(root)
          .delay(0.42)
          .call(() => {
            if (runId === this.runId && root.isValid) {
              this.showCompletion(activeArtwork, levelIndex, difficulty);
            }
          })
          .start();
      },
    });
    controller.bind(root, itemStates, targetStates);
  }

  private createTarget(
    parent: Node,
    artwork: PuzzleArtwork,
    x: number,
    y: number,
    size: number,
  ): Node {
    const target = this.createUiNode(
      'ShadowTarget',
      parent,
      x,
      y,
      size + 22,
      size + 22,
    );
    this.createPanel(
      target,
      'TargetDepth',
      3,
      -7,
      size + 20,
      size + 20,
      new Color(91, 76, 117, 42),
      Math.max(26, size * 0.14),
    );
    this.createPanel(
      target,
      'TargetSlot',
      0,
      0,
      size + 20,
      size + 20,
      new Color(246, 241, 255, 235),
      Math.max(26, size * 0.14),
      new Color(146, 125, 194, 185),
      4,
    );
    const preview = createArtworkTile(
      this.app,
      target,
      artwork,
      0,
      0,
      size,
      {
        shadow: false,
        cornerRadius: Math.max(20, size * 0.12),
        borderWidth: 0,
        tint: new Color(74, 70, 88, 255),
        opacity: 34,
        backgroundColor: new Color(222, 217, 233, 255),
      },
    );
    setArtworkAppearance(preview, new Color(65, 63, 76, 255), 62);
    this.createCircle(
      target,
      -size * 0.31,
      size * 0.31,
      Math.max(8, size * 0.045),
      new Color(255, 255, 255, 150),
    );
    return target;
  }

  private createDirectionHint(parent: Node, targetY: number, itemY: number): void {
    const centerY = (targetY + itemY) / 2;
    const arrow = this.createUiNode(
      'ShadowDirectionHint',
      parent,
      0,
      centerY,
      60,
      80,
    );
    this.createPanel(
      arrow,
      'ArrowStem',
      0,
      0,
      13,
      50,
      new Color(128, 112, 172, 105),
      7,
    );
    const head = this.createTriangle(
      arrow,
      0,
      31,
      38,
      28,
      new Color(128, 112, 172, 105),
    );
    head.angle = 0;
    tween(arrow)
      .repeatForever(
        tween<Node>()
          .to(
            0.7,
            { position: new Vec3(0, centerY + 9, 0) },
            { easing: 'sineInOut' },
          )
          .to(
            0.7,
            { position: new Vec3(0, centerY - 5, 0) },
            { easing: 'sineInOut' },
          ),
      )
      .start();
  }

  private createMatchedSpark(parent: Node, position: Vec3, size: number): void {
    const colors = [
      new Color(255, 197, 71, 255),
      new Color(255, 139, 177, 255),
      new Color(117, 202, 179, 255),
    ];
    for (let index = 0; index < 9; index++) {
      const angle = index * Math.PI * 2 / 9;
      const spark = this.createCircle(
        parent,
        position.x,
        position.y,
        6,
        colors[index % colors.length],
      );
      tween(spark)
        .to(
          0.32,
          {
            position: new Vec3(
              position.x + Math.cos(angle) * size * 0.62,
              position.y + Math.sin(angle) * size * 0.62,
              0,
            ),
            scale: new Vec3(0.15, 0.15, 1),
          },
          { easing: 'quadOut' },
        )
        .call(() => {
          if (spark.isValid) {
            spark.destroy();
          }
        })
        .start();
    }
  }

  private showCompletion(
    artwork: PuzzleArtwork,
    levelIndex: number,
    difficulty: DifficultyStars,
  ): void {
    const allArtworks = this.puzzleArtworks as PuzzleArtwork[];
    miniGameProgress.award('shadow', artwork.id, difficulty);
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
    this.completed = true;
    this.onExit();
  }

  private toColor(rgb: readonly [number, number, number]): Color {
    return new Color(rgb[0], rgb[1], rgb[2], 255);
  }
}
