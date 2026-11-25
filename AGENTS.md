# AGENTS.md — 《铁血防线：1944》双 AI 全栈协同工作室守则

- **项目定位**：基于《KARDS》级二战复古实体卡牌美学 + 钢铁基地召唤海陆空对抗变异兽潮的 TapTap 竖屏 H5 肉鸽塔防游戏。
- **双 AI 全能协作分工（现已完全开放 UI / 生图 / 杂活给 GPT 与 Codex）**：
  - **Google Antigravity**：总策划、前后端核心协议制定、沙盘与战斗主引擎维护、自动验收与 TapTap 打包发布。
  - **OpenAI GPT / Codex（含网页版生图 + 本地/云端 Codex）**：全面负责 **UI 视觉精修（`src/frontend/styles.css`、`src/frontend/main.mjs`）、二战油画生图（`src/frontend/assets/*`）、战地拟音（`src/frontend/sfx.mjs`）、数值压测与上架文档杂活（`tests/*.test.mjs`、`TAPTAP_STORE.md`）**。
- **所有协同成员必须严格遵守的 4 条红线**：
  1. **100% 纯中文化**：所有玩家可见页面、按钮、提示条、标题、图鉴、战斗跳字与战报严禁出现英文单词或字母缩写，也不使用 Emoji。
  2. **彻底去 AI 霓虹锐角风**：保持“暖橄榄军绿指挥桌 + 做旧羊皮纸作战地图 + 黄铜边框 + 红漆印章 + 自然微圆角纸牌”视觉统一，禁止引入 `clip-path` 装饰性尖角和赛博青紫霓虹发光。
  3. **零外部 CDN 依赖**：全部代码、字体回退、图床图片（压缩 `.jpg`）与 WebAudio 音效均须纯本地离线可运行，禁止添加 `node_modules` 进打包目录。
  4. **提交前必跑检验**：
     * 所有改动 `.mjs` 必须通过 `node --check`；
     * `node --test tests/contract.test.mjs` 必须 **10 / 10 全部通过**。
- **任务认领清单**：请直接查看 [`GPT_TASKS.md`](GPT_TASKS.md) 与本地共享黑板 `W:\TapTap-Game-Lab\collab-board\board.json`。
