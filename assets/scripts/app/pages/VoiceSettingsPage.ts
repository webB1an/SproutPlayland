import {
  Color,
  Node,
  tween,
  Vec3,
} from 'cc';
import {
  VOICE_PHRASES,
  type VoiceCue,
} from '../CustomVoiceController';
import { PageController } from '../PageController';

export class VoiceSettingsPage extends PageController {
  private busy = false;
  private deleteConfirmCue: VoiceCue | null = null;
  private statusMessage = '';

  show(): void {
    const root = this.resetScreen('VoiceSettings');
    this.drawFullBackground(root, new Color(242, 236, 218, 255));
    this.createCircle(root, -600, 300, 150, new Color(224, 239, 198, 95));
    this.createCircle(root, 610, -320, 185, new Color(255, 220, 162, 70));
    this.createCircle(root, 520, 300, 100, new Color(205, 235, 224, 65));
    this.createBackButton(root, () => this.handleBack());

    this.createLabel(
      root,
      '鼓励语音',
      0,
      308,
      36,
      new Color(72, 101, 75, 255),
      260,
      52,
    );
    this.createLabel(
      root,
      '点击红色麦克风开始录音，再点一次结束（最长 6 秒）',
      0,
      262,
      22,
      new Color(103, 126, 102, 235),
      720,
      38,
    );

    VOICE_PHRASES.forEach((phrase, index) => {
      const column = Math.floor(index / 4);
      const row = index % 4;
      this.createVoiceCard(
        root,
        phrase.cue,
        phrase.text,
        column === 0 ? -300 : 300,
        185 - row * 132,
      );
    });

    const footer = this.statusMessage || (
      this.customVoice?.canRecord
        ? '录音只保存在本机，没有录制的语句不会播放'
        : '当前预览环境不支持录音，请在微信小游戏真机中使用'
    );
    this.createLabel(
      root,
      footer,
      0,
      -330,
      20,
      this.statusMessage
        ? new Color(207, 104, 76, 255)
        : new Color(112, 132, 108, 220),
      800,
      34,
    );
  }

  private createVoiceCard(
    parent: Node,
    cue: VoiceCue,
    phrase: string,
    x: number,
    y: number,
  ): void {
    const recorded = Boolean(this.customVoice?.hasRecording(cue));
    const recording = this.customVoice?.recordingCue === cue;
    const confirmingDelete = this.deleteConfirmCue === cue;
    this.createPanel(
      parent,
      'VoiceCardShadow',
      x + 3,
      y - 5,
      548,
      112,
      new Color(89, 76, 56, 20),
      30,
    );
    const card = this.createPanel(
      parent,
      `VoiceCard-${cue}`,
      x,
      y,
      548,
      112,
      new Color(255, 252, 232, 255),
      30,
      new Color(255, 255, 246, 230),
      3,
    );
    this.createLabel(
      card,
      phrase,
      -110,
      15,
      27,
      new Color(76, 91, 69, 255),
      260,
      42,
    );
    this.createCircle(
      card,
      -210,
      -27,
      6,
      recording
        ? new Color(243, 93, 83, 255)
        : recorded
          ? new Color(91, 190, 103, 255)
          : new Color(190, 202, 180, 255),
    );
    this.createLabel(
      card,
      recording
        ? '录音中'
        : confirmingDelete
          ? '再点一次删除'
          : recorded
            ? '已录制'
            : '未录制',
      -125,
      -28,
      18,
      recording || confirmingDelete
        ? new Color(221, 92, 70, 255)
        : new Color(126, 143, 116, 235),
      210,
      30,
    );

    const recordButton = this.createVoiceActionButton(
      card,
      `Record-${cue}`,
      112,
      0,
      56,
      recording
        ? new Color(243, 153, 68, 255)
        : new Color(242, 112, 101, 255),
      recording
        ? new Color(196, 104, 45, 255)
        : new Color(205, 75, 73, 255),
    );
    if (recording) {
      this.createPanel(
        recordButton,
        'StopMark',
        0,
        0,
        17,
        17,
        new Color(255, 255, 242, 255),
        4,
      );
      tween(recordButton)
        .repeatForever(
          tween<Node>()
            .to(0.55, { scale: new Vec3(1.07, 1.07, 1) }, { easing: 'sineInOut' })
            .to(0.55, { scale: Vec3.ONE }, { easing: 'sineInOut' }),
        )
        .start();
    } else {
      this.createCircle(
        recordButton,
        0,
        0,
        10,
        new Color(255, 255, 242, 255),
      );
    }
    this.makeButton(recordButton, () => {
      void this.toggleRecording(cue);
    });

    if (recorded && !recording) {
      const playButton = this.createVoiceActionButton(
        card,
        `Play-${cue}`,
        183,
        0,
        56,
        new Color(92, 190, 114, 255),
        new Color(62, 145, 82, 255),
      );
      const playMark = this.createTriangle(
        playButton,
        2,
        0,
        20,
        24,
        new Color(255, 255, 242, 255),
      );
      playMark.angle = -90;
      this.makeButton(playButton, () => {
        void this.customVoice?.play(cue);
      });

      const deleteButton = this.createVoiceActionButton(
        card,
        `Delete-${cue}`,
        244,
        0,
        48,
        new Color(237, 181, 103, 255),
        new Color(194, 129, 66, 255),
      );
      this.createPanel(
        deleteButton,
        'TrashBody',
        0,
        -2,
        15,
        17,
        new Color(255, 255, 242, 255),
        3,
      );
      this.createPanel(
        deleteButton,
        'TrashLid',
        0,
        9,
        20,
        4,
        new Color(255, 255, 242, 255),
        2,
      );
      this.createPanel(
        deleteButton,
        'TrashHandle',
        0,
        13,
        9,
        4,
        new Color(255, 255, 242, 255),
        2,
      );
      this.makeButton(deleteButton, () => {
        void this.confirmDelete(cue);
      });
    }
  }

