import {
  Color,
  Node,
  tween,
  Vec3,
} from 'cc';
import {
  GAME_CARDS,
  isMiniGameId,
  type GameCardDefinition,
  type GameCardId,
  type MiniGameId,
} from '../GameRegistry';
import { PageController } from '../PageController';
import { ArtworkGameSelectPage } from './ArtworkGameSelectPage';

export class HomePage extends PageController {
  show(): void {
    const root = this.resetScreen('Home');
    this.drawFullBackground(root, new Color(242, 236, 218, 255));
    this.createCircle(root, -635, 320, 170, new Color(224, 239, 198, 112));
    this.createCircle(root, 635, -338, 190, new Color(255, 220, 162, 78));
    this.createCircle(root, 360, 350, 82, new Color(205, 235, 224, 72));
    this.createHeader(root);
    this.createGameShelf(root);
    this.createVoiceSettingsButton(root);
  }

  private createHeader(parent: Node): void {
    const mark = this.createUiNode('HomeBrand', parent, -496, 292, 220, 112);
    if (this.frames.has('home-island')) {
      const island = this.createImage(mark, 'home-island', -56, -1, 118, 118);
      tween(island)
        .repeatForever(
          tween<Node>()
            .to(
              2.2,
              {
                position: new Vec3(-56, 4, 0),
                eulerAngles: new Vec3(0.5, -0.8, 0.4),
              },
              { easing: 'sineInOut' },
            )
            .to(
              2.2,
              {
                position: new Vec3(-56, -3, 0),
                eulerAngles: new Vec3(-0.4, 0.7, -0.3),
              },
              { easing: 'sineInOut' },
            ),
        )
        .start();
    } else {
      this.createSproutMark(mark, -56, 0, 0.68);
    }
    this.createLabel(
      mark,
      '小芽智趣岛',
      56,
      12,
      36,
      new Color(63, 91, 64, 255),
      250,
      55,
    );
    this.createLabel(
      mark,
      '点一个喜欢的游戏开始吧',
      64,
      -30,
      19,
      new Color(111, 128, 96, 255),
      280,
      36,
    );
  }

  private createGameShelf(parent: Node): void {
    const cardWidth = 210;
    const gap = 30;
    const totalWidth = GAME_CARDS.length * cardWidth + (GAME_CARDS.length - 1) * gap;
    const startX = -totalWidth / 2 + cardWidth / 2;
    this.createPanel(
      parent,
      'ShelfDepth',
      0,
      -250,
      totalWidth + 70,
      38,
      new Color(126, 97, 67, 30),
      19,
    );
    GAME_CARDS.forEach((definition, index) => {
      this.createGameCard(
        parent,
        definition,
        startX + index * (cardWidth + gap),
        -28,
        cardWidth,
      );
    });
  }

  private createGameCard(
    parent: Node,
    definition: GameCardDefinition,
    x: number,
    y: number,
    width: number,
  ): void {
    const height = 392;
    const cardColor = this.toColor(definition.palette.card);
    const depthColor = this.toColor(definition.palette.depth);
    const accentColor = this.toColor(definition.palette.accent);
    this.createPanel(
      parent,
      `${definition.id}CardDepth`,
      x + 4,
      y - 10,
      width,
      height,
      new Color(depthColor.r, depthColor.g, depthColor.b, 84),
      42,
    );
    const card = this.createPanel(
      parent,
      `${definition.id}Card`,
      x,
      y,
      width,
      height,
      cardColor,
      42,
      new Color(255, 255, 244, 215),
      4,
    );
    this.createCircle(card, 0, 70, 82, new Color(255, 255, 244, 175));
    this.createGameIcon(card, definition.id, accentColor);
    this.createLabel(
      card,
      definition.title,
      0,
      -74,
      27,
      new Color(63, 79, 66, 255),
      width - 24,
      42,
    );
    this.createLabel(
      card,
      definition.subtitle,
      0,
      -112,
      17,
      new Color(96, 111, 91, 255),
      width - 20,
      34,
    );
    this.createCircle(card, 0, -158, 29, new Color(depthColor.r, depthColor.g, depthColor.b, 255));
    this.createLabel(
      card,
      '›',
      1,
      -154,
      39,
      new Color(255, 255, 244, 255),
      44,
      44,
    );
    this.makeButton(card, () => this.openGame(definition.id));
  }

  private createGameIcon(parent: Node, gameId: GameCardId, accent: Color): void {
    if (gameId === 'puzzle') {
      this.createPuzzleIcon(parent, accent);
      return;
    }
    if (gameId === 'scratch') {
      this.createScratchIcon(parent, accent);
      return;
    }
    if (gameId === 'shadow') {
      this.createShadowIcon(parent, accent);
      return;
    }
    if (gameId === 'bubble') {
      this.createBubbleIcon(parent, accent);
      return;
    }
    this.createMemoryIcon(parent, accent);
  }

  private createPuzzleIcon(parent: Node, accent: Color): void {
    const cellSize = 52;
    const gap = 7;
    for (let row = 0; row < 2; row++) {
      for (let column = 0; column < 2; column++) {
        const tile = this.createPanel(
          parent,
          'PuzzleIconTile',
          (column - 0.5) * (cellSize + gap),
          70 + (0.5 - row) * (cellSize + gap),
          cellSize,
          cellSize,
          row === column
            ? accent
            : new Color(255, 211, 92, 255),
          13,
          new Color(255, 255, 246, 190),
          3,
        );
        tile.angle = (row * 2 + column - 1.5) * 1.8;
      }
    }
  }

