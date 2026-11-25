/**
 * 《铁血防线：1944》复古二战卡牌视觉与军械徽章库（100% 纯中文化）
 * - 零 Emoji、零英文界面字符、零赛博霓虹
 * - 映射 10 张复古二战军事油画卡面与 6 枚战区军令勋章
 * - 精确处理 1×1 / 1×2 / 2×1 / 1×3 / 2×2 / L型 多格实体卡牌沙盘裁切
 */

export const UNIT_SHORT_NAMES = Object.freeze({
  infantry_squad: '步兵排',
  heavy_mg: '重机枪',
  flak_cannon: '高射炮',
  howitzer_155: '155榴炮',
  katyusha_mlrs: '喀秋莎',
  heavy_tank: '重坦克',
  dive_bomber: '轰炸机',
  concrete_bunker: '铁碉堡',
  ammo_depot: '弹药库',
  command_radio: '指挥电台',
});

export function getUnitArtUrl(itemId) {
  return `./src/frontend/assets/card_${itemId}.jpg`;
}

export function uiIcon(name, size = 14) {
  const s = `width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"`;
  switch (name) {
    case 'credits':
      return `<svg ${s}><circle cx="12" cy="12" r="9" fill="rgba(180,83,9,0.2)"/><circle cx="12" cy="12" r="5"/><path d="M12 7V17M9.5 9.5H14.5"/></svg>`;
    case 'integrity':
      return `<svg ${s}><path d="M12 3L20 6V12.5C20 17.2 16.5 20.5 12 22C7.5 20.5 4 17.2 4 12.5V6L12 3Z" fill="currentColor" stroke="none"/></svg>`;
    case 'shield':
      return `<svg ${s}><path d="M12 3L20 6V12.5C20 17.2 16.5 20.5 12 22C7.5 20.5 4 17.2 4 12.5V6L12 3Z"/><path d="M12 7V16M8.5 11.5H15.5"/></svg>`;
    case 'bolt':
      return `<svg ${s}><path d="M8 6L12 3L16 6V12L12 15L8 12V6Z" fill="rgba(180,83,9,0.22)"/><path d="M6 19H18M9 15V19M15 15V19"/></svg>`;
    case 'dps':
      return `<svg ${s}><circle cx="12" cy="12" r="8"/><path d="M12 2V6M12 18V22M2 12H6M18 12H22"/><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/></svg>`;
    case 'lock':
      return `<svg ${s}><rect x="5" y="11" width="14" height="10" rx="2" fill="rgba(180,83,9,0.2)"/><path d="M8 11V7A4 4 0 0 1 16 7V11"/></svg>`;
    case 'unlock':
      return `<svg ${s}><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7A4 4 0 0 1 15.5 5"/></svg>`;
    case 'rotate':
      return `<svg ${s}><path d="M20 12A8 8 0 1 1 17.6 6.3"/><polyline points="20 4 20 9 15 9"/></svg>`;
    case 'refresh':
      return `<svg ${s}><path d="M3 12A9 9 0 0 1 19 6.5"/><polyline points="21 3 21 8 16 8"/><path d="M21 12A9 9 0 0 1 5 17.5"/><polyline points="3 21 3 16 8 16"/></svg>`;
    case 'codex':
      return `<svg ${s}><rect x="4" y="4" width="16" height="16" rx="2" fill="rgba(161,98,7,0.16)"/><path d="M9 4V20M12 9H17M12 13H17"/></svg>`;
    case 'audioOn':
      return `<svg ${s}><polygon points="4,9 9,9 14,4 14,20 9,15 4,15" fill="currentColor" stroke="none"/><path d="M17.5 8.5A5 5 0 0 1 17.5 15.5M20 6A8.5 8.5 0 0 1 20 18"/></svg>`;
    case 'audioOff':
      return `<svg ${s}><polygon points="4,9 9,9 14,4 14,20 9,15 4,15" fill="currentColor" stroke="none"/><path d="M17 9L21 15M21 9L17 15"/></svg>`;
    case 'reset':
      return `<svg ${s}><polyline points="3 6 3 11 8 11"/><path d="M4 15A8 8 0 1 0 6.5 6.8L3.5 11"/></svg>`;
    case 'engage':
      return `<svg ${s}><polygon points="6,4 19,12 6,20" fill="currentColor" stroke="none"/></svg>`;
    case 'skull':
      return `<svg ${s}><path d="M12 4L21 19H3L12 4Z" fill="rgba(153,27,27,0.22)"/><path d="M12 10V14"/><circle cx="12" cy="17" r="1" fill="currentColor" stroke="none"/></svg>`;
    case 'trophy':
      return `<svg ${s}><circle cx="12" cy="9" r="5" fill="rgba(217,119,6,0.24)"/><path d="M9 13.5L7 21L12 18.5L17 21L15 13.5"/></svg>`;
    case 'stash':
      return `<svg ${s}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10H21M10 14H14"/></svg>`;
    case 'target':
      return `<svg ${s}><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/></svg>`;
    default:
      return `<svg ${s}><rect x="4" y="4" width="16" height="16" rx="2"/></svg>`;
  }
}

