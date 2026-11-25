/**
 * 《铁血防线：1944》沙盘交互与战地拟音
 * 所有音效均由浏览器现场合成。
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.noiseBuffer = null;
    this.battleCompressor = null;
    this._lastDetentAt = 0;
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

  tone({ freq = 440, endFreq = null, duration = 0.08, type = 'sine', gain = 0.08, delay = 0, output = null }) {
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
    amp.gain.linearRampToValueAtTime(gain, now + 0.006);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(amp);
    amp.connect(output ?? ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.015);
  }

  battleOutput(ctx) {
    if (!this.battleCompressor) {
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -18;
      compressor.knee.value = 16;
      compressor.ratio.value = 6;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.12;
      compressor.connect(ctx.destination);
      this.battleCompressor = compressor;
    }
    return this.battleCompressor;
  }

  filteredNoise(ctx, {
    type = 'lowpass', frequency, endFrequency = frequency,
    resonance = 0.7, duration, gain, delay = 0,
  }) {
    if (!this.noiseBuffer) {
      // 同一段白噪声供所有音色复用，每次从不同位置取样。
      this.noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const samples = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < samples.length; i++) {
        samples[i] = Math.random() * 2 - 1;
      }
    }

    const now = ctx.currentTime + delay;
    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const amp = ctx.createGain();
    source.buffer = this.noiseBuffer;
    filter.type = type;
    filter.Q.value = resonance;
    filter.frequency.setValueAtTime(frequency, now);
    filter.frequency.exponentialRampToValueAtTime(endFrequency, now + duration);
    amp.gain.setValueAtTime(0.0001, now);
    amp.gain.linearRampToValueAtTime(gain, now + 0.002);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    source.connect(filter);
    filter.connect(amp);
    amp.connect(this.battleOutput(ctx));
    source.start(now, Math.random() * (this.noiseBuffer.duration - duration), duration);
  }

  // 抓取模块解锁气动声
  playLift() {
    this.tone({ freq: 240, endFreq: 460, duration: 0.045, type: 'triangle', gain: 0.055 });
  }

  // 拖拽经过网格时的逐格机械棘轮卡榫声 (45ms 节流)
  playDetent() {
    const now = performance.now();
    if (now - this._lastDetentAt < 45) return;
    this._lastDetentAt = now;
    this.tone({ freq: 920, endFreq: 420, duration: 0.018, type: 'triangle', gain: 0.025 });
  }

  // 合法松手重装锁入（低频厚重撞击 + 高频锁扣弹响）
  playLockIn() {
    this.tone({ freq: 155, endFreq: 68, duration: 0.085, type: 'triangle', gain: 0.11 });
    this.tone({ freq: 620, endFreq: 860, duration: 0.032, type: 'sine', gain: 0.05, delay: 0.025 });
  }

  // 非法重叠碰撞金属刺耳震颤声
  playClang() {
    this.tone({ freq: 190, endFreq: 125, duration: 0.11, type: 'sawtooth', gain: 0.065 });
    this.tone({ freq: 235, endFreq: 160, duration: 0.11, type: 'triangle', gain: 0.06, delay: 0.01 });
  }

  playPlace() {
    this.playLockIn();
  }

  playRotate() {
    this.tone({ freq: 410, endFreq: 680, duration: 0.045, type: 'triangle', gain: 0.055 });
  }

  playBuy() {
    this.tone({ freq: 440, endFreq: 560, duration: 0.055, type: 'triangle', gain: 0.065 });
    this.tone({ freq: 740, duration: 0.075, type: 'sine', gain: 0.07, delay: 0.04 });
  }

  playSell() {
    this.tone({ freq: 580, endFreq: 920, duration: 0.08, type: 'sine', gain: 0.06 });
  }

  playMerge() {
    this.tone({ freq: 440, duration: 0.08, type: 'triangle', gain: 0.08, delay: 0 });
    this.tone({ freq: 660, duration: 0.08, type: 'triangle', gain: 0.085, delay: 0.05 });
    this.tone({ freq: 990, duration: 0.16, type: 'sine', gain: 0.1, delay: 0.1 });
  }

  playError() {
    this.playClang();
  }

  playHit(isCrit = false) {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    this.filteredNoise(ctx, {
      frequency: isCrit ? 1500 : 1050,
      endFrequency: isCrit ? 260 : 350,
      duration: isCrit ? 0.17 : 0.08,
      gain: isCrit ? 0.28 : 0.16,
    });
    if (isCrit) {
      this.tone({ freq: 135, endFreq: 52, duration: 0.12, gain: 0.12, output: this.battleOutput(ctx) });
    }
  }

  playCannonBlast() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    // 炮口爆鸣在前，低频冲击和尘土尾声随后落下。
    this.filteredNoise(ctx, { frequency: 2600, endFrequency: 720, duration: 0.075, gain: 0.46 });
    this.filteredNoise(ctx, {
      frequency: 620, endFrequency: 90, duration: 0.48, gain: 0.68, delay: 0.012,
    });
    this.tone({
      freq: 104, endFreq: 36, duration: 0.27, gain: 0.26, delay: 0.008, output: this.battleOutput(ctx),
    });
  }

  playMgBurst() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const shotTimes = [0, 0.073, 0.15, 0.225];
    shotTimes.forEach((delay, index) => {
      // 每发先响一声短促的金属撞针，再接枪口爆音。
      this.filteredNoise(ctx, {
        type: 'bandpass', frequency: 2450, endFrequency: 1800,
        resonance: 2.8, duration: 0.022, gain: 0.28, delay,
      });
      this.filteredNoise(ctx, {
        frequency: 2200 - index * 140, endFrequency: 500,
        duration: 0.053, gain: 0.38 - index * 0.04, delay: delay + 0.008,
      });
    });
  }

  playFlakBlast() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    // 双联高射炮的两声闷响紧挨着，后一声略远。
    this.filteredNoise(ctx, { frequency: 780, endFrequency: 230, duration: 0.15, gain: 0.66 });
    this.filteredNoise(ctx, {
      frequency: 630, endFrequency: 150, duration: 0.19, gain: 0.52, delay: 0.065,
    });
    this.tone({
      freq: 151, endFreq: 69, duration: 0.14, gain: 0.17, delay: 0.018, output: this.battleOutput(ctx),
    });
  }

  playShield() {
    this.tone({ freq: 280, endFreq: 520, duration: 0.09, type: 'sine', gain: 0.05 });
  }

  playHeal() {
    this.tone({ freq: 520, endFreq: 780, duration: 0.1, type: 'sine', gain: 0.045 });
  }

  playVictory() {
    [440, 554, 659, 880].forEach((f, idx) => {
      this.tone({ freq: f, duration: 0.14, type: 'triangle', gain: 0.08, delay: idx * 0.07 });
    });
  }

  playDefeat() {
    [320, 260, 210, 150].forEach((f, idx) => {
      this.tone({ freq: f, duration: 0.16, type: 'sawtooth', gain: 0.06, delay: idx * 0.09 });
    });
  }
}

export const sfx = new SoundEngine();
