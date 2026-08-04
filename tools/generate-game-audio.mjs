import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const SAMPLE_RATE = 44100;
const OUTPUT_DIR = resolve('assets/resources/audio/common');

let noiseState = 0x51f15e;
const noise = () => {
  noiseState = (noiseState * 1664525 + 1013904223) >>> 0;
  return noiseState / 0xffffffff * 2 - 1;
};

const envelope = (time, duration, attack = 0.008, release = 0.08) => {
  const fadeIn = Math.min(1, time / attack);
  const fadeOut = Math.min(1, Math.max(0, duration - time) / release);
  return Math.sin(fadeIn * Math.PI * 0.5) * Math.sin(fadeOut * Math.PI * 0.5);
};

const sine = (frequency, time, phase = 0) => Math.sin(Math.PI * 2 * frequency * time + phase);

const bell = (frequency, time, decay) => (
  sine(frequency, time) * Math.exp(-time * decay)
  + sine(frequency * 2.01, time, 0.2) * 0.34 * Math.exp(-time * decay * 1.45)
  + sine(frequency * 3.98, time, 0.55) * 0.13 * Math.exp(-time * decay * 2.1)
);

const render = (duration, sampleAt) => {
  const samples = new Float32Array(Math.ceil(duration * SAMPLE_RATE));
  let peak = 0;
  for (let index = 0; index < samples.length; index++) {
    const value = sampleAt(index / SAMPLE_RATE, duration);
    samples[index] = value;
    peak = Math.max(peak, Math.abs(value));
  }
  const scale = peak > 0 ? 0.78 / peak : 1;
  for (let index = 0; index < samples.length; index++) {
    samples[index] *= scale;
  }
  return samples;
};

const writeWav = async (name, samples) => {
  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  for (let index = 0; index < samples.length; index++) {
    const value = Math.max(-1, Math.min(1, samples[index]));
    buffer.writeInt16LE(Math.round(value * 32767), 44 + index * 2);
  }
  await writeFile(resolve(OUTPUT_DIR, `${name}.wav`), buffer);
};

await mkdir(OUTPUT_DIR, { recursive: true });

await writeWav('tap', render(0.09, (time, duration) => {
  const glide = 560 + time / duration * 160;
  return envelope(time, duration, 0.003, 0.055)
    * (sine(glide, time) * 0.75 + sine(glide * 1.98, time) * 0.18);
}));

await writeWav('pickup', render(0.15, (time, duration) => {
  const progress = time / duration;
  const glide = 360 + 470 * Math.pow(progress, 0.72);
  return envelope(time, duration, 0.006, 0.075)
    * (sine(glide, time) * 0.74 + sine(glide * 2, time) * 0.12 + noise() * 0.035);
}));

await writeWav('drop', render(0.18, (time, duration) => {
  const body = sine(145 - time * 260, time) * Math.exp(-time * 19);
  const wood = noise() * Math.exp(-time * 34) * 0.22;
  return envelope(time, duration, 0.002, 0.08) * (body + wood);
}));

await writeWav('success', render(0.38, (time, duration) => {
  const first = bell(659.25, time, 8.5);
  const secondTime = time - 0.105;
  const second = secondTime >= 0 ? bell(987.77, secondTime, 7.8) * 0.82 : 0;
  return envelope(time, duration, 0.004, 0.11) * (first * 0.68 + second);
}));

await writeWav('celebrate', render(1.18, (time, duration) => {
  const notes = [
    [0, 523.25, 0.72],
    [0.18, 659.25, 0.72],
    [0.36, 783.99, 0.78],
    [0.61, 1046.5, 0.92],
  ];
  let value = 0;
  for (const [start, frequency, gain] of notes) {
    const noteTime = time - start;
    if (noteTime >= 0) {
      value += bell(frequency, noteTime, 4.8) * gain;
    }
  }
  const sparkle = time > 0.42
    ? noise() * Math.exp(-(time - 0.42) * 4.5) * 0.035
    : 0;
  return envelope(time, duration, 0.006, 0.18) * (value + sparkle);
}));

console.log(`Generated game audio in ${OUTPUT_DIR}`);
