// 拼图玩法专用的拼齿、圆角与边缘采样算法。
import { Graphics } from 'cc';
import type {
  JigsawCorners,
  JigsawEdgeName,
  JigsawEdges,
  Point2D,
  PuzzleShape,
} from './PuzzleTypes';

type MoveCommand = {
  kind: 'move';
  x: number;
  y: number;
};

type LineCommand = {
  kind: 'line';
  x: number;
  y: number;
};

type CubicCommand = {
  kind: 'cubic';
  control1: Point2D;
  control2: Point2D;
  end: Point2D;
};

type PathCommand = MoveCommand | LineCommand | CubicCommand;

const EMPTY_CORNERS: JigsawCorners = {
  topLeft: false,
  topRight: false,
  bottomRight: false,
  bottomLeft: false,
};

export function getJigsawEdges(
  row: number,
  column: number,
  side: number,
): JigsawEdges {
  const verticalSign = (edgeRow: number, edgeColumn: number): number => (
    (edgeRow * side + edgeColumn) % 2 === 0 ? 1 : -1
  );
  const horizontalSign = (edgeRow: number, edgeColumn: number): number => (
    (edgeRow * side + edgeColumn + 1) % 2 === 0 ? 1 : -1
  );
  return {
    top: row === 0 ? 0 : -horizontalSign(row - 1, column),
    right: column === side - 1 ? 0 : verticalSign(row, column),
    bottom: row === side - 1 ? 0 : horizontalSign(row, column),
    left: column === 0 ? 0 : -verticalSign(row, column - 1),
  };
}

export function getJigsawCorners(
  row: number,
  column: number,
  side: number,
): JigsawCorners {
  return {
    topLeft: row === 0 && column === 0,
    topRight: row === 0 && column === side - 1,
    bottomRight: row === side - 1 && column === side - 1,
    bottomLeft: row === side - 1 && column === 0,
  };
}

export function drawJigsawPath(
  graphics: Graphics,
  size: number,
  edges: JigsawEdges,
  depthScale = 1,
  corners: JigsawCorners = EMPTY_CORNERS,
  cornerRadius = 0,
): void {
  const edgeNames: JigsawEdgeName[] = ['top', 'right', 'bottom', 'left'];
  edgeNames.forEach((edgeName, edgeIndex) => {
    const commands = buildEdgeCommands(
      size,
      edgeName,
      edges[edgeName],
      depthScale,
      corners,
      cornerRadius,
    );
    renderCommands(graphics, commands, edgeIndex > 0);
  });
  graphics.close();
}

export function drawJigsawEdge(
  graphics: Graphics,
  size: number,
  edgeName: JigsawEdgeName,
  sign: number,
  depthScale = 1,
  corners: JigsawCorners = EMPTY_CORNERS,
  cornerRadius = 0,
): void {
  renderCommands(
    graphics,
    buildEdgeCommands(
      size,
      edgeName,
      sign,
      depthScale,
      corners,
      cornerRadius,
    ),
    false,
  );
}

export function getJigsawEdgePoints(
  size: number,
  edgeName: JigsawEdgeName,
  sign: number,
  depthScale: number,
  corners: JigsawCorners,
  cornerRadius: number,
): Point2D[] {
  const commands = buildEdgeCommands(
    size,
    edgeName,
    sign,
    depthScale,
    corners,
    cornerRadius,
  );
  const points: Point2D[] = [];
  commands.forEach((command) => {
    if (command.kind === 'move' || command.kind === 'line') {
      points.push({ x: command.x, y: command.y });
      return;
    }
    const start = points[points.length - 1];
    for (let step = 1; step <= 10; step++) {
      const t = step / 10;
      const inverse = 1 - t;
      points.push({
        x: inverse ** 3 * start.x
          + 3 * inverse ** 2 * t * command.control1.x
          + 3 * inverse * t ** 2 * command.control2.x
          + t ** 3 * command.end.x,
        y: inverse ** 3 * start.y
          + 3 * inverse ** 2 * t * command.control1.y
          + 3 * inverse * t ** 2 * command.control2.y
          + t ** 3 * command.end.y,
      });
    }
  });
  return points;
}

export function isPointInJigsawPath(
  x: number,
  y: number,
  size: number,
  edges: JigsawEdges,
  depthScale: number,
  corners: JigsawCorners,
  cornerRadius: number,
): boolean {
  const edgeNames: JigsawEdgeName[] = ['top', 'right', 'bottom', 'left'];
  const polygon: Point2D[] = [];
  edgeNames.forEach((edgeName, index) => {
    const points = getJigsawEdgePoints(
      size,
      edgeName,
      edges[edgeName],
      depthScale,
      corners,
      cornerRadius,
    );
    polygon.push(...(index === 0 ? points : points.slice(1)));
  });
  return isPointInPolygon(x, y, polygon);
}

export function isPointInPuzzleBoundary(
  kind: PuzzleShape,
  x: number,
  y: number,
  size: number,
  centerX = 0,
  centerY = 0,
): boolean {
  if (kind === 'regular') {
    return true;
  }
  const localX = x - centerX;
  const localY = y - centerY;
  const radius = size / 2;
  if (kind === 'circle') {
    return localX * localX + localY * localY <= radius * radius;
  }
  const polygon: Point2D[] = [];
  for (let index = 0; index < 6; index++) {
    const angle = Math.PI / 2 - index * Math.PI / 3;
    polygon.push({
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    });
  }
  return isPointInPolygon(localX, localY, polygon);
}

