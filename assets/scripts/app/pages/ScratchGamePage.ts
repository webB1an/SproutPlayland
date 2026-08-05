import {
  Color,
  EventTouch,
  Node,
  tween,
  UIOpacity,
  Vec3,
} from 'cc';
import { getMiniGameDefinition } from '../GameRegistry';
import { miniGameProgress } from '../MiniGameProgressStore';
import {
  createSeededRandom,
  getLevelDifficulty,
  getNextLevelIndex,
  MiniGameCelebration,
} from '../MiniGameShared';
import type { PuzzleArtwork } from '../../games/puzzle/PuzzleTypes';
import { PageController } from '../PageController';

type ScratchPatch = {
  node: Node;
  x: number;
  y: number;
  revealed: boolean;
};

export class ScratchGamePage extends PageController {
  private runId = 0;
  private completed = false;
  private patches: ScratchPatch[] = [];
  private revealedCount = 0;
  private progressFill: Node | null = null;
  private handHint: Node | null = null;

  constructor(app: any, private readonly onExit: () => void) {
    super(app);
  }

  show(levelIndex: number): void {
    const runId = ++this.runId;
    this.completed = false;
    this.patches = [];
    this.revealedCount = 0;
    this.progressFill = null;
    this.handHint = null;

    const artworks = this.puzzleArtworks as PuzzleArtwork[];
    const artwork = artworks[levelIndex];
    if (!artwork) {
      this.onExit();
      return;
    }
    const definition = getMiniGameDefinition('scratch');
    const root = this.resetScreen('ScratchGame');
    this.drawFullBackground(root, this.toColor(definition.palette.background));
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

    this.createCloudCover(board, levelIndex, boardSize);
    this.createProgress(root);
    this.handHint = this.createHandHint(board);

    const revealAt = (event: EventTouch): void => {
      if (this.completed || runId !== this.runId) {
        return;
      }
      if (this.handHint?.isValid) {
        this.handHint.destroy();
        this.handHint = null;
      }
      const point = this.touchToRoot(event);
      const localX = point.x - board.position.x;
      const localY = point.y - board.position.y;
      this.revealNear(localX, localY, runId, image, artwork, levelIndex);
    };
    board.on(Node.EventType.TOUCH_START, revealAt);
    board.on(Node.EventType.TOUCH_MOVE, revealAt);
  }

  private createCloudCover(parent: Node, levelIndex: number, boardSize: number): void {
    const random = createSeededRandom(3419 + levelIndex * 97);
    const columns = 7;
    const rows = 7;
    const stepX = boardSize / (columns - 0.65);
    const stepY = boardSize / (rows - 0.65);
    const startX = -boardSize / 2 + stepX * 0.34;
    const startY = boardSize / 2 - stepY * 0.34;
    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++) {
        const x = startX + column * stepX + (random() - 0.5) * 18;
        const y = startY - row * stepY + (random() - 0.5) * 18;
        const patch = this.createCloudPatch(
          parent,
          x,
          y,
          0.88 + random() * 0.28,
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
      22,
      new Color(255, 255, 245, 190),
      11,
      new Color(216, 198, 157, 130),
      2,
    );
    this.progressFill = this.createPanel(
      track,
      'ScratchProgressFill',
      -204,
      0,
      8,
      14,
      new Color(245, 179, 71, 255),
      7,
    );
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
  ): void {
    let changed = false;
    const brushRadiusSquared = 82 * 82;
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
    if (progress >= 0.7) {
      this.complete(runId, image, artwork, levelIndex);
    }
  }

  private updateProgress(progress: number): void {
    if (!this.progressFill?.isValid) {
      return;
    }
    const width = Math.max(8, 408 * Math.max(0, Math.min(1, progress)));
    this.resizeFlatPanel(this.progressFill, width, 14, 7);
    this.progressFill.setPosition(-204 + width / 2, 0, 0);
  }

  private complete(
    runId: number,
    image: Node,
    artwork: PuzzleArtwork,
    levelIndex: number,
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
        this.showCompletion(artwork, levelIndex);
      })
      .start();
  }

  private showCompletion(artwork: PuzzleArtwork, levelIndex: number): void {
    const artworks = this.puzzleArtworks as PuzzleArtwork[];
    const stars = getLevelDifficulty(levelIndex, artworks.length);
    miniGameProgress.award('scratch', artwork.id, stars);
    this.gameAudio?.play('celebrate');
    void this.customVoice?.play('complete');
    const parent = this.contentRoot as Node;
    new MiniGameCelebration(this.app).show(parent, {
      title: getMiniGameDefinition('scratch').completionText,
      stars,
      onReplay: () => this.show(levelIndex),
      onNext: () => this.show(getNextLevelIndex(levelIndex, artworks.length)),
      onExit: () => this.leave(),
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
