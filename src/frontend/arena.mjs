/**
 * 《铁血防线：1944》二战钢铁基地召唤海陆空对抗兽潮 — 实景战斗引擎（100% 纯中文）
 * - 100% 忠实同步权威 BattleReport.timeline（绝不篡改后端数值与胜负）
 * - 底部混凝土要塞/沙袋战壕阵地 + 沙盘参战重装炮塔实景进驻 + 玩家手动“红漆集火标尺”
 * - 突击步兵排、马克沁重机枪、高炮黑烟破空、155榴弹抛射、喀秋莎火箭弹幕、重坦推进、轰炸机编队掠影
 */

import { OVERTIME_START_SEC } from '../../shared/protocol.mjs';
import { sfx } from './sfx.mjs';

export class BattleArena {
  constructor(canvas, callbacks = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.callbacks = callbacks;

    this.decalCanvas = document.createElement('canvas');
    this.decalCtx = this.decalCanvas.getContext('2d');

    this.logicalW = 410;
    this.logicalH = 760;

    this.mode = 'idle'; // 'idle' | 'playing' | 'done'
    this.speed = 1;
    this.report = null;

    this.simTime = 0;
    this.eventCursor = 0;
    this.lastFrameTs = 0;
    this.rafId = null;

    this.playerHp = 120;
    this.playerMaxHp = 120;
    this.playerShield = 0;

    this.enemyHp = 65;
    this.enemyMaxHp = 65;
    this.enemyShield = 0;
    this.enemyBurn = 0;
    this.enemyBreak = 0;
    this.enemySuppress = 0;
    this.totalEnemyPool = 65;

    this.equipped = {
      infantry: false,
      heavyMg: false,
      flak: false,
      howitzer: false,
      katyusha: false,
      tank: false,
      bomber: false,
      bunker: false,
    };

    this.tankUnit = {
      active: false,
      x: 205,
      y: 600,
      targetX: 205,
      turretAngle: -Math.PI / 2,
      recoil: 0,
      muzzle: 0,
    };

    this.flakAngle = -Math.PI / 2;
    this.mgRecoil = 0;
    this.howitzerRecoil = 0;
    this.wallHealGlow = 0;

    // 玩家点击/拖动地面下达炮火集火标尺
    this.fireOrder = { active: false, x: 205, y: 340, life: 0 };

    this.monsters = [];
    this.killCount = 0;
    this.initialSwarmCount = 18;

    this.tracers = [];
    this.shells = [];
    this.rockets = [];
    this.bombers = [];
    this.flakClouds = [];
    this.explosions = [];
    this.particles = [];
    this.floatingTexts = [];
    this.rings = [];

    this.shakeTime = 0;
    this.shakeAmp = 0;
    this.baseHurtPulse = 0;
    this.ambientPhase = 0;

    this.bgImg = null;
    this.loadBattlefieldImg();
    this.sprites = this.buildSpriteAtlas();
    this.bindInput();
  }

  loadBattlefieldImg() {
    const img = new Image();
    img.onload = () => {
      this.bgImg = img;
    };
    img.src = './src/frontend/assets/ww2_battlefield.jpg';
  }

