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
  sys,
  tween,
  UITransform,
  Vec3,
  VerticalTextAlignment,
  view,
} from 'cc';
import {
  DEFAULT_PIECE_COUNT,
  DEFAULT_PUZZLE_SHAPE,
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  PUZZLE_ARTWORKS,
} from '../games/puzzle/PuzzleConfig';
import { PuzzleDepthRenderer } from '../games/puzzle/PuzzleDepthRenderer';
import { PuzzleInteractionController } from '../games/puzzle/PuzzleInteractionController';
import { CategoryPage } from './pages/CategoryPage';
import { ColorGameFlow } from '../games/color/ColorGameFlow';
import { CustomVoiceController, type VoiceCue } from './CustomVoiceController';
import { GameAudioController } from './GameAudioController';
import { HomePage } from './pages/HomePage';
import { PuzzleDetailPage } from './pages/PuzzleDetailPage';
import { PuzzleGamePage } from './pages/PuzzleGamePage';
import { PuzzleSelectPage } from './pages/PuzzleSelectPage';
import { ShapeGameFlow } from '../games/shape/ShapeGameFlow';
import { VoiceSettingsPage } from './pages/VoiceSettingsPage';
import type {
  CategoryId,
  PuzzleArtwork,
  PuzzlePieceCount,
  PuzzlePieceState,
  PuzzleShape,
} from '../games/puzzle/PuzzleTypes';

const { ccclass } = _decorator;

@ccclass('SproutPlaylandApp')
export class SproutPlaylandApp extends Component {
  private readonly designWidth = DESIGN_WIDTH;
  private readonly designHeight = DESIGN_HEIGHT;
  private visibleWidth = DESIGN_WIDTH;
  private contentRoot: Node | null = null;
  private pieces: PuzzlePieceState[] = [];
  private completed = false;
  private frames = new Map<string, SpriteFrame>();
  private readonly loadedArtDirectories = new Set<string>();
  private readonly artDirectoryLoads = new Map<string, Promise<void>>();
  private navigationSequence = 0;
  private selectedPieceCount: PuzzlePieceCount = DEFAULT_PIECE_COUNT;
  private selectedPuzzleShape: PuzzleShape = DEFAULT_PUZZLE_SHAPE;
  private hasChosenPieceCount = false;
  private hasChosenPuzzleShape = false;
  private readonly puzzleArtworks: PuzzleArtwork[] = PUZZLE_ARTWORKS;
  private activePuzzleArtwork: PuzzleArtwork = this.puzzleArtworks[0];
  private readonly puzzleStarStorageKey = 'sprout-playland:puzzle-stars:v1';
  private puzzleStars: Record<string, number> = {};
  private currentCompletionStars = 0;
  private customPuzzleSequence = 0;
  private gameAudio: GameAudioController | null = null;
  private customVoice: CustomVoiceController | null = null;
  private customVoiceUnsubscribe: (() => void) | null = null;
  private readonly puzzleInteraction = new PuzzleInteractionController({
    touchToRoot: (event) => this.touchToRoot(event),
    isCompleted: () => this.completed,
    onPiecePickedUp: () => {
      this.gameAudio?.play('pickup');
    },
    onPieceDropped: () => {
      this.gameAudio?.play('drop');
      void this.customVoice?.play('retry', 3800);
    },
    onPieceSnapped: () => {
      this.gameAudio?.play('success');
      void this.customVoice?.playRandom(['correct', 'great'], 1800);
    },
    onAllSnapped: () => {
      this.currentCompletionStars = this.awardPuzzleStars();
      const starCue = `star${this.currentCompletionStars}` as VoiceCue;
      this.puzzleGamePage.playCompletionSequence(
        () => {
          this.gameAudio?.play('celebrate');
          void this.customVoice?.play('complete');
        },
        () => {
          this.puzzleGamePage.showCompletion();
          void this.customVoice?.play(starCue);
        },
      );
    },
  });
  private readonly puzzleDepth = new PuzzleDepthRenderer((
    name,
    parent,
    x,
    y,
    width,
    height,
  ) => this.createUiNode(name, parent, x, y, width, height));
  private readonly categoryPage = new CategoryPage(this);
  private readonly colorGame = new ColorGameFlow(this);
  private readonly homePage = new HomePage(this);
  private readonly puzzleDetailPage = new PuzzleDetailPage(this);
  private readonly puzzleGamePage = new PuzzleGamePage(this);
  private readonly puzzleSelectPage = new PuzzleSelectPage(this);
  private readonly shapeGame = new ShapeGameFlow(this);
  private readonly voiceSettingsPage = new VoiceSettingsPage(this);

