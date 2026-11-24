/**
 * 《星匣乱斗：口袋军械库》60fps 战斗舞台画布与回放控制器
 */

import { ITEM_CATALOG, OVERTIME_START_SEC, WAVE_CONFIGS } from '../../shared/protocol.mjs';
import { sfx } from './sfx.mjs';

export class BattleArena {
  constructor(canvas, callbacks = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.callbacks = callbacks;

    this.mode = 'preview'; // 'preview' | 'playing' | 'done'
    this.speed = 1;
    this.report = null;
    this.previewState = null;

    this.simTime = 0;
    this.eventCursor = 0;
    this.lastFrameTs = 0;
    this.rafId = null;

    this.playerHp = 100;
    this.playerMaxHp = 100;
    this.playerShield = 0;
    this.enemyHp = 65;
    this.enemyMaxHp = 65;
    this.enemyShield = 0;
    this.enemyBurn = 0;
    this.enemyShock = 0;
    this.enemyChill = 0;

    this.projectiles = [];
    this.floatingTexts = [];
    this.rings = [];
    this.shakeTime = 0;
    this.shakeAmp = 0;
    this.playerHitFlash = 0;
    this.enemyHitFlash = 0;
    this.idlePhase = 0;
  }

  startLoop() {
    if (this.rafId !== null) return;
    const step = (ts) => {
      if (!this.lastFrameTs) this.lastFrameTs = ts;
      const dt = Math.min(0.05, (ts - this.lastFrameTs) / 1000);
      this.lastFrameTs = ts;
      this.update(dt);
      this.render();
      this.rafId = requestAnimationFrame(step);
    };
    this.rafId = requestAnimationFrame(step);
  }

  stopLoop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  setPreview(state) {
    this.mode = 'preview';
    this.report = null;
    this.previewState = state;
    const waveCfg = WAVE_CONFIGS[(state.wave || 1) - 1] || WAVE_CONFIGS[0];
    this.playerMaxHp = state.playerMaxHp || 100;
    this.playerHp = this.playerMaxHp;
    this.playerShield = (state.relics || []).includes('titanium_hull') ? 25 : 0;
    this.enemyMaxHp = waveCfg.maxHp;
    this.enemyHp = waveCfg.maxHp;
    this.enemyShield = waveCfg.initialShield;
    this.enemyBurn = 0;
    this.enemyShock = 0;
    this.enemyChill = 0;
    this.projectiles = [];
    this.floatingTexts = [];
    this.rings = [];
  }

  playReport(report) {
    this.report = report;
    this.mode = 'playing';
    this.simTime = 0;
    this.eventCursor = 0;
    this.playerMaxHp = report.playerStartHp;
    this.playerHp = report.playerStartHp;
    this.playerShield = report.playerStartShield;
    this.enemyMaxHp = report.enemy.maxHp;
    this.enemyHp = report.enemy.maxHp;
    this.enemyShield = report.enemy.initialShield;
    this.enemyBurn = 0;
    this.enemyShock = 0;
    this.enemyChill = 0;
    this.projectiles = [];
    this.floatingTexts = [];
    this.rings = [];
  }

  setSpeed(speed) {
    this.speed = speed;
  }

  skipToEnd() {
    if (!this.report || this.mode !== 'playing') return;
    while (this.eventCursor < this.report.timeline.length) {
      this.consumeEvent(this.report.timeline[this.eventCursor], true);
      this.eventCursor++;
    }
    this.simTime = this.report.durationSec;
    this.finishPlayback();
  }

  finishPlayback() {
    if (this.mode === 'done') return;
    this.mode = 'done';
    if (this.report) {
      this.playerHp = this.report.playerEndHp;
      this.playerShield = this.report.playerEndShield;
      this.enemyHp = this.report.enemyEndHp;
      this.enemyShield = this.report.enemyEndShield;
      if (this.report.won) sfx.playVictory();
      else sfx.playDefeat();
      this.callbacks.onPlaybackComplete?.(this.report);
    }
  }