  /**
   * 离屏预渲染 5 类二战手绘风变异兽群 & 重装坦克精灵
   */
  buildSpriteAtlas() {
    const make = (size, fn) => {
      const c = document.createElement('canvas');
      c.width = size;
      c.height = size;
      const g = c.getContext('2d');
      g.translate(size * 0.5, size * 0.5);
      fn(g);
      return c;
    };

    // 荒原狼兽 (朝下 +Y 冲锋)
    const wolf = make(72, (g) => {
      const fur = g.createRadialGradient(0, -4, 3, 0, 0, 20);
      fur.addColorStop(0, '#574a3e');
      fur.addColorStop(0.65, '#302720');
      fur.addColorStop(1, '#181310');
      g.fillStyle = fur;
      g.beginPath();
      g.ellipse(0, -2, 8.5, 16, 0, 0, Math.PI * 2);
      g.fill();
      // 脊背刚毛与双耳
      g.fillStyle = '#231c16';
      g.beginPath();
      g.moveTo(-6, 7);
      g.lineTo(-9, 1);
      g.lineTo(-2, 12);
      g.moveTo(6, 7);
      g.lineTo(9, 1);
      g.lineTo(2, 12);
      g.fill();
      // 凶红双目
      g.fillStyle = '#ef4444';
      g.beginPath();
      g.arc(-3.2, 10, 1.8, 0, Math.PI * 2);
      g.arc(3.2, 10, 1.8, 0, Math.PI * 2);
      g.fill();
    });

    // 铁皮蛮牛 (厚甲大块头)
    const bull = make(92, (g) => {
      const hide = g.createRadialGradient(-3, -4, 4, 0, 0, 26);
      hide.addColorStop(0, '#6b5340');
      hide.addColorStop(0.6, '#3c2d23');
      hide.addColorStop(1, '#1a130f');
      g.fillStyle = hide;
      g.strokeStyle = '#78624d';
      g.lineWidth = 1.6;
      g.beginPath();
      g.ellipse(0, -2, 16, 20, 0, 0, Math.PI * 2);
      g.fill();
      g.stroke();
      // 弯曲骨质双角
      g.strokeStyle = '#e7dec8';
      g.lineWidth = 3.2;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(-10, 12);
      g.quadraticCurveTo(-20, 20, -11, 25);
      g.moveTo(10, 12);
      g.quadraticCurveTo(20, 20, 11, 25);
      g.stroke();
      g.fillStyle = '#f97316';
      g.beginPath();
      g.arc(-5, 14, 2, 0, Math.PI * 2);
      g.arc(5, 14, 2, 0, Math.PI * 2);
      g.fill();
    });

    // 爆裂毒兽
    const boomer = make(84, (g) => {
      g.fillStyle = '#2d261f';
      g.beginPath();
      g.ellipse(0, 0, 14, 15, 0, 0, Math.PI * 2);
      g.fill();
      for (const [sx, sy, sr] of [
        [-6, -4, 6.5],
        [6, -3, 6],
        [0, 3, 7],
      ]) {
        const sac = g.createRadialGradient(sx - 1, sy - 1, 1, sx, sy, sr);
        sac.addColorStop(0, '#fed7aa');
        sac.addColorStop(0.5, '#ea580c');
        sac.addColorStop(1, '#7c2d12');
        g.fillStyle = sac;
        g.beginPath();
        g.arc(sx, sy, sr, 0, Math.PI * 2);
        g.fill();
      }
      g.fillStyle = '#fde047';
      g.beginPath();
      g.arc(-4, 10, 1.8, 0, Math.PI * 2);
      g.arc(4, 10, 1.8, 0, Math.PI * 2);
      g.fill();
    });

    // 巨兽首领躯体（猛犸王 / 混沌龙皇）
    const boss = make(164, (g) => {
      const grad = g.createRadialGradient(-6, -8, 8, 0, 0, 52);
      grad.addColorStop(0, '#693424');
      grad.addColorStop(0.58, '#381d17');
      grad.addColorStop(1, '#140b09');
      g.fillStyle = grad;
      g.strokeStyle = '#b45309';
      g.lineWidth = 2.6;
      g.beginPath();
      g.ellipse(0, -4, 38, 44, 0, 0, Math.PI * 2);
      g.fill();
      g.stroke();

      // 背脊岩甲鳞片
      g.fillStyle = '#4c3e33';
      for (let ry = -28; ry <= 16; ry += 14) {
        g.beginPath();
        g.moveTo(-14, ry);
        g.lineTo(0, ry - 8);
        g.lineTo(14, ry);
        g.lineTo(0, ry + 7);
        g.closePath();
        g.fill();
      }

      // 巨大弯曲象牙/龙角
      g.strokeStyle = '#efe3c6';
      g.lineWidth = 5.5;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(-18, 30);
      g.quadraticCurveTo(-36, 48, -18, 56);
      g.moveTo(18, 30);
      g.quadraticCurveTo(36, 48, 18, 56);
      g.stroke();

      // 烈焰怒目
      g.fillStyle = '#fde047';
      g.beginPath();
      g.arc(-11, 28, 3.8, 0, Math.PI * 2);
      g.arc(11, 28, 3.8, 0, Math.PI * 2);
      g.fill();
    });

    return { wolf, bull, boomer, boss };
  }

  getWallY() {
    return this.logicalH - 122;
  }

  bindInput() {
    const placeOrder = (e) => {
      if (this.mode !== 'playing') return;
      const rect = this.canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const x = ((e.clientX - rect.left) / rect.width) * this.logicalW;
      const y = ((e.clientY - rect.top) / rect.height) * this.logicalH;
      if (y < this.getWallY() - 10) {
        this.fireOrder = { active: true, x, y, life: 5.5 };
      }
    };
    this.canvas.addEventListener('pointerdown', placeOrder);
    this.canvas.addEventListener('pointermove', (e) => {
      if (e.buttons === 1) placeOrder(e);
    });
  }

