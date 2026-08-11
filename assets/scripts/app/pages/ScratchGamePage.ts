import {
  Color,
  EventTouch,
  Node,
  tween,
  UIOpacity,
  Vec3,
} from 'cc';
import { GameCompletionModal } from '../GameCompletionModal';
import { getMiniGameDefinition } from '../GameRegistry';
import { miniGameProgress } from '../MiniGameProgressStore';
import {
  createSeededRandom,
  type DifficultyStars,
  getNextLevelIndex,
} from '../MiniGameShared';
import type { PuzzleArtwork } from '../../games/puzzle/PuzzleTypes';
import { PageController } from '../PageController';
import { toColor } from '../ui/UiTheme';

type ScratchPatch = {
  node: Node;
  x: number;
  y: number;
  revealed: boolean;
};

type ScratchDifficultySettings = {
  columns: number;
  rows: number;
  brushRadius: number;
  completionRatio: number;
};

const SCRATCH_DIFFICULTY_SETTINGS: Record<
  DifficultyStars,
  ScratchDifficultySettings
> = {
  1: {
    columns: 6,
    rows: 6,
    brushRadius: 104,
    completionRatio: 0.58,
  },
  2: {
    columns: 7,
    rows: 7,
    brushRadius: 84,
    completionRatio: 0.68,
  },
  3: {
    columns: 8,
    rows: 8,
    brushRadius: 70,
    completionRatio: 0.78,
  },
};

export class ScratchGamePage extends PageController {
  private runId = 0;
  private completed = false;
  private patches: ScratchPatch[] = [];
  private revealedCount = 0;
  private progressFill: Node | null = null;
  private progressGlowing = false;
  private handHint: Node | null = null;

  constructor(app: any, private readonly onExit: () => void) {
    super(app);
  }

  show(levelIndex: number, difficulty: DifficultyStars = 1): void {
    const runId = ++this.runId;
    this.completed = false;
    this.patches = [];
    this.revealedCount = 0;
    this.progressFill = null;
    this.progressGlowing = false;
    this.handHint = null;

    const artworks = this.puzzleArtworks as PuzzleArtwork[];
    const artwork = artworks[levelIndex];
    if (!artwork) {
      this.onExit();
      return;
    }
    const definition = getMiniGameDefinition('scratch');
    const accent = toColor(definition.palette.accent);
    const root = this.resetScreen('ScratchGame');
    this.drawFullBackground(root, toColor(definition.palette.background));
    this.createCircle(root, -620, -330, 190, new Color(255, 211, 125, 65));
    this.createCircle(root, 620, 325, 155, new Color(255, 255, 241, 95));
    this.createBackButton(root, () => this.leave());
    this.createLabel(
      root,
      definition.instruction,
      0,
      310,
      34,
      new Color(82, 99, 73, 255),
      620,
      54,
    );
    const boardSize = 520;
    this.createPanel(
      root,
      'ScratchBoardDepth',
      5,
      -16,
      boardSize + 26,
      boardSize + 26,
      new Color(129, 101, 61, 44),
      44,
    );
    const board = this.createUiNode(
      'ScratchBoard',
      root,
      0,
      -6,
      boardSize,
      boardSize,
    );
    this.createPanel(
      board,
      'ScratchBoardMat',
      0,
      0,
      boardSize + 18,
      boardSize + 18,
      new Color(255, 253, 236, 255),
      40,
      new Color(255, 255, 248, 245),
      4,
    );
    const image = this.createCoverImage(
      board,
      artwork.sourceFrame,
      0,
      0,
      boardSize,
      boardSize,
      34,
    );

    this.createCloudCover(board, levelIndex, boardSize, difficulty);
    this.createProgress(root);
    this.handHint = this.createHandHint(board);

    const revealAt = (event: EventTouch): void => {
      if (this.completed || runId !== this.runId) {
        return;
      }
      const point = this.touchToRoot(event);
      const localX = point.x - board.position.x;
      const localY = point.y - board.position.y;
      if (
        Math.abs(localX) > boardSize / 2 + 18
        || Math.abs(localY) > boardSize / 2 + 18
      ) {
        return;
      }
      if (this.handHint?.isValid) {
        this.handHint.destroy();
        this.handHint = null;
      }
      this.revealNear(
        localX,
        localY,
        runId,
        image,
        artwork,
        levelIndex,
        difficulty,
      );
    };
    // 监听页面触摸面，而不是只监听被几十个云朵子节点覆盖的 board。
    // 这样浏览器鼠标模拟、真机滑动和触摸从云朵外缘进入时都能连续擦除。
    root.on(Node.EventType.TOUCH_START, revealAt);
    root.on(Node.EventType.TOUCH_MOVE, revealAt);
  }

