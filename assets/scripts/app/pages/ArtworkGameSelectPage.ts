import {
  Color,
  EventTouch,
  Graphics,
  Mask,
  Node,
  tween,
  Vec3,
} from 'cc';
import {
  getMiniGameDefinition,
  type MiniGameId,
} from '../GameRegistry';
import {
  getMiniGameDifficultyOption,
  MINI_GAME_DIFFICULTIES,
} from '../MiniGameDifficulty';
import { miniGameProgress } from '../MiniGameProgressStore';
import type { DifficultyStars } from '../MiniGameShared';
import type { PuzzleArtwork } from '../../games/puzzle/PuzzleTypes';
import { PageController } from '../PageController';
import { BubbleGamePage } from './BubbleGamePage';
import { MemoryGamePage } from './MemoryGamePage';
import { ScratchGamePage } from './ScratchGamePage';
import { ShadowGamePage } from './ShadowGamePage';

const savedScrollOffsets: Partial<Record<MiniGameId, number>> = {};
const savedDifficulties: Partial<Record<MiniGameId, DifficultyStars>> = {};

/** 新小游戏共用选关页，关卡素材和难度选择都由统一配置驱动。 */
export class ArtworkGameSelectPage extends PageController {
  private scrollOffset = 0;
  private dragging = false;
  private selectedDifficulty: DifficultyStars = 1;

  showLoading(gameId: MiniGameId): void {
    const definition = getMiniGameDefinition(gameId);
    const root = this.resetScreen(`${gameId}SelectLoading`);
    this.drawFullBackground(root, this.toColor(definition.palette.background));
    this.createDecorations(root, gameId);
    this.createBackButton(root, () => this.showHome());
    const colors = [
      this.toColor(definition.palette.accent),
      new Color(255, 205, 92, 255),
      new Color(255, 255, 244, 255),
    ];
    colors.forEach((color, index) => {
      const dot = this.createCircle(root, (index - 1) * 62, -6, 15, color);
      tween(dot)
        .delay(index * 0.12)
        .repeatForever(
          tween<Node>()
            .to(
              0.42,
              {
                position: new Vec3((index - 1) * 62, 14, 0),
                scale: new Vec3(1.14, 1.14, 1),
              },
              { easing: 'sineOut' },
            )
            .to(
              0.42,
              {
                position: new Vec3((index - 1) * 62, -6, 0),
                scale: Vec3.ONE,
              },
              { easing: 'sineIn' },
            ),
        )
        .start();
    });
  }

  show(gameId: MiniGameId): void {
    const definition = getMiniGameDefinition(gameId);
    this.selectedDifficulty = savedDifficulties[gameId] ?? 1;
    const root = this.resetScreen(`${gameId}Select`);
    this.drawFullBackground(root, this.toColor(definition.palette.background));
    this.createDecorations(root, gameId);
    this.createBackButton(root, () => this.showHome());
    this.createLabel(
      root,
      definition.title,
      -390,
      306,
      42,
      new Color(61, 88, 65, 255),
      360,
      60,
    );
    this.createLabel(
      root,
      definition.selectTitle,
      -390,
      257,
      20,
      new Color(103, 120, 98, 255),
      380,
      38,
    );
    this.createDifficultySelector(root, gameId);
    this.scrollOffset = savedScrollOffsets[gameId] ?? 0;
    this.createArtworkRail(root, gameId);
  }

