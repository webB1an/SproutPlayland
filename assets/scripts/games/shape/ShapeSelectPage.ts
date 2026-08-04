import { Color, Node } from 'cc';
import { MatchSelectPageBase } from '../common/MatchSelectPageBase';
import { SHAPE_LEVELS } from './ShapeConfig';
import type { ShapeGameFlow } from './ShapeGameFlow';
import type { ShapeLevelConfig } from './ShapeTypes';

export class ShapeSelectPage extends MatchSelectPageBase<ShapeLevelConfig> {
  protected readonly screenName = 'ShapeSelectV3';
  protected readonly levels = SHAPE_LEVELS;
  protected readonly backgroundColor = new Color(224, 242, 251, 255);
  protected readonly accentColor = new Color(69, 151, 225, 255);
  protected readonly headerTitle = '形状造物';
  protected readonly headerSubtitle = '选择一个玩具，用圆形、方形和三角形把它搭出来';
  private readonly flow!: ShapeGameFlow;

  constructor(app: any, flow: ShapeGameFlow) {
    super(app);
    Object.defineProperty(this, 'flow', { value: flow });
  }

  protected getStars(levelId: string): number { return this.flow.getStars(levelId); }
  protected openLevel(index: number): void { this.flow.startLevel(index); }
  protected getLevelTitle(level: ShapeLevelConfig): string { return level.title; }
  protected getLevelSubtitle(level: ShapeLevelConfig): string { return level.subtitle; }

  protected getCardMatColor(level: ShapeLevelConfig): Color {
    return new Color(level.background.r, level.background.g, level.background.b, 255);
  }

  protected getCardAccentColor(level: ShapeLevelConfig): Color {
    return level.accent;
  }

  protected drawHeaderIcon(parent: Node): void {
    this.createToyPiece(parent, 'HeaderTriangle', -252, 310, 30, 'triangle', new Color(82, 190, 106, 255), -8);
    this.createToyPiece(parent, 'HeaderSquare', -210, 310, 30, 'square', new Color(255, 188, 49, 255), 5);
    this.createToyPiece(parent, 'HeaderCircle', -168, 310, 30, 'circle', new Color(238, 91, 84, 255), 0);
  }

  protected drawLevelThumbnail(parent: Node, level: ShapeLevelConfig): void {
    const preview = this.createUiNode(`ShapePreview-${level.id}`, parent, 0, 63, 226, 230);
    this.drawPreviewDecor(preview, level);
    const scale = 0.42 * level.objectScale;
    level.parts.forEach((part, index) => {
      const size = Math.max(17, part.size * scale);
      const x = part.x * scale;
      const y = part.y * scale - 2;
      this.createToyShapeLayer(
        preview,
        `PreviewShadow${index}`,
        x + 3,
        y - 5,
        size,
        part.shape,
        new Color(67, 53, 43, 40),
      ).angle = part.angle ?? 0;
      const piece = this.createToyShapeLayer(
        preview,
        `PreviewPart${index}`,
        x,
        y,
        size,
        part.shape,
        part.color,
        new Color(255, 255, 245, 210),
        2.5,
      );
      piece.angle = part.angle ?? 0;
    });
    this.drawPreviewDetails(preview, level);
  }

  private drawPreviewDecor(parent: Node, level: ShapeLevelConfig): void {
    this.createSoftCloud(parent, -73, 75, 0.24, 170);
    this.createCircle(parent, 82, 78, 24, new Color(255, 210, 80, 125));
    if (level.celebration === 'rocket-launch') {
      for (let index = 0; index < 5; index++) {
        this.createCircle(parent, -88 + index * 44, -86 + (index % 2) * 12, 4, new Color(255, 255, 255, 135));
      }
      return;
    }
    if (level.celebration === 'car-drive' || level.celebration === 'house-light') {
      this.createPanel(parent, 'PreviewGrass', 0, -91, 226, 58, new Color(139, 205, 105, 125), 18);
      return;
    }
    this.createPanel(parent, 'PreviewGarden', 0, -91, 226, 58, new Color(146, 211, 113, 120), 18);
    for (let index = 0; index < 4; index++) {
      this.createCircle(parent, -78 + index * 52, -72, 6, new Color(239, 112 + index * 14, 166, 185));
    }
  }

  private drawPreviewDetails(parent: Node, level: ShapeLevelConfig): void {
    if (level.celebration === 'rocket-launch') {
      this.createCircle(parent, 0, 14, 6, new Color(255, 255, 255, 170));
      return;
    }
    if (level.celebration === 'car-drive') {
      this.createCuteFace(parent, 0, 54, 10);
      return;
    }
    if (level.celebration === 'house-light') {
      this.createCircle(parent, -25, 53, 5, new Color(255, 255, 255, 155));
      this.createCircle(parent, 25, 53, 5, new Color(255, 255, 255, 155));
      return;
    }
    this.createCuteFace(parent, 0, 26, 10);
  }
}
