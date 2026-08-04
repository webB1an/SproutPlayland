import { Color, EventTouch, Graphics, Mask, Node, tween, Vec3 } from 'cc';
import type { MatchLevelBase } from './MatchTypes';
import { ToyPageController } from './ToyPageController';

/** 与拼图关卡列表一致的两行横向滑动卡片列表。 */
export abstract class MatchSelectPageBase<T extends MatchLevelBase> extends ToyPageController {
  private scrollOffset = 0;
  private dragging = false;

  protected abstract readonly screenName: string;
  protected abstract readonly levels: readonly T[];
  protected abstract readonly backgroundColor: Color;
  protected abstract readonly accentColor: Color;
  protected abstract getStars(levelId: string): number;
  protected abstract openLevel(index: number): void;
  protected abstract drawHeaderIcon(parent: Node): void;
  protected abstract drawLevelThumbnail(parent: Node, level: T, index: number): void;

  protected getCardMatColor(_level: T, _index: number): Color {
    return new Color(237, 247, 240, 255);
  }

  showLoading(): void {
    const root = this.resetScreen(`${this.screenName}Loading`);
    this.drawFullBackground(root, this.backgroundColor);
    this.createCircle(root, 620, 320, 145, new Color(255, 221, 160, 58));
    this.createCircle(root, -640, -340, 180, new Color(181, 225, 211, 64));
    this.createBackButton(root, () => this.showHome());
    this.drawHeaderIcon(root);
    const colors = [
      this.accentColor,
      new Color(255, 190, 70, 255),
      new Color(91, 181, 216, 255),
    ];
    colors.forEach((color, index) => {
      const dot = this.createCircle(root, (index - 1) * 64, -12, 15, color);
      tween(dot)
        .delay(index * 0.12)
        .repeatForever(
          tween<Node>()
            .to(0.42, { position: new Vec3((index - 1) * 64, 12), scale: new Vec3(1.14, 1.14, 1) }, { easing: 'sineOut' })
            .to(0.42, { position: new Vec3((index - 1) * 64, -12), scale: Vec3.ONE }, { easing: 'sineIn' }),
        )
        .start();
    });
  }

  show(): void {
    const root = this.resetScreen(this.screenName);
    this.drawFullBackground(root, this.backgroundColor);
    this.createCircle(root, 620, 320, 145, new Color(255, 221, 160, 58));
    this.createCircle(root, -640, -340, 180, new Color(181, 225, 211, 64));
    this.createBackButton(root, () => this.showHome());
    this.drawHeaderIcon(root);
    this.createLevelRail(root);
  }

  private createLevelRail(parent: Node): void {
    const cardWidth = 220;
    const columnStep = 246;
    const rowStep = 282;
    const columns = Math.ceil(this.levels.length / 2);
    const contentWidth = cardWidth + (columns - 1) * columnStep;
    const viewportWidth = Math.max(720, this.visibleWidth - 140);
    const viewportHeight = 600;
    const sidePadding = 18;
    const minOffset = Math.min(0, viewportWidth - contentWidth - sidePadding * 2);
    this.scrollOffset = this.clamp(this.scrollOffset, minOffset, 0);
    const viewport = this.createUiNode('MatchLevelViewport', parent, 0, -28, viewportWidth, viewportHeight);
    const mask = viewport.addComponent(Mask);
    mask.type = Mask.Type.GRAPHICS_STENCIL;
    const graphics = mask.subComp as Graphics;
    graphics.clear();
    graphics.fillColor = Color.WHITE;
    graphics.rect(-viewportWidth / 2, -viewportHeight / 2, viewportWidth, viewportHeight);
    graphics.fill();
    const contentBaseX = -viewportWidth / 2 + sidePadding + cardWidth / 2;
    const content = this.createUiNode(
      'MatchLevelRail',
      viewport,
      contentBaseX + this.scrollOffset,
      0,
      contentWidth,
      viewportHeight,
    );
    const topRowY = 122;
    this.levels.forEach((level, index) => {
      const column = index % columns;
      const row = index < columns ? 0 : 1;
      this.createLevelCard(content, level, index, column * columnStep, topRowY - row * rowStep);
    });
    this.makeRailDraggable(viewport, content, contentBaseX, minOffset, columnStep);
  }

  private createLevelCard(parent: Node, level: T, index: number, x: number, y: number): void {
    this.createPanel(parent, 'MatchCardShadow', x + 6, y - 11, 220, 260, new Color(65, 98, 111, 38), 28);
    const card = this.createPanel(
      parent,
      'MatchLevelCard',
      x,
      y,
      220,
      260,
      new Color(255, 255, 250, 255),
      28,
      new Color(this.accentColor.r, this.accentColor.g, this.accentColor.b, 92),
      4,
    );
    this.createPanel(card, 'MatchCardMat', 0, 22, 196, 192, this.getCardMatColor(level, index), 20);
    this.drawLevelThumbnail(card, level, index);
    this.createPanel(card, 'MatchCardShine', -75, 101, 42, 7, new Color(255, 255, 255, 185), 4);
    this.createStarRow(card, this.getStars(level.id), 0, -104, 32, 44);
    this.makeCardButton(card, () => this.openLevel(index));
  }

  private makeRailDraggable(viewport: Node, content: Node, contentBaseX: number, minOffset: number, step: number): void {
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
      this.scrollOffset = this.clamp(startOffset + delta, minOffset, 0);
      content.setPosition(contentBaseX + this.scrollOffset, 0);
    });
    const finish = (): void => {
      if (this.dragging) {
        const target = this.clamp(Math.round(this.scrollOffset / step) * step, minOffset, 0);
        this.scrollOffset = target;
        tween(content).to(0.22, { position: new Vec3(contentBaseX + target, 0) }, { easing: 'quadOut' }).start();
      }
      this.scheduleOnce(() => { this.dragging = false; }, 0);
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
    node.on(Node.EventType.TOUCH_CANCEL, () => tween(node).stop().to(0.09, { scale: Vec3.ONE }).start());
  }
}