  private createDifficultySelector(parent: Node, gameId: MiniGameId): void {
    const definition = getMiniGameDefinition(gameId);
    const accent = this.toColor(definition.palette.accent);
    const cardColor = this.toColor(definition.palette.card);
    const startX = 100;
    const step = 175;
    const y = 302;

    MINI_GAME_DIFFICULTIES.forEach((option, index) => {
      const selected = option.value === this.selectedDifficulty;
      const x = startX + index * step;
      this.createPanel(
        parent,
        'DifficultyButtonDepth',
        x + 2,
        y - 5,
        150,
        64,
        new Color(accent.r, accent.g, accent.b, selected ? 90 : 34),
        25,
      );
      const button = this.createPanel(
        parent,
        `Difficulty${option.value}`,
        x,
        y,
        150,
        64,
        selected ? cardColor : new Color(255, 255, 248, 224),
        25,
        selected
          ? new Color(accent.r, accent.g, accent.b, 235)
          : new Color(accent.r, accent.g, accent.b, 92),
        selected ? 4 : 3,
      );
      this.createLabel(
        button,
        option.label,
        -22,
        1,
        22,
        new Color(66, 83, 71, 255),
        76,
        38,
      );
      for (let starIndex = 0; starIndex < 3; starIndex++) {
        this.createCircle(
          button,
          28 + starIndex * 16,
          0,
          5,
          starIndex < option.value
            ? accent
            : new Color(accent.r, accent.g, accent.b, 48),
        );
      }
      this.makeButton(button, () => {
        if (this.selectedDifficulty === option.value) {
          return;
        }
        savedDifficulties[gameId] = option.value;
        this.selectedDifficulty = option.value;
        this.show(gameId);
      });
    });
  }

  private createDecorations(parent: Node, gameId: MiniGameId): void {
    const definition = getMiniGameDefinition(gameId);
    this.createCircle(
      parent,
      620,
      320,
      145,
      new Color(
        definition.palette.card[0],
        definition.palette.card[1],
        definition.palette.card[2],
        82,
      ),
    );
    this.createCircle(
      parent,
      -640,
      -340,
      180,
      new Color(
        definition.palette.accent[0],
        definition.palette.accent[1],
        definition.palette.accent[2],
        48,
      ),
    );
  }

  private createArtworkRail(parent: Node, gameId: MiniGameId): void {
    const artworks = this.puzzleArtworks as PuzzleArtwork[];
    if (artworks.length === 0) {
      return;
    }
    const cardWidth = 220;
    const columnStep = 246;
    const rowStep = 272;
    const columns = Math.ceil(artworks.length / 2);
    const contentWidth = cardWidth + (columns - 1) * columnStep;
    const viewportWidth = Math.max(720, this.visibleWidth - 140);
    const viewportHeight = 555;
    const sidePadding = 18;
    const minOffset = Math.min(
      0,
      viewportWidth - contentWidth - sidePadding * 2,
    );
    this.scrollOffset = this.clamp(this.scrollOffset, minOffset, 0);

    const viewport = this.createUiNode(
      'ArtworkGameViewport',
      parent,
      0,
      -50,
      viewportWidth,
      viewportHeight,
    );
    const mask = viewport.addComponent(Mask);
    mask.type = Mask.Type.GRAPHICS_STENCIL;
    const maskGraphics = mask.subComp as Graphics;
    maskGraphics.clear();
    maskGraphics.fillColor = Color.WHITE;
    maskGraphics.rect(
      -viewportWidth / 2,
      -viewportHeight / 2,
      viewportWidth,
      viewportHeight,
    );
    maskGraphics.fill();

    const contentBaseX = -viewportWidth / 2 + sidePadding + cardWidth / 2;
    const content = this.createUiNode(
      'ArtworkGameRail',
      viewport,
      contentBaseX + this.scrollOffset,
      0,
      contentWidth,
      viewportHeight,
    );
    const topRowY = 115;
    artworks.forEach((artwork, index) => {
      const column = index % columns;
      const row = index < columns ? 0 : 1;
      this.createArtworkCard(
        content,
        gameId,
        artwork,
        index,
        column * columnStep,
        topRowY - row * rowStep,
      );
    });
    this.makeRailDraggable(
      viewport,
      content,
      gameId,
      contentBaseX,
      minOffset,
      columnStep,
    );
  }

