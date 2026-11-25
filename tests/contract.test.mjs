import test from 'node:test';
import assert from 'node:assert/strict';

import {
  BASE_REFRESH_COST,
  INITIAL_GOLD,
  INITIAL_LIVES,
  MAX_STASH_SLOTS,
  OVERTIME_START_SEC,
  PLAYER_BASE_MAX_HP,
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
  assert.equal(IS_BACKEND_IMPLEMENTED, true);
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
  assert.equal(s1.placedItems[0].itemId, 'infantry_squad');
  assert.equal(s1.placedItems[0].row, 2);
  assert.equal(s1.placedItems[0].col, 2);
});

test('03. getOccupiedCells 旋转归一化正确（长条火箭炮与 L 型榴弹炮）', () => {
  assert.deepEqual(getOccupiedCells('katyusha_mlrs', 1, 1, 0), [
    [1, 1],
    [1, 2],
    [1, 3],
  ]);
  assert.deepEqual(getOccupiedCells('katyusha_mlrs', 1, 1, 90), [
    [1, 1],
    [2, 1],
    [3, 1],
  ]);
  assert.deepEqual(getOccupiedCells('katyusha_mlrs', 1, 1, -90), [
    [1, 1],
    [2, 1],
    [3, 1],
  ]);

  // L型 155毫米榴弹炮 [[0,0],[1,0],[1,1]] 顺时针旋转
  assert.deepEqual(getOccupiedCells('howitzer_155', 0, 0, 0), [
    [0, 0],
    [1, 0],
    [1, 1],
  ]);
  assert.deepEqual(getOccupiedCells('howitzer_155', 0, 0, 90), [
    [0, 0],
    [0, 1],
    [1, 0],
  ]);
  assert.deepEqual(getOccupiedCells('howitzer_155', 0, 0, 180), [
    [0, 0],
    [0, 1],
    [1, 1],
  ]);
  assert.deepEqual(getOccupiedCells('howitzer_155', 0, 0, 270), [
    [0, 1],
    [1, 0],
    [1, 1],
  ]);
});

test('04. validatePlacement 边界、重叠与同星级二合一校验', () => {
  const s = createInitialState(77);

  const oob = validatePlacement(s, {
    itemId: 'katyusha_mlrs',
    level: 1,
    row: 0,
    col: 3,
    rotation: 0,
  });
  assert.equal(oob.valid, false);
  assert.equal(oob.reason, 'out_of_bounds');

  const mergeOk = validatePlacement(s, {
    itemId: 'infantry_squad',
    level: 1,
    row: 2,
    col: 2,
    rotation: 0,
  });
  assert.equal(mergeOk.valid, true);
  assert.equal(mergeOk.mergeTargetInstanceId, s.placedItems[0].instanceId);

  const badOverlap = validatePlacement(s, {
    itemId: 'katyusha_mlrs',
    level: 1,
    row: 2,
    col: 1,
    rotation: 0,
  });
  assert.equal(badOverlap.valid, false);
  assert.equal(badOverlap.mergeTargetInstanceId, null);

  const maxState = structuredClone(s);
  maxState.placedItems[0].level = 3;
  const mergeMax = validatePlacement(maxState, {
    itemId: 'infantry_squad',
    level: 3,
    row: 2,
    col: 2,
    rotation: 0,
  });
  assert.equal(mergeMax.valid, false);
});

test('05. buyShopItem 购买到备战区、直接部署沙盘合成及不可变性', () => {
  const base = createInitialState(101);
  base.gold = 35;
  base.shopOffers = [
    { slotIndex: 0, itemId: 'infantry_squad', cost: 3, sold: false, locked: false },
    { slotIndex: 1, itemId: 'ammo_depot', cost: 4, sold: false, locked: false },
    { slotIndex: 2, itemId: 'concrete_bunker', cost: 4, sold: false, locked: false },
  ];

  const snapshotBefore = JSON.stringify(base);
  const s1 = buyShopItem(base, 0, { row: 2, col: 2, rotation: 0 });
  assert.equal(JSON.stringify(base), snapshotBefore, 'buyShopItem 不得直接修改原 state');
  assert.equal(s1.gold, 32);
  assert.equal(s1.shopOffers[0].sold, true);
  assert.equal(s1.placedItems.length, 1);
  assert.equal(s1.placedItems[0].level, 2);
  assert.equal(s1.placedItems[0].investedGold, 6);

  const s2 = buyShopItem(s1, 1, null);
  assert.equal(s2.gold, 28);
  assert.equal(s2.stashItems.length, 1);
  assert.equal(s2.stashItems[0].itemId, 'ammo_depot');

  assert.throws(() => buyShopItem(s2, 0, null));
  s2.gold = 1;
  assert.throws(() => buyShopItem(s2, 2, null));

  s2.gold = 99;
  let fullState = s2;
  for (let i = 1; i < MAX_STASH_SLOTS; i++) {
    fullState.shopOffers[2] = {
      slotIndex: 2,
      itemId: 'infantry_squad',
      cost: 3,
      sold: false,
      locked: false,
    };
    fullState = buyShopItem(fullState, 2, null);
  }
  assert.equal(fullState.stashItems.length, MAX_STASH_SLOTS);
  fullState.shopOffers[2] = {
    slotIndex: 2,
    itemId: 'infantry_squad',
    cost: 3,
    sold: false,
    locked: false,
  };
  assert.throws(() => buyShopItem(fullState, 2, null));
});

