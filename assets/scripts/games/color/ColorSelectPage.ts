import { Color, Graphics, Node } from 'cc';
import { MatchSelectPageBase } from '../common/MatchSelectPageBase';
import { COLOR_LEVELS } from './ColorConfig';
import type { ColorGameFlow } from './ColorGameFlow';
import type { ColorLevelConfig } from './ColorTypes';

export class ColorSelectPage extends MatchSelectPageBase<ColorLevelConfig> {
  protected readonly screenName = 'ColorSelectV3';
  protected readonly levels = COLOR_LEVELS;
  protected readonly backgroundColor = new Color(255, 246, 226, 255);
  protected readonly accentColor = new Color(244, 99, 105, 255);
  protected readonly headerTitle = '色彩魔法';
  protected readonly headerSubtitle = '选择一个可爱场景，把灰灰的世界变漂亮吧';
  private readonly flow!: ColorGameFlow;

  constructor(app: any, flow: ColorGameFlow) {
    super(app);
    Object.defineProperty(this, 'flow', { value: flow });
  }

  protected getStars(levelId: string): number { return this.flow.getStars(levelId); }
  protected openLevel(index: number): void { this.flow.startLevel(index); }
  protected getLevelTitle(level: ColorLevelConfig): string { return level.title; }
  protected getLevelSubtitle(level: ColorLevelConfig): string { return level.subtitle; }

  protected getCardMatColor(level: ColorLevelConfig): Color {
    return new Color(level.background.r, level.background.g, level.background.b, 255);
  }

  protected getCardAccentColor(level: ColorLevelConfig): Color {
    return level.accent;
  }

  protected drawHeaderIcon(parent: Node): void {
    const colors = COLOR_LEVELS[0].palette.slice(0, 4);
    colors.forEach((token, index) => {
      this.createToyPiece(
        parent,
        `HeaderPaint${index}`,
        -255 + index * 42,
        310,
        28,
        index % 2 === 0 ? 'circle' : 'heart',
        token.color,
        index % 2 === 0 ? -7 : 7,
        false,
      );
    });
  }

  protected drawLevelThumbnail(parent: Node, level: ColorLevelConfig): void {
    const scene = this.createUiNode(`ColorPreview-${level.id}`, parent, 0, 63, 226, 230);
    this.createSoftCloud(scene, -67, 76, 0.26, 180);
    this.createCircle(scene, 78, 78, 25, new Color(255, 211, 91, 140));

    if (level.sceneKind === 'balloon') {
      this.drawBalloonPreview(scene, level);
      return;
    }
    if (level.sceneKind === 'orchard') {
      this.drawOrchardPreview(scene, level);
      return;
    }
    if (level.sceneKind === 'fish') {
      this.drawFishPreview(scene, level);
      return;
    }
    this.drawTrainPreview(scene, level);
  }

  private drawBalloonPreview(parent: Node, level: ColorLevelConfig): void {
    this.createPanel(parent, 'Grass', 0, -91, 226, 60, new Color(145, 211, 119, 150), 18);
    const positions = [-62, 0, 62];
    positions.forEach((x, index) => {
      const token = level.palette[index];
      const string = this.createUiNode('BalloonString', parent, x, -30, 20, 90);
      const graphics = string.addComponent(Graphics);
      graphics.strokeColor = new Color(112, 92, 75, 145);
      graphics.lineWidth = 2.5;
      graphics.moveTo(0, 28);
      graphics.quadraticCurveTo(index % 2 === 0 ? 8 : -8, -8, 0, -43);
      graphics.stroke();
      const balloon = this.createToyPiece(
        parent,
        `PreviewBalloon${index}`,
        x,
        34 + (index % 2) * 13,
        62,
        'oval',
        token.color,
        90,
        true,
      );
      balloon.setScale(0.82, 0.82, 1);
    });
  }

  private drawOrchardPreview(parent: Node, level: ColorLevelConfig): void {
    this.createPanel(parent, 'Ground', 0, -91, 226, 62, new Color(149, 211, 114, 150), 18);
    this.createPanel(parent, 'TreeTrunk', 0, -31, 32, 118, new Color(151, 100, 62, 255), 16);
    this.createCircle(parent, -42, 26, 55, new Color(91, 181, 101, 255));
    this.createCircle(parent, 18, 41, 66, new Color(100, 191, 105, 255));
    this.createCircle(parent, 62, 18, 48, new Color(83, 169, 91, 255));
    [-46, 0, 48].forEach((x, index) => {
      const token = level.palette[index];
      const fruit = this.createToyPiece(
        parent,
        `PreviewFruit${index}`,
        x,
        31 - (index % 2) * 22,
        38,
        'circle',
        token.color,
        0,
        true,
      );
      fruit.setScale(0.86, 0.86, 1);
    });
  }

  private drawFishPreview(parent: Node, level: ColorLevelConfig): void {
    this.createPanel(parent, 'Water', 0, -8, 226, 208, new Color(82, 190, 220, 80), 24);
    for (let index = 0; index < 5; index++) {
      this.createCircle(
        parent,
        -92 + index * 45,
        -72 + (index % 2) * 13,
        7,
        new Color(255, 255, 255, 120),
      );
    }
    [-62, 0, 62].forEach((x, index) => {
      const token = level.palette[index];
      const fish = this.createUiNode(`PreviewFish${index}`, parent, x, 16 + (index % 2) * 28, 76, 58);
      this.createToyShapeLayer(fish, 'FishBody', 0, 0, 52, 'oval', token.color, Color.WHITE, 3);
      const tail = this.createTriangle(
        fish,
        -31,
        0,
        30,
        34,
        this.darken(token.color, 0.9),
      );
      tail.angle = -90;
      this.createCuteFace(fish, 8, -1, 12);
    });
  }

  private drawTrainPreview(parent: Node, level: ColorLevelConfig): void {
    this.createPanel(parent, 'Ground', 0, -88, 226, 58, new Color(151, 209, 112, 115), 18);
    this.createPanel(parent, 'Rail', 0, -61, 218, 7, new Color(105, 88, 72, 150), 3);
    const engine = this.createPanel(parent, 'Engine', -72, -18, 60, 61, new Color(67, 150, 222, 255), 15);
    this.createPanel(engine, 'Cab', -5, 25, 33, 31, new Color(255, 196, 55, 255), 8);
    this.createCircle(engine, -19, -35, 11, new Color(70, 73, 78, 255));
    this.createCircle(engine, 21, -35, 11, new Color(70, 73, 78, 255));

    [-12, 49, 94].forEach((x, index) => {
      const token = level.palette[index];
      const car = this.createPanel(parent, `TrainCar${index}`, x, -19, 48, 49, token.color, 13);
      this.createCircle(car, -14, -30, 9, new Color(75, 72, 72, 255));
      this.createCircle(car, 14, -30, 9, new Color(75, 72, 72, 255));
      this.createCuteFace(car, 0, 1, 12);
    });
  }
}
