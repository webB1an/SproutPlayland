import { sys } from 'cc';

export const VOICE_PHRASES = [
  { cue: 'great', text: '太棒啦！' },
  { cue: 'correct', text: '拼对啦！' },
  { cue: 'retry', text: '再试一次吧！' },
  { cue: 'complete', text: '你完成了！' },
  { cue: 'star1', text: '获得一颗星！' },
  { cue: 'star2', text: '获得两颗星！' },
  { cue: 'star3', text: '获得三颗星！' },
] as const;

export type VoiceCue = typeof VOICE_PHRASES[number]['cue'];

type VoiceRecord = {
  backend: 'wechat' | 'web';
  path?: string;
};

type VoiceRecordMap = Partial<Record<VoiceCue, VoiceRecord>>;

const STORAGE_KEY = 'sprout-playland:custom-voices:v1';
const DATABASE_NAME = 'sprout-playland-voices';
const DATABASE_STORE = 'recordings';
const MAX_RECORDING_DURATION_MS = 6000;

/**
 * 全游戏共用的家长自定义鼓励语音。
 * 没有录制对应事件时 play 会直接返回，不使用任何默认真人语音。
 */
export class CustomVoiceController {
  private readonly records: VoiceRecordMap = {};
  private readonly wechat = (globalThis as any).wx;
  private readonly wechatRecorder: any;
  private activeCue: VoiceCue | null = null;
  private browserStream: any = null;
  private browserRecorder: any = null;
  private browserChunks: any[] = [];
  private browserAudio: any = null;
  private browserObjectUrl: string | null = null;
  private wechatAudio: any = null;
  private pendingWechatStart: {
    resolve: () => void;
    reject: (error: Error) => void;
  } | null = null;
  private pendingWechatStop: {
    cue: VoiceCue;
    resolve: () => void;
    reject: (error: Error) => void;
  } | null = null;
  private lastPlaybackAt = 0;
  private browserStopTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly changeListeners = new Set<() => void>();

  constructor() {
    this.loadRecords();
    this.wechatRecorder = this.wechat?.getRecorderManager?.() ?? null;
    if (this.wechatRecorder) {
      this.bindWechatRecorder();
    }
  }

  get isRecording(): boolean {
    return this.activeCue !== null;
  }

  get recordingCue(): VoiceCue | null {
    return this.activeCue;
  }

  get canRecord(): boolean {
    if (this.wechatRecorder) {
      return true;
    }
    const navigatorLike = (globalThis as any).navigator;
    return Boolean(
      navigatorLike?.mediaDevices?.getUserMedia
      && (globalThis as any).MediaRecorder,
    );
  }

  hasRecording(cue: VoiceCue): boolean {
    return Boolean(this.records[cue]);
  }

  subscribe(listener: () => void): () => void {
    this.changeListeners.add(listener);
    return () => this.changeListeners.delete(listener);
  }

  async startRecording(cue: VoiceCue): Promise<void> {
    if (this.activeCue) {
      throw new Error('已有录音正在进行');
    }
    this.stopPlayback();

    if (this.wechatRecorder) {
      this.activeCue = cue;
      await new Promise<void>((resolve, reject) => {
        this.pendingWechatStart = { resolve, reject };
        this.wechatRecorder.start({
          duration: MAX_RECORDING_DURATION_MS,
          sampleRate: 16000,
          numberOfChannels: 1,
          encodeBitRate: 48000,
          format: 'mp3',
        });
      });
      return;
    }

    const navigatorLike = (globalThis as any).navigator;
    const Recorder = (globalThis as any).MediaRecorder;
    if (!navigatorLike?.mediaDevices?.getUserMedia || !Recorder) {
      throw new Error('当前环境不支持录音');
    }
    this.browserStream = await navigatorLike.mediaDevices.getUserMedia({ audio: true });
    this.browserChunks = [];
    this.browserRecorder = new Recorder(this.browserStream);
    this.browserRecorder.ondataavailable = (event: any) => {
      if (event.data?.size > 0) {
        this.browserChunks.push(event.data);
      }
    };
    this.browserRecorder.start();
    this.activeCue = cue;
    this.browserStopTimer = setTimeout(() => {
      if (this.activeCue === cue) {
        void this.stopRecording().catch(() => undefined);
      }
    }, MAX_RECORDING_DURATION_MS);
    this.notifyChange();
  }

  async stopRecording(): Promise<void> {
    const cue = this.activeCue;
    if (!cue) {
      throw new Error('当前没有正在录制的语音');
    }
    if (this.wechatRecorder) {
      await new Promise<void>((resolve, reject) => {
        this.pendingWechatStop = { cue, resolve, reject };
        this.wechatRecorder.stop();
      });
      return;
    }
    await this.stopBrowserRecording(cue);
  }