  private createVoiceActionButton(
    parent: Node,
    name: string,
    x: number,
    y: number,
    size: number,
    fill: Color,
    depth: Color,
  ): Node {
    this.createPanel(
      parent,
      `${name}Depth`,
      x,
      y - 4,
      size,
      size,
      depth,
      size * 0.31,
    );
    const button = this.createPanel(
      parent,
      name,
      x,
      y,
      size,
      size - 2,
      fill,
      size * 0.31,
      new Color(255, 255, 242, 220),
      2.5,
    );
    this.createPanel(
      button,
      'ButtonHighlight',
      -2,
      size * 0.29,
      size * 0.58,
      4,
      new Color(255, 255, 246, 105),
      2,
    );
    return button;
  }

  private async toggleRecording(cue: VoiceCue): Promise<void> {
    if (this.busy || !this.customVoice?.canRecord) {
      return;
    }
    this.busy = true;
    this.deleteConfirmCue = null;
    this.statusMessage = '';
    try {
      const activeCue = this.customVoice.recordingCue;
      if (activeCue === cue) {
        await this.customVoice.stopRecording();
        this.statusMessage = '录音已保存，可以点击绿色按钮试听';
      } else {
        if (activeCue) {
          await this.customVoice.stopRecording();
        }
        await this.customVoice.startRecording(cue);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      this.statusMessage = message || '录音失败，请检查麦克风权限后重试';
      console.warn('[VoiceSettings] Recording failed:', error);
    } finally {
      this.busy = false;
      if (this.contentRoot?.name === 'VoiceSettings') {
        this.show();
      }
    }
  }

  private async confirmDelete(cue: VoiceCue): Promise<void> {
    if (this.busy) {
      return;
    }
    if (this.deleteConfirmCue !== cue) {
      this.deleteConfirmCue = cue;
      this.statusMessage = '';
      this.show();
      return;
    }
    this.busy = true;
    try {
      await this.customVoice?.deleteRecording(cue);
      this.statusMessage = '录音已删除';
    } catch {
      this.statusMessage = '删除失败，请稍后重试';
    } finally {
      this.busy = false;
      this.deleteConfirmCue = null;
      if (this.contentRoot?.name === 'VoiceSettings') {
        this.show();
      }
    }
  }

  private handleBack(): void {
    if (this.customVoice?.isRecording) {
      this.statusMessage = '请先点击停止按钮结束当前录音';
      this.show();
      return;
    }
    this.customVoice?.stopPlayback();
    this.showHome();
  }
}
