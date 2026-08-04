import {
  Color,
  EventTouch,
  Graphics,
  Mask,
  Node,
  tween,
  Vec3,
} from 'cc';
import type { MatchLevelBase } from './MatchTypes';
import { ToyPageController } from './ToyPageController';

/**
 * 面向 3～6 岁儿童的主题选关页。
 * 默认一屏展示四张大卡片；以后增加内容时自动启用横向滑动。
 */
export abstract class MatchSelectPageBase<T extends MatchLevelBase> extends ToyPageController {
  private scrollOffset = 0;
  private dragging = false;

  protected abstract readonly screenName: string;
  protected abstract readonly levels: readonly T[];
  protected abstract readonly backgroundColor: Color;
  protected abstract readonly accentColor: Color;
  protected abstract readonly headerTitle: string;
  protected abstract readonly headerSubtitle: string;

  protected abstract getStars(levelId: string): number;
  protected abstract openLevel(index: number): void;
  protected abstract drawHeaderIcon(parent: Node): void;
  protected abstract drawLevelThumbnail(parent: Node, level: T, index: number): void;
  protected abstract getLevelTitle(level: T): string;
  protected abstract getLevelSubtitle(level: T): string;

  protected getCardMatColor(_level: T, _index: number): Color {
    return new Color(237, 247, 240, 255);
  }

  protected getCardAccentColor(_level: T, _index: number): Color {
    return this.accentColor;
  }

  showLoading(): void {
    const root = this.resetScreen(`${this.screenName}Loading`);
    this.drawSelectBackground(root);
    this.createBackButton(root, () => this.showHome());
    this.createToyRibbon(root, this.headerTitle, 310, this.accentColor, 420);
    this.createLabel(
      root,
      this.headerSubtitle,
      0,
      250,
      23,
      new Color(101, 84, 72, 220),
      760,
      36,
    );
    this.drawHeaderIcon(root);

    const colors = [
      this.accentColor,
      new Color(255, 191, 65, 255),
      new Color(83, 176, 229, 255),
    ];
    colors.forEach((color, index) => {
      const dot = this.createToyPiece(
        root,
        `LoadingToy${index}`,
        (index - 1) * 78,
        -20,
        40,
        index === 0 ? 'circle' : index === 1 ? 'star' : 'triangle',
        color,
        0,
        false,
      );
      tween(dot)
        .delay(index * 0.12)
        .repeatForever(
          tween<Node>()
            .to(0.38, { position: new Vec3((index - 1) * 78, 12), angle: -8 }, { easing: 'sineOut' })
            .to(0.38, { position: new Vec3((index - 1) * 78, -20), angle: 8 }, { easing: 'sineIn' }),
        )
        .start();
    });
  }

  show(): void {
    const root = this.resetScreen(this.screenName);
    this.drawSelectBackground(root);
    this.createBackButton(root, () => this.showHome());
    this.createToyRibbon(root, this.headerTitle, 310, this.accentColor, 420);
    this.createLabel(
      root,
      this.headerSubtitle,
      0,
      253,
      23,
      new Color(101, 84, 72, 220),
      760,
      38,
    );
    this.drawHeaderIcon(root);
    this.createLevelRail(root);
  }

  private drawSelectBackground(root: Node): void {
    this.drawFullBackground(root, this.backgroundColor);
    this.createCircle(root, this.visibleWidth / 2 - 95, 305, 130, new Color(255, 216, 126, 42));
    this.createCircle(root, -this.visibleWidth / 2 + 80, -315, 180, new Color(131, 214, 180, 38));
    this.createSoftCloud(root, -455, 285, 0.72, 145);
    this.createSoftCloud(root, 475, 210, 0.55, 120);
    for (let index = 0; index < 7; index++) {
      const x = -530 + index * 176;
      const y = index % 2 === 0 ? -325 : -305;
      this.createCircle(root, x, y, 8, new Color(this.accentColor.r, this.accentColor.g, this.accentColor.b, 42));
    }
  }

