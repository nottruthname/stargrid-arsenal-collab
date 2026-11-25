import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_GOLD, INITIAL_LIVES, ITEM_CATALOG, MAX_WAVES, SHOP_SLOTS } from '../shared/protocol.mjs';
import {
  buyShopItem,
  chooseRelic,
  createInitialState,
  runWaveBattle,
  simulateBattle,
} from '../src/backend/engine.mjs';

const SEEDS = [101, 505, 20261124];
const AIR_WAVES = [3, 6, 9];
const BOSS_WAVES = [5, 10];
// 固定验收基线，以便捕获波次奖励配置意外漂移。
const BASE_REWARDS = [7, 8, 9, 10, 13, 13, 15, 16, 18, 22];
const BONDS = 'wartime_bonds';
const FLAK = 'flak_cannon';

const BUILDS = [
  {
    name: '步兵集群流',
    relics: [BONDS, 'bastion_fortification', 'frontline_triage'],
    purchases: {
      1: [['infantry_squad', 2, 1], ['infantry_squad', 2, 3], ['heavy_mg', 1, 1]],
      3: [['infantry_squad', 3, 2]],
      6: [['infantry_squad', 2, 2], ['infantry_squad', 3, 3]],
      7: [['infantry_squad', 2, 1], ['infantry_squad', 2, 3]],
      8: [['heavy_mg', 1, 1], ['infantry_squad', 3, 2]],
    },
    hasCoreAction: ({ contributions }) => contributions.filter(
      ({ itemId, damage }) => itemId === 'infantry_squad' && damage > 0,
    ).length >= 2,
  },
  {
    name: '重炮灼烧流',
    relics: [BONDS, 'frontline_triage', 'bastion_fortification'],
    purchases: {
      1: [['howitzer_155', 1, 0], ['ammo_depot', 1, 1]],
      3: [['katyusha_mlrs', 0, 0]],
      6: [['howitzer_155', 1, 0], ['howitzer_155', 2, 3]],
      7: [['katyusha_mlrs', 0, 0]],
      8: [['howitzer_155', 2, 3]],
    },
    hasCoreAction: ({ wave, timeline }) => BOSS_WAVES.includes(wave)
      ? timeline.some((e) => e.type === 'burn_tick' && e.damage > 0)
      : timeline.some((e) => e.type === 'weapon_hit' && e.itemId === 'howitzer_155' && e.burnApplied > 0),
  },
  {
    name: '防空高炮破空流',
    relics: [BONDS, 'aerial_supremacy', 'bastion_fortification'],
    purchases: {
      1: [[FLAK, 0, 1], ['heavy_mg', 1, 2]],
      2: [['ammo_depot', 0, 2]],
      3: [[FLAK, 0, 0]],
      6: [[FLAK, 0, 1], [FLAK, 0, 0], [FLAK, 2, 1]],
      7: [['heavy_mg', 1, 2]],
    },
    hasCoreAction: ({ wave, timeline }) => timeline.some((e) =>
      e.type === 'weapon_hit' && e.itemId === FLAK && e.damage > 0 &&
      (!AIR_WAVES.includes(wave) || e.isAerialBonus === true),
    ),
  },
  {
    name: '重坦碉堡铁壁流',
    relics: [BONDS, 'bastion_fortification', 'frontline_triage'],
    purchases: {
      1: [['heavy_tank', 2, 0], ['concrete_bunker', 2, 4]],
      2: [['heavy_mg', 1, 0]],
      3: [['heavy_tank', 0, 3]],
      4: [['ammo_depot', 1, 2]],
      5: [['heavy_tank', 2, 0]],
      6: [['command_radio', 2, 3], ['heavy_mg', 1, 0]],
      7: [['heavy_tank', 0, 3]],
      8: [['heavy_tank', 3, 2], ['concrete_bunker', 2, 4]],
    },
    hasCoreAction: ({ contributions }) => ['heavy_tank', 'concrete_bunker'].every((id) =>
      contributions.some(({ itemId, shield }) => itemId === id && shield > 0),
    ),
  },
];

function buyPlannedCards(state, purchases, label) {
  assert.ok(purchases.length <= SHOP_SLOTS, `${label}：采购计划超出商店槽位`);
  // 固定计划所需的货源，保留其余槽位、战斗随机数和军令抽选。
  let next = {
    ...state,
    shopOffers: state.shopOffers.map((offer, slotIndex) => {
      const purchase = purchases[slotIndex];
      if (!purchase) return offer;
      const [itemId] = purchase;
      return { slotIndex, itemId, cost: ITEM_CATALOG[itemId].cost, sold: false, locked: false };
    }),
  };

  for (const [slotIndex, [itemId, row, col]] of purchases.entries()) {
    const { cost, name } = ITEM_CATALOG[itemId];
    const goldBefore = next.gold;
    assert.ok(goldBefore >= cost, `${label}：采购${name}所需军费为 ${cost}，现有 ${goldBefore}`);
    next = buyShopItem(next, slotIndex, { row, col, rotation: 0 });
    assert.equal(next.gold, goldBefore - cost, `${label}：${name}采购扣款异常`);
  }
  return next;
}

