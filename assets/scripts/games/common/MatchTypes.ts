import { Node, Vec3 } from 'cc';

export type ToyShape =
  | 'circle'
  | 'square'
  | 'triangle'
  | 'hexagon'
  | 'star'
  | 'diamond'
  | 'heart'
  | 'oval';

export type MatchDifficulty = 1 | 2 | 3;

export type MatchLevelBase = {
  id: string;
};

export type MatchDropArea = {
  center: Vec3;
  width: number;
  height: number;
};

export type MatchItemState = {
  node: Node;
  start: Vec3;
  target: Vec3;
  dropTarget?: Vec3;
  dropArea?: MatchDropArea;
  snapDistance: number;
  matchedScale?: number;
  matchedSiblingIndex?: number;
  targetAngle?: number;
  matchKey?: string;
  restAngle?: number;
  restScale?: number;
  matched: boolean;
};

export type MatchCompletionOptions = {
  complete: () => number;
  replay: () => void;
  select: () => void;
  next: () => void;
  onPickup?: (item: MatchItemState) => void;
  onWrong?: (item: MatchItemState) => void;
  onMatched?: (item: MatchItemState) => void;
};
