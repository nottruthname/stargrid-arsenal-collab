/**
 * 《铁血防线：1944》二战复古实体卡牌指挥总控（100% 纯中文）
 * - 零 Emoji、零英文界面标识、零 AI 赛博霓虹锐角
 * - 实体军事兵牌 1:1 沙盘拼装 + 物理倾角拖拽 + 右键/滚轮旋转 + 碰撞回弹
 * - 开战收起整备桌面，无缝进入 100% 全屏二战基地海陆空抗兽潮实景战场
 */

import {
  CATEGORY_META,
  GRID_COLS,
  GRID_ROWS,
  ITEM_CATALOG,
  ITEM_IDS,
  MAX_STASH_SLOTS,
  MAX_WAVES,
  RARITY_META,
  RELIC_CATALOG,
  RELIC_IDS,
  WAVE_CONFIGS,
} from '../../shared/protocol.mjs';
import * as Engine from '../backend/engine.mjs';
import {
  getItemSvg,
  getMiniShapeSvg,
  getPlacedItemVisualHtml,
  getRelicSvg,
  getShapeLayout,
  getUnitArtUrl,
  renderStars,
  uiIcon,
} from './art.mjs';
import { BattleArena } from './arena.mjs';
import { sfx } from './sfx.mjs';

const appRoot = document.getElementById('app');

function showToast(msg) {
  let root = document.getElementById('toast-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'toast-root';
    document.body.appendChild(root);
  }
  root.innerHTML = `<div class="toast">${msg}</div>`;
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    if (root) root.innerHTML = '';
  }, 2100);
}

function analyzePolyomino(cells) {
  const cellSet = new Set(cells.map(([r, c]) => `${r},${c}`));
  const minR = Math.min(...cells.map(([r]) => r));
  const maxR = Math.max(...cells.map(([r]) => r));
  const minC = Math.min(...cells.map(([, c]) => c));
  const maxC = Math.max(...cells.map(([, c]) => c));
  return {
    minR,
    minC,
    spanRows: maxR - minR + 1,
    spanCols: maxC - minC + 1,
    cellSet,
  };
}

