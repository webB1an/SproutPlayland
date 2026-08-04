import { Color, Node } from 'cc';
import type { CategoryId } from '../../games/puzzle/PuzzleTypes';
import { PageController } from '../PageController';

export class CategoryPage extends PageController {
  show(category: CategoryId): void {
    if (category === 'puzzle') {
      this.puzzleSelectPage.show();
      return;
    }
    const root = this.resetScreen('Category');
    const title = category === 'color' ? '颜色乐园' : '形状世界';
    const subtitle = category === 'color' ? '和颜色做朋友' : '找找身边的形状';
    const bg = category === 'color'
      ? new Color(255, 246, 229, 255)
      : new Color(233, 247, 247, 255);
    this.drawFullBackground(root, bg);
    this.createCircle(root, 620, 320, 145, new Color(255, 221, 160, 66));
    this.createCircle(root, -640, -340, 180, new Color(205, 232, 218, 70));
    this.createBackButton(root, () => this.showHome());
    this.createLabel(root, title, -380, 306, 42, new Color(61, 88, 65, 255), 360, 60);
    this.createLabel(root, subtitle, 240, 306, 25, new Color(112, 128, 96, 255), 500, 45);

    const names = category === 'color'
      ? ['认识颜色', '彩虹配对', '颜色小屋']
      : ['圆圆方方', '形状配对', '搭建小屋'];
    const fills = category === 'color'
      ? [new Color(255, 221, 191, 255), new Color(231, 222, 249, 255), new Color(218, 239, 205, 255)]
      : [new Color(205, 234, 232, 255), new Color(255, 224, 185, 255), new Color(225, 224, 247, 255)];
    [-386, 0, 386].forEach((x, index) => {
      this.createLevelCard(root, category, index, names[index], x, -55, fills[index], false);
    });
  }

  private createLevelCard(
    parent: Node,
    category: CategoryId,
    index: number,
    title: string,
    x: number,
    y: number,
    fill: Color,
    ready: boolean,
  ): void {
    this.createPanel(parent, 'LevelShadow', x + 3, y - 8, 326, 452, new Color(75, 65, 50, 18), 46);
    const card = this.createPanel(
      parent,
      'LevelCard',
      x,
      y,
      326,
      452,
      fill,
      46,
      new Color(255, 255, 245, 205),
      4,
    );
    this.createCircle(card, 0, 95, 112, new Color(255, 255, 245, 178));
    this.createLevelMark(card, category, index, 0, 100);
    this.createLabel(card, title, 0, -64, 31, new Color(67, 87, 62, 255), 280, 52);
    if (ready) {
      const play = this.createPanel(card, 'PlayBadge', 0, -147, 150, 60, new Color(255, 184, 73, 255), 30);
      this.createLabel(play, '去玩  ›', 0, 1, 25, new Color(102, 70, 34, 255), 125, 42);
    } else {
      const soon = this.createPanel(card, 'SoonBadge', 0, -147, 150, 56, new Color(255, 255, 244, 170), 28);
      this.createLabel(soon, '快来了', 0, 0, 22, new Color(125, 125, 105, 255), 120, 40);
    }
    if (ready) {
      this.makeButton(card, () => this.showGameDetail(category, index, title, true));
    }
  }

  private createLevelMark(parent: Node, category: CategoryId, index: number, x: number, y: number): void {
    if (category === 'puzzle' && index === 0) {
      const artwork = this.puzzleArtworks[index];
      if (artwork && this.frames.has(artwork.thumbnailFrame)) {
        this.createCoverImage(parent, artwork.thumbnailFrame, x, y, 210, 210);
      } else if (this.frames.has('sprout-icon')) {
        this.createImage(parent, 'sprout-icon', x - 42, y, 128, 128);
      } else {
        this.createSproutMark(parent, x - 42, y, 0.7);
      }
      if ((!artwork || !this.frames.has(artwork.thumbnailFrame)) && this.frames.has('sun-icon')) {
        this.createImage(parent, 'sun-icon', x + 52, y - 8, 112, 112);
      } else if (!artwork || !this.frames.has(artwork.thumbnailFrame)) {
        this.createSunMark(parent, x + 52, y - 8, 0.62);
      }
    } else if (category === 'color') {
      this.createColorMark(parent, x, y, 1.1);
    } else {
      this.createShapeMark(parent, x, y, 1.1);
    }
  }

}
