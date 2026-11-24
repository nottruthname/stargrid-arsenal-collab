# 《星匣乱斗：口袋军械库》(Stargrid Arsenal) 游戏策划案与数值规范

## 1. 游戏定位（面向 TapTap 独立休闲/轻策略玩家）
- **核心体验**：竖屏单手操作、`5×5` 多格背包整理 + 同星级二合一合成 + 相邻网格连携构筑 + 自动战斗肉鸽。
- **合规定位**：纯前端本地运算 + 零内购/零付费界面，可直接打包为 TapTap 免版号 H5 测试包。
- **核心循环**：整备阶段 (`prep`) 购买/摆放/旋转/合成装备 → 点击开战触发确定性战斗演算 (`simulateBattle` / `runWaveBattle`) → 第 `2 / 5 / 8` 波胜利进入遗物三选一 (`relic_draft`) → 共 10 波通关 (`victory`) 或 3 条命耗尽结束 (`gameover`)。

---

## 2. 状态数据结构 (`GameState`)
`createInitialState(seed = 20261124)` 必须返回确定性状态对象：
- `seed`: `number` (无符号 32 位整数)
- `rngState`: `number` (用于 Mulberry32 等确定性 PRNG)
- `nextInstanceSeq`: `number`（初始为 `2`，因初始短匕占用 `'item_1'`）
- `wave`: `1`（范围 `1..10`）
- `phase`: `'prep' | 'relic_draft' | 'victory' | 'gameover'`
- `gold`: `INITIAL_GOLD` (`12`)
- `lives`: `INITIAL_LIVES` (`3`)
- `playerMaxHp`: `PLAYER_BASE_MAX_HP` (`100`)
- `refreshCountThisWave`: `0`
- `refreshCost`: `BASE_REFRESH_COST` (`2`)
- `placedItems`: 初始仅 1 件 `{ instanceId: 'item_1', itemId: 'plasma_dagger', level: 1, row: 2, col: 2, rotation: 0, investedGold: 3 }`
- `stashItems`: `[]`（最多 `MAX_STASH_SLOTS = 6` 件，结构 `{ instanceId, itemId, level, rotation, investedGold }`）
- `shopOffers`: 长度 `SHOP_SLOTS = 3`，每项 `{ slotIndex, itemId, cost, sold, locked }`
- `relics`: `[]`（已获得遗物 ID 数组）
- `pendingRelicChoices`: `[]`（`relic_draft` 阶段提供至多 3 个未拥有遗物 ID）
- `lastBattleReport`: `null | BattleReport`

---

## 3. 空间几何、旋转与放置校验
### 3.1 `getOccupiedCells(itemId, row, col, rotation = 0)`
1. 将 `rotation` 归一化到 `{ 0, 90, 180, 270 }`（支持负数如 `-90` → `270`）。
2. 对 `ITEM_CATALOG[itemId].baseCells` 中的每个 `[r, c]` 执行顺时针 90° 旋转 `(r, c) -> (c, -r)` 共 `rotation / 90` 次。
3. 找出所有旋转后坐标的 `minR` 与 `minC`，令每格平移 `(r - minR, c - minC)` 归一化回左上 `[0, 0]` 锚点。
4. 加上 `(row, col)` 后按 `[r, c]` 升序排列返回 `[[r, c], ...]`。

### 3.2 `validatePlacement(state, { itemId, level = 1, row, col, rotation = 0, ignoreInstanceId = null })`
- 若任一格子越出 `0 <= r < 5 && 0 <= c < 5`：返回 `{ valid: false, reason: 'out_of_bounds', occupiedCells, overlappingInstanceIds: [], mergeTargetInstanceId: null }`。
- 统计除 `ignoreInstanceId` 之外被碰到的已有装备唯一 ID 数组 `overlappingInstanceIds`：
  - 数量为 `0` → `{ valid: true, reason: 'ok', ..., mergeTargetInstanceId: null }`
  - 数量为 `1` 且该目标装备满足 `target.itemId === itemId && target.level === level && target.level < 3` → `{ valid: true, reason: 'merge', ..., mergeTargetInstanceId: target.instanceId }`
  - 其他情况 → `{ valid: false, reason: 'overlap', ..., mergeTargetInstanceId: null }`

### 3.3 旋转避让 (`rotateItem(state, instanceId)`)
- 在暂存舱中：直接将 `rotation` 顺时针加 `90`（模 `360`）。
- 在网格中：`newRot = (rotation + 90) % 360`，依次尝试微调偏移 `[dr, dc]`：
  `[[0,0], [0,-1], [-1,0], [0,1], [1,0], [-1,-1], [1,-1], [-1,1], [1,1], [0,-2], [-2,0]]`
  必须找到首个满足 `validation.valid && !validation.mergeTargetInstanceId` 的位置（旋转绝不能误触合成）；找不到则抛出异常。

---

## 4. 商店、暂存舱与经济规则
- **购买 (`buyShopItem(state, slotIndex, placement)`)**：
  - 需处于 `prep` 阶段、槽位未售且 `gold >= offer.cost`。
  - 若 `placement` 提供 `{ row, col, rotation }` 且 `placement.toGrid !== false`：校验网格放置或直接叠放合成（`level + 1`、`investedGold += offer.cost`）。
  - 否则放入 `stashItems`（上限 `6`）。
