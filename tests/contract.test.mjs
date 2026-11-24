import test from 'node:test';
import assert from 'node:assert/strict';

import {
  BASE_REFRESH_COST,
  INITIAL_GOLD,
  INITIAL_LIVES,
  ITEM_CATALOG,
  MAX_STASH_SLOTS,
  OVERTIME_START_SEC,
  PLAYER_BASE_MAX_HP,
  RELIC_CATALOG,
  SHOP_SLOTS,
  WAVE_CONFIGS,
} from '../shared/protocol.mjs';

import * as Engine from '../src/backend/engine.mjs';

const {
  IS_BACKEND_IMPLEMENTED,
  createInitialState,
  getOccupiedCells,
  validatePlacement,
  buyShopItem,
  placeOrMoveItem,
  rotateItem,
  sellItem,
  toggleLockShopSlot,
  refreshShop,
  computeGridSynergies,
  simulateBattle,
  runWaveBattle,
  chooseRelic,
} = Engine;

test('01. 后端实现开关必须开启 (IS_BACKEND_IMPLEMENTED === true)', () => {
  assert.equal(
    IS_BACKEND_IMPLEMENTED,
    true,
    'TODO_CODEX: 请先在 src/backend/engine.mjs 中实现全部契约函数并将 IS_BACKEND_IMPLEMENTED 设为 true'
  );
});

test('02. createInitialState 确定性与初始字段契约', () => {
  const s1 = createInitialState(12345);
  const s2 = createInitialState(12345);
  assert.deepEqual(s1, s2, '相同种子应生成完全一致的初始状态');

  assert.equal(s1.wave, 1);
  assert.equal(s1.phase, 'prep');
  assert.equal(s1.gold, INITIAL_GOLD);
  assert.equal(s1.lives, INITIAL_LIVES);
  assert.equal(s1.playerMaxHp, PLAYER_BASE_MAX_HP);
  assert.equal(s1.refreshCost, BASE_REFRESH_COST);
  assert.equal(s1.shopOffers.length, SHOP_SLOTS);
  assert.equal(s1.placedItems.length, 1);
  assert.equal(s1.placedItems[0].itemId, 'plasma_dagger');
  assert.equal(s1.placedItems[0].row, 2);
  assert.equal(s1.placedItems[0].col, 2);
});

test('03. getOccupiedCells 旋转归一化正确（长条与L型）', () => {
  assert.deepEqual(getOccupiedCells('rail_rifle', 1, 1, 0), [
    [1, 1],
    [1, 2],
    [1, 3],
  ]);
  assert.deepEqual(getOccupiedCells('rail_rifle', 1, 1, 90), [
    [1, 1],
    [2, 1],
    [3, 1],
  ]);
  assert.deepEqual(getOccupiedCells('rail_rifle', 1, 1, -90), [
    [1, 1],
    [2, 1],
    [3, 1],
  ]);

  // L型电弧发射器 [[0,0],[1,0],[1,1]] 顺时针旋转
  assert.deepEqual(getOccupiedCells('arc_launcher', 0, 0, 0), [
    [0, 0],
    [1, 0],
    [1, 1],
  ]);
  assert.deepEqual(getOccupiedCells('arc_launcher', 0, 0, 90), [
    [0, 0],
    [0, 1],
    [1, 0],
  ]);
  assert.deepEqual(getOccupiedCells('arc_launcher', 0, 0, 180), [
    [0, 0],
    [0, 1],
    [1, 1],
  ]);
  assert.deepEqual(getOccupiedCells('arc_launcher', 0, 0, 270), [
    [0, 1],
    [1, 0],
    [1, 1],
  ]);
});

test('04. validatePlacement 边界、重叠与同星级二合一校验', () => {
  const s = createInitialState(77);

  // 越界
  const oob = validatePlacement(s, {
    itemId: 'rail_rifle',
    level: 1,
    row: 0,
    col: 3,
    rotation: 0,
  });
  assert.equal(oob.valid, false);
  assert.equal(oob.reason, 'out_of_bounds');

  // 与初始 (2,2) 短匕重叠且同为 Lv.1 短匕 -> 允许合成
  const mergeOk = validatePlacement(s, {
    itemId: 'plasma_dagger',
    level: 1,
    row: 2,
    col: 2,
    rotation: 0,
  });
  assert.equal(mergeOk.valid, true);
  assert.equal(mergeOk.mergeTargetInstanceId, s.placedItems[0].instanceId);

  // 不同装备重叠 -> 禁止
  const badOverlap = validatePlacement(s, {
    itemId: 'rail_rifle',
    level: 1,
    row: 2,
    col: 1,
    rotation: 0,
  });
  assert.equal(badOverlap.valid, false);
  assert.equal(badOverlap.mergeTargetInstanceId, null);

  // Lv.3 满星不可再合成
  const maxState = structuredClone(s);
  maxState.placedItems[0].level = 3;
  const mergeMax = validatePlacement(maxState, {
    itemId: 'plasma_dagger',
    level: 3,
    row: 2,
    col: 2,
    rotation: 0,
  });
  assert.equal(mergeMax.valid, false);
});

