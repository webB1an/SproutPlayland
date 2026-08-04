import {
  EventTouch,
  Node,
  tween,
  UITransform,
  Vec3,
} from 'cc';
import type { MatchItemState } from './MatchTypes';

type MatchCallbacks = {
  touchToRoot: (event: EventTouch) => Vec3;
  isCompleted: () => boolean;
  onPickup?: (item: MatchItemState) => void;
  onWrong?: (item: MatchItemState) => void;
  onMatched?: (item: MatchItemState) => void;
  onAllMatched: () => void;
};

/** 跨游戏复用的拖拽、边界限制、正确吸附与错误回位控制器。 */
export class MatchInteractionController {
  constructor(private readonly callbacks: MatchCallbacks) {}

  bind(surface: Node, items: MatchItemState[]): void {
    let active: MatchItemState | null = null;
    let dragOffset = new Vec3();

    surface.on(Node.EventType.TOUCH_START, (event: EventTouch) => {
      if (this.callbacks.isCompleted()) {
        return;
      }
      const point = this.callbacks.touchToRoot(event);
      active = this.pickItem(point, items);
      if (!active) {
        return;
      }
      dragOffset = active.node.position.clone().subtract(point);
      active.node.setSiblingIndex(surface.children.length - 1);
      this.callbacks.onPickup?.(active);
      tween(active.node)
        .stop()
        .to(0.1, { scale: new Vec3(1.06, 1.06, 1) }, { easing: 'quadOut' })
        .start();
    });

    surface.on(Node.EventType.TOUCH_MOVE, (event: EventTouch) => {
      if (!active || active.matched || this.callbacks.isCompleted()) {
        return;
      }
      const point = this.callbacks.touchToRoot(event).add(dragOffset);
      active.node.setPosition(this.constrain(point, active.node, surface));
    });

    const finish = (): void => {
      const item = active;
      active = null;
      if (!item || item.matched || this.callbacks.isCompleted()) {
        return;
      }
      if (this.canSnap(item, items)) {
        item.matched = true;
        tween(item.node)
          .stop()
          .to(
            0.2,
            {
              position: item.target,
              scale: new Vec3(
                item.matchedScale ?? 1,
                item.matchedScale ?? 1,
                1,
              ),
              angle: item.targetAngle ?? 0,
            },
            { easing: 'backOut' },
          )
          .call(() => {
            if (item.matchedSiblingIndex !== undefined) {
              item.node.setSiblingIndex(item.matchedSiblingIndex);
            }
            this.callbacks.onMatched?.(item);
            if (items.every((candidate) => candidate.matched)) {
              this.callbacks.onAllMatched();
            }
          })
          .start();
        return;
      }
      this.callbacks.onWrong?.(item);
      tween(item.node)
        .stop()
        .to(
          0.34,
          {
            position: item.start,
            scale: new Vec3(item.restScale ?? 1, item.restScale ?? 1, 1),
            angle: item.restAngle ?? 0,
          },
          { easing: 'backOut' },
        )
        .start();
    };

    surface.on(Node.EventType.TOUCH_END, finish);
    surface.on(Node.EventType.TOUCH_CANCEL, finish);
  }

  private canSnap(item: MatchItemState, items: MatchItemState[]): boolean {
    if (item.dropArea) {
      const { center, width, height } = item.dropArea;
      return Math.abs(item.node.position.x - center.x) <= width / 2
        && Math.abs(item.node.position.y - center.y) <= height / 2;
    }
    const compatible = item.matchKey
      ? items.filter((candidate) => !candidate.matched && candidate.matchKey === item.matchKey)
      : [item];
    let nearest: MatchItemState | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (const candidate of compatible) {
      const dropTarget = candidate.dropTarget ?? candidate.target;
      const distance = Vec3.distance(item.node.position, dropTarget);
      if (distance <= candidate.snapDistance && distance < nearestDistance) {
        nearest = candidate;
        nearestDistance = distance;
      }
    }
    if (!nearest) {
      return false;
    }
    if (nearest !== item) {
      this.swapTargets(item, nearest);
    }
    return true;
  }

  private swapTargets(left: MatchItemState, right: MatchItemState): void {
    const keys: Array<keyof MatchItemState> = [
      'target',
      'dropTarget',
      'dropArea',
      'snapDistance',
      'matchedScale',
      'matchedSiblingIndex',
      'targetAngle',
      'restScale',
    ];
    for (const key of keys) {
      const value = left[key];
      (left as any)[key] = right[key];
      (right as any)[key] = value;
    }
  }

  private pickItem(point: Vec3, items: MatchItemState[]): MatchItemState | null {
    const candidates = items
      .filter((item) => !item.matched)
      .sort((left, right) => right.node.getSiblingIndex() - left.node.getSiblingIndex());
    for (const item of candidates) {
      const transform = item.node.getComponent(UITransform);
      if (!transform) {
        continue;
      }
      const halfWidth = transform.width * 0.55;
      const halfHeight = transform.height * 0.55;
      if (
        Math.abs(point.x - item.node.position.x) <= halfWidth
        && Math.abs(point.y - item.node.position.y) <= halfHeight
      ) {
        return item;
      }
    }
    return null;
  }

  private constrain(position: Vec3, node: Node, surface: Node): Vec3 {
    const surfaceSize = surface.getComponent(UITransform)!;
    const nodeSize = node.getComponent(UITransform)!;
    const marginX = nodeSize.width * 0.35;
    const marginY = nodeSize.height * 0.35;
    return new Vec3(
      Math.max(-surfaceSize.width / 2 + marginX, Math.min(surfaceSize.width / 2 - marginX, position.x)),
      Math.max(-surfaceSize.height / 2 + marginY, Math.min(surfaceSize.height / 2 - marginY, position.y)),
    );
  }
}