export function getItemSvg(itemId, size = 48) {
  const url = getUnitArtUrl(itemId);
  const w = Math.round(size * 1.32);
  const h = Math.round(size);
  return `<div class="unit-thumb-frame" style="width:${w}px;height:${h}px;">
    <img src="${url}" alt="" class="unit-thumb-img" loading="eager" />
  </div>`;
}

export function getLShapeClipCss(itemId, rotation = 0) {
  if (itemId !== 'howitzer_155') return '';
  const steps = ((Math.round(rotation / 90) % 4) + 4) % 4;
  // baseCells [[0,0],[1,0],[1,1]] -> rot 0 缺右上, rot 90 缺右下, rot 180 缺左下, rot 270 缺左上
  if (steps === 0) return 'clip-path: polygon(0 0, 50% 0, 50% 50%, 100% 50%, 100% 100%, 0 100%);';
  if (steps === 1) return 'clip-path: polygon(0 0, 100% 0, 100% 50%, 50% 50%, 50% 100%, 0 100%);';
  if (steps === 2) return 'clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 100%, 50% 50%, 0 50%);';
  return 'clip-path: polygon(50% 0, 100% 0, 100% 100%, 0 100%, 0 50%, 50% 50%);';
}

export function getPlacedItemVisualHtml(itemId, rows, cols, rotation = 0) {
  const url = getUnitArtUrl(itemId);
  const shortName = UNIT_SHORT_NAMES[itemId] || '';
  const isCompact = rows === 1 && cols === 1;
  const clipStyle = getLShapeClipCss(itemId, rotation);
  const isVertical = rows > cols;

  // 对 L 型火炮，把图文框定在实心角格/横条上避免压到缺口
  const steps = ((Math.round(rotation / 90) % 4) + 4) % 4;
  let badgePosClass = 'pos-bottom';
  if (itemId === 'howitzer_155' && (steps === 2 || steps === 1)) {
    badgePosClass = 'pos-top';
  }

  return `
    <div class="piece-card-art ${isCompact ? 'compact' : ''} ${isVertical ? 'vertical' : ''}" style="${clipStyle}">
      <img src="${url}" alt="" class="piece-card-photo" />
      <div class="piece-card-vignette"></div>
      <span class="piece-name-tag ${badgePosClass}">${shortName}</span>
    </div>
  `;
}

