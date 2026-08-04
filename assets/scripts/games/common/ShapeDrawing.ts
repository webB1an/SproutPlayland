import { Graphics } from 'cc';
import type { ToyShape } from './MatchTypes';

export function drawToyShapePath(
  graphics: Graphics,
  shape: ToyShape,
  size: number,
): void {
  const radius = size / 2;
  if (shape === 'circle') {
    graphics.circle(0, 0, radius);
    return;
  }
  if (shape === 'square') {
    graphics.roundRect(-radius, -radius, size, size, size * 0.2);
    return;
  }
  if (shape === 'rectangle') {
    const width = size * 1.35;
    const height = size * 0.78;
    graphics.roundRect(-width / 2, -height / 2, width, height, size * 0.16);
    return;
  }
  if (shape === 'oval') {
    const horizontal = radius;
    const vertical = radius * 0.68;
    const control = 0.5522848;
    graphics.moveTo(horizontal, 0);
    graphics.bezierCurveTo(horizontal, vertical * control, horizontal * control, vertical, 0, vertical);
    graphics.bezierCurveTo(-horizontal * control, vertical, -horizontal, vertical * control, -horizontal, 0);
    graphics.bezierCurveTo(-horizontal, -vertical * control, -horizontal * control, -vertical, 0, -vertical);
    graphics.bezierCurveTo(horizontal * control, -vertical, horizontal, -vertical * control, horizontal, 0);
    graphics.close();
    return;
  }
  if (shape === 'diamond') {
    graphics.moveTo(0, radius);
    graphics.lineTo(radius * 0.78, 0);
    graphics.lineTo(0, -radius);
    graphics.lineTo(-radius * 0.78, 0);
    graphics.close();
    return;
  }
  if (shape === 'heart') {
    graphics.moveTo(0, -radius);
    graphics.bezierCurveTo(-radius * 0.18, -radius * 0.72, -radius, -radius * 0.28, -radius, radius * 0.28);
    graphics.bezierCurveTo(-radius, radius * 0.88, -radius * 0.28, radius, 0, radius * 0.48);
    graphics.bezierCurveTo(radius * 0.28, radius, radius, radius * 0.88, radius, radius * 0.28);
    graphics.bezierCurveTo(radius, -radius * 0.28, radius * 0.18, -radius * 0.72, 0, -radius);
    graphics.close();
    return;
  }
  const sides = shape === 'triangle' ? 3 : shape === 'hexagon' ? 6 : 10;
  for (let index = 0; index < sides; index++) {
    const pointRadius = shape === 'star' && index % 2 === 1
      ? radius * 0.48
      : radius;
    const angle = Math.PI / 2 - index * Math.PI * 2 / sides;
    const x = Math.cos(angle) * pointRadius;
    const y = Math.sin(angle) * pointRadius;
    if (index === 0) {
      graphics.moveTo(x, y);
    } else {
      graphics.lineTo(x, y);
    }
  }
  graphics.close();
}