  private createScratchIcon(parent: Node, accent: Color): void {
    this.createPanel(
      parent,
      'ScratchPicture',
      0,
      70,
      116,
      112,
      new Color(126, 205, 220, 255),
      23,
      new Color(255, 255, 246, 220),
      4,
    );
    this.createSunMark(parent, 14, 82, 0.28);
    this.createCircle(parent, -35, 58, 26, new Color(111, 176, 98, 255));
    this.createCircle(parent, -26, 89, 30, new Color(250, 248, 231, 255));
    this.createCircle(parent, 6, 98, 37, new Color(250, 248, 231, 255));
    this.createCircle(parent, 42, 84, 28, new Color(250, 248, 231, 255));
    this.createPanel(parent, 'ScratchCloudBase', 6, 70, 102, 42, new Color(250, 248, 231, 255), 21);
    const finger = this.createPanel(
      parent,
      'ScratchFinger',
      47,
      36,
      18,
      60,
      accent,
      9,
    );
    finger.angle = -28;
  }

  private createShadowIcon(parent: Node, accent: Color): void {
    const back = this.createPanel(
      parent,
      'ShadowSlot',
      -24,
      82,
      84,
      106,
      new Color(86, 80, 99, 128),
      22,
    );
    back.angle = -7;
    const front = this.createPanel(
      parent,
      'ShadowPiece',
      30,
      60,
      84,
      106,
      accent,
      22,
      new Color(255, 255, 246, 205),
      4,
    );
    front.angle = 7;
    this.createCircle(front, 0, 14, 22, new Color(255, 231, 139, 255));
    this.createTriangle(front, 0, -23, 42, 38, new Color(255, 250, 223, 255));
  }

  private createBubbleIcon(parent: Node, accent: Color): void {
    const bubbles = [
      { x: -37, y: 58, radius: 38 },
      { x: 24, y: 88, radius: 49 },
      { x: 45, y: 40, radius: 26 },
    ];
    bubbles.forEach((bubble, index) => {
      this.createCircle(
        parent,
        bubble.x + 4,
        bubble.y - 5,
        bubble.radius,
        new Color(69, 126, 151, 38),
      );
      const body = this.createCircle(
        parent,
        bubble.x,
        bubble.y,
        bubble.radius,
        new Color(accent.r, accent.g, accent.b, 210 - index * 24),
      );
      this.createCircle(
        body,
        -bubble.radius * 0.25,
        bubble.radius * 0.28,
        Math.max(5, bubble.radius * 0.12),
        new Color(255, 255, 255, 185),
      );
    });
  }

  private createMemoryIcon(parent: Node, accent: Color): void {
    const back = this.createPanel(
      parent,
      'MemoryBackCard',
      -29,
      78,
      86,
      118,
      new Color(133, 111, 175, 255),
      20,
      new Color(255, 242, 250, 220),
      4,
    );
    back.angle = -8;
    const front = this.createPanel(
      parent,
      'MemoryFrontCard',
      29,
      60,
      86,
      118,
      accent,
      20,
      new Color(255, 242, 250, 220),
      4,
    );
    front.angle = 8;
    this.createPuzzleStarMark(front, 0, 0, 54, true);
  }

  private openGame(gameId: GameCardId): void {
    if (!isMiniGameId(gameId)) {
      this.showCategory('puzzle');
      return;
    }
    this.openMiniGame(gameId);
  }

  private openMiniGame(gameId: MiniGameId): void {
    const navigationSequence = ++this.navigationSequence;
    this.customVoice?.stopPlayback();
    const page = new ArtworkGameSelectPage(this.app);
    if (this.loadedArtDirectories.has('art/games/puzzle')) {
      page.show(gameId);
      return;
    }
    page.showLoading(gameId);
    void this.loadArtDirectory('art/games/puzzle').then(() => {
      if (navigationSequence === this.navigationSequence) {
        page.show(gameId);
      }
    });
  }

  private createVoiceSettingsButton(parent: Node): void {
    const position = this.getSafeTopRightPosition(66, 66);
    this.createCircle(
      parent,
      position.x,
      position.y - 4,
      35,
      new Color(104, 139, 111, 75),
    ).name = 'VoiceSettingsDepth';
    const button = this.createCircle(
      parent,
      position.x,
      position.y,
      33,
      new Color(111, 169, 126, 255),
    );
    button.name = 'VoiceSettingsButton';
    this.createPanel(
      button,
      'MicrophoneHead',
      0,
      6,
      13,
      25,
      new Color(255, 255, 242, 255),
      7,
    );
    this.createPanel(
      button,
      'MicrophoneStem',
      0,
      -10,
      5,
      11,
      new Color(255, 255, 242, 255),
      3,
    );
    this.createPanel(
      button,
      'MicrophoneBase',
      0,
      -16,
      20,
      5,
      new Color(255, 255, 242, 255),
      3,
    );
    this.createCircle(
      button,
      0,
      -1,
      12,
      new Color(255, 255, 242, 80),
    ).setSiblingIndex(0);
    this.makeButton(button, () => this.showVoiceSettings());
  }

  private toColor(rgb: readonly [number, number, number]): Color {
    return new Color(rgb[0], rgb[1], rgb[2], 255);
  }
}