test('05. buyShopItem 购买到暂存舱、直接放到网格合成及不可变性', () => {
  const base = createInitialState(101);
  base.gold = 30;
  base.shopOffers = [
    { slotIndex: 0, itemId: 'plasma_dagger', cost: 3, sold: false, locked: false },
    { slotIndex: 1, itemId: 'solar_core', cost: 4, sold: false, locked: false },
    { slotIndex: 2, itemId: 'aegis_buckler', cost: 4, sold: false, locked: false },
  ];

  // 直接购买并叠到 (2,2) 合成 Lv.2 短匕
  const snapshotBefore = JSON.stringify(base);
  const s1 = buyShopItem(base, 0, { row: 2, col: 2, rotation: 0 });
  assert.equal(JSON.stringify(base), snapshotBefore, 'buyShopItem 不得直接修改原 state');
  assert.equal(s1.gold, 27);
  assert.equal(s1.shopOffers[0].sold, true);
  assert.equal(s1.placedItems.length, 1);
  assert.equal(s1.placedItems[0].level, 2);
  assert.equal(s1.placedItems[0].investedGold, 6);

  // 购买到暂存舱
  const s2 = buyShopItem(s1, 1, null);
  assert.equal(s2.gold, 23);
  assert.equal(s2.stashItems.length, 1);
  assert.equal(s2.stashItems[0].itemId, 'solar_core');

  // 已售出不可重复买
  assert.throws(() => buyShopItem(s2, 0, null));

  // 金币不足拒绝购买
  s2.gold = 1;
  assert.throws(() => buyShopItem(s2, 2, null));

  // 暂存舱满 6 个拒绝入舱
  s2.gold = 99;
  let fullState = s2;
  for (let i = 1; i < MAX_STASH_SLOTS; i++) {
    fullState.shopOffers[2] = {
      slotIndex: 2,
      itemId: 'plasma_dagger',
      cost: 3,
      sold: false,
      locked: false,
    };
    fullState = buyShopItem(fullState, 2, null);
  }
  assert.equal(fullState.stashItems.length, MAX_STASH_SLOTS);
  fullState.shopOffers[2] = {
    slotIndex: 2,
    itemId: 'plasma_dagger',
    cost: 3,
    sold: false,
    locked: false,
  };
  assert.throws(() => buyShopItem(fullState, 2, null));
});

test('06. placeOrMoveItem 与 rotateItem（含贴边微调与暂存舱合成）', () => {
  const s = createInitialState(202);
  s.placedItems = [
    {
      instanceId: 'rail_1',
      itemId: 'rail_rifle',
      level: 1,
      row: 4,
      col: 0,
      rotation: 0, // 在最底行横向 [4,0][4,1][4,2]
      investedGold: 5,
    },
  ];
  s.stashItems = [
    { instanceId: 'st_1', itemId: 'solar_core', level: 1, rotation: 0, investedGold: 4 },
    { instanceId: 'st_2', itemId: 'solar_core', level: 1, rotation: 0, investedGold: 4 },
  ];

  // 在底行旋转横枪 -> 应自动向上微调以保持在 5x5 网格内
  const rotated = rotateItem(s, 'rail_1');
  const railCells = getOccupiedCells(
    'rail_rifle',
    rotated.placedItems[0].row,
    rotated.placedItems[0].col,
    rotated.placedItems[0].rotation
  );
  assert.equal(rotated.placedItems[0].rotation, 90);
  assert.ok(railCells.every(([r, c]) => r >= 0 && r < 5 && c >= 0 && c < 5));

  // 暂存舱内二合一合成
  const mergedStash = placeOrMoveItem(rotated, {
    instanceId: 'st_1',
    toGrid: false,
    targetStashInstanceId: 'st_2',
  });
  assert.equal(mergedStash.stashItems.length, 1);
  assert.equal(mergedStash.stashItems[0].level, 2);
  assert.equal(mergedStash.stashItems[0].investedGold, 8);

  // 从暂存舱放入网格
  const placedFromStash = placeOrMoveItem(mergedStash, {
    instanceId: 'st_2',
    toGrid: true,
    row: 0,
    col: 0,
    rotation: 0,
  });
  assert.equal(placedFromStash.stashItems.length, 0);
  assert.equal(placedFromStash.placedItems.length, 2);
});

