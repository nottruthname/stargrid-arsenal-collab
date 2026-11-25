/**
 * 《星匣：深渊防线》v3.0 暗黑工业战术矢量美术库
 * - 零 Emoji：所有 HUD、按钮、状态标志均为锋利战术矢量 SVG
 * - 军工级暗色钛金武器/护盾/反应堆模块插画
 */

export function uiIcon(name, size = 14) {
  const s = `width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"`;
  switch (name) {
    case 'credits':
      return `<svg ${s}><polygon points="12,2 21,7 21,17 12,22 3,17 3,7"/><circle cx="12" cy="12" r="3.5" fill="currentColor" stroke="none"/></svg>`;
    case 'integrity':
      return `<svg ${s}><polygon points="12,21 4,13 4,7 8,4 12,8 16,4 20,7 20,13" fill="currentColor" stroke="none"/></svg>`;
    case 'shield':
      return `<svg ${s}><path d="M12 2L20 5V12C20 17 16.5 20.5 12 22C7.5 20.5 4 17 4 12V5L12 2Z"/></svg>`;
    case 'bolt':
      return `<svg ${s}><polygon points="13,2 4,14 11,14 10,22 20,10 13,10" fill="currentColor" stroke="none"/></svg>`;
    case 'dps':
      return `<svg ${s}><circle cx="12" cy="12" r="8"/><path d="M12 2V6M12 18V22M2 12H6M18 12H22"/><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/></svg>`;
    case 'lock':
      return `<svg ${s}><rect x="5" y="11" width="14" height="10" rx="1"/><path d="M8 11V7A4 4 0 0 1 16 7V11"/></svg>`;
    case 'unlock':
      return `<svg ${s}><rect x="5" y="11" width="14" height="10" rx="1"/><path d="M8 11V7A4 4 0 0 1 15.5 5"/></svg>`;
    case 'rotate':
      return `<svg ${s}><path d="M21 12A9 9 0 1 1 18.3 5.7"/><polyline points="21 3 21 9 15 9"/></svg>`;
    case 'refresh':
      return `<svg ${s}><path d="M3 12A9 9 0 0 1 19 6.5"/><polyline points="21 3 21 8 16 8"/><path d="M21 12A9 9 0 0 1 5 17.5"/><polyline points="3 21 3 16 8 16"/></svg>`;
    case 'codex':
      return `<svg ${s}><path d="M4 4H10L12 6L14 4H20V20H14L12 18L10 20H4V4Z"/><path d="M12 6V18"/></svg>`;
    case 'audioOn':
      return `<svg ${s}><polygon points="4,9 9,9 14,4 14,20 9,15 4,15" fill="currentColor" stroke="none"/><path d="M17.5 8.5A5 5 0 0 1 17.5 15.5M20 6A8.5 8.5 0 0 1 20 18"/></svg>`;
    case 'audioOff':
      return `<svg ${s}><polygon points="4,9 9,9 14,4 14,20 9,15 4,15" fill="currentColor" stroke="none"/><path d="M17 9L22 15M22 9L17 15"/></svg>`;
    case 'reset':
      return `<svg ${s}><polyline points="3 6 3 11 8 11"/><path d="M3.5 15A8.5 8.5 0 1 0 6 6.7L3 11"/></svg>`;
    case 'engage':
      return `<svg ${s}><polygon points="5,3 19,12 5,21" fill="currentColor" stroke="none"/></svg>`;
    case 'skull':
      return `<svg ${s}><path d="M12 3C7 3 4 6.5 4 11C4 13.8 5.4 16 7 17V20H17V17C18.6 16 20 13.8 20 11C20 6.5 17 3 12 3Z"/><circle cx="9" cy="11" r="1.5" fill="currentColor" stroke="none"/><circle cx="15" cy="11" r="1.5" fill="currentColor" stroke="none"/></svg>`;
    case 'trophy':
      return `<svg ${s}><path d="M6 4H18V10C18 13.3 15.3 16 12 16C8.7 16 6 13.3 6 10V4Z"/><path d="M6 6H3V9C3 11 4.5 12 6 12M18 6H21V9C21 11 19.5 12 18 12M12 16V20M8 20H16"/></svg>`;
    case 'stash':
      return `<svg ${s}><rect x="3" y="4" width="18" height="16"/><path d="M3 10H21M9 14H15"/></svg>`;
    case 'target':
      return `<svg ${s}><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/></svg>`;
    default:
      return `<svg ${s}><rect x="4" y="4" width="16" height="16"/></svg>`;
  }
}

