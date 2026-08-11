import {
  Color,
  Graphics,
  Node,
} from 'cc';
import {
  drawJigsawEdge,
  drawJigsawPath,
  getJigsawCorners,
  getJigsawEdges,
} from '../../games/puzzle/PuzzleGeometry';
import type {
  CategoryId,
  PuzzlePieceCount,
  PuzzleShape,
} from '../../games/puzzle/PuzzleTypes';
import { PageController } from '../PageController';

export class PuzzleDetailPage extends PageController {
  showGameDetail(
    category: CategoryId,
    levelIndex: number,
    title: string,
    ready: boolean,
  ): void {
    if (category === 'puzzle' && levelIndex >= 0 && this.puzzleArtworks[levelIndex]) {
      this.activePuzzleArtwork = this.puzzleArtworks[levelIndex];
      if (!this.hasChosenPieceCount) {
        this.selectedPieceCount = 4;
        this.hasChosenPieceCount = true;
      }
      if (!this.hasChosenPuzzleShape) {
        this.selectedPuzzleShape = 'regular';
        this.hasChosenPuzzleShape = true;
      }
    }
    const root = this.resetScreen('GameDetail');
    this.drawFullBackground(root, new Color(218, 246, 250, 255));
    this.createPanel(
      root,
      'PinkSide',
      this.visibleWidth / 4,
      0,
      this.visibleWidth / 2,
      this.visibleHeight,
      new Color(247, 222, 244, 255),
      0,
    );
    this.createCircle(root, -610, -315, 190, new Color(174, 225, 246, 92));
    this.createCircle(root, 608, 320, 150, new Color(255, 205, 231, 82));
    this.createCircle(root, 0, 346, 92, new Color(255, 241, 185, 55));
    this.createBackButton(root, () => this.showCategory(category));

    const previewSize = 480;
    const previewBoard = this.createUiNode(
      'PuzzlePreview',
      root,
      0,
      18,
      previewSize,
      previewSize,
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
        previewSize,
        previewSize,
        38,
      );
    } else {
      this.createLevelMark(previewBoard, category, levelIndex, 0, 0);
    }
    this.createPuzzlePreviewOverlay(
      previewBoard,
      this.selectedPieceCount,
      this.selectedPuzzleShape,
      previewSize - 68,
    );

    const optionX = 440;
    this.createPuzzleCountButton(root, 4, -optionX, 188, this.hasChosenPieceCount && this.selectedPieceCount === 4, () => {
      this.selectedPieceCount = 4;
      this.hasChosenPieceCount = true;
      this.showGameDetail(category, levelIndex, title, ready);
    });
    this.createPuzzleCountButton(root, 9, -optionX, 28, this.hasChosenPieceCount && this.selectedPieceCount === 9, () => {
      this.selectedPieceCount = 9;
      this.hasChosenPieceCount = true;
      this.showGameDetail(category, levelIndex, title, ready);
    });
    this.createPuzzleCountButton(root, 16, -optionX, -132, this.hasChosenPieceCount && this.selectedPieceCount === 16, () => {
      this.selectedPieceCount = 16;
      this.hasChosenPieceCount = true;
      this.showGameDetail(category, levelIndex, title, ready);
    });

    this.createShapeOptionButton(root, 'regular', optionX, 188, this.hasChosenPuzzleShape && this.selectedPuzzleShape === 'regular', () => {
      this.selectedPuzzleShape = 'regular';
      this.hasChosenPuzzleShape = true;
      this.showGameDetail(category, levelIndex, title, ready);
    });
    this.createShapeOptionButton(root, 'hexagon', optionX, 28, this.hasChosenPuzzleShape && this.selectedPuzzleShape === 'hexagon', () => {
      this.selectedPuzzleShape = 'hexagon';
      this.hasChosenPuzzleShape = true;
      this.showGameDetail(category, levelIndex, title, ready);
    });
    this.createShapeOptionButton(root, 'circle', optionX, -132, this.hasChosenPuzzleShape && this.selectedPuzzleShape === 'circle', () => {
      this.selectedPuzzleShape = 'circle';
      this.hasChosenPuzzleShape = true;
      this.showGameDetail(category, levelIndex, title, ready);
    });