- **移动与合成 (`placeOrMoveItem`)**：
  - 支持网格→网格、暂存舱→网格（含合成）、网格→暂存舱、暂存舱→暂存舱内合成（通过 `targetStashInstanceId` 指定）。
- **出售 (`sellItem`)**：返还 `Math.ceil(item.investedGold * 0.6)` 金币。
- **锁定 (`toggleLockShopSlot`) 与刷新 (`refreshShop`)**：
  - 刷新扣减 `refreshCost`，保留 `locked && !sold` 的槽位，其余重抽；随后 `refreshCountThisWave += 1`，`refreshCost = 2 + Math.floor(refreshCountThisWave / 2)`。

---

## 5. 网格正交连携规则 (`computeGridSynergies`)
- **相邻去重规则**：两件不同装备只要有任意格子满足 `|r1 - r2| + |c1 - c2| === 1`，即互为相邻，**无论贴合几条边，每对装备仅计为相邻 1 次**。
- **基础星级倍率**：`LEVEL_MULTIPLIERS = { 1: 1.0, 2: 1.8, 3: 3.0 }`。
- **装备独立与连携公式**：
  1. `chrono_battery`（时序电池）：使所有相邻主动装备（`cooldownSec > 0`）冷却速度加快 `+25% / +45% / +70%`（按晶核星级 1/2/3），多个电池加法叠加为 `speedFactor = 1 + sum`。
  2. `plasma_dagger`（等离子短匕）：每相邻 1 件【武器】，额外乘以 `Math.max(0.45, 1 - 0.12 * adjWeapons.length)`。最终主动冷却：`effectiveCooldownSec = Number(Math.max(0.45, (def.cooldownSec / speedFactor) * daggerFactor).toFixed(2))`。
  3. `rail_rifle`（磁轨狙击枪）：每相邻 1 颗【晶核】，基础伤害 `+6`（乘星级后叠加），且暴击率 `+20%`（上限 `0.95`）。
  4. `solar_core`（耀斑晶核）：使相邻【武器】伤害提升 `+35% / +60% / +95%`（加法叠加后 `Math.round(dmg * (1 + solarBonus))`），且命中附加 `burnOnHit = adjSolarCores.length` 层【灼烧】。
  5. `arc_launcher`（电弧发射器）：基础附加 `2` 层【感电】，每相邻 1 颗【晶核】或【极寒重甲】额外 `+1` 层（`shockOnHit = 2 + adjCores.length + adjCryoPlates.length`）。
  6. `aegis_buckler`（宙斯盾牌）：基础护盾乘星级后，每相邻 1 件【武器】或【护盾】额外 `+4` 护盾。
  7. `cryo_plate`（极寒重甲）：自身每次触发施加 `1` 层【霜缓】（`chillOnTrigger = 1`），并使所有相邻【护盾】最终护盾量乘以 `(1 + 0.25 * adjCryoPlates.length)` 并 `Math.round`。
  8. `nano_medkit`（纳米急救仓）：基础治疗乘星级后，每相邻 1 颗【晶核】额外 `+5`（溢出治疗的 `50%` 向下取整转化为护盾）。

---

## 6. 战斗模拟与波次推进 (`simulateBattle`, `runWaveBattle`, `chooseRelic`)
- **离散时间步长**：`BATTLE_TICK_SEC = 0.1s`，上限 `MAX_BATTLE_SEC = 35.0s`。
- **遗物效果**：
  - `overclock_chip`: 前 `4.0s` 内玩家所有主动装备冷却进度积累速度 `× 1.35`。
  - `vampiric_coil`: 武器每次直接命中造成 `hitDmg > 0` 伤害时，恢复 `Math.max(1, Math.round(hitDmg * 0.12))` 生命。
  - `titanium_hull`: 选择该遗物时立即 `playerMaxHp += 35`，且每场战斗开局 `playerStartShield = 25`。
  - `compound_interest`: 胜利结算时，额外获得 `Math.min(5, Math.floor(gold / 5))` 金币利息。
  - `high_voltage`: 每层【感电】令武器命中额外伤害由 `+1` 提升至 `+2`。
- **异常状态与加时赛**：
  - `灼烧 (burn)`: 每 `1.0s` 造成 `enemyBurn * 3` 伤害（先扣护盾再扣血）。
  - `感电 (shock)`: 每次武器直接命中额外附加 `enemyShock * (high_voltage ? 2 : 1)` 伤害；每 `2.0s` 衰减 `1` 层。
  - `霜缓 (chill)`: 每层令敌方攻击冷却积累变慢 `15%`（最高减速 `45%`）。
  - `星渊风暴 (overtime_storm)`: `t >= 18.0s` 起每 `1.0s` 对双方同时造成 `2 + Math.floor((t - 18.0) * 1.5)` 伤害。
- **波次与结局**：
  - 第 `2 / 5 / 8` 波胜利进入 `'relic_draft'`，提供至多 3 个未拥有遗物；第 `10` 波胜利进入 `'victory'`；战败扣 `1` 命并给予 `Math.max(4, Math.floor(baseRewardGold * 0.6))` 安慰金币，若 `lives <= 0` 进入 `'gameover'`。
