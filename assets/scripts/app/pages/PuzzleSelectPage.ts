import {
  Color,
  EventTouch,
  Graphics,
  Mask,
  Node,
  tween,
  Vec3,
} from 'cc';
import type { PuzzleArtwork } from '../../games/puzzle/PuzzleTypes';
import { PageController } from '../PageController';

export class PuzzleSelectPage extends PageController {
  private scrollOffset = 0;
  private dragging = false;

  showLoading(): void {
    const root = this.resetScreen('PuzzleSelectLoading');
    this.drawFullBackground(root, new Color(222, 244, 250, 255));
    this.createCircle(root, 620, 320, 145, new Color(255, 221, 160, 66));
    this.createCircle(root, -640, -340, 180, new Color(205, 232, 218, 70));
    this.createBackButton(root, () => this.showHome());
    const colors = [
      new Color(108, 189, 112, 255),
      new Color(250, 181, 77, 255),
      new Color(92, 180, 216, 255),
    ];
    colors.forEach((color, index) => {
      const dot = this.createCircle(root, (index - 1) * 64, -6, 15, color);
      tween(dot)
        .delay(index * 0.12)
        .repeatForever(
          tween<Node>()
            .to(
              0.42,
              {
                position: new Vec3((index - 1) * 64, 14, 0),
                scale: new Vec3(1.14, 1.14, 1),
              },
              { easing: 'sineOut' },
            )
            .to(
              0.42,
              {
                position: new Vec3((index - 1) * 64, -6, 0),
                scale: Vec3.ONE,
              },
              { easing: 'sineIn' },
            ),
        )
        .start();
    });
  }

  show(): void {
    const root = this.resetScreen('PuzzleSelect');
    this.drawFullBackground(root, new Color(222, 244, 250, 255));
    this.createCircle(root, 620, 320, 145, new Color(255, 221, 160, 66));
    this.createCircle(root, -640, -340, 180, new Color(205, 232, 218, 70));
    this.createBackButton(root, () => this.showHome());
    this.createArtworkRail(root);
  }

  private createArtworkRail(parent: Node): void {
    const artworks = this.puzzleArtworks as PuzzleArtwork[];
    if (artworks.length === 0) {
      return;
    }
    const cardWidth = 220;
    const columnStep = 246;
    const rowStep = 282;
    const columns = Math.ceil(artworks.length / 2);
    const contentWidth = cardWidth + (columns - 1) * columnStep;
    const viewportWidth = Math.max(720, this.visibleWidth - 140);
    const viewportHeight = 600;
    const sidePadding = 18;
    const minOffset = Math.min(
      0,
      viewportWidth - contentWidth - sidePadding * 2,
    );
    this.scrollOffset = this.clamp(this.scrollOffset, minOffset, 0);

    const viewport = this.createUiNode(
      'PuzzleArtworkViewport',
      parent,
      0,
      -28,
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
      'PuzzleArtworkRail',
      viewport,
      contentBaseX + this.scrollOffset,
      0,
      contentWidth,
      viewportHeight,
    );
    const topRowY = 122;
    artworks.forEach((artwork, index) => {
      const column = index % columns;
      const row = index < columns ? 0 : 1;
      this.createArtworkCard(
        content,
        artwork,
        index,
        column * columnStep,
        topRowY - row * rowStep,
      );
    });
    this.makeRailDraggable(
      viewport,
      content,
      contentBaseX,
      minOffset,
      columnStep,
    );
  }

  private createArtworkCard(
    parent: Node,
    artwork: PuzzleArtwork,
    index: number,
    x: number,
    y: number,
  ): void {
    const cardWidth = 220;
    const cardHeight = 260;
    const imageSize = 188;
    const imageY = 20;

    this.createPanel(
      parent,
      'PuzzleCardShadow',
      x + 4,
      y - 9,
      cardWidth,
      cardHeight,
      new Color(65, 134, 161, 30),
      24,
    );
    const card = this.createPanel(
      parent,
      'PuzzleArtworkCard',
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
      new Color(221, 241, 240, 255),
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
    this.createStarRow(card, this.getPuzzleStars(artwork.id), 0, -104, 32, 44);
    this.makeCardButton(
      card,
      () => this.showGameDetail('puzzle', index, artwork.title, true),
    );
  }

  private makeRailDraggable(
    viewport: Node,
    content: Node,
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
      tween(node).stop().to(0.07, { scale: new Vec3(0.97, 0.97, 1) }).start();
    });
    node.on(Node.EventType.TOUCH_END, () => {
      const restore = tween(node).stop().to(0.09, { scale: Vec3.ONE });
      if (!this.dragging) {
        this.gameAudio?.play('tap');
        restore.call(action);
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
}