test('07. sellItem、toggleLockShopSlot 与 refreshShop 经济机制', () => {
  let s = createInitialState(303);
  s.placedItems[0].investedGold = 5; // ceil(5 * 0.6) = 3
  const beforeGold = s.gold;
  const sold = sellItem(s, s.placedItems[0].instanceId);
  assert.equal(sold.placedItems.length, 0);
  assert.equal(sold.gold, beforeGold + 3);

  // 锁定槽位后刷新商店，锁定槽位保留
  let lockedState = toggleLockShopSlot(s, 0);
  assert.equal(lockedState.shopOffers[0].locked, true);
  const lockedItemId = lockedState.shopOffers[0].itemId;
  lockedState.gold = 20;

  const r1 = refreshShop(lockedState);
  assert.equal(r1.gold, 18); // cost 2
  assert.equal(r1.shopOffers[0].itemId, lockedItemId);
  assert.equal(r1.refreshCost, 2);

  const r2 = refreshShop(r1);
  assert.equal(r2.gold, 16); // cost 2
  assert.equal(r2.refreshCost, 3); // 第 3 次刷新涨到 3 金币
});

test('08. computeGridSynergies 多格去重与所有连携数值校验', () => {
  const s = createInitialState(404);
  s.placedItems = [
    { instanceId: 'cb', itemId: 'chrono_battery', level: 1, row: 0, col: 0, rotation: 0, investedGold: 4 },
    { instanceId: 'cryo', itemId: 'cryo_plate', level: 1, row: 1, col: 0, rotation: 0, investedGold: 6 },
    { instanceId: 'sc', itemId: 'solar_core', level: 1, row: 1, col: 2, rotation: 0, investedGold: 4 },
    { instanceId: 'pd', itemId: 'plasma_dagger', level: 1, row: 0, col: 2, rotation: 0, investedGold: 3 },
    { instanceId: 'ab', itemId: 'aegis_buckler', level: 1, row: 2, col: 2, rotation: 0, investedGold: 4 },
    { instanceId: 'med', itemId: 'nano_medkit', level: 1, row: 1, col: 3, rotation: 0, investedGold: 4 },
  ];

  const syn = computeGridSynergies(s);

  // cryo_plate 与 chrono_battery 共享 (0,0)-(1,0) 和 (0,1)-(1,1) 两条边，neighborIds 必须去重
  assert.equal(syn.itemStats.cb.neighborIds.filter((id) => id === 'cryo').length, 1);

  // chrono_battery 给 cryo_plate 加速 +25%: 2.6 / 1.25 = 2.08
  assert.equal(syn.itemStats.cryo.effectiveCooldownSec, 2.08);
  assert.equal(syn.itemStats.cryo.chillOnTrigger, 1);

  // plasma_dagger 相邻 chrono_battery(0,1) 与 solar_core(1,2):
  // 冷却 1.0 / 1.25 = 0.8s; 伤害 Math.round(8 * 1.35) = 11; burnOnHit = 1
  assert.equal(syn.itemStats.pd.effectiveCooldownSec, 0.8);
  assert.equal(syn.itemStats.pd.effectiveDamage, 11);
  assert.equal(syn.itemStats.pd.burnOnHit, 1);

  // aegis_buckler 在 (2,2),(3,2) 相邻 cryo_plate(2,1):
  // 护盾基础 14 + 4(相邻1个护盾cryo) = 18; 再受 cryo_plate +25% -> 18 * 1.25 = 22.5 -> 23
  assert.equal(syn.itemStats.ab.effectiveShield, 23);

  // nano_medkit 在 (1,3) 相邻 solar_core(1,2): 9 + 5 = 14
  assert.equal(syn.itemStats.med.effectiveHeal, 14);
});

