import { Color, Node } from 'cc';
import { MatchSelectPageBase } from '../common/MatchSelectPageBase';
import { SHAPE_LEVELS } from './ShapeConfig';
import type { ShapeGameFlow } from './ShapeGameFlow';
import type { ShapeLevelConfig } from './ShapeTypes';

export class ShapeSelectPage extends MatchSelectPageBase<ShapeLevelConfig> {
  protected readonly screenName = 'ShapeSelect';
  protected readonly levels = SHAPE_LEVELS;
  protected readonly backgroundColor = new Color(226, 245, 243, 255);
  protected readonly accentColor = new Color(74, 158, 163, 255);
  private readonly flow!: ShapeGameFlow;

  constructor(app: any, flow: ShapeGameFlow) {
    super(app);
    Object.defineProperty(this, 'flow', { value: flow });
  }

  protected getStars(levelId: string): number { return this.flow.getStars(levelId); }
  protected openLevel(index: number): void { this.flow.startLevel(index); }

  protected getCardMatColor(level: ShapeLevelConfig): Color {
    return new Color(level.background.r, level.background.g, level.background.b, 255);
  }

  protected drawHeaderIcon(parent: Node): void {
    const level = SHAPE_LEVELS[0];
    const shapes = ['circle', 'star', 'triangle'] as const;
    shapes.forEach((shape, index) => {
      this.createToyShapeLayer(
        parent,
        `ShapeHeader${shape}`,
        (index - 1) * 43,
        306,
        43,
        shape,
        level.colors[index * 2],
        new Color(255, 255, 246, 220),
        3,
      );
    });
  }

  protected drawLevelThumbnail(parent: Node, level: ShapeLevelConfig, index: number): void {
    if (this.frames.has(level.thumbnailFrame)) {
      this.createCoverImage(parent, level.thumbnailFrame, 0, 22, 188, 188, 18);
      return;
    }
    this.createPanel(parent, `ShapeFallback${index}`, 0, 22, 188, 188, level.background, 18);
    this.createToyShapeLayer(parent, 'ShapeFallbackIcon', 0, 28, 92, level.shapes[0], level.accent);
  }
}