function renderCodexModalHtml() {
  return `
    <div class="modal-backdrop" id="codex-backdrop">
      <div class="modal-card">
        <h2 class="modal-title">
          <span style="display:inline-flex;align-items:center;gap:6px;">${uiIcon('codex', 16)} 一九四四战区军备图鉴</span>
          <button class="icon-btn" id="close-codex">关闭</button>
        </h2>
        <div style="font-size:11.5px;color:#d6cbb2;line-height:1.6;">
          • 将兵种牌拖入 <b>5×5 作战沙盘</b>，拖拽中按 <b>右键 / 滚轮 / 键盘旋转键</b> 可调整摆放朝向。<br/>
          • 同兵种同星级叠放触发 <b>二合一精锐升星</b>（最高三星）；正交贴合建立红线战术连携。<br/>
          • 第 3、6、9 波将迎来高空飞兽突袭，部署 <b>双联高射炮</b> 可触发 1.5 倍破空重击！
        </div>
        ${ITEM_IDS.map((id) => {
          const item = ITEM_CATALOG[id];
          return `<div class="codex-item-row">
            <div>${getItemSvg(id, 42)}</div>
            <div style="flex:1;">
              <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:800;color:#fef3c7;">
                <span>${item.name} · ${CATEGORY_META[item.category].label}（${RARITY_META[item.rarity].label}）</span>
                <span style="color:#fbbf24;">${item.cost} 军费</span>
              </div>
              <div style="font-size:11px;color:#d7ccb4;margin-top:2px;">${item.description}</div>
              <div style="font-size:11px;color:#fcd34d;margin-top:2px;">连携：${item.synergyDesc}</div>
            </div>
          </div>`;
        }).join('')}
        <div style="font-size:12px;font-weight:800;color:#e6ba6c;margin-top:4px;">战区军令勋章档案</div>
        ${RELIC_IDS.map((rid) => {
          const r = RELIC_CATALOG[rid];
          return `<div class="codex-item-row">
            <div>${getRelicSvg(rid, 32)}</div>
            <div style="flex:1;">
              <div style="font-size:12px;font-weight:800;color:#fde68a;">${r.name}</div>
              <div style="font-size:11px;color:#d7ccb4;">${r.description}</div>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>
  `;
}

function showSplashScreen(onStart) {
  appRoot.innerHTML = `
    <section class="splash-screen">
      <div class="splash-header">
        <span class="splash-seal">${uiIcon('target', 12)} 一九四四 · 战区前线指挥部</span>
        <h1 class="splash-title">铁血防线：1944</h1>
        <p class="splash-sub">二战实体卡牌构筑 · 钢铁要塞战兽潮</p>
      </div>

      <div class="splash-bottom">
        <div class="splash-specs">
          <div class="spec-cell">
            <div class="spec-cell-top">沙盘排兵</div>
            <div class="spec-cell-sub">多格连携阵地</div>
          </div>
          <div class="spec-cell">
            <div class="spec-cell-top">海陆空协同</div>
            <div class="spec-cell-sub">重炮坦机轰炸</div>
          </div>
          <div class="spec-cell">
            <div class="spec-cell-top">守城打兽潮</div>
            <div class="spec-cell-sub">手动标尺集火</div>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;">
          <button id="btn-start-game" class="brass-btn">
            ${uiIcon('engage', 15)} 签署作战令 · 进驻防线
          </button>
          <button id="btn-splash-codex" class="brass-btn secondary">
            ${uiIcon('codex', 14)} 军备图鉴
          </button>
        </div>
      </div>
    </section>
    <div id="modal-root"></div>
    <div id="toast-root"></div>
  `;

  document.getElementById('btn-start-game').addEventListener('click', () => {
    sfx.playLockIn();
    onStart();
  });

  const modalRoot = document.getElementById('modal-root');
  document.getElementById('btn-splash-codex').addEventListener('click', () => {
    modalRoot.innerHTML = renderCodexModalHtml();
    document.getElementById('close-codex').addEventListener('click', () => {
      modalRoot.innerHTML = '';
    });
    document.getElementById('codex-backdrop').addEventListener('click', (e) => {
      if (e.target.id === 'codex-backdrop') modalRoot.innerHTML = '';
    });
  });
}

function bootPlayableGame() {
  let state = Engine.createInitialState(20261124);
  let selectedRef = null;
  let isPlayingBattle = false;
  let battleSpeed = 1;
  let showBattleSummaryModal = false;
  let showCodexModal = false;
  let slamTargetId = null;
  let slamNeighborIds = new Set();
  const triggeredInstanceIds = new Map();
  let drag = null;

  appRoot.innerHTML = `
    <div id="prep-workspace" class="prep-workspace">
      <header id="hud-bar" class="hud-bar"></header>
      <div id="threat-scanner" class="threat-scanner"></div>
      <div id="relics-strip" class="relics-strip"></div>
      <section class="grid-section">
        <div class="stargrid-chassis">
          <div class="chassis-header">
            <span class="chassis-label"><span class="chassis-led"></span> 前线阵地部署沙盘</span>
            <span class="map-scale-bar"></span>
            <span class="chassis-rivets"><span class="rivet"></span><span class="rivet"></span><span class="rivet"></span></span>
          </div>
          <div id="stargrid-board" class="stargrid-board">
            <div class="grid-inner">
              <div id="grid-cells-bg" class="grid-cells-bg"></div>
              <svg id="synergy-svg" class="synergy-svg" viewBox="0 0 100 100"></svg>
              <div id="grid-items-layer" class="grid-items-layer"></div>
            </div>
          </div>
        </div>
      </section>
      <div id="inspector-bar" class="inspector-bar"></div>
      <div id="stash-bar" class="stash-bar" aria-label="预备兵力备战区"></div>
      <section id="shop-section" class="shop-section"></section>
      <button id="battle-cta" class="brass-btn war-crimson"></button>
    </div>

    <div id="battle-screen" class="battle-screen" hidden>
      <canvas id="arena-canvas" class="arena-canvas"></canvas>
      <div id="battle-hud-overlay" class="battle-hud-overlay"></div>
      <div class="battle-bottom-overlay">
        <div id="battle-deck-strip" class="battle-deck-strip"></div>
        <div id="battle-controls" class="battle-controls">
          <button class="icon-btn active" data-speed="1">常速</button>
          <button class="icon-btn" data-speed="2">二倍速</button>
          <button class="icon-btn" data-skip="1">跳过</button>
        </div>
      </div>
    </div>

    <div id="modal-root"></div>
    <div id="toast-root"></div>
  `;

  const prepWorkspaceEl = document.getElementById('prep-workspace');
  const battleScreenEl = document.getElementById('battle-screen');
  const canvasEl = document.getElementById('arena-canvas');
  const battleHudEl = document.getElementById('battle-hud-overlay');
  const battleDeckStripEl = document.getElementById('battle-deck-strip');
  const battleControlsEl = document.getElementById('battle-controls');

  const hudEl = document.getElementById('hud-bar');
  const threatScannerEl = document.getElementById('threat-scanner');
  const relicsStripEl = document.getElementById('relics-strip');
  const gridCellsBgEl = document.getElementById('grid-cells-bg');
  const synergySvgEl = document.getElementById('synergy-svg');
  const gridItemsLayerEl = document.getElementById('grid-items-layer');
  const inspectorBarEl = document.getElementById('inspector-bar');
  const stashBarEl = document.getElementById('stash-bar');
  const shopSectionEl = document.getElementById('shop-section');
  const battleCtaEl = document.getElementById('battle-cta');
  const modalRootEl = document.getElementById('modal-root');

  const cellElements = [];
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const slot = document.createElement('div');
      slot.className = 'grid-cell-slot';
      slot.dataset.row = String(r);
      slot.dataset.col = String(c);
      slot.innerHTML = '<div class="grid-cell-socket"></div>';
      slot.addEventListener('click', () => {
        if (isPlayingBattle || state.phase !== 'prep' || !selectedRef) return;
        const item = findItemByInstanceId(selectedRef.instanceId);
        if (!item) {
          selectedRef = null;
          renderAll();
          return;
        }
        try {
          const prevPlaced = state.placedItems.length;
          const prevLvSum = state.placedItems.reduce((a, b) => a + b.level, 0);
          state = Engine.placeOrMoveItem(state, {
            instanceId: item.instanceId,
            toGrid: true,
            row: r,
            col: c,
            rotation: item.rotation || 0,
          });
          const nextLvSum = state.placedItems.reduce((a, b) => a + b.level, 0);
          if (state.placedItems.length <= prevPlaced && nextLvSum > prevLvSum) {
            sfx.playMerge();
            showToast('精锐部队二合一升星完成');
          } else {
            sfx.playLockIn();
          }
          triggerSlamFeedback(item.instanceId);
          if (!findItemByInstanceId(item.instanceId)) selectedRef = null;
          renderAll();
        } catch (err) {
          sfx.playClang();
          showToast(err.message);
        }
      });
      gridCellsBgEl.appendChild(slot);
      cellElements.push(slot);
    }
  }

  function renderBattleHudOverlay(tele) {
    const battleWave = arena.report?.wave || state.wave || 1;
    const waveCfg = WAVE_CONFIGS[battleWave - 1] || WAVE_CONFIGS[0];
    const pPct = Math.max(0, Math.min(100, (tele.playerHp / Math.max(1, tele.playerMaxHp)) * 100));
    const ePct = Math.max(0, Math.min(100, (tele.enemyHp / Math.max(1, tele.enemyMaxHp)) * 100));
    const statusChips = [];
    if (tele.enemyBurn > 0) statusChips.push(`灼烧 ${tele.enemyBurn}层`);
    if (tele.enemyBreak > 0) statusChips.push(`破甲 ${tele.enemyBreak}层`);
    if (tele.enemySuppress > 0) statusChips.push(`压制 ${tele.enemySuppress}层`);

    battleHudEl.innerHTML = `
      <div class="battle-top-row num-tabular">
        <span class="battle-badge" style="border-color:${waveCfg.accentColor};">
          第 ${battleWave} 波 · ${waveCfg.name}${waveCfg.isAerial ? '【空袭】' : ''}
        </span>
        <span class="battle-badge" style="color:${tele.simTime >= 18 ? '#fbbf24' : '#f3ebd7'};">
          ${tele.simTime >= 18 ? '炮火过热 ' : '交战 '}${tele.simTime.toFixed(1)}秒 · 歼灭 ${tele.killCount}/${tele.totalKills}
        </span>
      </div>
      <div class="battle-bars num-tabular">
        <div class="bar-box">
          <div class="bar-label" style="color:#bef264;">
            <span>钢铁基地耐久</span>
            <span>${tele.playerHp}/${tele.playerMaxHp}${tele.playerShield > 0 ? ` +${tele.playerShield}甲` : ''}</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill" style="width:${pPct}%;background:linear-gradient(90deg,#4d7c0f,#84cc16);"></div>
          </div>
        </div>
        <div class="bar-box">
          <div class="bar-label" style="color:#fca5a5;">
            <span>兽潮总兵力</span>
            <span>${tele.enemyHp}/${tele.enemyMaxHp}${tele.enemyShield > 0 ? ` +${tele.enemyShield}甲` : ''}</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill" style="width:${ePct}%;background:linear-gradient(90deg,#991b1b,#dc2626);"></div>
          </div>
        </div>
      </div>
      ${
        statusChips.length
          ? `<div style="text-align:right;font-size:10.5px;font-weight:800;color:#fde68a;text-shadow:0 1px 4px #000;">${statusChips.join(' · ')}</div>`
          : `<div class="battle-hint">点击或按住战场任意位置，可下达红漆炮火集火标尺</div>`
      }
    `;
  }

  const arena = new BattleArena(canvasEl, {
    onTelemetryTick: (tele) => {
      if (isPlayingBattle) renderBattleHudOverlay(tele);
    },
    onItemTrigger: (instanceId) => {
      if (triggeredInstanceIds.has(instanceId)) {
        clearTimeout(triggeredInstanceIds.get(instanceId));
      }
      const chip = battleDeckStripEl.querySelector(`[data-deck-id="${instanceId}"]`);
      if (chip) chip.classList.add('triggered');
      const tid = setTimeout(() => {
        const c2 = battleDeckStripEl.querySelector(`[data-deck-id="${instanceId}"]`);
        if (c2) c2.classList.remove('triggered');
        triggeredInstanceIds.delete(instanceId);
      }, 170);
      triggeredInstanceIds.set(instanceId, tid);
    },
    onPlaybackComplete: () => {
      isPlayingBattle = false;
      showBattleSummaryModal = true;
      renderModal();
    },
  });
  arena.startLoop();

  battleControlsEl.querySelectorAll('[data-speed]').forEach((btn) => {
    btn.addEventListener('click', () => {
      battleSpeed = Number(btn.dataset.speed);
      arena.setSpeed(battleSpeed);
      battleControlsEl.querySelectorAll('[data-speed]').forEach((b) => {
        b.classList.toggle('active', Number(b.dataset.speed) === battleSpeed);
      });
    });
  });

  battleControlsEl.querySelector('[data-skip]').addEventListener('click', () => {
    arena.skipToEnd();
  });

  function findItemByInstanceId(instanceId) {
    return (
      state.placedItems.find((p) => p.instanceId === instanceId) ||
      state.stashItems.find((s) => s.instanceId === instanceId) ||
      null
    );
  }

  function triggerSlamFeedback(placedId) {
    slamTargetId = placedId;
    const syn = Engine.computeGridSynergies(state);
    const neighbors = syn.itemStats[placedId]?.neighborIds || [];
    slamNeighborIds = new Set(neighbors);
    setTimeout(() => {
      slamTargetId = null;
      slamNeighborIds.clear();
    }, 210);
  }

  function getItemCentroidPercent(item) {
    const cells = Engine.getOccupiedCells(item.itemId, item.row, item.col, item.rotation);
    let sumR = 0;
    let sumC = 0;
    for (const [r, c] of cells) {
      sumR += r;
      sumC += c;
    }
    return {
      x: (sumC / cells.length + 0.5) * 20,
      y: (sumR / cells.length + 0.5) * 20,
      cells,
    };
  }

  function renderHud() {
    const waveCfg = WAVE_CONFIGS[(state.wave || 1) - 1] || WAVE_CONFIGS[0];
    const pips = [0, 1, 2]
      .map(
        (i) =>
          `<span class="pip-heart ${i < state.lives ? '' : 'lost'}">${uiIcon('integrity', 11)}</span>`
      )
      .join('');

    hudEl.innerHTML = `
      <div class="hud-group">
        <span class="hud-tag num-tabular ${waveCfg.isBoss ? 'boss' : ''}">
          第 ${state.wave}/${MAX_WAVES} 波${waveCfg.isBoss ? ' · 首领' : waveCfg.isAerial ? ' · 空袭' : ''}
        </span>
        <span class="hud-tag credits num-tabular">${uiIcon('credits', 12)} ${state.gold} 军费</span>
        <span class="integrity-pips" title="防线耐久令">${pips}</span>
      </div>
      <div class="hud-group">
        <button class="icon-btn" id="btn-codex">${uiIcon('codex', 12)} 图鉴</button>
        <button class="icon-btn" id="btn-mute" title="音效开关">${uiIcon(sfx.muted ? 'audioOff' : 'audioOn', 13)}</button>
        <button class="icon-btn" id="btn-restart" title="重开战局">${uiIcon('reset', 13)}</button>
      </div>
    `;
    document.getElementById('btn-codex').addEventListener('click', () => {
      showCodexModal = true;
      renderModal();
    });
    document.getElementById('btn-mute').addEventListener('click', () => {
      sfx.toggleMute();
      renderHud();
    });
    document.getElementById('btn-restart').addEventListener('click', () => {
      if (isPlayingBattle) return;
      state = Engine.createInitialState((Date.now() ^ Math.floor(Math.random() * 99999)) >>> 0);
      selectedRef = null;
      showBattleSummaryModal = false;
      renderAll();
      showToast('防线指挥所已重新部署');
    });
  }

  function renderThreatAndRelics(synergies) {
    const waveCfg = WAVE_CONFIGS[(state.wave || 1) - 1] || WAVE_CONFIGS[0];
    const { estimatedDps, estimatedShieldPerSec, activeLinkCount } = synergies.summary;

    threatScannerEl.className = `threat-scanner${waveCfg.isBoss ? ' boss' : ''}`;
    threatScannerEl.innerHTML = `
      <div class="threat-left">
        <div class="threat-title">
          <span style="color:#fca5a5;">${uiIcon('skull', 13)}</span>
          <span>${waveCfg.name}</span>
          <span style="font-size:9.5px;color:#cbbda0;">[${waveCfg.title}]</span>
        </div>
        <div class="threat-sub num-tabular">
          兵力 ${waveCfg.maxHp} · 护甲 ${waveCfg.initialShield} · 攻城 ${waveCfg.attack}（${waveCfg.cooldownSec}秒）
        </div>
      </div>
      <div class="telemetry-right num-tabular">
        <span class="tele-chip">${uiIcon('dps', 11)} 秒伤 ${estimatedDps}</span>
        <span class="tele-chip shd">${uiIcon('shield', 11)} ${estimatedShieldPerSec}/秒</span>
        <span class="tele-chip link">${uiIcon('bolt', 11)} ${activeLinkCount}连携</span>
      </div>
    `;

    if (state.relics.length === 0) {
      relicsStripEl.innerHTML = `<span style="font-size:10px;color:#a99d83;">战区军令勋章槽：第 2 / 5 / 8 波守城获胜后颁授</span>`;
    } else {
      relicsStripEl.innerHTML = state.relics
        .map((id) => {
          const r = RELIC_CATALOG[id];
          return `<span class="relic-chip" title="${r.description}">
            ${getRelicSvg(id, 14)} <span>${r.name}</span>
          </span>`;
        })
        .join('');
    }
  }

  function renderGrid(synergies) {
    const centroids = new Map();
    for (const item of state.placedItems) {
      centroids.set(item.instanceId, getItemCentroidPercent(item));
    }

    synergySvgEl.innerHTML = synergies.links
      .filter((link) => link.active)
      .map((link) => {
        const a = centroids.get(link.fromInstanceId);
        const b = centroids.get(link.toInstanceId);
        if (!a || !b) return '';
        return `
          <line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" class="synergy-line-glow" />
          <line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" class="synergy-line" />
        `;
      })
      .join('');

    gridItemsLayerEl.innerHTML = '';
    for (const item of state.placedItems) {
      const def = ITEM_CATALOG[item.itemId];
      const info = centroids.get(item.instanceId);
      const stats = synergies.itemStats[item.instanceId];
      const isSelected = selectedRef?.instanceId === item.instanceId;
      const isSlammed = slamTargetId === item.instanceId;
      const isJolted = slamNeighborIds.has(item.instanceId);
      const { minR, minC, spanRows, spanCols, cellSet } = analyzePolyomino(info.cells);

      const starCell = info.cells.reduce((best, cur) =>
        cur[0] < best[0] || (cur[0] === best[0] && cur[1] > best[1]) ? cur : best
      );
      const synCell = info.cells.reduce((best, cur) =>
        cur[0] > best[0] || (cur[0] === best[0] && cur[1] < best[1]) ? cur : best
      );

      for (const [r, c] of info.cells) {
        const hasUp = cellSet.has(`${r - 1},${c}`);
        const hasDown = cellSet.has(`${r + 1},${c}`);
        const hasLeft = cellSet.has(`${r},${c - 1}`);
        const hasRight = cellSet.has(`${r},${c + 1}`);

        const padT = hasUp ? '0px' : '2px';
        const padB = hasDown ? '0px' : '2px';
        const padL = hasLeft ? '0px' : '2px';
        const padR = hasRight ? '0px' : '2px';

        const rTL = !hasUp && !hasLeft ? '6px' : '0px';
        const rTR = !hasUp && !hasRight ? '6px' : '0px';
        const rBL = !hasDown && !hasLeft ? '6px' : '0px';
        const rBR = !hasDown && !hasRight ? '6px' : '0px';

        const cellTile = document.createElement('div');
        cellTile.className = `grid-piece-cell tier-${item.level}${isSelected ? ' selected' : ''}${isSlammed ? ' just-slammed' : ''}${isJolted ? ' neighbor-jolt' : ''}`;
        cellTile.dataset.instanceId = item.instanceId;
        cellTile.style.left = `${c * 20}%`;
        cellTile.style.top = `${r * 20}%`;
        cellTile.style.width = '20%';
        cellTile.style.height = '20%';
        cellTile.style.padding = `${padT} ${padR} ${padB} ${padL}`;

        const hull = document.createElement('div');
        hull.className = 'grid-piece-hull';
        hull.style.borderRadius = `${rTL} ${rTR} ${rBR} ${rBL}`;
        const borderCol = isSelected ? '#b45309' : item.level >= 3 ? '#d97706' : def.color;
        hull.style.borderTop = hasUp ? 'none' : `2px solid ${borderCol}`;
        hull.style.borderBottom = hasDown ? 'none' : `3px solid #4a3a22`;
        hull.style.borderLeft = hasLeft ? 'none' : `2px solid ${borderCol}`;
        hull.style.borderRight = hasRight ? 'none' : `2px solid ${borderCol}`;

        let cellBadges = '';
        if (r === starCell[0] && c === starCell[1]) {
          cellBadges += `<span class="star-badge">${renderStars(item.level)}</span>`;
        }
        if (stats?.synergyTags?.length && r === synCell[0] && c === synCell[1]) {
          cellBadges += '<span class="synergy-dot"></span>';
        }
        if (cellBadges) hull.innerHTML = cellBadges;

        cellTile.appendChild(hull);
        cellTile.addEventListener('pointerdown', (e) => {
          if (isPlayingBattle || state.phase !== 'prep') return;
          startDrag(e, {
            kind: 'grid',
            instanceId: item.instanceId,
            itemId: item.itemId,
            level: item.level,
            rotation: item.rotation || 0,
            grabOffsetR: r - item.row,
            grabOffsetC: c - item.col,
          });
        });

        gridItemsLayerEl.appendChild(cellTile);
      }

      const overlay = document.createElement('div');
      overlay.className = `grid-piece-overlay${isSlammed ? ' just-slammed' : ''}${isJolted ? ' neighbor-jolt' : ''}`;
      overlay.dataset.instanceId = item.instanceId;
      overlay.style.left = `${minC * 20}%`;
      overlay.style.top = `${minR * 20}%`;
      overlay.style.width = `${spanCols * 20}%`;
      overlay.style.height = `${spanRows * 20}%`;
      overlay.innerHTML = getPlacedItemVisualHtml(item.itemId, spanRows, spanCols, item.rotation || 0);
      gridItemsLayerEl.appendChild(overlay);
    }
  }

  function renderInspector(synergies) {
    const selected = selectedRef ? findItemByInstanceId(selectedRef.instanceId) : null;
    if (!selected) {
      inspectorBarEl.innerHTML = `
        <div class="inspector-info">
          <div class="inspector-title" style="color:#f3ebd7;">${uiIcon('target', 12)} 拖拽兵牌摆入作战沙盘 · 拖拽中 [右键 / 滚轮] 旋转</div>
          <div class="inspector-sub">同兵种同星级叠放二合一升星，正交相邻自动建立红线战术连携。</div>
        </div>
      `;
      return;
    }

    const def = ITEM_CATALOG[selected.itemId];
    const inGrid = state.placedItems.some((p) => p.instanceId === selected.instanceId);
    const stats = inGrid ? synergies.itemStats[selected.instanceId] : null;
    const sellPrice = Math.ceil(selected.investedGold * 0.6);

    let statText = def.synergyDesc;
    if (stats) {
      const parts = [];
      if (stats.effectiveDamage > 0) parts.push(`火力 ${stats.effectiveDamage}`);
      if (stats.effectiveShield > 0) parts.push(`护甲 ${stats.effectiveShield}`);
      if (stats.effectiveHeal > 0) parts.push(`抢修 ${stats.effectiveHeal}`);
      if (stats.effectiveCooldownSec > 0) parts.push(`装填 ${stats.effectiveCooldownSec}秒`);
      if (stats.synergyTags.length > 0) parts.push(stats.synergyTags.join(' · '));
      statText = parts.join(' | ') || def.description;
    }

    inspectorBarEl.innerHTML = `
      <div class="inspector-info">
        <div class="inspector-title" style="color:#fef3c7;">
          <span>${def.name}</span>
          ${renderStars(selected.level)}
          <span style="font-size:9.5px;color:#d4a656;">${inGrid ? '【已部署】' : '【备战区】'}</span>
        </div>
        <div class="inspector-sub num-tabular" title="${statText}">${statText}</div>
      </div>
      <div class="inspector-actions">
        <button class="action-mini-btn" id="btn-rotate">${uiIcon('rotate', 11)} 旋转</button>
        ${
          inGrid
            ? `<button class="action-mini-btn" id="btn-to-stash">撤回</button>`
            : `<button class="action-mini-btn" id="btn-auto-place">上阵</button>`
        }
        <button class="action-mini-btn sell num-tabular" id="btn-sell">撤编 +${sellPrice}</button>
      </div>
    `;

    document.getElementById('btn-rotate')?.addEventListener('click', () => {
      if (isPlayingBattle || state.phase !== 'prep') return;
      try {
        state = Engine.rotateItem(state, selected.instanceId);
        sfx.playRotate();
        triggerSlamFeedback(selected.instanceId);
        renderAll();
      } catch (err) {
        sfx.playClang();
        showToast(err.message);
      }
    });

    document.getElementById('btn-to-stash')?.addEventListener('click', () => {
      if (isPlayingBattle || state.phase !== 'prep') return;
      try {
        state = Engine.placeOrMoveItem(state, { instanceId: selected.instanceId, toGrid: false });
        sfx.playLift();
        renderAll();
      } catch (err) {
        sfx.playClang();
        showToast(err.message);
      }
    });

    document.getElementById('btn-auto-place')?.addEventListener('click', () => {
      if (isPlayingBattle || state.phase !== 'prep') return;
      const target = findFirstValidGridCell(selected.itemId, selected.level, selected.rotation || 0);
      if (!target) {
        sfx.playClang();
        showToast('沙盘空间不足，请先旋转或腾出战壕格');
        return;
      }
      try {
        const beforeLen = state.placedItems.length;
        state = Engine.placeOrMoveItem(state, {
          instanceId: selected.instanceId,
          toGrid: true,
          row: target.row,
          col: target.col,
          rotation: selected.rotation || 0,
        });
        if (target.isMerge || state.placedItems.length === beforeLen) {
          sfx.playMerge();
          showToast('精锐部队部署并完成升星');
        } else {
          sfx.playLockIn();
        }
        triggerSlamFeedback(selected.instanceId);
        if (!findItemByInstanceId(selected.instanceId)) selectedRef = null;
        renderAll();
      } catch (err) {
        sfx.playClang();
        showToast(err.message);
      }
    });

    document.getElementById('btn-sell')?.addEventListener('click', () => {
      if (isPlayingBattle || state.phase !== 'prep') return;
      try {
        state = Engine.sellItem(state, selected.instanceId);
        selectedRef = null;
        sfx.playSell();
        showToast(`已撤编部队，返还 +${sellPrice} 军费`);
        renderAll();
      } catch (err) {
        sfx.playClang();
        showToast(err.message);
      }
    });
  }

  function renderStash() {
    stashBarEl.innerHTML = '';
    for (let i = 0; i < MAX_STASH_SLOTS; i++) {
      const item = state.stashItems[i];
      const slot = document.createElement('div');
      slot.dataset.stashIndex = String(i);
      if (item) {
        const isSel = selectedRef?.instanceId === item.instanceId;
        slot.className = `stash-slot filled${isSel ? ' selected' : ''}`;
        slot.dataset.stashInstanceId = item.instanceId;
        slot.innerHTML = `
          ${getItemSvg(item.itemId, 30)}
          <span class="star-badge">${renderStars(item.level)}</span>
        `;
        slot.addEventListener('pointerdown', (e) => {
          if (isPlayingBattle || state.phase !== 'prep') return;
          startDrag(e, {
            kind: 'stash',
            instanceId: item.instanceId,
            itemId: item.itemId,
            level: item.level,
            rotation: item.rotation || 0,
            grabOffsetR: 0,
            grabOffsetC: 0,
          });
        });
      } else {
        slot.className = 'stash-slot';
        slot.innerHTML = '<span class="stash-empty-mark">预备</span>';
      }
      stashBarEl.appendChild(slot);
    }
  }

  function renderShop() {
    const canRefresh = !isPlayingBattle && state.phase === 'prep' && state.gold >= state.refreshCost;
    shopSectionEl.innerHTML = `
      <div class="shop-header">
        <span style="display:inline-flex;align-items:center;gap:5px;color:#f3ebd7;">
          ${uiIcon('stash', 13)} 军需补给站 <span style="font-size:10px;color:#a99d83;">（点击征召 / 拖上沙盘）</span>
        </span>
        <button class="action-mini-btn num-tabular" id="btn-refresh" ${canRefresh ? '' : 'disabled'}>
          ${uiIcon('refresh', 11)} 调拨刷新 · ${state.refreshCost} 军费
        </button>
      </div>
      <div class="shop-cards" id="shop-cards"></div>
    `;

    document.getElementById('btn-refresh').addEventListener('click', () => {
      if (isPlayingBattle || state.phase !== 'prep') return;
      try {
        state = Engine.refreshShop(state);
        sfx.playRotate();
        renderAll();
      } catch (err) {
        sfx.playClang();
        showToast(err.message);
      }
    });

    const cardsEl = document.getElementById('shop-cards');
    state.shopOffers.forEach((offer, idx) => {
      const def = ITEM_CATALOG[offer.itemId];
      const rar = RARITY_META[def.rarity];
      const affordable = state.gold >= offer.cost;
      const card = document.createElement('div');
      card.className = `shop-card${offer.sold ? ' sold' : ''}${!affordable ? ' unaffordable' : ''}`;
      card.style.setProperty('--item-color', def.color);
      card.dataset.slotIndex = String(idx);
      card.innerHTML = `
        <div class="shop-card-top">
          <span class="shop-top-left">
            ${getMiniShapeSvg(def.baseCells, 0, def.color)}
            <span class="rarity-tag" style="color:${rar.color};">${rar.label}</span>
          </span>
          <button class="lock-btn ${offer.locked ? 'locked' : ''}" data-lock="${idx}" title="保留到下一波">
            ${uiIcon(offer.locked ? 'lock' : 'unlock', 10)}
          </button>
        </div>
        ${getItemSvg(offer.itemId, 44)}
        <div class="shop-name">${def.name}</div>
        <div class="shop-cost num-tabular ${!affordable ? 'lack' : ''}">${offer.sold ? '已调拨' : `${offer.cost} 军费`}</div>
      `;

      const lockBtn = card.querySelector('.lock-btn');
      lockBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
      lockBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isPlayingBattle || state.phase !== 'prep' || offer.sold) return;
        state = Engine.toggleLockShopSlot(state, idx);
        sfx.playLockIn();
        renderShop();
      });

      if (!offer.sold) {
        card.addEventListener('pointerdown', (e) => {
          if (isPlayingBattle || state.phase !== 'prep') return;
          startDrag(e, {
            kind: 'shop',
            slotIndex: idx,
            itemId: offer.itemId,
            level: 1,
            rotation: 0,
            cost: offer.cost,
            grabOffsetR: 0,
            grabOffsetC: 0,
          });
        });
      }

      cardsEl.appendChild(card);
    });
  }

  function renderBattleCta() {
    if (state.phase === 'relic_draft') {
      battleCtaEl.innerHTML = `${uiIcon('bolt', 14)} 战区嘉奖 · 领取军令勋章`;
    } else if (state.phase === 'victory') {
      battleCtaEl.innerHTML = `${uiIcon('trophy', 14)} 战线全胜 · 查阅终局捷报`;
    } else if (state.phase === 'gameover') {
      battleCtaEl.innerHTML = `${uiIcon('skull', 14)} 阵地失守 · 查阅战损报告`;
    } else {
      const waveCfg = WAVE_CONFIGS[state.wave - 1];
      battleCtaEl.innerHTML = `${uiIcon('engage', 13)} 拉响防空警报 · 迎战第 ${state.wave} 波（${waveCfg.name}）`;
    }
    battleCtaEl.disabled = isPlayingBattle;
  }

  function renderBattleDeckStrip() {
    const active = state.placedItems.filter((p) => ITEM_CATALOG[p.itemId].cooldownSec > 0);
    battleDeckStripEl.innerHTML = active
      .map((item) => {
        const def = ITEM_CATALOG[item.itemId];
        return `<div class="deck-mini-chip" data-deck-id="${item.instanceId}" title="${def.name}">
          <img src="${getUnitArtUrl(item.itemId)}" alt="" />
        </div>`;
      })
      .join('');
  }

  function enterFullBattleMode(report, snapshotState) {
    isPlayingBattle = true;
    selectedRef = null;
    showBattleSummaryModal = false;

    renderBattleDeckStrip();
    prepWorkspaceEl.classList.add('collapsing');

    setTimeout(() => {
      prepWorkspaceEl.hidden = true;
      prepWorkspaceEl.classList.remove('collapsing');
      battleScreenEl.hidden = false;
      arena.setSpeed(battleSpeed);
      arena.playReport(report, snapshotState);
    }, 200);
  }

  function exitFullBattleMode() {
    battleScreenEl.hidden = true;
    prepWorkspaceEl.hidden = false;
    prepWorkspaceEl.classList.remove('collapsing');
    renderAll();
  }

  battleCtaEl.addEventListener('click', () => {
    if (isPlayingBattle) return;
    if (state.phase === 'prep') {
      try {
        const snapshotBefore = state;
        state = Engine.runWaveBattle(state);
        sfx.playLockIn();
        enterFullBattleMode(state.lastBattleReport, snapshotBefore);
      } catch (err) {
        sfx.playClang();
        showToast(err.message);
      }
    } else {
      showBattleSummaryModal = true;
      renderModal();
    }
  });

  function renderModal() {
    if (showCodexModal) {
      modalRootEl.innerHTML = renderCodexModalHtml();
      document.getElementById('close-codex').addEventListener('click', () => {
        showCodexModal = false;
        renderModal();
      });
      document.getElementById('codex-backdrop').addEventListener('click', (e) => {
        if (e.target.id === 'codex-backdrop') {
          showCodexModal = false;
          renderModal();
        }
      });
      return;
    }

    if (showBattleSummaryModal && state.lastBattleReport) {
      const rep = state.lastBattleReport;
      const maxVal = Math.max(1, ...rep.contributions.map((c) => c.damage + c.shield + c.healing));
      let ctaLabel = `进入第 ${state.wave} 波沙盘整备`;
      if (state.phase === 'relic_draft') ctaLabel = '战区司令部颁授军令勋章';
      else if (state.phase === 'victory') ctaLabel = '防线凯旋全胜 · 重开新战役';
      else if (state.phase === 'gameover') ctaLabel = '阵地防线陷落 · 重新组织反攻';

      modalRootEl.innerHTML = `
        <div class="modal-backdrop">
          <div class="modal-card">
            <h2 class="modal-title" style="color:${rep.won ? '#bef264' : '#fca5a5'};">
              <span>${rep.won ? `第 ${rep.wave} 波 · 兽潮击溃` : '防线被突破（完整度 -1）'}</span>
              <span style="font-size:11px;color:#cbbda0;">历时 ${rep.durationSec.toFixed(1)} 秒</span>
            </h2>
            <div style="display:flex;gap:6px;flex-wrap:wrap;" class="num-tabular">
              <span class="hud-tag credits">+${rep.goldEarned} 军费${rep.interestEarned ? `（含公债利息 +${rep.interestEarned}）` : ''}</span>
              <span class="hud-tag">总输出 ${rep.totalDamageDealt}</span>
              <span class="hud-tag">总护甲 ${rep.totalShieldGained}</span>
            </div>
            <div style="display:flex;flex-direction:column;gap:7px;">
              <div style="font-size:11.5px;font-weight:800;color:#e6ba6c;">参战部队战绩统计</div>
              ${
                rep.contributions.length === 0
                  ? '<div style="font-size:12px;color:#a99d83;">本波次未在沙盘部署主动兵力</div>'
                  : rep.contributions
                      .map((c) => {
                        const score = c.damage + c.shield + c.healing;
                        const pct = Math.round((score / maxVal) * 100);
                        return `<div class="contrib-row num-tabular">
                          <div style="display:flex;justify-content:space-between;align-items:center;">
                            <span style="color:#fef3c7;font-weight:800;display:inline-flex;align-items:center;gap:4px;">${c.name} ${renderStars(c.level)}</span>
                            <span style="color:#d7ccb4;font-size:10.5px;">输出 ${c.damage} · 护甲 ${c.shield}${c.healing ? ` · 抢修 ${c.healing}` : ''}</span>
                          </div>
                          <div class="contrib-bar-bg">
                            <div class="contrib-bar-fill" style="width:${pct}%;background:#d4a656;"></div>
                          </div>
                        </div>`;
                      })
                      .join('')
              }
            </div>
            <button class="brass-btn" id="btn-report-continue">${ctaLabel}</button>
          </div>
        </div>
      `;

      document.getElementById('btn-report-continue').addEventListener('click', () => {
        showBattleSummaryModal = false;
        if (state.phase === 'victory' || state.phase === 'gameover') {
          state = Engine.createInitialState((Date.now() ^ Math.floor(Math.random() * 99999)) >>> 0);
        }
        exitFullBattleMode();
      });
      return;
    }

    if (state.phase === 'relic_draft' && !isPlayingBattle) {
      modalRootEl.innerHTML = `
        <div class="modal-backdrop">
          <div class="modal-card">
            <h2 class="modal-title" style="color:#fcd34d;">战区嘉奖 · 拣选 1 枚军令勋章</h2>
            <div style="font-size:11.5px;color:#d6cbb2;">要塞死守成功！所选战区军令将在后续全部波次永久生效：</div>
            ${state.pendingRelicChoices
              .map((relicId) => {
                const r = RELIC_CATALOG[relicId];
                return `<button class="relic-option" data-relic="${relicId}">
                  <div>${getRelicSvg(relicId, 38)}</div>
                  <div>
                    <div style="font-size:13px;font-weight:800;color:#fde68a;">${r.name}</div>
                    <div style="font-size:11px;color:#d7ccb4;margin-top:2px;">${r.description}</div>
                  </div>
                </button>`;
              })
              .join('')}
          </div>
        </div>
      `;
      modalRootEl.querySelectorAll('[data-relic]').forEach((btn) => {
        btn.addEventListener('click', () => {
          state = Engine.chooseRelic(state, btn.dataset.relic);
          sfx.playMerge();
          renderAll();
          showToast(`军令勋章生效：${RELIC_CATALOG[btn.dataset.relic].name}`);
        });
      });
      return;
    }

    modalRootEl.innerHTML = '';
  }

  function findFirstValidGridCell(itemId, level, rotation) {
    let mergeCandidate = null;
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const res = Engine.validatePlacement(state, { itemId, level, row: r, col: c, rotation });
        if (res.valid && !res.mergeTargetInstanceId) {
          return { row: r, col: c, isMerge: false };
        }
        if (res.valid && res.mergeTargetInstanceId && !mergeCandidate) {
          mergeCandidate = { row: r, col: c, isMerge: true };
        }
      }
    }
    return mergeCandidate;
  }

  function clearDragVisuals() {
    cellElements.forEach((el) => {
      el.classList.remove('preview-valid', 'preview-merge', 'preview-invalid');
    });
    stashBarEl.querySelectorAll('.stash-slot').forEach((s) => s.classList.remove('drop-hover', 'dragging-source'));
    gridItemsLayerEl
      .querySelectorAll('.colliding-pulse, .dragging-source')
      .forEach((el) => el.classList.remove('colliding-pulse', 'dragging-source'));
  }

  function buildRealScaleGhost(dragInfo) {
    const cellPx = Math.max(46, gridCellsBgEl.clientWidth / GRID_COLS);
    const def = ITEM_CATALOG[dragInfo.itemId];
    const { rows, cols, cells } = getShapeLayout(def.baseCells, dragInfo.rotation);
    const cellSet = new Set(cells.map(([r, c]) => `${r},${c}`));

    const ghost = document.createElement('div');
    ghost.className = 'drag-ghost';
    ghost.style.width = `${cols * cellPx}px`;
    ghost.style.height = `${rows * cellPx}px`;

    const inner = document.createElement('div');
    inner.className = 'drag-ghost-inner';

    const starCell = cells.reduce((best, cur) =>
      cur[0] < best[0] || (cur[0] === best[0] && cur[1] > best[1]) ? cur : best
    );

    for (const [r, c] of cells) {
      const hasUp = cellSet.has(`${r - 1},${c}`);
      const hasDown = cellSet.has(`${r + 1},${c}`);
      const hasLeft = cellSet.has(`${r},${c - 1}`);
      const hasRight = cellSet.has(`${r},${c + 1}`);

      const tile = document.createElement('div');
      tile.style.position = 'absolute';
      tile.style.left = `${c * cellPx}px`;
      tile.style.top = `${r * cellPx}px`;
      tile.style.width = `${cellPx}px`;
      tile.style.height = `${cellPx}px`;
      tile.style.padding = `${hasUp ? 0 : 2}px ${hasRight ? 0 : 2}px ${hasDown ? 0 : 2}px ${hasLeft ? 0 : 2}px`;

      const hull = document.createElement('div');
      hull.className = 'grid-piece-hull';
      hull.style.borderRadius = `${!hasUp && !hasLeft ? 6 : 0}px ${!hasUp && !hasRight ? 6 : 0}px ${!hasDown && !hasRight ? 6 : 0}px ${!hasDown && !hasLeft ? 6 : 0}px`;
      hull.style.borderTop = hasUp ? 'none' : `2px solid ${def.color}`;
      hull.style.borderBottom = hasDown ? 'none' : `3px solid #4a3a22`;
      hull.style.borderLeft = hasLeft ? 'none' : `2px solid ${def.color}`;
      hull.style.borderRight = hasRight ? 'none' : `2px solid ${def.color}`;

      if (r === starCell[0] && c === starCell[1]) {
        hull.innerHTML = `<span class="star-badge">${renderStars(dragInfo.level)}</span>`;
      }

      tile.appendChild(hull);
      inner.appendChild(tile);
    }

    const artOverlay = document.createElement('div');
    artOverlay.className = 'grid-piece-overlay';
    artOverlay.style.inset = '0';
    artOverlay.innerHTML = getPlacedItemVisualHtml(dragInfo.itemId, rows, cols, dragInfo.rotation);
    inner.appendChild(artOverlay);

    const rotHint = document.createElement('div');
    rotHint.className = 'drag-rotate-badge';
    rotHint.textContent = '[右键 / 滚轮] 旋转';
    inner.appendChild(rotHint);

    ghost.appendChild(inner);
    return { ghost, width: cols * cellPx, height: rows * cellPx, cellPx };
  }

  function getMagneticGridTarget(clientX, clientY, dragInfo) {
    const rect = gridCellsBgEl.getBoundingClientRect();
    if (
      clientX < rect.left - 14 ||
      clientX > rect.right + 14 ||
      clientY < rect.top - 14 ||
      clientY > rect.bottom + 14
    ) {
      return null;
    }

    const { rows, cols } = getShapeLayout(ITEM_CATALOG[dragInfo.itemId].baseCells, dragInfo.rotation);
    const cellW = rect.width / GRID_COLS;
    const cellH = rect.height / GRID_ROWS;
    const relC = (clientX - rect.left) / cellW;
    const relR = (clientY - rect.top) / cellH;

    const rawRow =
      dragInfo.kind === 'grid'
        ? Math.floor(relR) - (dragInfo.grabOffsetR || 0)
        : Math.round(relR - rows * 0.5);
    const rawCol =
      dragInfo.kind === 'grid'
        ? Math.floor(relC) - (dragInfo.grabOffsetC || 0)
        : Math.round(relC - cols * 0.5);

    const clampedRow = Math.max(0, Math.min(GRID_ROWS - rows, rawRow));
    const clampedCol = Math.max(0, Math.min(GRID_COLS - cols, rawCol));
    if (Math.abs(clampedRow - rawRow) <= 1 && Math.abs(clampedCol - rawCol) <= 1) {
      const checkRaw = Engine.validatePlacement(state, {
        itemId: dragInfo.itemId,
        level: dragInfo.level,
        row: rawRow,
        col: rawCol,
        rotation: dragInfo.rotation,
        ignoreInstanceId: dragInfo.instanceId || null,
      });
      if (!checkRaw.valid && checkRaw.reason === 'out_of_bounds') {
        const checkClamped = Engine.validatePlacement(state, {
          itemId: dragInfo.itemId,
          level: dragInfo.level,
          row: clampedRow,
          col: clampedCol,
          rotation: dragInfo.rotation,
          ignoreInstanceId: dragInfo.instanceId || null,
        });
        if (checkClamped.valid) {
          return { row: clampedRow, col: clampedCol, check: checkClamped };
        }
      }
    }

    const check = Engine.validatePlacement(state, {
      itemId: dragInfo.itemId,
      level: dragInfo.level,
      row: rawRow,
      col: rawCol,
      rotation: dragInfo.rotation,
      ignoreInstanceId: dragInfo.instanceId || null,
    });
    return { row: rawRow, col: rawCol, check };
  }

  function startDrag(e, info) {
    if (e.button !== undefined && e.button !== 0) return;
    drag = {
      ...info,
      startX: e.clientX,
      startY: e.clientY,
      curX: e.clientX,
      curY: e.clientY,
      prevX: e.clientX,
      tilt: 0,
      moved: false,
      ghostEl: null,
      ghostW: 0,
      ghostH: 0,
      lastSnapKey: null,
      rafId: null,
    };

    const updateHoverPreview = (clientX, clientY) => {
      clearDragVisuals();
      if (drag.instanceId) {
        gridItemsLayerEl
          .querySelectorAll(`[data-instance-id="${drag.instanceId}"]`)
          .forEach((el) => el.classList.add('dragging-source'));
        stashBarEl
          .querySelectorAll(`[data-stash-instance-id="${drag.instanceId}"]`)
          .forEach((el) => el.classList.add('dragging-source'));
      }

      const target = getMagneticGridTarget(clientX, clientY, drag);
      if (target) {
        const { row, col, check } = target;
        const snapKey = `${row},${col},${drag.rotation}`;
        if (snapKey !== drag.lastSnapKey) {
          drag.lastSnapKey = snapKey;
          sfx.playDetent();
        }
        const cls = check.valid
          ? check.mergeTargetInstanceId
            ? 'preview-merge'
            : 'preview-valid'
          : 'preview-invalid';
        for (const [r, c] of check.occupiedCells) {
          if (r >= 0 && r < GRID_ROWS && c >= 0 && c < GRID_COLS) {
            cellElements[r * GRID_COLS + c].classList.add(cls);
          }
        }
        if (!check.valid && check.overlappingInstanceIds.length > 0) {
          for (const oid of check.overlappingInstanceIds) {
            gridItemsLayerEl
              .querySelectorAll(`[data-instance-id="${oid}"]`)
              .forEach((el) => el.classList.add('colliding-pulse'));
          }
        }
      } else {
        drag.lastSnapKey = null;
        const elUnder = document.elementFromPoint(clientX, clientY);
        const stashSlot = elUnder?.closest?.('.stash-slot');
        if (stashSlot) stashSlot.classList.add('drop-hover');
      }
    };

    const refreshGhostAfterRotate = () => {
      if (!drag || !drag.moved) return;
      drag.rotation = (drag.rotation + 90) % 360;
      drag.grabOffsetR = 0;
      drag.grabOffsetC = 0;
      if (drag.ghostEl) drag.ghostEl.remove();
      const built = buildRealScaleGhost(drag);
      drag.ghostEl = built.ghost;
      drag.ghostW = built.width;
      drag.ghostH = built.height;
      document.body.appendChild(built.ghost);
      sfx.playRotate();
      updateHoverPreview(drag.curX, drag.curY);
    };

    const tickPhysics = () => {
      if (!drag || !drag.moved || !drag.ghostEl) return;
      const vx = drag.curX - drag.prevX;
      drag.prevX = drag.curX;
      const targetTilt = Math.max(-13, Math.min(13, vx * 0.45));
      drag.tilt += (targetTilt - drag.tilt) * 0.28;
      const gx = drag.curX - drag.ghostW * 0.5;
      const gy = drag.curY - drag.ghostH * 0.5;
      drag.ghostEl.style.transform = `translate3d(${gx}px, ${gy}px, 0) rotate(${drag.tilt.toFixed(2)}deg) scale(1.04)`;
      drag.rafId = requestAnimationFrame(tickPhysics);
    };

    const onMove = (ev) => {
      if (!drag) return;
      drag.curX = ev.clientX;
      drag.curY = ev.clientY;
      const dist = Math.hypot(ev.clientX - drag.startX, ev.clientY - drag.startY);
      if (!drag.moved && dist > 5) {
        drag.moved = true;
        sfx.playLift();
        const built = buildRealScaleGhost(drag);
        drag.ghostEl = built.ghost;
        drag.ghostW = built.width;
        drag.ghostH = built.height;
        document.body.appendChild(built.ghost);
        drag.rafId = requestAnimationFrame(tickPhysics);
      }
      if (!drag.moved) return;
      updateHoverPreview(ev.clientX, ev.clientY);
    };

    const onContextMenu = (ev) => {
      if (!drag || !drag.moved) return;
      ev.preventDefault();
      refreshGhostAfterRotate();
    };

    const onWheel = (ev) => {
      if (!drag || !drag.moved) return;
      ev.preventDefault();
      refreshGhostAfterRotate();
    };

    const onKeyDuringDrag = (ev) => {
      if (!drag || !drag.moved) return;
      if (ev.key === 'r' || ev.key === 'R') {
        ev.preventDefault();
        refreshGhostAfterRotate();
      }
    };

    const springBackGhost = (ghost, width, height, toX, toY) => {
      if (!ghost) return;
      ghost.style.transition = 'transform 0.19s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.19s ease';
      ghost.style.transform = `translate3d(${toX - width * 0.5}px, ${toY - height * 0.5}px, 0) scale(0.92)`;
      ghost.style.opacity = '0';
      setTimeout(() => ghost.remove(), 200);
    };

    const onUp = (ev) => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      window.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKeyDuringDrag);

      const currentDrag = drag;
      drag = null;
      if (currentDrag?.rafId) cancelAnimationFrame(currentDrag.rafId);
      clearDragVisuals();
      if (!currentDrag) return;

      if (!currentDrag.moved) {
        if (currentDrag.ghostEl) currentDrag.ghostEl.remove();
        handleTapAction(currentDrag);
        return;
      }

      const target = getMagneticGridTarget(ev.clientX, ev.clientY, currentDrag);
      if (target) {
        if (!target.check.valid) {
          sfx.playClang();
          for (const oid of target.check.overlappingInstanceIds) {
            gridItemsLayerEl
              .querySelectorAll(`[data-instance-id="${oid}"]`)
              .forEach((el) => el.classList.add('collision-shake'));
          }
          springBackGhost(
            currentDrag.ghostEl,
            currentDrag.ghostW,
            currentDrag.ghostH,
            currentDrag.startX,
            currentDrag.startY
          );
          showToast(target.check.reason === 'out_of_bounds' ? '超出沙盘作战区域边界' : '阵地战壕格已被其他兵牌占用');
          return;
        }

        if (currentDrag.ghostEl) currentDrag.ghostEl.remove();
        try {
          let activeId = currentDrag.instanceId;
          if (currentDrag.kind === 'shop') {
            const prevMaxSum = state.placedItems.reduce((a, b) => a + b.level, 0);
            const prevLen = state.placedItems.length;
            state = Engine.buyShopItem(state, currentDrag.slotIndex, {
              row: target.row,
              col: target.col,
              rotation: currentDrag.rotation,
            });
            const nextMaxSum = state.placedItems.reduce((a, b) => a + b.level, 0);
            activeId = target.check.mergeTargetInstanceId || state.placedItems[state.placedItems.length - 1]?.instanceId;
            if (state.placedItems.length === prevLen && nextMaxSum > prevMaxSum) {
              sfx.playMerge();
              showToast('征召并直接完成二合一升星');
            } else {
              sfx.playLockIn();
            }
          } else {
            const prevLen = state.placedItems.length + state.stashItems.length;
            state = Engine.placeOrMoveItem(state, {
              instanceId: currentDrag.instanceId,
              toGrid: true,
              row: target.row,
              col: target.col,
              rotation: currentDrag.rotation,
            });
            activeId = target.check.mergeTargetInstanceId || currentDrag.instanceId;
            if (state.placedItems.length + state.stashItems.length < prevLen) {
              sfx.playMerge();
              showToast('精锐部队二合一升星完成');
            } else {
              sfx.playLockIn();
            }
          }
          if (activeId) triggerSlamFeedback(activeId);
          renderAll();
        } catch (err) {
          sfx.playClang();
          showToast(err.message);
        }
        return;
      }

      const elUnder = document.elementFromPoint(ev.clientX, ev.clientY);
      const stashSlot = elUnder?.closest?.('.stash-slot');
      if (stashSlot) {
        if (currentDrag.ghostEl) currentDrag.ghostEl.remove();
        const targetStashInstanceId = stashSlot.dataset.stashInstanceId || null;
        try {
          if (currentDrag.kind === 'shop') {
            state = Engine.buyShopItem(state, currentDrag.slotIndex, null);
            sfx.playBuy();
          } else {
            const prevTotal = state.placedItems.length + state.stashItems.length;
            state = Engine.placeOrMoveItem(state, {
              instanceId: currentDrag.instanceId,
              toGrid: false,
              targetStashInstanceId:
                targetStashInstanceId && targetStashInstanceId !== currentDrag.instanceId
                  ? targetStashInstanceId
                  : null,
            });
            if (state.placedItems.length + state.stashItems.length < prevTotal) {
              sfx.playMerge();
              showToast('备战区内完成二合一升星');
            } else {
              sfx.playLockIn();
            }
          }
          renderAll();
        } catch (err) {
          sfx.playClang();
          showToast(err.message);
        }
        return;
      }

      sfx.playClang();
      springBackGhost(
        currentDrag.ghostEl,
        currentDrag.ghostW,
        currentDrag.ghostH,
        currentDrag.startX,
        currentDrag.startY
      );
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    window.addEventListener('contextmenu', onContextMenu);
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKeyDuringDrag);
  }

  function handleTapAction(info) {
    if (info.kind === 'shop') {
      if (state.gold < info.cost) {
        sfx.playClang();
        showToast('战区军费不足');
        return;
      }
      try {
        if (state.stashItems.length < MAX_STASH_SLOTS) {
          state = Engine.buyShopItem(state, info.slotIndex, null);
          const newest = state.stashItems[state.stashItems.length - 1];
          selectedRef = newest ? { source: 'stash', instanceId: newest.instanceId } : null;
          sfx.playBuy();
          showToast(`已征召【${ITEM_CATALOG[info.itemId].name}】进入备战区`);
        } else {
          const spot = findFirstValidGridCell(info.itemId, 1, 0);
          if (!spot) {
            sfx.playClang();
            showToast('备战区与作战沙盘均已满');
            return;
          }
          state = Engine.buyShopItem(state, info.slotIndex, {
            row: spot.row,
            col: spot.col,
            rotation: 0,
          });
          if (spot.isMerge) {
            sfx.playMerge();
            showToast('征召并直接完成二合一升星');
          } else {
            sfx.playLockIn();
            showToast(`已自动部署至沙盘第 ${spot.row + 1} 排防线`);
          }
        }
        renderAll();
      } catch (err) {
        sfx.playClang();
        showToast(err.message);
      }
      return;
    }

    if (selectedRef && selectedRef.instanceId !== info.instanceId && info.kind === 'grid') {
      const prevItem = findItemByInstanceId(selectedRef.instanceId);
      const targetItem = state.placedItems.find((p) => p.instanceId === info.instanceId);
      if (
        prevItem &&
        targetItem &&
        prevItem.itemId === targetItem.itemId &&
        prevItem.level === targetItem.level &&
        targetItem.level < 3
      ) {
        try {
          state = Engine.placeOrMoveItem(state, {
            instanceId: prevItem.instanceId,
            toGrid: true,
            row: targetItem.row,
            col: targetItem.col,
            rotation: prevItem.rotation || 0,
          });
          selectedRef = { source: 'grid', instanceId: targetItem.instanceId };
          sfx.playMerge();
          triggerSlamFeedback(targetItem.instanceId);
          showToast('精锐部队二合一升星完成');
          renderAll();
          return;
        } catch {
          // 回退到常规选中
        }
      }
    }

    selectedRef = { source: info.kind, instanceId: info.instanceId };
    sfx.playLift();
    renderAll();
  }

  window.addEventListener('keydown', (e) => {
    if (isPlayingBattle || state.phase !== 'prep' || drag?.moved) return;
    if ((e.key === 'r' || e.key === 'R') && selectedRef) {
      try {
        state = Engine.rotateItem(state, selectedRef.instanceId);
        sfx.playRotate();
        triggerSlamFeedback(selectedRef.instanceId);
        renderAll();
      } catch (err) {
        sfx.playClang();
        showToast(err.message);
      }
    }
  });

  function renderAll() {
    const synergies = Engine.computeGridSynergies(state);
    renderHud();
    renderThreatAndRelics(synergies);
    renderGrid(synergies);
    renderInspector(synergies);
    renderStash();
    renderShop();
    renderBattleCta();
    renderModal();
  }

  renderAll();
}

// 启动《铁血防线：1944》
const params = new URLSearchParams(window.location.search);
if (params.get('autostart') === '1') {
  bootPlayableGame();
} else {
  showSplashScreen(bootPlayableGame);
}