test('06. placeOrMoveItem 与 rotateItem（含贴边微调与备战区合成）', () => {
  const s = createInitialState(202);
  s.placedItems = [
    {
      instanceId: 'mlrs_1',
      itemId: 'katyusha_mlrs',
      level: 1,
      row: 4,
      col: 0,
      rotation: 0,
      investedGold: 6,
    },
  ];
  s.stashItems = [
    { instanceId: 'st_1', itemId: 'command_radio', level: 1, rotation: 0, investedGold: 4 },
    { instanceId: 'st_2', itemId: 'command_radio', level: 1, rotation: 0, investedGold: 4 },
  ];

  const rotated = rotateItem(s, 'mlrs_1');
  const cells = getOccupiedCells(
    'katyusha_mlrs',
    rotated.placedItems[0].row,
    rotated.placedItems[0].col,
    rotated.placedItems[0].rotation
  );
  assert.equal(rotated.placedItems[0].rotation, 90);
  assert.ok(cells.every(([r, c]) => r >= 0 && r < 5 && c >= 0 && c < 5));

  const mergedStash = placeOrMoveItem(rotated, {
    instanceId: 'st_1',
    toGrid: false,
    targetStashInstanceId: 'st_2',
  });
  assert.equal(mergedStash.stashItems.length, 1);
  assert.equal(mergedStash.stashItems[0].level, 2);
  assert.equal(mergedStash.stashItems[0].investedGold, 8);

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
  const s = createInitialState(303);
  s.placedItems[0].investedGold = 5;
  const beforeGold = s.gold;
  const sold = sellItem(s, s.placedItems[0].instanceId);
  assert.equal(sold.placedItems.length, 0);
  assert.equal(sold.gold, beforeGold + 3);

  let lockedState = toggleLockShopSlot(s, 0);
  assert.equal(lockedState.shopOffers[0].locked, true);
  const lockedItemId = lockedState.shopOffers[0].itemId;
  lockedState.gold = 20;

  const r1 = refreshShop(lockedState);
  assert.equal(r1.gold, 18);
  assert.equal(r1.shopOffers[0].itemId, lockedItemId);
  assert.equal(r1.refreshCost, 2);

  const r2 = refreshShop(r1);
  assert.equal(r2.gold, 16);
  assert.equal(r2.refreshCost, 3);
});

test('08. computeGridSynergies 多格去重、重坦光环与电台/弹药库连携数值', () => {
  const s = createInitialState(404);
  s.placedItems = [
    { instanceId: 'ammo', itemId: 'ammo_depot', level: 1, row: 0, col: 0, rotation: 0, investedGold: 4 },
    { instanceId: 'bunk', itemId: 'concrete_bunker', level: 1, row: 1, col: 0, rotation: 0, investedGold: 4 },
    { instanceId: 'inf', itemId: 'infantry_squad', level: 1, row: 1, col: 1, rotation: 0, investedGold: 3 },
    { instanceId: 'radio', itemId: 'command_radio', level: 1, row: 1, col: 2, rotation: 0, investedGold: 4 },
    { instanceId: 'tank', itemId: 'heavy_tank', level: 1, row: 2, col: 1, rotation: 0, investedGold: 7 },
    { instanceId: 'howi', itemId: 'howitzer_155', level: 1, row: 0, col: 2, rotation: 180, investedGold: 5 },
  ];

  const syn = computeGridSynergies(s);

  // heavy_tank 与 inf(1,1) / bunk(2,0) 邻接不重复
  assert.equal(syn.itemStats.bunk.neighborIds.filter((id) => id === 'tank').length, 1);

  // bunk 相邻 ammo(装填+25% => 2.1/1.25 = 1.68s), 且相邻 inf+tank (15+10=25), 再乘重坦+20%护甲光环 => 30
  assert.equal(syn.itemStats.bunk.effectiveCooldownSec, 1.68);
  assert.equal(syn.itemStats.bunk.effectiveShield, 30);

  // inf 相邻 radio(+30%伤/+1破甲) 与 tank(+20%伤/冷缩0.88) => 9*1.5 = 14 伤害, 0.88秒
  assert.equal(syn.itemStats.inf.effectiveDamage, 14);
  assert.equal(syn.itemStats.inf.effectiveCooldownSec, 0.88);
  assert.equal(syn.itemStats.inf.breakOnHit, 1);

  // howitzer_155(0,2 rot180 => [0,2][0,3][1,3]) 相邻 radio(1,2): (22+5)*1.3 = 35 伤害, burnOnHit=3
  assert.equal(syn.itemStats.howi.effectiveDamage, 35);
  assert.equal(syn.itemStats.howi.burnOnHit, 3);
  assert.ok(syn.summary.estimatedDps > 0 && syn.summary.activeLinkCount > 0);
});

