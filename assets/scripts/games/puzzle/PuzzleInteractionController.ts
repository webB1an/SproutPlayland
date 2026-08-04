// 拼图玩法专用的拖动、吸附与连接状态控制器。
import {
  EventTouch,
  Node,
  tween,
  UIOpacity,
  UITransform,
  Vec3,
} from 'cc';
import type {
  JigsawEdgeName,
  PuzzlePieceState,
} from './PuzzleTypes';

type PuzzleInteractionCallbacks = {
  touchToRoot: (event: EventTouch) => Vec3;
  isCompleted: () => boolean;
  onPiecePickedUp?: () => void;
  onPieceDropped?: () => void;
  onPieceSnapped?: () => void;
  onAllSnapped: () => void;
};

export class PuzzleInteractionController {
  constructor(private readonly callbacks: PuzzleInteractionCallbacks) {}

  bindDragSurface(surface: Node, pieces: PuzzlePieceState[]): void {
    let activePiece: PuzzlePieceState | null = null;
    let dragOffset = new Vec3();
    let lastX = 0;

    surface.on(Node.EventType.TOUCH_START, (event: EventTouch) => {
      if (this.callbacks.isCompleted()) {
        return;
      }
      const position = this.callbacks.touchToRoot(event);
      const piece = this.pickVisiblePiece(position, pieces);
      if (!piece) {
        return;
      }
      activePiece = piece;
      this.callbacks.onPiecePickedUp?.();
      piece.node.setPosition(this.constrainToSurface(
        piece,
        piece.node.position,
        surface,
        piece.restAngle * 0.3,
        1.018,
      ));
      dragOffset = piece.node.position.clone().subtract(position);
      lastX = piece.node.position.x;
      piece.node.setSiblingIndex(piece.node.parent!.children.length - 1);
      piece.shadow.active = true;
      piece.depth.active = true;
      piece.shadow.getComponent(UIOpacity)!.opacity = 255;
      piece.depth.getComponent(UIOpacity)!.opacity = 255;
      tween(piece.node)
        .stop()
        .to(
          0.11,
          {
            scale: new Vec3(1.018, 1.018, 1),
            angle: piece.restAngle * 0.3,
          },
          { easing: 'quadOut' },
        )
        .start();
      tween(piece.shadow)
        .stop()
        .to(
          0.11,
          {
            position: new Vec3(7, -14),
            scale: new Vec3(1.015, 1.015, 1),
          },
        )
        .start();
    });

    surface.on(Node.EventType.TOUCH_MOVE, (event: EventTouch) => {
      const piece = activePiece;
      if (!piece || piece.snapped || this.callbacks.isCompleted()) {
        return;
      }
      const position = this.callbacks.touchToRoot(event).add(dragOffset);
      const deltaX = position.x - lastX;
      const angle = this.clamp(-deltaX * 0.22, -3.5, 3.5);
      piece.node.angle = angle;
      const constrainedPosition = this.constrainToSurface(
        piece,
        position,
        surface,
        angle,
        1.018,
      );
      piece.node.setPosition(constrainedPosition);
      lastX = constrainedPosition.x;
    });

    const finishDrag = () => {
      const piece = activePiece;
      activePiece = null;
      if (!piece || piece.snapped || this.callbacks.isCompleted()) {
        return;
      }
      const distance = Vec3.distance(piece.node.position, piece.target);
      if (distance < piece.snapDistance) {
        piece.snapped = true;
        this.callbacks.onPieceSnapped?.();
        this.refreshConnections(pieces);
        tween(piece.node)
          .stop()
          .to(
            0.13,
            {
              position: new Vec3(piece.target.x, piece.target.y + 4),
              scale: new Vec3(1.004, 1.004, 1),
              angle: 0,
            },
            { easing: 'quadOut' },
          )
          .to(
            0.15,
            {
              position: piece.target,
              scale: Vec3.ONE,
            },
            { easing: 'quadInOut' },
          )
          .call(() => {
            this.refreshConnections(pieces);
            if (pieces.every((item) => item.snapped)) {
              this.callbacks.onAllSnapped();
            }
          })
          .start();
        const shadowOpacity = piece.shadow.getComponent(UIOpacity)!;
        tween(shadowOpacity)
          .stop()
          .to(0.24, { opacity: 0 }, { easing: 'quadIn' })
          .call(() => {
            piece.shadow.active = false;
          })
          .start();
        tween(piece.shadow)
          .stop()
          .to(
            0.2,
            {
              position: new Vec3(5, -10),
              scale: Vec3.ONE,
            },
          )
          .start();
      } else {
        this.callbacks.onPieceDropped?.();
        const landingPosition = this.constrainToSurface(
          piece,
          piece.node.position,
          surface,
          piece.restAngle,
          1,
        );
        tween(piece.node)
          .stop()
          .to(
            0.16,
            {
              position: landingPosition,
              scale: Vec3.ONE,
              angle: piece.restAngle,
            },
            { easing: 'quadOut' },
          )
          .start();
        tween(piece.shadow)
          .stop()
          .to(
            0.2,
            {
              position: new Vec3(5, -10),
              scale: Vec3.ONE,
            },
          )
          .start();
      }
    };

    surface.on(Node.EventType.TOUCH_END, finishDrag);
    surface.on(Node.EventType.TOUCH_CANCEL, finishDrag);
  }