  start(): void {
    this.gameAudio = new GameAudioController(this.node);
    this.customVoice = new CustomVoiceController();
    this.customVoiceUnsubscribe = this.customVoice.subscribe(() => {
      if (this.contentRoot?.name === 'VoiceSettings') {
        this.voiceSettingsPage.show();
      }
    });
    this.loadPuzzleStars();
    view.resizeWithBrowserSize(true);
    view.setDesignResolutionSize(
      this.designWidth,
      this.designHeight,
      ResolutionPolicy.FIXED_HEIGHT,
    );
    this.visibleWidth = Math.max(this.designWidth, view.getVisibleSize().width);
    view.on('canvas-resize', this.handleCanvasResize, this);

    void Promise.all([
      this.loadArtDirectory('art/common/home'),
      this.loadArtDirectory('art/common/ui-generated'),
      this.loadArtDirectory('art/games/puzzle/ui'),
    ]).then(() => this.showHome());
  }

  onDestroy(): void {
    view.off('canvas-resize', this.handleCanvasResize, this);
    this.customVoiceUnsubscribe?.();
    this.customVoiceUnsubscribe = null;
    this.customVoice?.dispose();
    this.customVoice = null;
  }

  private showHome(): void {
    this.navigationSequence++;
    this.customVoice?.stopPlayback();
    this.homePage.show();
  }
  private showVoiceSettings(): void {
    this.navigationSequence++;
    this.customVoice?.stopPlayback();
    this.voiceSettingsPage.show();
  }
  private showCategory(category: CategoryId): void {
    const navigationSequence = ++this.navigationSequence;
    if (category === 'puzzle') {
      if (this.loadedArtDirectories.has('art/games/puzzle')) {
        this.puzzleSelectPage.show();
        return;
      }
      this.puzzleSelectPage.showLoading();
      void this.loadArtDirectory('art/games/puzzle').then(() => {
        if (navigationSequence === this.navigationSequence) {
          this.puzzleSelectPage.show();
        }
      });
      return;
    }
    if (category === 'color') {
      const path = 'art/games/color';
      if (this.loadedArtDirectories.has(path)) {
        this.colorGame.showSelect();
        return;
      }
      this.colorGame.showLoading();
      void this.loadArtDirectory(path).then(() => {
        if (navigationSequence === this.navigationSequence) {
          this.colorGame.showSelect();
        }
      });
      return;
    }
    if (category === 'shape') {
      const path = 'art/games/shape';
      if (this.loadedArtDirectories.has(path)) {
        this.shapeGame.showSelect();
        return;
      }
      this.shapeGame.showLoading();
      void this.loadArtDirectory(path).then(() => {
        if (navigationSequence === this.navigationSequence) {
          this.shapeGame.showSelect();
        }
      });
      return;
    }
    this.categoryPage.show(category);
  }
  private showGameDetail(
    category: CategoryId,
    levelIndex: number,
    title: string,
    ready: boolean,
  ): void {
    this.navigationSequence++;
    this.puzzleDetailPage.showGameDetail(category, levelIndex, title, ready);
  }

  private loadArtDirectory(path: string): Promise<void> {
    if (this.loadedArtDirectories.has(path)) {
      return Promise.resolve();
    }
    const activeLoad = this.artDirectoryLoads.get(path);
    if (activeLoad) {
      return activeLoad;
    }
    const load = new Promise<void>((resolve) => {
      resources.loadDir(path, SpriteFrame, (error, frames) => {
        this.artDirectoryLoads.delete(path);
        if (error) {
          console.warn(`Unable to load art directory: ${path}`, error);
          resolve();
          return;
        }
        for (const frame of frames) {
          this.frames.set(frame.name, frame);
        }
        this.loadedArtDirectories.add(path);
        resolve();
      });
    });
    this.artDirectoryLoads.set(path, load);
    return load;
  }