  consumeEvent(ev, silent = false) {
    this.playerHp = ev.playerHp;
    this.playerShield = ev.playerShield;
    this.enemyHp = ev.enemyHp;
    this.enemyShield = ev.enemyShield;
    this.enemyBurn = ev.enemyBurn ?? this.enemyBurn;
    this.enemyShock = ev.enemyShock ?? this.enemyShock;
    this.enemyChill = ev.enemyChill ?? this.enemyChill;

    if (silent) return;

    const w = this.canvas.width;
    const h = this.canvas.height;
    const pX = w * 0.22;
    const pY = h * 0.56;
    const eX = w * 0.78;
    const eY = h * 0.52;

    if (ev.type === 'weapon_hit') {
      const def = ITEM_CATALOG[ev.itemId];
      const color = def?.color || '#38bdf8';
      this.projectiles.push({
        x: pX + 18,
        y: pY - 4,
        tx: eX - 18,
        ty: eY,
        progress: 0,
        color,
        isCrit: ev.isCrit,
      });
      this.enemyHitFlash = 0.16;
      if (ev.isCrit) {
        this.shakeTime = 0.18;
        this.shakeAmp = 5;
      }
      this.floatingTexts.push({
        x: eX + (Math.random() * 24 - 12),
        y: eY - 26,
        text: ev.isCrit ? `💥 -${ev.damage}` : `-${ev.damage}`,
        color: ev.isCrit ? '#fde047' : '#f8fafc',
        vy: -36,
        life: 0.75,
        maxLife: 0.75,
        scale: ev.isCrit ? 1.25 : 1,
      });
      if (ev.vampHealed > 0) {
        this.floatingTexts.push({
          x: pX,
          y: pY - 24,
          text: `+${ev.vampHealed}`,
          color: '#4ade80',
          vy: -28,
          life: 0.65,
          maxLife: 0.65,
          scale: 0.9,
        });
      }
      sfx.playHit(ev.isCrit);
      this.callbacks.onItemTrigger?.(ev.instanceId, color);
    } else if (ev.type === 'shield_gain') {
      this.rings.push({ x: pX, y: pY, r: 16, maxR: 46, color: '#fbbf24', life: 0.45, maxLife: 0.45 });
      this.floatingTexts.push({
        x: pX + (Math.random() * 16 - 8),
        y: pY - 24,
        text: `🛡 +${ev.shieldGained}`,
        color: '#fcd34d',
        vy: -30,
        life: 0.7,
        maxLife: 0.7,
        scale: 0.95,
      });
      sfx.playShield();
      this.callbacks.onItemTrigger?.(ev.instanceId, '#fbbf24');
    } else if (ev.type === 'gadget_heal') {
      this.rings.push({ x: pX, y: pY, r: 12, maxR: 42, color: '#4ade80', life: 0.45, maxLife: 0.45 });
      const label = ev.healed > 0 ? `+${ev.healed} HP` : `🛡 +${ev.shieldGained}`;
      this.floatingTexts.push({
        x: pX,
        y: pY - 24,
        text: label,
        color: '#4ade80',
        vy: -30,
        life: 0.7,
        maxLife: 0.7,
        scale: 0.95,
      });
      sfx.playHeal();
      this.callbacks.onItemTrigger?.(ev.instanceId, '#4ade80');
    } else if (ev.type === 'burn_tick') {
      this.floatingTexts.push({
        x: eX - 18,
        y: eY - 34,
        text: `🔥 -${ev.damage}`,
        color: '#fb7185',
        vy: -26,
        life: 0.65,
        maxLife: 0.65,
        scale: 0.92,
      });
    } else if (ev.type === 'enemy_attack') {
      this.projectiles.push({
        x: eX - 18,
        y: eY,
        tx: pX + 18,
        ty: pY,
        progress: 0,
        color: '#f43f5e',
        isCrit: false,
      });
      this.playerHitFlash = 0.16;
      this.shakeTime = 0.12;
      this.shakeAmp = 3.5;
      this.floatingTexts.push({
        x: pX + (Math.random() * 16 - 8),
        y: pY - 28,
        text: `-${ev.damage}`,
        color: '#fda4af',
        vy: -34,
        life: 0.75,
        maxLife: 0.75,
        scale: 1,
      });
    } else if (ev.type === 'overtime_storm') {
      this.shakeTime = 0.15;
      this.shakeAmp = 4;
      this.floatingTexts.push({
        x: w * 0.5,
        y: h * 0.34,
        text: `⚡星渊风暴 -${ev.damage}`,
        color: '#f59e0b',
        vy: -24,
        life: 0.85,
        maxLife: 0.85,
        scale: 1,
      });
    }
  }