  private createLevelRail(parent: Node): void {
    const cardWidth = 270;
    const cardHeight = 420;
    const step = 292;
    const contentWidth = cardWidth + Math.max(0, this.levels.length - 1) * step;
    const viewportWidth = Math.min(1210, this.visibleWidth - 110);
    const viewportHeight = 485;
    const overflow = Math.max(0, contentWidth - viewportWidth + 32);
    const maxOffset = overflow / 2;
    this.scrollOffset = this.clamp(this.scrollOffset, -maxOffset, maxOffset);

    const viewport = this.createUiNode('MatchLevelViewport', parent, 0, -38, viewportWidth, viewportHeight);
    const mask = viewport.addComponent(Mask);
    mask.type = Mask.Type.GRAPHICS_STENCIL;
    const graphics = mask.subComp as Graphics;
    graphics.clear();
    graphics.fillColor = Color.WHITE;
    graphics.roundRect(-viewportWidth / 2, -viewportHeight / 2, viewportWidth, viewportHeight, 34);
    graphics.fill();

    const content = this.createUiNode(
      'MatchLevelRail',
      viewport,
      this.scrollOffset,
      0,
      contentWidth,
      viewportHeight,
    );
    this.levels.forEach((level, index) => {
      const x = (index - (this.levels.length - 1) / 2) * step;
      this.createLevelCard(content, level, index, x, 0, cardWidth, cardHeight);
    });

    if (overflow > 0) {
      this.makeRailDraggable(viewport, content, maxOffset, step);
    }
  }

  private createLevelCard(
    parent: Node,
    level: T,
    index: number,
    x: number,
    y: number,
    width: number,
    height: number,
  ): void {
    const accent = this.getCardAccentColor(level, index);
    const holder = this.createUiNode('MatchCardHolder', parent, x, y, width + 24, height + 32);
    this.createPanel(
      holder,
      'MatchCardShadow',
      8,
      -14,
      width,
      height,
      new Color(65, 77, 74, 42),
      34,
    );
    this.createPanel(
      holder,
      'MatchCardSide',
      0,
      -7,
      width,
      height,
      this.darken(accent, 0.78),
      34,
    );
    const card = this.createPanel(
      holder,
      'MatchLevelCard',
      0,
      0,
      width,
      height,
      new Color(255, 255, 249, 255),
      34,
      new Color(255, 255, 255, 225),
      4,
    );
    this.createPanel(
      card,
      'MatchCardMat',
      0,
      63,
      width - 28,
      250,
      this.getCardMatColor(level, index),
      26,
      new Color(accent.r, accent.g, accent.b, 70),
      3,
    );
    this.drawLevelThumbnail(card, level, index);
    this.createPanel(card, 'MatchCardShine', -91, 181, 54, 8, new Color(255, 255, 255, 190), 4);
    this.createLabel(
      card,
      this.getLevelTitle(level),
      0,
      -91,
      29,
      new Color(79, 65, 58, 255),
      width - 34,
      42,
    );
    this.createLabel(
      card,
      this.getLevelSubtitle(level),
      0,
      -128,
      19,
      new Color(125, 108, 96, 225),
      width - 36,
      32,
    );
    this.createStarRow(card, this.getStars(level.id), 0, -174, 34, 48);
    this.makeCardButton(holder, () => this.openLevel(index));

    holder.setScale(new Vec3(0.78, 0.78, 1));
    tween(holder)
      .delay(0.05 + index * 0.08)
      .to(0.34, { scale: Vec3.ONE }, { easing: 'backOut' })
      .start();
  }

  private makeRailDraggable(
    viewport: Node,
    content: Node,
    maxOffset: number,
    step: number,
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
      const delta = this.touchToRoot(event).x - touchStartX;
      if (Math.abs(delta) > 10) this.dragging = true;
      if (!this.dragging) return;
      this.scrollOffset = this.clamp(startOffset + delta, -maxOffset, maxOffset);
      content.setPosition(this.scrollOffset, 0);
    });
    const finish = (): void => {
      if (this.dragging) {
        const target = this.clamp(Math.round(this.scrollOffset / step) * step, -maxOffset, maxOffset);
        this.scrollOffset = target;
        tween(content).to(0.22, { position: new Vec3(target, 0) }, { easing: 'quadOut' }).start();
      }
      this.scheduleOnce(() => { this.dragging = false; }, 0);
    };
    viewport.on(Node.EventType.TOUCH_END, finish);
    viewport.on(Node.EventType.TOUCH_CANCEL, finish);
  }

  private makeCardButton(node: Node, action: () => void): void {
    node.on(Node.EventType.TOUCH_START, () => {
      tween(node).stop().to(0.07, { scale: new Vec3(0.96, 0.96, 1) }).start();
    });
    node.on(Node.EventType.TOUCH_END, () => {
      const restore = tween(node).stop().to(0.1, { scale: Vec3.ONE }, { easing: 'backOut' });
      if (!this.dragging) {
        this.gameAudio?.play('tap');
        restore.call(action);
      }
      restore.start();
    });
    node.on(Node.EventType.TOUCH_CANCEL, () => {
      tween(node).stop().to(0.1, { scale: Vec3.ONE }).start();
    });
  }
}
