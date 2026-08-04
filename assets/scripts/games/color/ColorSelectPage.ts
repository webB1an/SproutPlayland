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
    const colors = COLOR_LEVELS[0].palette;
    this.createCircle(parent, -34, 306, 23, colors[0]);
    this.createCircle(parent, 0, 306, 23, colors[1]);
    this.createCircle(parent, 34, 306, 23, colors[2]);
  }

  protected drawLevelThumbnail(parent: Node, level: ColorLevelConfig, index: number): void {
    const frameName = index === 0 && this.frames.has('forest-delivery-card')
      ? 'forest-delivery-card'
      : `color-${level.id}`;
    if (this.frames.has(frameName)) {
      this.createCoverImage(parent, frameName, 0, 22, 188, 188, 18);
      return;
    }
    this.createPanel(parent, `ColorFallback${index}`, 0, 22, 188, 188, level.background, 18);
    this.createCircle(parent, 0, 28, 58, level.accent);
  }
}
