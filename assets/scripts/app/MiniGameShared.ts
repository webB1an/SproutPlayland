import {
  Color,
  EventTouch,
  Node,
  Sprite,
  tween,
  UIOpacity,
  UITransform,
  Vec3,
} from 'cc';
import type { PuzzleArtwork } from '../games/puzzle/PuzzleTypes';

export type DifficultyStars = 1 | 2 | 3;

export function getLevelDifficulty(
  levelIndex: number,
  totalLevels: number,
): DifficultyStars {
  const normalizedIndex = Math.max(0, Math.min(totalLevels - 1, levelIndex));
  const firstBoundary = Math.max(1, Math.ceil(totalLevels / 3));
  const secondBoundary = Math.max(firstBoundary + 1, Math.ceil(totalLevels * 2 / 3));
  if (normalizedIndex < firstBoundary) {
    return 1;
  }
  if (normalizedIndex < secondBoundary) {
    return 2;
  }
  return 3;
}

export function getNextLevelIndex(levelIndex: number, totalLevels: number): number {
  if (totalLevels <= 0) {
    return 0;
  }
  return (levelIndex + 1) % totalLevels;
}

export function createSeededRandom(seed: number): () => number {
  let state = (seed >>> 0) || 1;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

export function shuffleWithRandom<T>(items: readonly T[], random: () => number): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const target = Math.floor(random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

export function getWrappedArtworks(
  artworks: readonly PuzzleArtwork[],
  startIndex: number,
  count: number,
): PuzzleArtwork[] {
  if (artworks.length === 0 || count <= 0) {
    return [];
  }
  const result: PuzzleArtwork[] = [];
  const normalizedStart = ((startIndex % artworks.length) + artworks.length) % artworks.length;
  for (let index = 0; index < Math.min(count, artworks.length); index++) {
    result.push(artworks[(normalizedStart + index) % artworks.length]);
  }
  return result;
}

export function findFirstSprite(node: Node): Sprite | null {
  const ownSprite = node.getComponent(Sprite);
  if (ownSprite) {
    return ownSprite;
  }
  for (const child of node.children) {
    const sprite = findFirstSprite(child);
    if (sprite) {
      return sprite;
    }
  }
  return null;
}

export function setArtworkAppearance(
  node: Node,
  tint?: Color,
  opacity = 255,
): void {
  const sprite = findFirstSprite(node);
  if (sprite && tint) {
    sprite.color = tint;
  }
  const opacityComponent = node.getComponent(UIOpacity) ?? node.addComponent(UIOpacity);
  opacityComponent.opacity = Math.max(0, Math.min(255, opacity));
}

export type ArtworkTileOptions = {
  cornerRadius?: number;
  shadow?: boolean;
  tint?: Color;
  opacity?: number;
  borderColor?: Color;
  borderWidth?: number;
  backgroundColor?: Color;
};

export function createArtworkTile(
  app: any,
  parent: Node,
  artwork: PuzzleArtwork,
  x: number,
  y: number,
  size: number,
  options: ArtworkTileOptions = {},
): Node {
  const cornerRadius = options.cornerRadius ?? Math.max(18, size * 0.12);
  const tile = app.createUiNode('ArtworkTile', parent, x, y, size, size);
  if (options.shadow !== false) {
    app.createPanel(
      tile,
      'ArtworkTileShadow',
      4,
      -8,
      size,
      size,
      new Color(61, 76, 72, 34),
      cornerRadius,
    );
  }
  app.createPanel(
    tile,
    'ArtworkTileMat',
    0,
    0,
    size,
    size,
    options.backgroundColor ?? artwork.fallbackColor,
    cornerRadius,
    options.borderColor ?? new Color(255, 255, 246, 230),
    options.borderWidth ?? 3,
  );
  if (app.frames.has(artwork.thumbnailFrame)) {
    const image = app.createCoverImage(
      tile,
      artwork.thumbnailFrame,
      0,
      0,
      size - 10,
      size - 10,
      Math.max(14, cornerRadius - 5),
    );
    setArtworkAppearance(image, options.tint, options.opacity ?? 255);
  }
  return tile;
}

export type DragMatchItemState = {
  node: Node;
  start: Vec3;
  matchKey: string;
  matched: boolean;
  restScale?: number;
  restAngle?: number;
};

export type DragMatchTargetState = {
  node: Node;
  position: Vec3;
  matchKey: string;
  occupied: boolean;
  snapDistance: number;
};

type DragMatchCallbacks = {
  touchToRoot: (event: EventTouch) => Vec3;
  isCompleted: () => boolean;
  onPickup?: (item: DragMatchItemState) => void;
  onWrong?: (item: DragMatchItemState) => void;
  onTargetFocus?: (
    item: DragMatchItemState,
    target: DragMatchTargetState | null,
  ) => void;
  onMatched?: (
    item: DragMatchItemState,
    target: DragMatchTargetState,
  ) => void;
  onAllMatched: () => void;
};

/** 通用拖拽归位控制器，可继续复用于物品整理、喂食和轮廓配对。 */
export class DragMatchController {
  constructor(private readonly callbacks: DragMatchCallbacks) {}

  bind(
    surface: Node,
    items: DragMatchItemState[],
    targets: DragMatchTargetState[],
  ): void {
    let active: DragMatchItemState | null = null;
    let focusedTarget: DragMatchTargetState | null = null;
    let dragOffset = new Vec3();

    const setFocus = (target: DragMatchTargetState | null): void => {
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
      const restScale = active.restScale ?? 1;
      tween(active.node)
        .stop()
        .to(
          0.1,
          {
            scale: new Vec3(restScale * 1.07, restScale * 1.07, 1),
            angle: (active.restAngle ?? 0) * 0.25,
          },
          { easing: 'quadOut' },
        )
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
            0.2,
            {
              position: target.position,
              scale: Vec3.ONE,
              angle: 0,
            },
            { easing: 'backOut' },
          )
          .call(() => {
            this.callbacks.onMatched?.(item, target);
            if (items.every((candidate) => candidate.matched)) {
              this.callbacks.onAllMatched();
            }
          })
          .start();
        return;
      }
      this.callbacks.onWrong?.(item);
      const restScale = item.restScale ?? 1;
      tween(item.node)
        .stop()
        .to(
          0.32,
          {
            position: item.start,
            scale: new Vec3(restScale, restScale, 1),
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
    item: DragMatchItemState,
    targets: DragMatchTargetState[],
    allowNearHover: boolean,
  ): DragMatchTargetState | null {
    let nearest: DragMatchTargetState | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (const target of targets) {
      if (target.occupied || target.matchKey !== item.matchKey) {
        continue;
      }
      const distance = Vec3.distance(item.node.position, target.position);
      const eligible = distance <= target.snapDistance
        || (allowNearHover && distance <= target.snapDistance * 1.35);
      if (eligible && distance < nearestDistance) {
        nearest = target;
        nearestDistance = distance;
      }
    }
    return nearest;
  }

  private pickItem(point: Vec3, items: DragMatchItemState[]): DragMatchItemState | null {
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
      const halfWidth = transform.width * scaleX * 0.52;
      const halfHeight = transform.height * scaleY * 0.52;
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
    const surfaceSize = surface.getComponent(UITransform);
    const nodeSize = node.getComponent(UITransform);
    if (!surfaceSize || !nodeSize) {
      return position;
    }
    const marginX = nodeSize.width * Math.abs(node.scale.x || 1) * 0.34;
    const marginY = nodeSize.height * Math.abs(node.scale.y || 1) * 0.34;
    return new Vec3(
      Math.max(
        -surfaceSize.width / 2 + marginX,
        Math.min(surfaceSize.width / 2 - marginX, position.x),
      ),
      Math.max(
        -surfaceSize.height / 2 + marginY,
        Math.min(surfaceSize.height / 2 - marginY, position.y),
      ),
    );
  }
}

export type MiniGameCompletionOptions = {
  title: string;
  stars: DifficultyStars;
  onReplay: () => void;
  onNext: () => void;
  onExit: () => void;
};

/** 四个小游戏共用的完成卡片和庆祝粒子，保证奖励体验一致。 */
export class MiniGameCelebration {
  constructor(private readonly app: any) {}

  show(parent: Node, options: MiniGameCompletionOptions): void {
    const overlay = this.app.createUiNode(
      'MiniGameCompletion',
      parent,
      0,
      0,
      this.app.visibleWidth,
      this.app.designHeight,
    );
    this.app.createPanel(
      overlay,
      'CompletionShade',
      0,
      0,
      this.app.visibleWidth,
      this.app.designHeight,
      new Color(44, 57, 62, 142),
      0,
    );
    this.createConfetti(overlay);

    this.app.createPanel(
      overlay,
      'CompletionCardDepth',
      4,
      -10,
      570,
      420,
      new Color(73, 104, 92, 68),
      54,
    );
    const card = this.app.createPanel(
      overlay,
      'CompletionCard',
      0,
      0,
      570,
      420,
      new Color(255, 253, 235, 255),
      54,
      new Color(255, 255, 250, 245),
      4,
    );
    card.setScale(new Vec3(0.72, 0.72, 1));
    tween(card)
      .to(0.34, { scale: Vec3.ONE }, { easing: 'backOut' })
      .start();

    this.app.createLabel(
      card,
      options.title,
      0,
      122,
      34,
      new Color(65, 91, 72, 255),
      500,
      56,
    );
    for (let index = 0; index < 3; index++) {
      const star = this.app.createPuzzleStarMark(
        card,
        (index - 1) * 94,
        48,
        68,
        index < options.stars,
      );
      star.setScale(new Vec3(0.2, 0.2, 1));
      tween(star)
        .delay(0.12 + index * 0.12)
        .to(0.25, { scale: Vec3.ONE }, { easing: 'backOut' })
        .start();
    }

    this.createActionButton(
      card,
      -150,
      -105,
      new Color(112, 174, 126, 255),
      '‹',
      options.onExit,
    );
    this.createActionButton(
      card,
      0,
      -105,
      new Color(245, 179, 71, 255),
      '↻',
      options.onReplay,
    );
    this.createActionButton(
      card,
      150,
      -105,
      new Color(92, 174, 214, 255),
      '›',
      options.onNext,
    );
  }

  private createActionButton(
    parent: Node,
    x: number,
    y: number,
    color: Color,
    label: string,
    action: () => void,
  ): void {
    this.app.createCircle(parent, x, y - 7, 48, new Color(73, 92, 81, 60));
    const button = this.app.createCircle(parent, x, y, 48, color);
    this.app.createCircle(button, -13, 15, 8, new Color(255, 255, 248, 92));
    this.app.createLabel(
      button,
      label,
      0,
      label === '›' ? 4 : 2,
      48,
      new Color(255, 255, 246, 255),
      72,
      68,
    );
    this.app.makeButton(button, action);
  }

  private createConfetti(parent: Node): void {
    const colors = [
      new Color(255, 189, 70, 255),
      new Color(102, 190, 219, 255),
      new Color(231, 126, 168, 255),
      new Color(118, 181, 105, 255),
      new Color(164, 132, 225, 255),
    ];
    const random = createSeededRandom(Date.now() & 0xffff);
    for (let index = 0; index < 34; index++) {
      const startX = (random() - 0.5) * 530;
      const startY = 10 + random() * 120;
      const piece = this.app.createPanel(
        parent,
        'Confetti',
        startX,
        startY,
        10 + random() * 12,
        18 + random() * 18,
        colors[index % colors.length],
        5,
      );
      piece.angle = random() * 180;
      const targetX = startX + (random() - 0.5) * 380;
      const targetY = -250 - random() * 130;
      tween(piece)
        .delay(random() * 0.28)
        .to(
          0.85 + random() * 0.55,
          {
            position: new Vec3(targetX, targetY, 0),
            angle: piece.angle + 260 + random() * 320,
          },
          { easing: 'quadIn' },
        )
        .start();
    }
  }
}
