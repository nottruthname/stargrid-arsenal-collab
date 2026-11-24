/**
 * 《星匣乱斗：口袋军械库》v2.0 真实精灵骨骼动效 & 机甲剧场渲染引擎
 * - 真实背景贴图 + 透明抠图机甲精灵（Q版蓝金先锋 / 绯红突袭者 / 深空终焉首领）
 * - 呼吸动画、开火前冲、受击像素级白闪剪影、延迟扣血残影条、专属武器光束/电弧/斩击
 */

import { ITEM_CATALOG, OVERTIME_START_SEC, WAVE_CONFIGS } from '../../shared/protocol.mjs';
import { sfx } from './sfx.mjs';

function loadImage(src) {
  const img = new Image();
  img.loaded = false;
  img.failed = false;
  img.onload = () => {
    img.loaded = true;
  };
  img.onerror = () => {
    img.failed = true;
  };
  img.src = src;
  return img;
}

const PRELOADED_ASSETS = {
  bg: loadImage('./src/frontend/assets/bg-hangar.jpg'),
  hero: loadImage('./src/frontend/assets/hero-mech.png'),
  enemy: loadImage('./src/frontend/assets/enemy-raider.png'),
  boss: loadImage('./src/frontend/assets/boss-overlord.png'),
};

export class BattleArena {
  constructor(canvas, callbacks = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.callbacks = callbacks;

    this.assets = PRELOADED_ASSETS;

    // 离屏画布用于实现像素级纯白受击闪烁剪影
    this.flashCanvas = document.createElement('canvas');
    this.flashCanvas.width = 256;
    this.flashCanvas.height = 256;
    this.flashCtx = this.flashCanvas.getContext('2d');

    this.mode = 'preview'; // 'preview' | 'playing' | 'done'
    this.speed = 1;
    this.report = null;
    this.previewState = null;

    this.simTime = 0;
    this.eventCursor = 0;
    this.lastFrameTs = 0;
    this.rafId = null;

    this.playerHp = 100;
    this.playerTrailHp = 100;
    this.playerMaxHp = 100;
    this.playerShield = 0;

    this.enemyHp = 65;
    this.enemyTrailHp = 65;
    this.enemyMaxHp = 65;
    this.enemyShield = 0;
    this.enemyBurn = 0;
    this.enemyShock = 0;
    this.enemyChill = 0;

    this.projectiles = [];
    this.beams = [];
    this.bolts = [];
    this.particles = [];
    this.floatingTexts = [];
    this.rings = [];
    this.muzzleFlashes = [];
    this.ambientMotes = Array.from({ length: 14 }, (_, i) => ({
      x: ((i * 73) % 100) / 100,
      y: ((i * 41) % 100) / 100,
      r: 1 + (i % 2),
      spd: 0.04 + (i % 4) * 0.02,
      phase: i * 0.8,
    }));

    this.shakeTime = 0;
    this.shakeAmp = 0;
    this.playerHitFlash = 0;
    this.enemyHitFlash = 0;
    this.playerAttackKick = 0;
    this.enemyAttackKick = 0;
    this.playerKnockback = 0;
    this.enemyKnockback = 0;
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
    this.playerTrailHp = this.playerMaxHp;
    this.playerShield = (state.relics || []).includes('titanium_hull') ? 25 : 0;
    this.enemyMaxHp = waveCfg.maxHp;
    this.enemyHp = waveCfg.maxHp;
    this.enemyTrailHp = waveCfg.maxHp;
    this.enemyShield = waveCfg.initialShield;
    this.enemyBurn = 0;
    this.enemyShock = 0;
    this.enemyChill = 0;
    this.clearFx();
  }

