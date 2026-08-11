// 拼图玩法的关卡与默认参数配置。
import { Color } from 'cc';
import type {
  PuzzleArtwork,
  PuzzlePieceCount,
  PuzzleShape,
} from './PuzzleTypes';

export const DESIGN_WIDTH = 1334;
export const DESIGN_HEIGHT = 750;

export const DEFAULT_PIECE_COUNT: PuzzlePieceCount = 4;
export const DEFAULT_PUZZLE_SHAPE: PuzzleShape = 'regular';

export const PUZZLE_ARTWORKS: PuzzleArtwork[] = [
  {
    id: 'sprout-garden',
    title: '小芽和太阳',
    thumbnailFrame: 'home-island-fullscene-thumb',
    sourceFrame: 'home-island-fullscene',
    fallbackColor: new Color(246, 229, 194, 255),
  },
  {
    id: 'dino-tyrannosaurus',
    title: '霸王龙',
    thumbnailFrame: 'dino-tyrannosaurus-thumb',
    sourceFrame: 'dino-tyrannosaurus',
    fallbackColor: new Color(190, 222, 116, 255),
  },
  {
    id: 'dino-triceratops',
    title: '三角龙',
    thumbnailFrame: 'dino-triceratops-thumb',
    sourceFrame: 'dino-triceratops',
    fallbackColor: new Color(121, 190, 230, 255),
  },
  {
    id: 'dino-brachiosaurus',
    title: '腕龙',
    thumbnailFrame: 'dino-brachiosaurus-thumb',
    sourceFrame: 'dino-brachiosaurus',
    fallbackColor: new Color(178, 151, 233, 255),
  },
  {
    id: 'dino-stegosaurus',
    title: '剑龙',
    thumbnailFrame: 'dino-stegosaurus-thumb',
    sourceFrame: 'dino-stegosaurus',
    fallbackColor: new Color(83, 183, 174, 255),
  },
  {
    id: 'dino-ankylosaurus',
    title: '甲龙',
    thumbnailFrame: 'dino-ankylosaurus-thumb',
    sourceFrame: 'dino-ankylosaurus',
    fallbackColor: new Color(239, 187, 75, 255),
  },
  {
    id: 'dino-velociraptor',
    title: '迅猛龙',
    thumbnailFrame: 'dino-velociraptor-thumb',
    sourceFrame: 'dino-velociraptor',
    fallbackColor: new Color(244, 143, 50, 255),
  },
  {
    id: 'dino-parasaurolophus',
    title: '副栉龙',
    thumbnailFrame: 'dino-parasaurolophus-thumb',
    sourceFrame: 'dino-parasaurolophus',
    fallbackColor: new Color(240, 112, 151, 255),
  },
  {
    id: 'dino-spinosaurus',
    title: '棘龙',
    thumbnailFrame: 'dino-spinosaurus-thumb',
    sourceFrame: 'dino-spinosaurus',
    fallbackColor: new Color(89, 166, 228, 255),
  },
  {
    id: 'dino-pachycephalosaurus',
    title: '肿头龙',
    thumbnailFrame: 'dino-pachycephalosaurus-thumb',
    sourceFrame: 'dino-pachycephalosaurus',
    fallbackColor: new Color(157, 196, 60, 255),
  },
  {
    id: 'dino-diplodocus',
    title: '梁龙',
    thumbnailFrame: 'dino-diplodocus-thumb',
    sourceFrame: 'dino-diplodocus',
    fallbackColor: new Color(163, 137, 231, 255),
  },
  {
    id: 'dino-pteranodon',
    title: '翼龙',
    thumbnailFrame: 'dino-pteranodon-thumb',
    sourceFrame: 'dino-pteranodon',
    fallbackColor: new Color(238, 111, 80, 255),
  },
  {
    id: 'dino-mosasaurus',
    title: '沧龙',
    thumbnailFrame: 'dino-mosasaurus-thumb',
    sourceFrame: 'dino-mosasaurus',
    fallbackColor: new Color(69, 181, 185, 255),
  },
];
