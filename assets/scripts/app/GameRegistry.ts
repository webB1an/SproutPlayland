export type MiniGameId = 'scratch' | 'shadow' | 'bubble' | 'memory';

export type GameCardId = 'puzzle' | MiniGameId;

export type GamePalette = {
  card: readonly [number, number, number];
  depth: readonly [number, number, number];
  accent: readonly [number, number, number];
  background: readonly [number, number, number];
};

export type GameCardDefinition = {
  id: GameCardId;
  title: string;
  subtitle: string;
  palette: GamePalette;
};

export type MiniGameDefinition = GameCardDefinition & {
  id: MiniGameId;
  selectTitle: string;
  instruction: string;
  completionText: string;
};

export const GAME_CARDS: readonly GameCardDefinition[] = [
  {
    id: 'puzzle',
    title: '欢乐拼图',
    subtitle: '拼出完整画面',
    palette: {
      card: [220, 240, 194],
      depth: [112, 166, 91],
      accent: [99, 174, 91],
      background: [242, 236, 218],
    },
  },
  {
    id: 'scratch',
    title: '擦擦发现',
    subtitle: '拨开云朵找朋友',
    palette: {
      card: [255, 229, 174],
      depth: [223, 155, 75],
      accent: [245, 177, 72],
      background: [255, 244, 218],
    },
  },
  {
    id: 'shadow',
    title: '恐龙配对',
    subtitle: '找到一样的恐龙',
    palette: {
      card: [226, 216, 249],
      depth: [134, 111, 196],
      accent: [155, 130, 219],
      background: [242, 236, 255],
    },
  },
  {
    id: 'bubble',
    title: '泡泡找找',
    subtitle: '找到指定的恐龙',
    palette: {
      card: [200, 235, 249],
      depth: [75, 151, 188],
      accent: [84, 174, 214],
      background: [224, 247, 255],
    },
  },
  {
    id: 'memory',
    title: '恐龙翻翻',
    subtitle: '找到相同的伙伴',
    palette: {
      card: [250, 218, 231],
      depth: [190, 105, 143],
      accent: [220, 126, 166],
      background: [255, 239, 247],
    },
  },
] as const;

export const MINI_GAME_DEFINITIONS: Readonly<Record<MiniGameId, MiniGameDefinition>> = {
  scratch: {
    ...GAME_CARDS[1],
    id: 'scratch',
    selectTitle: '选一幅图来擦一擦',
    instruction: '用手指拨开云朵',
    completionText: '藏起来的朋友出现啦！',
  },
  shadow: {
    ...GAME_CARDS[2],
    id: 'shadow',
    selectTitle: '选一组恐龙来配对',
    instruction: '把下面的恐龙放到上面一样的图片里',
    completionText: '一样的恐龙都配对成功啦！',
  },
  bubble: {
    ...GAME_CARDS[3],
    id: 'bubble',
    selectTitle: '选一只恐龙开始寻找',
    instruction: '点破装着目标恐龙的泡泡',
    completionText: '三个目标都找到啦！',
  },
  memory: {
    ...GAME_CARDS[4],
    id: 'memory',
    selectTitle: '选一组恐龙来翻牌',
    instruction: '翻出两张一样的卡片',
    completionText: '所有恐龙伙伴都配对啦！',
  },
};

export function getMiniGameDefinition(id: MiniGameId): MiniGameDefinition {
  return MINI_GAME_DEFINITIONS[id];
}

export function isMiniGameId(id: GameCardId): id is MiniGameId {
  return id !== 'puzzle';
}
