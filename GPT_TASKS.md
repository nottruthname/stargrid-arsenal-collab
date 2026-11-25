# GPT / Codex 全能协作任务单（UI 精修 · 美术生图 · 音效与杂活）

> 对应的本地自动化共享黑板位置：`W:\TapTap-Game-Lab\collab-board\board.json`

---

## 第一类：交给 ChatGPT 网页版的高精度二战油画生图（对应黑板 `T-01`）

将下面 5 条 Prompt 依次发给 ChatGPT（DALL·E / GPT-4o 图像生成）生成大图后，按对应文件名丢进 **`W:\TapTap-Game-Lab\collab-board\gpt-art-inbox\`**，然后运行 **`node W:\TapTap-Game-Lab\collab-board\import-gpt-art.mjs`**，系统会自动裁切分割黑边、压缩适配分辨率、替换 A/B 两组并重打出 `.zip`！

1. **保存为 `ww2_cover.png`（竖版 9:16 封面海报）**
   > `1940s vintage WWII oil painting propaganda game poster, vertical 9:16, no text, no letters, no watermark. Foreground: weathered concrete bunker trench with sandbags, twin heavy machine gun blazing orange muzzle blast, rugged olive-green WWII heavy tank firing artillery shell. Midground sky: three WWII propeller dive bombers swooping through black anti-aircraft flak clouds. Distant wasteland ridge: charging dark horde of giant mutated beasts (mammoth monster, dire wolves) rushing through mud craters and barbed wire. Rich painterly brushstrokes, olive drab, ochre parchment dust, crimson fire, moody dark vignette at top 25% and bottom 25%.`
2. **保存为 `ww2_battlefield.png`（竖版 9:16 正俯视战地底图）**
   > `Strictly orthographic 90-degree top-down 2D tactical wargame battlefield terrain texture, vertical 9:16, no text, no vehicles, no soldiers, no characters. Churning muddy WWII no-man's-land earth with organic artillery shell craters, shallow water puddles, curved tank track ruts, leading down to a concrete bunker wall apron along the bottom 15%. Earthy muted khaki, taupe mud, charcoal scorch marks, hand-painted realistic military wargame mat look.`
3. **保存为 `sheet_a.png`（2×2 四宫格卡面集 A）**
   > `A clean 2x2 grid sprite sheet of four separate 1940s vintage WWII military oil paintings in KARDS trading card art style, thin black dividing lines, NO text, NO letters, NO borders inside cells. Top-left: WWII assault infantry squad charging over sandbags firing rifles. Top-right: sandbag machine-gun pit with water-cooled Maxim heavy machine gun blasting orange tracers. Bottom-left: twin-barrel anti-aircraft flak cannon firing skyward with distant dark flak puffs. Bottom-right: heavy towed 155mm field howitzer firing giant orange muzzle blast.`
4. **保存为 `sheet_b.png`（2×2 四宫格卡面集 B）**
   > `A clean 2x2 grid sprite sheet of four separate 1940s vintage WWII military oil paintings in KARDS trading card art style, thin black dividing lines, NO text, NO letters. Top-left: Katyusha multiple rocket launcher 6x6 truck firing blazing fiery rockets with thick white smoke trails. Top-right: rugged olive-green WWII heavy tank firing cannon across muddy ridge. Bottom-left: three WWII propeller dive bombers swooping down dropping bombs through flak smoke. Bottom-right: sloped reinforced concrete pillbox bunker with firing slit, sandbags and barbed wire.`
5. **保存为 `sheet_c.png`（1×2 左右双拼卡面集 C）**
   > `A clean 1x2 horizontal split of two separate 1940s vintage WWII military oil paintings in KARDS card art style, thin black dividing line in middle, NO text, NO letters. Left half: camouflaged field ammunition depot with stacked wooden shell crates, brass artillery shells and supply truck. Right half: warm tungsten lamp-lit wartime command tent wooden table with vintage vacuum-tube military radio, antenna and parchment tactical map.`

---

## 第二类：交给本地 Codex CLI 或云端 Codex PR 的工程杂活与 UI 精修

如果在本机通过 `node W:\TapTap-Game-Lab\collab-board\dispatch-to-gpt.mjs run T-02`（或直接在 GitHub 仓库派给云端 Codex）：

- **T-02｜UI 复古纸牌质感精修（`src/frontend/styles.css`、`src/frontend/main.mjs`）**
  - 为羊皮纸作战沙盘、实体兵牌边缘补充做旧折痕/纹理感与悬停微抬起手感；
  - 为战报结算弹窗加入红漆圆形军邮印章角标（“胜捷”/“失守”）；
  - 严守 100% 纯中文与微圆角无霓虹风格。
- **T-03｜二战战地拟音升级 & TapTap 上架文稿杂活（`src/frontend/sfx.mjs`、`TAPTAP_STORE.md`）**
  - 纯 WebAudio 升级白噪声低通滤波的火炮爆炸、重机枪连射与防空炮轰鸣音效，兼容原有调用签名；
  - 编写 TapTap 商店页上架简介、卖点与更新日志到 `TAPTAP_STORE.md`。
- **T-04｜10 波多流派平衡性与经济曲线测试（`tests/balance.test.mjs`）**
  - 新增 `tests/balance.test.mjs` 自动压测步兵海、重炮灼烧、防空破空、重坦铁壁 4 套阵容通关波次曲线。
