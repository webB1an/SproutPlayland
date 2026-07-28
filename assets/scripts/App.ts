import {
  _decorator,
  Color,
  Component,
  EventTouch,
  Graphics,
  HorizontalTextAlignment,
  Label,
  Layers,
  Mask,
  Node,
  ResolutionPolicy,
  resources,
  Sprite,
  SpriteFrame,
  tween,
  UIOpacity,
  UITransform,
  Vec3,
  VerticalTextAlignment,
  view,
} from 'cc';

const { ccclass } = _decorator;

type PuzzlePieceState = {
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
};

type CategoryId = 'puzzle' | 'color' | 'shape';

type JigsawEdges = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

type JigsawEdgeName = keyof JigsawEdges;

type JigsawCorners = {
  topLeft: boolean;
  topRight: boolean;
  bottomRight: boolean;
  bottomLeft: boolean;
};

type Point2D = {
  x: number;
  y: number;
};

type PuzzleArtwork = {
  id: string;
  title: string;
  thumbnailFrame: string;
  sourceFrame: string;
  fallbackColor: Color;
};

@ccclass('SproutPlaylandApp')
export class SproutPlaylandApp extends Component {
  private readonly designWidth = 1334;
  private readonly designHeight = 750;
  private contentRoot: Node | null = null;
  private pieces: PuzzlePieceState[] = [];
  private completed = false;
  private frames = new Map<string, SpriteFrame>();
  private selectedPieceCount: 4 | 9 | 16 = 4;
  private selectedPuzzleShape: 'regular' | 'rotate' | 'irregular' = 'regular';
  private readonly puzzleArtworks: PuzzleArtwork[] = [
    {
      id: 'sprout-garden',
      title: '小芽和太阳',
      thumbnailFrame: 'home-island-fullscene',
      sourceFrame: 'home-island-fullscene',
      fallbackColor: new Color(246, 229, 194, 255),
    },
  ];
  private activePuzzleArtwork: PuzzleArtwork = this.puzzleArtworks[0];
  private customPuzzleSequence = 0;

  start(): void {
    view.setDesignResolutionSize(
      this.designWidth,
      this.designHeight,
      ResolutionPolicy.FIXED_HEIGHT,
    );

    resources.loadDir('art', SpriteFrame, (error, frames) => {
      if (!error) {
        for (const frame of frames) {
          this.frames.set(frame.name, frame);
        }
      }
      this.showHome();
    });
  }

  private showHome(): void {
    const root = this.resetScreen('Home');
    this.drawFullBackground(root, new Color(249, 247, 229, 255));
    this.createCircle(root, -615, 300, 160, new Color(224, 239, 198, 105));
    this.createCircle(root, 610, -330, 190, new Color(255, 220, 162, 72));
    this.createCircle(root, 42, 350, 78, new Color(205, 235, 224, 70));

    this.createLabel(root, '小芽智趣岛', -430, 305, 48, new Color(67, 94, 61, 255), 430, 68);
    this.createLabel(root, '今天想玩什么？', 250, 305, 38, new Color(67, 94, 61, 255), 650, 58);

    this.createCircle(root, -430, -86, 235, new Color(232, 241, 205, 135));
    this.createCircle(root, -430, -92, 188, new Color(255, 246, 211, 135));
    if (this.frames.has('home-island')) {
      this.createImage(root, 'home-island', -430, -78, 470, 470);
    } else {
      this.createSproutMark(root, -430, -70, 1.7);
    }
    this.createLabel(root, '点一点，去玩吧！', -430, -326, 23, new Color(108, 126, 91, 255), 380, 42);

    this.createCategoryCard(root, 'puzzle', -45, -45, new Color(223, 240, 197, 255), new Color(111, 169, 89, 255));
    this.createCategoryCard(root, 'color', 218, -45, new Color(255, 226, 193, 255), new Color(244, 146, 91, 255));
    this.createCategoryCard(root, 'shape', 481, -45, new Color(204, 232, 232, 255), new Color(74, 158, 163, 255));
  }

  private createCategoryCard(
    parent: Node,
    category: CategoryId,
    x: number,
    y: number,
    fill: Color,
    accent: Color,
  ): void {
    const title = category === 'puzzle' ? '拼图' : category === 'color' ? '颜色' : '形状';
    this.createPanel(parent, 'CategoryShadow', x + 3, y - 8, 230, 420, new Color(91, 75, 53, 20), 44);
    const card = this.createPanel(
      parent,
      `${category}Card`,
      x,
      y,
      230,
      420,
      fill,
      44,
      new Color(255, 255, 244, 200),
      4,
    );
    this.createCircle(card, 0, 92, 82, new Color(255, 255, 245, 185));
    if (category === 'puzzle') {
      if (this.frames.has('sprout-icon')) {
        this.createImage(card, 'sprout-icon', 0, 96, 130, 130);
      } else {
        this.createSproutMark(card, 0, 95, 0.78);
      }
    } else if (category === 'color') {
      this.createColorMark(card, 0, 95, 1);
    } else {
      this.createShapeMark(card, 0, 95, 1);
    }
    this.createLabel(card, title, 0, -35, 37, new Color(65, 83, 59, 255), 190, 55);
    this.createCircle(card, 0, -132, 34, accent);
    this.createLabel(card, '›', 2, -128, 43, new Color(255, 255, 244, 255), 50, 50);
    this.makeButton(card, () => this.showCategory(category));
  }

  private showCategory(category: CategoryId): void {
    const root = this.resetScreen('Category');
    const title = category === 'puzzle' ? '拼图岛' : category === 'color' ? '颜色乐园' : '形状世界';
    const subtitle = category === 'puzzle' ? '选一幅喜欢的图' : category === 'color' ? '和颜色做朋友' : '找找身边的形状';
    const bg = category === 'puzzle'
      ? new Color(240, 248, 235, 255)
      : category === 'color'
        ? new Color(255, 246, 229, 255)
        : new Color(233, 247, 247, 255);
    this.drawFullBackground(root, bg);
    this.createCircle(root, 620, 320, 145, new Color(255, 221, 160, 66));
    this.createCircle(root, -640, -340, 180, new Color(205, 232, 218, 70));
    this.createBackButton(root, () => this.showHome());
    this.createLabel(root, title, -380, 306, 42, new Color(61, 88, 65, 255), 360, 60);
    this.createLabel(root, subtitle, 240, 306, 25, new Color(112, 128, 96, 255), 500, 45);

    const names = category === 'puzzle'
      ? ['小芽和太阳', '花园朋友', '动物乐园']
      : category === 'color'
        ? ['认识颜色', '彩虹配对', '颜色小屋']
        : ['圆圆方方', '形状配对', '搭建小屋'];
    const fills = category === 'puzzle'
      ? [new Color(221, 239, 198, 255), new Color(255, 225, 185, 255), new Color(209, 232, 226, 255)]
      : category === 'color'
        ? [new Color(255, 221, 191, 255), new Color(231, 222, 249, 255), new Color(218, 239, 205, 255)]
        : [new Color(205, 234, 232, 255), new Color(255, 224, 185, 255), new Color(225, 224, 247, 255)];
    [-386, 0, 386].forEach((x, index) => {
      this.createLevelCard(root, category, index, names[index], x, -55, fills[index], category === 'puzzle' && index === 0);
    });
  }

