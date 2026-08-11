import {
  Color,
  Graphics,
  Mask,
  Node,
  tween,
  UIOpacity,
  Vec3,
} from 'cc';
import {
  drawJigsawEdge,
  drawJigsawPath,
  getJigsawCorners,
  getJigsawEdges,
  isPointInJigsawPath,
  isPointInPuzzleBoundary,
} from '../../games/puzzle/PuzzleGeometry';
import { createShuffledTrayOrder } from '../../games/puzzle/PuzzleShuffle';
import type {
  JigsawCorners,
  JigsawEdgeName,
  JigsawEdges,
  PuzzlePieceState,
} from '../../games/puzzle/PuzzleTypes';
import { GameCompletionModal } from '../GameCompletionModal';
import type { DifficultyStars } from '../MiniGameShared';
import { PageController } from '../PageController';

export class PuzzleGamePage extends PageController {
  private readonly boardX = -300;
  private readonly boardY = -8;
  private readonly boardWidth = 540;

  show(): void {
    const root = this.resetScreen('Puzzle');
    this.drawFullBackground(root, new Color(247, 207, 154, 255));
    for (let y = -330; y <= 330; y += 62) {
      this.createPanel(
        root,
        'WoodLine',
        0,
        y,
        this.visibleWidth,
        3,
        new Color(196, 133, 76, 24),
        2,
      );
    }
    this.createCircle(root, -625, -330, 190, new Color(247, 167, 187, 68));
    this.createCircle(root, 600, -305, 178, new Color(186, 218, 137, 74));
    this.createCircle(root, 590, 310, 124, new Color(255, 233, 139, 50));
    this.completed = false;
    this.currentCompletionStars = 0;
    this.pieces = [];

    const activeArtworkIndex = Math.max(
      0,
      this.puzzleArtworks.findIndex((artwork) => artwork.id === this.activePuzzleArtwork.id),
    );
    this.createBackButton(
      root,
      () => this.showGameDetail(
        'puzzle',
        activeArtworkIndex,
        this.activePuzzleArtwork.title,
        true,
      ),
    );
    const boardX = this.boardX;
    const boardY = this.boardY;
    const boardWidth = this.boardWidth;
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
    if (this.selectedPuzzleShape === 'regular') {
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
    } else {
      this.createPuzzleShapeFill(
        root,
        'PuzzleCavity',
        this.selectedPuzzleShape,
        boardX,
        boardY,
        playSize,
        new Color(232, 151, 83, 255),
      );
    }
    const side = Math.sqrt(this.selectedPieceCount);
    const pieceSize = playSize / side;
    // 托盘间距保持在 1.05 倍以上拼块边长，保证每块至少一半轮廓可见，
    // 尤其是 16 块时不再大面积互相遮挡。
    const pileSpacing = pieceSize * (
      this.selectedPieceCount === 4
        ? 1.08
        : this.selectedPieceCount === 9
          ? 1.06
          : 1.05
    );
    const pileCenterX = 365;
    const pileCenterY = -4;
    const trayOrder = createShuffledTrayOrder(this.selectedPieceCount);

    for (let index = 0; index < this.selectedPieceCount; index++) {
      const row = Math.floor(index / side);
      const column = index % side;
      const trayIndex = trayOrder[index];
      const trayRow = Math.floor(trayIndex / side);
      const trayColumn = trayIndex % side;
      const start = new Vec3(
        pileCenterX
          + (trayColumn - (side - 1) / 2) * pileSpacing
          + (Math.random() * 0.08 - 0.04) * pieceSize,
        pileCenterY
          + ((side - 1) / 2 - trayRow) * pileSpacing
          + (Math.random() * 0.08 - 0.04) * pieceSize,
      );
      const target = new Vec3(
        boardX + (column - (side - 1) / 2) * pieceSize,
        boardY + ((side - 1) / 2 - row) * pieceSize,
      );
      const angleDirection = Math.random() < 0.5 ? -1 : 1;
      const restAngle = angleDirection * (
        this.selectedPieceCount === 4
          ? 3.2 + Math.random() * 2.6
          : 2.2 + Math.random() * 2.4
      );
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
      const edges = getJigsawEdges(row, column, side);
      const corners = getJigsawCorners(row, column, side);
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
        containsLocalPoint: piece.containsLocalPoint,
      };
      this.pieces.push(state);
      // 拼块直接生成在托盘位并从下方错峰弹入，不再先放在目标槽上，
      // 避免入场窗口内触摸打断后拼块停在"视觉正确、逻辑未吸附"的状态。
      piece.node.setPosition(new Vec3(start.x, start.y - 120));
      piece.node.setScale(new Vec3(0.4, 0.4, 1));
      tween(piece.node)
        .delay(0.32 + trayIndex * 0.085)
        .to(
          0.5,
          { position: start, scale: Vec3.ONE, angle: restAngle },
          { easing: 'backOut' },
        )
        .start();
    }
    if (this.selectedPuzzleShape === 'regular') {
      const playOutline = this.createPanel(
        root,
        'PuzzlePlayOutline',
        boardX,
        boardY,
        playSize,
        playSize,
        new Color(0, 0, 0, 0),
        playCornerRadius,
        new Color(92, 64, 43, 175),
        5,
      );
      const firstPieceIndex = root.children.findIndex((child) => (
        child.name.startsWith('PicturePiece')
      ));
      if (firstPieceIndex >= 0) {
        playOutline.setSiblingIndex(firstPieceIndex);
      }
    }
    this.puzzleInteraction.bindDragSurface(root, this.pieces);
    if (this.selectedPuzzleShape !== 'regular') {
      this.createPuzzleShapeOutline(
        root,
        this.selectedPuzzleShape,
        playSize,
        boardX,
        boardY,
        true,
      );
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
    containsLocalPoint: (localX: number, localY: number) => boolean;
  } {
    const depthScale = 1;
    const extent = size + size * 0.48 * depthScale;
    const edges = getJigsawEdges(row, column, side);
    const corners = getJigsawCorners(row, column, side);
    const node = this.createUiNode(`PicturePiece${index}`, parent, x, y, extent, extent);
    node.angle = angle;
    const imageX = -(column - (side - 1) / 2) * size;
    const imageY = -((side - 1) / 2 - row) * size;
    if (this.selectedPuzzleShape !== 'regular') {
      const boundaryMask = node.addComponent(Mask);
      boundaryMask.type = Mask.Type.GRAPHICS_STENCIL;
      const boundaryGraphics = boundaryMask.subComp as Graphics;
      boundaryGraphics.clear();
      boundaryGraphics.fillColor = Color.WHITE;
      this.drawPuzzleShapePath(
        boundaryGraphics,
        this.selectedPuzzleShape,
        side * size,
        imageX,
        imageY,
      );
      boundaryGraphics.fill();
    }

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
    drawJigsawPath(maskGraphics, size, edges, depthScale, corners, cornerRadius);
    maskGraphics.fill();

    if (this.frames.has(this.activePuzzleArtwork.sourceFrame)) {
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
      const openEdgeDepth = this.puzzleDepth.createEdge(
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
      const seamShade = this.createUiNode('SeamShade', seamEdge, 0.8, -0.8, extent, extent);
      const seamShadeGraphics = seamShade.addComponent(Graphics);
      seamShadeGraphics.strokeColor = new Color(62, 48, 37, 190);
      seamShadeGraphics.lineWidth = Math.max(3.2, size * 0.018);
      drawJigsawEdge(
        seamShadeGraphics,
        size,
        edgeName,
        edges[edgeName],
        depthScale,
        corners,
        cornerRadius,
      );
      seamShadeGraphics.stroke();
      const seamHighlight = this.createUiNode('SeamHighlight', seamEdge, -0.7, 0.7, extent, extent);
      const seamHighlightGraphics = seamHighlight.addComponent(Graphics);
      seamHighlightGraphics.strokeColor = new Color(255, 250, 235, 105);
      seamHighlightGraphics.lineWidth = Math.max(1.5, size * 0.008);
      drawJigsawEdge(
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

    const containsLocalPoint = (localX: number, localY: number): boolean => (
      isPointInJigsawPath(
        localX,
        localY,
        size,
        edges,
        depthScale,
        corners,
        cornerRadius,
      )
      && isPointInPuzzleBoundary(
        this.selectedPuzzleShape,
        localX,
        localY,
        side * size,
        imageX,
        imageY,
      )
    );
    return {
      node,
      shadow,
      depth,
      openEdgeDepths,
      seamEdges,
      containsLocalPoint,
    };
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
    drawJigsawPath(graphics, size, edges, depthScale, corners, cornerRadius);
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

  playCompletionSequence(
    onConfetti: () => void,
    onFinished: () => void,
  ): void {
    const root = this.contentRoot;
    if (!root || this.completed) {
      return;
    }
    this.completed = true;

    const boardNodes = root.children.filter((child) => (
      child.name === 'PuzzleImageFrame'
      || child.name === 'PuzzleCavity'
      || child.name === 'PuzzlePlayOutline'
      || child.name.startsWith('PicturePiece')
      || child.name.includes('BoundaryShade')
      || (child.name.startsWith('Preview') && child.name.endsWith('Outline'))
    ));
    const artworkShadow = this.createPanel(
      root,
      'CompletionArtworkShadow',
      this.boardX + 8,
      this.boardY - 10,
      this.boardWidth,
      this.boardWidth,
      new Color(91, 62, 35, 42),
      30,
    );
    const artwork = this.createPuzzleImageFrame(
      root,
      this.activePuzzleArtwork,
      this.boardX,
      this.boardY,
      this.boardWidth,
      30,
    );
    artwork.name = 'CompletionArtwork';
    artwork.setSiblingIndex(root.children.length - 1);
    boardNodes.forEach((node) => {
      node.active = false;
    });

    const backButton = root.getChildByName('BackButton');
    const backDepth = root.getChildByName('BackDepth');
    if (backButton) {
      backButton.active = false;
    }
    if (backDepth) {
      backDepth.active = false;
    }
    tween(artworkShadow)
      .delay(0.36)
      .to(
        1.28,
        {
          position: new Vec3(8, -2),
          scale: new Vec3(0.9, 0.9, 1),
        },
        { easing: 'sineInOut' },
      )
      .to(0.2, { scale: new Vec3(0.925, 0.925, 1) }, { easing: 'sineOut' })
      .to(0.24, { scale: new Vec3(0.9, 0.9, 1) }, { easing: 'sineInOut' })
      .start();
    tween(artwork)
      .delay(0.36)
      .to(
        1.28,
        {
          position: new Vec3(0, 8),
          scale: new Vec3(0.9, 0.9, 1),
        },
        { easing: 'sineInOut' },
      )
      .to(0.2, { scale: new Vec3(0.925, 0.925, 1) }, { easing: 'sineOut' })
      .to(0.24, { scale: new Vec3(0.9, 0.9, 1) }, { easing: 'sineInOut' })
      .call(() => {
        onConfetti();
        this.createCompletionConfetti(root);
      })
      .delay(2.65)
      .call(onFinished)
      .start();
  }

  showCompletion(): void {
    const root = this.contentRoot;
    if (!root || root.getChildByName('Completion')) {
      return;
    }
    this.completed = true;

    const stars = (this.currentCompletionStars
      || this.getStarsForPieceCount()) as DifficultyStars;
    // 拼图页在 playCompletionSequence 里已有彩纸演出，弹窗不再重复播放。
    new GameCompletionModal(this.app).show(root, {
      stars,
      confetti: false,
      onReplay: () => this.show(),
      onNext: () => {
        const currentIndex = Math.max(
          0,
          this.puzzleArtworks.findIndex((artwork) => artwork.id === this.activePuzzleArtwork.id),
        );
        this.activePuzzleArtwork = this.puzzleArtworks[
          (currentIndex + 1) % this.puzzleArtworks.length
        ];
        this.show();
      },
      onMenu: () => this.showCategory('puzzle'),
    });
  }

  private createCompletionConfetti(parent: Node): void {
    const layer = this.createUiNode(
      'CompletionConfetti',
      parent,
      0,
      0,
      this.visibleWidth,
      this.visibleHeight,
    );
    layer.setSiblingIndex(parent.children.length - 1);
    const colors = [
      new Color(255, 91, 119, 255),
      new Color(255, 198, 61, 255),
      new Color(79, 203, 108, 255),
      new Color(73, 177, 232, 255),
      new Color(157, 102, 226, 255),
      new Color(255, 139, 67, 255),
    ];
    const bottom = -this.visibleHeight / 2 - 70;

    for (let index = 0; index < 76; index++) {
      const width = 7 + Math.random() * 9;
      const height = 13 + Math.random() * 13;
      const side = index % 2 === 0 ? -1 : 1;
      const startX = side * this.visibleWidth * (0.3 + Math.random() * 0.14);
      const startY = bottom + 30 + Math.random() * 24;
      const apexX = startX - side * (120 + Math.random() * 330);
      const apexY = 105 + Math.random() * 285;
      const landingX = apexX + (Math.random() - 0.5) * 230;
      const confetti = this.createPanel(
        layer,
        `Confetti${index}`,
        startX,
        startY,
        width,
        height,
        colors[index % colors.length],
        Math.min(4, width / 2),
      );
      confetti.angle = Math.random() * 180;
      const opacity = confetti.addComponent(UIOpacity);
      const delay = Math.random() * 0.22;
      const riseDuration = 0.58 + Math.random() * 0.28;
      const fallDuration = 1.18 + Math.random() * 0.38;
      const spin = Math.random() > 0.5 ? 620 : -620;
      tween(confetti)
        .delay(delay)
        .to(
          riseDuration,
          {
            position: new Vec3(apexX, apexY),
            angle: confetti.angle + spin * 0.42,
          },
          { easing: 'quadOut' },
        )
        .to(
          fallDuration,
          {
            position: new Vec3(landingX, bottom),
            angle: confetti.angle + spin,
          },
          { easing: 'quadIn' },
        )
        .start();
      tween(opacity)
        .delay(delay + riseDuration + fallDuration * 0.72)
        .to(fallDuration * 0.28, { opacity: 0 }, { easing: 'quadIn' })
        .start();
    }

    tween(layer)
      .delay(2.9)
      .call(() => {
        if (layer.isValid) {
          layer.destroy();
        }
      })
      .start();
  }

}
