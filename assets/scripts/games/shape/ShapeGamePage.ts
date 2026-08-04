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
} from '../common/MatchTypes';
import { getShapeStage } from './ShapeConfig';
import type { ShapeGameFlow } from './ShapeGameFlow';
import type {
  ShapeLevelConfig,
  ShapePartConfig,
} from './ShapeTypes';

type ShapeTarget = MatchTargetState & {
  part: ShapePartConfig;
  hint: Node;
  glow: Node;
  progressIndex: number;
};

type ShapeItem = MatchItemState & {
  part: ShapePartConfig;
  displayIndex: number;
};

type Point = { x: number; y: number };

/**
 * 形状造物 V3：用真正的几何积木搭出火箭、汽车、房子和蝴蝶。
 * 选关卡片直接使用同一份 parts 配置渲染，确保预览与实际玩法一致。
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
    const stage = getShapeStage(level, difficulty);
    const parts = level.parts.slice(0, stage.partCount);
    const root = this.resetScreen('ShapeGameV3');

    this.drawFullBackground(root, level.background);
    this.drawOuterDecor(root, level);
    this.createBackButton(root, () => this.flow.showSelect());
    this.createToyRibbon(root, level.title, 323, level.accent, 420);
    this.createLabel(
      root,
      level.subtitle,
      0,
      279,
      20,
      new Color(98, 82, 72, 220),
      720,
      34,
    );

    this.createStage(root, level);
    const progressPips = this.createProgressPips(root, parts.length, 240, level.accent);
    const boardScale = level.objectScale * (parts.length === 4 ? 1.14 : parts.length === 6 ? 1.02 : 0.92);
    const basePieceSize = parts.length === 4 ? 108 : parts.length === 6 ? 94 : 82;
    const targetCenterY = 28;

    const targets: ShapeTarget[] = parts.map((part, index) => {
      const finalSize = part.size * boardScale;
      const position = new Vec3(part.x * boardScale, part.y * boardScale + targetCenterY);
      const targetRoot = this.createUiNode(
        `ShapeTarget-${part.id}`,
        root,
        position.x,
        position.y,
        Math.max(100, finalSize * 1.75),
        Math.max(100, finalSize * 1.75),
      );
      const glow = this.createCircle(
        targetRoot,
        0,
        0,
        Math.max(38, finalSize * 0.56),
        new Color(part.color.r, part.color.g, part.color.b, 30),
      );
      glow.name = 'ShapeSlotGlow';
      glow.addComponent(UIOpacity).opacity = 55;

      const hintFill = difficulty === 1
        ? new Color(part.color.r, part.color.g, part.color.b, 112)
        : difficulty === 2
          ? new Color(213, 218, 211, 128)
          : new Color(239, 238, 226, 74);
      const hintStroke = difficulty === 3
        ? new Color(level.accent.r, level.accent.g, level.accent.b, 195)
        : new Color(103, 94, 82, 88);
      const hint = this.createToyShapeLayer(
        targetRoot,
        'ShapeSlotHint',
        0,
        0,
        finalSize,
        part.shape,
        hintFill,
        hintStroke,
        difficulty === 3 ? 5 : 3,
      );
      hint.angle = part.angle ?? 0;
      hint.addComponent(UIOpacity).opacity = stage.hintOpacity;

      return {
        id: `shape-target-${part.id}`,
        node: targetRoot,
        position,
        matchKey: part.matchKey ?? part.id,
        dropArea: {
          center: position,
          width: finalSize + stage.snapDistance,
          height: finalSize + stage.snapDistance,
        },
        snapDistance: stage.snapDistance,
        matchedScale: finalSize / basePieceSize,
        targetAngle: part.angle ?? 0,
        occupied: false,
        part,
        hint,
        glow,
        progressIndex: index,
      };
    });

    const trayWidth = Math.min(1080, 390 + parts.length * 105);
    this.createToyTray(root, -286, trayWidth, level.accent, 132);
    const starts = this.getTrayStarts(parts.length);
    const order = this.shuffle(Array.from({ length: parts.length }, (_, index) => index));
    const restScale = parts.length === 4 ? 0.88 : parts.length === 6 ? 0.74 : 0.64;
    const pieceLayerBase = root.children.length;
    targets.forEach((target, index) => {
      target.matchedSiblingIndex = pieceLayerBase + index;
    });

    const items: ShapeItem[] = order.map((partIndex, displayIndex) => {
      const part = parts[partIndex];
      const start = new Vec3(starts[displayIndex].x, starts[displayIndex].y);
      const direction = displayIndex % 2 === 0 ? -1 : 1;
      const restAngle = stage.randomAngle === 0 ? 0 : direction * stage.randomAngle;
      const piece = this.createToyPiece(
        root,
        `ShapePiece-${part.id}`,
        start.x,
        start.y,
        basePieceSize,
        part.shape,
        part.color,
        restAngle,
        false,
      );
      piece.setScale(new Vec3(restScale * 0.55, restScale * 0.55, 1));
      tween(piece)
        .delay(0.08 + displayIndex * 0.055)
        .to(0.32, { scale: new Vec3(restScale, restScale, 1) }, { easing: 'backOut' })
        .start();
      return {
        id: `shape-item-${part.id}`,
        node: piece,
        start,
        matchKey: part.matchKey ?? part.id,
        restAngle,
        restScale,
        matched: false,
        part,
        displayIndex,
      };
    });

    this.createHelpButton(root, () => this.playHint(items, targets));
    this.bindMatchGame(root, items, targets, {
      complete: () => this.flow.complete(),
      replay: () => this.flow.replay(),
      select: () => this.flow.showSelect(),
      next: () => this.flow.next(),
      onPickup: (item) => this.focusCompatibleTargets(item, targets),
      onTargetFocus: (_item, target) => {
        this.focusHoveredTarget(target as ShapeTarget | null, targets);
      },
      onWrong: (item) => this.playWrongFeedback(item as ShapeItem, targets),
      onMatched: (item, target) => {
        this.playMatchedFeedback(
          item as ShapeItem,
          target as ShapeTarget,
          progressPips,
        );
      },
      beforeCelebrate: (done) => {
        this.playSceneCompletion(level, items, done);
      },
    });
  }

  private drawOuterDecor(root: Node, level: ShapeLevelConfig): void {
    this.createCircle(
      root,
      -this.visibleWidth / 2 + 88,
      -312,
      172,
      new Color(level.accent.r, level.accent.g, level.accent.b, 26),
    );
    this.createCircle(
      root,
      this.visibleWidth / 2 - 90,
      310,
      132,
      new Color(255, 210, 83, 35),
    );
    this.createSoftCloud(root, -500, 286, 0.54, 125);
    this.createSoftCloud(root, 500, 210, 0.42, 105);
  }

  private createStage(root: Node, level: ShapeLevelConfig): void {
    const width = Math.min(1080, this.visibleWidth - 130);
    const height = 470;
    this.createPanel(root, 'ShapeStageShadow', 8, 2, width, height, new Color(64, 65, 59, 38), 48);
    this.createPanel(root, 'ShapeStageSide', 0, 9, width, height, this.darken(level.accent, 0.76), 48);
    const stage = this.createPanel(
      root,
      'ShapeStage',
      0,
      18,
      width,
      height,
      new Color(255, 254, 243, 255),
      48,
      new Color(255, 255, 255, 230),
      5,
    );
    this.drawStageDecor(stage, level, width, height);
  }

  private drawStageDecor(
    stage: Node,
    level: ShapeLevelConfig,
    width: number,
    _height: number,
  ): void {
    if (level.celebration === 'rocket-launch') {
      this.createPanel(stage, 'SpaceWash', 0, 0, width - 18, 452, new Color(67, 116, 191, 42), 42);
      for (let index = 0; index < 18; index++) {
        const x = -470 + (index * 73) % 940;
        const y = -175 + (index * 61) % 350;
        this.createCircle(stage, x, y, 3 + index % 3, new Color(255, 225, 112, 130));
      }
      return;
    }

    this.createSoftCloud(stage, -390, 148, 0.5, 145);
    this.createSoftCloud(stage, 350, 130, 0.39, 120);
    this.createCircle(stage, 420, 158, 44, new Color(255, 210, 77, 115));

    if (level.celebration === 'car-drive') {
      this.createPanel(stage, 'CarGrass', 0, -188, width - 24, 82, new Color(144, 207, 107, 145), 34);
      this.createPanel(stage, 'Road', 0, -142, width - 70, 76, new Color(129, 135, 139, 100), 20);
      for (let index = 0; index < 9; index++) {
        this.createPanel(stage, 'RoadMark', -420 + index * 105, -142, 52, 7, new Color(255, 248, 205, 155), 3);
      }
      return;
    }

    this.createPanel(stage, 'GardenGround', 0, -188, width - 24, 84, new Color(142, 207, 105, 150), 34);
    if (level.celebration === 'house-light') {
      this.createTree(stage, -420, -91, 0.76);
      this.createTree(stage, 420, -102, 0.64);
      return;
    }
    for (let index = 0; index < 8; index++) {
      const x = -440 + index * 125;
      const color = index % 2 === 0
        ? new Color(240, 111, 164, 195)
        : new Color(255, 190, 57, 195);
      this.createCircle(stage, x, -155 + (index % 3) * 9, 11, color);
      this.createPanel(stage, 'FlowerStem', x, -178, 5, 33, new Color(71, 160, 86, 165), 2);
    }
  }

  private focusCompatibleTargets(item: MatchItemState, targets: ShapeTarget[]): void {
    for (const target of targets) {
      if (target.occupied) continue;
      const active = target.matchKey === item.matchKey;
      tween(target.glow.getComponent(UIOpacity)!)
        .stop()
        .to(0.12, { opacity: active ? 250 : 50 })
        .start();
    }
  }

  private focusHoveredTarget(target: ShapeTarget | null, targets: ShapeTarget[]): void {
    for (const candidate of targets) {
      if (candidate.occupied) continue;
      const active = candidate === target;
      tween(candidate.node)
        .stop()
        .to(0.12, { scale: active ? new Vec3(1.08, 1.08, 1) : Vec3.ONE }, { easing: 'quadOut' })
        .start();
      tween(candidate.glow.getComponent(UIOpacity)!)
        .stop()
        .to(0.12, { opacity: active ? 255 : 55 })
        .start();
    }
  }

  private playWrongFeedback(item: ShapeItem, targets: ShapeTarget[]): void {
    const target = targets.find((candidate) => !candidate.occupied && candidate.matchKey === item.matchKey);
    if (!target) return;
    tween(target.hint)
      .stop()
      .to(0.08, { angle: (target.part.angle ?? 0) - 8, scale: new Vec3(1.1, 1.1, 1) })
      .to(0.08, { angle: (target.part.angle ?? 0) + 8 })
      .to(0.12, { angle: target.part.angle ?? 0, scale: Vec3.ONE }, { easing: 'backOut' })
      .start();
  }

  private playMatchedFeedback(
    item: ShapeItem,
    target: ShapeTarget,
    progressPips: Node[],
  ): void {
    tween(target.hint.getComponent(UIOpacity)!)
      .to(0.16, { opacity: 0 })
      .start();
    tween(target.glow.getComponent(UIOpacity)!)
      .to(0.16, { opacity: 0 })
      .start();

    const pip = progressPips[target.progressIndex];
    const filled = this.createCircle(pip, 0, 0, 11, target.part.color);
    filled.setScale(new Vec3(0.2, 0.2, 1));
    tween(filled).to(0.22, { scale: Vec3.ONE }, { easing: 'backOut' }).start();

    tween(item.node)
      .to(0.12, {
        scale: new Vec3(
          (target.matchedScale ?? 1) * 1.12,
          (target.matchedScale ?? 1) * 1.12,
          1,
        ),
      }, { easing: 'quadOut' })
      .to(0.22, {
        scale: new Vec3(target.matchedScale ?? 1, target.matchedScale ?? 1, 1),
      }, { easing: 'backOut' })
      .start();
  }

  private playHint(items: ShapeItem[], targets: ShapeTarget[]): void {
    const item = items.find((candidate) => !candidate.matched);
    if (!item) return;
    const target = targets.find((candidate) => !candidate.occupied && candidate.matchKey === item.matchKey);
    if (!target) return;
    const start = item.node.position.clone();
    const direction = target.position.clone().subtract(start).multiplyScalar(0.2);
    tween(item.node)
      .stop()
      .to(0.26, { position: start.clone().add(direction), scale: new Vec3((item.restScale ?? 1) * 1.12, (item.restScale ?? 1) * 1.12, 1) }, { easing: 'quadOut' })
      .to(0.34, { position: start, scale: new Vec3(item.restScale ?? 1, item.restScale ?? 1, 1) }, { easing: 'backOut' })
      .start();
    tween(target.node)
      .stop()
      .to(0.18, { scale: new Vec3(1.12, 1.12, 1) })
      .to(0.25, { scale: Vec3.ONE }, { easing: 'backOut' })
      .start();
  }

  private playSceneCompletion(
    level: ShapeLevelConfig,
    items: ShapeItem[],
    done: () => void,
  ): void {
    this.addFinishedDetails(level, items);
    const celebration = level.celebration;
    if (celebration === 'rocket-launch') {
      this.createRocketSmoke(items);
      items.forEach((item, index) => {
        const origin = item.node.position.clone();
        tween(item.node)
          .delay(index * 0.025)
          .to(0.95, { position: origin.clone().add3f(0, 245, 0) }, { easing: 'quadIn' })
          .start();
      });
    } else if (celebration === 'car-drive') {
      items.forEach((item, index) => {
        const origin = item.node.position.clone();
        tween(item.node)
          .delay(index * 0.02)
          .to(0.88, { position: origin.clone().add3f(285, 0, 0) }, { easing: 'quadInOut' })
          .start();
      });
    } else if (celebration === 'butterfly-fly') {
      items.forEach((item, index) => {
        const origin = item.node.position.clone();
        const baseAngle = item.node.angle;
        tween(item.node)
          .delay(index * 0.025)
          .to(0.2, { angle: baseAngle - 9, position: origin.clone().add3f(0, 22, 0) })
          .to(0.2, { angle: baseAngle + 9, position: origin.clone().add3f(18, 55, 0) })
          .to(0.48, { angle: baseAngle, position: origin.clone().add3f(110, 175, 0) }, { easing: 'sineOut' })
          .start();
      });
    } else {
      items.forEach((item, index) => {
        const origin = item.node.position.clone();
        tween(item.node)
          .delay(index * 0.04)
          .to(0.18, { position: origin.clone().add3f(0, 24, 0) })
          .to(0.2, { position: origin }, { easing: 'backOut' })
          .start();
      });
      this.createHouseSmoke(items);
    }

    if (items[0]) {
      tween(items[0].node).delay(1.18).call(done).start();
    } else {
      done();
    }
  }

  private addFinishedDetails(level: ShapeLevelConfig, items: ShapeItem[]): void {
    const anchor = items.find((item) => item.part.id.includes('body') || item.part.id.includes('wall'))?.node;
    if (!anchor) return;
    if (level.celebration === 'car-drive') {
      this.createCuteFace(anchor, 0, 0, 17);
      return;
    }
    if (level.celebration === 'house-light') {
      this.createCircle(anchor, -32, 10, 8, new Color(255, 238, 114, 170));
      this.createCircle(anchor, 32, 10, 8, new Color(255, 238, 114, 170));
      return;
    }
    if (level.celebration === 'butterfly-fly') {
      this.createCuteFace(anchor, 0, 0, 15);
    }
  }

  private createRocketSmoke(items: ShapeItem[]): void {
    const flame = items.find((item) => item.part.id === 'flame');
    if (!flame) return;
    for (let index = 0; index < 6; index++) {
      const smoke = this.createCircle(
        this.contentRoot!,
        flame.node.position.x + (index % 2 === 0 ? -1 : 1) * (10 + index * 3),
        flame.node.position.y - 42 - index * 20,
        18 + index * 3,
        new Color(255, 255, 255, 165 - index * 16),
      );
      tween(smoke)
        .to(0.75, { position: smoke.position.clone().add3f((index % 2 === 0 ? -1 : 1) * 25, -70, 0), scale: new Vec3(1.35, 1.35, 1) })
        .start();
    }
  }

  private createHouseSmoke(items: ShapeItem[]): void {
    const chimney = items.find((item) => item.part.id === 'chimney');
    if (!chimney) return;
    for (let index = 0; index < 4; index++) {
      const smoke = this.createCircle(
        this.contentRoot!,
        chimney.node.position.x,
        chimney.node.position.y + 45 + index * 30,
        13 + index * 3,
        new Color(255, 255, 255, 155 - index * 22),
      );
      tween(smoke)
        .delay(index * 0.08)
        .to(0.75, { position: smoke.position.clone().add3f(22, 45, 0), scale: new Vec3(1.25, 1.25, 1) }, { easing: 'sineOut' })
        .start();
    }
  }

  private getTrayStarts(count: number): Point[] {
    const gap = count === 4 ? 205 : count === 6 ? 157 : 126;
    return Array.from({ length: count }, (_, index) => ({
      x: (index - (count - 1) / 2) * gap,
      y: -280 + (index % 2 === 0 ? 3 : -3),
    }));
  }

  private createTree(parent: Node, x: number, y: number, scale: number): void {
    this.createPanel(parent, 'TreeTrunk', x, y, 35 * scale, 130 * scale, new Color(151, 101, 63, 235), 16 * scale);
    this.createCircle(parent, x - 30 * scale, y + 78 * scale, 52 * scale, new Color(87, 174, 94, 220));
    this.createCircle(parent, x + 25 * scale, y + 88 * scale, 60 * scale, new Color(100, 190, 104, 225));
  }

  private shuffle<T>(values: T[]): T[] {
    for (let index = values.length - 1; index > 0; index--) {
      const swap = Math.floor(Math.random() * (index + 1));
      [values[index], values[swap]] = [values[swap], values[index]];
    }
    return values;
  }
}
