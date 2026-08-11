import {
  Color,
  Graphics,
  Node,
  tween,
  UIOpacity,
  Vec3,
} from 'cc';
import type { DifficultyStars } from './MiniGameShared';

export type GameCompletionModalOptions = {
  stars: DifficultyStars;
  onReplay: () => void;
  onNext: () => void;
  onMenu: () => void;
  /** 是否播放彩纸粒子；拼图页有自己的庆祝演出时传 false。 */
  confetti?: boolean;
};

/**
 * 全游戏共用的完成弹窗。
 *
 * 视觉、尺寸、按钮顺序与拼图完成弹窗保持一致：
 * 重玩、下一关、返回选关。
 */
export class GameCompletionModal {
  constructor(private readonly app: any) {}

  show(parent: Node, options: GameCompletionModalOptions): void {
    if (parent.getChildByName('Completion')) {
      return;
    }

    if (options.confetti ?? true) {
      this.createConfetti(parent);
    }

    const shadow = this.app.createPanel(
      parent,
      'ModalShadow',
      4,
      -7,
      656,
      424,
      new Color(71, 59, 38, 25),
      52,
    );
    shadow.setSiblingIndex(parent.children.length - 1);

    const overlay = this.app.createPanel(
      parent,
      'Completion',
      0,
      0,
      656,
      424,
      new Color(255, 252, 226, 255),
      52,
      new Color(244, 187, 73, 255),
      6,
    );
    overlay.setSiblingIndex(parent.children.length - 1);
    overlay.setScale(new Vec3(0.72, 0.72, 1));
    tween(overlay)
      .to(0.3, { scale: Vec3.ONE }, { easing: 'backOut' })
      .start();

    for (let index = 0; index < 3; index++) {
      const star = this.app.createPuzzleStarMark(
        overlay,
        (index - 1) * 82,
        130,
        62,
        index < options.stars,
      );
      star.setScale(new Vec3(0.2, 0.2, 1));
      tween(star)
        .delay(0.18 + index * 0.12)
        .to(0.25, { scale: Vec3.ONE }, { easing: 'backOut' })
        .start();
    }
    this.createCompletionCheck(overlay, 0, 25);

    const replay = this.createActionButton(
      overlay,
      'ReplayButton',
      'ui-replay',
      -190,
      -121,
      '↻',
      new Color(245, 179, 71, 255),
      options.onReplay,
    );
    const next = this.createActionButton(
      overlay,
      'NextButton',
      'ui-next',
      0,
      -121,
      '›',
      new Color(92, 174, 214, 255),
      options.onNext,
    );
    const home = this.createActionButton(
      overlay,
      'HomeButton',
      'ui-menu',
      190,
      -121,
      '⌂',
      new Color(112, 174, 126, 255),
      options.onMenu,
    );

    // 三个按钮错峰弹入，随后"下一关"轻脉冲两次，引导孩子理解它是继续。
    const buttons = [replay, next, home];
    buttons.forEach((button, index) => {
      button.setScale(Vec3.ZERO);
      tween(button)
        .delay(0.24 + index * 0.08)
        .to(0.24, { scale: Vec3.ONE }, { easing: 'backOut' })
        .start();
    });
    tween(next)
      .delay(0.24 + buttons.length * 0.08 + 0.4)
      .to(0.16, { scale: new Vec3(1.12, 1.12, 1) }, { easing: 'quadOut' })
      .to(0.16, { scale: Vec3.ONE }, { easing: 'quadIn' })
      .to(0.16, { scale: new Vec3(1.12, 1.12, 1) }, { easing: 'quadOut' })
      .to(0.18, { scale: Vec3.ONE }, { easing: 'quadIn' })
      .start();
  }

  private createActionButton(
    parent: Node,
    name: string,
    frameName: string,
    x: number,
    y: number,
    fallbackLabel: string,
    fallbackColor: Color,
    action: () => void,
  ): Node {
    if (this.app.frames.has(frameName)) {
      const button = this.app.createImage(parent, frameName, x, y, 94, 94);
      button.name = name;
      this.app.makeButton(button, action);
      return button;
    }

    this.app.createCircle(parent, x, y - 7, 47, new Color(73, 92, 81, 54));
    const button = this.app.createCircle(parent, x, y, 47, fallbackColor);
    button.name = name;
    this.app.createLabel(
      button,
      fallbackLabel,
      0,
      fallbackLabel === '›' ? 4 : 2,
      46,
      new Color(255, 255, 246, 255),
      70,
      66,
    );
    this.app.makeButton(button, action);
    return button;
  }

  private createCompletionCheck(parent: Node, x: number, y: number): void {
    this.app.createCircle(parent, x, y - 4, 48, new Color(153, 194, 118, 90));
    const medal = this.app.createCircle(
      parent,
      x,
      y,
      47,
      new Color(202, 235, 174, 255),
    );
    this.app.createCircle(medal, 0, 2, 35, new Color(248, 252, 229, 255));
    const mark = this.app.createUiNode('CompletionCheck', medal, 0, 1, 54, 48);
    const graphics = mark.addComponent(Graphics);
    const color = new Color(75, 166, 86, 255);
    graphics.strokeColor = color;
    graphics.lineWidth = 10;
    graphics.moveTo(-17, 1);
    graphics.lineTo(-5, -12);
    graphics.lineTo(19, 15);
    graphics.stroke();
    this.app.createCircle(mark, -17, 1, 5, color);
    this.app.createCircle(mark, -5, -12, 5, color);
    this.app.createCircle(mark, 19, 15, 5, color);
  }

  private createConfetti(parent: Node): void {
    const layer = this.app.createUiNode(
      'CompletionConfetti',
      parent,
      0,
      0,
      this.app.visibleWidth,
      this.app.visibleHeight,
    );
    const colors = [
      new Color(255, 189, 70, 255),
      new Color(102, 190, 219, 255),
      new Color(231, 126, 168, 255),
      new Color(118, 181, 105, 255),
      new Color(164, 132, 225, 255),
    ];
    for (let index = 0; index < 34; index++) {
      const startX = (Math.random() - 0.5) * 530;
      const startY = 10 + Math.random() * 120;
      const piece = this.app.createPanel(
        layer,
        'Confetti',
        startX,
        startY,
        10 + Math.random() * 12,
        18 + Math.random() * 18,
        colors[index % colors.length],
        5,
      );
      piece.angle = Math.random() * 180;
      const targetX = startX + (Math.random() - 0.5) * 380;
      const targetY = -250 - Math.random() * 130;
      const duration = 0.85 + Math.random() * 0.55;
      tween(piece)
        .delay(Math.random() * 0.28)
        .to(
          duration,
          {
            position: new Vec3(targetX, targetY, 0),
            angle: piece.angle + 260 + Math.random() * 320,
          },
          { easing: 'quadIn' },
          )
        .start();
      const opacity = piece.addComponent(UIOpacity);
      tween(opacity)
        .delay(duration * 0.8)
        .to(0.4, { opacity: 0 }, { easing: 'quadIn' })
        .start();
    }
    tween(layer)
      .delay(2.6)
      .call(() => {
        if (layer.isValid) {
          layer.destroy();
        }
      })
      .start();
  }
}