    const canStart = ready && this.hasChosenPieceCount && this.hasChosenPuzzleShape;
    if (!canStart) {
      return;
    }
    if (this.frames.has('start-play-button')) {
      const start = this.createImage(
        root,
        'start-play-button',
        0,
        -308,
        96,
        96,
      );
      start.name = 'StartGame';
      this.makeButton(start, () => this.puzzleGamePage.show());
      return;
    }
    this.createPanel(
      root,
      'StartDepth',
      0,
      -318,
      90,
      88,
      ready ? new Color(48, 145, 67, 255) : new Color(168, 175, 156, 255),
      25,
    );
    const start = this.createPanel(
      root,
      'StartGame',
      0,
      -311,
      88,
      84,
      ready ? new Color(79, 195, 96, 255) : new Color(211, 216, 199, 255),
      25,
      new Color(255, 255, 240, 235),
      4,
    );
    this.createPanel(
      start,
      'StartHighlight',
      -2,
      30,
      53,
      5,
      new Color(255, 255, 245, 115),
      3,
    );
    const playTriangle = this.createTriangle(
      start,
      3,
      -2,
      29,
      35,
      ready ? new Color(255, 255, 241, 255) : new Color(246, 247, 235, 255),
    );
    playTriangle.angle = -90;
    this.makeButton(start, () => this.puzzleGamePage.show());
  }

  private createPuzzleCountButton(
    parent: Node,
    count: 4 | 9 | 16,
    x: number,
    y: number,
    selected: boolean,
    action: () => void,
  ): void {
    const button = this.createToyOptionButton(
      parent,
      `Pieces${count}`,
      x,
      y,
      selected,
    );
    this.createPuzzleGridMark(button, count, 0, 0, selected);
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
    kind: PuzzleShape,
    area = 352,
  ): void {
    const side = Math.sqrt(count);
    const gap = 0;
    const cell = (area - (side - 1) * gap) / side;
    const clip = kind === 'regular'
      ? parent
      : this.createPuzzleShapeMask(parent, kind, area);

    for (let row = 0; row < side; row++) {
      for (let column = 0; column < side; column++) {
        const index = row * side + column;
        const cellX = -area / 2 + cell / 2 + column * (cell + gap);
        const cellY = area / 2 - cell / 2 - row * (cell + gap);
        const depthScale = 1;
        const extent = cell + cell * 0.48 * depthScale;
        const tile = this.createUiNode('PreviewPiece', clip, cellX, cellY, extent, extent);
        const graphics = tile.addComponent(Graphics);
        const edges = getJigsawEdges(row, column, side);
        const corners = getJigsawCorners(row, column, side);
        graphics.fillColor = new Color(255, 255, 240, 18);
        drawJigsawPath(
          graphics,
          cell,
          edges,
          depthScale,
          corners,
          Math.min(16, cell * 0.2),
        );
        graphics.fill();
        const seam = this.createUiNode('PreviewSeams', tile, 0, 0, extent, extent);
        const seamGraphics = seam.addComponent(Graphics);
        seamGraphics.strokeColor = new Color(255, 255, 255, 225);
        seamGraphics.lineWidth = 3.5;
        const cornerRadius = Math.min(16, cell * 0.2);
        if (column < side - 1) {
          drawJigsawEdge(
            seamGraphics,
            cell,
            'right',
            edges.right,
            depthScale,
            corners,
            cornerRadius,
          );
        }
        if (row < side - 1) {
          drawJigsawEdge(
            seamGraphics,
            cell,
            'bottom',
            edges.bottom,
            depthScale,
            corners,
            cornerRadius,
          );
        }
        if (kind === 'regular' && row === 0) {
          drawJigsawEdge(
            seamGraphics,
            cell,
            'top',
            edges.top,
            depthScale,
            corners,
            cornerRadius,
          );
        }
        if (kind === 'regular' && column === side - 1) {
          drawJigsawEdge(
            seamGraphics,
            cell,
            'right',
            edges.right,
            depthScale,
            corners,
            cornerRadius,
          );
        }
        if (kind === 'regular' && row === side - 1) {
          drawJigsawEdge(
            seamGraphics,
            cell,
            'bottom',
            edges.bottom,
            depthScale,
            corners,
            cornerRadius,
          );
        }
        if (kind === 'regular' && column === 0) {
          drawJigsawEdge(
            seamGraphics,
            cell,
            'left',
            edges.left,
            depthScale,
            corners,
            cornerRadius,
          );
        }
        seamGraphics.stroke();
      }
    }

    if (kind !== 'regular') {
      this.createPuzzleShapeOutline(parent, kind, area);
    }
  }

  private createShapeOptionButton(
    parent: Node,
    kind: PuzzleShape,
    x: number,
    y: number,
    selected: boolean,
    action: () => void,
  ): void {
    const iconName = `shape-${kind}-${selected ? 'selected' : 'idle'}`;
    const button = this.createToyOptionButton(
      parent,
      `Shape${kind}`,
      x,
      y,
      selected,
    );
    if (this.frames.has(iconName)) {
      this.createImage(button, iconName, 0, -2, 104, 104);
    } else if (kind === 'regular') {
      this.createPuzzleGridMark(button, 4, 0, 0, selected);
    } else if (kind === 'hexagon') {
      this.createHexagonMark(
        button,
        0,
        0,
        82,
        selected ? new Color(87, 181, 164, 255) : new Color(174, 193, 158, 255),
      );
    } else {
      this.createCircle(
        button,
        0,
        0,
        41,
        selected ? new Color(87, 181, 164, 255) : new Color(174, 193, 158, 255),
      );
    }
    this.makeButton(button, action);
  }

  private createToyOptionButton(
    parent: Node,
    name: string,
    x: number,
    y: number,
    selected: boolean,
  ): Node {
    const button = this.createUiNode(name, parent, x, y, 154, 154);
    const frameName = selected ? 'button-base-selected' : 'button-base-idle';
    if (this.frames.has(frameName)) {
      this.createImage(button, frameName, 0, -2, 154, 154);
    } else {
      this.createPanel(
        button,
        'ButtonFallback',
        0,
        0,
        142,
        142,
        selected ? new Color(255, 226, 111, 255) : new Color(166, 157, 242, 255),
        28,
        selected ? new Color(236, 158, 28, 255) : new Color(118, 102, 218, 255),
        3,
      );
    }
    return button;
  }

}
