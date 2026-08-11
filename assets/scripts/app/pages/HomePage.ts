import {
  Color,
  EventTouch,
  Graphics,
  Mask,
  Node,
  sys,
  tween,
  UIOpacity,
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
import { toColor } from '../ui/UiTheme';
import { ArtworkGameSelectPage } from './ArtworkGameSelectPage';

let savedHomeScrollOffset = 0;

const HOME_RAIL_HINT_KEY = 'sprout-playland:home-rail-hint:v1';

const HOME_ICON_FRAMES: Record<GameCardId, string> = {
  puzzle: 'home-icon-puzzle-v2',
  scratch: 'home-icon-scratch-v2',
  shadow: 'home-icon-shadow',
  bubble: 'home-icon-bubble-v2',
  memory: 'home-icon-memory',
};

export class HomePage extends PageController {
  private railDragging = false;

  showPreloading(): void {
    const root = this.resetScreen('HomePreloading');
    this.drawFullBackground(root, new Color(242, 236, 218, 255));
    this.createCircle(root, -615, 300, 160, new Color(224, 239, 198, 105));
    this.createCircle(root, 610, -330, 190, new Color(255, 220, 162, 72));
    this.createCircle(root, 42, 350, 78, new Color(205, 235, 224, 70));

    const mark = this.createUiNode('HomeLoadingMark', root, 0, 22, 190, 190);
    this.createSproutMark(mark, 0, 0, 0.82);
    tween(mark)
      .repeatForever(
        tween<Node>()
          .to(0.72, { scale: new Vec3(1.04, 1.04, 1) }, { easing: 'sineInOut' })
          .to(0.72, { scale: Vec3.ONE }, { easing: 'sineInOut' }),
      )
      .start();

    const dotColors = [
      new Color(111, 169, 126, 255),
      new Color(239, 187, 75, 255),
      new Color(121, 190, 230, 255),
    ];
    dotColors.forEach((color, index) => {
      const dot = this.createCircle(root, (index - 1) * 34, -112, 7, color);
      const opacity = dot.addComponent(UIOpacity);
      opacity.opacity = 105;
      tween(opacity)
        .delay(index * 0.16)
        .repeatForever(
          tween<UIOpacity>()
            .to(0.38, { opacity: 255 }, { easing: 'quadOut' })
            .to(0.48, { opacity: 105 }, { easing: 'quadIn' })
            .delay(0.32),
        )
        .start();
    });
  }

  show(): void {
    const root = this.resetScreen('Home');
    this.drawFullBackground(root, new Color(242, 236, 218, 255));
    this.createCircle(root, -615, 300, 160, new Color(224, 239, 198, 105));
    this.createCircle(root, 610, -330, 190, new Color(255, 220, 162, 72));
    this.createCircle(root, 42, 350, 78, new Color(205, 235, 224, 70));

    this.createHomeIsland(root);
    this.createGameRail(root);
    this.createVoiceSettingsButton(root);
  }

  private createHomeIsland(parent: Node): void {
    this.createCircle(parent, -430, 0, 235, new Color(232, 241, 205, 135));
    this.createCircle(parent, -430, -6, 188, new Color(255, 246, 211, 135));
    if (this.frames.has('home-island')) {
      const islandShadow = this.createPanel(
        parent,
        'HomeIslandShadow',
        -430,
        -126,
        310,
        58,
        new Color(84, 105, 66, 32),
        29,
      );
      const island = this.createImage(parent, 'home-island', -430, 8, 470, 470);
      this.makeHomeIslandInteractive(island, islandShadow);
      return;
    }
    this.createSproutMark(parent, -430, 16, 1.7);
  }

  private makeHomeIslandInteractive(island: Node, shadow: Node): void {
    const islandRest = island.position.clone();
    const shadowRest = shadow.position.clone();
    let dragging = false;
    let touchStartX = 0;
    let touchStartY = 0;

    const startIdleMotion = (): void => {
      if (!island.isValid || !shadow.isValid || dragging) {
        return;
      }
      tween(island)
        .stop()
        .repeatForever(
          tween<Node>()
            .to(
              2.4,
              {
                position: new Vec3(islandRest.x, islandRest.y + 4, islandRest.z),
                scale: new Vec3(1.006, 1.006, 1),
                eulerAngles: new Vec3(0.7, -1, 0.25),
              },
              { easing: 'sineInOut' },
            )
            .to(
              2.4,
              {
                position: new Vec3(islandRest.x, islandRest.y - 2, islandRest.z),
                scale: new Vec3(0.998, 0.998, 1),
                eulerAngles: new Vec3(-0.45, 0.8, -0.2),
              },
              { easing: 'sineInOut' },
            ),
        )
        .start();
      tween(shadow)
        .stop()
        .repeatForever(
          tween<Node>()
            .to(
              2.4,
              {
                position: new Vec3(shadowRest.x, shadowRest.y - 2, shadowRest.z),
                scale: new Vec3(0.96, 0.92, 1),
              },
              { easing: 'sineInOut' },
            )
            .to(
              2.4,
              {
                position: new Vec3(shadowRest.x, shadowRest.y + 1, shadowRest.z),
                scale: new Vec3(1.02, 1, 1),
              },
              { easing: 'sineInOut' },
            ),
        )
        .start();
    };

    island.on(Node.EventType.TOUCH_START, (event: EventTouch) => {
      const location = event.getUILocation();
      dragging = true;
      this.gameAudio?.play('pickup');
      touchStartX = location.x;
      touchStartY = location.y;
      tween(island).stop();
      tween(shadow).stop();
      island.setPosition(islandRest);
      island.setScale(new Vec3(1.024, 1.024, 1));
      island.eulerAngles = Vec3.ZERO;
      shadow.setPosition(shadowRest);
      shadow.setScale(new Vec3(1.05, 0.9, 1));
    });

    island.on(Node.EventType.TOUCH_MOVE, (event: EventTouch) => {
      if (!dragging) {
        return;
      }
      const location = event.getUILocation();
      const deltaX = location.x - touchStartX;
      const deltaY = location.y - touchStartY;
      const offsetX = this.clamp(deltaX * 0.035, -11, 11);
      const offsetY = this.clamp(deltaY * 0.028, -8, 8);
      const tiltX = this.clamp(-deltaY * 0.035, -5, 5);
      const tiltY = this.clamp(deltaX * 0.04, -7, 7);
      const tiltZ = this.clamp(-deltaX * 0.007, -1.2, 1.2);

      island.setPosition(
        islandRest.x + offsetX,
        islandRest.y + offsetY,
        islandRest.z,
      );
      island.eulerAngles = new Vec3(tiltX, tiltY, tiltZ);
      shadow.setPosition(
        shadowRest.x - offsetX * 0.35,
        shadowRest.y - offsetY * 0.2,
        shadowRest.z,
      );
      shadow.setScale(new Vec3(
        1.04 + Math.abs(tiltY) * 0.006,
        0.9 - Math.abs(tiltX) * 0.008,
        1,
      ));
    });

    const releaseIsland = (): void => {
      if (!dragging) {
        return;
      }
      dragging = false;
      this.gameAudio?.play('drop');
      tween(island)
        .stop()
        .to(
          0.52,
          {
            position: islandRest,
            scale: Vec3.ONE,
            eulerAngles: Vec3.ZERO,
          },
          { easing: 'backOut' },
        )
        .call(startIdleMotion)
        .start();
      tween(shadow)
        .stop()
        .to(
          0.4,
          {
            position: shadowRest,
            scale: Vec3.ONE,
          },
          { easing: 'quadOut' },
        )
        .start();
    };

    island.on(Node.EventType.TOUCH_END, releaseIsland);
    island.on(Node.EventType.TOUCH_CANCEL, releaseIsland);
    startIdleMotion();
  }

  private createGameRail(parent: Node): void {
    const cardWidth = 230;
    const cardHeight = 420;
    const cardStep = 260;
    const sidePadding = 12;
    const viewportWidth = Math.max(
      620,
      Math.min(980, this.visibleWidth - 540),
    );
    const viewportHeight = 520;
    const viewportX = this.visibleWidth / 2 - 22 - viewportWidth / 2;
    const contentWidth = cardWidth + (GAME_CARDS.length - 1) * cardStep;
    const minOffset = Math.min(
      0,
      viewportWidth - contentWidth - sidePadding * 2,
    );
    savedHomeScrollOffset = this.clamp(savedHomeScrollOffset, minOffset, 0);

    const viewport = this.createUiNode(
      'HomeGameViewport',
      parent,
      viewportX,
      -4,
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
      'HomeGameRail',
      viewport,
      contentBaseX + savedHomeScrollOffset,
      0,
      contentWidth,
      viewportHeight,
    );

    GAME_CARDS.forEach((definition, index) => {
      this.createGameCard(
        content,
        definition,
        index * cardStep,
        0,
        cardWidth,
        cardHeight,
      );
    });

    const pageCount = Math.round(-minOffset / cardStep) + 1;
    const updatePagination = this.createRailPagination(
      parent,
      viewportX,
      -4 - viewportHeight / 2 - 26,
      pageCount,
      cardStep,
    );
    updatePagination(savedHomeScrollOffset);

    this.makeGameRailDraggable(
      viewport,
      content,
      contentBaseX,
      minOffset,
      cardStep,
      updatePagination,
    );

    // 首次进入时轻轻演示一次"可以滑动"，帮助不识字的孩子发现更多玩法。
    if (
      pageCount > 1
      && savedHomeScrollOffset === 0
      && sys.localStorage.getItem(HOME_RAIL_HINT_KEY) !== '1'
    ) {
      sys.localStorage.setItem(HOME_RAIL_HINT_KEY, '1');
      const nudgeOffset = Math.max(minOffset, -cardStep * 0.32);
      tween(content)
        .delay(0.85)
        .to(
          0.42,
          { position: new Vec3(contentBaseX + nudgeOffset, 0, 0) },
          { easing: 'quadOut' },
        )
        .call(() => updatePagination(nudgeOffset))
        .to(
          0.6,
          { position: new Vec3(contentBaseX, 0, 0) },
          { easing: 'backOut' },
        )
        .call(() => updatePagination(0))
        .start();
    }
  }

  private createRailPagination(
    parent: Node,
    centerX: number,
    y: number,
    pageCount: number,
    cardStep: number,
  ): (offset: number) => void {
    const dots: Node[] = [];
    for (let index = 0; index < pageCount; index++) {
      const dot = this.createCircle(
        parent,
        centerX + (index - (pageCount - 1) / 2) * 26,
        y,
        5,
        new Color(111, 128, 96, 255),
      );
      dot.addComponent(UIOpacity).opacity = 70;
      dots.push(dot);
    }
    return (offset: number) => {
      const activeIndex = this.clamp(
        Math.round(-offset / cardStep),
        0,
        pageCount - 1,
      );
      dots.forEach((dot, index) => {
        const active = index === activeIndex;
        dot.getComponent(UIOpacity)!.opacity = active ? 255 : 70;
        tween(dot)
          .stop()
          .to(
            0.18,
            { scale: new Vec3(active ? 1.5 : 1, active ? 1.5 : 1, 1) },
            { easing: 'quadOut' },
          )
          .start();
      });
    };
  }

  private makeGameRailDraggable(
    viewport: Node,
    content: Node,
    contentBaseX: number,
    minOffset: number,
    cardStep: number,
    onOffsetChange: (offset: number) => void,
  ): void {
    let touchStartX = 0;
    let startOffset = savedHomeScrollOffset;

    viewport.on(Node.EventType.TOUCH_START, (event: EventTouch) => {
      tween(content).stop();
      touchStartX = this.touchToRoot(event).x;
      startOffset = savedHomeScrollOffset;
      this.railDragging = false;
    });

    viewport.on(Node.EventType.TOUCH_MOVE, (event: EventTouch) => {
      const deltaX = this.touchToRoot(event).x - touchStartX;
      if (Math.abs(deltaX) > 10) {
        if (!this.railDragging) {
          sys.localStorage.setItem(HOME_RAIL_HINT_KEY, '1');
        }
        this.railDragging = true;
      }
      if (!this.railDragging) {
        return;
      }
      savedHomeScrollOffset = this.clamp(startOffset + deltaX, minOffset, 0);
      content.setPosition(contentBaseX + savedHomeScrollOffset, 0, 0);
      onOffsetChange(savedHomeScrollOffset);
    });

    const finish = (): void => {
      if (this.railDragging) {
        // 吸附点包含 minOffset，保证滑到末端时最后一张卡能完整展示，
        // 而不是被按 cardStep 取整弹回导致裁掉一截。
        const stops: number[] = [];
        for (let stop = 0; stop > minOffset; stop -= cardStep) {
          stops.push(stop);
        }
        stops.push(minOffset);
        const target = stops.reduce((nearest, stop) =>
          Math.abs(stop - savedHomeScrollOffset)
            < Math.abs(nearest - savedHomeScrollOffset)
            ? stop
            : nearest,
        );
        savedHomeScrollOffset = target;
        tween(content)
          .to(
            0.22,
            { position: new Vec3(contentBaseX + target, 0, 0) },
            { easing: 'quadOut' },
          )
          .call(() => onOffsetChange(target))
          .start();
      }
      this.scheduleOnce(() => {
        this.railDragging = false;
      }, 0);
    };

    viewport.on(Node.EventType.TOUCH_END, finish);
    viewport.on(Node.EventType.TOUCH_CANCEL, finish);
  }

  private createGameCard(
    parent: Node,
    definition: GameCardDefinition,
    x: number,
    y: number,
    width: number,
    height: number,
  ): void {
    const cardColor = toColor(definition.palette.card);
    const depthColor = toColor(definition.palette.depth);
    const accentColor = toColor(definition.palette.accent);
    this.createPanel(
      parent,
      `${definition.id}CardDepth`,
      x + 4,
      y - 10,
      width,
      height,
      new Color(depthColor.r, depthColor.g, depthColor.b, 84),
      44,
    );
    const card = this.createPanel(
      parent,
      `${definition.id}Card`,
      x,
      y,
      width,
      height,
      cardColor,
      44,
      new Color(255, 255, 244, 215),
      4,
    );
    this.createCircle(card, 0, 58, 94, new Color(255, 255, 244, 175));
    this.createGameIcon(card, definition.id, accentColor);
    this.createCircle(
      card,
      0,
      -124,
      31,
      new Color(depthColor.r, depthColor.g, depthColor.b, 255),
    );
    this.createLabel(
      card,
      '›',
      1,
      -120,
      41,
      new Color(255, 255, 244, 255),
      46,
      46,
    );
    this.makeRailCardButton(card, () => this.openGame(definition.id));
  }

  private makeRailCardButton(node: Node, action: () => void): void {
    node.on(Node.EventType.TOUCH_START, () => {
      tween(node)
        .stop()
        .to(0.07, { scale: new Vec3(0.97, 0.97, 1) })
        .start();
    });
    node.on(Node.EventType.TOUCH_END, () => {
      const restore = tween(node).stop().to(0.09, { scale: Vec3.ONE });
      if (!this.railDragging) {
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

  private createGameIcon(parent: Node, gameId: GameCardId, accent: Color): void {
    const artworkFrame = HOME_ICON_FRAMES[gameId];
    if (this.frames.has(artworkFrame)) {
      const frame = this.frames.get(artworkFrame)!;
      const frameWidth = Math.max(1, frame.rect.width);
      const frameHeight = Math.max(1, frame.rect.height);
      const iconMaxSize = gameId === 'scratch' || gameId === 'bubble'
        ? 152
        : 172;
      const iconScale = Math.min(
        iconMaxSize / frameWidth,
        iconMaxSize / frameHeight,
      );

      const clip = this.createUiNode(
        `${gameId}IconClip`,
        parent,
        0,
        58,
        184,
        184,
      );
      const mask = clip.addComponent(Mask);
      mask.type = Mask.Type.GRAPHICS_STENCIL;
      const maskGraphics = mask.subComp as Graphics;
      maskGraphics.clear();
      maskGraphics.fillColor = Color.WHITE;
      maskGraphics.circle(0, 0, 91);
      maskGraphics.fill();

      this.createImage(
        clip,
        artworkFrame,
        0,
        0,
        frameWidth * iconScale,
        frameHeight * iconScale,
      );
      return;
    }

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
          58 + (0.5 - row) * (cellSize + gap),
          cellSize,
          cellSize,
          row === column ? accent : new Color(255, 211, 92, 255),
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
      58,
      116,
      112,
      new Color(126, 205, 220, 255),
      23,
      new Color(255, 255, 246, 220),
      4,
    );
    this.createSunMark(parent, 14, 70, 0.28);
    this.createCircle(parent, -35, 46, 26, new Color(111, 176, 98, 255));
    this.createCircle(parent, -26, 77, 30, new Color(250, 248, 231, 255));
    this.createCircle(parent, 6, 86, 37, new Color(250, 248, 231, 255));
    this.createCircle(parent, 42, 72, 28, new Color(250, 248, 231, 255));
    this.createPanel(
      parent,
      'ScratchCloudBase',
      6,
      58,
      102,
      42,
      new Color(250, 248, 231, 255),
      21,
    );
    const finger = this.createPanel(
      parent,
      'ScratchFinger',
      47,
      24,
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
      70,
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
      48,
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
      { x: -37, y: 46, radius: 38 },
      { x: 24, y: 76, radius: 49 },
      { x: 45, y: 28, radius: 26 },
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
      66,
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
      48,
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
    const position = this.getSafeBottomLeftPosition(66, 66);
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
}