function buildEdgeCommands(
  size: number,
  edgeName: JigsawEdgeName,
  sign: number,
  depthScale: number,
  corners: JigsawCorners,
  cornerRadius: number,
): PathCommand[] {
  const half = size / 2;
  const shoulder = size * 0.2;
  const depth = size * 0.2 * depthScale;
  const radius = clamp(cornerRadius, 0, Math.max(0, half - shoulder - 2));
  const curve = radius * 0.5522848;
  const commands: PathCommand[] = [];
  const moveTo = (x: number, y: number): void => {
    commands.push({ kind: 'move', x, y });
  };
  const lineTo = (x: number, y: number): void => {
    commands.push({ kind: 'line', x, y });
  };
  const cubicTo = (
    control1: Point2D,
    control2: Point2D,
    end: Point2D,
  ): void => {
    commands.push({
      kind: 'cubic',
      control1,
      control2,
      end,
    });
  };

  if (edgeName === 'top') {
    if (corners.topLeft && radius > 0) {
      moveTo(-half, half - radius);
      cubicTo(
        { x: -half, y: half - radius + curve },
        { x: -half + radius - curve, y: half },
        { x: -half + radius, y: half },
      );
    } else {
      moveTo(-half, half);
    }
    lineTo(-shoulder, half);
    appendHorizontalTab(cubicTo, shoulder, half, depth, sign, true);
    lineTo(corners.topRight && radius > 0 ? half - radius : half, half);
    if (corners.topRight && radius > 0) {
      cubicTo(
        { x: half - radius + curve, y: half },
        { x: half, y: half - radius + curve },
        { x: half, y: half - radius },
      );
    }
    return commands;
  }

  if (edgeName === 'right') {
    moveTo(half, corners.topRight && radius > 0 ? half - radius : half);
    lineTo(half, shoulder);
    appendVerticalTab(cubicTo, shoulder, half, depth, sign, true);
    lineTo(half, corners.bottomRight && radius > 0 ? -half + radius : -half);
    if (corners.bottomRight && radius > 0) {
      cubicTo(
        { x: half, y: -half + radius - curve },
        { x: half - radius + curve, y: -half },
        { x: half - radius, y: -half },
      );
    }
    return commands;
  }

  if (edgeName === 'bottom') {
    moveTo(corners.bottomRight && radius > 0 ? half - radius : half, -half);
    lineTo(shoulder, -half);
    appendHorizontalTab(cubicTo, shoulder, -half, depth, sign, false);
    lineTo(corners.bottomLeft && radius > 0 ? -half + radius : -half, -half);
    if (corners.bottomLeft && radius > 0) {
      cubicTo(
        { x: -half + radius - curve, y: -half },
        { x: -half, y: -half + radius - curve },
        { x: -half, y: -half + radius },
      );
    }
    return commands;
  }

  moveTo(-half, corners.bottomLeft && radius > 0 ? -half + radius : -half);
  lineTo(-half, -shoulder);
  appendVerticalTab(cubicTo, shoulder, -half, depth, sign, false);
  lineTo(-half, corners.topLeft && radius > 0 ? half - radius : half);
  return commands;
}

function appendHorizontalTab(
  cubicTo: (control1: Point2D, control2: Point2D, end: Point2D) => void,
  shoulder: number,
  baseline: number,
  depth: number,
  sign: number,
  forward: boolean,
): void {
  if (sign === 0) {
    return;
  }
  const direction = forward ? 1 : -1;
  cubicTo(
    { x: -direction * shoulder * 0.62, y: baseline },
    {
      x: -direction * shoulder * 0.72,
      y: baseline + direction * sign * depth,
    },
    { x: 0, y: baseline + direction * sign * depth },
  );
  cubicTo(
    {
      x: direction * shoulder * 0.72,
      y: baseline + direction * sign * depth,
    },
    { x: direction * shoulder * 0.62, y: baseline },
    { x: direction * shoulder, y: baseline },
  );
}

function appendVerticalTab(
  cubicTo: (control1: Point2D, control2: Point2D, end: Point2D) => void,
  shoulder: number,
  baseline: number,
  depth: number,
  sign: number,
  forward: boolean,
): void {
  if (sign === 0) {
    return;
  }
  const direction = forward ? 1 : -1;
  cubicTo(
    { x: baseline, y: direction * shoulder * 0.62 },
    {
      x: baseline + direction * sign * depth,
      y: direction * shoulder * 0.72,
    },
    { x: baseline + direction * sign * depth, y: 0 },
  );
  cubicTo(
    {
      x: baseline + direction * sign * depth,
      y: -direction * shoulder * 0.72,
    },
    { x: baseline, y: -direction * shoulder * 0.62 },
    { x: baseline, y: -direction * shoulder },
  );
}

function renderCommands(
  graphics: Graphics,
  commands: PathCommand[],
  skipMove: boolean,
): void {
  commands.forEach((command) => {
    if (command.kind === 'move') {
      if (!skipMove) {
        graphics.moveTo(command.x, command.y);
      }
      return;
    }
    if (command.kind === 'line') {
      graphics.lineTo(command.x, command.y);
      return;
    }
    graphics.bezierCurveTo(
      command.control1.x,
      command.control1.y,
      command.control2.x,
      command.control2.y,
      command.end.x,
      command.end.y,
    );
  });
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function isPointInPolygon(x: number, y: number, polygon: Point2D[]): boolean {
  let inside = false;
  for (let current = 0, previous = polygon.length - 1; current < polygon.length; previous = current++) {
    const currentPoint = polygon[current];
    const previousPoint = polygon[previous];
    const crossesRay = (currentPoint.y > y) !== (previousPoint.y > y)
      && x < (
        (previousPoint.x - currentPoint.x)
        * (y - currentPoint.y)
        / (previousPoint.y - currentPoint.y)
        + currentPoint.x
      );
    if (crossesRay) {
      inside = !inside;
    }
  }
  return inside;
}
