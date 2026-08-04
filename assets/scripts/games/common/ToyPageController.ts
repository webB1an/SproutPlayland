import { Color, Graphics, Node, UIOpacity } from 'cc';
import { PageController } from '../../app/PageController';
import { drawToyShapePath } from './ShapeDrawing';
import type { ToyShape } from './MatchTypes';

/**
 * 颜色与形状玩法共用的幼儿玩具风绘制能力。
 * 视觉元素尽量由 Graphics 生成，新增关卡无需复制多套 PNG。
 */
export abstract class ToyPageController extends PageController {
  protected createToyShapeLayer(
    parent: Node,
    name: string,
    x: number,
    y: number,
    size: number,
    shape: ToyShape,
    fill: Color,
    stroke?: Color,
    lineWidth = 0,
  ): Node {
    const bounds = size * 1.62 + 28;
    const node = this.createUiNode(name, parent, x, y, bounds, bounds);
    const graphics = node.addComponent(Graphics);
    drawToyShapePath(graphics, shape, size);
    graphics.fillColor = fill;
    graphics.fill();
    if (stroke && lineWidth > 0) {
      graphics.strokeColor = stroke;
      graphics.lineWidth = lineWidth;
      drawToyShapePath(graphics, shape, size);
      graphics.stroke();
    }
    return node;
  }

  protected createToyPiece(
    parent: Node,
    name: string,
    x: number,
    y: number,
    size: number,
    shape: ToyShape,
    color: Color,
    angle = 0,
    showFace = false,
  ): Node {
    const bounds = size * 1.72 + 44;
    const piece = this.createUiNode(name, parent, x, y, bounds, bounds);
    piece.angle = angle;

    this.createToyShapeLayer(
      piece,
      'ToyShadow',
      8,
      -13,
      size,
      shape,
      new Color(70, 54, 40, 45),
    );
    this.createToyShapeLayer(
      piece,
      'ToySide',
      0,
      -7,
      size,
      shape,
      this.darken(color, 0.78),
      new Color(97, 70, 47, 52),
      3,
    );
    this.createToyShapeLayer(
      piece,
      'ToyTop',
      0,
      0,
      size,
      shape,
      color,
      new Color(255, 255, 245, 220),
      4,
    );
    this.createCircle(
      piece,
      -size * 0.17,
      size * 0.19,
      Math.max(4, size * 0.055),
      new Color(255, 255, 249, 150),
    );
    if (showFace) {
      this.createCuteFace(piece, 0, -size * 0.03, size * 0.25);
    }
    return piece;
  }

  protected createCuteFace(
    parent: Node,
    x: number,
    y: number,
    size: number,
    color = new Color(74, 60, 55, 235),
  ): Node {
    const face = this.createUiNode('CuteFace', parent, x, y, size * 2.2, size * 1.6);
    const eyeRadius = Math.max(2.5, size * 0.13);
    this.createCircle(face, -size * 0.36, size * 0.16, eyeRadius, color);
    this.createCircle(face, size * 0.36, size * 0.16, eyeRadius, color);
    this.createCircle(
      face,
      -size * 0.41,
      size * 0.23,
      Math.max(1, eyeRadius * 0.34),
      new Color(255, 255, 255, 230),
    );
    this.createCircle(
      face,
      size * 0.31,
      size * 0.23,
      Math.max(1, eyeRadius * 0.34),
      new Color(255, 255, 255, 230),
    );
    const smile = this.createUiNode('Smile', face, 0, -size * 0.06, size, size * 0.62);
    const graphics = smile.addComponent(Graphics);
    graphics.strokeColor = color;
    graphics.lineWidth = Math.max(2.2, size * 0.09);
    graphics.moveTo(-size * 0.22, size * 0.05);
    graphics.quadraticCurveTo(0, -size * 0.24, size * 0.22, size * 0.05);
    graphics.stroke();
    return face;
  }

