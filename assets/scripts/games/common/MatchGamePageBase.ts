import {
  Color,
  Graphics,
  Node,
  tween,
  UIOpacity,
  Vec3,
} from 'cc';
import type { VoiceCue } from '../../app/CustomVoiceController';
import { MatchInteractionController } from './MatchInteractionController';
import type { MatchCompletionOptions, MatchItemState } from './MatchTypes';
import { ToyPageController } from './ToyPageController';

export abstract class MatchGamePageBase extends ToyPageController {
  protected matchCompleted = false;

  protected bindMatchGame(
    root: Node,
    items: MatchItemState[],
    completion: MatchCompletionOptions,
  ): void {
    const interaction = new MatchInteractionController({
      touchToRoot: (event) => this.touchToRoot(event),
      isCompleted: () => this.matchCompleted,
      onPickup: (item) => {
        this.gameAudio?.play('pickup');
        completion.onPickup?.(item);
      },
      onWrong: (item) => {
        this.gameAudio?.play('drop');
        void this.customVoice?.play('retry', 3500);
        completion.onWrong?.(item);
      },
      onMatched: (item) => {
        this.gameAudio?.play('success');
        void this.customVoice?.playRandom(['correct', 'great'], 1600);
        completion.onMatched?.(item);
      },
      onAllMatched: () => this.playMatchCelebration(root, completion),
    });
    interaction.bind(root, items);
  }

  private playMatchCelebration(root: Node, completion: MatchCompletionOptions): void {
    if (this.matchCompleted) {
      return;
    }
    this.matchCompleted = true;
    const stars = completion.complete();
    this.gameAudio?.play('celebrate');
    void this.customVoice?.play('complete');
    this.createCelebrationConfetti(root);
    tween(root)
      .delay(1.75)
      .call(() => {
        if (root.isValid && this.contentRoot === root) {
          this.showMatchCompletion(root, stars, completion);
          void this.customVoice?.play(`star${stars}` as VoiceCue);
        }
      })
      .start();
  }

  private showMatchCompletion(
    root: Node,
    stars: number,
    completion: MatchCompletionOptions,
  ): void {
    this.createPanel(root, 'MatchModalShadow', 5, -8, 620, 360, new Color(72, 58, 38, 28), 48);
    const overlay = this.createPanel(
      root,
      'MatchCompletion',
      0,
      0,
      620,
      360,
      new Color(255, 252, 226, 255),
      48,
      new Color(244, 187, 73, 255),
      6,
    );
    overlay.setScale(new Vec3(0.72, 0.72, 1));
    tween(overlay).to(0.32, { scale: Vec3.ONE }, { easing: 'backOut' }).start();

    this.createStarRow(overlay, stars, 0, 118, 55, 76);
    this.createCircle(overlay, 0, 32, 49, new Color(205, 237, 178, 255));
    const check = this.createUiNode('MatchCheck', overlay, 0, 33, 66, 58);
    const graphics = check.addComponent(Graphics);
    const checkColor = new Color(69, 165, 80, 255);
    graphics.strokeColor = checkColor;
    graphics.lineWidth = 12;
    graphics.moveTo(-23, 2);
    graphics.lineTo(-7, -15);
    graphics.lineTo(25, 20);
    graphics.stroke();
    this.createCircle(check, -23, 2, 6, checkColor);
    this.createCircle(check, -7, -15, 6, checkColor);
    this.createCircle(check, 25, 20, 6, checkColor);

    const replayButton = this.createImage(overlay, 'ui-replay', -160, -108, 88, 88);
    replayButton.name = 'ReplayButton';
    this.makeButton(replayButton, completion.replay);

    const nextButton = this.createImage(overlay, 'ui-next', 0, -108, 88, 88);
    nextButton.name = 'NextButton';
    this.makeButton(nextButton, completion.next);

    const selectButton = this.createImage(overlay, 'ui-menu', 160, -108, 88, 88);
    selectButton.name = 'SelectButton';
    this.makeButton(selectButton, completion.select);
  }

  private createCelebrationConfetti(parent: Node): void {
    const layer = this.createUiNode(
      'MatchConfetti',
      parent,
      0,
      0,
      this.visibleWidth,
      this.designHeight,
    );
    const colors = [
      new Color(255, 91, 119, 255),
      new Color(255, 198, 61, 255),
      new Color(79, 203, 108, 255),
      new Color(73, 177, 232, 255),
      new Color(157, 102, 226, 255),
    ];
    const bottom = -this.designHeight / 2 - 55;
    for (let index = 0; index < 54; index++) {
      const side = index % 2 === 0 ? -1 : 1;
      const startX = side * this.visibleWidth * (0.31 + Math.random() * 0.12);
      const apexX = startX - side * (100 + Math.random() * 300);
      const apexY = 100 + Math.random() * 250;
      const width = 7 + Math.random() * 8;
      const confetti = this.createPanel(
        layer,
        `MatchConfetti${index}`,
        startX,
        bottom,
        width,
        12 + Math.random() * 12,
        colors[index % colors.length],
        3,
      );
      const opacity = confetti.addComponent(UIOpacity);
      const delay = Math.random() * 0.2;
      const rise = 0.55 + Math.random() * 0.25;
      const fall = 1.05 + Math.random() * 0.35;
      tween(confetti)
        .delay(delay)
        .to(rise, {
          position: new Vec3(apexX, apexY),
          angle: 260,
        }, { easing: 'quadOut' })
        .to(fall, {
          position: new Vec3(apexX + (Math.random() - 0.5) * 180, bottom),
          angle: 620,
        }, { easing: 'quadIn' })
        .start();
      tween(opacity)
        .delay(delay + rise + fall * 0.72)
        .to(fall * 0.28, { opacity: 0 })
        .start();
    }
    tween(layer).delay(2.5).call(() => layer.isValid && layer.destroy()).start();
  }
}
