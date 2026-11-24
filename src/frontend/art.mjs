/**
 * 《星匣乱斗：口袋军械库》v2.0 高精度分层赛博机甲装备 SVG 美术系统
 * 支持 1x1 徽章、1x3/2x1/2x2/L型 多格拉伸自适应武器插画与旋转对齐。
 */

export function getItemSvg(itemId, size = 48) {
  const attrs = `width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"`;
  switch (itemId) {
    case 'plasma_dagger':
      return `<svg ${attrs}>
        <defs>
          <linearGradient id="pd-blade" x1="16" y1="48" x2="54" y2="10" gradientUnits="userSpaceOnUse">
            <stop offset="0" stop-color="#0284c7"/>
            <stop offset="0.55" stop-color="#38bdf8"/>
            <stop offset="1" stop-color="#e0f2fe"/>
          </linearGradient>
          <linearGradient id="pd-hilt" x1="10" y1="54" x2="30" y2="34" gradientUnits="userSpaceOnUse">
            <stop offset="0" stop-color="#1e293b"/>
            <stop offset="1" stop-color="#475569"/>
          </linearGradient>
        </defs>
        <path d="M55 9L38 18L26 30L34 38L46 26L55 9Z" fill="url(#pd-blade)" stroke="#082f49" stroke-width="2.5" stroke-linejoin="round"/>
        <path d="M52 12L31 33" stroke="#ffffff" stroke-opacity="0.75" stroke-width="2" stroke-linecap="round"/>
        <path d="M21 25L39 43L35 47L17 29L21 25Z" fill="#f59e0b" stroke="#090d16" stroke-width="2"/>
        <path d="M23 35L29 41L16 54L10 48L23 35Z" fill="url(#pd-hilt)" stroke="#090d16" stroke-width="2.2" stroke-linejoin="round"/>
        <circle cx="14" cy="50" r="3.5" fill="#38bdf8" stroke="#082f49" stroke-width="1.5"/>
        <circle cx="29" cy="35" r="2.2" fill="#e0f2fe"/>
      </svg>`;

    case 'rail_rifle':
      return `<svg ${attrs}>
        <defs>
          <linearGradient id="rr-body" x1="4" y1="20" x2="58" y2="42" gradientUnits="userSpaceOnUse">
            <stop offset="0" stop-color="#1e1b4b"/>
            <stop offset="0.5" stop-color="#4338ca"/>
            <stop offset="1" stop-color="#6366f1"/>
          </linearGradient>
          <linearGradient id="rr-core" x1="16" y1="28" x2="56" y2="28" gradientUnits="userSpaceOnUse">
            <stop offset="0" stop-color="#818cf8"/>
            <stop offset="1" stop-color="#e0e7ff"/>
          </linearGradient>
        </defs>
        <path d="M6 28L12 22H28L31 20H54V26H36V29H58V35H34L30 38H20L17 48H10L13 38H6V28Z" fill="url(#rr-body)" stroke="#090d16" stroke-width="2.4" stroke-linejoin="round"/>
        <rect x="20" y="24" width="35" height="3.2" rx="1.5" fill="url(#rr-core)"/>
        <rect x="24" y="30" width="28" height="2.6" rx="1.2" fill="#a5b4fc"/>
        <rect x="19" y="16" width="11" height="4.5" rx="2" fill="#0f172a" stroke="#a5b4fc" stroke-width="1.6"/>
        <circle cx="57" cy="27.5" r="3.5" fill="#e0e7ff"/>
        <circle cx="24" cy="27.5" r="1.5" fill="#fde047"/>
        <circle cx="31" cy="27.5" r="1.5" fill="#fde047"/>
      </svg>`;

    case 'arc_launcher':
      return `<svg ${attrs}>
        <defs>
          <linearGradient id="al-hull" x1="10" y1="10" x2="52" y2="54" gradientUnits="userSpaceOnUse">
            <stop offset="0" stop-color="#3b0764"/>
            <stop offset="1" stop-color="#7e22ce"/>
          </linearGradient>
        </defs>
        <path d="M12 12H29V34H52V50H12V12Z" fill="url(#al-hull)" stroke="#090d16" stroke-width="2.6" stroke-linejoin="round"/>
        <path d="M16 16H25V38H48V46H16V16Z" fill="#581c87" stroke="#c084fc" stroke-width="1.4" stroke-linejoin="round"/>
        <circle cx="48" cy="20" r="8" fill="#4c1d95" stroke="#090d16" stroke-width="2.2"/>
        <circle cx="48" cy="20" r="4.5" fill="#f0abfc"/>
        <path d="M21 20L27 29L21 35L35 42L45 27" stroke="#fdf4ff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="20.5" cy="43" r="2.5" fill="#e879f9"/>
      </svg>`;

    case 'aegis_buckler':
      return `<svg ${attrs}>
        <defs>
          <linearGradient id="ab-rim" x1="12" y1="8" x2="52" y2="56" gradientUnits="userSpaceOnUse">
            <stop offset="0" stop-color="#fef08a"/>
            <stop offset="0.5" stop-color="#f59e0b"/>
            <stop offset="1" stop-color="#b45309"/>
          </linearGradient>
          <linearGradient id="ab-core" x1="18" y1="14" x2="46" y2="50" gradientUnits="userSpaceOnUse">
            <stop offset="0" stop-color="#92400e"/>
            <stop offset="1" stop-color="#451a03"/>
          </linearGradient>
        </defs>
        <path d="M32 6L52 14V31C52 44.5 43.2 53.5 32 58C20.8 53.5 12 44.5 12 31V14L32 6Z" fill="url(#ab-rim)" stroke="#090d16" stroke-width="2.6" stroke-linejoin="round"/>
        <path d="M32 12L46 18V31C46 41 39.8 48 32 51.5C24.2 48 18 41 18 31V18L32 12Z" fill="url(#ab-core)" stroke="#fef3c7" stroke-opacity="0.6" stroke-width="1.6"/>
        <path d="M32 17V46M22 29H42" stroke="#fef08a" stroke-width="3.6" stroke-linecap="round"/>
        <circle cx="32" cy="29" r="5" fill="#fde047" stroke="#78350f" stroke-width="2"/>
      </svg>`;

    case 'cryo_plate':
      return `<svg ${attrs}>
        <defs>
          <linearGradient id="cp-armor" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
            <stop offset="0" stop-color="#14b8a6"/>
            <stop offset="0.5" stop-color="#0f766e"/>
            <stop offset="1" stop-color="#042f2e"/>
          </linearGradient>
        </defs>
        <path d="M12 10H52L56 22V48L44 56H20L8 48V22L12 10Z" fill="url(#cp-armor)" stroke="#090d16" stroke-width="2.6" stroke-linejoin="round"/>
        <path d="M16 15H48L51 24V44L42 50H22L13 44V24L16 15Z" fill="#0d9488" fill-opacity="0.35" stroke="#5eead4" stroke-width="1.5"/>
        <path d="M32 17V47M17 32H47M22 22L42 42M42 22L22 42" stroke="#ccfbf1" stroke-width="2.4" stroke-linecap="round"/>
        <polygon points="32,22 42,32 32,42 22,32" fill="#99f6e4" stroke="#042f2e" stroke-width="2"/>
        <circle cx="17" cy="18" r="2" fill="#99f6e4"/>
        <circle cx="47" cy="18" r="2" fill="#99f6e4"/>
      </svg>`;

    case 'solar_core':
      return `<svg ${attrs}>
        <defs>
          <radialGradient id="sc-sun" cx="50%" cy="50%" r="50%">
            <stop offset="0" stop-color="#fff1f2"/>
            <stop offset="0.45" stop-color="#fb7185"/>
            <stop offset="1" stop-color="#9f1239"/>
          </radialGradient>
        </defs>
        <path d="M32 5L38 17L51 13L47 26L59 32L47 38L51 51L38 47L32 59L26 47L13 51L17 38L5 32L17 26L13 13L26 17L32 5Z" fill="#be123c" stroke="#090d16" stroke-width="2.2" stroke-linejoin="round"/>
        <circle cx="32" cy="32" r="15" fill="url(#sc-sun)" stroke="#ffe4e6" stroke-width="2"/>
        <circle cx="32" cy="32" r="6.5" fill="#ffffff"/>
      </svg>`;

    case 'chrono_battery':
      return `<svg ${attrs}>
        <defs>
          <linearGradient id="cb-case" x1="8" y1="18" x2="54" y2="46" gradientUnits="userSpaceOnUse">
            <stop offset="0" stop-color="#059669"/>
            <stop offset="1" stop-color="#064e3b"/>
          </linearGradient>
        </defs>
        <rect x="7" y="18" width="46" height="28" rx="6" fill="url(#cb-case)" stroke="#090d16" stroke-width="2.6"/>
        <rect x="53" y="25" width="6" height="14" rx="2" fill="#6ee7b7" stroke="#090d16" stroke-width="2"/>
        <rect x="11" y="22" width="10" height="20" rx="2.5" fill="#34d399"/>
        <rect x="40" y="22" width="9" height="20" rx="2.5" fill="#10b981"/>
        <path d="M32 21L24 33H31L28 43L39 30H32V21Z" fill="#ecfdf5" stroke="#064e3b" stroke-width="1.4" stroke-linejoin="round"/>
      </svg>`;

    case 'nano_medkit':
      return `<svg ${attrs}>
        <defs>
          <linearGradient id="nm-box" x1="10" y1="14" x2="54" y2="54" gradientUnits="userSpaceOnUse">
            <stop offset="0" stop-color="#22c55e"/>
            <stop offset="1" stop-color="#14532d"/>
          </linearGradient>
        </defs>
        <path d="M23 14V9H41V14" stroke="#86efac" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        <rect x="10" y="14" width="44" height="40" rx="9" fill="url(#nm-box)" stroke="#090d16" stroke-width="2.6"/>
        <rect x="14" y="18" width="36" height="32" rx="6" fill="#052e16" fill-opacity="0.55" stroke="#86efac" stroke-opacity="0.5" stroke-width="1.4"/>
        <path d="M32 22V46M20 34H44" stroke="#dcfce7" stroke-width="6.5" stroke-linecap="round"/>
        <path d="M32 22V46M20 34H44" stroke="#4ade80" stroke-width="2.6" stroke-linecap="round"/>
      </svg>`;

    default:
      return `<svg ${attrs}><circle cx="32" cy="32" r="20" stroke="#94a3b8" stroke-width="2.5"/></svg>`;
  }
}