  private createHexagonMark(
    parent: Node,
    x: number,
    y: number,
    size: number,
    color: Color,
  ): Node {
    const node = this.createUiNode('HexagonMark', parent, x, y, size, size);
    const graphics = node.addComponent(Graphics);
    graphics.fillColor = color;
    this.drawPuzzleShapePath(graphics, 'hexagon', size);
    graphics.fill();
    return node;
  }

  private createPuzzleShapeMask(
    parent: Node,
    kind: Exclude<PuzzleShape, 'regular'>,
    size: number,
  ): Node {
    const node = this.createUiNode(`Preview${kind}Mask`, parent, 0, 0, size, size);
    const mask = node.addComponent(Mask);
    mask.type = Mask.Type.GRAPHICS_STENCIL;
    const graphics = mask.subComp as Graphics;
    graphics.clear();
    graphics.fillColor = Color.WHITE;
    this.drawPuzzleShapePath(graphics, kind, size);
    graphics.fill();
    return node;
  }

  private createPuzzleShapeOutline(
    parent: Node,
    kind: Exclude<PuzzleShape, 'regular'>,
    size: number,
    x = 0,
    y = 0,
    emphasized = false,
  ): void {
    if (emphasized) {
      const shade = this.createUiNode(`${kind}BoundaryShade`, parent, x + 1, y - 1, size, size);
      const shadeGraphics = shade.addComponent(Graphics);
      shadeGraphics.strokeColor = new Color(72, 61, 49, 72);
      shadeGraphics.lineWidth = 6;
      this.drawPuzzleShapePath(shadeGraphics, kind, size);
      shadeGraphics.stroke();
    }
    const node = this.createUiNode(`Preview${kind}Outline`, parent, x, y, size, size);
    const graphics = node.addComponent(Graphics);
    graphics.strokeColor = new Color(255, 255, 255, emphasized ? 245 : 235);
    graphics.lineWidth = emphasized ? 3.5 : 4;
    this.drawPuzzleShapePath(graphics, kind, size);
    graphics.stroke();
  }

  private createPuzzleShapeFill(
    parent: Node,
    name: string,
    kind: Exclude<PuzzleShape, 'regular'>,
    x: number,
    y: number,
    size: number,
    color: Color,
  ): Node {
    const node = this.createUiNode(name, parent, x, y, size, size);
    const graphics = node.addComponent(Graphics);
    graphics.fillColor = color;
    this.drawPuzzleShapePath(graphics, kind, size);
    graphics.fill();
    return node;
  }

  private drawPuzzleShapePath(
    graphics: Graphics,
    kind: Exclude<PuzzleShape, 'regular'>,
    size: number,
    centerX = 0,
    centerY = 0,
  ): void {
    const radius = size / 2;
    if (kind === 'circle') {
      graphics.circle(centerX, centerY, radius);
      return;
    }
    for (let index = 0; index < 6; index++) {
      const angle = Math.PI / 2 - index * Math.PI / 3;
      const pointX = centerX + Math.cos(angle) * radius;
      const pointY = centerY + Math.sin(angle) * radius;
      if (index === 0) {
        graphics.moveTo(pointX, pointY);
      } else {
        graphics.lineTo(pointX, pointY);
      }
    }
    graphics.close();
  }

