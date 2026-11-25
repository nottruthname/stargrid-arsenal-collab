# 《铁血防线：1944》

**二战复古实体卡牌 × 钢铁要塞召唤海陆空对抗兽潮**（TapTap 竖屏 H5 肉鸽塔防，100% 纯中文离线可打包）。

## 核心特性
- **《KARDS》级复古军事卡牌桌面**：做旧羊皮纸作战沙盘、泛黄油画兵牌、红线电报连携与黄铜红漆军印；
- **海陆空协同守城战**：部署突击步兵排、马克沁重机枪、双联高射炮（1.5× 对空克制）、155毫米榴弹炮、喀秋莎火箭炮、重型主战坦克与俯冲轰炸机（穿甲空袭），点击战场可下达红漆“集火区”炮兵标尺；
- **纯本地零依赖**：原生 ES Modules + Canvas + WebAudio，打包后仅 ~330 KB。

## 常用开发与协同命令
```bash
# 运行核心契约单测（10 组）
node --test tests/contract.test.mjs

# 启动本地预览（默认 http://127.0.0.1:4171）
node server.mjs

# 打出 TapTap H5 离线包 (.zip)
node scripts/pack-taptap.mjs
```

## 双 AI（Antigravity × OpenAI GPT/Codex）协作说明
- 仓库已开放 GPT/Codex 参与 **UI 精修、二战复古生图、音效拟音与测试文档杂活**；
- 协作规范见 [`AGENTS.md`](AGENTS.md)，具体派活清单与网页端生图 Prompt 见 [`GPT_TASKS.md`](GPT_TASKS.md)。
