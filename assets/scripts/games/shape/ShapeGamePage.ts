import { Color, Node, Sprite, tween, UIOpacity, Vec3 } from 'cc';
import { MatchGamePageBase } from '../common/MatchGamePageBase';
import type { MatchItemState } from '../common/MatchTypes';
import type { ShapeGameFlow } from './ShapeGameFlow';

type TurtlePartSpec = {
  id: string;
  frame: string;
  target: Vec3;
  start: Vec3;
  width: number;
  height: number;
  trayScale: number;
  restAngle: number;
};

type TurtlePartItem = MatchItemState & {
  progressIndex: number;
  targetHint: Node;
};

/** 森林小医生：把散落的柔软部件送回小乌龟身上。 */
export class ShapeGamePage extends MatchGamePageBase {
  private readonly flow!: ShapeGameFlow;

  constructor(app: any, flow: ShapeGameFlow) {
    super(app);
    Object.defineProperty(this, 'flow', { value: flow });
  }

  show(): void {
    this.matchCompleted = false;
    const difficulty = this.flow.getDifficulty();
    const root = this.resetScreen('ShapeGame');
    this.drawFullBackground(root, new Color(219, 240, 248, 255));
    const backdrop = this.createCoverImage(
      root,
      this.frames.has('forest-turtle-board-bg') ? 'forest-turtle-board-bg' : 'shape-workshop-bg',
      0,
      0,
      this.visibleWidth,
      this.designHeight,
    );
    backdrop.name = 'ForestTurtleBoard';
    this.createBackButton(root, () => this.flow.showSelect());

    const parts = this.getTurtleParts();
    const progress = this.createPanel(root, 'PartProgress', 0, 330, 278, 58, new Color(255, 252, 226, 238), 28);
    const progressIcons: Node[] = [];
    for (let index = 0; index < parts.length; index++) {
      const spec = parts[index];
      const icon = this.createImage(progress, spec.frame, (index - 1.5) * 56, 0, 48, 48);
      icon.addComponent(UIOpacity).opacity = 76;
      progressIcons.push(icon);
    }

    const hintOpacity = difficulty === 1 ? 112 : difficulty === 2 ? 72 : 42;
    const targetHints = parts.map((spec, index) => {
      const hint = this.createImage(root, spec.frame, spec.target.x, spec.target.y, spec.width, spec.height);
      hint.name = `TurtlePartHint${index}`;
      hint.addComponent(UIOpacity).opacity = hintOpacity;
      return hint;
    });

    const order = this.shuffle(parts.map((_, index) => index));
    const pieceLayerBase = root.children.length;
    const items: TurtlePartItem[] = order.map((partIndex, displayIndex) => {
      const spec = parts[partIndex];
      const shuffledStart = parts[displayIndex].start;
      const piece = this.createImage(root, spec.frame, shuffledStart.x, shuffledStart.y, spec.width, spec.height);
      piece.name = `TurtlePart${spec.id}`;
      const difficultyTurn = difficulty === 1 ? 0 : difficulty === 2 ? spec.restAngle : spec.restAngle * 1.7;
      piece.angle = difficultyTurn;
      piece.setScale(new Vec3(spec.trayScale * 0.7, spec.trayScale * 0.7, 1));
      tween(piece)
        .delay(0.18 + displayIndex * 0.08)
        .to(0.42, { scale: new Vec3(spec.trayScale, spec.trayScale, 1) }, { easing: 'backOut' })
        .start();
      return {
        node: piece,
        start: shuffledStart,
        target: spec.target,
        dropArea: {
          center: spec.target,
          width: difficulty === 1 ? spec.width + 120 : difficulty === 2 ? spec.width + 82 : spec.width + 54,
          height: difficulty === 1 ? spec.height + 100 : difficulty === 2 ? spec.height + 70 : spec.height + 48,
        },
        snapDistance: difficulty === 1 ? 96 : difficulty === 2 ? 76 : 62,
        matchedScale: 1,
        matchedSiblingIndex: pieceLayerBase + partIndex,
        targetAngle: 0,
        restAngle: difficultyTurn,
        restScale: spec.trayScale,
        matched: false,
        progressIndex: partIndex,
        targetHint: targetHints[partIndex],
      };
    });

    this.createHelpButton(root, () => this.playHint(items));
    this.bindMatchGame(root, items, {
      complete: () => this.flow.complete(),
      replay: () => this.flow.replay(),
      select: () => this.flow.showSelect(),
      next: () => this.flow.next(),
      onPickup: (item) => this.focusTarget(item as TurtlePartItem, hintOpacity),
      onWrong: (item) => this.playWrongFeedback(item as TurtlePartItem, hintOpacity),
      onMatched: (item) => {
        const part = item as TurtlePartItem;
        part.targetHint.getComponent(UIOpacity)!.opacity = 0;
        const icon = progressIcons[part.progressIndex];
        icon.getComponent(UIOpacity)!.opacity = 255;
        tween(icon)
          .to(0.16, { scale: new Vec3(1.2, 1.2, 1) }, { easing: 'quadOut' })
          .to(0.24, { scale: Vec3.ONE }, { easing: 'backOut' })
          .start();
        tween(part.node)
          .to(0.14, { scale: new Vec3(1.08, 1.08, 1) }, { easing: 'quadOut' })
          .to(0.22, { scale: Vec3.ONE }, { easing: 'backOut' })
          .start();
      },
    });
  }