  playReport(report) {
    this.report = report;
    this.mode = 'playing';
    this.simTime = 0;
    this.eventCursor = 0;
    this.playerMaxHp = report.playerStartHp;
    this.playerHp = report.playerStartHp;
    this.playerTrailHp = report.playerStartHp;
    this.playerShield = report.playerStartShield;
    this.enemyMaxHp = report.enemy.maxHp;
    this.enemyHp = report.enemy.maxHp;
    this.enemyTrailHp = report.enemy.maxHp;
    this.enemyShield = report.enemy.initialShield;
    this.enemyBurn = 0;
    this.enemyShock = 0;
    this.enemyChill = 0;
    this.clearFx();
  }

  clearFx() {
    this.projectiles = [];
    this.beams = [];
    this.bolts = [];
    this.particles = [];
    this.floatingTexts = [];
    this.rings = [];
    this.muzzleFlashes = [];
    this.playerHitFlash = 0;
    this.enemyHitFlash = 0;
    this.playerAttackKick = 0;
    this.enemyAttackKick = 0;
    this.playerKnockback = 0;
    this.enemyKnockback = 0;
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

  spawnSparks(x, y, color, count = 12) {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 45 + Math.random() * 140;
      this.particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 30,
        r: 2 + Math.random() * 2.5,
        color,
        life: 0.28 + Math.random() * 0.25,
        maxLife: 0.5,
      });
    }
  }

  getStageAnchors() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const isExpanded = this.mode === 'playing' || h > 165;
    const floorY = h * (isExpanded ? 0.85 : 0.89);
    const spriteSize = isExpanded ? 114 : 54;
    return {
      w,
      h,
      isExpanded,
      floorY,
      spriteSize,
      pX: w * 0.23,
      pY: floorY - spriteSize * 0.48,
      eX: w * 0.77,
      eY: floorY - spriteSize * 0.48,
    };
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

    const { w, h, pX, pY, eX, eY, spriteSize } = this.getStageAnchors();
    const muzzleX = pX + spriteSize * 0.35;
    const muzzleY = pY - spriteSize * 0.08;
    const targetX = eX - spriteSize * 0.2;
    const targetY = eY - spriteSize * 0.04;

    if (ev.type === 'weapon_hit') {
      const def = ITEM_CATALOG[ev.itemId];
      const color = def?.color || '#38bdf8';
      this.playerAttackKick = 1.0;
      this.muzzleFlashes.push({ x: muzzleX, y: muzzleY, color, life: 0.14, maxLife: 0.14, r: 18 });

      if (ev.itemId === 'rail_rifle') {
        this.beams.push({
          x1: muzzleX,
          y1: muzzleY,
          x2: targetX,
          y2: targetY,
          color: '#a5b4fc',
          life: 0.28,
          maxLife: 0.28,
          width: ev.isCrit ? 11 : 7,
        });
        this.rings.push({ x: targetX, y: targetY, r: 8, maxR: 48, color: '#818cf8', life: 0.32, maxLife: 0.32 });
        this.spawnSparks(targetX, targetY, '#c7d2fe', ev.isCrit ? 22 : 14);
      } else if (ev.itemId === 'arc_launcher') {
        const pts = [[muzzleX, muzzleY]];
        const segs = 5;
        for (let i = 1; i < segs; i++) {
          const frac = i / segs;
          pts.push([
            muzzleX + (targetX - muzzleX) * frac,
            muzzleY + (targetY - muzzleY) * frac + (Math.random() - 0.5) * 32,
          ]);
        }
        pts.push([targetX, targetY]);
        this.bolts.push({ pts, color: '#e879f9', life: 0.26, maxLife: 0.26 });
        this.spawnSparks(targetX, targetY, '#f0abfc', 14);
      } else {
        this.projectiles.push({
          x: muzzleX,
          y: muzzleY,
          tx: targetX,
          ty: targetY,
          progress: 0,
          color,
          isCrit: ev.isCrit,
          kind: 'slash',
        });
        this.spawnSparks(targetX, targetY, color, ev.isCrit ? 18 : 10);
      }

      this.enemyHitFlash = 0.18;
      this.enemyKnockback = ev.isCrit ? 10 : 5;
      if (ev.isCrit) {
        this.shakeTime = 0.2;
        this.shakeAmp = 5.5;
      }

      this.floatingTexts.push({
        x: eX + (Math.random() * 28 - 14),
        y: eY - spriteSize * 0.45,
        text: ev.isCrit ? `💥${ev.damage}!` : `-${ev.damage}`,
        color: ev.isCrit ? '#fde047' : '#ffffff',
        vy: -42,
        life: 0.85,
        maxLife: 0.85,
        scale: ev.isCrit ? 1.35 : 1.05,
      });

      if (ev.vampHealed > 0) {
        this.floatingTexts.push({
          x: pX,
          y: pY - spriteSize * 0.42,
          text: `+${ev.vampHealed}`,
          color: '#4ade80',
          vy: -32,
          life: 0.7,
          maxLife: 0.7,
          scale: 0.95,
        });
      }
      sfx.playHit(ev.isCrit);
      this.callbacks.onItemTrigger?.(ev.instanceId, color);
    } else if (ev.type === 'shield_gain') {
      this.rings.push({
        x: pX,
        y: pY,
        r: 18,
        maxR: spriteSize * 0.65,
        color: '#fbbf24',
        life: 0.45,
        maxLife: 0.45,
      });
      this.floatingTexts.push({
        x: pX + (Math.random() * 18 - 9),
        y: pY - spriteSize * 0.45,
        text: `🛡 +${ev.shieldGained}`,
        color: '#fde047',
        vy: -34,
        life: 0.75,
        maxLife: 0.75,
        scale: 1.0,
      });
      sfx.playShield();
      this.callbacks.onItemTrigger?.(ev.instanceId, '#fbbf24');
    } else if (ev.type === 'gadget_heal') {
      this.rings.push({
        x: pX,
        y: pY,
        r: 14,
        maxR: spriteSize * 0.58,
        color: '#4ade80',
        life: 0.45,
        maxLife: 0.45,
      });
      const label = ev.healed > 0 ? `+${ev.healed} HP` : `🛡 +${ev.shieldGained}`;
      this.floatingTexts.push({
        x: pX,
        y: pY - spriteSize * 0.45,
        text: label,
        color: '#4ade80',
        vy: -34,
        life: 0.75,
        maxLife: 0.75,
        scale: 1.0,
      });
      sfx.playHeal();
      this.callbacks.onItemTrigger?.(ev.instanceId, '#4ade80');
    } else if (ev.type === 'burn_tick') {
      this.spawnSparks(eX, eY, '#fb7185', 8);
      this.floatingTexts.push({
        x: eX - 18,
        y: eY - spriteSize * 0.52,
        text: `🔥 -${ev.damage}`,
        color: '#fb7185',
        vy: -30,
        life: 0.7,
        maxLife: 0.7,
        scale: 0.95,
      });
    } else if (ev.type === 'enemy_attack') {
      this.enemyAttackKick = 1.0;
      this.projectiles.push({
        x: eX - spriteSize * 0.35,
        y: eY - spriteSize * 0.08,
        tx: pX + spriteSize * 0.2,
        ty: pY,
        progress: 0,
        color: '#f43f5e',
        isCrit: false,
        kind: 'orb',
      });
      this.playerHitFlash = 0.18;
      this.playerKnockback = 7;
      this.shakeTime = 0.14;
      this.shakeAmp = 4;
      this.spawnSparks(pX + 10, pY, '#fb7185', 10);
      this.floatingTexts.push({
        x: pX + (Math.random() * 18 - 9),
        y: pY - spriteSize * 0.45,
        text: `-${ev.damage}`,
        color: '#fda4af',
        vy: -38,
        life: 0.75,
        maxLife: 0.75,
        scale: 1.05,
      });
    } else if (ev.type === 'overtime_storm') {
      this.shakeTime = 0.18;
      this.shakeAmp = 4.5;
      this.floatingTexts.push({
        x: w * 0.5,
        y: h * 0.36,
        text: `⚡星渊风暴 -${ev.damage}`,
        color: '#f59e0b',
        vy: -26,
        life: 0.85,
        maxLife: 0.85,
        scale: 1.05,
      });
    }
  }

  update(dt) {
    this.idlePhase += dt * 3.1;
    if (this.shakeTime > 0) this.shakeTime = Math.max(0, this.shakeTime - dt);
    if (this.playerHitFlash > 0) this.playerHitFlash = Math.max(0, this.playerHitFlash - dt);
    if (this.enemyHitFlash > 0) this.enemyHitFlash = Math.max(0, this.enemyHitFlash - dt);
    if (this.playerAttackKick > 0) this.playerAttackKick = Math.max(0, this.playerAttackKick - dt * 5.5);
    if (this.enemyAttackKick > 0) this.enemyAttackKick = Math.max(0, this.enemyAttackKick - dt * 5.5);
    this.playerKnockback *= Math.pow(0.001, dt);
    this.enemyKnockback *= Math.pow(0.001, dt);

    // 延迟白色掉血残影平滑追赶
    this.playerTrailHp += (this.playerHp - this.playerTrailHp) * Math.min(1, dt * 6);
    this.enemyTrailHp += (this.enemyHp - this.enemyTrailHp) * Math.min(1, dt * 6);

    for (const m of this.ambientMotes) {
      m.y -= m.spd * dt;
      if (m.y < 0) m.y = 1;
    }

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
      p.progress += dt * (5.6 * Math.max(1, this.speed * 0.75));
      if (p.progress >= 1) this.projectiles.splice(i, 1);
    }

    for (let i = this.beams.length - 1; i >= 0; i--) {
      this.beams[i].life -= dt;
      if (this.beams[i].life <= 0) this.beams.splice(i, 1);
    }

    for (let i = this.bolts.length - 1; i >= 0; i--) {
      this.bolts[i].life -= dt;
      if (this.bolts[i].life <= 0) this.bolts.splice(i, 1);
    }

    for (let i = this.muzzleFlashes.length - 1; i >= 0; i--) {
      this.muzzleFlashes[i].life -= dt;
      if (this.muzzleFlashes[i].life <= 0) this.muzzleFlashes.splice(i, 1);
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vy += 260 * dt;
      pt.life -= dt;
      if (pt.life <= 0) this.particles.splice(i, 1);
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.vy *= 0.94;
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

  drawHangarBackground(w, h) {
    const ctx = this.ctx;
    const bg = this.assets.bg;
    if (bg.loaded) {
      const imgAspect = bg.width / bg.height;
      const canvasAspect = w / h;
      let sx = 0;
      let sy = 0;
      let sw = bg.width;
      let sh = bg.height;
      if (canvasAspect > imgAspect) {
        sh = bg.width / canvasAspect;
        // 向下取景，确保地面甲板与星云窗同时入画
        sy = (bg.height - sh) * 0.76;
      } else {
        sw = bg.height * canvasAspect;
        sx = (bg.width - sw) * 0.5;
      }
      ctx.drawImage(bg, sx, sy, sw, sh, 0, 0, w, h);
      // 轻度底部暗化渐变增强角色与血条可读性
      const shade = ctx.createLinearGradient(0, 0, 0, h);
      shade.addColorStop(0, 'rgba(5, 8, 20, 0.45)');
      shade.addColorStop(0.5, 'rgba(5, 8, 20, 0.08)');
      shade.addColorStop(1, 'rgba(5, 8, 20, 0.55)');
      ctx.fillStyle = shade;
      ctx.fillRect(0, 0, w, h);
    } else {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#0b1630');
      g.addColorStop(1, '#15223d');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }

    // 漂浮星尘粒子
    for (const m of this.ambientMotes) {
      const mx = m.x * w + Math.sin(this.idlePhase + m.phase) * 4;
      const my = m.y * h;
      ctx.fillStyle = 'rgba(125, 211, 252, 0.35)';
      ctx.beginPath();
      ctx.arc(mx, my, m.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawSpriteCharacter({ img, cx, floorY, size, phaseOffset, kick, knockback, isEnemy, hitFlash, shield, auraColor }) {
    const ctx = this.ctx;
    const breath = Math.sin(this.idlePhase + phaseOffset);
    const scaleY = 1 + breath * 0.035;
    const scaleX = 1 - breath * 0.02;
    const lungeDir = isEnemy ? -1 : 1;
    const offsetX = kick * 14 * lungeDir - knockback * lungeDir;
    const tilt = kick * 0.08 * lungeDir;

    const drawX = cx + offsetX;
    const drawY = floorY;

    // 脚底接触阴影
    ctx.save();
    ctx.fillStyle = 'rgba(2, 6, 23, 0.65)';
    ctx.beginPath();
    ctx.ellipse(drawX, floorY + 2, size * 0.36, size * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();

    // Boss 或精英脚底光环
    if (auraColor) {
      ctx.strokeStyle = auraColor;
      ctx.globalAlpha = 0.45 + Math.sin(this.idlePhase * 1.5) * 0.15;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.ellipse(drawX, floorY + 1, size * 0.44, size * 0.13, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // 护盾六边形能量罩
    if (shield > 0) {
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.72)';
      ctx.fillStyle = 'rgba(251, 191, 36, 0.09)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(drawX, drawY - size * 0.48, size * 0.56, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.translate(drawX, drawY);
    ctx.rotate(tilt);
    ctx.scale(scaleX, scaleY);

    if (img && img.loaded) {
      ctx.drawImage(img, -size * 0.5, -size, size, size);

      if (hitFlash > 0) {
        const fctx = this.flashCtx;
        fctx.clearRect(0, 0, 256, 256);
        fctx.globalCompositeOperation = 'source-over';
        fctx.drawImage(img, 0, 0, 256, 256);
        fctx.globalCompositeOperation = 'source-in';
        fctx.fillStyle = '#ffffff';
        fctx.fillRect(0, 0, 256, 256);
        fctx.globalCompositeOperation = 'source-over';

        ctx.globalAlpha = Math.min(0.85, hitFlash * 5);
        ctx.drawImage(this.flashCanvas, -size * 0.5, -size, size, size);
        ctx.globalAlpha = 1;
      }
    } else {
      // 图片加载前的精致兜底轮廓
      ctx.fillStyle = isEnemy ? '#9f1239' : '#0284c7';
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(-size * 0.3, -size * 0.85, size * 0.6, size * 0.8, 12);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  drawGameHpBar(x, y, width, hp, trailHp, maxHp, shield, fillColor) {
    const ctx = this.ctx;
    const h = 12;

    // 外框斜切底槽
    ctx.fillStyle = 'rgba(9, 13, 22, 0.88)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x, y, width, h, 4);
    ctx.fill();
    ctx.stroke();

    // 延迟白色掉血残影
    const trailPct = Math.max(0, Math.min(1, trailHp / Math.max(1, maxHp)));
    if (trailPct > 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.82)';
      ctx.beginPath();
      ctx.roundRect(x + 1.5, y + 1.5, Math.max(0, (width - 3) * trailPct), h - 3, 2.5);
      ctx.fill();
    }

    // 实血量条
    const hpPct = Math.max(0, Math.min(1, hp / Math.max(1, maxHp)));
    if (hpPct > 0) {
      const grad = ctx.createLinearGradient(x, y, x, y + h);
      grad.addColorStop(0, fillColor);
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = fillColor;
      ctx.beginPath();
      ctx.roundRect(x + 1.5, y + 1.5, Math.max(0, (width - 3) * hpPct), h - 3, 2.5);
      ctx.fill();

      // 顶部高光条
      ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
      ctx.fillRect(x + 3, y + 2, Math.max(0, (width - 6) * hpPct), 2.5);
    }

    // 护盾条
    if (shield > 0) {
      const sPct = Math.min(1, shield / Math.max(1, maxHp));
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.roundRect(x + 1, y + h + 2, Math.max(4, (width - 2) * sPct), 4, 2);
      ctx.fill();
    }

    // 描边数值
    const label = shield > 0 ? `${hp}/${maxHp} +${shield}🛡` : `${hp}/${maxHp}`;
    ctx.font = '800 10.5px "Space Grotesk", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#090d16';
    ctx.strokeText(label, x + width / 2, y - 4);
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(label, x + width / 2, y - 4);
  }

  render() {
    const ctx = this.ctx;
    const { w, h, isExpanded, floorY, spriteSize, pX, eX } = this.getStageAnchors();
    ctx.clearRect(0, 0, w, h);

    ctx.save();
    if (this.shakeTime > 0) {
      ctx.translate(
        (Math.random() - 0.5) * this.shakeAmp * 2,
        (Math.random() - 0.5) * this.shakeAmp * 2
      );
    }

    this.drawHangarBackground(w, h);

    const waveNum = this.report?.wave || this.previewState?.wave || 1;
    const waveCfg = WAVE_CONFIGS[waveNum - 1] || WAVE_CONFIGS[0];

    if (this.mode === 'playing' && this.simTime >= OVERTIME_START_SEC) {
      ctx.fillStyle = `rgba(245, 158, 11, ${0.14 + Math.sin(this.idlePhase * 3) * 0.06})`;
      ctx.fillRect(0, 0, w, h);
    } else if (waveCfg.isBoss) {
      ctx.fillStyle = 'rgba(244, 63, 94, 0.07)';
      ctx.fillRect(0, 0, w, h);
    }

    // 英雄与敌方角色渲染
    this.drawSpriteCharacter({
      img: this.assets.hero,
      cx: pX,
      floorY,
      size: spriteSize,
      phaseOffset: 0,
      kick: this.playerAttackKick,
      knockback: this.playerKnockback,
      isEnemy: false,
      hitFlash: this.playerHitFlash,
      shield: this.playerShield,
      auraColor: '#38bdf8',
    });

    this.drawSpriteCharacter({
      img: waveCfg.isBoss ? this.assets.boss : this.assets.enemy,
      cx: eX,
      floorY,
      size: waveCfg.isBoss ? spriteSize * 1.12 : spriteSize,
      phaseOffset: 1.8,
      kick: this.enemyAttackKick,
      knockback: this.enemyKnockback,
      isEnemy: true,
      hitFlash: this.enemyHitFlash,
      shield: this.enemyShield,
      auraColor: waveCfg.accentColor,
    });

    // 扩散护盾/冲击光环
    for (const rg of this.rings) {
      ctx.strokeStyle = rg.color;
      ctx.globalAlpha = Math.max(0, rg.life / rg.maxLife);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(rg.x, rg.y, rg.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // 磁轨狙击光束
    for (const bm of this.beams) {
      const alpha = Math.max(0, bm.life / bm.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = bm.color;
      ctx.lineWidth = bm.width;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(bm.x1, bm.y1);
      ctx.lineTo(bm.x2, bm.y2);
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(2, bm.width * 0.4);
      ctx.beginPath();
      ctx.moveTo(bm.x1, bm.y1);
      ctx.lineTo(bm.x2, bm.y2);
      ctx.stroke();
      ctx.restore();
    }

    // 电弧闪电链
    for (const bl of this.bolts) {
      const alpha = Math.max(0, bl.life / bl.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = bl.color;
      ctx.lineWidth = 4.5;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      bl.pts.forEach(([x, y], idx) => (idx === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.restore();
    }

    // 弹道斩击与火球
    for (const pr of this.projectiles) {
      const px = pr.x + (pr.tx - pr.x) * pr.progress;
      const py = pr.y + (pr.ty - pr.y) * pr.progress - Math.sin(pr.progress * Math.PI) * 14;
      ctx.save();
      ctx.translate(px, py);
      if (pr.kind === 'slash') {
        ctx.strokeStyle = pr.color;
        ctx.lineWidth = pr.isCrit ? 5.5 : 3.5;
        ctx.beginPath();
        ctx.arc(0, 0, pr.isCrit ? 14 : 10, -0.9, 0.9);
        ctx.stroke();
      } else {
        ctx.fillStyle = pr.color;
        ctx.beginPath();
        ctx.arc(0, 0, 6.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff1f2';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 枪口闪光
    for (const mf of this.muzzleFlashes) {
      const a = mf.life / mf.maxLife;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(mf.x, mf.y, mf.r * a, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 火花颗粒
    for (const pt of this.particles) {
      const a = Math.max(0, pt.life / pt.maxLife);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.r * a, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 双方游戏风格血条
    this.drawGameHpBar(10, 15, 128, this.playerHp, this.playerTrailHp, this.playerMaxHp, this.playerShield, '#22c55e');
    this.drawGameHpBar(w - 138, 15, 128, this.enemyHp, this.enemyTrailHp, this.enemyMaxHp, this.enemyShield, waveCfg.accentColor);

    // 双方底部名字牌
    ctx.font = '800 10.5px "Space Grotesk", "Noto Sans SC", system-ui, sans-serif';
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#090d16';

    ctx.textAlign = 'left';
    ctx.strokeText('星匣先锋', 10, h - 7);
    ctx.fillStyle = '#7dd3fc';
    ctx.fillText('星匣先锋', 10, h - 7);

    ctx.textAlign = 'right';
    const enemyLabel = waveCfg.isBoss ? `👑 ${waveCfg.name}` : waveCfg.name;
    ctx.strokeText(enemyLabel, w - 10, h - 7);
    ctx.fillStyle = waveCfg.isBoss ? '#fde047' : '#fca5a5';
    ctx.fillText(enemyLabel, w - 10, h - 7);

    // 异常状态图标条
    const statuses = [];
    if (this.enemyBurn > 0) statuses.push(`🔥${this.enemyBurn}`);
    if (this.enemyShock > 0) statuses.push(`⚡${this.enemyShock}`);
    if (this.enemyChill > 0) statuses.push(`❄️${this.enemyChill}`);
    if (statuses.length > 0) {
      ctx.textAlign = 'center';
      ctx.font = '800 11px system-ui, sans-serif';
      ctx.strokeText(statuses.join(' '), eX, Math.min(h - 22, floorY - spriteSize - 2));
      ctx.fillStyle = '#ffffff';
      ctx.fillText(statuses.join(' '), eX, Math.min(h - 22, floorY - spriteSize - 2));
    }

    // 中央对抗信息 / 战斗计时器
    ctx.textAlign = 'center';
    if (this.mode === 'playing') {
      const timeLabel =
        this.simTime >= OVERTIME_START_SEC
          ? `⚡风暴 ${this.simTime.toFixed(1)}s`
          : `⚔️ ${this.simTime.toFixed(1)}s`;
      ctx.font = '800 12px ui-monospace, monospace';
      ctx.strokeText(timeLabel, w / 2, 24);
      ctx.fillStyle = this.simTime >= OVERTIME_START_SEC ? '#fde047' : '#e0f2fe';
      ctx.fillText(timeLabel, w / 2, 24);
    } else {
      const infoLabel = `VS · 敌攻${waveCfg.attack}/${waveCfg.cooldownSec}s`;
      ctx.font = '800 10.5px "Noto Sans SC", system-ui, sans-serif';
      ctx.strokeText(infoLabel, w / 2, 22);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText(infoLabel, w / 2, 22);
    }

    // 粗描边弹跳伤害飘字
    for (const ft of this.floatingTexts) {
      const alpha = Math.max(0, Math.min(1, (ft.life / ft.maxLife) * 1.4));
      const pop = 1 + Math.max(0, (ft.life / ft.maxLife - 0.75) * 1.5);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = `900 ${Math.round(14 * ft.scale * pop)}px "Space Grotesk", "Noto Sans SC", system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#090d16';
      ctx.strokeText(ft.text, ft.x, ft.y);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }

    if (isExpanded && this.mode === 'playing') {
      // 仅轻微压暗底部边缘
    }

    ctx.restore();
  }
}
