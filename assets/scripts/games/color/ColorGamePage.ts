import { Color, Node, Sprite, tween, UIOpacity, Vec3 } from 'cc';
import { MatchGamePageBase } from '../common/MatchGamePageBase';
import type { MatchItemState } from '../common/MatchTypes';
import { getColorGroupCount } from './ColorConfig';
import type { ColorGameFlow } from './ColorGameFlow';

type ForestDeliveryItem = MatchItemState & {
  groupIndex: number;
  trail: Node;
  targetGhost: Node;
};

/** 森林快递：沿彩色小路把果实送给等待的小动物。 */
export class ColorGamePage extends MatchGamePageBase {
  private readonly flow!: ColorGameFlow;

  constructor(app: any, flow: ColorGameFlow) {
    super(app);
    Object.defineProperty(this, 'flow', { value: flow });
  }

  show(): void {
    this.matchCompleted = false;
    const level = this.flow.getCurrentLevel();
    const difficulty = this.flow.getDifficulty();
    const groupCount = getColorGroupCount(difficulty);
    const colors = level.palette.slice(0, groupCount);
    const itemFrame = this.frames.has('forest-apple')
      ? 'forest-apple'
      : `theme-${level.id}-item`;
    const root = this.resetScreen('ColorGame');

    this.drawFullBackground(root, new Color(226, 244, 218, 255));
    const backgroundFrame = this.frames.has('forest-delivery-bg')
      ? 'forest-delivery-bg'
      : (level.id === 'orchard' ? 'color-orchard-bg' : `color-${level.id}`);
    const backdrop = this.createCoverImage(
      root,
      backgroundFrame,
      0,
      0,
      this.visibleWidth,
      this.designHeight,
    );
    backdrop.name = 'BackgroundArt';

    this.createBackButton(root, () => this.flow.showSelect());

    const progressWidth = groupCount * 62 + 34;
    const progress = this.createPanel(
      root,
      'DeliveryProgress',
      0,
      329,
      progressWidth,
      64,
      new Color(255, 250, 226, 242),
      30,
    );
    const progressIcons: Node[] = [];
    colors.forEach((color, index) => {
      const icon = this.createImage(
        progress,
        itemFrame,
        (index - (groupCount - 1) / 2) * 60,
        0,
        46,
        46,
      );
      icon.getComponent(Sprite)!.color = color;
      icon.addComponent(UIOpacity).opacity = 92;
      progressIcons.push(icon);
    });

    const targets = this.getForestHomeTargets(groupCount);
    const starts = this.getFruitStarts(groupCount);
    const order = this.shuffle(Array.from({ length: groupCount }, (_, index) => index));
    const items: ForestDeliveryItem[] = order.map((groupIndex, displayIndex) => {
      const start = starts[displayIndex];
      const target = targets[groupIndex];
      const trail = this.createDeliveryTrail(root, start, target, colors[groupIndex]);
      const targetGlow = this.createCircle(
        root,
        target.x,
        target.y,
        groupCount >= 5 ? 63 : 72,
        new Color(colors[groupIndex].r, colors[groupIndex].g, colors[groupIndex].b, 48),
      );
      targetGlow.name = `ForestHomeGlow${groupIndex}`;
      const targetGhost = this.createImage(
        root,
        itemFrame,
        target.x,
        target.y,
        groupCount >= 5 ? 86 : 98,
        groupCount >= 5 ? 86 : 98,
      );
      targetGhost.getComponent(Sprite)!.color = colors[groupIndex];
      targetGhost.addComponent(UIOpacity).opacity = 84;

      const fruit = this.createImage(root, itemFrame, start.x, start.y, 114, 114);
      fruit.getComponent(Sprite)!.color = colors[groupIndex];
      fruit.name = `ForestFruit${displayIndex}`;
      const restAngle = displayIndex % 2 === 0 ? -7 : 7;
      fruit.angle = restAngle;
      fruit.setScale(new Vec3(0.7, 0.7, 1));
      tween(fruit)
        .delay(0.12 + displayIndex * 0.07)
        .to(0.38, { scale: Vec3.ONE }, { easing: 'backOut' })
        .start();

      return {
        node: fruit,
        start,
        target,
        dropArea: {
          center: target,
          width: groupCount >= 5 ? 150 : 178,
          height: groupCount >= 5 ? 138 : 164,
        },
        snapDistance: 0,
        matchedScale: groupCount >= 5 ? 0.56 : 0.64,
        restAngle,
        matched: false,
        groupIndex,
        trail,
        targetGhost,
      };
    });

    this.createHelpButton(root, () => this.playHint(items));
    this.bindMatchGame(root, items, {
      complete: () => this.flow.complete(),
      replay: () => this.flow.replay(),
      select: () => this.flow.showSelect(),
      next: () => this.flow.next(),
      onPickup: (item) => this.focusTrail(item as ForestDeliveryItem, true),
      onWrong: (item) => this.playWrongFeedback(item as ForestDeliveryItem),
      onMatched: (item) => {
        const forestItem = item as ForestDeliveryItem;
        this.focusTrail(forestItem, false, true);
        const ghostOpacity = forestItem.targetGhost.getComponent(UIOpacity)!;
        tween(ghostOpacity).to(0.18, { opacity: 0 }).start();
        const icon = progressIcons[forestItem.groupIndex];
        icon.getComponent(UIOpacity)!.opacity = 255;
        tween(icon)
          .to(0.14, { scale: new Vec3(1.24, 1.24, 1) })
          .to(0.24, { scale: Vec3.ONE }, { easing: 'backOut' })
          .start();
        tween(forestItem.node)
          .delay(0.18)
          .to(0.14, { scale: new Vec3(0.72, 0.72, 1) })
          .to(0.2, { scale: new Vec3(forestItem.matchedScale!, forestItem.matchedScale!, 1) }, { easing: 'backOut' })
          .start();
      },
    });
  }