/**
 * 在多格模块内渲染自适应姿态的武器/装甲插画（自动按 bounding box 旋转与拉伸对齐）
 */
export function getPlacedItemVisualHtml(itemId, rows, cols, rotation = 0) {
  const isVerticalBar = rows > cols;
  const isHorizontalBar = cols > rows;
  const basePx = rows === 1 && cols === 1 ? 36 : rows === 2 && cols === 2 ? 68 : 48;

  // 若长条型装备被竖放，将其插画旋转 90 度贴合模块走向
  let rotDeg = 0;
  if ((itemId === 'rail_rifle' || itemId === 'chrono_battery') && isVerticalBar) {
    rotDeg = 90;
  } else if (itemId === 'aegis_buckler' && isHorizontalBar) {
    rotDeg = 90;
  } else if (itemId === 'arc_launcher') {
    rotDeg = ((Math.round(rotation / 90) % 4) + 4) % 4 * 90;
  }

  const scaleX = isHorizontalBar ? Math.min(1.8, cols * 0.72) : 1;
  const scaleY = isVerticalBar && rotDeg === 0 ? Math.min(1.6, rows * 0.7) : 1;
  const transform = `transform: rotate(${rotDeg}deg) scale(${scaleX}, ${scaleY});`;

  return `<div class="piece-art-wrap" style="${transform}">${getItemSvg(itemId, basePx)}</div>`;
}

