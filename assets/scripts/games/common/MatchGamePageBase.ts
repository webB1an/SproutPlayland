import {
  Color,
  Node,
  tween,
  UIOpacity,
  Vec3,
} from 'cc';
import type { VoiceCue } from '../../app/CustomVoiceController';
import { MatchInteractionController } from './MatchInteractionController';
import type {
  MatchCompletionOptions,
  MatchItemState,
  MatchRule,
  MatchTargetState,
} from './MatchTypes';
import { ToyPageController } from './ToyPageController';

export abstract class MatchGamePageBase extends ToyPageController {
  protected matchCompleted = false;

  protected bindMatchGame(
    root: Node,
    items: MatchItemState[],
    targets: MatchTargetState[],
    completion: MatchCompletionOptions,
    canMatch?: MatchRule,
  ): void {
    const interaction = new MatchInteractionController({
      touchToRoot: (event) => this.touchToRoot(event),
      isCompleted: () => this.matchCompleted,
      canMatch,
      onPickup: (item) => {
        this.gameAudio?.play('pickup');
        completion.onPickup?.(item);
      },
      onWrong: (item) => {
        this.gameAudio?.play('drop');
        void this.customVoice?.play('retry', 3500);
        completion.onWrong?.(item);
      },
      onTargetFocus: (item, target) => {
        completion.onTargetFocus?.(item, target);
      },
      onMatched: (item, target) => {
        this.gameAudio?.play('success');
        void this.customVoice?.playRandom(['correct', 'great'], 1600);
        completion.onMatched?.(item, target);
      },
      onAllMatched: () => this.playMatchCelebration(root, completion),
    });
    interaction.bind(root, items, targets);
  }

  private playMatchCelebration(
    root: Node,
    completion: MatchCompletionOptions,
  ): void {
    if (this.matchCompleted) return;
    this.matchCompleted = true;
    const stars = completion.complete();
    let continued = false;

    const continueToReward = (): void => {
      if (continued || !root.isValid || this.contentRoot !== root) return;
      continued = true;
      this.gameAudio?.play('celebrate');
      void this.customVoice?.play('complete');
      this.createCelebrationConfetti(root);
      tween(root)
        .delay(0.95)
        .call(() => {
          if (root.isValid && this.contentRoot === root) {
            this.showMatchCompletion(root, stars, completion);
            void this.customVoice?.play(`star${stars}` as VoiceCue);
          }
        })
        .start();
    };

    if (completion.beforeCelebrate) {
      completion.beforeCelebrate(continueToReward);
      // 主题动画异常时也不会阻塞关卡结束。
      tween(root).delay(4.2).call(continueToReward).start();
      return;
    }
    continueToReward();
  }