export function getItemSvg(itemId, size = 48) {
  const attrs = `width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"`;
  switch (itemId) {
    case 'plasma_dagger':
      return `<svg ${attrs}>
        <defs>
          <linearGradient id="t-pd-blade" x1="16" y1="48" x2="56" y2="8" gradientUnits="userSpaceOnUse">
            <stop offset="0" stop-color="#075985"/><stop offset="0.6" stop-color="#0ea5e9"/><stop offset="1" stop-color="#bae6fd"/>
          </linearGradient>
        </defs>
        <path d="M55 8L37 16L24 29L33 38L46 25L55 8Z" fill="url(#t-pd-blade)" stroke="#050811" stroke-width="2.4" stroke-linejoin="miter"/>
        <path d="M51 12L30 33" stroke="#e0f2fe" stroke-width="1.6"/>
        <path d="M19 25L39 45L35 48L16 29L19 25Z" fill="#64748b" stroke="#050811" stroke-width="2"/>
        <path d="M22 36L28 42L15 55L9 49L22 36Z" fill="#1e293b" stroke="#050811" stroke-width="2.2"/>
        <rect x="26" y="32" width="5" height="5" transform="rotate(45 28.5 34.5)" fill="#38bdf8"/>
      </svg>`;

    case 'rail_rifle':
      return `<svg ${attrs}>
        <defs>
          <linearGradient id="t-rr-metal" x1="4" y1="20" x2="58" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0" stop-color="#1e293b"/><stop offset="0.55" stop-color="#334155"/><stop offset="1" stop-color="#475569"/>
          </linearGradient>
        </defs>
        <path d="M5 27L11 21H27L31 19H56V25H34V28H59V34H34L30 38H20L17 48H10L13 38H5V27Z" fill="url(#t-rr-metal)" stroke="#050811" stroke-width="2.4" stroke-linejoin="miter"/>
        <rect x="21" y="23.5" width="34" height="2.6" fill="#818cf8"/>
        <rect x="23" y="29.5" width="29" height="2.4" fill="#6366f1"/>
        <rect x="17" y="15.5" width="12" height="4" fill="#0f172a" stroke="#94a3b8" stroke-width="1.5"/>
        <rect x="33" y="22" width="3" height="11" fill="#0f172a"/>
        <rect x="41" y="22" width="3" height="11" fill="#0f172a"/>
        <rect x="55" y="26.5" width="5" height="4" fill="#c7d2fe"/>
      </svg>`;

    case 'arc_launcher':
      return `<svg ${attrs}>
        <path d="M10 10H29V34H54V52H10V10Z" fill="#1e293b" stroke="#050811" stroke-width="2.6" stroke-linejoin="miter"/>
        <path d="M14 14H25V38H50V48H14V14Z" fill="#3b0764" stroke="#a855f7" stroke-width="1.4"/>
        <polygon points="48,12 56,20 48,28 40,20" fill="#581c87" stroke="#050811" stroke-width="2.2"/>
        <polygon points="48,16 52,20 48,24 44,20" fill="#f0abfc"/>
        <polyline points="20,18 24,28 19,35 34,43 45,25" stroke="#e879f9" stroke-width="2.6" stroke-linecap="square" stroke-linejoin="miter"/>
        <rect x="17" y="41" width="5" height="5" fill="#c084fc"/>
      </svg>`;

    case 'aegis_buckler':
      return `<svg ${attrs}>
        <path d="M32 5L53 13V32L43 51L32 59L21 51L11 32V13L32 5Z" fill="#475569" stroke="#050811" stroke-width="2.6" stroke-linejoin="miter"/>
        <path d="M32 10L48 16V31L40 47L32 53L24 47L16 31V16L32 10Z" fill="#1e293b" stroke="#f59e0b" stroke-width="2"/>
        <path d="M32 15V47M20 28H44" stroke="#fbbf24" stroke-width="3.2"/>
        <polygon points="32,22 38,28 32,34 26,28" fill="#fde047" stroke="#050811" stroke-width="1.8"/>
      </svg>`;

    case 'cryo_plate':
      return `<svg ${attrs}>
        <polygon points="14,8 50,8 56,20 56,48 44,56 20,56 8,48 8,20" fill="#1e293b" stroke="#050811" stroke-width="2.6" stroke-linejoin="miter"/>
        <polygon points="18,13 46,13 51,22 51,44 41,51 23,51 13,44 13,22" fill="#0f766e" fill-opacity="0.45" stroke="#2dd4bf" stroke-width="1.6"/>
        <path d="M32 16V48M16 32H48M21 21L43 43M43 21L21 43" stroke="#99f6e4" stroke-width="2.2"/>
        <polygon points="32,21 43,32 32,43 21,32" fill="#5eead4" stroke="#050811" stroke-width="2"/>
        <rect x="16" y="16" width="3" height="3" fill="#94a3b8"/>
        <rect x="45" y="16" width="3" height="3" fill="#94a3b8"/>
      </svg>`;

    case 'solar_core':
      return `<svg ${attrs}>
        <polygon points="32,4 40,14 54,10 50,24 60,32 50,40 54,54 40,50 32,60 24,50 10,54 14,40 4,32 14,24 10,10 24,14" fill="#334155" stroke="#050811" stroke-width="2.2"/>
        <polygon points="32,12 46,20 46,44 32,52 18,44 18,20" fill="#881337" stroke="#fb7185" stroke-width="2"/>
        <circle cx="32" cy="32" r="9" fill="#f43f5e"/>
        <circle cx="32" cy="32" r="4.5" fill="#fff1f2"/>
      </svg>`;

    case 'chrono_battery':
      return `<svg ${attrs}>
        <rect x="6" y="17" width="48" height="30" fill="#1e293b" stroke="#050811" stroke-width="2.6"/>
        <rect x="54" y="24" width="6" height="16" fill="#34d399" stroke="#050811" stroke-width="2"/>
        <rect x="10" y="21" width="9" height="22" fill="#10b981"/>
        <rect x="22" y="21" width="9" height="22" fill="#064e3b" stroke="#34d399" stroke-width="1"/>
        <rect x="41" y="21" width="9" height="22" fill="#10b981"/>
        <polygon points="34,21 26,33 32,33 29,43 39,30 33,30" fill="#ecfdf5" stroke="#050811" stroke-width="1.4"/>
      </svg>`;

    case 'nano_medkit':
      return `<svg ${attrs}>
        <path d="M22 14V9H42V14" stroke="#64748b" stroke-width="3" stroke-linecap="square"/>
        <rect x="9" y="14" width="46" height="40" fill="#1e293b" stroke="#050811" stroke-width="2.6"/>
        <rect x="13" y="18" width="38" height="32" fill="#052e16" stroke="#22c55e" stroke-width="1.6"/>
        <path d="M32 22V46M20 34H44" stroke="#4ade80" stroke-width="6.5"/>
        <path d="M32 24V44M22 34H42" stroke="#dcfce7" stroke-width="2"/>
      </svg>`;

    default:
      return `<svg ${attrs}><rect x="12" y="12" width="40" height="40" stroke="#94a3b8" stroke-width="2"/></svg>`;
  }
}