  private getTurtleParts(): TurtlePartSpec[] {
    return [
      {
        id: 'shell', frame: 'turtle-shell', target: new Vec3(113, 114), start: new Vec3(-285, -166),
        width: 250, height: 112, trayScale: 0.7, restAngle: -9,
      },
      {
        id: 'wing', frame: 'turtle-wing', target: new Vec3(129, 24), start: new Vec3(-95, -166),
        width: 120, height: 90, trayScale: 0.92, restAngle: 11,
      },
      {
        id: 'leg', frame: 'turtle-leg', target: new Vec3(-28, 16), start: new Vec3(100, -166),
        width: 120, height: 160, trayScale: 0.78, restAngle: -8,
      },
      {
        id: 'ear', frame: 'turtle-ear', target: new Vec3(-22, 270), start: new Vec3(290, -166),
        width: 61, height: 138, trayScale: 0.84, restAngle: 10,
      },
    ];
  }

  private focusTarget(item: TurtlePartItem, baseOpacity: number): void {
    const opacity = item.targetHint.getComponent(UIOpacity)!;
    opacity.opacity = Math.max(150, baseOpacity);
    tween(item.targetHint)
      .stop()
      .to(0.16, { scale: new Vec3(1.08, 1.08, 1) }, { easing: 'quadOut' })
      .to(0.24, { scale: Vec3.ONE }, { easing: 'backOut' })
      .start();
  }

  private playWrongFeedback(item: TurtlePartItem, baseOpacity: number): void {
    item.targetHint.getComponent(UIOpacity)!.opacity = Math.max(126, baseOpacity);
    const origin = item.targetHint.position.clone();
    tween(item.targetHint)
      .stop()
      .to(0.07, { position: origin.clone().add3f(-8, 0, 0) })
      .to(0.07, { position: origin.clone().add3f(8, 0, 0) })
      .to(0.08, { position: origin })
      .call(() => { item.targetHint.getComponent(UIOpacity)!.opacity = baseOpacity; })
      .start();
  }

  private playHint(items: TurtlePartItem[]): void {
    const item = items.find((candidate) => !candidate.matched);
    if (!item) return;
    const current = item.node.position.clone();
    const direction = item.target.clone().subtract(current).multiplyScalar(0.2);
    this.focusTarget(item, item.targetHint.getComponent(UIOpacity)!.opacity);
    tween(item.node)
      .stop()
      .to(0.28, { position: current.clone().add(direction), scale: new Vec3(1.05, 1.05, 1) }, { easing: 'quadOut' })
      .to(0.38, { position: current, scale: new Vec3(this.getTrayScale(item), this.getTrayScale(item), 1) }, { easing: 'backOut' })
      .start();
  }

  private getTrayScale(item: TurtlePartItem): number {
    const part = this.getTurtleParts()[item.progressIndex];
    return part?.trayScale ?? 1;
  }

  private shuffle<T>(values: T[]): T[] {
    for (let index = values.length - 1; index > 0; index--) {
      const swap = Math.floor(Math.random() * (index + 1));
      [values[index], values[swap]] = [values[swap], values[index]];
    }
    return values;
  }
}
