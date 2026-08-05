import {
  Color,
  Graphics,
  Node,
  tween,
  Vec3,
} from 'cc';
import type { DifficultyStars } from './MiniGameShared';
import { PuzzleGamePage } from './pages/PuzzleGamePage';

export type GameCompletionModalOptions = {
  stars: DifficultyStars;
  onReplay: () => void;
  onNext: () => void;
  onMenu: () => void;
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

    this.createStarRow(overlay, options.stars, 0, 130, 62, 82);
    this.createCompletionCheck(overlay, 0, 25);
    this.createActionButton(
      overlay,
      'ReplayButton',
      'ui-replay',
      -190,
      -121,
      '↻',
      new Color(245, 179, 71, 255),
      options.onReplay,
    );
    this.createActionButton(
      overlay,
      'NextButton',
      'ui-next',
      0,
      -121,
      '›',
      new Color(92, 174, 214, 255),
      options.onNext,
    );
    this.createActionButton(
      overlay,
      'HomeButton',
      'ui-menu',
      190,
      -121,
      '⌂',
      new Color(112, 174, 126, 255),
      options.onMenu,
    );
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
  ): void {
    if (this.app.frames.has(frameName)) {
      const button = this.app.createImage(parent, frameName, x, y, 94, 94);
      button.name = name;
      this.app.makeButton(button, action);
      return;
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
  }

  private createStarRow(
    parent: Node,
    earnedStars: number,
    x: number,
    y: number,
    size: number,
    gap: number,
  ): void {
    for (let index = 0; index < 3; index++) {
      this.app.createPuzzleStarMark(
        parent,
        x + (index - 1) * gap,
        y,
        size,
        index < earnedStars,
      );
    }
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
}

const SHARED_COMPLETION_FLAG = '__sproutSharedCompletionModalInstalled';

/**
 * 让现有拼图页也走同一个完成弹窗组件。
 *
 * PuzzleGamePage 仍保留自己的拼图完成演出；演出结束后调用的
 * showCompletion 会在模块加载时替换为这里的共用实现。
 */
function installPuzzleCompletionModal(): void {
  const prototype = PuzzleGamePage.prototype as any;
  if (prototype[SHARED_COMPLETION_FLAG]) {
    return;
  }
  prototype[SHARED_COMPLETION_FLAG] = true;
  prototype.showCompletion = function showSharedPuzzleCompletion(this: any): void {
    const root = this.contentRoot as Node | null;
    if (!root || root.getChildByName('Completion')) {
      return;
    }
    this.completed = true;
    const stars = (this.currentCompletionStars || this.getStarsForPieceCount()) as DifficultyStars;
    new GameCompletionModal(this.app).show(root, {
      stars,
      onReplay: () => this.show(),
      onNext: () => {
        const artworks = this.puzzleArtworks as Array<{ id: string }>;
        if (artworks.length === 0) {
          return;
        }
        const currentIndex = Math.max(
          0,
          artworks.findIndex((artwork) => artwork.id === this.activePuzzleArtwork.id),
        );
        this.activePuzzleArtwork = artworks[(currentIndex + 1) % artworks.length];
        this.show();
      },
      onMenu: () => this.showCategory('puzzle'),
    });
  };
}

installPuzzleCompletionModal();