  async deleteRecording(cue: VoiceCue): Promise<void> {
    if (this.activeCue === cue) {
      throw new Error('请先结束录音');
    }
    const record = this.records[cue];
    delete this.records[cue];
    this.saveRecords();
    this.notifyChange();
    if (!record) {
      return;
    }
    if (record.backend === 'wechat' && record.path) {
      await this.unlinkWechatFile(record.path);
      return;
    }
    if (record.backend === 'web') {
      await this.deleteBrowserBlob(cue);
    }
  }

  async play(cue: VoiceCue, cooldownMs = 0): Promise<boolean> {
    const now = Date.now();
    if (cooldownMs > 0 && now - this.lastPlaybackAt < cooldownMs) {
      return false;
    }
    const record = this.records[cue];
    if (!record || this.activeCue) {
      return false;
    }
    this.lastPlaybackAt = now;
    this.stopPlayback();
    try {
      if (record.backend === 'wechat' && record.path) {
        this.playWechatFile(record.path);
        return true;
      }
      if (record.backend === 'web') {
        return await this.playBrowserBlob(cue);
      }
    } catch {
      return false;
    }
    return false;
  }

  async playRandom(cues: VoiceCue[], cooldownMs: number): Promise<boolean> {
    const available = cues.filter((cue) => this.hasRecording(cue));
    if (available.length === 0) {
      return false;
    }
    const cue = available[Math.floor(Math.random() * available.length)];
    return this.play(cue, cooldownMs);
  }

  stopPlayback(): void {
    try {
      this.wechatAudio?.stop?.();
    } catch {
      // 播放器已销毁时忽略。
    }
    try {
      this.browserAudio?.pause?.();
    } catch {
      // 浏览器已回收播放器时忽略。
    }
    this.browserAudio = null;
    if (this.browserObjectUrl) {
      (globalThis as any).URL?.revokeObjectURL?.(this.browserObjectUrl);
      this.browserObjectUrl = null;
    }
  }

  dispose(): void {
    this.stopPlayback();
    this.stopBrowserStream();
    this.changeListeners.clear();
    try {
      this.wechatAudio?.destroy?.();
    } catch {
      // 小游戏退出时播放器可能已经被平台回收。
    }
    this.wechatAudio = null;
  }

  private bindWechatRecorder(): void {
    this.wechatRecorder.onStart?.(() => {
      this.pendingWechatStart?.resolve();
      this.pendingWechatStart = null;
      this.notifyChange();
    });
    this.wechatRecorder.onStop?.((result: any) => {
      const pending = this.pendingWechatStop;
      const cue = pending?.cue ?? this.activeCue;
      if (!cue || !result?.tempFilePath) {
        this.finishWechatRecordingWithError(new Error('没有生成录音文件'));
        return;
      }
      void this.persistWechatRecording(cue, result.tempFilePath)
        .then(() => {
          this.activeCue = null;
          pending?.resolve();
          this.pendingWechatStop = null;
          this.notifyChange();
        })
        .catch((error) => this.finishWechatRecordingWithError(error));
    });
    this.wechatRecorder.onError?.((error: any) => {
      const message = error?.errMsg || '录音失败';
      this.pendingWechatStart?.reject(new Error(message));
      this.pendingWechatStart = null;
      this.finishWechatRecordingWithError(new Error(message));
    });
  }

  private finishWechatRecordingWithError(error: Error): void {
    this.activeCue = null;
    this.pendingWechatStop?.reject(error);
    this.pendingWechatStop = null;
    this.notifyChange();
  }

  private async persistWechatRecording(cue: VoiceCue, tempFilePath: string): Promise<void> {
    const fileSystem = this.wechat?.getFileSystemManager?.();
    const userPath = this.wechat?.env?.USER_DATA_PATH;
    if (!fileSystem || !userPath) {
      throw new Error('无法访问小游戏本地文件');
    }
    const destination = `${userPath}/sprout_voice_${cue}.mp3`;
    await new Promise<void>((resolve, reject) => {
      const copy = () => fileSystem.copyFile({
        srcPath: tempFilePath,
        destPath: destination,
        success: resolve,
        fail: (error: any) => reject(new Error(error?.errMsg || '保存录音失败')),
      });
      fileSystem.unlink({
        filePath: destination,
        complete: copy,
      });
    });
    this.records[cue] = { backend: 'wechat', path: destination };
    this.saveRecords();
  }