for (const build of BUILDS) {
  test(`${build.name}连续打穿十波`, (t) => {
    for (const seed of SEEDS) {
      let state = createInitialState(seed);
      let expectedGold = INITIAL_GOLD;
      const bossTimes = [];
      let totalInterest = 0;
      let maxInterest = 0;

      assert.equal(MAX_WAVES, BASE_REWARDS.length, '战役应包含十波');
      for (const [index, baseReward] of BASE_REWARDS.entries()) {
        const wave = index + 1;
        const label = `${build.name}，种子 ${seed}，第 ${wave} 波`;
        assert.equal(state.wave, wave, `${label}：推进波次异常`);
        assert.equal(state.phase, 'prep', `${label}：应进入整备`);
        assert.equal(state.gold, expectedGold, `${label}：整备军费与上一波结算不符`);

        const purchases = build.purchases[wave] ?? [];
        state = buyPlannedCards(state, purchases, label);
        expectedGold -= purchases.reduce((sum, [itemId]) => sum + ITEM_CATALOG[itemId].cost, 0);
        const expectedInterest = state.relics.includes(BONDS) ? Math.min(5, Math.floor(expectedGold / 5)) : 0;

        state = runWaveBattle(state);
        const report = state.lastBattleReport;
        assert.equal(report.wave, wave, `${label}：战报波次异常`);
        assert.ok(report.won, `${label}：${report.durationSec} 秒后未获胜，敌方剩余耐久 ${report.enemyEndHp}`);
        assert.equal(state.lives, INITIAL_LIVES, `${label}：胜利后战役次数异常`);
        assert.ok(build.hasCoreAction(report), `${label}：战报缺少流派的核心行动`);
        assert.equal(report.interestEarned, expectedInterest, `${label}：公债利息异常`);
        assert.equal(report.goldEarned, baseReward + expectedInterest, `${label}：胜利军费异常`);
        expectedGold += baseReward + expectedInterest;
        assert.equal(state.gold, expectedGold, `${label}：结算余额异常`);
        totalInterest += report.interestEarned;
        maxInterest = Math.max(maxInterest, report.interestEarned);

        if (BOSS_WAVES.includes(wave)) {
          assert.equal(report.enemy.isBoss, true, `${label}：应为首领波`);
          assert.equal(report.enemyEndHp, 0, `${label}：首领应被击杀`);
          assert.ok(
            report.durationSec >= 5 && report.durationSec <= 28,
            `${label}：首领击杀耗时 ${report.durationSec} 秒，预期 5 至 28 秒`,
          );
          bossTimes.push(report.durationSec);
        }

        if (state.phase === 'relic_draft') {
          const relic = build.relics.find((id) => state.pendingRelicChoices.includes(id));
          state = chooseRelic(state, relic ?? state.pendingRelicChoices[0]);
        }
      }

      assert.equal(state.phase, 'victory', `${build.name}，种子 ${seed}：战役应以胜利结束`);
      assert.equal(maxInterest, 5, `${build.name}，种子 ${seed}：应至少一次获得公债利息上限`);
      t.diagnostic(
        `种子 ${seed}：第 5 波首领 ${bossTimes[0]} 秒，第 10 波首领 ${bossTimes[1]} 秒，` +
        `累计利息 ${totalInterest}，通关军费 ${state.gold}`,
      );
    }
  });
}

for (const wave of [1, ...AIR_WAVES]) {
  test(`第 ${wave} 波高炮直接伤害符合破空倍率`, () => {
    const state = buyPlannedCards(createInitialState(505), [[FLAK, 0, 0]], `第 ${wave} 波对照`);
    const flak = state.placedItems.find((item) => item.itemId === FLAK);
    // 单炮、无军令或连携，用实际命中伤害排除破甲与额外增伤干扰。
    const report = simulateBattle({ ...state, wave, placedItems: [flak] });
    const isAerial = AIR_WAVES.includes(wave);
    assert.equal(report.enemy.isAerial, isAerial);
    assert.equal(report.enemy.isBoss, false);

    const hits = report.timeline.filter((e) => e.type === 'weapon_hit' && e.itemId === FLAK);
    const { baseDamage, critMultiplier } = ITEM_CATALOG[FLAK];
    const expectedDamage = Math.round(baseDamage * (isAerial ? 1.5 : 1));
    assert.ok(hits.some((hit) => !hit.isCrit), '战报必须包含至少一次高炮普通命中');
    for (const hit of hits) {
      assert.equal(hit.isAerialBonus, isAerial, '高炮破空标记异常');
      assert.equal(hit.damage, hit.isCrit ? Math.round(expectedDamage * critMultiplier) : expectedDamage,
        `${hit.time} 秒时高炮命中伤害异常`);
    }
  });
}