  resizeToContainer() {
    const parent = this.canvas.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    const w = Math.max(300, Math.round(rect.width));
    const h = Math.max(420, Math.round(rect.height));
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    this.logicalW = w;
    this.logicalH = h;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (this.decalCanvas.width !== w || this.decalCanvas.height !== h) {
      this.decalCanvas.width = w;
      this.decalCanvas.height = h;
    }
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

  spawnMonster(kind, wave, idx = 0) {
    const w = this.logicalW;
    const isBoss = kind === 'boss';
    const isFlyer = kind === 'flyer';
    const radius = isBoss ? 38 : kind === 'bull' ? 17 : isFlyer ? 14 : 12;
    const baseSpeed = isBoss ? 14 : isFlyer ? 38 : kind === 'bull' ? 20 : 30;
    const laneX = isBoss ? w * 0.5 : 32 + Math.random() * (w - 64);
    const startY = isBoss ? 68 : -20 - (idx % 6) * 32 - Math.random() * 40;

    return {
      id: Math.random().toString(36).slice(2),
      kind,
      x: laneX,
      y: startY,
      radius,
      speed: baseSpeed + Math.min(12, wave * 1.2),
      stridePhase: Math.random() * Math.PI * 2,
      hitFlash: 0,
      alive: true,
      isBoss,
      isFlyer,
    };
  }

  playReport(report, stateSnapshot = null) {
    this.resizeToContainer();
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
    this.totalEnemyPool = Math.max(1, report.enemy.maxHp + report.enemy.initialShield);

    this.enemyBurn = 0;
    this.enemyBreak = 0;
    this.enemySuppress = 0;

    const placed = stateSnapshot?.placedItems || [];
    const has = (id) => placed.some((p) => p.itemId === id);
    this.equipped = {
      infantry: has('infantry_squad'),
      heavyMg: has('heavy_mg'),
      flak: has('flak_cannon'),
      howitzer: has('howitzer_155'),
      katyusha: has('katyusha_mlrs'),
      tank: has('heavy_tank'),
      bomber: has('dive_bomber'),
      bunker: has('concrete_bunker'),
    };

    const wallY = this.getWallY();
    this.tankUnit = {
      active: this.equipped.tank,
      x: this.logicalW * 0.5,
      y: wallY - 34,
      targetX: this.logicalW * 0.5,
      turretAngle: -Math.PI / 2,
      recoil: 0,
      muzzle: 0,
    };

    this.fireOrder = { active: false, x: this.logicalW * 0.5, y: wallY * 0.45, life: 0 };
    this.decalCtx.clearRect(0, 0, this.decalCanvas.width, this.decalCanvas.height);

    this.tracers = [];
    this.shells = [];
    this.rockets = [];
    this.bombers = [];
    this.flakClouds = [];
    this.explosions = [];
    this.particles = [];
    this.floatingTexts = [];
    this.rings = [];
    this.shakeTime = 0;
    this.baseHurtPulse = 0;

    this.monsters = [];
    this.killCount = 0;
    const count = 16 + report.wave * 3;
    this.initialSwarmCount = count;

    for (let i = 0; i < count; i++) {
      let kind = 'wolf';
      const roll = Math.random();
      if (report.enemy.isAerial) {
        kind = roll > 0.35 ? 'flyer' : roll > 0.15 ? 'bull' : 'wolf';
      } else if (report.wave >= 4) {
        kind = roll > 0.78 ? 'boomer' : roll > 0.48 ? 'bull' : 'wolf';
      } else if (report.wave >= 2) {
        kind = roll > 0.55 ? 'bull' : 'wolf';
      }
      const m = this.spawnMonster(kind, report.wave, i);
      if (i < 8) {
        m.y = 115 + Math.random() * 145;
      }
      this.monsters.push(m);
    }

    if (report.enemy.isBoss) {
      const boss = this.spawnMonster('boss', report.wave, 0);
      boss.y = 148;
      this.monsters.push(boss);
      this.initialSwarmCount += 1;
    }

    this.emitTelemetry();
  }

  emitTelemetry() {
    this.callbacks.onTelemetryTick?.({
      simTime: this.simTime,
      playerHp: this.playerHp,
      playerMaxHp: this.playerMaxHp,
      playerShield: this.playerShield,
      enemyHp: this.enemyHp,
      enemyMaxHp: this.enemyMaxHp,
      enemyShield: this.enemyShield,
      enemyBurn: this.enemyBurn,
      enemyBreak: this.enemyBreak,
      enemySuppress: this.enemySuppress,
      killCount: this.killCount,
      totalKills: this.initialSwarmCount,
    });
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

      if (this.report.won) {
        for (const m of this.monsters) {
          if (m.alive) this.killMonster(m);
        }
        sfx.playVictory();
      } else {
        sfx.playDefeat();
      }
      this.emitTelemetry();
      this.callbacks.onPlaybackComplete?.(this.report);
    }
  }

  stampCrater(x, y, radius, isBlood = false) {
    const dctx = this.decalCtx;
    dctx.save();
    if (isBlood) {
      dctx.globalAlpha = 0.36;
      dctx.fillStyle = '#451212';
      dctx.beginPath();
      dctx.arc(x, y, radius, 0, Math.PI * 2);
      dctx.fill();
    } else {
      dctx.globalAlpha = 0.45;
      dctx.fillStyle = '#181410';
      dctx.beginPath();
      dctx.arc(x, y, radius, 0, Math.PI * 2);
      dctx.fill();
      dctx.globalAlpha = 0.25;
      dctx.strokeStyle = '#5c4b37';
      dctx.lineWidth = 2;
      dctx.stroke();
    }
    dctx.restore();
  }

  killMonster(m) {
    if (!m.alive) return;
    m.alive = false;
    this.killCount += 1;
    this.stampCrater(m.x, m.y, m.isBoss ? 26 : 11, true);
    this.spawnSparks(m.x, m.y, m.isBoss ? '#f59e0b' : '#b91c1c', m.isBoss ? 28 : 8);
  }

  syncSwarmCasualties() {
    if (!this.report) return;
    const nonBoss = this.monsters.filter((m) => !m.isBoss);
    const boss = this.monsters.find((m) => m.isBoss);
    const remainRatio = Math.max(0, (this.enemyHp + this.enemyShield) / this.totalEnemyPool);
    const targetAliveNonBoss = Math.ceil(nonBoss.length * remainRatio);
    let currentAlive = nonBoss.filter((m) => m.alive).length;

    while (currentAlive > targetAliveNonBoss) {
      // 优先击杀靠近基地城墙或靠近玩家集火点的普通异兽
      let best = null;
      let bestScore = -Infinity;
      for (const m of nonBoss) {
        if (!m.alive) continue;
        let score = m.y;
        if (this.fireOrder.active) {
          score -= Math.hypot(m.x - this.fireOrder.x, m.y - this.fireOrder.y) * 0.55;
        }
        if (score > bestScore) {
          bestScore = score;
          best = m;
        }
      }
      if (!best) break;
      this.killMonster(best);
      currentAlive--;
    }

    if (boss && boss.alive && this.enemyHp <= 0) {
      this.killMonster(boss);
    }
  }