  private createArtworkCard(
    parent: Node,
    gameId: MiniGameId,
    artwork: PuzzleArtwork,
    index: number,
    x: number,
    y: number,
  ): void {
    const definition = getMiniGameDefinition(gameId);
    const cardWidth = 220;
    const cardHeight = 252;
    const imageSize = 182;
    const imageY = 20;

    this.createPanel(
      parent,
      'MiniGameCardShadow',
      x + 4,
      y - 9,
      cardWidth,
      cardHeight,
      new Color(
        definition.palette.depth[0],
        definition.palette.depth[1],
        definition.palette.depth[2],
        42,
      ),
      24,
    );
    const card = this.createPanel(
      parent,
      'MiniGameArtworkCard',
      x,
      y,
      cardWidth,
      cardHeight,
      new Color(255, 255, 250, 255),
      24,
      new Color(255, 255, 255, 235),
      3,
    );
    this.createPanel(
      card,
      'ArtworkMat',
      0,
      imageY,
      imageSize + 8,
      imageSize + 8,
      this.toColor(definition.palette.card),
      18,
    );
    if (this.frames.has(artwork.thumbnailFrame)) {
      this.createCoverImage(
        card,
        artwork.thumbnailFrame,
        0,
        imageY,
        imageSize,
        imageSize,
        16,
      );
    } else {
      this.createPanel(
        card,
        'ArtworkFallback',
        0,
        imageY,
        imageSize,
        imageSize,
        artwork.fallbackColor,
        16,
      );
    }
    this.createDifficultyMark(card, this.selectedDifficulty, -68, 80);
    this.createModeMark(card, gameId, 68, 80);
    const earnedStars = miniGameProgress.getStars(gameId, artwork.id);
    this.createStarRow(card, earnedStars, 0, -100, 30, 42);
    this.makeCardButton(card, () => this.launch(gameId, index));
  }

  private createDifficultyMark(
    parent: Node,
    difficulty: DifficultyStars,
    x: number,
    y: number,
  ): void {
    const definition = getMiniGameDifficultyOption(difficulty);
    const badge = this.createCircle(
      parent,
      x,
      y,
      28,
      new Color(255, 255, 248, 235),
    );
    this.createLabel(
      badge,
      definition.shortLabel,
      0,
      1,
      22,
      new Color(83, 100, 86, 255),
      38,
      34,
    );
  }

  private createModeMark(
    parent: Node,
    gameId: MiniGameId,
    x: number,
    y: number,
  ): void {
    const definition = getMiniGameDefinition(gameId);
    const badge = this.createCircle(
      parent,
      x,
      y,
      29,
      new Color(255, 255, 248, 235),
    );
    const accent = this.toColor(definition.palette.accent);
    if (gameId === 'scratch') {
      this.createCircle(badge, -8, 2, 10, accent);
      this.createCircle(badge, 2, 7, 13, accent);
      this.createCircle(badge, 12, 1, 9, accent);
      this.createPanel(badge, 'CloudBase', 2, -4, 36, 12, accent, 6);
      return;
    }
    if (gameId === 'shadow') {
      this.createPanel(
        badge,
        'ShadowBack',
        -6,
        4,
        24,
        28,
        new Color(87, 83, 103, 150),
        7,
      );
      this.createPanel(badge, 'ShadowFront', 7, -5, 24, 28, accent, 7);
      return;
    }
    if (gameId === 'bubble') {
      this.createCircle(badge, -9, -5, 8, accent);
      this.createCircle(
        badge,
        8,
        7,
        11,
        new Color(accent.r, accent.g, accent.b, 210),
      );
      this.createCircle(
        badge,
        13,
        -11,
        6,
        new Color(accent.r, accent.g, accent.b, 170),
      );
      return;
    }
    this.createPanel(
      badge,
      'MemoryBack',
      -7,
      4,
      22,
      28,
      new Color(108, 98, 139, 175),
      6,
    );
    this.createPanel(badge, 'MemoryFront', 7, -5, 22, 28, accent, 6);
    this.createCircle(badge, 8, -4, 4, new Color(255, 247, 211, 255));
  }