  private createBackButton(parent: Node, action: () => void): void {
    const position = this.getSafeTopLeftPosition(82, 82);
    if (this.frames.has('ui-back')) {
      const back = this.createImage(parent, 'ui-back', position.x, position.y, 82, 82);
      back.name = 'BackButton';
      this.makeButton(back, action);
      return;
    }
    this.createPanel(parent, 'BackDepth', position.x, position.y - 4, 78, 67, new Color(39, 128, 193, 255), 20);
    const back = this.createPanel(
      parent,
      'BackButton',
      position.x,
      position.y,
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

  private createHelpButton(parent: Node, action: () => void): void {
    const position = this.getSafeTopRightPosition(76, 76);
    if (this.frames.has('ui-help')) {
      const help = this.createImage(parent, 'ui-help', position.x, position.y, 76, 76);
      help.name = 'HelpButton';
      this.makeButton(help, action);
      return;
    }
    const help = this.createPanel(
      parent,
      'HelpButton',
      position.x,
      position.y,
      68,
      68,
      new Color(255, 198, 49, 255),
      22,
    );
    this.createLabel(help, '?', 0, 3, 42, Color.WHITE, 48, 48);
    this.makeButton(help, action);
  }

  private getSafeTopLeftPosition(width: number, height: number): { x: number; y: number } {
    const visibleSize = view.getVisibleSize();
    const safeArea = sys.getSafeAreaRect(false);
    const margin = 20;
    return {
      x: -visibleSize.width / 2 + safeArea.x + margin + width / 2,
      y: -visibleSize.height / 2 + safeArea.y + safeArea.height - margin - height / 2,
    };
  }

  private getSafeTopRightPosition(width: number, height: number): { x: number; y: number } {
    const visibleSize = view.getVisibleSize();
    const safeArea = sys.getSafeAreaRect(false);
    const margin = 20;
    return {
      x: -visibleSize.width / 2 + safeArea.x + safeArea.width - margin - width / 2,
      y: -visibleSize.height / 2 + safeArea.y + safeArea.height - margin - height / 2,
    };
  }

  private getStarsForPieceCount(): number {
    if (this.selectedPieceCount === 16) {
      return 3;
    }
    if (this.selectedPieceCount === 9) {
      return 2;
    }
    return 1;
  }

  private awardPuzzleStars(): number {
    const earnedStars = this.getStarsForPieceCount();
    const artworkId = this.activePuzzleArtwork.id;
    const isBuiltInArtwork = this.puzzleArtworks.some((artwork) => artwork.id === artworkId);
    if (!isBuiltInArtwork || earnedStars <= this.getPuzzleStars(artworkId)) {
      return earnedStars;
    }

    this.puzzleStars[artworkId] = earnedStars;
    try {
      sys.localStorage.setItem(
        this.puzzleStarStorageKey,
        JSON.stringify(this.puzzleStars),
      );
    } catch {
      // 浏览器禁用本地存储时仍允许正常完成拼图。
    }
    return earnedStars;
  }

  private getPuzzleStars(artworkId: string): number {
    const stars = this.puzzleStars[artworkId] ?? 0;
    return Math.max(0, Math.min(3, Math.floor(stars)));
  }

  private loadPuzzleStars(): void {
    try {
      const saved = sys.localStorage.getItem(this.puzzleStarStorageKey);
      if (!saved) {
        return;
      }
      const parsed = JSON.parse(saved) as Record<string, unknown>;
      for (const artwork of this.puzzleArtworks) {
        const stars = parsed[artwork.id];
        if (typeof stars === 'number' && Number.isFinite(stars)) {
          this.puzzleStars[artwork.id] = Math.max(0, Math.min(3, Math.floor(stars)));
        }
      }
    } catch {
      this.puzzleStars = {};
    }
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
    root.addComponent(UITransform).setContentSize(this.visibleWidth, this.designHeight);
    root.setPosition(Vec3.ZERO);
    this.node.addChild(root);
    this.contentRoot = root;
    return root;
  }

  private drawFullBackground(parent: Node, color: Color): void {
    this.createPanel(parent, 'Background', 0, 0, this.visibleWidth, this.designHeight, color, 0);
  }

  private readonly handleCanvasResize = (): void => {
    const nextWidth = Math.max(this.designWidth, view.getVisibleSize().width);
    if (Math.abs(nextWidth - this.visibleWidth) < 0.5) {
      return;
    }
    this.visibleWidth = nextWidth;
    if (!this.contentRoot?.isValid) {
      return;
    }
    this.contentRoot.getComponent(UITransform)?.setContentSize(
      this.visibleWidth,
      this.designHeight,
    );
    this.resizeFlatPanel(
      this.contentRoot.getChildByName('Background'),
      this.visibleWidth,
      this.designHeight,
      0,
    );
    const pinkSide = this.contentRoot.getChildByName('PinkSide');
    if (pinkSide) {
      pinkSide.setPosition(this.visibleWidth / 4, 0);
      this.resizeFlatPanel(pinkSide, this.visibleWidth / 2, this.designHeight, 0);
    }
    this.contentRoot.children
      .filter((child) => child.name === 'WoodLine')
      .forEach((line) => this.resizeFlatPanel(line, this.visibleWidth, 3, 2));
    const backPosition = this.getSafeTopLeftPosition(82, 82);
    this.contentRoot.getChildByName('BackButton')?.setPosition(backPosition.x, backPosition.y);
    this.contentRoot.getChildByName('BackDepth')?.setPosition(backPosition.x, backPosition.y - 4);
    const helpPosition = this.getSafeTopRightPosition(76, 76);
    this.contentRoot.getChildByName('HelpButton')?.setPosition(helpPosition.x, helpPosition.y);
    const voicePosition = this.getSafeTopRightPosition(66, 66);
    this.contentRoot
      .getChildByName('VoiceSettingsButton')
      ?.setPosition(voicePosition.x, voicePosition.y);
    this.contentRoot
      .getChildByName('VoiceSettingsDepth')
      ?.setPosition(voicePosition.x, voicePosition.y - 4);
  };

  private resizeFlatPanel(
    node: Node | null,
    width: number,
    height: number,
    radius: number,
  ): void {
    if (!node) {
      return;
    }
    node.getComponent(UITransform)?.setContentSize(width, height);
    const graphics = node.getComponent(Graphics);
    if (!graphics) {
      return;
    }
    graphics.clear();
    if (radius > 0) {
      graphics.roundRect(-width / 2, -height / 2, width, height, radius);
    } else {
      graphics.rect(-width / 2, -height / 2, width, height);
    }
    graphics.fill();
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
    cornerRadius = 0,
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
    if (cornerRadius > 0) {
      maskGraphics.roundRect(-width / 2, -height / 2, width, height, cornerRadius);
    } else {
      maskGraphics.rect(-width / 2, -height / 2, width, height);
    }
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

  private createPuzzleStarMark(
    parent: Node,
    x: number,
    y: number,
    size: number,
    earned: boolean,
  ): Node {
    const node = this.createUiNode('PuzzleStar', parent, x, y, size, size);
    const graphics = node.addComponent(Graphics);
    const outerRadius = size * 0.43;
    const innerRadius = outerRadius * 0.54;
    const points: Array<{ x: number; y: number }> = [];
    for (let point = 0; point < 10; point++) {
      const radius = point % 2 === 0 ? outerRadius : innerRadius;
      const angle = -Math.PI / 2 + point * Math.PI / 5;
      points.push({
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
      });
    }
    const first = points[0];
    const last = points[points.length - 1];
    graphics.moveTo((last.x + first.x) / 2, (last.y + first.y) / 2);
    for (let point = 0; point < points.length; point++) {
      const current = points[point];
      const next = points[(point + 1) % points.length];
      graphics.quadraticCurveTo(
        current.x,
        current.y,
        (current.x + next.x) / 2,
        (current.y + next.y) / 2,
      );
    }
    graphics.close();
    graphics.fillColor = earned
      ? new Color(255, 199, 67, 255)
      : new Color(239, 247, 242, 255);
    graphics.strokeColor = earned
      ? new Color(238, 158, 43, 255)
      : new Color(143, 190, 177, 235);
    graphics.lineWidth = Math.max(2.6, size * 0.065);
    graphics.fill();
    graphics.stroke();
    if (earned) {
      this.createCircle(
        node,
        -size * 0.12,
        size * 0.13,
        size * 0.055,
        new Color(255, 239, 163, 220),
      );
    }
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

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  private makeButton(node: Node, action: () => void): void {
    node.on(Node.EventType.TOUCH_START, () => {
      tween(node).stop().to(0.07, { scale: new Vec3(0.96, 0.96, 1) }).start();
    });
    node.on(Node.EventType.TOUCH_END, () => {
      tween(node)
        .stop()
        .to(0.09, { scale: Vec3.ONE })
        .call(() => {
          this.gameAudio?.play('tap');
          action();
        })
        .start();
    });
    node.on(Node.EventType.TOUCH_CANCEL, () => {
      tween(node).stop().to(0.09, { scale: Vec3.ONE }).start();
    });
  }

}
