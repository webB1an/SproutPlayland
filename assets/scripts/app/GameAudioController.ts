import {
  AudioClip,
  AudioSource,
  Node,
  resources,
} from 'cc';

export type GameSound =
  | 'tap'
  | 'pickup'
  | 'drop'
  | 'success'
  | 'celebrate';

const SOUND_VOLUMES: Record<GameSound, number> = {
  tap: 0.42,
  pickup: 0.5,
  drop: 0.46,
  success: 0.64,
  celebrate: 0.68,
};

/**
 * 全游戏共用的短音效播放器。
 * 新玩法只需要调用 play，不需要重复加载资源或创建 AudioSource。
 */
export class GameAudioController {
  private readonly source: AudioSource;
  private readonly clips = new Map<GameSound, AudioClip>();

  constructor(host: Node) {
    this.source = host.getComponent(AudioSource) ?? host.addComponent(AudioSource);
    this.source.loop = false;
    this.source.playOnAwake = false;
    resources.loadDir('audio/common', AudioClip, (error, clips) => {
      if (error) {
        return;
      }
      for (const clip of clips) {
        if (clip.name in SOUND_VOLUMES) {
          this.clips.set(clip.name as GameSound, clip);
        }
      }
    });
  }

  play(sound: GameSound): void {
    const clip = this.clips.get(sound);
    if (!clip) {
      return;
    }
    this.source.playOneShot(clip, SOUND_VOLUMES[sound]);
  }
}