export function getRelicSvg(relicId, size = 34) {
  const attrs = `width="${size}" height="${size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"`;
  switch (relicId) {
    case 'blitz_mobilization':
      return `<svg ${attrs}><circle cx="24" cy="24" r="18" fill="#78350f" stroke="#fbbf24" stroke-width="2.4"/><polygon points="26,11 16,25 23,25 20,37 32,22 25,22" fill="#fef3c7"/></svg>`;
    case 'armor_piercing_ammo':
      return `<svg ${attrs}><circle cx="24" cy="24" r="18" fill="#7f1d1d" stroke="#fca5a5" stroke-width="2.4"/><path d="M18 34V18L24 10L30 18V34H18Z" fill="#fde68a" stroke="#450a0a" stroke-width="1.5"/><line x1="18" y1="24" x2="30" y2="24" stroke="#b91c1c" stroke-width="2"/></svg>`;
    case 'bastion_fortification':
      return `<svg ${attrs}><path d="M24 6L40 12V25C40 33.5 33 39.5 24 43C15 39.5 8 33.5 8 25V12L24 6Z" fill="#44403c" stroke="#d6d3d1" stroke-width="2.4"/><rect x="16" y="19" width="16" height="10" rx="1" fill="#d6d3d1"/><line x1="19" y1="24" x2="29" y2="24" stroke="#1c1917" stroke-width="2.6"/></svg>`;
    case 'wartime_bonds':
      return `<svg ${attrs}><circle cx="24" cy="24" r="18" fill="#713f12" stroke="#fde047" stroke-width="2.4"/><circle cx="24" cy="24" r="11" stroke="#fef08a" stroke-width="1.5" stroke-dasharray="3 2"/><polygon points="24,14 26.8,20.4 33.6,21 28.4,25.6 30,32.4 24,28.8 18,32.4 19.6,25.6 14.4,21 21.2,20.4" fill="#fef08a"/></svg>`;
    case 'frontline_triage':
      return `<svg ${attrs}><circle cx="24" cy="24" r="18" fill="#365314" stroke="#bef264" stroke-width="2.4"/><path d="M24 13V35M13 24H35" stroke="#fef2f2" stroke-width="6" stroke-linecap="round"/><path d="M24 15V33M15 24H33" stroke="#dc2626" stroke-width="2.4" stroke-linecap="round"/></svg>`;
    case 'aerial_supremacy':
      return `<svg ${attrs}><circle cx="24" cy="24" r="18" fill="#1e3a5f" stroke="#93c5fd" stroke-width="2.4"/><polygon points="24,10 28,22 39,26 28,29 26,37 24,33 22,37 20,29 9,26 20,22" fill="#e0f2fe"/></svg>`;
    default:
      return `<svg ${attrs}><circle cx="24" cy="24" r="16" stroke="#d6d3d1" stroke-width="2"/></svg>`;
  }
}

export function renderStars(level) {
  const count = Math.max(1, Math.min(3, level || 1));
  const labels = ['', '一星', '二星', '三星'];
  const fill = count >= 3 ? '#fbbf24' : count === 2 ? '#e2e8f0' : '#d97706';
  const stroke = count >= 3 ? '#78350f' : count === 2 ? '#334155' : '#451a03';
  const pip = `<svg width="10" height="10" viewBox="0 0 12 12" fill="${fill}" stroke="${stroke}" stroke-width="1"><polygon points="6,0.7 7.6,4.2 11.5,4.7 8.6,7.3 9.4,11.2 6,9.2 2.6,11.2 3.4,7.3 0.5,4.7 4.4,4.2"/></svg>`;
  return `<span class="star-pips" aria-label="${labels[count]}">${pip.repeat(count)}</span>`;
}

export function getShapeLayout(baseCells, rotation = 0) {
  const steps = ((Math.round(rotation / 90) % 4) + 4) % 4;
  const rotated = baseCells.map(([br, bc]) => {
    let r = br;
    let c = bc;
    for (let i = 0; i < steps; i++) {
      const nr = c;
      const nc = -r;
      r = nr;
      c = nc;
    }
    return [r, c];
  });
  let minR = Infinity;
  let minC = Infinity;
  let maxR = -Infinity;
  let maxC = -Infinity;
  for (const [r, c] of rotated) {
    if (r < minR) minR = r;
    if (c < minC) minC = c;
    if (r > maxR) maxR = r;
    if (c > maxC) maxC = c;
  }
  const cells = rotated.map(([r, c]) => [r - minR, c - minC]);
  return {
    rows: maxR - minR + 1,
    cols: maxC - minC + 1,
    cells,
  };
}

export function getMiniShapeSvg(baseCells, rotation = 0, color = '#8c5a32') {
  const { rows, cols, cells } = getShapeLayout(baseCells, rotation);
  const cellSize = 6;
  const gap = 1.5;
  const w = cols * cellSize + (cols - 1) * gap + 2;
  const h = rows * cellSize + (rows - 1) * gap + 2;
  const rects = cells
    .map(([r, c]) => {
      const x = 1 + c * (cellSize + gap);
      const y = 1 + r * (cellSize + gap);
      return `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="1.2" fill="${color}" stroke="#292218" stroke-width="0.9"/>`;
    })
    .join('');
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none">${rects}</svg>`;
}