  update(dt) {
    this.idlePhase += dt * 2.4;
    if (this.shakeTime > 0) this.shakeTime = Math.max(0, this.shakeTime - dt);
    if (this.playerHitFlash > 0) this.playerHitFlash = Math.max(0, this.playerHitFlash - dt);
    if (this.enemyHitFlash > 0) this.enemyHitFlash = Math.max(0, this.enemyHitFlash - dt);

    if (this.mode === 'playing' && this.report) {
      this.simTime += dt * this.speed;
      while (
        this.eventCursor < this.report.timeline.length &&
        this.report.timeline[this.eventCursor].time <= this.simTime + 1e-6
      ) {
        this.consumeEvent(this.report.timeline[this.eventCursor], false);
        this.eventCursor++;
      }
      if (this.eventCursor >= this.report.timeline.length && this.simTime >= this.report.durationSec) {
        this.finishPlayback();
      }
    }

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.progress += dt * (4.8 * Math.max(1, this.speed * 0.75));
      if (p.progress >= 1) this.projectiles.splice(i, 1);
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.life -= dt;
      if (ft.life <= 0) this.floatingTexts.splice(i, 1);
    }

    for (let i = this.rings.length - 1; i >= 0; i--) {
      const rg = this.rings[i];
      rg.life -= dt;
      rg.r = rg.maxR * (1 - rg.life / rg.maxLife);
      if (rg.life <= 0) this.rings.splice(i, 1);
    }
  }

  drawHpBar(x, y, width, hp, maxHp, shield, accentColor) {
    const ctx = this.ctx;
    const barH = 10;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.beginPath();
    ctx.roundRect(x, y, width, barH, 5);
    ctx.fill();

    const pct = Math.max(0, Math.min(1, hp / Math.max(1, maxHp)));
    if (pct > 0) {
      ctx.fillStyle = accentColor;
      ctx.beginPath();
      ctx.roundRect(x, y, width * pct, barH, 5);
      ctx.fill();
    }

    if (shield > 0) {
      const sPct = Math.min(1, shield / Math.max(1, maxHp));
      ctx.fillStyle = 'rgba(251, 191, 36, 0.85)';
      ctx.beginPath();
      ctx.roundRect(x, y + barH + 3, width * sPct, 4, 2);
      ctx.fill();
    }

    ctx.font = '600 11px system-ui, "Noto Sans SC", sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';
    const text = shield > 0 ? `${hp}/${maxHp} (+${shield}🛡)` : `${hp}/${maxHp}`;
    ctx.fillText(text, x + width / 2, y - 5);
  }

  drawMech(cx, cy, isEnemy, waveNum, accentColor, hitFlash, shield) {
    const ctx = this.ctx;
    const bob = Math.sin(this.idlePhase + (isEnemy ? 2 : 0)) * 3;
    ctx.save();
    ctx.translate(cx, cy + bob);

    if (shield > 0) {
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.55)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, 31, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (!isEnemy) {
      // 玩家星匣先锋核心机甲
      ctx.fillStyle = hitFlash > 0 ? '#fca5a5' : '#0f172a';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(-22, -22, 44, 44, 11);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#0ea5e9';
      ctx.beginPath();
      ctx.arc(0, -2, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#e0f2fe';
      ctx.beginPath();
      ctx.arc(3, -3, 4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // 敌方机甲造型随波次区分
      const isBoss = waveNum === 5 || waveNum === 10;
      const radius = isBoss ? 27 : 22;
      ctx.fillStyle = hitFlash > 0 ? '#fecaca' : '#1e1b4b';
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = isBoss ? 3.2 : 2.4;
      ctx.beginPath();
      const sides = isBoss ? 8 : 6;
      for (let i = 0; i < sides; i++) {
        const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
        const px = Math.cos(angle) * radius;
        const py = Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 敌方核心护目镜
      ctx.fillStyle = accentColor;
      ctx.beginPath();
      ctx.roundRect(-12, -5, 24, 9, 4);
      ctx.fill();
      ctx.fillStyle = '#fff1f2';
      ctx.beginPath();
      ctx.arc(-4, -0.5, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);

    ctx.save();
    if (this.shakeTime > 0) {
      ctx.translate(
        (Math.random() - 0.5) * this.shakeAmp * 2,
        (Math.random() - 0.5) * this.shakeAmp * 2
      );
    }

    // 背景网格线与能量地平线
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#0b1224');
    bgGrad.addColorStop(1, '#111c33');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 20; x < w; x += 28) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(0, h * 0.78);
    ctx.lineTo(w, h * 0.78);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
    ctx.stroke();

    const waveNum = this.report?.wave || this.previewState?.wave || 1;
    const waveCfg = WAVE_CONFIGS[waveNum - 1] || WAVE_CONFIGS[0];

    // 加时风暴警告氛围
    if (this.mode === 'playing' && this.simTime >= OVERTIME_START_SEC) {
      ctx.fillStyle = `rgba(245, 158, 11, ${0.08 + Math.sin(this.idlePhase * 3) * 0.04})`;
      ctx.fillRect(0, 0, w, h);
    }

    const pX = w * 0.22;
    const pY = h * 0.56;
    const eX = w * 0.78;
    const eY = h * 0.54;

    this.drawMech(pX, pY, false, waveNum, '#38bdf8', this.playerHitFlash, this.playerShield);
    this.drawMech(
      eX,
      eY,
      true,
      waveNum,
      waveCfg.accentColor,
      this.enemyHitFlash,
      this.enemyShield
    );

    // 光环扩散
    for (const rg of this.rings) {
      ctx.strokeStyle = rg.color;
      ctx.globalAlpha = Math.max(0, rg.life / rg.maxLife);
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(rg.x, rg.y, rg.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // 弹道激光
    for (const pr of this.projectiles) {
      const px = pr.x + (pr.tx - pr.x) * pr.progress;
      const py = pr.y + (pr.ty - pr.y) * pr.progress - Math.sin(pr.progress * Math.PI) * 18;
      ctx.strokeStyle = pr.color;
      ctx.lineWidth = pr.isCrit ? 5 : 3;
      ctx.beginPath();
      ctx.moveTo(px - (pr.tx - pr.x) * 0.1, py);
      ctx.lineTo(px, py);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(px, py, pr.isCrit ? 4 : 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 血条
    this.drawHpBar(14, 24, 118, this.playerHp, this.playerMaxHp, this.playerShield, '#22c55e');
    this.drawHpBar(
      w - 132,
      24,
      118,
      this.enemyHp,
      this.enemyMaxHp,
      this.enemyShield,
      waveCfg.accentColor
    );

    // 双方名字
    ctx.font = '700 11px system-ui, "Noto Sans SC", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#7dd3fc';
    ctx.fillText('星匣先锋', 14, h - 10);

    ctx.textAlign = 'right';
    ctx.fillStyle = waveCfg.isBoss ? '#fbbf24' : '#cbd5e1';
    ctx.fillText(waveCfg.name, w - 14, h - 10);

    // 异常状态标签
    const statuses = [];
    if (this.enemyBurn > 0) statuses.push(`🔥${this.enemyBurn}`);
    if (this.enemyShock > 0) statuses.push(`⚡${this.enemyShock}`);
    if (this.enemyChill > 0) statuses.push(`❄️${this.enemyChill}`);
    if (statuses.length > 0) {
      ctx.textAlign = 'center';
      ctx.font = '600 11px system-ui, sans-serif';
      ctx.fillStyle = '#f8fafc';
      ctx.fillText(statuses.join(' '), eX, eY + 42);
    }

    // 中央战斗计时 / 敌人预告
    ctx.textAlign = 'center';
    if (this.mode === 'playing') {
      ctx.font = '700 13px ui-monospace, monospace';
      ctx.fillStyle = this.simTime >= OVERTIME_START_SEC ? '#fbbf24' : '#94a3b8';
      const label =
        this.simTime >= OVERTIME_START_SEC
          ? `⚡加时 ${this.simTime.toFixed(1)}s`
          : `${this.simTime.toFixed(1)}s`;
      ctx.fillText(label, w / 2, 26);
    } else {
      ctx.font = '600 11px system-ui, "Noto Sans SC", sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`攻 ${waveCfg.attack} / ${waveCfg.cooldownSec}s`, w / 2, 26);
    }

    // 飘字
    for (const ft of this.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.life / ft.maxLife);
      ctx.font = `800 ${Math.round(13 * ft.scale)}px system-ui, "Noto Sans SC", sans-serif`;
      ctx.fillStyle = ft.color;
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }

    ctx.restore();
  }
}
