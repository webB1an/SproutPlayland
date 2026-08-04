import {
  Color,
  Graphics,
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
import { getColorStage } from './ColorConfig';
import type { ColorGameFlow } from './ColorGameFlow';
import type {
  ColorCelebration,
  ColorCue,
  ColorLevelConfig,
  ColorSceneKind,
  ColorToken,
} from './ColorTypes';

type ColorTarget = MatchTargetState & {
  token: ColorToken;
  greyLayer: Node;
  colorLayer: Node;
  cue: Node;
  glow: Node;
  progressIndex: number;
};

type ColorItem = MatchItemState & {
  token: ColorToken;
  cue: Node;
  displayIndex: number;
};

type Point = { x: number; y: number };

type SceneObject = {
  greyLayer: Node;
  colorLayer: Node;
  cue: Node;
  glow: Node;
};

/**
 * 色彩魔法 V3：孩子拖动可爱的颜料精灵，让灰色场景逐步恢复颜色。
 * 选关主题、游戏主体和完成动画使用同一个 sceneKind，避免卡片与玩法脱节。
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
    const stage = getColorStage(level, difficulty);
    const tokens = level.palette.slice(0, stage.itemCount);
    const root = this.resetScreen('ColorGameV3');

    this.drawFullBackground(root, level.background);
    this.drawOuterDecor(root, level);
    this.createBackButton(root, () => this.flow.showSelect());
    this.createToyRibbon(root, level.title, 323, level.accent, 390);
    this.createLabel(
      root,
      level.subtitle,
      0,
      279,
      20,
      new Color(103, 85, 72, 220),
      620,
      34,
    );

    this.createStage(root, level);
    const progressPips = this.createProgressPips(root, tokens.length, 240, level.accent);
    const targetPositions = this.getTargetPositions(level.sceneKind, tokens.length);
    const targetSize = this.getTargetSize(level.sceneKind, tokens.length);

    const targets: ColorTarget[] = tokens.map((token, index) => {
      const position = new Vec3(targetPositions[index].x, targetPositions[index].y);
      const targetRoot = this.createUiNode(
        `ColorTarget-${token.id}`,
        root,
        position.x,
        position.y,
        targetSize * 1.7,
        targetSize * 1.7,
      );
      const object = this.createSceneObject(
        targetRoot,
        level.sceneKind,
        targetSize,
        token,
        stage.targetCueOpacity,
      );
      this.playTargetIdle(targetRoot, level.sceneKind, index);
      return {
        id: `color-target-${token.id}`,
        node: targetRoot,
        position,
        matchKey: token.id,
        dropArea: {
          center: position,
          width: targetSize + stage.snapPadding,
          height: targetSize + stage.snapPadding,
        },
        snapDistance: targetSize * 0.9,
        matchedScale: 0.38,
        targetAngle: 0,
        occupied: false,
        token,
        greyLayer: object.greyLayer,
        colorLayer: object.colorLayer,
        cue: object.cue,
        glow: object.glow,
        progressIndex: index,
      };
    });

    const trayWidth = stage.presentOneByOne ? 430 : Math.min(1010, 410 + tokens.length * 128);
    this.createToyTray(root, -286, trayWidth, level.accent, 132);
    const order = this.shuffle(Array.from({ length: tokens.length }, (_, index) => index));
    const starts = this.getTrayStarts(tokens.length, stage.presentOneByOne);
    const items: ColorItem[] = order.map((tokenIndex, displayIndex) => {
      const token = tokens[tokenIndex];
      const start = new Vec3(starts[displayIndex].x, starts[displayIndex].y);
      const restAngle = stage.presentOneByOne
        ? 0
        : (displayIndex % 2 === 0 ? -1 : 1) * stage.trayAngle;
      const paint = this.createPaintToken(root, token, start.x, start.y, restAngle);
      paint.active = !stage.presentOneByOne || displayIndex === 0;
      if (paint.active) {
        paint.setScale(new Vec3(0.55, 0.55, 1));
        tween(paint).to(0.32, { scale: Vec3.ONE }, { easing: 'backOut' }).start();
      }
      return {
        id: `color-item-${token.id}`,
        node: paint,
        start,
        matchKey: token.id,
        restAngle,
        restScale: 1,
        matched: false,
        token,
        cue: paint.getChildByName('PaintCue')!,
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
        this.focusHoveredTarget(target as ColorTarget | null, targets);
      },
      onWrong: (item) => this.playWrongFeedback(item as ColorItem, targets),
      onMatched: (item, target) => {
        this.playMatchedFeedback(
          item as ColorItem,
          target as ColorTarget,
          progressPips,
          items,
          stage.presentOneByOne,
        );
      },
      beforeCelebrate: (done) => {
        this.playSceneCompletion(level.celebration, targets, done);
      },
    });
  }

  private drawOuterDecor(root: Node, level: ColorLevelConfig): void {
    this.createCircle(
      root,
      -this.visibleWidth / 2 + 92,
      -306,
      166,
      new Color(level.accent.r, level.accent.g, level.accent.b, 28),
    );
    this.createCircle(
      root,
      this.visibleWidth / 2 - 88,
      306,
      132,
      new Color(255, 206, 91, 35),
    );
    this.createSoftCloud(root, -500, 285, 0.55, 125);
    this.createSoftCloud(root, 495, 205, 0.42, 100);
  }

  private createStage(root: Node, level: ColorLevelConfig): void {
    const width = Math.min(1080, this.visibleWidth - 130);
    const height = 470;
    this.createPanel(root, 'ColorStageShadow', 8, 2, width, height, new Color(66, 64, 55, 38), 48);
    this.createPanel(root, 'ColorStageSide', 0, 9, width, height, this.darken(level.accent, 0.78), 48);
    const stage = this.createPanel(
      root,
      'ColorStage',
      0,
      18,
      width,
      height,
      new Color(255, 254, 242, 255),
      48,
      new Color(255, 255, 255, 230),
      5,
    );
    this.drawSceneBackdrop(stage, level.sceneKind, width, height, level);
  }

  private drawSceneBackdrop(
    stage: Node,
    kind: ColorSceneKind,
    width: number,
    height: number,
    level: ColorLevelConfig,
  ): void {
    if (kind === 'fish') {
      this.createPanel(stage, 'WaterWash', 0, 0, width - 18, height - 18, new Color(105, 211, 226, 75), 42);
      for (let index = 0; index < 14; index++) {
        const x = -width / 2 + 75 + (index * 79) % (width - 130);
        const y = -170 + (index * 47) % 330;
        this.createCircle(stage, x, y, 7 + index % 3 * 3, new Color(255, 255, 255, 105));
      }
      this.createPanel(stage, 'Sand', 0, -196, width - 24, 66, new Color(244, 218, 153, 150), 32);
      this.createCoral(stage, -430, -150, level.accent);
      this.createCoral(stage, 424, -160, new Color(244, 126, 145, 220));
      return;
    }

    this.createSoftCloud(stage, -390, 150, 0.52, 145);
    this.createSoftCloud(stage, 350, 125, 0.42, 125);
    this.createCircle(stage, 418, 160, 45, new Color(255, 209, 74, 115));

    if (kind === 'orchard') {
      this.createPanel(stage, 'OrchardGround', 0, -190, width - 24, 82, new Color(139, 207, 105, 160), 35);
      this.createPanel(stage, 'TreeTrunk', 0, -55, 70, 270, new Color(151, 101, 63, 255), 30);
      this.createCircle(stage, -185, 90, 155, new Color(94, 181, 100, 235));
      this.createCircle(stage, 0, 135, 190, new Color(103, 193, 107, 240));
      this.createCircle(stage, 190, 82, 150, new Color(83, 169, 91, 235));
      return;
    }

    if (kind === 'train') {
      this.createPanel(stage, 'TrainGround', 0, -184, width - 24, 84, new Color(149, 207, 109, 140), 34);
      this.createPanel(stage, 'RailOne', 0, -145, width - 90, 9, new Color(103, 84, 70, 180), 4);
      this.createPanel(stage, 'RailTwo', 0, -190, width - 90, 9, new Color(103, 84, 70, 180), 4);
      for (let index = 0; index < 15; index++) {
        this.createPanel(stage, 'Sleeper', -470 + index * 67, -167, 34, 8, new Color(128, 88, 59, 150), 3);
      }
      this.createTrainEngine(stage, -430, -70, level.accent);
      return;
    }

    this.createPanel(stage, 'BalloonGround', 0, -190, width - 24, 82, new Color(142, 208, 109, 155), 34);
    this.createBunny(stage, -430, -118, 0.78);
  }

  private createSceneObject(
    parent: Node,
    kind: ColorSceneKind,
    size: number,
    token: ColorToken,
    cueOpacity: number,
  ): SceneObject {
    const glow = this.createCircle(
      parent,
      0,
      0,
      size * 0.62,
      new Color(token.color.r, token.color.g, token.color.b, 28),
    );
    glow.name = 'TargetGlow';
    const glowOpacity = glow.addComponent(UIOpacity);
    glowOpacity.opacity = 82;

    const neutral = new Color(205, 211, 207, 255);
    const greyLayer = this.createObjectLayer(parent, kind, size, neutral, false);
    greyLayer.name = 'GreyObject';
    const colorLayer = this.createObjectLayer(parent, kind, size, token.color, true);
    colorLayer.name = 'ColorObject';
    colorLayer.addComponent(UIOpacity).opacity = 0;

    const cue = this.createColorCue(
      parent,
      'TargetCue',
      token.cue,
      0,
      kind === 'train' ? 5 : 4,
      Math.max(34, size * 0.29),
      new Color(255, 255, 247, 230),
      new Color(token.color.r, token.color.g, token.color.b, 230),
    );
    cue.addComponent(UIOpacity).opacity = cueOpacity;
    return { greyLayer, colorLayer, cue, glow };
  }

  private createObjectLayer(
    parent: Node,
    kind: ColorSceneKind,
    size: number,
    color: Color,
    showFace: boolean,
  ): Node {
    const layer = this.createUiNode(`ObjectLayer-${kind}`, parent, 0, 0, size * 1.6, size * 1.6);
    if (kind === 'balloon') {
      const body = this.createToyShapeLayer(
        layer,
        'BalloonBody',
        0,
        16,
        size * 0.9,
        'oval',
        color,
        new Color(255, 255, 247, 205),
        4,
      );
      body.angle = 90;
      const knot = this.createTriangle(layer, 0, -size * 0.37, size * 0.24, size * 0.2, this.darken(color, 0.85));
      knot.angle = 180;
      const string = this.createUiNode('BalloonString', layer, 0, -size * 0.67, size * 0.4, size * 0.7);
      const graphics = string.addComponent(Graphics);
      graphics.strokeColor = new Color(103, 86, 72, 145);
      graphics.lineWidth = 3;
      graphics.moveTo(0, size * 0.32);
      graphics.quadraticCurveTo(size * 0.12, 0, 0, -size * 0.32);
      graphics.stroke();
      if (showFace) this.createCuteFace(layer, 0, 20, size * 0.23);
      return layer;
    }

    if (kind === 'orchard') {
      this.createToyShapeLayer(
        layer,
        'FruitBody',
        0,
        0,
        size * 0.82,
        'circle',
        color,
        new Color(255, 255, 247, 205),
        4,
      );
      this.createPanel(layer, 'FruitStem', 0, size * 0.44, size * 0.09, size * 0.3, new Color(119, 83, 58, 255), 6);
      const leaf = this.createToyShapeLayer(
        layer,
        'FruitLeaf',
        size * 0.22,
        size * 0.47,
        size * 0.28,
        'oval',
        new Color(82, 171, 92, 255),
      );
      leaf.angle = 25;
      if (showFace) this.createCuteFace(layer, 0, -3, size * 0.22);
      return layer;
    }

    if (kind === 'fish') {
      this.createToyShapeLayer(
        layer,
        'FishBody',
        6,
        0,
        size * 0.86,
        'oval',
        color,
        new Color(255, 255, 247, 205),
        4,
      );
      const tail = this.createTriangle(
        layer,
        -size * 0.47,
        0,
        size * 0.38,
        size * 0.48,
        this.darken(color, 0.87),
      );
      tail.angle = -90;
      this.createToyShapeLayer(
        layer,
        'FishFin',
        5,
        -size * 0.2,
        size * 0.26,
        'triangle',
        this.darken(color, 0.9),
      );
      if (showFace) this.createCuteFace(layer, size * 0.18, 2, size * 0.19);
      return layer;
    }

    this.createPanel(
      layer,
      'TrainCarBody',
      0,
      1,
      size * 1.1,
      size * 0.66,
      color,
      size * 0.17,
      new Color(255, 255, 247, 205),
      4,
    );
    this.createPanel(
      layer,
      'TrainCarRoof',
      0,
      size * 0.32,
      size * 0.86,
      size * 0.18,
      this.darken(color, 0.86),
      size * 0.09,
    );
    this.createCircle(layer, -size * 0.32, -size * 0.38, size * 0.14, new Color(70, 72, 78, 255));
    this.createCircle(layer, size * 0.32, -size * 0.38, size * 0.14, new Color(70, 72, 78, 255));
    this.createCircle(layer, -size * 0.32, -size * 0.38, size * 0.06, new Color(219, 224, 224, 255));
    this.createCircle(layer, size * 0.32, -size * 0.38, size * 0.06, new Color(219, 224, 224, 255));
    if (showFace) this.createCuteFace(layer, 0, 4, size * 0.18);
    return layer;
  }

  private createPaintToken(
    parent: Node,
    token: ColorToken,
    x: number,
    y: number,
    angle: number,
  ): Node {
    const paint = this.createUiNode(`Paint-${token.id}`, parent, x, y, 150, 150);
    paint.angle = angle;
    this.createCircle(paint, 7, -12, 58, new Color(67, 50, 39, 42));
    this.createCircle(paint, 0, -7, 58, this.darken(token.color, 0.78));
    this.createCircle(paint, 0, 0, 57, token.color);
    this.createCircle(paint, -17, 19, 9, new Color(255, 255, 255, 150));
    this.createCuteFace(paint, 0, -5, 22);
    const cue = this.createColorCue(
      paint,
      'PaintCue',
      token.cue,
      0,
      28,
      28,
      new Color(255, 255, 250, 230),
      new Color(255, 255, 250, 230),
    );
    cue.setScale(new Vec3(0.82, 0.82, 1));
    return paint;
  }

  private createColorCue(
    parent: Node,
    name: string,
    cue: ColorCue,
    x: number,
    y: number,
    size: number,
    fill: Color,
    stroke: Color,
  ): Node {
    const node = this.createUiNode(name, parent, x, y, size * 1.9, size * 1.5);
    if (cue === 'dots') {
      [-0.32, 0, 0.32].forEach((offset) => {
        this.createCircle(node, offset * size, 0, size * 0.12, fill);
      });
      return node;
    }
    if (cue === 'stripes') {
      [-0.28, 0, 0.28].forEach((offset) => {
        const stripe = this.createPanel(node, 'CueStripe', offset * size, 0, size * 0.13, size * 0.75, fill, size * 0.06);
        stripe.angle = 18;
      });
      return node;
    }
    if (cue === 'waves') {
      const graphics = node.addComponent(Graphics);
      graphics.strokeColor = fill;
      graphics.lineWidth = Math.max(3, size * 0.11);
      for (let row = -1; row <= 1; row++) {
        const yPos = row * size * 0.22;
        graphics.moveTo(-size * 0.4, yPos);
        graphics.bezierCurveTo(-size * 0.2, yPos + size * 0.15, 0, yPos - size * 0.15, size * 0.2, yPos);
        graphics.bezierCurveTo(size * 0.28, yPos + size * 0.08, size * 0.34, yPos + size * 0.08, size * 0.4, yPos);
      }
      graphics.stroke();
      return node;
    }
    this.createToyShapeLayer(
      node,
      'CueShape',
      0,
      0,
      size * 0.72,
      cue === 'heart' ? 'heart' : 'star',
      fill,
      stroke,
      2,
    );
    return node;
  }

  private focusCompatibleTargets(item: MatchItemState, targets: ColorTarget[]): void {
    for (const target of targets) {
      if (target.occupied) continue;
      const opacity = target.glow.getComponent(UIOpacity)!;
      const active = target.matchKey === item.matchKey;
      tween(opacity).stop().to(0.12, { opacity: active ? 250 : 64 }).start();
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
      tween(candidate.glow.getComponent(UIOpacity)!)
        .stop()
        .to(0.12, { opacity: active ? 255 : 82 })
        .start();
    }
  }

  private playWrongFeedback(item: ColorItem, targets: ColorTarget[]): void {
    const target = targets.find((candidate) => !candidate.occupied && candidate.matchKey === item.matchKey);
    if (!target) return;
    tween(target.cue)
      .stop()
      .to(0.08, { angle: -10, scale: new Vec3(1.16, 1.16, 1) })
      .to(0.08, { angle: 10 })
      .to(0.12, { angle: 0, scale: Vec3.ONE }, { easing: 'backOut' })
      .start();
  }

  private playMatchedFeedback(
    item: ColorItem,
    target: ColorTarget,
    progressPips: Node[],
    items: ColorItem[],
    presentOneByOne: boolean,
  ): void {
    tween(target.greyLayer.getComponent(UIOpacity) ?? target.greyLayer.addComponent(UIOpacity))
      .to(0.22, { opacity: 0 })
      .start();
    tween(target.colorLayer.getComponent(UIOpacity)!)
      .to(0.24, { opacity: 255 })
      .start();
    tween(target.cue.getComponent(UIOpacity)!)
      .to(0.16, { opacity: 0 })
      .start();
    tween(target.glow.getComponent(UIOpacity)!)
      .to(0.2, { opacity: 0 })
      .start();

    const itemOpacity = item.node.getComponent(UIOpacity) ?? item.node.addComponent(UIOpacity);
    tween(itemOpacity).to(0.16, { opacity: 0 }).start();
    tween(item.node)
      .to(0.12, { scale: new Vec3(0.25, 0.25, 1) })
      .call(() => { item.node.active = false; })
      .start();

    const pip = progressPips[target.progressIndex];
    const filled = this.createCircle(pip, 0, 0, 11, target.token.color);
    filled.setScale(new Vec3(0.25, 0.25, 1));
    tween(filled).to(0.22, { scale: Vec3.ONE }, { easing: 'backOut' }).start();

    tween(target.node)
      .to(0.13, { scale: new Vec3(1.16, 1.16, 1) }, { easing: 'quadOut' })
      .to(0.24, { scale: Vec3.ONE }, { easing: 'backOut' })
      .start();

    if (presentOneByOne) {
      const next = items.find((candidate) => !candidate.matched && !candidate.node.active);
      if (next) {
        next.node.active = true;
        next.node.setScale(new Vec3(0.45, 0.45, 1));
        const opacity = next.node.getComponent(UIOpacity) ?? next.node.addComponent(UIOpacity);
        opacity.opacity = 255;
        tween(next.node).delay(0.16).to(0.3, { scale: Vec3.ONE }, { easing: 'backOut' }).start();
      }
    }
  }

  private playHint(items: ColorItem[], targets: ColorTarget[]): void {
    const item = items.find((candidate) => !candidate.matched && candidate.node.active);
    if (!item) return;
    const target = targets.find((candidate) => !candidate.occupied && candidate.matchKey === item.matchKey);
    if (!target) return;
    const start = item.node.position.clone();
    const direction = target.position.clone().subtract(start).multiplyScalar(0.22);
    tween(item.node)
      .stop()
      .to(0.28, { position: start.clone().add(direction), scale: new Vec3(1.12, 1.12, 1) }, { easing: 'quadOut' })
      .to(0.34, { position: start, scale: Vec3.ONE }, { easing: 'backOut' })
      .start();
    tween(target.node)
      .stop()
      .to(0.18, { scale: new Vec3(1.12, 1.12, 1) })
      .to(0.26, { scale: Vec3.ONE }, { easing: 'backOut' })
      .start();
  }

  private playSceneCompletion(
    celebration: ColorCelebration,
    targets: ColorTarget[],
    done: () => void,
  ): void {
    targets.forEach((target, index) => {
      const origin = target.node.position.clone();
      if (celebration === 'balloon-fly') {
        tween(target.node)
          .delay(index * 0.08)
          .to(0.85, {
            position: origin.clone().add3f((index - 2) * 18, 230 + index * 20, 0),
            angle: index % 2 === 0 ? -12 : 12,
          }, { easing: 'sineOut' })
          .start();
        return;
      }
      if (celebration === 'fish-swim' || celebration === 'train-go') {
        tween(target.node)
          .delay(index * 0.07)
          .to(0.88, {
            position: origin.clone().add3f(celebration === 'train-go' ? 260 : 220, (index % 2 === 0 ? 1 : -1) * 26, 0),
            angle: celebration === 'fish-swim' ? (index % 2 === 0 ? 5 : -5) : 0,
          }, { easing: 'quadInOut' })
          .start();
        return;
      }
      tween(target.node)
        .delay(index * 0.07)
        .to(0.18, { position: origin.clone().add3f(0, 42, 0), scale: new Vec3(1.12, 1.12, 1) }, { easing: 'quadOut' })
        .to(0.22, { position: origin, scale: Vec3.ONE }, { easing: 'backOut' })
        .to(0.15, { angle: -8 })
        .to(0.15, { angle: 8 })
        .to(0.12, { angle: 0 })
        .start();
    });
    if (targets[0]) {
      tween(targets[0].node).delay(1.15).call(done).start();
    } else {
      done();
    }
  }

  private getTargetPositions(kind: ColorSceneKind, count: number): Point[] {
    if (kind === 'train') {
      const gap = count === 3 ? 210 : count === 4 ? 170 : 145;
      return Array.from({ length: count }, (_, index) => ({
        x: -230 + index * gap,
        y: -30,
      }));
    }
    if (kind === 'fish') {
      const gap = count === 3 ? 280 : count === 4 ? 205 : 165;
      return Array.from({ length: count }, (_, index) => ({
        x: (index - (count - 1) / 2) * gap,
        y: 50 + (index % 2 === 0 ? 55 : -35),
      }));
    }
    if (kind === 'orchard') {
      const gap = count === 3 ? 270 : count === 4 ? 205 : 165;
      return Array.from({ length: count }, (_, index) => ({
        x: (index - (count - 1) / 2) * gap,
        y: 58 + (index % 2 === 0 ? 82 : 5),
      }));
    }
    const gap = count === 3 ? 270 : count === 4 ? 205 : 160;
    return Array.from({ length: count }, (_, index) => ({
      x: (index - (count - 1) / 2) * gap,
      y: 48 + (index % 2 === 0 ? 76 : 12),
    }));
  }

  private getTargetSize(kind: ColorSceneKind, count: number): number {
    if (kind === 'train') return count >= 5 ? 100 : 118;
    if (kind === 'fish') return count >= 5 ? 112 : 132;
    return count >= 5 ? 108 : 126;
  }

  private getTrayStarts(count: number, oneByOne: boolean): Point[] {
    if (oneByOne) {
      return Array.from({ length: count }, () => ({ x: 0, y: -280 }));
    }
    const gap = count === 3 ? 205 : count === 4 ? 170 : 142;
    return Array.from({ length: count }, (_, index) => ({
      x: (index - (count - 1) / 2) * gap,
      y: -280 + (index % 2 === 0 ? 4 : -4),
    }));
  }

  private playTargetIdle(node: Node, kind: ColorSceneKind, index: number): void {
    const origin = node.position.clone();
    if (kind === 'balloon' || kind === 'fish') {
      tween(node)
        .delay(index * 0.13)
        .repeatForever(
          tween<Node>()
            .to(0.8, { position: origin.clone().add3f(0, 7, 0), angle: index % 2 === 0 ? -2 : 2 }, { easing: 'sineInOut' })
            .to(0.8, { position: origin, angle: 0 }, { easing: 'sineInOut' }),
        )
        .start();
    }
  }

  private createBunny(parent: Node, x: number, y: number, scale: number): void {
    const bunny = this.createUiNode('ColorMascotBunny', parent, x, y, 170 * scale, 210 * scale);
    const bodyColor = new Color(250, 247, 237, 255);
    const leftEar = this.createToyShapeLayer(bunny, 'EarLeft', -34 * scale, 73 * scale, 72 * scale, 'oval', bodyColor);
    leftEar.angle = 82;
    const rightEar = this.createToyShapeLayer(bunny, 'EarRight', 34 * scale, 73 * scale, 72 * scale, 'oval', bodyColor);
    rightEar.angle = 98;
    this.createCircle(bunny, 0, 12 * scale, 62 * scale, bodyColor);
    this.createCircle(bunny, 0, -60 * scale, 55 * scale, bodyColor);
    this.createCuteFace(bunny, 0, 15 * scale, 30 * scale);
    this.createCircle(bunny, -48 * scale, 2 * scale, 10 * scale, new Color(247, 151, 155, 95));
    this.createCircle(bunny, 48 * scale, 2 * scale, 10 * scale, new Color(247, 151, 155, 95));
  }

  private createCoral(parent: Node, x: number, y: number, color: Color): void {
    const coral = this.createUiNode('Coral', parent, x, y, 120, 160);
    [-34, 0, 34].forEach((branchX, index) => {
      const branch = this.createPanel(
        coral,
        'CoralBranch',
        branchX,
        index === 1 ? 14 : -4,
        22,
        index === 1 ? 130 : 94,
        color,
        11,
      );
      branch.angle = index === 0 ? -18 : index === 2 ? 18 : 0;
    });
  }

  private createTrainEngine(parent: Node, x: number, y: number, accent: Color): void {
    const engine = this.createUiNode('TrainEngine', parent, x, y, 180, 160);
    this.createPanel(engine, 'EngineBody', 10, 0, 130, 80, accent, 22);
    this.createPanel(engine, 'EngineCab', 35, 48, 66, 66, new Color(255, 190, 55, 255), 15);
    this.createPanel(engine, 'EngineChimney', -38, 48, 28, 68, new Color(72, 131, 194, 255), 10);
    this.createCircle(engine, -32, -52, 24, new Color(66, 68, 73, 255));
    this.createCircle(engine, 48, -52, 24, new Color(66, 68, 73, 255));
    this.createCuteFace(engine, 4, 2, 23);
  }

  private shuffle<T>(values: T[]): T[] {
    for (let index = values.length - 1; index > 0; index--) {
      const swap = Math.floor(Math.random() * (index + 1));
      [values[index], values[swap]] = [values[swap], values[index]];
    }
    return values;
  }
}
