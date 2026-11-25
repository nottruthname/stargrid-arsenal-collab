/**
 * 《星匣乱斗：口袋军械库》(Stargrid Arsenal) v2.0
 * 前端主控制器：
 * - 启动主封面 (Title Splash)
 * - 相位镜头调度（整备紧凑预览 -> 战斗 215px 剧场放大）
 * - 5×5 无缝多格轮廓合并 (Unified Polyomino Hulls) 与旋转姿态对齐
 * - 拖拽 / 点选上阵 / 二合一升星 / 60fps 战斗动画 / 图鉴与 A组协作诊断大厅
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
  REQUIRED_ENGINE_EXPORTS,
  WAVE_CONFIGS,
} from '../../shared/protocol.mjs';
import * as Engine from '../backend/engine.mjs';
import {
  getItemSvg,
  getMiniShapeSvg,
  getPlacedItemVisualHtml,
  getRelicSvg,
  renderStars,
} from './art.mjs';
import { BattleArena } from './arena.mjs';
import { sfx } from './sfx.mjs';

const appRoot = document.getElementById('app');

const HULL_PALETTES = {
  plasma_dagger: { top: '#0284c7', bot: '#0c4a6e', border: '#38bdf8', lip: '#082f49' },
  rail_rifle: { top: '#4f46e5', bot: '#1e1b4b', border: '#818cf8', lip: '#1e1b4b' },
  arc_launcher: { top: '#7e22ce', bot: '#3b0764', border: '#c084fc', lip: '#2e1065' },
  aegis_buckler: { top: '#d97706', bot: '#78350f', border: '#fbbf24', lip: '#451a03' },
  cryo_plate: { top: '#0d9488', bot: '#042f2e', border: '#2dd4bf', lip: '#042f2e' },
  solar_core: { top: '#e11d48', bot: '#881337', border: '#fb7185', lip: '#4c0519' },
  chrono_battery: { top: '#059669', bot: '#064e3b', border: '#34d399', lip: '#022c22' },
  nano_medkit: { top: '#16a34a', bot: '#14532d', border: '#4ade80', lip: '#052e16' },
};

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
  }, 2200);
}

// =====================================================================
// 分支 A：若后端尚未由 Codex 实现，渲染升级版 A组协作诊断大厅
// =====================================================================
function renderCodexLobby() {
  let activeTab = 'status';

  const draw = () => {
    const isImpl = (name) => {
      if (name === 'IS_BACKEND_IMPLEMENTED') return Engine.IS_BACKEND_IMPLEMENTED === true;
      const fn = Engine[name];
      return typeof fn === 'function' && !fn.toString().includes('notImplemented(');
    };
    const missingExports = REQUIRED_ENGINE_EXPORTS.filter((name) => !isImpl(name));

    appRoot.innerHTML = `
      <header class="hud-bar">
        <div class="hud-group">
          <span class="pill wave">🧪 A组 · 双AI协作版</span>
        </div>
        <div class="hud-group">
          <span class="pill gold">⏳ 等待 GPT 后端</span>
        </div>
      </header>

      <div class="lobby-banner">
        <div class="lobby-banner-bg"></div>
        <img src="./src/frontend/assets/hero-mech.png" alt="星匣先锋" style="width:68px;height:68px;object-fit:contain;position:relative;z-index:1;filter:drop-shadow(0 6px 10px rgba(0,0,0,0.8));" />
        <div style="position:relative;z-index:1;flex:1;">
          <div style="font-size:15px;font-weight:900;color:#e0f2fe;">《星匣乱斗》前端 v2.0 已就绪</div>
          <div style="font-size:11.5px;color:#cbd5e1;line-height:1.4;margin-top:2px;">
            已装配高清机甲精灵、无缝多格轮廓与 60fps 战报剧场。等待 GPT (Codex) 在 GitHub 提交 <code>src/backend/engine.mjs</code> 后即可直接试玩！
          </div>
        </div>
      </div>

      <div class="lobby-card">
        <div class="export-grid">
          ${REQUIRED_ENGINE_EXPORTS.map((name) => {
            const ok = isImpl(name);
            return `<div class="export-pill">
              <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${name}</span>
              <span style="color:${ok ? '#4ade80' : '#fbbf24'};flex-shrink:0;">${ok ? '✓' : '待实现'}</span>
            </div>`;
          }).join('')}
        </div>
      </div>

      <div class="tab-row">
        <button class="tab-btn ${activeTab === 'status' ? 'active' : ''}" data-tab="status">协作指南</button>
        <button class="tab-btn ${activeTab === 'items' ? 'active' : ''}" data-tab="items">8件装备图鉴</button>
        <button class="tab-btn ${activeTab === 'waves' ? 'active' : ''}" data-tab="waves">10波机甲预告</button>
      </div>

      <div style="flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:8px;padding-bottom:8px;">
        ${
          activeTab === 'status'
            ? `
          <div class="lobby-card">
            <div style="font-size:13px;font-weight:800;color:#34d399;">如何让 GPT (Codex) 自动接手后端？</div>
            <div style="font-size:12px;color:#cbd5e1;line-height:1.6;">
              1. 仓库已推送至 GitHub，在 <b>chatgpt.com/codex</b> 选中本仓库。<br/>
              2. 下达指令：<i>“请阅读 GAME_DESIGN.md 与 BACKEND_TASK.md，实现 src/backend/engine.mjs 并将 IS_BACKEND_IMPLEMENTED 设为 true，运行 node --test tests/contract.test.mjs 全部通过后提交 PR。”</i><br/>
              3. 拉取 PR 后刷新本页面即可与 B 组全栈版同屏对打对比！
            </div>
            <div style="font-size:11px;color:#94a3b8;">待实现契约项：${missingExports.length} 个</div>
          </div>
          <div class="lobby-card">
            <div style="font-size:13px;font-weight:800;color:#fbbf24;">5 种局内遗物预览</div>
            ${RELIC_IDS.map((id) => {
              const r = RELIC_CATALOG[id];
              return `<div class="codex-item-row">
                <div>${getRelicSvg(id, 32)}</div>
                <div>
                  <div style="font-size:12px;font-weight:800;color:${r.color};">${r.name}</div>
                  <div style="font-size:11px;color:#94a3b8;">${r.description}</div>
                </div>
              </div>`;
            }).join('')}
          </div>
        `
            : activeTab === 'items'
              ? ITEM_IDS.map((id) => {
                  const item = ITEM_CATALOG[id];
                  return `<div class="codex-item-row">
                    <div>${getItemSvg(id, 40)}</div>
                    <div style="flex:1;">
                      <div style="display:flex;justify-content:space-between;align-items:center;">
                        <span style="font-size:12px;font-weight:800;color:${item.color};">
                          ${item.name} · ${CATEGORY_META[item.category].label}
                        </span>
                        <span style="font-size:11px;color:#fde047;">💰${item.cost}</span>
                      </div>
                      <div style="font-size:11px;color:#cbd5e1;margin-top:2px;">${item.description}</div>
                      <div style="font-size:11px;color:#fbbf24;margin-top:2px;">连携：${item.synergyDesc}</div>
                    </div>
                  </div>`;
                }).join('')
              : WAVE_CONFIGS.map(
                  (w) => `<div class="codex-item-row">
                    <div style="min-width:44px;font-size:12px;font-weight:800;color:${w.accentColor};">
                      第${w.wave}波${w.isBoss ? '<br/>BOSS' : ''}
                    </div>
                    <div style="flex:1;">
                      <div style="font-size:12px;font-weight:800;">${w.name}</div>
                      <div style="font-size:11px;color:#cbd5e1;">
                        HP ${w.maxHp} · 护盾 ${w.initialShield} · 攻 ${w.attack}/${w.cooldownSec}s · 奖励 ${w.baseRewardGold}💰
                      </div>
                      <div style="font-size:11px;color:#94a3b8;">${w.traitDesc}</div>
                    </div>
                  </div>`
                ).join('')
        }
      </div>
    `;

    appRoot.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeTab = btn.dataset.tab;
        draw();
      });
    });
  };

  draw();
}

// =====================================================================
// 分支 B：启动主封面与完整可玩游戏
// =====================================================================
function renderCodexModalHtml() {
  return `
    <div class="modal-backdrop" id="codex-backdrop">
      <div class="modal-card">
        <h2 class="modal-title">
          <span>📖 军械库图鉴与规则</span>
          <button class="icon-btn" id="close-codex">✕</button>
        </h2>
        <div style="font-size:12px;color:#cbd5e1;line-height:1.55;">
          • 将多格武器、护盾、晶核拼入 <b>5×5 装甲星匣</b>，同星级同装备叠放即可<b>二合一升星</b>（最高 ★★★）。<br/>
          • 装备正交相邻激活<b>金色流光连携</b>（多格装备仅计相邻 1 次）。<br/>
          • 第 <b>2 / 5 / 8</b> 波胜利抽取强化遗物，坚持通过第 10 波终极首领！
        </div>
        ${ITEM_IDS.map((id) => {
          const item = ITEM_CATALOG[id];
          return `<div class="codex-item-row">
            <div>${getItemSvg(id, 38)}</div>
            <div style="flex:1;">
              <div style="font-size:12px;font-weight:800;color:${item.color};">
                ${item.name} (${RARITY_META[item.rarity].label} · 💰${item.cost})
              </div>
              <div style="font-size:11px;color:#94a3b8;">${item.description}</div>
              <div style="font-size:11px;color:#fbbf24;">连携：${item.synergyDesc}</div>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>
  `;
}

function showSplashScreen(onStart) {
  appRoot.classList.remove('battle-mode');
  appRoot.innerHTML = `
    <section class="splash-screen">
      <div class="splash-bg"></div>
      <div class="splash-vignette"></div>

      <div class="splash-header">
        <span class="splash-kicker">TAPTAP 竖屏肉鸽独立试玩版</span>
        <h1 class="splash-title">星匣乱斗<br/>口袋军械库</h1>
        <p class="splash-sub">STARGRID ARSENAL · 拼装 · 升星 · 自动迎战</p>
      </div>

      <div class="splash-stage">
        <img class="splash-mech hero" src="./src/frontend/assets/hero-mech.png" alt="星匣先锋" />
        <span class="splash-vs">VS</span>
        <img class="splash-mech boss" src="./src/frontend/assets/boss-overlord.png" alt="星渊主宰" />
      </div>

      <div class="splash-footer">
        <div class="splash-tags">
          <span class="splash-tag">🧩 5×5 异形拼装</span>
          <span class="splash-tag">⭐ 二合一升星</span>
          <span class="splash-tag">⚡ 邻接晶核超载</span>
        </div>
        <button id="btn-start-game" class="arcade-btn">🚀 启动星匣 · 立刻出击</button>
        <button id="btn-splash-codex" class="arcade-btn secondary">📖 查看 8 件装备图鉴</button>
      </div>
    </section>
    <div id="modal-root"></div>
    <div id="toast-root"></div>
  `;

  document.getElementById('btn-start-game').addEventListener('click', () => {
    sfx.playMerge();
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
  const triggeredInstanceIds = new Map();
  let drag = null;

  appRoot.innerHTML = `
    <header id="hud-bar" class="hud-bar"></header>
    <div class="arena-wrap">
      <canvas id="arena-canvas" class="arena-canvas" width="404" height="102"></canvas>
      <div id="battle-controls" class="battle-controls" hidden>
        <button class="icon-btn active" data-speed="1">1×</button>
        <button class="icon-btn" data-speed="2">2×</button>
        <button class="icon-btn" data-skip="1">跳过 ⏭</button>
      </div>
    </div>
    <div class="stats-relics-bar">
      <div id="arena-overlay-top" class="stats-group"></div>
      <div id="relics-strip" class="relics-strip"></div>
    </div>
    <section class="grid-section">
      <div id="stargrid-board" class="stargrid-board">
        <div class="grid-inner">
          <div id="grid-cells-bg" class="grid-cells-bg"></div>
          <svg id="synergy-svg" class="synergy-svg" viewBox="0 0 100 100"></svg>
          <div id="grid-items-layer" class="grid-items-layer"></div>
        </div>
      </div>
    </section>
    <div id="inspector-bar" class="inspector-bar"></div>
    <div id="stash-bar" class="stash-bar" aria-label="暂存舱"></div>
    <section id="shop-section" class="shop-section"></section>
    <button id="battle-cta" class="cta-btn"></button>
    <div id="modal-root"></div>
    <div id="toast-root"></div>
  `;

  const canvasEl = document.getElementById('arena-canvas');
  const hudEl = document.getElementById('hud-bar');
  const overlayTopEl = document.getElementById('arena-overlay-top');
  const battleControlsEl = document.getElementById('battle-controls');
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
        if (isPlayingBattle || state.phase !== 'prep') return;
        if (!selectedRef) return;
        const item = findItemByInstanceId(selectedRef.instanceId);
        if (!item) {
          selectedRef = null;
          renderAll();
          return;
        }
        try {
          const prevPlacedCount = state.placedItems.length;
          const prevLevelSum = state.placedItems.reduce((a, b) => a + b.level, 0);
          state = Engine.placeOrMoveItem(state, {
            instanceId: item.instanceId,
            toGrid: true,
            row: r,
            col: c,
            rotation: item.rotation || 0,
          });
          const nextLevelSum = state.placedItems.reduce((a, b) => a + b.level, 0);
          if (state.placedItems.length <= prevPlacedCount && nextLevelSum > prevLevelSum) {
            sfx.playMerge();
            showToast('✨ 二合一升星成功！');
          } else {
            sfx.playPlace();
          }
          if (!findItemByInstanceId(item.instanceId)) selectedRef = null;
          renderAll();
        } catch (err) {
          sfx.playError();
          showToast(err.message);
        }
      });
      gridCellsBgEl.appendChild(slot);
      cellElements.push(slot);
    }
  }

  const arena = new BattleArena(canvasEl, {
    onItemTrigger: (instanceId) => {
      if (triggeredInstanceIds.has(instanceId)) {
        clearTimeout(triggeredInstanceIds.get(instanceId));
      }
      gridItemsLayerEl
        .querySelectorAll(`[data-instance-id="${instanceId}"]`)
        .forEach((el) => el.classList.add('triggered'));
      const tid = setTimeout(() => {
        gridItemsLayerEl
          .querySelectorAll(`[data-instance-id="${instanceId}"]`)
          .forEach((el) => el.classList.remove('triggered'));
        triggeredInstanceIds.delete(instanceId);
      }, 210);
      triggeredInstanceIds.set(instanceId, tid);
    },
    onPlaybackComplete: () => {
      isPlayingBattle = false;
      appRoot.classList.remove('battle-mode');
      canvasEl.height = 102;
      battleControlsEl.hidden = true;
      showBattleSummaryModal = true;
      renderAll();
    },
  });
  arena.setPreview(state);
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
    const hearts = '❤️'.repeat(Math.max(0, state.lives)) + '🖤'.repeat(Math.max(0, 3 - state.lives));
    hudEl.innerHTML = `
      <div class="hud-group">
        <span class="pill wave ${waveCfg.isBoss ? 'boss' : ''}">
          ${waveCfg.isBoss ? '👑 ' : ''}第 ${state.wave}/${MAX_WAVES} 波
        </span>
        <span class="pill gold">💰 ${state.gold}</span>
        <span class="pill lives">${hearts}</span>
      </div>
      <div class="hud-group">
        <button class="icon-btn" id="btn-codex">图鉴</button>
        <button class="icon-btn" id="btn-mute">${sfx.muted ? '🔇' : '🔊'}</button>
        <button class="icon-btn" id="btn-restart" title="重新开局">🔄</button>
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
      arena.setPreview(state);
      renderAll();
      showToast('已重置战局，开启新征程！');
    });
  }

  function renderRelicsAndOverlay(synergies) {
    const raw = synergies.summary || {};
    let estimatedDps = raw.estimatedDps;
    let estimatedShieldPerSec = raw.estimatedShieldPerSec;
    const activeLinkCount =
      raw.activeLinkCount ?? raw.activeLinks ?? (synergies.links || []).filter((l) => l.active).length;

    if (typeof estimatedDps !== 'number' || typeof estimatedShieldPerSec !== 'number') {
      let dps = 0;
      let shieldPerSec = 0;
      for (const stats of Object.values(synergies.itemStats || {})) {
        const cd = stats.effectiveCooldownSec || 0;
        if (cd <= 0) continue;
        if (stats.effectiveDamage > 0) {
          const critChance = stats.effectiveCritChance ?? stats.critChance ?? 0;
          const critMult = stats.critMultiplier ?? 1;
          dps += (stats.effectiveDamage * (1 + critChance * (critMult - 1))) / cd;
        }
        if (stats.effectiveShield > 0) {
          shieldPerSec += stats.effectiveShield / cd;
        }
      }
      if (typeof estimatedDps !== 'number') estimatedDps = Number(dps.toFixed(1));
      if (typeof estimatedShieldPerSec !== 'number') estimatedShieldPerSec = Number(shieldPerSec.toFixed(1));
    }

    overlayTopEl.innerHTML = `
      <span class="stat-chip">⚔️ ${estimatedDps}/s</span>
      <span class="stat-chip">🛡 ${estimatedShieldPerSec}/s</span>
      <span class="stat-chip">⚡ ${activeLinkCount}连携</span>
    `;

    if (state.relics.length === 0) {
      relicsStripEl.innerHTML = `<span style="font-size:10.5px;color:#64748b;">2/5/8波解锁遗物</span>`;
    } else {
      relicsStripEl.innerHTML = state.relics
        .map((id) => {
          const r = RELIC_CATALOG[id];
          return `<span class="relic-chip" title="${r.description}">
            ${getRelicSvg(id, 15)} <span>${r.name}</span>
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
        return `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" class="synergy-line" />`;
      })
      .join('');

    gridItemsLayerEl.innerHTML = '';
    for (const item of state.placedItems) {
      const def = ITEM_CATALOG[item.itemId];
      const pal = HULL_PALETTES[item.itemId] || {
        top: '#1e293b',
        bot: '#0f172a',
        border: def.color,
        lip: '#090d16',
      };
      const info = centroids.get(item.instanceId);
      const stats = synergies.itemStats[item.instanceId];
      const isSelected = selectedRef?.instanceId === item.instanceId;
      const cellSet = new Set(info.cells.map(([r, c]) => `${r},${c}`));

      // 逐格渲染无缝连接的多格装甲模块外壳
      for (const [r, c] of info.cells) {
        const hasUp = cellSet.has(`${r - 1},${c}`);
        const hasDown = cellSet.has(`${r + 1},${c}`);
        const hasLeft = cellSet.has(`${r},${c - 1}`);
        const hasRight = cellSet.has(`${r},${c + 1}`);

        const padT = hasUp ? '0px' : '2.5px';
        const padB = hasDown ? '0px' : '2.5px';
        const padL = hasLeft ? '0px' : '2.5px';
        const padR = hasRight ? '0px' : '2.5px';

        const rTL = !hasUp && !hasLeft ? '9px' : '0px';
        const rTR = !hasUp && !hasRight ? '9px' : '0px';
        const rBL = !hasDown && !hasLeft ? '9px' : '0px';
        const rBR = !hasDown && !hasRight ? '9px' : '0px';

        const cellTile = document.createElement('div');
        cellTile.className = `grid-piece-cell${isSelected ? ' selected' : ''}`;
        cellTile.dataset.instanceId = item.instanceId;
        cellTile.style.left = `${c * 20}%`;
        cellTile.style.top = `${r * 20}%`;
        cellTile.style.width = '20%';
        cellTile.style.height = '20%';
        cellTile.style.padding = `${padT} ${padR} ${padB} ${padL}`;
        cellTile.style.setProperty('--item-color', def.color);
        cellTile.style.setProperty('--hull-top', pal.top);
        cellTile.style.setProperty('--hull-bot', pal.bot);

        const hull = document.createElement('div');
        hull.className = 'grid-piece-hull';
        hull.style.borderRadius = `${rTL} ${rTR} ${rBR} ${rBL}`;
        const borderCol = isSelected ? '#ffffff' : pal.border;
        const lipCol = isSelected ? '#e0f2fe' : pal.lip;
        hull.style.borderTop = hasUp ? 'none' : `2px solid ${borderCol}`;
        hull.style.borderBottom = hasDown ? 'none' : `3px solid ${lipCol}`;
        hull.style.borderLeft = hasLeft ? 'none' : `2px solid ${borderCol}`;
        hull.style.borderRight = hasRight ? 'none' : `2px solid ${borderCol}`;

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

      // 整体外接矩形内绘制自适应姿态的高精武器插画与星级
      const minR = Math.min(...info.cells.map(([r]) => r));
      const maxR = Math.max(...info.cells.map(([r]) => r));
      const minC = Math.min(...info.cells.map(([, c]) => c));
      const maxC = Math.max(...info.cells.map(([, c]) => c));
      const spanRows = maxR - minR + 1;
      const spanCols = maxC - minC + 1;

      const overlay = document.createElement('div');
      overlay.className = 'grid-piece-overlay';
      overlay.dataset.instanceId = item.instanceId;
      overlay.style.left = `${minC * 20}%`;
      overlay.style.top = `${minR * 20}%`;
      overlay.style.width = `${spanCols * 20}%`;
      overlay.style.height = `${spanRows * 20}%`;

      overlay.innerHTML = `
        ${getPlacedItemVisualHtml(item.itemId, spanRows, spanCols, item.rotation || 0)}
        <span class="star-badge">${renderStars(item.level)}</span>
        ${stats?.synergyTags?.length ? '<span class="synergy-dot"></span>' : ''}
      `;
      gridItemsLayerEl.appendChild(overlay);
    }
  }

  function renderInspector(synergies) {
    const selected = selectedRef ? findItemByInstanceId(selectedRef.instanceId) : null;
    if (!selected) {
      inspectorBarEl.innerHTML = `
        <div class="inspector-info">
          <div class="inspector-title">💡 军械星匣整备指南</div>
          <div class="inspector-sub">拖拽或点选装备放入 5×5 装甲星匣，同星级叠放二合一升星！</div>
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
      if (stats.effectiveDamage > 0) parts.push(`伤${stats.effectiveDamage}`);
      if (stats.effectiveShield > 0) parts.push(`盾${stats.effectiveShield}`);
      if (stats.effectiveHeal > 0) parts.push(`疗${stats.effectiveHeal}`);
      if (stats.effectiveCooldownSec > 0) parts.push(`冷却${stats.effectiveCooldownSec}s`);
      if (stats.synergyTags.length > 0) parts.push(stats.synergyTags.join(' · '));
      statText = parts.join(' | ') || def.description;
    }

    inspectorBarEl.innerHTML = `
      <div class="inspector-info">
        <div class="inspector-title" style="color:${def.color};">
          ${def.name} ${renderStars(selected.level)}
          <span style="font-size:10px;color:#94a3b8;">${inGrid ? '在阵中' : '在暂存舱'}</span>
        </div>
        <div class="inspector-sub" title="${statText}">${statText}</div>
      </div>
      <div class="inspector-actions">
        <button class="action-mini-btn" id="btn-rotate" ${isPlayingBattle ? 'disabled' : ''}>↻ 旋转</button>
        ${
          inGrid
            ? `<button class="action-mini-btn" id="btn-to-stash" ${isPlayingBattle ? 'disabled' : ''}>暂存</button>`
            : `<button class="action-mini-btn" id="btn-auto-place" ${isPlayingBattle ? 'disabled' : ''}>上阵</button>`
        }
        <button class="action-mini-btn sell" id="btn-sell" ${isPlayingBattle ? 'disabled' : ''}>卖+${sellPrice}💰</button>
      </div>
    `;

    document.getElementById('btn-rotate')?.addEventListener('click', () => {
      if (isPlayingBattle || state.phase !== 'prep') return;
      try {
        state = Engine.rotateItem(state, selected.instanceId);
        sfx.playRotate();
        renderAll();
      } catch (err) {
        sfx.playError();
        showToast(err.message);
      }
    });

    document.getElementById('btn-to-stash')?.addEventListener('click', () => {
      if (isPlayingBattle || state.phase !== 'prep') return;
      try {
        state = Engine.placeOrMoveItem(state, { instanceId: selected.instanceId, toGrid: false });
        sfx.playPlace();
        renderAll();
      } catch (err) {
        sfx.playError();
        showToast(err.message);
      }
    });

    document.getElementById('btn-auto-place')?.addEventListener('click', () => {
      if (isPlayingBattle || state.phase !== 'prep') return;
      const target = findFirstValidGridCell(selected.itemId, selected.level, selected.rotation || 0);
      if (!target) {
        sfx.playError();
        showToast('星匣暂无空位，请旋转或腾出格子');
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
          showToast('✨ 自动上阵并升星成功！');
        } else {
          sfx.playPlace();
        }
        if (!findItemByInstanceId(selected.instanceId)) selectedRef = null;
        renderAll();
      } catch (err) {
        sfx.playError();
        showToast(err.message);
      }
    });

    document.getElementById('btn-sell')?.addEventListener('click', () => {
      if (isPlayingBattle || state.phase !== 'prep') return;
      try {
        state = Engine.sellItem(state, selected.instanceId);
        selectedRef = null;
        sfx.playSell();
        showToast(`已出售，获得 +${sellPrice} 金币`);
        renderAll();
      } catch (err) {
        sfx.playError();
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
        const def = ITEM_CATALOG[item.itemId];
        const isSel = selectedRef?.instanceId === item.instanceId;
        slot.className = `stash-slot filled${isSel ? ' selected' : ''}`;
        slot.dataset.stashInstanceId = item.instanceId;
        slot.style.setProperty('--item-color', def.color);
        slot.innerHTML = `
          ${getItemSvg(item.itemId, 28)}
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
        slot.innerHTML = `<span style="font-size:10px;color:#475569;">舱${i + 1}</span>`;
      }
      stashBarEl.appendChild(slot);
    }
  }

  function renderShop() {
    const canRefresh = !isPlayingBattle && state.phase === 'prep' && state.gold >= state.refreshCost;
    shopSectionEl.innerHTML = `
      <div class="shop-header">
        <span>🛒 军械商店 <span style="font-size:10px;color:#94a3b8;font-weight:600;">(点击购买 / 拖入星匣)</span></span>
        <button class="action-mini-btn" id="btn-refresh" ${canRefresh ? '' : 'disabled'}>
          🔄 刷新 ${state.refreshCost}💰
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
        sfx.playError();
        showToast(err.message);
      }
    });

    const cardsEl = document.getElementById('shop-cards');
    state.shopOffers.forEach((offer, idx) => {
      const def = ITEM_CATALOG[offer.itemId];
      const affordable = state.gold >= offer.cost;
      const card = document.createElement('div');
      card.className = `shop-card${offer.sold ? ' sold' : ''}${!affordable ? ' unaffordable' : ''}`;
      card.style.setProperty('--item-color', def.color);
      card.dataset.slotIndex = String(idx);
      card.innerHTML = `
        <div class="shop-card-top">
          ${getMiniShapeSvg(def.baseCells, 0, def.color)}
          <button class="lock-btn ${offer.locked ? 'locked' : ''}" data-lock="${idx}" title="锁定到下一波">
            ${offer.locked ? '🔒' : '🔓'}
          </button>
        </div>
        ${getItemSvg(offer.itemId, 34)}
        <div class="shop-name" style="color:${def.color};">${def.name}</div>
        <div class="shop-cost ${!affordable ? 'lack' : ''}">${offer.sold ? '已售罄' : `💰 ${offer.cost}`}</div>
      `;

      const lockBtn = card.querySelector('.lock-btn');
      lockBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
      lockBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isPlayingBattle || state.phase !== 'prep' || offer.sold) return;
        state = Engine.toggleLockShopSlot(state, idx);
        sfx.playPlace();
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
    if (isPlayingBattle) {
      battleCtaEl.textContent = `⚔️ 第 ${state.wave} 波交战中...`;
      battleCtaEl.disabled = true;
      return;
    }
    if (state.phase === 'relic_draft') {
      battleCtaEl.textContent = '✨ 请先选择 1 件强化遗物';
      battleCtaEl.disabled = false;
    } else if (state.phase === 'victory') {
      battleCtaEl.textContent = '🏆 恭喜全通关！查看战绩或重开';
      battleCtaEl.disabled = false;
    } else if (state.phase === 'gameover') {
      battleCtaEl.textContent = '💀 战甲损毁 · 查看战报或重开';
      battleCtaEl.disabled = false;
    } else {
      const waveCfg = WAVE_CONFIGS[state.wave - 1];
      battleCtaEl.textContent = `⚔️ 出舱迎战 · 第 ${state.wave} 波 (${waveCfg.name})`;
      battleCtaEl.disabled = false;
    }
  }

  battleCtaEl.addEventListener('click', () => {
    if (isPlayingBattle) return;
    if (state.phase === 'prep') {
      try {
        selectedRef = null;
        state = Engine.runWaveBattle(state);
        isPlayingBattle = true;
        appRoot.classList.add('battle-mode');
        canvasEl.height = 215;
        battleControlsEl.hidden = false;
        showBattleSummaryModal = false;
        arena.setSpeed(battleSpeed);
        arena.playReport(state.lastBattleReport);
        renderAll();
      } catch (err) {
        sfx.playError();
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
      let ctaLabel = `➡️ 进入第 ${state.wave} 波整备`;
      if (state.phase === 'relic_draft') ctaLabel = '✨ 抽取强化遗物（三选一）';
      else if (state.phase === 'victory') ctaLabel = '🏆 通关完成 · 再来一局';
      else if (state.phase === 'gameover') ctaLabel = '🔄 战甲损毁 · 重新挑战';

      modalRootEl.innerHTML = `
        <div class="modal-backdrop">
          <div class="modal-card">
            <h2 class="modal-title" style="color:${rep.won ? '#4ade80' : '#fb7185'};">
              <span>${rep.won ? `✅ 第 ${rep.wave} 波胜利！` : `❌ 第 ${rep.wave} 波失利 (-1❤️)`}</span>
              <span style="font-size:12px;color:#94a3b8;">用时 ${rep.durationSec.toFixed(1)}s</span>
            </h2>
            <div style="display:flex;gap:8px;flex-wrap:wrap;font-size:12px;">
              <span class="pill gold">+${rep.goldEarned} 💰${rep.interestEarned ? ` (+${rep.interestEarned}利息)` : ''}</span>
              <span class="pill">总输出 ${rep.totalDamageDealt}</span>
              <span class="pill">总护盾 ${rep.totalShieldGained}</span>
            </div>
            <div style="display:flex;flex-direction:column;gap:7px;">
              <div style="font-size:12px;font-weight:800;color:#cbd5e1;">装备输出 / 护盾贡献榜</div>
              ${
                rep.contributions.length === 0
                  ? '<div style="font-size:12px;color:#64748b;">本回合无装备参战</div>'
                  : rep.contributions
                      .map((c) => {
                        const score = c.damage + c.shield + c.healing;
                        const pct = Math.round((score / maxVal) * 100);
                        return `<div class="contrib-row">
                          <div style="display:flex;justify-content:space-between;">
                            <span style="color:${c.color};font-weight:800;">${c.name} ${renderStars(c.level)}</span>
                            <span style="color:#cbd5e1;">伤${c.damage} · 盾${c.shield}${c.healing ? ` · 疗${c.healing}` : ''}</span>
                          </div>
                          <div class="contrib-bar-bg">
                            <div class="contrib-bar-fill" style="width:${pct}%;background:${c.color};"></div>
                          </div>
                        </div>`;
                      })
                      .join('')
              }
            </div>
            <button class="cta-btn" id="btn-report-continue">${ctaLabel}</button>
          </div>
        </div>
      `;

      document.getElementById('btn-report-continue').addEventListener('click', () => {
        showBattleSummaryModal = false;
        if (state.phase === 'victory' || state.phase === 'gameover') {
          state = Engine.createInitialState((Date.now() ^ Math.floor(Math.random() * 99999)) >>> 0);
          arena.setPreview(state);
        } else if (state.phase === 'prep') {
          arena.setPreview(state);
        }
        renderAll();
      });
      return;
    }

    if (state.phase === 'relic_draft' && !isPlayingBattle) {
      modalRootEl.innerHTML = `
        <div class="modal-backdrop">
          <div class="modal-card">
            <h2 class="modal-title" style="color:#fbbf24;">✨ 战利品协议 · 选择 1 件遗物</h2>
            <div style="font-size:12px;color:#94a3b8;">通关里程碑奖励！遗物将在剩余波次持续生效：</div>
            ${state.pendingRelicChoices
              .map((relicId) => {
                const r = RELIC_CATALOG[relicId];
                return `<button class="relic-option" data-relic="${relicId}">
                  <div>${getRelicSvg(relicId, 40)}</div>
                  <div>
                    <div style="font-size:13px;font-weight:800;color:${r.color};">${r.name}</div>
                    <div style="font-size:11.5px;color:#cbd5e1;margin-top:2px;">${r.description}</div>
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
          arena.setPreview(state);
          renderAll();
          showToast(`已装配遗物：${RELIC_CATALOG[btn.dataset.relic].name}`);
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

  function clearCellPreviews() {
    cellElements.forEach((el) => {
      el.classList.remove('preview-valid', 'preview-merge', 'preview-invalid');
    });
    stashBarEl.querySelectorAll('.stash-slot').forEach((s) => s.classList.remove('drop-hover'));
  }

  function getGridTargetFromPoint(clientX, clientY, dragInfo) {
    const rect = gridCellsBgEl.getBoundingClientRect();
    if (
      clientX < rect.left - 8 ||
      clientX > rect.right + 8 ||
      clientY < rect.top - 8 ||
      clientY > rect.bottom + 8
    ) {
      return null;
    }
    const relX = Math.max(0, Math.min(rect.width - 1, clientX - rect.left));
    const relY = Math.max(0, Math.min(rect.height - 1, clientY - rect.top));
    const ptrCol = Math.floor((relX / rect.width) * GRID_COLS);
    const ptrRow = Math.floor((relY / rect.height) * GRID_ROWS);
    return {
      row: ptrRow - (dragInfo.grabOffsetR || 0),
      col: ptrCol - (dragInfo.grabOffsetC || 0),
    };
  }

  function startDrag(e, info) {
    if (e.button !== undefined && e.button !== 0) return;
    drag = {
      ...info,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
      ghostEl: null,
    };

    const onMove = (ev) => {
      if (!drag) return;
      const dist = Math.hypot(ev.clientX - drag.startX, ev.clientY - drag.startY);
      if (!drag.moved && dist > 7) {
        drag.moved = true;
        const ghost = document.createElement('div');
        ghost.className = 'drag-ghost';
        ghost.style.borderColor = ITEM_CATALOG[drag.itemId].color;
        ghost.innerHTML = `${getItemSvg(drag.itemId, 42)}<span style="font-size:10px;font-weight:800;">${ITEM_CATALOG[drag.itemId].name}</span>`;
        document.body.appendChild(ghost);
        drag.ghostEl = ghost;
      }
      if (!drag.moved) return;

      if (drag.ghostEl) {
        drag.ghostEl.style.left = `${ev.clientX}px`;
        drag.ghostEl.style.top = `${ev.clientY}px`;
      }

      clearCellPreviews();
      const target = getGridTargetFromPoint(ev.clientX, ev.clientY, drag);
      if (target) {
        const check = Engine.validatePlacement(state, {
          itemId: drag.itemId,
          level: drag.level,
          row: target.row,
          col: target.col,
          rotation: drag.rotation,
          ignoreInstanceId: drag.instanceId || null,
        });
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
      } else {
        const elUnder = document.elementFromPoint(ev.clientX, ev.clientY);
        const stashSlot = elUnder?.closest?.('.stash-slot');
        if (stashSlot) stashSlot.classList.add('drop-hover');
      }
    };

    const onUp = (ev) => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);

      const currentDrag = drag;
      drag = null;
      if (currentDrag?.ghostEl) currentDrag.ghostEl.remove();
      clearCellPreviews();
      if (!currentDrag) return;

      if (!currentDrag.moved) {
        handleTapAction(currentDrag);
        return;
      }

      const target = getGridTargetFromPoint(ev.clientX, ev.clientY, currentDrag);
      if (target) {
        try {
          if (currentDrag.kind === 'shop') {
            const prevMaxSum = state.placedItems.reduce((a, b) => a + b.level, 0);
            const prevLen = state.placedItems.length;
            state = Engine.buyShopItem(state, currentDrag.slotIndex, {
              row: target.row,
              col: target.col,
              rotation: currentDrag.rotation,
            });
            const nextMaxSum = state.placedItems.reduce((a, b) => a + b.level, 0);
            if (state.placedItems.length === prevLen && nextMaxSum > prevMaxSum) {
              sfx.playMerge();
              showToast('✨ 购买并直接合成升星！');
            } else {
              sfx.playBuy();
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
            if (state.placedItems.length + state.stashItems.length < prevLen) {
              sfx.playMerge();
              showToast('✨ 二合一升星成功！');
            } else {
              sfx.playPlace();
            }
          }
          renderAll();
        } catch (err) {
          sfx.playError();
          showToast(err.message);
        }
        return;
      }

      const elUnder = document.elementFromPoint(ev.clientX, ev.clientY);
      const stashSlot = elUnder?.closest?.('.stash-slot');
      if (stashSlot) {
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
              showToast('✨ 暂存舱二合一升星！');
            } else {
              sfx.playPlace();
            }
          }
          renderAll();
        } catch (err) {
          sfx.playError();
          showToast(err.message);
        }
      }
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  }

  function handleTapAction(info) {
    if (info.kind === 'shop') {
      if (state.gold < info.cost) {
        sfx.playError();
        showToast('金币不足！');
        return;
      }
      try {
        if (state.stashItems.length < MAX_STASH_SLOTS) {
          state = Engine.buyShopItem(state, info.slotIndex, null);
          const newest = state.stashItems[state.stashItems.length - 1];
          selectedRef = newest ? { source: 'stash', instanceId: newest.instanceId } : null;
          sfx.playBuy();
          showToast(`已购买 ${ITEM_CATALOG[info.itemId].name} 到暂存舱`);
        } else {
          const spot = findFirstValidGridCell(info.itemId, 1, 0);
          if (!spot) {
            sfx.playError();
            showToast('暂存舱与星匣均已满，请先出售装备！');
            return;
          }
          state = Engine.buyShopItem(state, info.slotIndex, {
            row: spot.row,
            col: spot.col,
            rotation: 0,
          });
          if (spot.isMerge) {
            sfx.playMerge();
            showToast('✨ 购买并自动合成升星！');
          } else {
            sfx.playBuy();
            showToast(`暂存舱满，已自动装入 (${spot.row + 1},${spot.col + 1})`);
          }
        }
        renderAll();
      } catch (err) {
        sfx.playError();
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
          showToast('✨ 二合一升星成功！');
          renderAll();
          return;
        } catch {
          // 退回正常选中
        }
      }
    }

    selectedRef = { source: info.kind, instanceId: info.instanceId };
    sfx.playPlace();
    renderAll();
  }

  window.addEventListener('keydown', (e) => {
    if (isPlayingBattle || state.phase !== 'prep') return;
    if ((e.key === 'r' || e.key === 'R') && selectedRef) {
      try {
        state = Engine.rotateItem(state, selectedRef.instanceId);
        sfx.playRotate();
        renderAll();
      } catch (err) {
        sfx.playError();
        showToast(err.message);
      }
    }
  });

  function renderAll() {
    const synergies = Engine.computeGridSynergies(state);
    renderHud();
    renderRelicsAndOverlay(synergies);
    renderGrid(synergies);
    renderInspector(synergies);
    renderStash();
    renderShop();
    renderBattleCta();
    renderModal();
  }

  renderAll();
}

// 启动入口
if (Engine.IS_BACKEND_IMPLEMENTED) {
  const params = new URLSearchParams(window.location.search);
  if (params.get('autostart') === '1') {
    bootPlayableGame();
  } else {
    showSplashScreen(bootPlayableGame);
  }
} else {
  renderCodexLobby();
}