  private createLevelCard(
    parent: Node,
    category: CategoryId,
    index: number,
    title: string,
    x: number,
    y: number,
    fill: Color,
    ready: boolean,
  ): void {
    this.createPanel(parent, 'LevelShadow', x + 3, y - 8, 326, 452, new Color(75, 65, 50, 18), 46);
    const card = this.createPanel(
      parent,
      'LevelCard',
      x,
      y,
      326,
      452,
      fill,
      46,
      new Color(255, 255, 245, 205),
      4,
    );
    this.createCircle(card, 0, 95, 112, new Color(255, 255, 245, 178));
    this.createLevelMark(card, category, index, 0, 100);
    this.createLabel(card, title, 0, -64, 31, new Color(67, 87, 62, 255), 280, 52);
    if (ready) {
      const play = this.createPanel(card, 'PlayBadge', 0, -147, 150, 60, new Color(255, 184, 73, 255), 30);
      this.createLabel(play, '去玩  ›', 0, 1, 25, new Color(102, 70, 34, 255), 125, 42);
    } else {
      const soon = this.createPanel(card, 'SoonBadge', 0, -147, 150, 56, new Color(255, 255, 244, 170), 28);
      this.createLabel(soon, '快来了', 0, 0, 22, new Color(125, 125, 105, 255), 120, 40);
    }
    if (ready) {
      this.makeButton(card, () => this.showGameDetail(category, index, title, true));
    }
  }

  private createLevelMark(parent: Node, category: CategoryId, index: number, x: number, y: number): void {
    if (category === 'puzzle' && index === 0) {
      const artwork = this.puzzleArtworks[index];
      if (artwork && this.frames.has(artwork.thumbnailFrame)) {
        this.createCoverImage(parent, artwork.thumbnailFrame, x, y, 210, 210);
      } else if (this.frames.has('sprout-icon')) {
        this.createImage(parent, 'sprout-icon', x - 42, y, 128, 128);
      } else {
        this.createSproutMark(parent, x - 42, y, 0.7);
      }
      if ((!artwork || !this.frames.has(artwork.thumbnailFrame)) && this.frames.has('sun-icon')) {
        this.createImage(parent, 'sun-icon', x + 52, y - 8, 112, 112);
      } else if (!artwork || !this.frames.has(artwork.thumbnailFrame)) {
        this.createSunMark(parent, x + 52, y - 8, 0.62);
      }
    } else if (category === 'color') {
      this.createColorMark(parent, x, y, 1.1);
    } else {
      this.createShapeMark(parent, x, y, 1.1);
    }
  }

  private showGameDetail(
    category: CategoryId,
    levelIndex: number,
    title: string,
    ready: boolean,
  ): void {
    if (category === 'puzzle' && levelIndex >= 0 && this.puzzleArtworks[levelIndex]) {
      this.activePuzzleArtwork = this.puzzleArtworks[levelIndex];
    }
    const root = this.resetScreen('GameDetail');
    this.drawFullBackground(root, new Color(218, 246, 250, 255));
    this.createPanel(root, 'PinkSide', 334, 0, 668, 750, new Color(247, 222, 244, 255), 0);
    this.createCircle(root, -610, -315, 190, new Color(174, 225, 246, 92));
    this.createCircle(root, 608, 320, 150, new Color(255, 205, 231, 82));
    this.createCircle(root, 0, 346, 92, new Color(255, 241, 185, 55));
    this.createBackButton(root, () => this.showCategory(category));

    this.createPanel(root, 'PreviewShadow', 3, 7, 458, 458, new Color(87, 71, 104, 20), 46);
    const preview = this.createPanel(
      root,
      'PreviewCard',
      0,
      13,
      458,
      458,
      new Color(255, 252, 238, 255),
      46,
      new Color(255, 255, 255, 225),
      4,
    );
    const previewBoard = this.createPanel(
      preview,
      'PuzzlePreviewBoard',
      0,
      0,
      402,
      402,
      new Color(255, 255, 247, 255),
      34,
      new Color(232, 221, 196, 255),
      3,
    );
    if (
      category === 'puzzle'
      && this.frames.has(this.activePuzzleArtwork.sourceFrame)
    ) {
      this.createCoverImage(
        previewBoard,
        this.activePuzzleArtwork.sourceFrame,
        0,
        0,
        374,
        374,
      );
    } else {
      this.createLevelMark(previewBoard, category, levelIndex, 0, 0);
    }
    this.createPuzzlePreviewOverlay(
      previewBoard,
      this.selectedPieceCount,
      this.selectedPuzzleShape,
    );

    this.createPuzzleCountButton(root, 4, -520, 188, this.selectedPieceCount === 4, () => {
      this.selectedPieceCount = 4;
      this.showGameDetail(category, levelIndex, title, ready);
    });
    this.createPuzzleCountButton(root, 9, -520, 28, this.selectedPieceCount === 9, () => {
      this.selectedPieceCount = 9;
      this.showGameDetail(category, levelIndex, title, ready);
    });
    this.createPuzzleCountButton(root, 16, -520, -132, this.selectedPieceCount === 16, () => {
      this.selectedPieceCount = 16;
      this.showGameDetail(category, levelIndex, title, ready);
    });

    this.createShapeOptionButton(root, 'regular', 520, 188, this.selectedPuzzleShape === 'regular', () => {
      this.selectedPuzzleShape = 'regular';
      this.showGameDetail(category, levelIndex, title, ready);
    });
    this.createShapeOptionButton(root, 'rotate', 520, 28, this.selectedPuzzleShape === 'rotate', () => {
      this.selectedPuzzleShape = 'rotate';
      this.showGameDetail(category, levelIndex, title, ready);
    });
    this.createShapeOptionButton(root, 'irregular', 520, -132, this.selectedPuzzleShape === 'irregular', () => {
      this.selectedPuzzleShape = 'irregular';
      this.showGameDetail(category, levelIndex, title, ready);
    });

    this.createPanel(root, 'StartDepth', 0, -316, 176, 78, ready ? new Color(45, 159, 53, 255) : new Color(168, 175, 156, 255), 38);
    const start = this.createPanel(
      root,
      'StartGame',
      0,
      -311,
      176,
      76,
      ready ? new Color(70, 205, 66, 255) : new Color(211, 216, 199, 255),
      38,
      new Color(255, 255, 255, 205),
      3,
    );
    this.createCircle(start, 0, 0, 28, new Color(255, 255, 255, 245));
    this.createTriangle(
      start,
      5,
      0,
      25,
      30,
      ready ? new Color(56, 181, 59, 255) : new Color(156, 163, 145, 255),
    );
    const playTriangle = start.children[start.children.length - 1];
    playTriangle.angle = -90;
    if (ready) {
      this.makeButton(start, () => this.showPuzzle());
    }
  }

  private createPuzzleCountButton(
    parent: Node,
    count: 4 | 9 | 16,
    x: number,
    y: number,
    selected: boolean,
    action: () => void,
  ): void {
    const button = this.createPanel(
      parent,
      `Pieces${count}`,
      x,
      y,
      142,
      142,
      selected ? new Color(255, 208, 72, 255) : new Color(151, 143, 232, 255),
      28,
      selected ? new Color(226, 157, 43, 255) : new Color(111, 103, 202, 255),
      3,
    );
    this.createPuzzleGridMark(button, count, 0, 0, selected);
    if (selected) {
      this.createCircle(button, 51, 51, 10, new Color(255, 255, 243, 255));
    }
    this.makeButton(button, action);
  }

  private createPuzzleGridMark(
    parent: Node,
    count: 4 | 9 | 16,
    x: number,
    y: number,
    selected: boolean,
  ): void {
    const side = Math.sqrt(count);
    const cell = count === 16 ? 18 : count === 9 ? 25 : 38;
    const gap = 4;
    const total = side * cell + (side - 1) * gap;
    for (let row = 0; row < side; row++) {
      for (let column = 0; column < side; column++) {
        const cellX = x - total / 2 + cell / 2 + column * (cell + gap);
        const cellY = y + total / 2 - cell / 2 - row * (cell + gap);
        this.createPanel(
          parent,
          'PuzzleCell',
          cellX,
          cellY,
          cell,
          cell,
          selected
            ? new Color(255, 249 - row * 5, 206 + column * 7, 255)
            : new Color(235, 232, 255, 255),
          6,
          new Color(255, 255, 240, 185),
          2,
        );
      }
    }
  }

