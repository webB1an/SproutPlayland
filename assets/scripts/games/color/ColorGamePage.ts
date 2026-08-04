import {
  Color,
  Node,
  Sprite,
  tween,
  UIOpacity,
  Vec3,
} from 'cc';
import { MatchGamePageBase } from '../common/MatchGamePageBase';
import type {
  MatchItemState,
  MatchTargetState,
  ToyShape,
} from '../common/MatchTypes';
import { getColorGroupCount } from './ColorConfig';
import type { ColorGameFlow } from './ColorGameFlow';
import type { ColorCompletionEffect, ColorLevelConfig } from './ColorTypes';

type ColorTarget = MatchTargetState & {
  groupIndex: number;
  glow: Node;
  ghost: Node;
  marker: Node;
};

type ColorItem = MatchItemState & {
  groupIndex: number;
  marker: Node;
};

type Point = { x: number; y: number };

/**
 * 颜色唤醒：把彩色玩具送入场景，让灰色目标逐个恢复颜色。
 * 不再使用永久答案路线，每次正确操作都会让主题对象“活起来”。
 */
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
    const markers = level.markerShapes.slice(0, groupCount);
    const root = this.resetScreen('ColorGame');

    this.drawFullBackground(root, level.background);
    if (this.frames.has(level.backgroundFrame)) {
      const backdrop = this.createCoverImage(
        root,
        level.backgroundFrame,
        0,
        0,
        this.visibleWidth,
        this.designHeight,
      );
      backdrop.name = 'ColorThemeBackdrop';
      backdrop.addComponent(UIOpacity).opacity = 205;
    }

    this.createPanel(
      root,
      'ColorStageWash',
      0,
      28,
      Math.min(this.visibleWidth - 116, 1120),
      560,
      new Color(255, 255, 248, 188),
      46,
      new Color(level.accent.r, level.accent.g, level.accent.b, 78),
      4,
    );
    this.createBackButton(root, () => this.flow.showSelect());

    const progressDots = this.createProgressDots(root, colors);
    const targetPositions = this.getTargetPositions(groupCount);
    const itemStarts = this.getItemStarts(groupCount);
    const targetSize = groupCount >= 5 ? 110 : 128;
    const itemSize = groupCount >= 5 ? 94 : 108;
    const ghostOpacity = difficulty === 1 ? 150 : difficulty === 2 ? 106 : 72;

    const targets: ColorTarget[] = colors.map((color, groupIndex) => {
      const position = new Vec3(targetPositions[groupIndex].x, targetPositions[groupIndex].y);
      const targetRoot = this.createUiNode(
        `ColorTarget${groupIndex}`,
        root,
        position.x,
        position.y,
        targetSize + 64,
        targetSize + 64,
      );
      const glow = this.createCircle(
        targetRoot,
        0,
        -3,
        targetSize * 0.62,
        new Color(color.r, color.g, color.b, 36),
      );
      glow.name = `ColorTargetGlow${groupIndex}`;
      const ghost = this.createThemeObject(
        targetRoot,
        `ColorTargetGhost${groupIndex}`,
        level.targetFrame,
        0,
        0,
        targetSize,
        color,
        markers[groupIndex],
        ghostOpacity,
      );
      const marker = this.createMarker(
        targetRoot,
        `ColorTargetMarker${groupIndex}`,
        markers[groupIndex],
        0,
        0,
        34,
        new Color(255, 255, 250, 190),
      );
      marker.addComponent(UIOpacity).opacity = difficulty === 3 ? 118 : 220;
      this.playTargetIdle(targetRoot, level.completionEffect, groupIndex);

      return {
        id: `color-target-${groupIndex}`,
        node: targetRoot,
        position,
        matchKey: `color-${groupIndex}`,
        dropArea: {
          center: position,
          width: targetSize * 1.46,
          height: targetSize * 1.42,
        },
        snapDistance: targetSize * 0.82,
        matchedScale: targetSize / itemSize,
        targetAngle: 0,
        occupied: false,
        groupIndex,
        glow,
        ghost,
        marker,
      };
    });

    this.createPanel(
      root,
      'ColorToyTrayShadow',
      0,
      -287,
      Math.min(this.visibleWidth - 180, 920),
      150,
      new Color(79, 63, 43, 30),
      48,
    );
    this.createPanel(
      root,
      'ColorToyTray',
      0,
      -278,
      Math.min(this.visibleWidth - 180, 920),
      150,
      new Color(255, 247, 220, 246),
      48,
      new Color(219, 178, 108, 180),
      5,
    );

    const order = this.shuffle(Array.from({ length: groupCount }, (_, index) => index));
    const items: ColorItem[] = order.map((groupIndex, displayIndex) => {
      const start = new Vec3(itemStarts[displayIndex].x, itemStarts[displayIndex].y);
      const color = colors[groupIndex];
      const restAngle = displayIndex % 2 === 0 ? -6 : 6;
      const item = this.createThemeObject(
        root,
        `ColorToy${groupIndex}`,
        level.itemFrame,
        start.x,
        start.y,
        itemSize,
        color,
        markers[groupIndex],
        255,
      );
      item.angle = restAngle;
      const marker = this.createMarker(
        item,
        `ColorToyMarker${groupIndex}`,
        markers[groupIndex],
        0,
        0,
        31,
        new Color(255, 255, 250, 205),
      );
      item.setScale(new Vec3(0.55, 0.55, 1));
      tween(item)
        .delay(0.12 + displayIndex * 0.07)
        .to(0.34, { scale: Vec3.ONE }, { easing: 'backOut' })
        .start();
      return {
        id: `color-item-${groupIndex}`,
        node: item,
        start,
        matchKey: `color-${groupIndex}`,
        restAngle,
        restScale: 1,
        matched: false,
        groupIndex,
        marker,
      };
    });

    this.createHelpButton(root, () => this.playHint(items, targets));
    this.bindMatchGame(root, items, targets, {
      complete: () => this.flow.complete(),
      replay: () => this.flow.replay(),
      select: () => this.flow.showSelect(),
      next: () => this.flow.next(),
      onPickup: (item) => this.focusCompatibleTargets(item, targets),
      onTargetFocus: (_item, target) => this.focusHoveredTarget(target as ColorTarget | null, targets),
      onWrong: (item) => this.playWrongFeedback(item as ColorItem, targets),
      onMatched: (item, target) => this.playMatchedFeedback(
        item as ColorItem,
        target as ColorTarget,
        progressDots,
        level,
      ),
      beforeCelebrate: (done) => this.playSceneCompletion(level.completionEffect, items, done),
    });
  }

  private createProgressDots(parent: Node, colors: readonly Color[]): Node[] {
    const panel = this.createPanel(
      parent,
      'ColorProgress',
      0,
      329,
      colors.length * 50 + 42,
      58,
      new Color(255, 252, 232, 232),
      28,
    );
    return colors.map((color, index) => {
      const dot = this.createCircle(
        panel,
        (index - (colors.length - 1) / 2) * 48,
        0,
        14,
        new Color(color.r, color.g, color.b, 255),
      );
      dot.addComponent(UIOpacity).opacity = 70;
      return dot;
    });
  }

  private createThemeObject(
    parent: Node,
    name: string,
    frame: string,
    x: number,
    y: number,
    size: number,
    color: Color,
    fallbackShape: ToyShape,
    opacity: number,
  ): Node {
    if (this.frames.has(frame)) {
      const object = this.createImage(parent, frame, x, y, size, size);
      object.name = name;
      object.getComponent(Sprite)!.color = color;
      object.addComponent(UIOpacity).opacity = opacity;
      return object;
    }
    const object = this.createToyPiece(parent, name, x, y, size * 0.78, fallbackShape, color);
    object.addComponent(UIOpacity).opacity = opacity;
    return object;
  }

  private createMarker(
    parent: Node,
    name: string,
    shape: ToyShape,
    x: number,
    y: number,
    size: number,
    color: Color,
  ): Node {
    return this.createToyShapeLayer(
      parent,
      name,
      x,
      y,
      size,
      shape,
      color,
      new Color(87, 72, 54, 44),
      2,
    );
  }

  private focusCompatibleTargets(item: MatchItemState, targets: ColorTarget[]): void {
    for (const target of targets) {
      if (target.occupied) continue;
      const active = target.matchKey === item.matchKey;
      const opacity = target.glow.getComponent(UIOpacity) ?? target.glow.addComponent(UIOpacity);
      tween(opacity).stop().to(0.12, { opacity: active ? 245 : 82 }).start();
    }
  }

  private focusHoveredTarget(target: ColorTarget | null, targets: ColorTarget[]): void {
    for (const candidate of targets) {
      if (candidate.occupied) continue;
      const active = candidate === target;
      tween(candidate.node)
        .stop()
        .to(0.12, { scale: active ? new Vec3(1.08, 1.08, 1) : Vec3.ONE }, { easing: 'quadOut' })
        .start();
      const opacity = candidate.glow.getComponent(UIOpacity) ?? candidate.glow.addComponent(UIOpacity);
      tween(opacity).stop().to(0.12, { opacity: active ? 255 : 92 }).start();
    }
  }

  private playWrongFeedback(item: ColorItem, targets: ColorTarget[]): void {
    const target = targets.find((candidate) => !candidate.occupied && candidate.matchKey === item.matchKey);
    if (!target) return;
    tween(target.marker)
      .stop()
      .to(0.08, { angle: -10, scale: new Vec3(1.12, 1.12, 1) })
      .to(0.08, { angle: 10 })
      .to(0.1, { angle: 0, scale: Vec3.ONE })
      .start();
  }

  private playMatchedFeedback(
    item: ColorItem,
    target: ColorTarget,
    progressDots: Node[],
    level: ColorLevelConfig,
  ): void {
    target.ghost.getComponent(UIOpacity)!.opacity = 0;
    target.marker.getComponent(UIOpacity)!.opacity = 0;
    const glowOpacity = target.glow.getComponent(UIOpacity) ?? target.glow.addComponent(UIOpacity);
    tween(glowOpacity).to(0.22, { opacity: 0 }).start();

    const dot = progressDots[target.groupIndex];
    dot.getComponent(UIOpacity)!.opacity = 255;
    tween(dot)
      .to(0.12, { scale: new Vec3(1.42, 1.42, 1) })
      .to(0.22, { scale: Vec3.ONE }, { easing: 'backOut' })
      .start();

    this.playObjectAwaken(item.node, level.completionEffect, target.groupIndex);
  }

  private playObjectAwaken(node: Node, effect: ColorCompletionEffect, index: number): void {
    const home = node.position.clone();
    const homeScale = node.scale.clone();
    if (effect === 'float' || effect === 'flutter') {
      tween(node)
        .to(0.22, { position: home.clone().add3f(0, 26, 0), angle: index % 2 === 0 ? -7 : 7 }, { easing: 'sineOut' })
        .to(0.26, { position: home, angle: 0 }, { easing: 'sineIn' })
        .start();
      return;
    }
    if (effect === 'swim' || effect === 'roll') {
      tween(node)
        .to(0.2, { position: home.clone().add3f(24, 0, 0), angle: effect === 'roll' ? 18 : 0 }, { easing: 'quadOut' })
        .to(0.24, { position: home, angle: 0 }, { easing: 'backOut' })
        .start();
      return;
    }
    tween(node)
      .to(0.14, { scale: homeScale.clone().multiplyScalar(1.18) }, { easing: 'quadOut' })
      .to(0.24, { scale: homeScale }, { easing: 'backOut' })
      .start();
  }

  private playSceneCompletion(
    effect: ColorCompletionEffect,
    items: ColorItem[],
    done: () => void,
  ): void {
    items.forEach((item, index) => {
      const node = item.node;
      const origin = node.position.clone();
      const homeScale = node.scale.clone();
      const delay = index * 0.07;
      if (effect === 'float') {
        tween(node).delay(delay).to(0.72, {
          position: origin.clone().add3f((index - 2) * 18, 112 + index * 10, 0),
          angle: index % 2 === 0 ? -12 : 12,
        }, { easing: 'sineOut' }).start();
        return;
      }
      if (effect === 'swim' || effect === 'roll') {
        tween(node).delay(delay).to(0.68, {
          position: origin.clone().add3f(170, (index % 2 === 0 ? 1 : -1) * 24, 0),
          angle: effect === 'roll' ? 350 : 0,
        }, { easing: 'quadInOut' }).start();
        return;
      }
      if (effect === 'flutter' || effect === 'sway') {
        tween(node)
          .delay(delay)
          .to(0.18, { angle: -14, position: origin.clone().add3f(0, 22, 0) })
          .to(0.18, { angle: 14, position: origin.clone().add3f(0, 38, 0) })
          .to(0.2, { angle: 0, position: origin })
          .start();
        return;
      }
      tween(node)
        .delay(delay)
        .to(0.18, { position: origin.clone().add3f(0, 36, 0), scale: homeScale.clone().multiplyScalar(1.16) }, { easing: 'quadOut' })
        .to(0.28, { position: origin, scale: homeScale }, { easing: 'backOut' })
        .start();
    });
    const completionClock = items[0]?.node;
    if (!completionClock) {
      done();
      return;
    }
    tween(completionClock).delay(1.02).call(done).start();
  }

  private playHint(items: ColorItem[], targets: ColorTarget[]): void {
    const item = items.find((candidate) => !candidate.matched);
    if (!item) return;
    const target = targets.find((candidate) => !candidate.occupied && candidate.matchKey === item.matchKey);
    if (!target) return;
    this.focusHoveredTarget(target, targets);
    const start = item.node.position.clone();
    const direction = target.position.clone().subtract(start).multiplyScalar(0.22);
    tween(item.node)
      .stop()
      .to(0.28, { position: start.clone().add(direction), scale: new Vec3(1.08, 1.08, 1) }, { easing: 'quadOut' })
      .to(0.36, { position: start, scale: Vec3.ONE }, { easing: 'backOut' })
      .call(() => this.focusHoveredTarget(null, targets))
      .start();
  }

  private playTargetIdle(node: Node, effect: ColorCompletionEffect, index: number): void {
    if (effect !== 'float' && effect !== 'swim' && effect !== 'flutter' && effect !== 'sway') {
      return;
    }
    const origin = node.position.clone();
    const offset = 5 + index % 3 * 2;
    tween(node)
      .delay(index * 0.08)
      .repeatForever(
        tween<Node>()
          .to(1.05, { position: origin.clone().add3f(0, offset, 0), angle: index % 2 === 0 ? -2 : 2 }, { easing: 'sineInOut' })
          .to(1.05, { position: origin, angle: 0 }, { easing: 'sineInOut' }),
      )
      .start();
  }

  private getTargetPositions(count: number): Point[] {
    if (count === 3) {
      return [{ x: -285, y: 96 }, { x: 0, y: 164 }, { x: 285, y: 96 }];
    }
    if (count === 4) {
      return [
        { x: -330, y: 95 },
        { x: -112, y: 165 },
        { x: 112, y: 165 },
        { x: 330, y: 95 },
      ];
    }
    return [
      { x: -370, y: 90 },
      { x: -188, y: 168 },
      { x: 0, y: 104 },
      { x: 188, y: 168 },
      { x: 370, y: 90 },
    ];
  }

  private getItemStarts(count: number): Point[] {
    const gap = count === 3 ? 210 : count === 4 ? 170 : 142;
    return Array.from({ length: count }, (_, index) => ({
      x: (index - (count - 1) / 2) * gap,
      y: -278 + (index % 2 === 0 ? 4 : -4),
    }));
  }

  private shuffle<T>(values: T[]): T[] {
    for (let index = values.length - 1; index > 0; index--) {
      const swap = Math.floor(Math.random() * (index + 1));
      [values[index], values[swap]] = [values[swap], values[index]];
    }
    return values;
  }
}
