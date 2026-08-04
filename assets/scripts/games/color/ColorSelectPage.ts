import { Color, Node } from 'cc';
import { MatchSelectPageBase } from '../common/MatchSelectPageBase';
import { COLOR_LEVELS } from './ColorConfig';
import type { ColorGameFlow } from './ColorGameFlow';
import type { ColorLevelConfig } from './ColorTypes';

export class ColorSelectPage extends MatchSelectPageBase<ColorLevelConfig> {
  protected readonly screenName = 'ColorSelect';
  protected readonly levels = COLOR_LEVELS;
  protected readonly backgroundColor = new Color(255, 244, 225, 255);
  protected readonly accentColor = new Color(244, 146, 91, 255);
  private readonly flow!: ColorGameFlow;

  constructor(app: any, flow: ColorGameFlow) {
    super(app);
    Object.defineProperty(this, 'flow', { value: flow });
  }

  protected getStars(levelId: string): number { return this.flow.getStars(levelId); }
  protected openLevel(index: number): void { this.flow.startLevel(index); }

  protected getCardMatColor(level: ColorLevelConfig): Color {
    return new Color(level.background.r, level.background.g, level.background.b, 255);
  }

  protected drawHeaderIcon(parent: Node): void {
    const level = COLOR_LEVELS[0];
    level.palette.slice(0, 3).forEach((color, index) => {
      const x = (index - 1) * 42;
      this.createToyShapeLayer(
        parent,
        `ColorHeaderMarker${index}`,
        x,
        306,
        40,
        level.markerShapes[index],
        color,
        new Color(255, 255, 246, 220),
        3,
      );
    });
  }

  protected drawLevelThumbnail(parent: Node, level: ColorLevelConfig, index: number): void {
    if (this.frames.has(level.thumbnailFrame)) {
      this.createCoverImage(parent, level.thumbnailFrame, 0, 22, 188, 188, 18);
      return;
    }
    this.createPanel(parent, `ColorFallback${index}`, 0, 22, 188, 188, level.background, 18);
    this.createCircle(parent, 0, 28, 58, level.accent);
  }
}
