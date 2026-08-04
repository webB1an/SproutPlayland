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
    this.createToyShapeLayer(parent, 'ShapeHeaderCircle', -36, 306, 45, 'circle', level.colors[0]);
    this.createToyShapeLayer(parent, 'ShapeHeaderStar', 4, 307, 50, 'star', level.colors[4]);
    this.createToyShapeLayer(parent, 'ShapeHeaderTriangle', 45, 305, 45, 'triangle', level.colors[2]);
  }

  protected drawLevelThumbnail(parent: Node, level: ShapeLevelConfig, index: number): void {
    const frameName = index === 0 && this.frames.has('forest-turtle-board-bg')
      ? 'forest-turtle-board-bg'
      : `shape-${level.id}`;
    if (this.frames.has(frameName)) {
      this.createCoverImage(parent, frameName, 0, 22, 188, 188, 18);
      return;
    }
    this.createPanel(parent, `ShapeFallback${index}`, 0, 22, 188, 188, level.background, 18);
    this.createToyShapeLayer(parent, 'ShapeFallbackIcon', 0, 28, 92, level.shapes[0], level.accent);
  }
}