  private createCloudCover(
    parent: Node,
    levelIndex: number,
    boardSize: number,
    difficulty: DifficultyStars,
  ): void {
    const settings = SCRATCH_DIFFICULTY_SETTINGS[difficulty];
    const random = createSeededRandom(
      3419 + levelIndex * 97 + difficulty * 1009,
    );
    const stepX = boardSize / (settings.columns - 0.65);
    const stepY = boardSize / (settings.rows - 0.65);
    const startX = -boardSize / 2 + stepX * 0.34;
    const startY = boardSize / 2 - stepY * 0.34;
    for (let row = 0; row < settings.rows; row++) {
      for (let column = 0; column < settings.columns; column++) {
        const x = startX + column * stepX + (random() - 0.5) * 16;
        const y = startY - row * stepY + (random() - 0.5) * 16;
        const patch = this.createCloudPatch(
          parent,
          x,
          y,
          0.84 + random() * 0.25,
          random(),
        );
        this.patches.push({ node: patch, x, y, revealed: false });
      }
    }
  }

  private createCloudPatch(
    parent: Node,
    x: number,
    y: number,
    scale: number,
    variation: number,
  ): Node {
    const node = this.createUiNode('ScratchCloud', parent, x, y, 122, 96);
    node.setScale(new Vec3(scale, scale, 1));
    const warm = variation > 0.72;
    const color = warm
      ? new Color(255, 248, 222, 255)
      : new Color(238, 248, 247, 255);
    const shade = warm
      ? new Color(225, 205, 167, 72)
      : new Color(164, 201, 205, 66);
    this.createCircle(node, 4, -9, 40, shade);
    this.createCircle(node, -32, 0, 31, color);
    this.createCircle(node, 1, 15, 39, color);
    this.createCircle(node, 38, 0, 30, color);
    this.createPanel(node, 'CloudBase', 2, -20, 94, 42, color, 21);
    this.createCircle(node, -18, 19, 8, new Color(255, 255, 255, 108));
    node.addComponent(UIOpacity).opacity = 255;
    return node;
  }

  private createProgress(parent: Node): void {
    const track = this.createPanel(
      parent,
      'ScratchProgressTrack',
      0,
      -326,
      430,
      28,
      new Color(255, 255, 245, 190),
      14,
      new Color(216, 198, 157, 130),
      2,
    );
    this.progressFill = this.createPanel(
      track,
      'ScratchProgressFill',
      -204,
      0,
      8,
      18,
      new Color(245, 179, 71, 255),
      9,
    );
    this.progressFill.addComponent(UIOpacity);
  }

  private createHandHint(parent: Node): Node {
    const hand = this.createUiNode('ScratchHandHint', parent, -145, -112, 80, 100);
    const opacity = hand.addComponent(UIOpacity);
    opacity.opacity = 225;
    this.createCircle(hand, 0, -10, 25, new Color(255, 250, 238, 255));
    this.createPanel(
      hand,
      'HintFinger',
      0,
      25,
      18,
      58,
      new Color(255, 250, 238, 255),
      9,
      new Color(186, 157, 119, 130),
      2,
    );
    this.createCircle(hand, 0, 52, 13, new Color(255, 250, 238, 255));
    tween(hand)
      .repeatForever(
        tween<Node>()
          .to(
            1.15,
            { position: new Vec3(145, 105, 0) },
            { easing: 'sineInOut' },
          )
          .to(
            0.18,
            { scale: new Vec3(0.92, 0.92, 1) },
            { easing: 'quadOut' },
          )
          .to(
            0.22,
            { scale: Vec3.ONE },
            { easing: 'backOut' },
          )
          .to(
            1.05,
            { position: new Vec3(-145, -112, 0) },
            { easing: 'sineInOut' },
          ),
      )
      .start();
    return hand;
  }

