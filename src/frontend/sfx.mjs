/**
 * 《星匣：深渊防线》v3.0 机械阻尼物理音效 & 战区合成音频引擎
 * 零外部音频资源依赖，强化抓取、逐格卡榫、重装锁入与金属碰撞手感。
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
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
    amp.gain.linearRampToValueAtTime(gain, now + 0.006);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(amp);
    amp.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.015);
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
    if (isCrit) {
      this.tone({ freq: 680, endFreq: 110, duration: 0.13, type: 'sawtooth', gain: 0.085 });
    } else {
      this.tone({ freq: 340, endFreq: 130, duration: 0.06, type: 'square', gain: 0.035 });
    }
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