  private makeRailDraggable(
    viewport: Node,
    content: Node,
    gameId: MiniGameId,
    contentBaseX: number,
    minOffset: number,
    columnStep: number,
  ): void {
    let touchStartX = 0;
    let startOffset = this.scrollOffset;
    viewport.on(Node.EventType.TOUCH_START, (event: EventTouch) => {
      tween(content).stop();
      touchStartX = this.touchToRoot(event).x;
      startOffset = this.scrollOffset;
      this.dragging = false;
    });
    viewport.on(Node.EventType.TOUCH_MOVE, (event: EventTouch) => {
      const deltaX = this.touchToRoot(event).x - touchStartX;
      if (Math.abs(deltaX) > 10) {
        this.dragging = true;
      }
      if (!this.dragging) {
        return;
      }
      this.scrollOffset = this.clamp(startOffset + deltaX, minOffset, 0);
      savedScrollOffsets[gameId] = this.scrollOffset;
      content.setPosition(contentBaseX + this.scrollOffset, 0, 0);
    });
    const finish = (): void => {
      if (this.dragging) {
        const target = this.clamp(
          Math.round(this.scrollOffset / columnStep) * columnStep,
          minOffset,
          0,
        );
        this.scrollOffset = target;
        savedScrollOffsets[gameId] = target;
        tween(content)
          .to(
            0.22,
            { position: new Vec3(contentBaseX + target, 0, 0) },
            { easing: 'quadOut' },
          )
          .start();
      }
      this.scheduleOnce(() => {
        this.dragging = false;
      }, 0);
    };
    viewport.on(Node.EventType.TOUCH_END, finish);
    viewport.on(Node.EventType.TOUCH_CANCEL, finish);
  }

  private makeCardButton(node: Node, action: () => void): void {
    node.on(Node.EventType.TOUCH_START, () => {
      tween(node)
        .stop()
        .to(0.07, { scale: new Vec3(0.97, 0.97, 1) })
        .start();
    });
    node.on(Node.EventType.TOUCH_END, () => {
      const restore = tween(node).stop().to(0.09, { scale: Vec3.ONE });
      if (!this.dragging) {
        restore.call(() => {
          this.gameAudio?.play('tap');
          action();
        });
      }
      restore.start();
    });
    node.on(Node.EventType.TOUCH_CANCEL, () => {
      tween(node).stop().to(0.09, { scale: Vec3.ONE }).start();
    });
  }

  private createStarRow(
    parent: Node,
    earnedStars: number,
    x: number,
    y: number,
    size: number,
    gap: number,
  ): void {
    for (let index = 0; index < 3; index++) {
      this.createPuzzleStarMark(
        parent,
        x + (index - 1) * gap,
        y,
        size,
        index < earnedStars,
      );
    }
  }

  private launch(gameId: MiniGameId, levelIndex: number): void {
    const difficulty = this.selectedDifficulty;
    savedDifficulties[gameId] = difficulty;
    this.navigationSequence++;
    this.customVoice?.stopPlayback();
    const returnToSelect = (): void => {
      this.navigationSequence++;
      this.customVoice?.stopPlayback();
      new ArtworkGameSelectPage(this.app).show(gameId);
    };
    if (gameId === 'scratch') {
      new ScratchGamePage(this.app, returnToSelect).show(levelIndex, difficulty);
      return;
    }
    if (gameId === 'shadow') {
      new ShadowGamePage(this.app, returnToSelect).show(levelIndex, difficulty);
      return;
    }
    if (gameId === 'bubble') {
      new BubbleGamePage(this.app, returnToSelect).show(levelIndex, difficulty);
      return;
    }
    new MemoryGamePage(this.app, returnToSelect).show(levelIndex, difficulty);
  }

  private toColor(rgb: readonly [number, number, number]): Color {
    return new Color(rgb[0], rgb[1], rgb[2], 255);
  }
}