  private showMatchCompletion(
    root: Node,
    stars: number,
    completion: MatchCompletionOptions,
  ): void {
    const dim = this.createPanel(
      root,
      'CompletionDim',
      0,
      0,
      this.visibleWidth,
      this.designHeight,
      new Color(45, 56, 68, 62),
      0,
    );
    dim.addComponent(UIOpacity).opacity = 0;
    tween(dim.getComponent(UIOpacity)!).to(0.18, { opacity: 255 }).start();

    this.createPanel(root, 'RewardShadow', 8, -15, 650, 410, new Color(66, 47, 39, 48), 52);
    this.createPanel(root, 'RewardSide', 0, -8, 650, 410, new Color(222, 154, 55, 255), 52);
    const overlay = this.createPanel(
      root,
      'MatchCompletion',
      0,
      0,
      650,
      405,
      new Color(255, 250, 218, 255),
      52,
      new Color(255, 255, 248, 240),
      5,
    );
    overlay.setScale(new Vec3(0.68, 0.68, 1));
    tween(overlay).to(0.34, { scale: Vec3.ONE }, { easing: 'backOut' }).start();

    this.createLabel(
      overlay,
      '太棒啦！',
      0,
      145,
      43,
      new Color(235, 104, 73, 255),
      430,
      58,
    );

    for (let index = 0; index < 3; index++) {
      const star = this.createPuzzleStarMark(
        overlay,
        (index - 1) * 92,
        75,
        66,
        index < stars,
      );
      star.setScale(new Vec3(0.18, 0.18, 1));
      tween(star)
        .delay(0.12 + index * 0.13)
        .to(0.28, { scale: Vec3.ONE, angle: index % 2 === 0 ? -6 : 6 }, { easing: 'backOut' })
        .to(0.12, { angle: 0 })
        .start();
    }

    const mascot = this.createCircle(overlay, 0, -8, 55, new Color(128, 205, 104, 255));
    this.createCircle(mascot, -20, 14, 8, new Color(255, 255, 255, 105));
    this.createCuteFace(mascot, 0, -3, 23);
    mascot.setScale(new Vec3(0.45, 0.45, 1));
    tween(mascot)
      .delay(0.28)
      .to(0.28, { scale: new Vec3(1.12, 1.12, 1) }, { easing: 'backOut' })
      .to(0.18, { scale: Vec3.ONE })
      .start();

    this.createRewardButton(overlay, 'ui-replay', -170, -132, new Color(255, 186, 57, 255), completion.replay);
    this.createRewardButton(overlay, 'ui-next', 0, -132, new Color(90, 190, 93, 255), completion.next, 1.08);
    this.createRewardButton(overlay, 'ui-menu', 170, -132, new Color(72, 160, 226, 255), completion.select);
  }

  private createRewardButton(
    parent: Node,
    frame: string,
    x: number,
    y: number,
    color: Color,
    action: () => void,
    scale = 1,
  ): void {
    this.createCircle(parent, x + 4, y - 9, 49 * scale, new Color(71, 52, 40, 42));
    this.createCircle(parent, x, y - 5, 49 * scale, this.darken(color, 0.78));
    const button = this.createCircle(parent, x, y, 48 * scale, color);
    this.createCircle(button, -15 * scale, 16 * scale, 7 * scale, new Color(255, 255, 255, 125));
    if (this.frames.has(frame)) {
      const icon = this.createImage(button, frame, 0, 2, 64 * scale, 64 * scale);
      icon.name = `${frame}Icon`;
    }
    this.makeButton(button, action);
  }

  private createCelebrationConfetti(parent: Node): void {
    const layer = this.createUiNode('MatchConfetti', parent, 0, 0, this.visibleWidth, this.designHeight);
    const colors = [
      new Color(255, 91, 119, 255),
      new Color(255, 198, 61, 255),
      new Color(79, 203, 108, 255),
      new Color(73, 177, 232, 255),
      new Color(157, 102, 226, 255),
    ];
    const bottom = -this.designHeight / 2 - 55;
    for (let index = 0; index < 46; index++) {
      const side = index % 2 === 0 ? -1 : 1;
      const startX = side * this.visibleWidth * (0.31 + Math.random() * 0.12);
      const apexX = startX - side * (100 + Math.random() * 300);
      const apexY = 90 + Math.random() * 250;
      const width = 8 + Math.random() * 8;
      const confetti = this.createPanel(
        layer,
        `MatchConfetti${index}`,
        startX,
        bottom,
        width,
        13 + Math.random() * 12,
        colors[index % colors.length],
        4,
      );
      const opacity = confetti.addComponent(UIOpacity);
      const delay = Math.random() * 0.18;
      const rise = 0.52 + Math.random() * 0.22;
      const fall = 0.95 + Math.random() * 0.32;
      tween(confetti)
        .delay(delay)
        .to(rise, { position: new Vec3(apexX, apexY), angle: 260 }, { easing: 'quadOut' })
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
    tween(layer).delay(2.4).call(() => layer.isValid && layer.destroy()).start();
  }
}
