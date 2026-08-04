import { Node, Vec3 } from 'cc';

export type ToyShape =
  | 'circle'
  | 'square'
  | 'rectangle'
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

/**
 * 可拖动对象只描述自身，不再持有固定目标。
 * 目标由 MatchTargetState 独立管理，因此同一个形状可以匹配多个槽位，
 * 也可以通过 canMatch 扩展为颜色、形状或复合规则。
 */
export type MatchItemState = {
  id: string;
  node: Node;
  start: Vec3;
  matchKey: string;
  restAngle?: number;
  restScale?: number;
  matched: boolean;
};

export type MatchTargetState = {
  id: string;
  node: Node;
  position: Vec3;
  matchKey: string;
  dropArea?: MatchDropArea;
  snapDistance: number;
  matchedScale?: number;
  matchedSiblingIndex?: number;
  targetAngle?: number;
  occupied: boolean;
};

export type MatchRule = (
  item: MatchItemState,
  target: MatchTargetState,
) => boolean;

export type MatchCompletionOptions = {
  complete: () => number;
  replay: () => void;
  select: () => void;
  next: () => void;
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
  /**
   * 先播放关卡专属动画，完成后调用 done，再进入通用彩带和星级弹层。
   */
  beforeCelebrate?: (done: () => void) => void;
};
