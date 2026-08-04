// 生成不接近原图排列的拼块托盘顺序。
const shuffle = (values: number[]): number[] => {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index--) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }
  return result;
};

const gridDistance = (left: number, right: number, side: number): number => {
  const leftRow = Math.floor(left / side);
  const leftColumn = left % side;
  const rightRow = Math.floor(right / side);
  const rightColumn = right % side;
  return Math.abs(leftRow - rightRow) + Math.abs(leftColumn - rightColumn);
};

const scoreTrayOrder = (order: number[], side: number): number => {
  let score = 0;
  for (let piece = 0; piece < order.length; piece++) {
    if (order[piece] === piece) {
      score += 100;
    }
    for (let other = piece + 1; other < order.length; other++) {
      if (
        gridDistance(piece, other, side) === 1
        && gridDistance(order[piece], order[other], side) === 1
      ) {
        score += 8;
      }
    }
  }
  return score;
};

/**
 * 返回“拼块索引 → 托盘格位”的映射。
 * 多次采样后选择固定位置最少、原相邻拼块再次相邻最少的一组。
 */
export const createShuffledTrayOrder = (pieceCount: number): number[] => {
  const side = Math.sqrt(pieceCount);
  const source = Array.from({ length: pieceCount }, (_, index) => index);
  let best = shuffle(source);
  let bestScore = scoreTrayOrder(best, side);
  const attempts = pieceCount === 4 ? 80 : pieceCount === 9 ? 64 : 48;

  for (let attempt = 1; attempt < attempts; attempt++) {
    const candidate = shuffle(source);
    const score = scoreTrayOrder(candidate, side);
    if (score < bestScore || (score === bestScore && Math.random() < 0.35)) {
      best = candidate;
      bestScore = score;
    }
    if (bestScore === 0) {
      break;
    }
  }
  return best;
};
