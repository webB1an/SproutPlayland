import {
  EventTouch,
  Node,
  tween,
  UITransform,
  Vec3,
} from 'cc';
import type {
  MatchItemState,
  MatchRule,
  MatchTargetState,
} from './MatchTypes';

type MatchCallbacks = {
  touchToRoot: (event: EventTouch) => Vec3;
  isCompleted: () => boolean;
  canMatch?: MatchRule;
  onPickup?: (item: MatchItemState) => void;
  onWrong?: (item: MatchItemState) => void;
  onTargetFocus?: (
    item: MatchItemState,
    target: MatchTargetState | null,
  ) => void;
  onMatched?: (
    item: MatchItemState,
    target: MatchTargetState,
  ) => void;
  onAllMatched: () => void;
};

/**
 * 跨游戏复用的拖拽控制器。
 *
 * 与旧版不同，拼块和目标完全分离：一个拼块可以匹配多个兼容目标，
 * 因此可以直接支持“任意圆形轮胎”“任意红色容器”以及后续复合规则。
 */
export class MatchInteractionController {
  constructor(private readonly callbacks: MatchCallbacks) {}

  bind(
    surface: Node,
    items: MatchItemState[],
    targets: MatchTargetState[],
  ): void {
    let active: MatchItemState | null = null;
    let focusedTarget: MatchTargetState | null = null;
    let dragOffset = new Vec3();

    const setFocus = (target: MatchTargetState | null): void => {
      if (!active || focusedTarget === target) {
        return;
      }
      focusedTarget = target;
      this.callbacks.onTargetFocus?.(active, target);
    };

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
      const liftedScale = active.node.scale.clone().multiplyScalar(1.08);
      tween(active.node)
        .stop()
        .to(0.1, { scale: liftedScale }, { easing: 'quadOut' })
        .start();
    });

    surface.on(Node.EventType.TOUCH_MOVE, (event: EventTouch) => {
      if (!active || active.matched || this.callbacks.isCompleted()) {
        return;
      }
      const point = this.callbacks.touchToRoot(event).add(dragOffset);
      active.node.setPosition(this.constrain(point, active.node, surface));
      setFocus(this.findTarget(active, targets, true));
    });

    const finish = (): void => {
      const item = active;
      active = null;
      if (!item || item.matched || this.callbacks.isCompleted()) {
        focusedTarget = null;
        return;
      }

      const target = this.findTarget(item, targets, false);
      if (focusedTarget) {
        this.callbacks.onTargetFocus?.(item, null);
        focusedTarget = null;
      }

      if (target) {
        item.matched = true;
        target.occupied = true;
        tween(item.node)
          .stop()
          .to(
            0.22,
            {
              position: target.position,
              scale: new Vec3(
                target.matchedScale ?? 1,
                target.matchedScale ?? 1,
                1,
              ),
              angle: target.targetAngle ?? 0,
            },
            { easing: 'backOut' },
          )
          .call(() => {
            if (target.matchedSiblingIndex !== undefined) {
              item.node.setSiblingIndex(target.matchedSiblingIndex);
            }
            this.callbacks.onMatched?.(item, target);
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

  private findTarget(
    item: MatchItemState,
    targets: MatchTargetState[],
    allowNearHover: boolean,
  ): MatchTargetState | null {
    let nearest: MatchTargetState | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (const target of targets) {
      if (target.occupied || !this.canMatch(item, target)) {
        continue;
      }
      const distance = Vec3.distance(item.node.position, target.position);
      const inside = target.dropArea
        ? this.isInside(item.node.position, target.dropArea)
        : distance <= target.snapDistance;
      const hoverDistance = target.snapDistance * 1.45;
      const eligible = inside || (allowNearHover && distance <= hoverDistance);
      if (eligible && distance < nearestDistance) {
        nearest = target;
        nearestDistance = distance;
      }
    }
    return nearest;
  }

  private canMatch(item: MatchItemState, target: MatchTargetState): boolean {
    return this.callbacks.canMatch
      ? this.callbacks.canMatch(item, target)
      : item.matchKey === target.matchKey;
  }

  private isInside(position: Vec3, area: MatchTargetState['dropArea']): boolean {
    if (!area) {
      return false;
    }
    return Math.abs(position.x - area.center.x) <= area.width / 2
      && Math.abs(position.y - area.center.y) <= area.height / 2;
  }

  private pickItem(point: Vec3, items: MatchItemState[]): MatchItemState | null {
    const candidates = items
      .filter((item) => !item.matched && item.node.activeInHierarchy)
      .sort((left, right) => right.node.getSiblingIndex() - left.node.getSiblingIndex());
    for (const item of candidates) {
      const transform = item.node.getComponent(UITransform);
      if (!transform) {
        continue;
      }
      const scaleX = Math.abs(item.node.scale.x || 1);
      const scaleY = Math.abs(item.node.scale.y || 1);
      const halfWidth = transform.width * scaleX * 0.62;
      const halfHeight = transform.height * scaleY * 0.62;
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
    const marginX = nodeSize.width * Math.abs(node.scale.x || 1) * 0.28;
    const marginY = nodeSize.height * Math.abs(node.scale.y || 1) * 0.28;
    return new Vec3(
      Math.max(-surfaceSize.width / 2 + marginX, Math.min(surfaceSize.width / 2 - marginX, position.x)),
      Math.max(-surfaceSize.height / 2 + marginY, Math.min(surfaceSize.height / 2 - marginY, position.y)),
    );
  }
}
