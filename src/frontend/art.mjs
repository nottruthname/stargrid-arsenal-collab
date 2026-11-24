/**
 * 《星匣乱斗：口袋军械库》程序化矢量美术与图鉴渲染模块
 * 零外部图片依赖，保证 TapTap H5 秒开与高清矢量缩放。
 */

export function getItemSvg(itemId, size = 44) {
  const commonAttrs = `width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"`;
  switch (itemId) {
    case 'plasma_dagger':
      return `<svg ${commonAttrs}>
        <defs>
          <linearGradient id="g-pd" x1="12" y1="52" x2="54" y2="10" gradientUnits="userSpaceOnUse">
            <stop stop-color="#0284c7"/><stop offset="1" stop-color="#7dd3fc"/>
          </linearGradient>
        </defs>
        <path d="M51 11L27 29L35 37L51 11Z" fill="url(#g-pd)" stroke="#e0f2fe" stroke-width="2" stroke-linejoin="round"/>
        <path d="M23 33L31 41L19 51L13 45L23 33Z" fill="#0f172a" stroke="#38bdf8" stroke-width="2.2"/>
        <path d="M20 28L36 44" stroke="#bae6fd" stroke-width="3" stroke-linecap="round"/>
        <circle cx="16" cy="48" r="3" fill="#38bdf8"/>
      </svg>`;
    case 'rail_rifle':
      return `<svg ${commonAttrs}>
        <defs>
          <linearGradient id="g-rr" x1="6" y1="32" x2="58" y2="32" gradientUnits="userSpaceOnUse">
            <stop stop-color="#4f46e5"/><stop offset="1" stop-color="#a5b4fc"/>
          </linearGradient>
        </defs>
        <rect x="6" y="25" width="48" height="10" rx="3" fill="#1e1b4b" stroke="#818cf8" stroke-width="2.2"/>
        <rect x="18" y="20" width="38" height="5" rx="2" fill="url(#g-rr)"/>
        <rect x="18" y="35" width="32" height="4" rx="2" fill="#6366f1"/>
        <path d="M10 35L14 48H22L19 35" fill="#312e81" stroke="#818cf8" stroke-width="2"/>
        <circle cx="56" cy="28" r="4.5" fill="#e0e7ff"/>
        <path d="M28 28H46" stroke="#c7d2fe" stroke-width="2.2" stroke-dasharray="4 3"/>
      </svg>`;
    case 'arc_launcher':
      return `<svg ${commonAttrs}>
        <path d="M16 14H28V36H48V48H16V14Z" fill="#2e1065" stroke="#c084fc" stroke-width="2.4" stroke-linejoin="round"/>
        <circle cx="48" cy="20" r="7" fill="#581c87" stroke="#e9d5ff" stroke-width="2"/>
        <path d="M22 22L31 28L25 34L44 42" stroke="#f0abfc" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="48" cy="20" r="2.6" fill="#f5d0fe"/>
      </svg>`;
    case 'aegis_buckler':
      return `<svg ${commonAttrs}>
        <defs>
          <linearGradient id="g-ab" x1="16" y1="10" x2="48" y2="54" gradientUnits="userSpaceOnUse">
            <stop stop-color="#fcd34d"/><stop offset="1" stop-color="#b45309"/>
          </linearGradient>
        </defs>
        <path d="M32 8L50 15V31C50 43 42 52 32 56C22 52 14 43 14 31V15L32 8Z" fill="#451a03" stroke="url(#g-ab)" stroke-width="3"/>
        <path d="M32 14L44 19V31C44 39 38.5 46 32 49.5C25.5 46 20 39 20 31V19L32 14Z" fill="#78350f" stroke="#fde68a" stroke-width="1.5"/>
        <path d="M32 21V42M24 30H40" stroke="#fef3c7" stroke-width="3" stroke-linecap="round"/>
      </svg>`;
    case 'cryo_plate':
      return `<svg ${commonAttrs}>
        <rect x="10" y="10" width="44" height="44" rx="10" fill="#042f2e" stroke="#2dd4bf" stroke-width="2.6"/>
        <path d="M32 16V48M16 32H48M21 21L43 43M43 21L21 43" stroke="#99f6e4" stroke-width="2.6" stroke-linecap="round"/>
        <polygon points="32,23 41,32 32,41 23,32" fill="#0f766e" stroke="#ccfbf1" stroke-width="2"/>
      </svg>`;
    case 'solar_core':
      return `<svg ${commonAttrs}>
        <circle cx="32" cy="32" r="14" fill="#881337" stroke="#fb7185" stroke-width="2.5"/>
        <circle cx="32" cy="32" r="7" fill="#fda4af"/>
        <path d="M32 8V14M32 50V56M8 32H14M50 32H56M15 15L20 20M44 44L49 49M49 15L44 20M20 44L15 49" stroke="#fb7185" stroke-width="3" stroke-linecap="round"/>
      </svg>`;
    case 'chrono_battery':
      return `<svg ${commonAttrs}>
        <rect x="8" y="20" width="44" height="24" rx="5" fill="#064e3b" stroke="#34d399" stroke-width="2.5"/>
        <rect x="52" y="27" width="5" height="10" rx="2" fill="#34d399"/>
        <path d="M30 24L23 33H30L27 41L37 31H30L30 24Z" fill="#a7f3d0" stroke="#ecfdf5" stroke-width="1.2" stroke-linejoin="round"/>
        <rect x="13" y="25" width="6" height="14" rx="1.5" fill="#10b981"/>
        <rect x="41" y="25" width="6" height="14" rx="1.5" fill="#10b981"/>
      </svg>`;
    case 'nano_medkit':
      return `<svg ${commonAttrs}>
        <rect x="11" y="14" width="42" height="38" rx="8" fill="#052e16" stroke="#4ade80" stroke-width="2.5"/>
        <path d="M24 14V10H40V14" stroke="#86efac" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M32 23V43M22 33H42" stroke="#bbf7d0" stroke-width="5" stroke-linecap="round"/>
      </svg>`;
    default:
      return `<svg ${commonAttrs}><circle cx="32" cy="32" r="20" stroke="#94a3b8" stroke-width="2"/></svg>`;
  }
}