  private revealNear(
    x: number,
    y: number,
    runId: number,
    image: Node,
    artwork: PuzzleArtwork,
    levelIndex: number,
    difficulty: DifficultyStars,
  ): void {
    let changed = false;
    const settings = SCRATCH_DIFFICULTY_SETTINGS[difficulty];
    const brushRadiusSquared = settings.brushRadius * settings.brushRadius;
    for (const patch of this.patches) {
      if (patch.revealed) {
        continue;
      }
      const deltaX = x - patch.x;
      const deltaY = y - patch.y;
      if (deltaX * deltaX + deltaY * deltaY > brushRadiusSquared) {
        continue;
      }
      patch.revealed = true;
      this.revealedCount++;
      changed = true;
      const opacity = patch.node.getComponent(UIOpacity)!;
      tween(opacity).stop().to(0.18, { opacity: 0 }).start();
      tween(patch.node)
        .stop()
        .to(
          0.2,
          {
            scale: new Vec3(
              patch.node.scale.x * 0.35,
              patch.node.scale.y * 0.35,
              1,
            ),
          },
          { easing: 'quadIn' },
        )
        .call(() => {
          if (patch.node.isValid) {
            patch.node.destroy();
          }
        })
        .start();
    }
    if (!changed) {
      return;
    }
    this.gameAudio?.play('pickup');
    const progress = this.revealedCount / this.patches.length;
    this.updateProgress(progress);
    if (progress >= settings.completionRatio) {
      this.complete(runId, image, artwork, levelIndex, difficulty);
    }
  }

  private updateProgress(progress: number): void {
    if (!this.progressFill?.isValid) {
      return;
    }
    const clamped = Math.max(0, Math.min(1, progress));
    const width = Math.max(8, 408 * clamped);
    this.resizeFlatPanel(this.progressFill, width, 18, 9);
    this.progressFill.setPosition(-204 + width / 2, 0, 0);
    // 接近完成时让进度条呼吸发光，帮助孩子感知“快完成了”。
    if (clamped >= 0.8 && !this.progressGlowing) {
      this.progressGlowing = true;
      const opacity = this.progressFill.getComponent(UIOpacity)!;
      tween(opacity)
        .repeatForever(
          tween<UIOpacity>()
            .to(0.55, { opacity: 168 }, { easing: 'sineInOut' })
            .to(0.55, { opacity: 255 }, { easing: 'sineInOut' }),
        )
        .start();
    }
  }

  private complete(
    runId: number,
    image: Node,
    artwork: PuzzleArtwork,
    levelIndex: number,
    difficulty: DifficultyStars,
  ): void {
    if (this.completed || runId !== this.runId) {
      return;
    }
    this.completed = true;
    this.updateProgress(1);
    this.gameAudio?.play('success');
    void this.customVoice?.playRandom(['correct', 'great'], 1000);
    this.patches.forEach((patch, index) => {
      if (patch.revealed || !patch.node.isValid) {
        return;
      }
      patch.revealed = true;
      const opacity = patch.node.getComponent(UIOpacity)!;
      tween(opacity)
        .delay(index * 0.008)
        .to(0.2, { opacity: 0 })
        .start();
      tween(patch.node)
        .delay(index * 0.008)
        .to(0.22, { scale: new Vec3(0.2, 0.2, 1) }, { easing: 'quadIn' })
        .call(() => {
          if (patch.node.isValid) {
            patch.node.destroy();
          }
        })
        .start();
    });
    tween(image)
      .delay(0.22)
      .to(0.18, { scale: new Vec3(1.035, 1.035, 1) }, { easing: 'quadOut' })
      .to(0.22, { scale: Vec3.ONE }, { easing: 'backOut' })
      .delay(0.22)
      .call(() => {
        if (runId !== this.runId || !image.isValid) {
          return;
        }
        this.showCompletion(artwork, levelIndex, difficulty);
      })
      .start();
  }

  private showCompletion(
    artwork: PuzzleArtwork,
    levelIndex: number,
    difficulty: DifficultyStars,
  ): void {
    const artworks = this.puzzleArtworks as PuzzleArtwork[];
    miniGameProgress.award('scratch', artwork.id, difficulty);
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
    this.completed = true;
    this.onExit();
  }
}