  private createPuzzlePreviewOverlay(
    parent: Node,
    count: 4 | 9 | 16,
    kind: 'regular' | 'rotate' | 'irregular',
  ): void {
    const side = Math.sqrt(count);
    const area = kind === 'rotate' ? 302 : 312;
    const gap = kind === 'rotate' ? 11 : 0;
    const cell = (area - (side - 1) * gap) / side;
    const anglePattern = [-8, 6, -4, 9, 5, -7, 8, -5];

    for (let row = 0; row < side; row++) {
      for (let column = 0; column < side; column++) {
        const index = row * side + column;
        const cellX = -area / 2 + cell / 2 + column * (cell + gap);
        const cellY = area / 2 - cell / 2 - row * (cell + gap);
        const depthScale = kind === 'irregular' ? 1.22 : 1;
        const extent = cell + cell * 0.48 * depthScale;
        const tile = this.createUiNode('PreviewPiece', parent, cellX, cellY, extent, extent);
        const graphics = tile.addComponent(Graphics);
        graphics.fillColor = new Color(255, 255, 240, 18);
        this.drawJigsawPath(
          graphics,
          cell,
          this.getJigsawEdges(row, column, side),
          depthScale,
          this.getJigsawCorners(row, column, side),
          Math.min(16, cell * 0.2),
        );
        graphics.fill();
        graphics.strokeColor = new Color(105, 145, 91, 195);
        graphics.lineWidth = 3;
        this.drawJigsawPath(
          graphics,
          cell,
          this.getJigsawEdges(row, column, side),
          depthScale,
          this.getJigsawCorners(row, column, side),
          Math.min(16, cell * 0.2),
        );
        graphics.stroke();
        if (kind === 'rotate') {
          tile.angle = anglePattern[index % anglePattern.length];
        }
      }
    }

    if (kind === 'rotate') {
      this.createCircle(parent, 160, 160, 25, new Color(255, 246, 220, 235));
      this.createLabel(parent, '↻', 161, 163, 31, new Color(236, 153, 62, 255), 44, 44);
    }
  }

