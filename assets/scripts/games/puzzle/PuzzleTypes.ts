// 拼图玩法模块共享的数据类型。
import { Color, Node, Vec3 } from 'cc';

export type CategoryId = 'puzzle';

export type PuzzleShape = 'regular' | 'hexagon' | 'circle';

export type PuzzlePieceCount = 4 | 9 | 16;

export type JigsawEdges = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type JigsawEdgeName = keyof JigsawEdges;

export type JigsawCorners = {
  topLeft: boolean;
  topRight: boolean;
  bottomRight: boolean;
  bottomLeft: boolean;
};

export type Point2D = {
  x: number;
  y: number;
};

export type PuzzleArtwork = {
  id: string;
  title: string;
  thumbnailFrame: string;
  sourceFrame: string;
  fallbackColor: Color;
};

export type PuzzlePieceState = {
  node: Node;
  shadow: Node;
  depth: Node;
  openEdgeDepths: Record<JigsawEdgeName, Node>;
  seamEdges: Record<JigsawEdgeName, Node>;
  target: Vec3;
  start: Vec3;
  restAngle: number;
  snapDistance: number;
  row: number;
  column: number;
  snapped: boolean;
  containsLocalPoint: (x: number, y: number) => boolean;
};
