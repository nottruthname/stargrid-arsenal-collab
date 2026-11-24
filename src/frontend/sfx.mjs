/**
 * 《星匣乱斗：口袋军械库》程序化 WebAudio 合成音效引擎
 * 无需加载外部 MP3/WAV，支持一键静音。
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  ensureCtx() {
    if (this.muted) return null;
    if (typeof window === 'undefined') return null;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!this.ctx) {
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  tone({ freq = 440, endFreq = null, duration = 0.08, type = 'sine', gain = 0.08, delay = 0 }) {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq !== null) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
    }
    amp.gain.setValueAtTime(0.0001, now);
    amp.gain.linearRampToValueAtTime(gain, now + 0.01);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(amp);
    amp.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.01);
  }

  playPlace() {
    this.tone({ freq: 340, endFreq: 520, duration: 0.07, type: 'triangle', gain: 0.08 });
  }

  playRotate() {
    this.tone({ freq: 480, endFreq: 660, duration: 0.06, type: 'sine', gain: 0.06 });
  }

  playBuy() {
    this.tone({ freq: 523, duration: 0.06, type: 'triangle', gain: 0.07 });
    this.tone({ freq: 784, duration: 0.09, type: 'triangle', gain: 0.08, delay: 0.05 });
  }

  playSell() {
    this.tone({ freq: 640, endFreq: 960, duration: 0.09, type: 'sine', gain: 0.06 });
  }

  playMerge() {
    this.tone({ freq: 523, duration: 0.09, type: 'triangle', gain: 0.09, delay: 0 });
    this.tone({ freq: 659, duration: 0.09, type: 'triangle', gain: 0.09, delay: 0.06 });
    this.tone({ freq: 1046, duration: 0.18, type: 'triangle', gain: 0.11, delay: 0.12 });
  }

  playError() {
    this.tone({ freq: 210, endFreq: 130, duration: 0.12, type: 'sawtooth', gain: 0.06 });
  }

  playHit(isCrit = false) {
    if (isCrit) {
      this.tone({ freq: 720, endFreq: 160, duration: 0.14, type: 'sawtooth', gain: 0.09 });
    } else {
      this.tone({ freq: 420, endFreq: 180, duration: 0.07, type: 'square', gain: 0.04 });
    }
  }

  playShield() {
    this.tone({ freq: 300, endFreq: 560, duration: 0.1, type: 'sine', gain: 0.05 });
  }

  playHeal() {
    this.tone({ freq: 587, endFreq: 880, duration: 0.12, type: 'sine', gain: 0.05 });
  }

  playVictory() {
    [523, 659, 784, 1046].forEach((f, idx) => {
      this.tone({ freq: f, duration: 0.14, type: 'triangle', gain: 0.09, delay: idx * 0.08 });
    });
  }

  playDefeat() {
    [392, 349, 293, 220].forEach((f, idx) => {
      this.tone({ freq: f, duration: 0.16, type: 'sawtooth', gain: 0.06, delay: idx * 0.1 });
    });
  }
}

export const sfx = new SoundEngine();