  pickTargetMonster(preferAerial = false) {
    const alive = this.monsters.filter((m) => m.alive);
    if (alive.length === 0) {
      return { x: this.logicalW * 0.5, y: this.logicalH * 0.35 };
    }
    if (preferAerial) {
      const flyers = alive.filter((m) => m.isFlyer || m.isBoss);
      if (flyers.length > 0) {
        return flyers.sort((a, b) => b.y - a.y)[0];
      }
    }
    if (this.fireOrder.active) {
      return alive.sort(
        (a, b) =>
          Math.hypot(a.x - this.fireOrder.x, a.y - this.fireOrder.y) -
          Math.hypot(b.x - this.fireOrder.x, b.y - this.fireOrder.y)
      )[0];
    }
    return alive.sort((a, b) => b.y - a.y)[0];
  }

  spawnSparks(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 45 + Math.random() * 165;
      this.particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        r: 1.8 + Math.random() * 2.4,
        color,
        life: 0.25 + Math.random() * 0.25,
        maxLife: 0.5,
      });
    }
  }

  spawnExplosion(x, y, maxR = 36) {
    this.explosions.push({ x, y, r: 6, maxR, life: 0.34, maxLife: 0.34 });
    this.stampCrater(x, y, maxR * 0.45, false);
    this.spawnSparks(x, y, '#fb923c', 12);
  }

  consumeEvent(ev, silent = false) {
    this.playerHp = ev.playerHp;
    this.playerShield = ev.playerShield;
    this.enemyHp = ev.enemyHp;
    this.enemyShield = ev.enemyShield;
    this.enemyBurn = ev.enemyBurn ?? this.enemyBurn;
    this.enemyBreak = ev.enemyShock ?? this.enemyBreak;
    this.enemySuppress = ev.enemyChill ?? this.enemySuppress;

    if (silent) {
      this.syncSwarmCasualties();
      return;
    }

    const wallY = this.getWallY();
    const target = this.pickTargetMonster(ev.itemId === 'flak_cannon');

    if (ev.type === 'weapon_hit') {
      if (target.hitFlash !== undefined) target.hitFlash = 0.16;

      if (ev.itemId === 'infantry_squad') {
        for (let i = 0; i < 3; i++) {
          const sx = this.logicalW * (0.28 + i * 0.22);
          const sy = wallY + 4;
          this.tracers.push({ x1: sx, y1: sy, x2: target.x + (Math.random() - 0.5) * 24, y2: target.y, color: '#fde047', width: 2.2, life: 0.14, maxLife: 0.14 });
        }
        this.spawnSparks(target.x, target.y, '#fbbf24', 6);
      } else if (ev.itemId === 'heavy_mg') {
        this.mgRecoil = 1.0;
        const sx = this.logicalW * 0.3;
        const sy = wallY - 2;
        for (let i = 0; i < 4; i++) {
          this.tracers.push({
            x1: sx + (Math.random() - 0.5) * 6,
            y1: sy,
            x2: target.x + (Math.random() - 0.5) * 32,
            y2: target.y + (Math.random() - 0.5) * 18,
            color: '#fb923c',
            width: 2.6,
            life: 0.16,
            maxLife: 0.16,
          });
        }
        this.spawnSparks(target.x, target.y, '#f97316', 10);
      } else if (ev.itemId === 'flak_cannon') {
        const sx = this.logicalW * 0.72;
        const sy = wallY + 2;
        this.flakAngle = Math.atan2(target.y - sy, target.x - sx);
        this.tracers.push({ x1: sx, y1: sy, x2: target.x, y2: target.y, color: '#fef08a', width: 3.2, life: 0.14, maxLife: 0.14 });
        this.flakClouds.push({ x: target.x, y: target.y, r: ev.isAerialBonus ? 30 : 22, life: 0.55, maxLife: 0.55 });
        this.spawnSparks(target.x, target.y, '#fb923c', 11);
      } else if (ev.itemId === 'howitzer_155') {
        this.howitzerRecoil = 1.0;
        const sx = this.logicalW * 0.22;
        const sy = wallY + 42;
        this.shells.push({
          sx,
          sy,
          ex: target.x,
          ey: target.y,
          t: 0,
          dur: 0.32,
          arc: 68,
        });
        this.shakeTime = Math.max(this.shakeTime, 0.16);
        this.shakeAmp = Math.max(this.shakeAmp, 4);
      } else if (ev.itemId === 'katyusha_mlrs') {
        const sx = this.logicalW * 0.8;
        const sy = wallY + 46;
        for (let i = 0; i < 5; i++) {
          this.rockets.push({
            sx: sx + (i - 2) * 5,
            sy,
            ex: target.x + (Math.random() - 0.5) * 110,
            ey: target.y + (Math.random() - 0.5) * 65,
            t: -i * 0.04,
            dur: 0.28,
          });
        }
        this.shakeTime = Math.max(this.shakeTime, 0.22);
        this.shakeAmp = Math.max(this.shakeAmp, 5.5);
      } else if (ev.itemId === 'heavy_tank') {
        this.tankUnit.targetX = Math.max(60, Math.min(this.logicalW - 60, target.x));
        this.tankUnit.turretAngle = Math.atan2(target.y - this.tankUnit.y, target.x - this.tankUnit.x);
        this.tankUnit.recoil = 1.0;
        this.tankUnit.muzzle = 0.16;
        this.tracers.push({ x1: this.tankUnit.x, y1: this.tankUnit.y, x2: target.x, y2: target.y, color: '#fbbf24', width: 4.5, life: 0.18, maxLife: 0.18 });
        this.spawnExplosion(target.x, target.y, 34);
        this.shakeTime = Math.max(this.shakeTime, 0.16);
        this.shakeAmp = Math.max(this.shakeAmp, 4.5);
      } else if (ev.itemId === 'dive_bomber') {
        const tx = target.x;
        for (const ox of [-34, 0, 34]) {
          this.bombers.push({
            x: Math.max(24, Math.min(this.logicalW - 24, tx + ox)),
            y: this.logicalH + 40,
            dropY: target.y + (Math.random() - 0.5) * 35,
            dropped: false,
            speed: 440,
          });
        }
      }

      if (ev.isCrit) {
        this.shakeTime = Math.max(this.shakeTime, 0.2);
        this.shakeAmp = Math.max(this.shakeAmp, 5.5);
      }

      const tag = ev.isAerialBonus ? `破空 ${ev.damage}` : ev.isCrit ? `暴击 ${ev.damage}` : ev.armorPierced ? `穿甲 ${ev.damage}` : `${ev.damage}`;
      const col = ev.isAerialBonus ? '#93c5fd' : ev.isCrit ? '#fbbf24' : '#fef3c7';
      this.floatingTexts.push({
        x: target.x + (Math.random() * 18 - 9),
        y: target.y - 16,
        text: tag,
        color: col,
        vy: -44,
        life: 0.78,
        maxLife: 0.78,
        scale: ev.isCrit || ev.isAerialBonus ? 1.24 : 0.96,
      });

      if (ev.vampHealed > 0) {
        this.floatingTexts.push({
          x: this.logicalW * 0.5,
          y: wallY - 12,
          text: `抢修 +${ev.vampHealed}`,
          color: '#bef264',
          vy: -32,
          life: 0.65,
          maxLife: 0.65,
          scale: 0.9,
        });
      }

      this.syncSwarmCasualties();
      if (ev.itemId === 'heavy_mg') {
        sfx.playMgBurst();
      } else if (ev.itemId === 'flak_cannon') {
        sfx.playFlakBlast();
      } else if (ev.itemId === 'howitzer_155' || ev.itemId === 'katyusha_mlrs' || ev.itemId === 'heavy_tank') {
        sfx.playCannonBlast();
      } else {
        sfx.playHit(ev.isCrit || ev.isAerialBonus);
      }
      this.callbacks.onItemTrigger?.(ev.instanceId);
    } else if (ev.type === 'shield_gain') {
      this.wallHealGlow = 0.45;
      this.floatingTexts.push({
        x: this.logicalW * 0.5,
        y: wallY - 18,
        text: `护甲 +${ev.shieldGained}`,
        color: '#fcd34d',
        vy: -34,
        life: 0.7,
        maxLife: 0.7,
        scale: 0.95,
      });
      sfx.playShield();
      this.callbacks.onItemTrigger?.(ev.instanceId);
    } else if (ev.type === 'gadget_heal') {
      this.wallHealGlow = 0.45;
      const label = ev.healed > 0 ? `抢修 +${ev.healed}` : `护甲 +${ev.shieldGained}`;
      this.floatingTexts.push({
        x: this.logicalW * 0.5,
        y: wallY - 18,
        text: label,
        color: '#bef264',
        vy: -34,
        life: 0.7,
        maxLife: 0.7,
        scale: 0.95,
      });
      sfx.playHeal();
      this.callbacks.onItemTrigger?.(ev.instanceId);
    } else if (ev.type === 'burn_tick') {
      this.spawnSparks(target.x, target.y, '#ea580c', 8);
      this.floatingTexts.push({
        x: target.x,
        y: target.y - 18,
        text: `灼烧 ${ev.damage}`,
        color: '#fb923c',
        vy: -34,
        life: 0.66,
        maxLife: 0.66,
        scale: 0.9,
      });
      this.syncSwarmCasualties();
    } else if (ev.type === 'enemy_attack') {
      this.baseHurtPulse = 0.28;
      this.shakeTime = 0.16;
      this.shakeAmp = 4.2;
      this.spawnSparks(this.logicalW * 0.5 + (Math.random() - 0.5) * 140, wallY - 6, '#ef4444', 10);
      this.floatingTexts.push({
        x: this.logicalW * 0.5 + (Math.random() * 60 - 30),
        y: wallY - 22,
        text: `要塞 -${ev.damage}`,
        color: '#fca5a5',
        vy: -38,
        life: 0.72,
        maxLife: 0.72,
        scale: 1.0,
      });
    } else if (ev.type === 'overtime_storm') {
      this.shakeTime = 0.2;
      this.shakeAmp = 4.8;
      this.floatingTexts.push({
        x: this.logicalW * 0.5,
        y: this.logicalH * 0.3,
        text: `炮火过热 -${ev.damage}`,
        color: '#fbbf24',
        vy: -24,
        life: 0.85,
        maxLife: 0.85,
        scale: 1.08,
      });
      this.syncSwarmCasualties();
    }

    this.emitTelemetry();
  }

  update(dt) {
    this.ambientPhase += dt * 3.0;
    if (this.shakeTime > 0) this.shakeTime = Math.max(0, this.shakeTime - dt);
    if (this.baseHurtPulse > 0) this.baseHurtPulse = Math.max(0, this.baseHurtPulse - dt);
    if (this.wallHealGlow > 0) this.wallHealGlow = Math.max(0, this.wallHealGlow - dt);
    if (this.mgRecoil > 0) this.mgRecoil = Math.max(0, this.mgRecoil - dt * 7);
    if (this.howitzerRecoil > 0) this.howitzerRecoil = Math.max(0, this.howitzerRecoil - dt * 5);
    if (this.tankUnit.recoil > 0) this.tankUnit.recoil = Math.max(0, this.tankUnit.recoil - dt * 5.5);
    if (this.tankUnit.muzzle > 0) this.tankUnit.muzzle = Math.max(0, this.tankUnit.muzzle - dt);
    if (this.fireOrder.active) {
      this.fireOrder.life -= dt;
      if (this.fireOrder.life <= 0) this.fireOrder.active = false;
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

    const wallY = this.getWallY();

    // 我方重型坦克沿防线巡逻推进
    if (this.tankUnit.active) {
      const dx = this.tankUnit.targetX - this.tankUnit.x;
      if (Math.abs(dx) > 4) {
        this.tankUnit.x += Math.sign(dx) * Math.min(Math.abs(dx), 68 * dt);
      }
    }

    // 兽潮向战壕防线推进
    const suppressSlow = 1 - Math.min(0.45, this.enemySuppress * 0.12);
    for (const m of this.monsters) {
      if (!m.alive) continue;
      if (m.hitFlash > 0) m.hitFlash = Math.max(0, m.hitFlash - dt);
      m.stridePhase += dt * (m.isFlyer ? 13 : 9.5) * suppressSlow;
      const stopLine = m.isBoss ? wallY - 64 : m.isFlyer ? wallY - 46 : wallY - 22;
      if (m.y < stopLine) {
        m.y += m.speed * suppressSlow * Math.max(1, this.speed * 0.85) * dt;
      } else {
        m.x += Math.sin(m.stridePhase * 0.3) * 14 * dt;
      }
    }

    // 抛射榴弹炮弹更新
    for (let i = this.shells.length - 1; i >= 0; i--) {
      const sh = this.shells[i];
      sh.t += (dt * Math.max(1, this.speed * 0.85)) / sh.dur;
      if (sh.t >= 1) {
        this.spawnExplosion(sh.ex, sh.ey, 42);
        this.shells.splice(i, 1);
      }
    }

    // 喀秋莎火箭弹更新
    for (let i = this.rockets.length - 1; i >= 0; i--) {
      const rk = this.rockets[i];
      rk.t += (dt * Math.max(1, this.speed * 0.85)) / rk.dur;
      if (rk.t >= 1) {
        this.spawnExplosion(rk.ex, rk.ey, 32);
        this.rockets.splice(i, 1);
      }
    }

    // 俯冲轰炸机编队掠过全屏
    for (let i = this.bombers.length - 1; i >= 0; i--) {
      const bm = this.bombers[i];
      bm.y -= bm.speed * Math.max(1, this.speed * 0.75) * dt;
      if (!bm.dropped && bm.y <= bm.dropY) {
        bm.dropped = true;
        this.spawnExplosion(bm.x, bm.y + 12, 38);
      }
      if (bm.y < -80) this.bombers.splice(i, 1);
    }

    for (let i = this.tracers.length - 1; i >= 0; i--) {
      this.tracers[i].life -= dt;
      if (this.tracers[i].life <= 0) this.tracers.splice(i, 1);
    }
    for (let i = this.flakClouds.length - 1; i >= 0; i--) {
      this.flakClouds[i].life -= dt;
      if (this.flakClouds[i].life <= 0) this.flakClouds.splice(i, 1);
    }
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      const ex = this.explosions[i];
      ex.life -= dt;
      ex.r = ex.maxR * (1 - ex.life / ex.maxLife);
      if (ex.life <= 0) this.explosions.splice(i, 1);
    }
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.92;
      p.vy *= 0.92;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.vy *= 0.92;
      ft.life -= dt;
      if (ft.life <= 0) this.floatingTexts.splice(i, 1);
    }
  }

  drawBastionAndGarrison(w, h) {
    const ctx = this.ctx;
    const wallY = this.getWallY();

    // 铁丝网前沿防线
    ctx.strokeStyle = 'rgba(42, 36, 28, 0.85)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, wallY - 12);
    ctx.lineTo(w, wallY - 12);
    ctx.stroke();
    for (let x = 10; x < w; x += 22) {
      ctx.beginPath();
      ctx.arc(x, wallY - 12, 8, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 沙袋防线胸墙 + 混凝土要塞城墙
    for (let x = 0; x < w; x += 36) {
      ctx.fillStyle = '#8b7a58';
      ctx.strokeStyle = '#3c3324';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.roundRect(x + 2, wallY - 6, 32, 13, 5);
      ctx.fill();
      ctx.stroke();
    }

    ctx.fillStyle = '#474942';
    ctx.fillRect(0, wallY + 7, w, h - wallY - 7);
    ctx.fillStyle = '#626358';
    ctx.fillRect(0, wallY + 7, w, 7);

    // 要塞炮台与兵种工事
    // 1) 重机枪沙袋掩体 (x = 0.3w)
    if (this.equipped.heavyMg || this.equipped.infantry) {
      const mx = w * 0.3;
      const my = wallY + 4 + this.mgRecoil * 4;
      ctx.fillStyle = '#2d3129';
      ctx.beginPath();
      ctx.arc(mx, my, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#181a15';
      ctx.fillRect(mx - 3, my - 15, 6, 14);
    }
    // 2) 高射防空炮位 (x = 0.72w)
    if (this.equipped.flak) {
      const fx = w * 0.72;
      const fy = wallY + 6;
      ctx.save();
      ctx.translate(fx, fy);
      ctx.fillStyle = '#3e423b';
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.rotate(this.flakAngle + Math.PI * 0.5);
      ctx.fillStyle = '#1f231e';
      ctx.fillRect(-5, -18, 3.5, 16);
      ctx.fillRect(1.5, -18, 3.5, 16);
      ctx.restore();
    }
    // 3) 后方 155榴弹炮阵地 & 喀秋莎车
    if (this.equipped.howitzer) {
      const hx = w * 0.22;
      const hy = wallY + 44 + this.howitzerRecoil * 6;
      ctx.fillStyle = '#4b5538';
      ctx.fillRect(hx - 14, hy - 8, 28, 20);
      ctx.fillStyle = '#2d3422';
      ctx.fillRect(hx - 4, hy - 22, 8, 20);
    }
    if (this.equipped.katyusha) {
      const kx = w * 0.8;
      const ky = wallY + 48;
      ctx.fillStyle = '#4a5536';
      ctx.fillRect(kx - 14, ky - 14, 28, 32);
      ctx.fillStyle = '#2c3320';
      ctx.fillRect(kx - 10, ky - 16, 20, 14);
    }

    // 基地耐久抢修或护盾金光
    if (this.playerShield > 0 || this.wallHealGlow > 0) {
      ctx.strokeStyle = this.wallHealGlow > 0 ? 'rgba(190, 242, 100, 0.8)' : 'rgba(245, 158, 11, 0.55)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, wallY - 7);
      ctx.lineTo(w, wallY - 7);
      ctx.stroke();
    }

    // 我方重型坦克实体在战壕前方巡逻
    if (this.tankUnit.active) {
      const { x, y, turretAngle, recoil, muzzle } = this.tankUnit;
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(-16, -18, 32, 38);
      ctx.fillStyle = '#3f4f32';
      ctx.strokeStyle = '#1b2215';
      ctx.lineWidth = 1.8;
      ctx.fillRect(-15, -19, 30, 38);
      ctx.strokeRect(-15, -19, 30, 38);
      ctx.save();
      ctx.rotate(turretAngle + Math.PI * 0.5);
      const rx = recoil * 5;
      ctx.fillStyle = '#2a3421';
      ctx.fillRect(-3.5, -24 + rx, 7, 20);
      ctx.fillStyle = '#576b43';
      ctx.beginPath();
      ctx.arc(0, rx, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      if (muzzle > 0) {
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(0, -26 + rx, 7, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      ctx.restore();
    }
  }

  drawMonster(m) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(m.x, m.y);

    if (m.isBoss) {
      ctx.strokeStyle = 'rgba(185, 28, 28, 0.55)';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(0, 0, m.radius + 10 + Math.sin(this.ambientPhase * 2) * 3, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (m.isFlyer) {
      // 空中飞兽与下方地面阴影错位产生俯视悬空感
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(0, 24, 14, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      const flap = Math.sin(m.stridePhase) * 9;
      ctx.fillStyle = m.hitFlash > 0 ? '#ffffff' : '#312e2b';
      ctx.strokeStyle = '#78716c';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(0, -4);
      ctx.quadraticCurveTo(-18, -10 - flap, -24, 4 - flap * 0.5);
      ctx.lineTo(-5, 6);
      ctx.lineTo(0, 12);
      ctx.lineTo(5, 6);
      ctx.lineTo(24, 4 - flap * 0.5);
      ctx.quadraticCurveTo(18, -10 - flap, 0, -4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(-3, 6, 1.8, 0, Math.PI * 2);
      ctx.arc(3, 6, 1.8, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.ellipse(0, 4, m.radius * 0.95, m.radius * 0.72, 0, 0, Math.PI * 2);
      ctx.fill();

      const wobble = Math.sin(m.stridePhase) * 0.08;
      ctx.save();
      ctx.rotate(wobble);
      if (m.hitFlash > 0) {
        ctx.fillStyle = '#fffbeb';
        ctx.beginPath();
        ctx.arc(0, 0, m.radius * 0.85, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const spr = this.sprites[m.kind] || this.sprites.wolf;
        const ds = m.isBoss ? 104 : m.kind === 'bull' ? 52 : m.kind === 'boomer' ? 46 : 38;
        ctx.drawImage(spr, -ds * 0.5, -ds * 0.5, ds, ds);
      }
      ctx.restore();
    }

    if (m.isBoss) {
      const barW = 90;
      const pct = Math.max(0, Math.min(1, this.enemyHp / Math.max(1, this.enemyMaxHp)));
      ctx.fillStyle = 'rgba(24, 18, 12, 0.9)';
      ctx.strokeStyle = '#b91c1c';
      ctx.lineWidth = 1.4;
      ctx.fillRect(-barW * 0.5, -m.radius - 22, barW, 8);
      ctx.strokeRect(-barW * 0.5, -m.radius - 22, barW, 8);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-barW * 0.5 + 1, -m.radius - 21, (barW - 2) * pct, 6);
      ctx.font = '900 10.5px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fef3c7';
      ctx.fillText(this.report?.wave >= 10 ? '终极首领' : '战区首领', 0, -m.radius - 26);
    }

    ctx.restore();
  }

  render() {
    const ctx = this.ctx;
    const w = this.logicalW;
    const h = this.logicalH;
    ctx.clearRect(0, 0, w, h);

    ctx.save();
    if (this.shakeTime > 0) {
      ctx.translate(
        (Math.random() - 0.5) * this.shakeAmp * 2,
        (Math.random() - 0.5) * this.shakeAmp * 2
      );
    }

    if (this.bgImg) {
      ctx.drawImage(this.bgImg, 0, 0, w, h);
    } else {
      ctx.fillStyle = '#2d2820';
      ctx.fillRect(0, 0, w, h);
    }

    ctx.drawImage(this.decalCanvas, 0, 0);

    // 玩家红漆“集火指令”标尺
    if (this.fireOrder.active) {
      const { x, y, life } = this.fireOrder;
      ctx.save();
      ctx.globalAlpha = Math.min(0.9, life);
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 24 + Math.sin(this.ambientPhase * 3) * 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - 14, y);
      ctx.lineTo(x + 14, y);
      ctx.moveTo(x, y - 14);
      ctx.lineTo(x, y + 14);
      ctx.stroke();
      ctx.font = '900 10px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fef3c7';
      ctx.fillText('集火区', x, y - 28);
      ctx.restore();
    }

    this.drawBastionAndGarrison(w, h);

    // 地面与低空兽潮
    for (const m of this.monsters) {
      if (m.alive) this.drawMonster(m);
    }

    // 曳光弹道与高炮火线
    for (const tr of this.tracers) {
      const a = Math.max(0, tr.life / tr.maxLife);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.strokeStyle = tr.color;
      ctx.lineWidth = tr.width;
      ctx.beginPath();
      ctx.moveTo(tr.x1, tr.y1);
      ctx.lineTo(tr.x2, tr.y2);
      ctx.stroke();
      ctx.restore();
    }

    // 155毫米榴弹抛射炮弹
    for (const sh of this.shells) {
      const x = sh.sx + (sh.ex - sh.sx) * sh.t;
      const groundY = sh.sy + (sh.ey - sh.sy) * sh.t;
      const y = groundY - Math.sin(sh.t * Math.PI) * sh.arc;
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.arc(x, groundY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fb923c';
      ctx.beginPath();
      ctx.arc(x, y, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 喀秋莎火箭弹拖烟
    for (const rk of this.rockets) {
      if (rk.t < 0) continue;
      const x = rk.sx + (rk.ex - rk.sx) * rk.t;
      const y = rk.sy + (rk.ey - rk.sy) * rk.t;
      const prevT = Math.max(0, rk.t - 0.16);
      const px = rk.sx + (rk.ex - rk.sx) * prevT;
      const py = rk.sy + (rk.ey - rk.sy) * prevT;
      ctx.strokeStyle = 'rgba(235, 224, 200, 0.72)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.fillStyle = '#fb923c';
      ctx.beginPath();
      ctx.arc(x, y, 3.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // 高炮爆炸黑烟云团 (Flak Cloud)
    for (const fc of this.flakClouds) {
      const a = Math.max(0, fc.life / fc.maxLife);
      ctx.save();
      ctx.globalAlpha = a * 0.85;
      ctx.fillStyle = '#292524';
      ctx.beginPath();
      ctx.arc(fc.x, fc.y, fc.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.arc(fc.x, fc.y, fc.r * 0.42, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 橙红火球爆炸冲击波
    for (const ex of this.explosions) {
      const a = Math.max(0, ex.life / ex.maxLife);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.arc(ex.x, ex.y, ex.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(ex.x, ex.y, ex.r * 0.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 俯冲轰炸机编队低空掠过
    for (const bm of this.bombers) {
      ctx.save();
      // 投影
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.moveTo(bm.x + 12, bm.y + 18);
      ctx.lineTo(bm.x - 10, bm.y + 34);
      ctx.lineTo(bm.x + 34, bm.y + 34);
      ctx.closePath();
      ctx.fill();

      // 机体
      ctx.translate(bm.x, bm.y);
      ctx.fillStyle = '#36443d';
      ctx.strokeStyle = '#141a17';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.lineTo(5, -4);
      ctx.lineTo(24, 3);
      ctx.lineTo(24, 9);
      ctx.lineTo(5, 7);
      ctx.lineTo(3, 18);
      ctx.lineTo(10, 21);
      ctx.lineTo(-10, 21);
      ctx.lineTo(-3, 18);
      ctx.lineTo(-5, 7);
      ctx.lineTo(-24, 9);
      ctx.lineTo(-24, 3);
      ctx.lineTo(-5, -4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // 火星泥尘粒子
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 纯中文战地数值跳字
    for (const ft of this.floatingTexts) {
      const alpha = Math.max(0, Math.min(1, (ft.life / ft.maxLife) * 1.45));
      const pop = 1 + Math.max(0, (ft.life / ft.maxLife - 0.72) * 1.4);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = `900 ${Math.round(13.5 * ft.scale * pop)}px "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif`;
      ctx.textAlign = 'center';
      ctx.lineWidth = 3.8;
      ctx.strokeStyle = '#14110c';
      ctx.strokeText(ft.text, ft.x, ft.y);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }

    if (this.baseHurtPulse > 0) {
      ctx.strokeStyle = `rgba(185, 28, 28, ${this.baseHurtPulse * 2.1})`;
      ctx.lineWidth = 14;
      ctx.strokeRect(0, 0, w, h);
    }
    if (this.mode === 'playing' && this.simTime >= OVERTIME_START_SEC) {
      ctx.strokeStyle = `rgba(217, 119, 6, ${0.35 + Math.sin(this.ambientPhase * 4) * 0.2})`;
      ctx.lineWidth = 6;
      ctx.strokeRect(3, 3, w - 6, h - 6);
    }

    ctx.restore();
  }
}