  private pickVisiblePiece(
    position: Vec3,
    pieces: PuzzlePieceState[],
  ): PuzzlePieceState | null {
    const candidates = pieces
      .filter((piece) => !piece.snapped)
      .sort((left, right) => right.node.getSiblingIndex() - left.node.getSiblingIndex());
    for (const piece of candidates) {
      const deltaX = position.x - piece.node.position.x;
      const deltaY = position.y - piece.node.position.y;
      const radians = piece.node.angle * Math.PI / 180;
      const cosine = Math.cos(radians);
      const sine = Math.sin(radians);
      const scaleX = Math.max(0.0001, Math.abs(piece.node.scale.x));
      const scaleY = Math.max(0.0001, Math.abs(piece.node.scale.y));
      const localX = (deltaX * cosine + deltaY * sine) / scaleX;
      const localY = (-deltaX * sine + deltaY * cosine) / scaleY;
      if (piece.containsLocalPoint(localX, localY)) {
        return piece;
      }
    }
    return null;
  }

  private constrainToSurface(
    piece: PuzzlePieceState,
    position: Readonly<Vec3>,
    surface: Node,
    angle: number,
    scale: number,
  ): Vec3 {
    const surfaceTransform = surface.getComponent(UITransform);
    const pieceTransform = piece.node.getComponent(UITransform);
    if (!surfaceTransform || !pieceTransform) {
      return new Vec3(position.x, position.y, position.z);
    }

    const radians = angle * Math.PI / 180;
    const cosine = Math.abs(Math.cos(radians));
    const sine = Math.abs(Math.sin(radians));
    const halfWidth = pieceTransform.contentSize.width * scale * 0.5;
    const halfHeight = pieceTransform.contentSize.height * scale * 0.5;
    const rotatedHalfWidth = halfWidth * cosine + halfHeight * sine;
    const rotatedHalfHeight = halfWidth * sine + halfHeight * cosine;
    const left = -surfaceTransform.contentSize.width * surfaceTransform.anchorPoint.x;
    const right = surfaceTransform.contentSize.width * (1 - surfaceTransform.anchorPoint.x);
    const bottom = -surfaceTransform.contentSize.height * surfaceTransform.anchorPoint.y;
    const top = surfaceTransform.contentSize.height * (1 - surfaceTransform.anchorPoint.y);

    return new Vec3(
      this.clampWithinBounds(position.x, left + rotatedHalfWidth, right - rotatedHalfWidth),
      this.clampWithinBounds(position.y, bottom + rotatedHalfHeight, top - rotatedHalfHeight),
      position.z,
    );
  }

  private clampWithinBounds(value: number, min: number, max: number): number {
    if (min > max) {
      return (min + max) * 0.5;
    }
    return this.clamp(value, min, max);
  }

  refreshConnections(pieces: PuzzlePieceState[]): void {
    const side = Math.sqrt(pieces.length);
    const directions: Record<JigsawEdgeName, { row: number; column: number }> = {
      top: { row: -1, column: 0 },
      right: { row: 0, column: 1 },
      bottom: { row: 1, column: 0 },
      left: { row: 0, column: -1 },
    };

    for (const piece of pieces) {
      if (!piece.snapped) {
        piece.shadow.active = true;
        piece.shadow.getComponent(UIOpacity)!.opacity = 255;
      }
      let hasVisibleExtrusion = false;
      (Object.keys(directions) as JigsawEdgeName[]).forEach((edgeName) => {
        const direction = directions[edgeName];
        const neighborRow = piece.row + direction.row;
        const neighborColumn = piece.column + direction.column;
        const neighbor = neighborRow >= 0
          && neighborColumn >= 0
          && neighborRow < side
          && neighborColumn < side
          ? pieces.find((item) => (
            item.row === neighborRow && item.column === neighborColumn
          ))
          : undefined;
        const ownsSharedSeam = !!neighbor
          && piece.node.getSiblingIndex() > neighbor.node.getSiblingIndex();
        const facesCamera = edgeName === 'right' || edgeName === 'bottom';
        const edgeHasExtrusion = facesCamera
          && (!piece.snapped || (!!neighbor && !neighbor.snapped));
        const edgeDepth = piece.openEdgeDepths[edgeName];
        edgeDepth.active = edgeHasExtrusion;
        const fullExtrusion = edgeDepth.getChildByName('FullExtrusion');
        const cappedExtrusion = edgeDepth.getChildByName('BoundaryCappedExtrusion');
        if (fullExtrusion && cappedExtrusion) {
          fullExtrusion.active = !piece.snapped;
          cappedExtrusion.active = piece.snapped;
        }
        hasVisibleExtrusion ||= edgeHasExtrusion;
        const connectsToImageFrame = !neighbor;
        piece.seamEdges[edgeName].active = (
          piece.snapped
          && (
            connectsToImageFrame
            || (!!neighbor?.snapped && ownsSharedSeam)
          )
        );
      });
      piece.depth.active = hasVisibleExtrusion;
      piece.depth.getComponent(UIOpacity)!.opacity = 255;
    }
    const pieceParent = pieces[0]?.node.parent;
    const playOutline = pieceParent?.getChildByName('PuzzlePlayOutline');
    if (pieceParent && playOutline && pieces.length > 0 && pieces.every((piece) => piece.snapped)) {
      playOutline.setSiblingIndex(pieceParent.children.length - 1);
    }
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }
}