  private createDeliveryTrail(parent: Node, start: Vec3, target: Vec3, color: Color): Node {
    const trail = this.createUiNode('ForestDeliveryTrail', parent, 0, 0, this.visibleWidth, this.designHeight);
    trail.addComponent(UIOpacity).opacity = 105;
    const control = new Vec3(
      (start.x + target.x) / 2,
      Math.max(start.y, target.y) + 120,
    );
    for (let index = 1; index <= 11; index++) {
      const t = index / 12;
      const inverse = 1 - t;
      const x = inverse * inverse * start.x + 2 * inverse * t * control.x + t * t * target.x;
      const y = inverse * inverse * start.y + 2 * inverse * t * control.y + t * t * target.y;
      this.createCircle(
        trail,
        x,
        y,
        index % 2 === 0 ? 8 : 6,
        new Color(color.r, color.g, color.b, 235),
      );
    }
    return trail;
  }

  private focusTrail(item: ForestDeliveryItem, active: boolean, hide = false): void {
    const opacity = item.trail.getComponent(UIOpacity)!;
    tween(opacity).stop().to(0.16, { opacity: hide ? 0 : (active ? 245 : 105) }).start();
  }

  private playWrongFeedback(item: ForestDeliveryItem): void {
    this.focusTrail(item, false);
    const ghost = item.targetGhost;
    tween(ghost)
      .stop()
      .to(0.08, { angle: -8, scale: new Vec3(1.08, 1.08, 1) })
      .to(0.08, { angle: 8 })
      .to(0.08, { angle: 0, scale: Vec3.ONE })
      .start();
  }

  private playHint(items: MatchItemState[]): void {
    const item = items.find((candidate) => !candidate.matched) as ForestDeliveryItem | undefined;
    if (!item) return;
    this.focusTrail(item, true);
    const direction = item.target.clone().subtract(item.start).multiplyScalar(0.18);
    tween(item.node)
      .stop()
      .to(0.26, { position: item.start.clone().add(direction), scale: new Vec3(1.1, 1.1, 1) }, { easing: 'quadOut' })
      .to(0.34, { position: item.start, scale: Vec3.ONE }, { easing: 'backOut' })
      .call(() => this.focusTrail(item, false))
      .start();
  }

  private getForestHomeTargets(count: number): Vec3[] {
    if (count === 3) {
      return [new Vec3(250, 132), new Vec3(455, -18), new Vec3(290, -190)];
    }
    if (count === 4) {
      return [
        new Vec3(235, 145),
        new Vec3(465, 125),
        new Vec3(275, -135),
        new Vec3(500, -155),
      ];
    }
    return [
      new Vec3(205, 155),
      new Vec3(405, 150),
      new Vec3(535, -20),
      new Vec3(250, -165),
      new Vec3(455, -185),
    ];
  }

  private getFruitStarts(count: number): Vec3[] {
    const gap = count === 3 ? 170 : count === 4 ? 145 : 128;
    return Array.from({ length: count }, (_, index) => new Vec3(
      -455 + index * gap,
      -225 + (index % 2 === 0 ? 34 : -18),
    ));
  }

  private shuffle<T>(values: T[]): T[] {
    for (let index = values.length - 1; index > 0; index--) {
      const swap = Math.floor(Math.random() * (index + 1));
      [values[index], values[swap]] = [values[swap], values[index]];
    }
    return values;
  }
}
