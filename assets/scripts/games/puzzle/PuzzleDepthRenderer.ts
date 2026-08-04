// 拼图玩法专用的 2.5D 厚度渲染器。
import { Color, Graphics, Node } from 'cc';
import { getJigsawEdgePoints } from './PuzzleGeometry';
import type {
  JigsawCorners,
  JigsawEdgeName,
  JigsawEdges,
  Point2D,
} from './PuzzleTypes';

type UiNodeFactory = (
  name: string,
  parent: Node,
  x: number,
  y: number,
  width: number,
  height: number,
) => Node;

export class PuzzleDepthRenderer {
  constructor(private readonly createUiNode: UiNodeFactory) {}

  createEdge(
    parent: Node,
    name: string,
    size: number,
    edgeName: JigsawEdgeName,
    sign: number,
    edges: JigsawEdges,
    depthScale: number,
    corners: JigsawCorners,
    cornerRadius: number,
  ): Node {
    const extent = size + size * 0.48 * depthScale;
    const node = this.createUiNode(name, parent, 0, 0, extent, extent);
    const points = getJigsawEdgePoints(
      size,
      edgeName,
      sign,
      depthScale,
      corners,
      cornerRadius,
    );
    const sideColor = new Color(154, 113, 74, 255);
    const lowerColor = new Color(101, 70, 46, 96);
    const extrusion: Point2D = {
      x: clamp(size * 0.028, 4, 7),
      y: -clamp(size * 0.052, 8, 13),
    };
    const adjacentEdges: Record<
      JigsawEdgeName,
      [JigsawEdgeName, JigsawEdgeName]
    > = {
      top: ['left', 'right'],
      right: ['top', 'bottom'],
      bottom: ['right', 'left'],
      left: ['bottom', 'top'],
    };
    const [startAdjacentEdge, endAdjacentEdge] = adjacentEdges[edgeName];
    const capStart = sign !== 0 && edges[startAdjacentEdge] === 0;
    const capEnd = sign !== 0 && edges[endAdjacentEdge] === 0;

    const buildVariant = (
      variantName: string,
      useBoundaryCaps: boolean,
    ): Node => {
      const variant = this.createUiNode(
        variantName,
        node,
        0,
        0,
        extent,
        extent,
      );
      this.createBand(
        variant,
        'ExtrusionShadow',
        points,
        extrusion,
        1,
        1.38,
        new Color(53, 43, 35, 42),
        extent,
        edgeName,
        useBoundaryCaps && capStart,
        useBoundaryCaps && capEnd,
      );
      this.createBand(
        variant,
        'ExtrusionSide',
        points,
        extrusion,
        0,
        1,
        sideColor,
        extent,
        edgeName,
        useBoundaryCaps && capStart,
        useBoundaryCaps && capEnd,
      );
      this.createBand(
        variant,
        'ExtrusionLower',
        points,
        extrusion,
        0.58,
        1,
        lowerColor,
        extent,
        edgeName,
        useBoundaryCaps && capStart,
        useBoundaryCaps && capEnd,
      );
      this.createBand(
        variant,
        'ExtrusionRim',
        points,
        extrusion,
        0,
        0.18,
        new Color(242, 205, 151, 105),
        extent,
        edgeName,
        useBoundaryCaps && capStart,
        useBoundaryCaps && capEnd,
      );
      return variant;
    };

    buildVariant('FullExtrusion', false);
    const cappedVariant = buildVariant('BoundaryCappedExtrusion', true);
    cappedVariant.active = false;
    return node;
  }

  private createBand(
    parent: Node,
    name: string,
    points: Point2D[],
    normal: Point2D,
    fromDepth: number,
    toDepth: number,
    color: Color,
    extent: number,
    edgeName: JigsawEdgeName,
    capStart: boolean,
    capEnd: boolean,
  ): void {
    const band = this.createUiNode(name, parent, 0, 0, extent, extent);
    const graphics = band.addComponent(Graphics);
    graphics.fillColor = color;
    const perpendicularNormal: Point2D = edgeName === 'top' || edgeName === 'bottom'
      ? { x: 0, y: normal.y }
      : { x: normal.x, y: 0 };
    const capSpan = Math.max(
      1,
      Math.min(4, Math.floor((points.length - 1) / 3)),
    );
    const normalAt = (index: number): Point2D => {
      let blend = 1;
      if (capStart && index <= capSpan) {
        blend = Math.min(blend, index / capSpan);
      }
      if (capEnd && index >= points.length - 1 - capSpan) {
        blend = Math.min(blend, (points.length - 1 - index) / capSpan);
      }
      return {
        x: perpendicularNormal.x + (normal.x - perpendicularNormal.x) * blend,
        y: perpendicularNormal.y + (normal.y - perpendicularNormal.y) * blend,
      };
    };
    const first = points[0];
    const firstNormal = normalAt(0);
    graphics.moveTo(
      first.x + firstNormal.x * fromDepth,
      first.y + firstNormal.y * fromDepth,
    );
    for (let index = 1; index < points.length; index++) {
      const point = points[index];
      const pointNormal = normalAt(index);
      graphics.lineTo(
        point.x + pointNormal.x * fromDepth,
        point.y + pointNormal.y * fromDepth,
      );
    }
    for (let index = points.length - 1; index >= 0; index--) {
      const point = points[index];
      const pointNormal = normalAt(index);
      graphics.lineTo(
        point.x + pointNormal.x * toDepth,
        point.y + pointNormal.y * toDepth,
      );
    }
    graphics.close();
    graphics.fill();
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