test('09. simulateBattle 确定性、高炮防空1.5倍、轰炸机穿甲与加时风暴契约', () => {
  // 测试第3波空袭波次：双联高射炮触发 1.5x 破空重击 + 俯冲轰炸机无视护甲
  const airWave = createInitialState(505);
  airWave.wave = 3;
  airWave.placedItems = [
    { instanceId: 'flak', itemId: 'flak_cannon', level: 1, row: 0, col: 0, rotation: 0, investedGold: 5 },
    { instanceId: 'bomb', itemId: 'dive_bomber', level: 1, row: 0, col: 2, rotation: 0, investedGold: 6 },
  ];
  const r1 = simulateBattle(airWave);
  const r2 = simulateBattle(airWave);
  assert.deepEqual(r1, r2, '相同状态 simulateBattle 必须完全确定');
  assert.ok(r1.timeline.some((e) => e.itemId === 'flak_cannon' && e.isAerialBonus === true));
  assert.ok(r1.timeline.some((e) => e.itemId === 'dive_bomber' && e.armorPierced === true));

  // 空沙盘必败
  const empty = createInitialState(506);
  empty.placedItems = [];
  const loseReport = simulateBattle(empty);
  assert.equal(loseReport.won, false);
  assert.equal(loseReport.playerEndHp, 0);

  // 第 10 波纯超厚防拖入 18s+ 加时风暴
  const tank = createInitialState(507);
  tank.wave = 10;
  tank.playerMaxHp = 1200;
  tank.placedItems = [
    { instanceId: 'b1', itemId: 'concrete_bunker', level: 3, row: 0, col: 0, rotation: 0, investedGold: 12 },
    { instanceId: 'b2', itemId: 'concrete_bunker', level: 3, row: 0, col: 1, rotation: 0, investedGold: 12 },
    { instanceId: 'b3', itemId: 'concrete_bunker', level: 3, row: 0, col: 2, rotation: 0, investedGold: 12 },
  ];
  const overtimeReport = simulateBattle(tank);
  assert.ok(overtimeReport.durationSec >= OVERTIME_START_SEC);
  assert.ok(overtimeReport.timeline.some((e) => e.type === 'overtime_storm'));
});

test('10. runWaveBattle 与 chooseRelic 全流程推进（含第2波军令勋章与10波通关/3败结束）', () => {
  let s = createInitialState(606);
  s.placedItems = [
    { instanceId: 'w1', itemId: 'katyusha_mlrs', level: 3, row: 0, col: 0, rotation: 0, investedGold: 18 },
    { instanceId: 'c1', itemId: 'command_radio', level: 2, row: 1, col: 0, rotation: 0, investedGold: 8 },
    { instanceId: 'c2', itemId: 'ammo_depot', level: 2, row: 1, col: 1, rotation: 0, investedGold: 8 },
  ];

  s = runWaveBattle(s);
  assert.equal(s.lastBattleReport.won, true);
  assert.equal(s.wave, 2);
  assert.equal(s.phase, 'prep');

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
  if (chosenRelic === 'bastion_fortification') {
    assert.equal(s.playerMaxHp, prevMaxHp + 40);
    const sim = simulateBattle(s);
    assert.equal(sim.playerStartShield, 25);
  }

  let w10 = structuredClone(s);
  w10.wave = 10;
  w10.placedItems.push({
    instanceId: 't1',
    itemId: 'heavy_tank',
    level: 3,
    row: 2,
    col: 0,
    rotation: 0,
    investedGold: 21,
  });
  w10 = runWaveBattle(w10);
  assert.equal(w10.lastBattleReport.won, true);
  assert.equal(w10.phase, 'victory');

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