export function getPlacedItemVisualHtml(itemId, rows, cols, rotation = 0) {
  const isVerticalBar = rows > cols;
  const isHorizontalBar = cols > rows;
  const basePx = rows === 1 && cols === 1 ? 42 : rows === 2 && cols === 2 ? 78 : 56;

  let rotDeg = 0;
  if ((itemId === 'rail_rifle' || itemId === 'chrono_battery') && isVerticalBar) {
    rotDeg = 90;
  } else if (itemId === 'aegis_buckler' && isHorizontalBar) {
    rotDeg = 90;
  } else if (itemId === 'arc_launcher') {
    rotDeg = (((Math.round(rotation / 90) % 4) + 4) % 4) * 90;
  }

  const scaleX = isHorizontalBar ? Math.min(1.85, cols * 0.76) : 1;
  const scaleY = isVerticalBar && rotDeg === 0 ? Math.min(1.65, rows * 0.72) : 1;
  const transform = `transform: rotate(${rotDeg}deg) scale(${scaleX}, ${scaleY});`;

  return `<div class="piece-art-wrap" style="${transform}">${getItemSvg(itemId, basePx)}</div>`;
}

export function getRelicSvg(relicId, size = 34) {
  const attrs = `width="${size}" height="${size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"`;
  switch (relicId) {
    case 'overclock_chip':
      return `<svg ${attrs}><rect x="8" y="8" width="32" height="32" fill="#0c4a6e" stroke="#38bdf8" stroke-width="2"/><polygon points="26,13 17,26 23,26 20,36 31,22 25,22" fill="#e0f2fe"/></svg>`;
    case 'vampiric_coil':
      return `<svg ${attrs}><polygon points="24,6 40,15 40,33 24,42 8,33 8,15" fill="#4c0519" stroke="#fb7185" stroke-width="2"/><path d="M24 14C29 20 31 24 31 28C31 32 27.9 35 24 35C20.1 35 17 32 17 28C17 24 19 20 24 14Z" fill="#f43f5e"/></svg>`;
    case 'titanium_hull':
      return `<svg ${attrs}><polygon points="24,5 41,13 38,34 24,43 10,34 7,13" fill="#451a03" stroke="#f59e0b" stroke-width="2"/><polygon points="24,12 34,18 32,30 24,36 16,30 14,18" fill="#b45309" stroke="#fde047" stroke-width="1.4"/></svg>`;
    case 'compound_interest':
      return `<svg ${attrs}><rect x="8" y="8" width="32" height="32" fill="#064e3b" stroke="#34d399" stroke-width="2"/><polyline points="14,31 21,23 26,26 34,16" stroke="#a7f3d0" stroke-width="2.6"/><polyline points="28,16 34,16 34,22" stroke="#a7f3d0" stroke-width="2.6"/></svg>`;
    case 'high_voltage':
      return `<svg ${attrs}><polygon points="24,5 41,24 24,43 7,24" fill="#3b0764" stroke="#c084fc" stroke-width="2"/><polygon points="26,11 16,25 23,25 21,37 33,22 26,22" fill="#f0abfc"/></svg>`;
    default:
      return `<svg ${attrs}><rect x="10" y="10" width="28" height="28" stroke="#cbd5e1" stroke-width="2"/></svg>`;
  }
}

export function renderStars(level) {
  const count = Math.max(1, Math.min(3, level || 1));
  const pip = `<svg width="9" height="9" viewBox="0 0 12 12" fill="#f59e0b"><polygon points="6,0.5 7.7,4.2 11.7,4.6 8.7,7.3 9.6,11.3 6,9.2 2.4,11.3 3.3,7.3 0.3,4.6 4.3,4.2"/></svg>`;
  return `<span class="star-pips" aria-label="Lv.${count}">${pip.repeat(count)}</span>`;
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

export function getMiniShapeSvg(baseCells, rotation = 0, color = '#38bdf8') {
  const { rows, cols, cells } = getShapeLayout(baseCells, rotation);
  const cellSize = 6.5;
  const gap = 1.5;
  const w = cols * cellSize + (cols - 1) * gap + 2;
  const h = rows * cellSize + (rows - 1) * gap + 2;
  const rects = cells
    .map(([r, c]) => {
      const x = 1 + c * (cellSize + gap);
      const y = 1 + r * (cellSize + gap);
      return `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${color}" stroke="#050811" stroke-width="0.8"/>`;
    })
    .join('');
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none">${rects}</svg>`;
}