export function getRelicSvg(relicId, size = 32) {
  const attrs = `width="${size}" height="${size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"`;
  switch (relicId) {
    case 'overclock_chip':
      return `<svg ${attrs}><rect x="11" y="11" width="26" height="26" rx="5" fill="#0c4a6e" stroke="#38bdf8" stroke-width="2.5"/><path d="M25 15L19 25H24L22 33L30 22H25V15Z" fill="#bae6fd"/></svg>`;
    case 'vampiric_coil':
      return `<svg ${attrs}><circle cx="24" cy="24" r="15" fill="#4c0519" stroke="#fb7185" stroke-width="2.5"/><path d="M24 14C29 20 31 24 31 28C31 32 27.9 35 24 35C20.1 35 17 32 17 28C17 24 19 20 24 14Z" fill="#fda4af"/></svg>`;
    case 'titanium_hull':
      return `<svg ${attrs}><polygon points="24,6 40,14 37,33 24,42 11,33 8,14" fill="#451a03" stroke="#fbbf24" stroke-width="2.5"/><polygon points="24,13 33,18 31,29 24,35 17,29 15,18" fill="#92400e" stroke="#fde68a" stroke-width="1.5"/></svg>`;
    case 'compound_interest':
      return `<svg ${attrs}><circle cx="24" cy="24" r="15" fill="#064e3b" stroke="#34d399" stroke-width="2.5"/><path d="M16 29L22 23L26 26L33 17M33 17H27M33 17V23" stroke="#a7f3d0" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    case 'high_voltage':
      return `<svg ${attrs}><polygon points="26,6 13,26 23,26 20,42 35,21 25,21" fill="#581c87" stroke="#e9d5ff" stroke-width="2" stroke-linejoin="round"/></svg>`;
    default:
      return `<svg ${attrs}><circle cx="24" cy="24" r="14" stroke="#cbd5e1" stroke-width="2"/></svg>`;
  }
}

export function renderStars(level) {
  return '★'.repeat(Math.max(1, Math.min(3, level || 1)));
}

/**
 * 计算多格装备的归一化边界盒与内部相对网格位置
 */
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

/**
 * 渲染迷你形状预览 SVG（用于商店卡片与图鉴）
 */
export function getMiniShapeSvg(baseCells, rotation = 0, color = '#38bdf8') {
  const { rows, cols, cells } = getShapeLayout(baseCells, rotation);
  const cellSize = 7;
  const gap = 2;
  const w = cols * cellSize + (cols - 1) * gap + 2;
  const h = rows * cellSize + (rows - 1) * gap + 2;
  const rects = cells
    .map(([r, c]) => {
      const x = 1 + c * (cellSize + gap);
      const y = 1 + r * (cellSize + gap);
      return `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="1.6" fill="${color}" fill-opacity="0.9"/>`;
    })
    .join('');
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none">${rects}</svg>`;
}
