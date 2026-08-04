import {
  Color,
  Node,
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
import { getShapeCount, getShapeSceneLayout } from './ShapeConfig';
import type { ShapeGameFlow } from './ShapeGameFlow';
import type {
  ShapeCompletionEffect,
  ShapeLevelConfig,
} from './ShapeTypes';

type ShapeTarget = MatchTargetState & {
  progressIndex: number;
  hint: Node;
  glow: Node;
};

type ShapeItem = MatchItemState & {
  shape: ToyShape;
  progressIndex: number;
};

type Point = { x: number; y: number };

/**
 * 积木造物：使用真正的圆形、方形、三角形等积木搭出完整作品。
 * 关卡数据来自 ShapeConfig，不再固定为同一只乌龟。
 */
export class ShapeGamePage extends MatchGamePageBase {
  private readonly flow!: ShapeGameFlow;

  constructor(app: any, flow: ShapeGameFlow) {
    super(app);
    Object.defineProperty(this, 'flow', { value: flow });
  }

  show(): void {
    this.matchCompleted = false;
    const level = this.flow.getCurrentLevel();
    const difficulty = this.flow.getDifficulty();
    const count = getShapeCount(difficulty);
    const placements = getShapeSceneLayout(level, count);
    const shapes = level.shapes.slice(0, count);
    const colors = level.colors.slice(0, count);
    const root = this.resetScreen('ShapeGame');

    this.drawFullBackground(root, level.background);
    if (this.frames.has('shape-workshop-bg')) {
      const backdrop = this.createCoverImage(
        root,
        'shape-workshop-bg',
        0,
        0,
        this.visibleWidth,
        this.designHeight,
      );
      backdrop.name = 'ShapeWorkshopBackdrop';
      backdrop.addComponent(UIOpacity).opacity = 218;
    }

    this.createPanel(
      root,
      'ShapeBuildBoardShadow',
      0,
      38,
      Math.min(this.visibleWidth - 130, 1000),
      548,
      new Color(70, 80, 73, 28),
      48,
    );
    this.createPanel(
      root,
      'ShapeBuildBoard',
      0,
      49,
      Math.min(this.visibleWidth - 130, 1000),
      548,
      new Color(255, 253, 237, 236),
      48,
      new Color(level.accent.r, level.accent.g, level.accent.b, 88),
      5,
    );

    const referenceOpacity = difficulty === 1 ? 64 : difficulty === 2 ? 28 : 0;
    if (referenceOpacity > 0 && this.frames.has(level.referenceFrame)) {
      const reference = this.createCoverImage(root, level.referenceFrame, 0, 52, 410, 410, 34);
      reference.name = 'ShapeReferenceArtwork';
      reference.addComponent(UIOpacity).opacity = referenceOpacity;
    }

    this.createBackButton(root, () => this.flow.showSelect());
    const progressDots = this.createProgressDots(root, shapes, colors);

    const boardScale = count === 4 ? 1.45 : count === 6 ? 1.28 : 1.08;
    const shapeSize = 96;
    const targetOpacity = difficulty === 1 ? 152 : difficulty === 2 ? 104 : 68;

    const targets: ShapeTarget[] = placements.map((placement, index) => {
      const position = new Vec3(
        placement.x * boardScale,
        placement.y * boardScale + 42,
      );
      const finalScale = Math.max(0.15, placement.scale * boardScale * 0.92);
      const visualSize = shapeSize * finalScale;
      const targetRoot = this.createUiNode(
        `ShapeTarget${index}`,
        root,
        position.x,
        position.y,
        Math.max(70, visualSize + 44),
        Math.max(70, visualSize + 44),
      );
      const glow = this.createCircle(
        targetRoot,
        0,
        -2,
        Math.max(34, visualSize * 0.58),
        new Color(colors[index].r, colors[index].g, colors[index].b, 28),
      );
      glow.name = `ShapeTargetGlow${index}`;
      const hint = this.createToyShapeLayer(
        targetRoot,
        `ShapeTargetHint${index}`,
        0,
        0,
        Math.max(26, visualSize),
        shapes[index],
        new Color(colors[index].r, colors[index].g, colors[index].b, 255),
        new Color(89, 85, 73, difficulty === 3 ? 145 : 88),
        difficulty === 3 ? 5 : 3,
      );
      hint.angle = placement.angle ?? 0;
      hint.addComponent(UIOpacity).opacity = targetOpacity;
      this.playSlotIdle(hint, level.completionEffect, index);
      return {
        id: `shape-target-${index}`,
        node: targetRoot,
        position,
        matchKey: `shape-${shapes[index]}`,
        dropArea: {
          center: position,
          width: Math.max(90, visualSize + (difficulty === 1 ? 88 : difficulty === 2 ? 62 : 42)),
          height: Math.max(90, visualSize + (difficulty === 1 ? 88 : difficulty === 2 ? 62 : 42)),
        },
        snapDistance: Math.max(74, visualSize * 0.86),
        matchedScale: finalScale,
        matchedSiblingIndex: undefined,
        targetAngle: placement.angle ?? 0,
        occupied: false,
        progressIndex: index,
        hint,
        glow,
      };
    });

    const pieceLayerBase = root.children.length;
    targets.forEach((target, index) => {
      target.matchedSiblingIndex = pieceLayerBase + index;
    });

    this.createPanel(
      root,
      'ShapeToyTrayShadow',
      0,
      -290,
      Math.min(this.visibleWidth - 150, 1050),
      150,
      new Color(76, 57, 38, 30),
      48,
    );
    this.createPanel(
      root,
      'ShapeToyTray',
      0,
      -280,
      Math.min(this.visibleWidth - 150, 1050),
      150,
      new Color(255, 246, 218, 247),
      48,
      new Color(216, 171, 104, 186),
      5,
    );

    const starts = this.getItemStarts(count);
    const order = this.shuffle(Array.from({ length: count }, (_, index) => index));
    const restScale = count === 4 ? 0.82 : count === 6 ? 0.72 : 0.62;
    const items: ShapeItem[] = order.map((partIndex, displayIndex) => {
      const start = new Vec3(starts[displayIndex].x, starts[displayIndex].y);
      const restAngle = difficulty === 1
        ? 0
        : (displayIndex % 2 === 0 ? -1 : 1) * (difficulty === 2 ? 9 : 18);
      const piece = this.createToyPiece(
        root,
        `ShapePiece${partIndex}`,
        start.x,
        start.y,
        shapeSize,
        shapes[partIndex],
        colors[partIndex],
        restAngle,
      );
      piece.setScale(new Vec3(restScale * 0.58, restScale * 0.58, 1));
      tween(piece)
        .delay(0.12 + displayIndex * 0.065)
        .to(0.36, { scale: new Vec3(restScale, restScale, 1) }, { easing: 'backOut' })
        .start();
      return {
        id: `shape-item-${partIndex}`,
        node: piece,
        start,
        matchKey: `shape-${shapes[partIndex]}`,
        restAngle,
        restScale,
        matched: false,
        shape: shapes[partIndex],
        progressIndex: partIndex,
      };
    });

    this.createHelpButton(root, () => this.playHint(items, targets));
    this.bindMatchGame(root, items, targets, {
      complete: () => this.flow.complete(),
      replay: () => this.flow.replay(),
      select: () => this.flow.showSelect(),
      next: () => this.flow.next(),
      onPickup: (item) => this.focusCompatibleTargets(item, targets),
      onTargetFocus: (_item, target) => this.focusHoveredTarget(target as ShapeTarget | null, targets),
      onWrong: (item) => this.playWrongFeedback(item as ShapeItem, targets),
      onMatched: (item, target) => this.playMatchedFeedback(
        item as ShapeItem,
        target as ShapeTarget,
        progressDots,
        level,
      ),
      beforeCelebrate: (done) => this.playSceneCompletion(level.completionEffect, items, done),
    });
  }

  private createProgressDots(
    parent: Node,
    shapes: readonly ToyShape[],
    colors: readonly Color[],
  ): Node[] {
    const size = shapes.length >= 8 ? 26 : 30;
    const gap = shapes.length >= 8 ? 38 : 44;
    const panel = this.createPanel(
      parent,
      'ShapeProgress',
      0,
      329,
      shapes.length * gap + 40,
      58,
      new Color(255, 252, 232, 232),
      28,
    );
    return shapes.map((shape, index) => {
      const icon = this.createToyShapeLayer(
        panel,
        `ShapeProgressIcon${index}`,
        (index - (shapes.length - 1) / 2) * gap,
        0,
        size,
        shape,
        colors[index],
      );
      icon.addComponent(UIOpacity).opacity = 62;
      return icon;
    });
  }

  private focusCompatibleTargets(item: MatchItemState, targets: ShapeTarget[]): void {
    for (const target of targets) {
      if (target.occupied) continue;
      const active = target.matchKey === item.matchKey;
      const opacity = target.glow.getComponent(UIOpacity) ?? target.glow.addComponent(UIOpacity);
      tween(opacity).stop().to(0.12, { opacity: active ? 248 : 72 }).start();
    }
  }

  private focusHoveredTarget(target: ShapeTarget | null, targets: ShapeTarget[]): void {
    for (const candidate of targets) {
      if (candidate.occupied) continue;
      const active = candidate === target;
      tween(candidate.node)
        .stop()
        .to(0.12, { scale: active ? new Vec3(1.07, 1.07, 1) : Vec3.ONE }, { easing: 'quadOut' })
        .start();
      const opacity = candidate.glow.getComponent(UIOpacity) ?? candidate.glow.addComponent(UIOpacity);
      tween(opacity).stop().to(0.12, { opacity: active ? 255 : 82 }).start();
    }
  }

  private playWrongFeedback(item: ShapeItem, targets: ShapeTarget[]): void {
    const target = targets.find((candidate) => !candidate.occupied && candidate.matchKey === item.matchKey);
    if (!target) return;
    const origin = target.hint.position.clone();
    tween(target.hint)
      .stop()
      .to(0.07, { position: origin.clone().add3f(-8, 0, 0) })
      .to(0.07, { position: origin.clone().add3f(8, 0, 0) })
      .to(0.08, { position: origin })
      .start();
  }

  private playMatchedFeedback(
    item: ShapeItem,
    target: ShapeTarget,
    progressDots: Node[],
    level: ShapeLevelConfig,
  ): void {
    target.hint.getComponent(UIOpacity)!.opacity = 0;
    const glowOpacity = target.glow.getComponent(UIOpacity) ?? target.glow.addComponent(UIOpacity);
    tween(glowOpacity).to(0.2, { opacity: 0 }).start();

    const progress = progressDots[target.progressIndex];
    progress.getComponent(UIOpacity)!.opacity = 255;
    tween(progress)
      .to(0.13, { scale: new Vec3(1.32, 1.32, 1) })
      .to(0.22, { scale: Vec3.ONE }, { easing: 'backOut' })
      .start();

    const homeScale = item.node.scale.clone();
    tween(item.node)
      .to(0.13, { scale: homeScale.clone().multiplyScalar(1.12) }, { easing: 'quadOut' })
      .to(0.22, { scale: homeScale }, { easing: 'backOut' })
      .start();
    this.createSettleSparkles(item.node, level.accent);
  }

  private createSettleSparkles(node: Node, accent: Color): void {
    for (let index = 0; index < 5; index++) {
      const angle = Math.PI * 2 * index / 5;
      const sparkle = this.createCircle(
        node.parent!,
        node.position.x,
        node.position.y,
        5 + index % 2 * 2,
        new Color(accent.r, accent.g, accent.b, 210),
      );
      const destination = node.position.clone().add3f(
        Math.cos(angle) * 58,
        Math.sin(angle) * 58,
        0,
      );
      const opacity = sparkle.addComponent(UIOpacity);
      tween(sparkle).to(0.34, { position: destination, scale: new Vec3(0.45, 0.45, 1) }, { easing: 'quadOut' }).start();
      tween(opacity).to(0.34, { opacity: 0 }).call(() => sparkle.isValid && sparkle.destroy()).start();
    }
  }

  private playSceneCompletion(
    effect: ShapeCompletionEffect,
    items: ShapeItem[],
    done: () => void,
  ): void {
    items.forEach((item, index) => {
      const node = item.node;
      const origin = node.position.clone();
      const homeScale = node.scale.clone();
      const delay = index * 0.035;

      if (effect === 'launch') {
        tween(node).delay(delay).to(0.78, {
          position: origin.clone().add3f(0, 230, 0),
          scale: homeScale.clone().multiplyScalar(0.82),
        }, { easing: 'quadIn' }).start();
        return;
      }
      if (effect === 'drive' || effect === 'swim') {
        tween(node).delay(delay).to(0.72, {
          position: origin.clone().add3f(230, effect === 'swim' ? (index % 2 === 0 ? 18 : -18) : 0, 0),
          angle: effect === 'drive' ? 4 : 0,
        }, { easing: 'quadInOut' }).start();
        return;
      }
      if (effect === 'flutter') {
        tween(node)
          .delay(delay)
          .to(0.22, { position: origin.clone().add3f(-18, 38, 0), angle: -12 })
          .to(0.22, { position: origin.clone().add3f(20, 72, 0), angle: 12 })
          .to(0.22, { position: origin.clone().add3f(0, 98, 0), angle: 0 })
          .start();
        return;
      }
      if (effect === 'dance' || effect === 'party' || effect === 'sail') {
        tween(node)
          .delay(delay)
          .to(0.16, { angle: -11, position: origin.clone().add3f(0, 20, 0) })
          .to(0.16, { angle: 11, position: origin.clone().add3f(0, 30, 0) })
          .to(0.18, { angle: 0, position: origin })
          .start();
        return;
      }
      tween(node)
        .delay(delay)
        .to(0.2, { scale: homeScale.clone().multiplyScalar(1.16), position: origin.clone().add3f(0, 20, 0) }, { easing: 'quadOut' })
        .to(0.28, { scale: homeScale, position: origin }, { easing: 'backOut' })
        .start();
    });

    const completionClock = items[0]?.node;
    if (!completionClock) {
      done();
      return;
    }
    tween(completionClock).delay(1.05).call(done).start();
  }

  private playHint(items: ShapeItem[], targets: ShapeTarget[]): void {
    const item = items.find((candidate) => !candidate.matched);
    if (!item) return;
    const target = targets.find((candidate) => !candidate.occupied && candidate.matchKey === item.matchKey);
    if (!target) return;
    this.focusHoveredTarget(target, targets);
    const start = item.node.position.clone();
    const direction = target.position.clone().subtract(start).multiplyScalar(0.22);
    const restScale = item.restScale ?? 1;
    tween(item.node)
      .stop()
      .to(0.28, { position: start.clone().add(direction), scale: new Vec3(restScale * 1.08, restScale * 1.08, 1) }, { easing: 'quadOut' })
      .to(0.36, { position: start, scale: new Vec3(restScale, restScale, 1) }, { easing: 'backOut' })
      .call(() => this.focusHoveredTarget(null, targets))
      .start();
  }

  private playSlotIdle(node: Node, effect: ShapeCompletionEffect, index: number): void {
    if (effect !== 'sail' && effect !== 'flutter' && effect !== 'swim') {
      return;
    }
    const origin = node.position.clone();
    tween(node)
      .delay(index * 0.06)
      .repeatForever(
        tween<Node>()
          .to(1.2, { position: origin.clone().add3f(0, 4 + index % 2 * 2, 0) }, { easing: 'sineInOut' })
          .to(1.2, { position: origin }, { easing: 'sineInOut' }),
      )
      .start();
  }

  private getItemStarts(count: number): Point[] {
    const gap = count === 4 ? 190 : count === 6 ? 142 : 112;
    return Array.from({ length: count }, (_, index) => ({
      x: (index - (count - 1) / 2) * gap,
      y: -280 + (index % 2 === 0 ? 5 : -5),
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