test('09. simulateBattle 确定性、异常状态与加时风暴契约', () => {
  const s = createInitialState(505);
  s.placedItems = [
    { instanceId: 'w1', itemId: 'plasma_dagger', level: 2, row: 2, col: 2, rotation: 0, investedGold: 6 },
    { instanceId: 'c1', itemId: 'solar_core', level: 1, row: 2, col: 1, rotation: 0, investedGold: 4 },
    { instanceId: 'w2', itemId: 'arc_launcher', level: 1, row: 0, col: 0, rotation: 0, investedGold: 5 },
  ];

  const r1 = simulateBattle(s);
  const r2 = simulateBattle(s);
  assert.deepEqual(r1, r2, '相同状态 simulateBattle 必须完全确定');
  assert.equal(r1.won, true);
  assert.ok(r1.timeline.length > 0);
  assert.ok(r1.totalDamageDealt >= WAVE_CONFIGS[0].maxHp);
  assert.ok(r1.timeline.some((e) => e.burnApplied > 0 || e.shockApplied > 0));

  // 空背包应战必败
  const empty = createInitialState(506);
  empty.placedItems = [];
  const loseReport = simulateBattle(empty);
  assert.equal(loseReport.won, false);
  assert.equal(loseReport.playerEndHp, 0);

  // 测试第 10 波无输出仅超高防拖入 18s+ 加时赛风暴
  const tank = createInitialState(507);
  tank.wave = 10;
  tank.playerMaxHp = 900;
  tank.placedItems = [
    { instanceId: 's1', itemId: 'cryo_plate', level: 3, row: 0, col: 0, rotation: 0, investedGold: 18 },
    { instanceId: 's2', itemId: 'cryo_plate', level: 3, row: 0, col: 2, rotation: 0, investedGold: 18 },
  ];
  const overtimeReport = simulateBattle(tank);
  assert.ok(overtimeReport.durationSec >= OVERTIME_START_SEC);
  assert.ok(overtimeReport.timeline.some((e) => e.type === 'overtime_storm'));
});

test('10. runWaveBattle 与 chooseRelic 全流程推进（含第2波遗物与10波通关/3败结束）', () => {
  let s = createInitialState(606);
  s.placedItems = [
    { instanceId: 'w1', itemId: 'rail_rifle', level: 3, row: 0, col: 0, rotation: 0, investedGold: 15 },
    { instanceId: 'c1', itemId: 'solar_core', level: 2, row: 1, col: 0, rotation: 0, investedGold: 8 },
    { instanceId: 'c2', itemId: 'chrono_battery', level: 2, row: 1, col: 1, rotation: 0, investedGold: 8 },
  ];

  // 第 1 波胜利 -> 进第 2 波
  s = runWaveBattle(s);
  assert.equal(s.lastBattleReport.won, true);
  assert.equal(s.wave, 2);
  assert.equal(s.phase, 'prep');

  // 第 2 波胜利 -> 进入遗物三选一
  s = runWaveBattle(s);
  assert.equal(s.lastBattleReport.won, true);
  assert.equal(s.phase, 'relic_draft');
  assert.equal(s.pendingRelicChoices.length, 3);

  const chosenRelic = s.pendingRelicChoices[0];
  const prevMaxHp = s.playerMaxHp;
  s = chooseRelic(s, chosenRelic);
  assert.equal(s.phase, 'prep');
  assert.equal(s.wave, 3);
  assert.deepEqual(s.relics, [chosenRelic]);
  if (chosenRelic === 'titanium_hull') {
    assert.equal(s.playerMaxHp, prevMaxHp + 35);
    const sim = simulateBattle(s);
    assert.equal(sim.playerStartShield, 25);
  }

  // 直接验证第 10 波胜利 -> victory
  let w10 = structuredClone(s);
  w10.wave = 10;
  w10.placedItems.push({
    instanceId: 's1',
    itemId: 'cryo_plate',
    level: 3,
    row: 2,
    col: 0,
    rotation: 0,
    investedGold: 18,
  });
  w10 = runWaveBattle(w10);
  assert.equal(w10.lastBattleReport.won, true);
  assert.equal(w10.phase, 'victory');

  // 验证 3 次失败 -> gameover
  let loseRun = createInitialState(707);
  loseRun.placedItems = [];
  loseRun = runWaveBattle(loseRun);
  assert.equal(loseRun.lives, 2);
  assert.equal(loseRun.phase, 'prep');
  loseRun = runWaveBattle(loseRun);
  assert.equal(loseRun.lives, 1);
  loseRun = runWaveBattle(loseRun);
  assert.equal(loseRun.lives, 0);
  assert.equal(loseRun.phase, 'gameover');
});