  private unlinkWechatFile(path: string): Promise<void> {
    const fileSystem = this.wechat?.getFileSystemManager?.();
    if (!fileSystem) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      fileSystem.unlink({
        filePath: path,
        complete: resolve,
      });
    });
  }

  private playWechatFile(path: string): void {
    if (!this.wechatAudio) {
      this.wechatAudio = this.wechat?.createInnerAudioContext?.();
    }
    if (!this.wechatAudio) {
      return;
    }
    this.wechatAudio.stop?.();
    this.wechatAudio.src = path;
    this.wechatAudio.volume = 1;
    this.wechatAudio.play?.();
  }

  private stopBrowserRecording(cue: VoiceCue): Promise<void> {
    return new Promise((resolve, reject) => {
      const recorder = this.browserRecorder;
      if (!recorder) {
        this.activeCue = null;
        reject(new Error('浏览器录音器不可用'));
        return;
      }
      recorder.onerror = () => {
        this.activeCue = null;
        this.stopBrowserStream();
        reject(new Error('录音失败'));
      };
      recorder.onstop = () => {
        const BlobConstructor = (globalThis as any).Blob;
        const blob = new BlobConstructor(this.browserChunks, {
          type: recorder.mimeType || 'audio/webm',
        });
        void this.saveBrowserBlob(cue, blob)
          .then(() => {
            this.records[cue] = { backend: 'web' };
            this.saveRecords();
            this.activeCue = null;
            this.stopBrowserStream();
            this.notifyChange();
            resolve();
          })
          .catch((error) => {
            this.activeCue = null;
            this.stopBrowserStream();
            this.notifyChange();
            reject(error);
          });
      };
      recorder.stop();
    });
  }

  private stopBrowserStream(): void {
    if (this.browserStopTimer) {
      clearTimeout(this.browserStopTimer);
      this.browserStopTimer = null;
    }
    for (const track of this.browserStream?.getTracks?.() ?? []) {
      track.stop?.();
    }
    this.browserStream = null;
    this.browserRecorder = null;
    this.browserChunks = [];
  }

  private async playBrowserBlob(cue: VoiceCue): Promise<boolean> {
    const blob = await this.getBrowserBlob(cue);
    const AudioConstructor = (globalThis as any).Audio;
    const URLConstructor = (globalThis as any).URL;
    if (!blob || !AudioConstructor || !URLConstructor?.createObjectURL) {
      return false;
    }
    this.browserObjectUrl = URLConstructor.createObjectURL(blob);
    this.browserAudio = new AudioConstructor(this.browserObjectUrl);
    this.browserAudio.volume = 1;
    this.browserAudio.onended = () => this.stopPlayback();
    this.browserAudio.onerror = () => this.stopPlayback();
    await this.browserAudio.play();
    return true;
  }

  private openDatabase(): Promise<any> {
    const indexedDatabase = (globalThis as any).indexedDB;
    if (!indexedDatabase) {
      return Promise.reject(new Error('浏览器不支持本地录音存储'));
    }
    return new Promise((resolve, reject) => {
      const request = indexedDatabase.open(DATABASE_NAME, 1);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(DATABASE_STORE)) {
          database.createObjectStore(DATABASE_STORE);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('无法打开本地录音存储'));
    });
  }

  private async saveBrowserBlob(cue: VoiceCue, blob: any): Promise<void> {
    const database = await this.openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(DATABASE_STORE, 'readwrite');
      transaction.objectStore(DATABASE_STORE).put(blob, cue);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(new Error('保存录音失败'));
    });
    database.close();
  }

  private async getBrowserBlob(cue: VoiceCue): Promise<any> {
    const database = await this.openDatabase();
    const blob = await new Promise<any>((resolve, reject) => {
      const request = database
        .transaction(DATABASE_STORE, 'readonly')
        .objectStore(DATABASE_STORE)
        .get(cue);
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(new Error('读取录音失败'));
    });
    database.close();
    return blob;
  }

  private async deleteBrowserBlob(cue: VoiceCue): Promise<void> {
    const database = await this.openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(DATABASE_STORE, 'readwrite');
      transaction.objectStore(DATABASE_STORE).delete(cue);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(new Error('删除录音失败'));
    });
    database.close();
  }

  private loadRecords(): void {
    try {
      const raw = sys.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as VoiceRecordMap;
      for (const phrase of VOICE_PHRASES) {
        const record = parsed[phrase.cue];
        if (record?.backend === 'wechat' || record?.backend === 'web') {
          this.records[phrase.cue] = record;
        }
      }
    } catch {
      // 本地配置损坏时按未录制处理。
    }
  }

  private saveRecords(): void {
    try {
      sys.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.records));
    } catch {
      // 存储不可用时不影响游戏本身。
    }
  }

  private notifyChange(): void {
    for (const listener of this.changeListeners) {
      listener();
    }
  }
}