  protected createToyRibbon(
    parent: Node,
    title: string,
    y: number,
    accent: Color,
    width = 390,
  ): Node {
    this.createPanel(
      parent,
      'RibbonShadow',
      5,
      y - 10,
      width,
      78,
      new Color(74, 50, 40, 36),
      30,
    );
    this.createPanel(
      parent,
      'RibbonSide',
      0,
      y - 6,
      width,
      78,
      this.darken(accent, 0.78),
      30,
    );
    const ribbon = this.createPanel(
      parent,
      'RibbonTop',
      0,
      y,
      width,
      76,
      accent,
      30,
      new Color(255, 255, 247, 215),
      4,
    );
    this.createCircle(ribbon, -width / 2 + 30, 0, 10, new Color(255, 239, 174, 185));
    this.createCircle(ribbon, width / 2 - 30, 0, 10, new Color(255, 239, 174, 185));
    this.createLabel(
      ribbon,
      title,
      0,
      2,
      35,
      new Color(255, 255, 255, 255),
      width - 80,
      56,
    );
    return ribbon;
  }

  protected createToyTray(
    parent: Node,
    y: number,
    width: number,
    accent: Color,
    height = 142,
  ): Node {
    this.createPanel(
      parent,
      'ToyTrayShadow',
      7,
      y - 13,
      width,
      height,
      new Color(77, 55, 38, 42),
      45,
    );
    this.createPanel(
      parent,
      'ToyTraySide',
      0,
      y - 7,
      width,
      height,
      new Color(212, 166, 101, 255),
      45,
    );
    const tray = this.createPanel(
      parent,
      'ToyTrayTop',
      0,
      y,
      width,
      height,
      new Color(255, 238, 198, 255),
      45,
      new Color(255, 255, 245, 220),
      4,
    );
    this.createPanel(
      tray,
      'TrayInset',
      0,
      3,
      width - 42,
      height - 32,
      new Color(accent.r, accent.g, accent.b, 24),
      34,
      new Color(173, 127, 75, 52),
      2,
    );
    this.createCircle(tray, -width / 2 + 30, 0, 6, new Color(171, 124, 75, 120));
    this.createCircle(tray, width / 2 - 30, 0, 6, new Color(171, 124, 75, 120));
    return tray;
  }

  protected createProgressPips(
    parent: Node,
    count: number,
    y: number,
    accent: Color,
  ): Node[] {
    const panelWidth = count * 42 + 44;
    const panel = this.createPanel(
      parent,
      'ProgressPill',
      0,
      y,
      panelWidth,
      48,
      new Color(255, 252, 233, 242),
      24,
      new Color(accent.r, accent.g, accent.b, 74),
      3,
    );
    return Array.from({ length: count }, (_, index) => {
      const pip = this.createCircle(
        panel,
        (index - (count - 1) / 2) * 40,
        0,
        11,
        new Color(215, 219, 207, 255),
      );
      const opacity = pip.addComponent(UIOpacity);
      opacity.opacity = 135;
      return pip;
    });
  }

  protected createSoftCloud(
    parent: Node,
    x: number,
    y: number,
    scale: number,
    opacity = 185,
  ): Node {
    const cloud = this.createUiNode('SoftCloud', parent, x, y, 190 * scale, 90 * scale);
    const color = new Color(255, 255, 255, opacity);
    this.createCircle(cloud, -45 * scale, -2 * scale, 28 * scale, color);
    this.createCircle(cloud, -5 * scale, 15 * scale, 38 * scale, color);
    this.createCircle(cloud, 40 * scale, 0, 31 * scale, color);
    this.createPanel(cloud, 'CloudBase', 0, -12 * scale, 135 * scale, 42 * scale, color, 21 * scale);
    return cloud;
  }

  protected createStarRow(
    parent: Node,
    earnedStars: number,
    x: number,
    y: number,
    size: number,
    gap: number,
  ): void {
    for (let index = 0; index < 3; index++) {
      this.createPuzzleStarMark(parent, x + (index - 1) * gap, y, size, index < earnedStars);
    }
  }

  protected darken(color: Color, factor: number): Color {
    return new Color(
      Math.max(0, Math.min(255, Math.round(color.r * factor))),
      Math.max(0, Math.min(255, Math.round(color.g * factor))),
      Math.max(0, Math.min(255, Math.round(color.b * factor))),
      color.a,
    );
  }
}