export function getRelicSvg(relicId, size = 34) {
  const attrs = `width="${size}" height="${size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"`;
  switch (relicId) {
    case 'overclock_chip':
      return `<svg ${attrs}><rect x="9" y="9" width="30" height="30" rx="6" fill="#0369a1" stroke="#090d16" stroke-width="2.4"/><rect x="13" y="13" width="22" height="22" rx="4" fill="#0c4a6e" stroke="#7dd3fc" stroke-width="1.4"/><path d="M26 14L18 26H24L21 35L31 22H25L26 14Z" fill="#e0f2fe"/></svg>`;
    case 'vampiric_coil':
      return `<svg ${attrs}><circle cx="24" cy="24" r="16" fill="#881337" stroke="#090d16" stroke-width="2.4"/><circle cx="24" cy="24" r="12" fill="#4c0519" stroke="#fda4af" stroke-width="1.4"/><path d="M24 13C29 19.5 31.5 23.5 31.5 27.5C31.5 31.6 28.1 35 24 35C19.9 35 16.5 31.6 16.5 27.5C16.5 23.5 19 19.5 24 13Z" fill="#fb7185"/></svg>`;
    case 'titanium_hull':
      return `<svg ${attrs}><polygon points="24,5 41,13 38,34 24,43 10,34 7,13" fill="#b45309" stroke="#090d16" stroke-width="2.4"/><polygon points="24,11 35,17 33,30 24,37 15,30 13,17" fill="#78350f" stroke="#fde047" stroke-width="1.6"/></svg>`;
    case 'compound_interest':
      return `<svg ${attrs}><circle cx="24" cy="24" r="16" fill="#047857" stroke="#090d16" stroke-width="2.4"/><circle cx="24" cy="24" r="12" fill="#064e3b" stroke="#6ee7b7" stroke-width="1.4"/><path d="M15 30L21 23L26 26L33 17M33 17H27M33 17V23" stroke="#d1fae5" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    case 'high_voltage':
      return `<svg ${attrs}><circle cx="24" cy="24" r="16" fill="#6b21a8" stroke="#090d16" stroke-width="2.4"/><polygon points="26,7 13,26 23,26 20,41 35,21 25,21" fill="#f0abfc" stroke="#3b0764" stroke-width="1.5" stroke-linejoin="round"/></svg>`;
    default:
      return `<svg ${attrs}><circle cx="24" cy="24" r="14" stroke="#cbd5e1" stroke-width="2"/></svg>`;
  }
}

export function renderStars(level) {
  return '★'.repeat(Math.max(1, Math.min(3, level || 1)));
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
  const cellSize = 7;
  const gap = 2;
  const w = cols * cellSize + (cols - 1) * gap + 2;
  const h = rows * cellSize + (rows - 1) * gap + 2;
  const rects = cells
    .map(([r, c]) => {
      const x = 1 + c * (cellSize + gap);
      const y = 1 + r * (cellSize + gap);
      return `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="1.8" fill="${color}" stroke="#090d16" stroke-width="0.9"/>`;
    })
    .join('');
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none">${rects}</svg>`;
}
