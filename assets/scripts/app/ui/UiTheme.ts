// 全项目共享的 UI 设计 token：颜色、圆角、字号、阴影。
// 页面与共享组件应从这里取视觉参数，避免魔法数字散落各处。
// 该模块是普通 TypeScript 模块，直接 import 使用，不经 PageController 代理。
import { Color } from 'cc';

export type RgbTuple = readonly [number, number, number];

/** 把 GameRegistry 里的 RGB 元组转成 Cocos Color。 */
export function toColor(rgb: RgbTuple, alpha = 255): Color {
  return new Color(rgb[0], rgb[1], rgb[2], alpha);
}

export const UI_COLORS = {
  /** 全局奶油底色（首页、语音设置页） */
  backgroundCream: [242, 236, 218],
  /** 页面主标题（深绿） */
  textPrimary: [61, 88, 65],
  /** 副标题、说明文字 */
  textSecondary: [103, 120, 98],
  /** 首页卡片标题 */
  textCardTitle: [63, 79, 66],
  /** 首页卡片副标题 */
  textCardSubtitle: [96, 111, 91],
  /** 已获得星星 */
  starEarned: [255, 199, 67],
  /** 未获得星星 */
  starEmpty: [239, 247, 242],
  /** 卡片内侧描边（暖白） */
  cardStroke: [255, 255, 244],
  /** 通用柔和投影色 */
  softShadow: [61, 76, 72],
  /** 完成弹窗金描边 */
  modalGold: [244, 187, 73],
  /** 完成弹窗底色 */
  modalFill: [255, 252, 226],
} as const satisfies Record<string, RgbTuple>;

export const UI_RADIUS = {
  s: 16,
  m: 24,
  l: 36,
  xl: 52,
} as const;

export const UI_FONT = {
  pageTitle: 42,
  instruction: 34,
  cardTitle: 28,
  body: 20,
  caption: 17,
} as const;

/** 手写伪阴影的统一参数：偏移与透明度。 */
export const UI_SHADOW = {
  offsetX: 4,
  offsetY: -8,
  alpha: 34,
} as const;