  private getJigsawEdges(row: number, column: number, side: number): JigsawEdges {
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

  private getJigsawCorners(row: number, column: number, side: number): JigsawCorners {
    return {
      topLeft: row === 0 && column === 0,
      topRight: row === 0 && column === side - 1,
      bottomRight: row === side - 1 && column === side - 1,
      bottomLeft: row === side - 1 && column === 0,
    };
  }

  private drawJigsawPath(
    graphics: Graphics,
    size: number,
    edges: JigsawEdges,
    depthScale = 1,
    corners: JigsawCorners = {
      topLeft: false,
      topRight: false,
      bottomRight: false,
      bottomLeft: false,
    },
    cornerRadius = 0,
  ): void {
    const half = size / 2;
    const shoulder = size * 0.2;
    const depth = size * 0.2 * depthScale;
    const radius = this.clamp(cornerRadius, 0, Math.max(0, half - shoulder - 2));
    const curve = radius * 0.5522848;

    if (corners.topLeft && radius > 0) {
      graphics.moveTo(-half, half - radius);
      graphics.bezierCurveTo(
        -half,
        half - radius + curve,
        -half + radius - curve,
        half,
        -half + radius,
        half,
      );
    } else {
      graphics.moveTo(-half, half);
    }
    graphics.lineTo(-shoulder, half);
    if (edges.top !== 0) {
      graphics.bezierCurveTo(
        -shoulder * 0.62,
        half,
        -shoulder * 0.72,
        half + edges.top * depth,
        0,
        half + edges.top * depth,
      );
      graphics.bezierCurveTo(
        shoulder * 0.72,
        half + edges.top * depth,
        shoulder * 0.62,
        half,
        shoulder,
        half,
      );
    }
    graphics.lineTo(corners.topRight && radius > 0 ? half - radius : half, half);
    if (corners.topRight && radius > 0) {
      graphics.bezierCurveTo(
        half - radius + curve,
        half,
        half,
        half - radius + curve,
        half,
        half - radius,
      );
    }
    graphics.lineTo(half, shoulder);
    if (edges.right !== 0) {
      graphics.bezierCurveTo(
        half,
        shoulder * 0.62,
        half + edges.right * depth,
        shoulder * 0.72,
        half + edges.right * depth,
        0,
      );
      graphics.bezierCurveTo(
        half + edges.right * depth,
        -shoulder * 0.72,
        half,
        -shoulder * 0.62,
        half,
        -shoulder,
      );
    }
    graphics.lineTo(half, corners.bottomRight && radius > 0 ? -half + radius : -half);
    if (corners.bottomRight && radius > 0) {
      graphics.bezierCurveTo(
        half,
        -half + radius - curve,
        half - radius + curve,
        -half,
        half - radius,
        -half,
      );
    }
    graphics.lineTo(shoulder, -half);
    if (edges.bottom !== 0) {
      graphics.bezierCurveTo(
        shoulder * 0.62,
        -half,
        shoulder * 0.72,
        -half - edges.bottom * depth,
        0,
        -half - edges.bottom * depth,
      );
      graphics.bezierCurveTo(
        -shoulder * 0.72,
        -half - edges.bottom * depth,
        -shoulder * 0.62,
        -half,
        -shoulder,
        -half,
      );
    }
    graphics.lineTo(corners.bottomLeft && radius > 0 ? -half + radius : -half, -half);
    if (corners.bottomLeft && radius > 0) {
      graphics.bezierCurveTo(
        -half + radius - curve,
        -half,
        -half,
        -half + radius - curve,
        -half,
        -half + radius,
      );
    }
    graphics.lineTo(-half, -shoulder);
    if (edges.left !== 0) {
      graphics.bezierCurveTo(
        -half,
        -shoulder * 0.62,
        -half - edges.left * depth,
        -shoulder * 0.72,
        -half - edges.left * depth,
        0,
      );
      graphics.bezierCurveTo(
        -half - edges.left * depth,
        shoulder * 0.72,
        -half,
        shoulder * 0.62,
        -half,
        shoulder,
      );
    }
    graphics.lineTo(-half, corners.topLeft && radius > 0 ? half - radius : half);
    graphics.close();
  }

  private drawJigsawEdge(
    graphics: Graphics,
    size: number,
    edgeName: JigsawEdgeName,
    sign: number,
    depthScale = 1,
    corners: JigsawCorners = {
      topLeft: false,
      topRight: false,
      bottomRight: false,
      bottomLeft: false,
    },
    cornerRadius = 0,
  ): void {
    const half = size / 2;
    const shoulder = size * 0.2;
    const depth = size * 0.2 * depthScale;
    const radius = this.clamp(cornerRadius, 0, Math.max(0, half - shoulder - 2));
    const curve = radius * 0.5522848;

    if (edgeName === 'top') {
      if (corners.topLeft && radius > 0) {
        graphics.moveTo(-half, half - radius);
        graphics.bezierCurveTo(
          -half,
          half - radius + curve,
          -half + radius - curve,
          half,
          -half + radius,
          half,
        );
      } else {
        graphics.moveTo(-half, half);
      }
      graphics.lineTo(-shoulder, half);
      if (sign !== 0) {
        graphics.bezierCurveTo(-shoulder * 0.62, half, -shoulder * 0.72, half + sign * depth, 0, half + sign * depth);
        graphics.bezierCurveTo(shoulder * 0.72, half + sign * depth, shoulder * 0.62, half, shoulder, half);
      }
      graphics.lineTo(corners.topRight && radius > 0 ? half - radius : half, half);
      if (corners.topRight && radius > 0) {
        graphics.bezierCurveTo(
          half - radius + curve,
          half,
          half,
          half - radius + curve,
          half,
          half - radius,
        );
      }
      return;
    }
    if (edgeName === 'right') {
      graphics.moveTo(half, corners.topRight && radius > 0 ? half - radius : half);
      graphics.lineTo(half, shoulder);
      if (sign !== 0) {
        graphics.bezierCurveTo(half, shoulder * 0.62, half + sign * depth, shoulder * 0.72, half + sign * depth, 0);
        graphics.bezierCurveTo(half + sign * depth, -shoulder * 0.72, half, -shoulder * 0.62, half, -shoulder);
      }
      graphics.lineTo(half, corners.bottomRight && radius > 0 ? -half + radius : -half);
      if (corners.bottomRight && radius > 0) {
        graphics.bezierCurveTo(
          half,
          -half + radius - curve,
          half - radius + curve,
          -half,
          half - radius,
          -half,
        );
      }
      return;
    }
    if (edgeName === 'bottom') {
      graphics.moveTo(corners.bottomRight && radius > 0 ? half - radius : half, -half);
      graphics.lineTo(shoulder, -half);
      if (sign !== 0) {
        graphics.bezierCurveTo(shoulder * 0.62, -half, shoulder * 0.72, -half - sign * depth, 0, -half - sign * depth);
        graphics.bezierCurveTo(-shoulder * 0.72, -half - sign * depth, -shoulder * 0.62, -half, -shoulder, -half);
      }
      graphics.lineTo(corners.bottomLeft && radius > 0 ? -half + radius : -half, -half);
      if (corners.bottomLeft && radius > 0) {
        graphics.bezierCurveTo(
          -half + radius - curve,
          -half,
          -half,
          -half + radius - curve,
          -half,
          -half + radius,
        );
      }
      return;
    }

    graphics.moveTo(-half, corners.bottomLeft && radius > 0 ? -half + radius : -half);
    graphics.lineTo(-half, -shoulder);
    if (sign !== 0) {
      graphics.bezierCurveTo(-half, -shoulder * 0.62, -half - sign * depth, -shoulder * 0.72, -half - sign * depth, 0);
      graphics.bezierCurveTo(-half - sign * depth, shoulder * 0.72, -half, shoulder * 0.62, -half, shoulder);
    }
    graphics.lineTo(-half, corners.topLeft && radius > 0 ? half - radius : half);
  }

  private createJigsawExtrudedEdge(
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
    const points = this.getJigsawEdgePoints(
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
      x: this.clamp(size * 0.028, 4, 7),
      y: -this.clamp(size * 0.052, 8, 13),
    };
    const adjacentEdges: Record<JigsawEdgeName, [JigsawEdgeName, JigsawEdgeName]> = {
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
      this.createExtrusionBand(
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
      this.createExtrusionBand(
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
      this.createExtrusionBand(
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
      this.createExtrusionBand(
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

  private createExtrusionBand(
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
    const capSpan = Math.max(1, Math.min(4, Math.floor((points.length - 1) / 3)));
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

  private getJigsawEdgePoints(
    size: number,
    edgeName: JigsawEdgeName,
    sign: number,
    depthScale: number,
    corners: JigsawCorners,
    cornerRadius: number,
  ): Point2D[] {
    const half = size / 2;
    const shoulder = size * 0.2;
    const depth = size * 0.2 * depthScale;
    const radius = this.clamp(cornerRadius, 0, Math.max(0, half - shoulder - 2));
    const curve = radius * 0.5522848;
    const points: Point2D[] = [];
    const lineTo = (x: number, y: number): void => {
      points.push({ x, y });
    };
    const cubicTo = (
      control1: Point2D,
      control2: Point2D,
      end: Point2D,
    ): void => {
      const start = points[points.length - 1];
      for (let step = 1; step <= 10; step++) {
        const t = step / 10;
        const inverse = 1 - t;
        points.push({
          x: inverse ** 3 * start.x
            + 3 * inverse ** 2 * t * control1.x
            + 3 * inverse * t ** 2 * control2.x
            + t ** 3 * end.x,
          y: inverse ** 3 * start.y
            + 3 * inverse ** 2 * t * control1.y
            + 3 * inverse * t ** 2 * control2.y
            + t ** 3 * end.y,
        });
      }
    };

    if (edgeName === 'top') {
      if (corners.topLeft && radius > 0) {
        lineTo(-half, half - radius);
        cubicTo(
          { x: -half, y: half - radius + curve },
          { x: -half + radius - curve, y: half },
          { x: -half + radius, y: half },
        );
      } else {
        lineTo(-half, half);
      }
      lineTo(-shoulder, half);
      if (sign !== 0) {
        cubicTo(
          { x: -shoulder * 0.62, y: half },
          { x: -shoulder * 0.72, y: half + sign * depth },
          { x: 0, y: half + sign * depth },
        );
        cubicTo(
          { x: shoulder * 0.72, y: half + sign * depth },
          { x: shoulder * 0.62, y: half },
          { x: shoulder, y: half },
        );
      }
      lineTo(corners.topRight && radius > 0 ? half - radius : half, half);
      if (corners.topRight && radius > 0) {
        cubicTo(
          { x: half - radius + curve, y: half },
          { x: half, y: half - radius + curve },
          { x: half, y: half - radius },
        );
      }
      return points;
    }
    if (edgeName === 'right') {
      lineTo(half, corners.topRight && radius > 0 ? half - radius : half);
      lineTo(half, shoulder);
      if (sign !== 0) {
        cubicTo(
          { x: half, y: shoulder * 0.62 },
          { x: half + sign * depth, y: shoulder * 0.72 },
          { x: half + sign * depth, y: 0 },
        );
        cubicTo(
          { x: half + sign * depth, y: -shoulder * 0.72 },
          { x: half, y: -shoulder * 0.62 },
          { x: half, y: -shoulder },
        );
      }
      lineTo(half, corners.bottomRight && radius > 0 ? -half + radius : -half);
      if (corners.bottomRight && radius > 0) {
        cubicTo(
          { x: half, y: -half + radius - curve },
          { x: half - radius + curve, y: -half },
          { x: half - radius, y: -half },
        );
      }
      return points;
    }
    if (edgeName === 'bottom') {
      lineTo(corners.bottomRight && radius > 0 ? half - radius : half, -half);
      lineTo(shoulder, -half);
      if (sign !== 0) {
        cubicTo(
          { x: shoulder * 0.62, y: -half },
          { x: shoulder * 0.72, y: -half - sign * depth },
          { x: 0, y: -half - sign * depth },
        );
        cubicTo(
          { x: -shoulder * 0.72, y: -half - sign * depth },
          { x: -shoulder * 0.62, y: -half },
          { x: -shoulder, y: -half },
        );
      }
      lineTo(corners.bottomLeft && radius > 0 ? -half + radius : -half, -half);
      if (corners.bottomLeft && radius > 0) {
        cubicTo(
          { x: -half + radius - curve, y: -half },
          { x: -half, y: -half + radius - curve },
          { x: -half, y: -half + radius },
        );
      }
      return points;
    }

    lineTo(-half, corners.bottomLeft && radius > 0 ? -half + radius : -half);
    lineTo(-half, -shoulder);
    if (sign !== 0) {
      cubicTo(
        { x: -half, y: -shoulder * 0.62 },
        { x: -half - sign * depth, y: -shoulder * 0.72 },
        { x: -half - sign * depth, y: 0 },
      );
      cubicTo(
        { x: -half - sign * depth, y: shoulder * 0.72 },
        { x: -half, y: shoulder * 0.62 },
        { x: -half, y: shoulder },
      );
    }
    lineTo(-half, corners.topLeft && radius > 0 ? half - radius : half);
    return points;
  }

  private createShapeOptionButton(
    parent: Node,
    kind: 'regular' | 'rotate' | 'irregular',
    x: number,
    y: number,
    selected: boolean,
    action: () => void,
  ): void {
    const button = this.createPanel(
      parent,
      `Shape${kind}`,
      x,
      y,
      142,
      142,
      selected ? new Color(122, 208, 105, 255) : new Color(151, 143, 232, 255),
      28,
      selected ? new Color(75, 169, 70, 255) : new Color(111, 103, 202, 255),
      3,
    );
    if (kind === 'regular') {
      this.createPuzzleGridMark(button, 4, 0, 0, selected);
    } else if (kind === 'rotate') {
      const tile = this.createPanel(
        button,
        'RotateTile',
        0,
        0,
        70,
        70,
        selected ? new Color(69, 172, 170, 255) : new Color(166, 190, 181, 255),
        15,
      );
      tile.angle = 22;
      this.createLabel(button, '↻', 48, 20, 35, new Color(249, 150, 55, 255), 50, 48);
    } else {
      this.createIrregularMark(
        button,
        0,
        0,
        92,
        76,
        selected ? new Color(113, 170, 91, 255) : new Color(174, 193, 158, 255),
      );
    }
    if (selected) {
      this.createCircle(button, 51, 51, 10, new Color(255, 255, 243, 255));
    }
    this.makeButton(button, action);
  }

  private createIrregularMark(
    parent: Node,
    x: number,
    y: number,
    width: number,
    height: number,
    color: Color,
  ): Node {
    const node = this.createUiNode('IrregularPiece', parent, x, y, width, height);
    const graphics = node.addComponent(Graphics);
    graphics.fillColor = color;
    graphics.moveTo(-width * 0.48, height * 0.12);
    graphics.lineTo(-width * 0.24, height * 0.5);
    graphics.lineTo(width * 0.12, height * 0.38);
    graphics.lineTo(width * 0.46, height * 0.12);
    graphics.lineTo(width * 0.31, -height * 0.45);
    graphics.lineTo(-width * 0.16, -height * 0.34);
    graphics.lineTo(-width * 0.5, -height * 0.08);
    graphics.close();
    graphics.fill();
    return node;
  }

  private createBackButton(parent: Node, action: () => void): void {
    this.createPanel(parent, 'BackDepth', -608, 305, 78, 67, new Color(39, 128, 193, 255), 20);
    const back = this.createPanel(
      parent,
      'BackButton',
      -608,
      309,
      78,
      66,
      new Color(65, 174, 241, 255),
      20,
      new Color(255, 255, 255, 220),
      3,
    );
    this.createLabel(back, '‹', 0, 4, 48, new Color(255, 255, 255, 255), 55, 54);
    this.makeButton(back, action);
  }

  private showPuzzle(): void {
    const root = this.resetScreen('Puzzle');
    this.drawFullBackground(root, new Color(247, 207, 154, 255));
    for (let y = -330; y <= 330; y += 62) {
      this.createPanel(root, 'WoodLine', 0, y, 1334, 3, new Color(196, 133, 76, 24), 2);
    }
    this.createCircle(root, -625, -330, 190, new Color(247, 167, 187, 68));
    this.createCircle(root, 600, -305, 178, new Color(186, 218, 137, 74));
    this.createCircle(root, 590, 310, 124, new Color(255, 233, 139, 50));
    this.completed = false;
    this.pieces = [];

    this.createBackButton(root, () => this.showGameDetail('puzzle', 0, '小芽和太阳', true));
    this.createCircle(root, 607, 309, 31, new Color(195, 155, 51, 255));
    this.createCircle(root, 607, 314, 27, new Color(244, 205, 76, 255));
    this.createLabel(root, '?', 607, 317, 30, new Color(255, 255, 238, 255), 42, 42);

    const boardX = -300;
    const boardY = -8;
    const boardWidth = 540;
    const boardHeight = 540;
    const imageFrameWidth = 44;
    const playSize = boardWidth - imageFrameWidth * 2;
    const outerCornerRadius = 30;
    const playCornerRadius = 22;
    if (this.frames.has(this.activePuzzleArtwork.sourceFrame)) {
      this.createPuzzleImageFrame(
        root,
        this.activePuzzleArtwork,
        boardX,
        boardY,
        boardWidth,
        outerCornerRadius,
      );
    }
    this.createPanel(
      root,
      'PuzzleCavity',
      boardX,
      boardY,
      playSize,
      playSize,
      new Color(232, 151, 83, 255),
      playCornerRadius,
    );

    const side = Math.sqrt(this.selectedPieceCount);
    const pieceSize = playSize / side;
    const pileSpacing = pieceSize * (this.selectedPieceCount === 4 ? 0.72 : 0.8);
    const pileCenterX = 365;
    const pileCenterY = -4;
    const jitterX = [-0.08, 0.06, 0.11, -0.04, 0.04, -0.1, 0.08, -0.02];
    const jitterY = [0.03, -0.08, 0.06, 0.1, -0.04, -0.09, 0.02, 0.07];
    const order = Array.from({ length: this.selectedPieceCount }, (_, index) => (
      index * (this.selectedPieceCount === 9 ? 4 : this.selectedPieceCount === 16 ? 7 : 3)
    ) % this.selectedPieceCount);
    const angles = [-5, 4, -3, 6, 3, -6, 5, -4];

    for (let index = 0; index < this.selectedPieceCount; index++) {
      const row = Math.floor(index / side);
      const column = index % side;
      const trayIndex = order[index];
      const trayRow = Math.floor(trayIndex / side);
      const trayColumn = trayIndex % side;
      const start = new Vec3(
        pileCenterX
          + (trayColumn - (side - 1) / 2) * pileSpacing
          + jitterX[index % jitterX.length] * pieceSize,
        pileCenterY
          + ((side - 1) / 2 - trayRow) * pileSpacing
          + jitterY[index % jitterY.length] * pieceSize,
      );
      const target = new Vec3(
        boardX + (column - (side - 1) / 2) * pieceSize,
        boardY + ((side - 1) / 2 - row) * pieceSize,
      );
      const restAngle = this.selectedPuzzleShape === 'rotate'
        ? angles[index % angles.length] * 1.45
        : this.selectedPuzzleShape === 'irregular'
          ? angles[(index + 3) % angles.length] * 0.72
          : angles[(index + 1) % angles.length] * 0.42;
      const piece = this.createPicturePuzzlePiece(
        root,
        index,
        row,
        column,
        side,
        start.x,
        start.y,
        pieceSize,
        boardWidth,
        playCornerRadius,
        restAngle,
      );
      const state: PuzzlePieceState = {
        node: piece.node,
        shadow: piece.shadow,
        depth: piece.depth,
        openEdgeDepths: piece.openEdgeDepths,
        seamEdges: piece.seamEdges,
        target,
        start,
        restAngle,
        snapDistance: Math.max(52, pieceSize * 0.46),
        row,
        column,
        snapped: false,
      };
      this.pieces.push(state);
      this.bindDrag(state);
      piece.node.setPosition(target);
      piece.node.setScale(new Vec3(0.94, 0.94, 1));
      tween(piece.node)
        .delay(0.15 + index * 0.035)
        .to(
          0.36,
          { position: start, scale: Vec3.ONE, angle: restAngle },
          { easing: 'backOut' },
        )
        .start();
    }
  }

  private createPicturePuzzlePiece(
    parent: Node,
    index: number,
    row: number,
    column: number,
    side: number,
    x: number,
    y: number,
    size: number,
    artworkSize: number,
    cornerRadius: number,
    angle: number,
  ): {
    node: Node;
    shadow: Node;
    depth: Node;
    openEdgeDepths: Record<JigsawEdgeName, Node>;
    seamEdges: Record<JigsawEdgeName, Node>;
  } {
    const depthScale = this.selectedPuzzleShape === 'irregular' ? 1.22 : 1;
    const extent = size + size * 0.48 * depthScale;
    const edges = this.getJigsawEdges(row, column, side);
    const corners = this.getJigsawCorners(row, column, side);
    const node = this.createUiNode(`PicturePiece${index}`, parent, x, y, extent, extent);
    node.angle = angle;

    const shadow = this.createJigsawLayer(
      node,
      'PieceShadow',
      5,
      -10,
      size,
      edges,
      new Color(48, 42, 36, 42),
      depthScale,
      corners,
      cornerRadius,
    );
    shadow.setScale(Vec3.ONE);
    shadow.addComponent(UIOpacity);
    const depth = this.createUiNode('PieceExtrusion', node, 0, 0, extent, extent);
    depth.addComponent(UIOpacity);
    this.createJigsawLayer(
      node,
      'PieceFace',
      0,
      0,
      size,
      edges,
      this.activePuzzleArtwork.fallbackColor,
      depthScale,
      corners,
      cornerRadius,
    );

    const maskNode = this.createUiNode('PictureMask', node, 0, 0, extent, extent);
    const mask = maskNode.addComponent(Mask);
    mask.type = Mask.Type.GRAPHICS_STENCIL;
    const maskGraphics = mask.subComp as Graphics;
    maskGraphics.clear();
    maskGraphics.fillColor = Color.WHITE;
    this.drawJigsawPath(maskGraphics, size, edges, depthScale, corners, cornerRadius);
    maskGraphics.fill();

    if (this.frames.has(this.activePuzzleArtwork.sourceFrame)) {
      const imageX = -(column - (side - 1) / 2) * size;
      const imageY = -((side - 1) / 2 - row) * size;
      const coverSize = this.getCoverDimensions(
        this.activePuzzleArtwork.sourceFrame,
        artworkSize,
        artworkSize,
      );
      this.createImage(
        maskNode,
        this.activePuzzleArtwork.sourceFrame,
        imageX,
        imageY,
        coverSize.width,
        coverSize.height,
      );
    }

    const openEdgeDepths = {} as Record<JigsawEdgeName, Node>;
    const seamEdges = {} as Record<JigsawEdgeName, Node>;
    (['top', 'right', 'bottom', 'left'] as JigsawEdgeName[]).forEach((edgeName) => {
      const openEdgeDepth = this.createJigsawExtrudedEdge(
        depth,
        `ExtrudedEdge${edgeName}`,
        size,
        edgeName,
        edges[edgeName],
        edges,
        depthScale,
        corners,
        cornerRadius,
      );
      openEdgeDepth.active = edgeName === 'right' || edgeName === 'bottom';
      openEdgeDepths[edgeName] = openEdgeDepth;

      const seamEdge = this.createUiNode(
        `Seam${edgeName}`,
        node,
        0,
        0,
        extent,
        extent,
      );
      const seamShade = this.createUiNode('SeamShade', seamEdge, 1, -1, extent, extent);
      const seamShadeGraphics = seamShade.addComponent(Graphics);
      seamShadeGraphics.strokeColor = new Color(48, 44, 40, 74);
      seamShadeGraphics.lineWidth = Math.max(1.5, size * 0.011);
      this.drawJigsawEdge(
        seamShadeGraphics,
        size,
        edgeName,
        edges[edgeName],
        depthScale,
        corners,
        cornerRadius,
      );
      seamShadeGraphics.stroke();
      const seamHighlight = this.createUiNode('SeamHighlight', seamEdge, -1, 1, extent, extent);
      const seamHighlightGraphics = seamHighlight.addComponent(Graphics);
      seamHighlightGraphics.strokeColor = new Color(255, 248, 230, 34);
      seamHighlightGraphics.lineWidth = Math.max(1, size * 0.006);
      this.drawJigsawEdge(
        seamHighlightGraphics,
        size,
        edgeName,
        edges[edgeName],
        depthScale,
        corners,
        cornerRadius,
      );
      seamHighlightGraphics.stroke();
      seamEdge.active = false;
      seamEdges[edgeName] = seamEdge;
    });

    return { node, shadow, depth, openEdgeDepths, seamEdges };
  }

  private createJigsawLayer(
    parent: Node,
    name: string,
    x: number,
    y: number,
    size: number,
    edges: JigsawEdges,
    color: Color,
    depthScale: number,
    corners: JigsawCorners,
    cornerRadius: number,
  ): Node {
    const extent = size + size * 0.48 * depthScale;
    const node = this.createUiNode(name, parent, x, y, extent, extent);
    const graphics = node.addComponent(Graphics);
    graphics.fillColor = color;
    this.drawJigsawPath(graphics, size, edges, depthScale, corners, cornerRadius);
    graphics.fill();
    return node;
  }

  private createInsetSlot(parent: Node, target: Vec3, tint: Color, iconName: string): void {
    this.createPanel(
      parent,
      'SlotCavity',
      target.x,
      target.y - 3,
      260,
      342,
      new Color(151, 111, 69, 88),
      34,
    );
    const slot = this.createPanel(
      parent,
      'PuzzleSlot',
      target.x,
      target.y,
      246,
      328,
      new Color(tint.r, tint.g, tint.b, 92),
      29,
      new Color(255, 232, 190, 180),
      3,
    );
    if (this.frames.has(iconName)) {
      const ghost = this.createImage(slot, iconName, 0, 28, 130, 130);
      ghost.setScale(new Vec3(0.92, 0.92, 1));
    }
    this.createLabel(slot, '放这里', 0, -112, 19, new Color(119, 100, 74, 150), 150, 34);
  }

  private createPuzzlePiece(
    parent: Node,
    name: string,
    x: number,
    y: number,
    color: Color,
    caption: string,
    iconName: string,
    angle: number,
  ): { node: Node; shadow: Node; depth: Node } {
    const node = this.createUiNode(name, parent, x, y, 274, 356);
    node.angle = angle;

    const shadow = this.createPanel(
      node,
      'ContactShadow',
      4,
      -168,
      190,
      30,
      new Color(67, 64, 47, 18),
      15,
    );
    const depth = this.createPanel(
      node,
      'WoodDepth',
      0,
      -8,
      260,
      342,
      new Color(204, 153, 96, 255),
      34,
    );
    const wood = this.createPanel(
      node,
      'WoodRim',
      0,
      -2,
      260,
      342,
      new Color(237, 190, 125, 255),
      34,
      new Color(255, 222, 170, 255),
      4,
    );
    const foam = this.createPanel(
      wood,
      'FoamFace',
      0,
      5,
      232,
      306,
      color,
      28,
      new Color(255, 255, 245, 140),
      3,
    );
    this.createPanel(foam, 'FoamHighlight', -8, 130, 172, 5, new Color(255, 255, 245, 135), 3);

    if (this.frames.has(iconName)) {
      this.createImage(foam, iconName, 0, 37, 154, 154);
    } else if (iconName === 'sprout-icon') {
      this.createSproutMark(foam, 0, 40, 0.8);
    } else {
      this.createSunMark(foam, 0, 40, 0.82);
    }
    this.createLabel(foam, caption, 0, -105, 27, new Color(75, 81, 57, 255), 180, 44);
    return { node, shadow, depth };
  }

  private bindDrag(piece: PuzzlePieceState): void {
    let dragOffset = new Vec3();
    let lastX = piece.start.x;

    piece.node.on(Node.EventType.TOUCH_START, (event: EventTouch) => {
      if (piece.snapped || this.completed) {
        return;
      }
      const position = this.touchToRoot(event);
      dragOffset = piece.node.position.clone().subtract(position);
      lastX = piece.node.position.x;
      piece.node.setSiblingIndex(piece.node.parent!.children.length - 1);
      piece.shadow.active = true;
      piece.depth.active = true;
      piece.shadow.getComponent(UIOpacity)!.opacity = 255;
      piece.depth.getComponent(UIOpacity)!.opacity = 255;
      tween(piece.node)
        .stop()
        .to(0.11, { scale: new Vec3(1.018, 1.018, 1), angle: piece.restAngle * 0.3 }, { easing: 'quadOut' })
        .start();
      tween(piece.shadow)
        .stop()
        .to(0.11, { position: new Vec3(7, -14), scale: new Vec3(1.015, 1.015, 1) })
        .start();
    });

    piece.node.on(Node.EventType.TOUCH_MOVE, (event: EventTouch) => {
      if (piece.snapped || this.completed) {
        return;
      }
      const position = this.touchToRoot(event).add(dragOffset);
      const deltaX = position.x - lastX;
      piece.node.setPosition(position);
      piece.node.angle = this.clamp(-deltaX * 0.22, -3.5, 3.5);
      lastX = position.x;
    });

    const finishDrag = () => {
      if (piece.snapped || this.completed) {
        return;
      }
      const distance = Vec3.distance(piece.node.position, piece.target);
      if (distance < piece.snapDistance) {
        piece.snapped = true;
        this.refreshPuzzleConnections();
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
          .to(0.15, { position: piece.target, scale: Vec3.ONE }, { easing: 'quadInOut' })
          .call(() => {
            this.refreshPuzzleConnections();
            if (this.pieces.every((item) => item.snapped)) {
              this.scheduleOnce(() => this.showCompletion(), 0.38);
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
          .to(0.2, { position: new Vec3(5, -10), scale: Vec3.ONE })
          .start();
      } else {
        tween(piece.node)
          .stop()
          .to(
            0.28,
            { position: piece.start, scale: Vec3.ONE, angle: piece.restAngle },
            { easing: 'backOut' },
          )
          .start();
        tween(piece.shadow)
          .stop()
          .to(0.2, { position: new Vec3(5, -10), scale: Vec3.ONE })
          .start();
      }
    };

    piece.node.on(Node.EventType.TOUCH_END, finishDrag);
    piece.node.on(Node.EventType.TOUCH_CANCEL, finishDrag);
  }

  private refreshPuzzleConnections(): void {
    const side = Math.sqrt(this.pieces.length);
    const directions: Record<JigsawEdgeName, { row: number; column: number }> = {
      top: { row: -1, column: 0 },
      right: { row: 0, column: 1 },
      bottom: { row: 1, column: 0 },
      left: { row: 0, column: -1 },
    };

    for (const piece of this.pieces) {
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
          ? this.pieces.find((item) => (
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
  }

  private showCompletion(): void {
    if (!this.contentRoot || this.completed) {
      return;
    }
    this.completed = true;

    this.createPanel(this.contentRoot, 'ModalShadow', 4, -7, 656, 424, new Color(71, 59, 38, 25), 52);
    const overlay = this.createPanel(
      this.contentRoot,
      'Completion',
      0,
      0,
      656,
      424,
      new Color(255, 252, 226, 255),
      52,
      new Color(244, 187, 73, 255),
      6,
    );
    overlay.setSiblingIndex(this.contentRoot.children.length - 1);
    overlay.setScale(new Vec3(0.72, 0.72, 1));
    tween(overlay).to(0.3, { scale: Vec3.ONE }, { easing: 'backOut' }).start();

    this.createLabel(overlay, '★  ★  ★', 0, 125, 50, new Color(247, 168, 48, 255), 380, 66);
    this.createLabel(overlay, '拼得真棒！', 0, 46, 44, new Color(72, 99, 64, 255), 420, 62);
    this.createLabel(overlay, '每一块都稳稳嵌进去了', 0, -10, 24, new Color(124, 137, 99, 255), 420, 42);

    this.createPanel(overlay, 'ReplayDepth', -142, -124, 230, 74, new Color(219, 153, 61, 255), 36);
    const replay = this.createPanel(overlay, 'ReplayButton', -142, -120, 230, 74, new Color(255, 190, 76, 255), 36);
    this.createLabel(replay, '再拼一次', 0, 0, 27, new Color(100, 67, 32, 255), 190, 48);
    this.makeButton(replay, () => this.showPuzzle());

    this.createPanel(overlay, 'HomeDepth', 142, -124, 230, 74, new Color(157, 185, 134, 255), 36);
    const home = this.createPanel(overlay, 'HomeButton', 142, -120, 230, 74, new Color(192, 220, 164, 255), 36);
    this.createLabel(home, '回到首页', 0, 0, 27, new Color(67, 94, 60, 255), 190, 48);
    this.makeButton(home, () => this.showHome());
  }

  private touchToRoot(event: EventTouch): Vec3 {
    const location = event.getUILocation();
    const transform = this.contentRoot!.getComponent(UITransform)!;
    return transform.convertToNodeSpaceAR(new Vec3(location.x, location.y, 0));
  }

  private resetScreen(name: string): Node {
    if (this.contentRoot?.isValid) {
      this.contentRoot.destroy();
    }
    const root = new Node(name);
    root.layer = Layers.Enum.UI_2D;
    root.addComponent(UITransform).setContentSize(this.designWidth, this.designHeight);
    root.setPosition(Vec3.ZERO);
    this.node.addChild(root);
    this.contentRoot = root;
    return root;
  }

  private drawFullBackground(parent: Node, color: Color): void {
    this.createPanel(parent, 'Background', 0, 0, this.designWidth, this.designHeight, color, 0);
  }

  private createImage(
    parent: Node,
    frameName: string,
    x: number,
    y: number,
    width: number,
    height: number,
  ): Node {
    const node = this.createUiNode(frameName, parent, x, y, width, height);
    const sprite = node.addComponent(Sprite);
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    sprite.spriteFrame = this.frames.get(frameName)!;
    node.getComponent(UITransform)!.setContentSize(width, height);
    return node;
  }

  private createCoverImage(
    parent: Node,
    frameName: string,
    x: number,
    y: number,
    width: number,
    height: number,
  ): Node {
    const viewport = this.createUiNode(
      `${frameName}Cover`,
      parent,
      x,
      y,
      width,
      height,
    );
    const mask = viewport.addComponent(Mask);
    mask.type = Mask.Type.GRAPHICS_STENCIL;
    const maskGraphics = mask.subComp as Graphics;
    maskGraphics.clear();
    maskGraphics.fillColor = Color.WHITE;
    maskGraphics.rect(-width / 2, -height / 2, width, height);
    maskGraphics.fill();
    const coverSize = this.getCoverDimensions(frameName, width, height);
    this.createImage(viewport, frameName, 0, 0, coverSize.width, coverSize.height);
    return viewport;
  }

  /**
   * 从完整原图中裁出最外圈作为不可移动的图片边框。
   * 中央拼块仍采样同一张原图，因此拼好后能与外圈无缝还原。
   */
  private createPuzzleImageFrame(
    parent: Node,
    artwork: PuzzleArtwork,
    x: number,
    y: number,
    artworkSize: number,
    cornerRadius: number,
  ): Node {
    const frameRoot = this.createUiNode(
      'PuzzleImageFrame',
      parent,
      x,
      y,
      artworkSize,
      artworkSize,
    );
    const mask = frameRoot.addComponent(Mask);
    mask.type = Mask.Type.GRAPHICS_STENCIL;
    const maskGraphics = mask.subComp as Graphics;
    maskGraphics.clear();
    maskGraphics.fillColor = Color.WHITE;
    maskGraphics.roundRect(
      -artworkSize / 2,
      -artworkSize / 2,
      artworkSize,
      artworkSize,
      cornerRadius,
    );
    maskGraphics.fill();

    this.createPanel(
      frameRoot,
      'TransparentImageFallback',
      0,
      0,
      artworkSize,
      artworkSize,
      artwork.fallbackColor,
      cornerRadius,
    );
    const coverSize = this.getCoverDimensions(
      artwork.sourceFrame,
      artworkSize,
      artworkSize,
    );
    this.createImage(
      frameRoot,
      artwork.sourceFrame,
      0,
      0,
      coverSize.width,
      coverSize.height,
    );
    return frameRoot;
  }

  private getCoverDimensions(
    frameName: string,
    targetWidth: number,
    targetHeight: number,
  ): { width: number; height: number } {
    const frame = this.frames.get(frameName);
    if (!frame) {
      return { width: targetWidth, height: targetHeight };
    }
    const originalSize = frame.originalSize;
    const sourceWidth = Math.max(1, originalSize.width || frame.rect.width);
    const sourceHeight = Math.max(1, originalSize.height || frame.rect.height);
    const scale = Math.max(targetWidth / sourceWidth, targetHeight / sourceHeight);
    return {
      width: sourceWidth * scale,
      height: sourceHeight * scale,
    };
  }

  /**
   * 微信选图适配层把本地照片转换为 SpriteFrame 后调用此方法即可。
   * 首页资源不受影响；横图、竖图会在预览和拼图区域中等比居中裁切。
   */
  public useCustomPuzzlePhoto(frame: SpriteFrame, title = '我的照片'): void {
    const frameName = `custom-puzzle-${this.customPuzzleSequence++}`;
    this.frames.set(frameName, frame);
    this.activePuzzleArtwork = {
      id: frameName,
      title,
      thumbnailFrame: frameName,
      sourceFrame: frameName,
      fallbackColor: new Color(246, 229, 194, 255),
    };
    this.showGameDetail('puzzle', -1, title, true);
  }

  private createSproutMark(parent: Node, x: number, y: number, scale: number): void {
    const mark = this.createUiNode('SproutMark', parent, x, y, 160 * scale, 150 * scale);
    this.createPanel(mark, 'Stem', 0, -24 * scale, 20 * scale, 82 * scale, new Color(91, 157, 76, 255), 10 * scale);
    const left = this.createPanel(mark, 'Leaf', -31 * scale, 20 * scale, 58 * scale, 92 * scale, new Color(115, 181, 85, 255), 29 * scale);
    left.angle = -31;
    const right = this.createPanel(mark, 'Leaf', 31 * scale, 20 * scale, 58 * scale, 92 * scale, new Color(133, 194, 92, 255), 29 * scale);
    right.angle = 31;
  }

  private createSunMark(parent: Node, x: number, y: number, scale: number): void {
    const mark = this.createUiNode('SunMark', parent, x, y, 160 * scale, 160 * scale);
    for (let i = 0; i < 8; i++) {
      const ray = this.createPanel(mark, 'Ray', 0, 60 * scale, 16 * scale, 38 * scale, new Color(255, 193, 61, 255), 8 * scale);
      ray.angle = i * 45;
    }
    this.createCircle(mark, 0, 0, 48 * scale, new Color(255, 205, 73, 255));
  }

  private createColorMark(parent: Node, x: number, y: number, scale: number): void {
    this.createCircle(parent, x - 42 * scale, y + 18 * scale, 39 * scale, new Color(247, 122, 102, 255));
    this.createCircle(parent, x + 42 * scale, y + 18 * scale, 39 * scale, new Color(255, 195, 70, 255));
    this.createCircle(parent, x, y - 40 * scale, 39 * scale, new Color(92, 171, 205, 255));
    this.createCircle(parent, x - 52 * scale, y + 30 * scale, 10 * scale, new Color(255, 255, 245, 120));
    this.createCircle(parent, x + 32 * scale, y + 30 * scale, 10 * scale, new Color(255, 255, 245, 120));
  }

  private createShapeMark(parent: Node, x: number, y: number, scale: number): void {
    this.createCircle(parent, x - 50 * scale, y + 25 * scale, 35 * scale, new Color(246, 142, 105, 255));
    const square = this.createPanel(
      parent,
      'ShapeSquare',
      x + 48 * scale,
      y + 26 * scale,
      66 * scale,
      66 * scale,
      new Color(91, 174, 169, 255),
      15 * scale,
    );
    square.angle = 8;
    this.createTriangle(
      parent,
      x,
      y - 50 * scale,
      82 * scale,
      72 * scale,
      new Color(255, 197, 73, 255),
    );
  }

  private createTriangle(
    parent: Node,
    x: number,
    y: number,
    width: number,
    height: number,
    color: Color,
  ): Node {
    const node = this.createUiNode('Triangle', parent, x, y, width, height);
    const graphics = node.addComponent(Graphics);
    graphics.fillColor = color;
    graphics.moveTo(0, height / 2);
    graphics.lineTo(-width / 2, -height / 2);
    graphics.lineTo(width / 2, -height / 2);
    graphics.close();
    graphics.fill();
    return node;
  }

  private createCircle(parent: Node, x: number, y: number, radius: number, color: Color): Node {
    const node = this.createUiNode('Circle', parent, x, y, radius * 2, radius * 2);
    const graphics = node.addComponent(Graphics);
    graphics.fillColor = color;
    graphics.circle(0, 0, radius);
    graphics.fill();
    return node;
  }

  private createPanel(
    parent: Node,
    name: string,
    x: number,
    y: number,
    width: number,
    height: number,
    fillColor: Color,
    radius: number,
    strokeColor?: Color,
    lineWidth = 0,
  ): Node {
    const node = this.createUiNode(name, parent, x, y, width, height);
    const graphics = node.addComponent(Graphics);
    graphics.fillColor = fillColor;
    if (radius > 0) {
      graphics.roundRect(-width / 2, -height / 2, width, height, radius);
    } else {
      graphics.rect(-width / 2, -height / 2, width, height);
    }
    graphics.fill();
    if (strokeColor && lineWidth > 0) {
      graphics.strokeColor = strokeColor;
      graphics.lineWidth = lineWidth;
      if (radius > 0) {
        graphics.roundRect(-width / 2, -height / 2, width, height, radius);
      } else {
        graphics.rect(-width / 2, -height / 2, width, height);
      }
      graphics.stroke();
    }
    return node;
  }

  private createLabel(
    parent: Node,
    text: string,
    x: number,
    y: number,
    fontSize: number,
    color: Color,
    width: number,
    height: number,
  ): Node {
    const node = this.createUiNode('Label', parent, x, y, width, height);
    const label = node.addComponent(Label);
    label.string = text;
    label.fontSize = fontSize;
    label.lineHeight = Math.round(fontSize * 1.25);
    label.color = color;
    label.horizontalAlign = HorizontalTextAlignment.CENTER;
    label.verticalAlign = VerticalTextAlignment.CENTER;
    label.enableWrapText = false;
    return node;
  }

  private createUiNode(
    name: string,
    parent: Node,
    x: number,
    y: number,
    width: number,
    height: number,
  ): Node {
    const node = new Node(name);
    node.layer = Layers.Enum.UI_2D;
    node.addComponent(UITransform).setContentSize(width, height);
    node.setPosition(x, y);
    parent.addChild(node);
    return node;
  }

  private makeButton(node: Node, action: () => void): void {
    node.on(Node.EventType.TOUCH_START, () => {
      tween(node).stop().to(0.07, { scale: new Vec3(0.96, 0.96, 1) }).start();
    });
    node.on(Node.EventType.TOUCH_END, () => {
      tween(node).stop().to(0.09, { scale: Vec3.ONE }).call(action).start();
    });
    node.on(Node.EventType.TOUCH_CANCEL, () => {
      tween(node).stop().to(0.09, { scale: Vec3.ONE }).start();
    });
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }
}
