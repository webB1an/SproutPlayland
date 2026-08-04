import { Color, Graphics, Node } from 'cc';
import { PageController } from '../../app/PageController';
import { drawToyShapePath } from './ShapeDrawing';
import type { ToyShape } from './MatchTypes';

/** 颜色与形状玩法共用的积木绘制能力。 */
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
    const node = this.createUiNode(name, parent, x, y, size + 24, size + 24);
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
  ): Node {
    const piece = this.createUiNode(name, parent, x, y, size + 48, size + 48);
    piece.angle = angle;
    this.createToyShapeLayer(piece, 'ToyShadow', 5, -9, size, shape, new Color(84, 64, 48, 48));
    this.createToyShapeLayer(
      piece,
      'ToyShape',
      0,
      0,
      size,
      shape,
      color,
      new Color(255, 255, 241, 215),
      4,
    );
    this.createCircle(
      piece,
      -size * 0.16,
      size * 0.18,
      size * 0.06,
      new Color(255, 255, 246, 125),
    );
    return piece;
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
}
