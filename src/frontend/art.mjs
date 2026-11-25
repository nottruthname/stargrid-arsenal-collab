/**
 * 《星匣：深渊防线》v4.0 商业成品级军武矢量美术库（100% 纯中文化）
 * - 零 Emoji、零英文界面标识
 * - 按真实多格占格比例打造的军工级装备模块插画（长条/L型/2×2 严丝合缝贴合星匣轮廓）
 * - 多层钛金渐变、散热鳍片、铆钉装甲板与高能电弧光效
 */

export function uiIcon(name, size = 14) {
  const s = `width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"`;
  switch (name) {
    case 'credits':
      return `<svg ${s}><polygon points="12,2 21,7 21,17 12,22 3,17 3,7" fill="rgba(245,158,11,0.18)"/><polygon points="12,6 17,9 17,15 12,18 7,15 7,9" stroke="none" fill="currentColor"/><circle cx="12" cy="12" r="2.2" fill="#090d16" stroke="none"/></svg>`;
    case 'integrity':
      return `<svg ${s}><polygon points="12,21 4,13 4,7 8,4 12,8 16,4 20,7 20,13" fill="currentColor" stroke="none"/></svg>`;
    case 'shield':
      return `<svg ${s}><path d="M12 2L20 5V12C20 17 16.5 20.5 12 22C7.5 20.5 4 17 4 12V5L12 2Z" fill="rgba(245,158,11,0.16)"/><path d="M12 6V17M8 10.5H16" stroke-width="1.8"/></svg>`;
    case 'bolt':
      return `<svg ${s}><polygon points="13,2 4,14 11,14 10,22 20,10 13,10" fill="currentColor" stroke="none"/></svg>`;
    case 'dps':
      return `<svg ${s}><circle cx="12" cy="12" r="7.5"/><path d="M12 2V6M12 18V22M2 12H6M18 12H22"/><circle cx="12" cy="12" r="2.3" fill="currentColor" stroke="none"/></svg>`;
    case 'lock':
      return `<svg ${s}><rect x="5" y="11" width="14" height="10" rx="1" fill="rgba(245,158,11,0.16)"/><path d="M8 11V7A4 4 0 0 1 16 7V11"/></svg>`;
    case 'unlock':
      return `<svg ${s}><rect x="5" y="11" width="14" height="10" rx="1"/><path d="M8 11V7A4 4 0 0 1 15.5 5"/></svg>`;
    case 'rotate':
      return `<svg ${s}><path d="M21 12A9 9 0 1 1 18.3 5.7"/><polyline points="21 3 21 9 15 9"/></svg>`;
    case 'refresh':
      return `<svg ${s}><path d="M3 12A9 9 0 0 1 19 6.5"/><polyline points="21 3 21 8 16 8"/><path d="M21 12A9 9 0 0 1 5 17.5"/><polyline points="3 21 3 16 8 16"/></svg>`;
    case 'codex':
      return `<svg ${s}><path d="M4 4H10L12 6L14 4H20V20H14L12 18L10 20H4V4Z" fill="rgba(34,211,238,0.12)"/><path d="M12 6V18"/></svg>`;
    case 'audioOn':
      return `<svg ${s}><polygon points="4,9 9,9 14,4 14,20 9,15 4,15" fill="currentColor" stroke="none"/><path d="M17.5 8.5A5 5 0 0 1 17.5 15.5M20 6A8.5 8.5 0 0 1 20 18"/></svg>`;
    case 'audioOff':
      return `<svg ${s}><polygon points="4,9 9,9 14,4 14,20 9,15 4,15" fill="currentColor" stroke="none"/><path d="M17 9L22 15M22 9L17 15"/></svg>`;
    case 'reset':
      return `<svg ${s}><polyline points="3 6 3 11 8 11"/><path d="M3.5 15A8.5 8.5 0 1 0 6 6.7L3 11"/></svg>`;
    case 'engage':
      return `<svg ${s}><polygon points="5,3 19,12 5,21" fill="currentColor" stroke="none"/></svg>`;
    case 'skull':
      return `<svg ${s}><path d="M12 3C7 3 4 6.5 4 11C4 13.8 5.4 16 7 17V20H17V17C18.6 16 20 13.8 20 11C20 6.5 17 3 12 3Z" fill="rgba(244,63,94,0.16)"/><circle cx="9" cy="11" r="1.5" fill="currentColor" stroke="none"/><circle cx="15" cy="11" r="1.5" fill="currentColor" stroke="none"/></svg>`;
    case 'trophy':
      return `<svg ${s}><path d="M6 4H18V10C18 13.3 15.3 16 12 16C8.7 16 6 13.3 6 10V4Z" fill="rgba(245,158,11,0.2)"/><path d="M6 6H3V9C3 11 4.5 12 6 12M18 6H21V9C21 11 19.5 12 18 12M12 16V20M8 20H16"/></svg>`;
    case 'stash':
      return `<svg ${s}><rect x="3" y="4" width="18" height="16"/><path d="M3 10H21M9 14H15"/></svg>`;
    case 'target':
      return `<svg ${s}><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.8" fill="currentColor" stroke="none"/></svg>`;
    default:
      return `<svg ${s}><rect x="4" y="4" width="16" height="16"/></svg>`;
  }
}

/**
 * 商店卡牌、备舱与图鉴使用的高精度 1:1 单格军械徽章插画
 */
export function getItemSvg(itemId, size = 48) {
  const attrs = `width="${size}" height="${size}" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg"`;
  switch (itemId) {
    case 'plasma_dagger':
      return `<svg ${attrs}>
        <defs>
          <linearGradient id="c-pd-blade" x1="20" y1="60" x2="70" y2="10" gradientUnits="userSpaceOnUse">
            <stop offset="0" stop-color="#0c4a6e"/>
            <stop offset="0.45" stop-color="#0284c7"/>
            <stop offset="0.82" stop-color="#38bdf8"/>
            <stop offset="1" stop-color="#f0f9ff"/>
          </linearGradient>
          <linearGradient id="c-pd-guard" x1="16" y1="36" x2="46" y2="66" gradientUnits="userSpaceOnUse">
            <stop offset="0" stop-color="#64748b"/>
            <stop offset="0.5" stop-color="#334155"/>
            <stop offset="1" stop-color="#0f172a"/>
          </linearGradient>
        </defs>
        <path d="M68 10L44 19L28 35L41 48L58 31L68 10Z" fill="url(#c-pd-blade)" stroke="#040811" stroke-width="2.5"/>
        <path d="M65 13L35 43" stroke="#e0f2fe" stroke-width="2"/>
        <path d="M60 15L50 19L37 32L42 37L55 24L60 15Z" fill="#7dd3fc" fill-opacity="0.35"/>
        <path d="M22 30L49 57L43 62L16 35L22 30Z" fill="url(#c-pd-guard)" stroke="#040811" stroke-width="2.2"/>
        <path d="M25 44L35 54L18 71L8 61L25 44Z" fill="#1e293b" stroke="#040811" stroke-width="2.2"/>
        <path d="M12 63L26 49" stroke="#475569" stroke-width="2"/>
        <polygon points="34,37 40,43 34,49 28,43" fill="#bae6fd" stroke="#0284c7" stroke-width="1.4"/>
      </svg>`;

    case 'rail_rifle':
      return `<svg ${attrs}>
        <defs>
          <linearGradient id="c-rr-body" x1="4" y1="22" x2="76" y2="54" gradientUnits="userSpaceOnUse">
            <stop offset="0" stop-color="#1e293b"/>
            <stop offset="0.5" stop-color="#334155"/>
            <stop offset="1" stop-color="#0f172a"/>
          </linearGradient>
        </defs>
        <path d="M6 34L14 26H35L41 22H72V31H42V36H76V44H42L37 49H25L20 62H11L16 49H6V34Z" fill="url(#c-rr-body)" stroke="#040811" stroke-width="2.5"/>
        <rect x="26" y="28" width="43" height="3.2" fill="#818cf8"/>
        <rect x="29" y="38" width="42" height="3" fill="#6366f1"/>
        <rect x="21" y="17" width="16" height="5" fill="#0f172a" stroke="#94a3b8" stroke-width="1.6"/>
        <line x1="25" y1="19.5" x2="33" y2="19.5" stroke="#38bdf8" stroke-width="1.5"/>
        <rect x="44" y="27" width="3.5" height="15" fill="#040811"/>
        <rect x="53" y="27" width="3.5" height="15" fill="#040811"/>
        <rect x="62" y="27" width="3.5" height="15" fill="#040811"/>
        <rect x="70" y="33" width="6" height="5" fill="#e0e7ff"/>
        <circle cx="29" cy="43" r="2.2" fill="#a5b4fc"/>
      </svg>`;

    case 'arc_launcher':
      return `<svg ${attrs}>
        <defs>
          <linearGradient id="c-al-hull" x1="10" y1="10" x2="70" y2="70" gradientUnits="userSpaceOnUse">
            <stop offset="0" stop-color="#2e1065"/>
            <stop offset="0.55" stop-color="#1e1b4b"/>
            <stop offset="1" stop-color="#090d16"/>
          </linearGradient>
        </defs>
        <path d="M12 12H36V44H68V68H12V12Z" fill="url(#c-al-hull)" stroke="#040811" stroke-width="2.8"/>
        <path d="M17 17H31V49H63V63H17V17Z" fill="#0f172a" stroke="#a855f7" stroke-width="1.5"/>
        <rect x="19" y="22" width="10" height="4" fill="#c084fc"/>
        <rect x="19" y="30" width="10" height="4" fill="#a855f7"/>
        <rect x="19" y="38" width="10" height="4" fill="#c084fc"/>
        <polygon points="59,16 69,26 59,36 49,26" fill="#581c87" stroke="#e879f9" stroke-width="2"/>
        <polygon points="59,21 64,26 59,31 54,26" fill="#fae8ff"/>
        <polyline points="24,45 30,54 44,54 55,32" stroke="#e879f9" stroke-width="3" stroke-linecap="round"/>
        <polyline points="24,45 30,54 44,54 55,32" stroke="#ffffff" stroke-width="1.2"/>
        <circle cx="24" cy="56" r="4" fill="#c084fc"/>
      </svg>`;

    case 'aegis_buckler':
      return `<svg ${attrs}>
        <defs>
          <linearGradient id="c-ab-armor" x1="16" y1="8" x2="64" y2="72" gradientUnits="userSpaceOnUse">
            <stop offset="0" stop-color="#64748b"/>
            <stop offset="0.45" stop-color="#334155"/>
            <stop offset="1" stop-color="#0f172a"/>
          </linearGradient>
          <linearGradient id="c-ab-core" x1="40" y1="14" x2="40" y2="66" gradientUnits="userSpaceOnUse">
            <stop offset="0" stop-color="#78350f"/>
            <stop offset="0.5" stop-color="#451a03"/>
            <stop offset="1" stop-color="#1c0d02"/>
          </linearGradient>
        </defs>
        <path d="M40 6L66 16V40L54 64L40 74L26 64L14 40V16L40 6Z" fill="url(#c-ab-armor)" stroke="#040811" stroke-width="2.8"/>
        <path d="M40 12L60 20V39L50 59L40 67L30 59L20 39V20L40 12Z" fill="url(#c-ab-core)" stroke="#f59e0b" stroke-width="2.2"/>
        <path d="M40 17V60M24 35H56" stroke="#fbbf24" stroke-width="3.6"/>
        <polygon points="40,26 49,35 40,44 31,35" fill="#fef08a" stroke="#b45309" stroke-width="2"/>
        <circle cx="25" cy="24" r="1.8" fill="#cbd5e1"/>
        <circle cx="55" cy="24" r="1.8" fill="#cbd5e1"/>
      </svg>`;

    case 'cryo_plate':
      return `<svg ${attrs}>
        <defs>
          <linearGradient id="c-cp-plate" x1="10" y1="10" x2="70" y2="70" gradientUnits="userSpaceOnUse">
            <stop offset="0" stop-color="#334155"/>
            <stop offset="0.5" stop-color="#1e293b"/>
            <stop offset="1" stop-color="#0b1322"/>
          </linearGradient>
        </defs>
        <polygon points="18,9 62,9 71,24 71,59 56,71 24,71 9,59 9,24" fill="url(#c-cp-plate)" stroke="#040811" stroke-width="2.8"/>
        <polygon points="22,15 58,15 65,26 65,55 52,65 28,65 15,55 15,26" fill="#0f766e" fill-opacity="0.45" stroke="#2dd4bf" stroke-width="1.8"/>
        <path d="M40 19V61M19 40H61M25 25L55 55M55 25L25 55" stroke="#99f6e4" stroke-width="2.6"/>
        <polygon points="40,26 54,40 40,54 26,40" fill="#5eead4" stroke="#040811" stroke-width="2.2"/>
        <polygon points="40,32 48,40 40,48 32,40" fill="#f0fdfa"/>
        <rect x="19" y="19" width="4" height="4" fill="#94a3b8"/>
        <rect x="57" y="19" width="4" height="4" fill="#94a3b8"/>
        <rect x="19" y="57" width="4" height="4" fill="#94a3b8"/>
        <rect x="57" y="57" width="4" height="4" fill="#94a3b8"/>
      </svg>`;

    case 'solar_core':
      return `<svg ${attrs}>
        <defs>
          <radialGradient id="c-sc-orb" cx="50%" cy="50%" r="50%">
            <stop offset="0" stop-color="#fff1f2"/>
            <stop offset="0.45" stop-color="#fb7185"/>
            <stop offset="1" stop-color="#be123c"/>
          </radialGradient>
        </defs>
        <polygon points="40,5 49,17 65,12 61,28 75,40 61,52 65,68 49,63 40,75 31,63 15,68 19,52 5,40 19,28 15,12 31,17" fill="#334155" stroke="#040811" stroke-width="2.5"/>
        <polygon points="40,14 58,24 58,56 40,66 22,56 22,24" fill="#4c0519" stroke="#fb7185" stroke-width="2"/>
        <circle cx="40" cy="40" r="14" fill="url(#c-sc-orb)"/>
        <path d="M23 40H14M66 40H57M40 23V14M40 66V57" stroke="#fda4af" stroke-width="2"/>
      </svg>`;

    case 'chrono_battery':
      return `<svg ${attrs}>
        <rect x="7" y="21" width="60" height="38" fill="#1e293b" stroke="#040811" stroke-width="2.8"/>
        <rect x="67" y="29" width="7" height="22" fill="#34d399" stroke="#040811" stroke-width="2.2"/>
        <rect x="12" y="26" width="11" height="28" fill="#10b981"/>
        <rect x="27" y="26" width="13" height="28" fill="#064e3b" stroke="#34d399" stroke-width="1.4"/>
        <rect x="52" y="26" width="11" height="28" fill="#10b981"/>
        <line x1="17.5" y1="28" x2="17.5" y2="52" stroke="#a7f3d0" stroke-width="2"/>
        <line x1="57.5" y1="28" x2="57.5" y2="52" stroke="#a7f3d0" stroke-width="2"/>
        <polygon points="43,26 33,41 40,41 37,54 49,38 42,38" fill="#ecfdf5" stroke="#040811" stroke-width="1.4"/>
      </svg>`;

    case 'nano_medkit':
      return `<svg ${attrs}>
        <path d="M27 17V10H53V17" stroke="#64748b" stroke-width="4"/>
        <rect x="11" y="17" width="58" height="51" rx="2" fill="#1e293b" stroke="#040811" stroke-width="2.8"/>
        <rect x="16" y="22" width="48" height="41" fill="#052e16" stroke="#22c55e" stroke-width="1.8"/>
        <path d="M40 27V57M25 42H55" stroke="#4ade80" stroke-width="8"/>
        <path d="M40 30V54M28 42H52" stroke="#dcfce7" stroke-width="2.4"/>
        <rect x="18" y="24" width="4" height="4" fill="#64748b"/>
        <rect x="58" y="24" width="4" height="4" fill="#64748b"/>
      </svg>`;

    default:
      return `<svg ${attrs}><rect x="16" y="16" width="48" height="48" stroke="#94a3b8" stroke-width="2"/></svg>`;
  }
}

/**
 * 4.0 核心：按真实占格比例（1×1 / 1×2 / 2×1 / 1×3 / 2×2 / L型）精确铸造军械插画
 * - 多格武器与护盾横跨全部所占格子，L型发射器严格贴合 3 个 L 格，右上角留空格零溢出
 */
export function getFootprintItemSvg(itemId, rotation = 0) {
  const steps = ((Math.round(rotation / 90) % 4) + 4) % 4;
  const rotDeg = steps * 90;

  switch (itemId) {
    case 'plasma_dagger':
      return `<svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="fp-pd-b" x1="18" y1="82" x2="86" y2="14" gradientUnits="userSpaceOnUse">
            <stop offset="0" stop-color="#075985"/><stop offset="0.55" stop-color="#0ea5e9"/><stop offset="1" stop-color="#f0f9ff"/>
          </linearGradient>
        </defs>
        <g transform="rotate(${rotDeg} 50 50)">
          <circle cx="50" cy="50" r="35" stroke="rgba(56,189,248,0.22)" stroke-width="1.5" stroke-dasharray="6 4"/>
          <path d="M84 14L54 25L33 46L48 61L69 40L84 14Z" fill="url(#fp-pd-b)" stroke="#040811" stroke-width="3"/>
          <path d="M79 19L41 57" stroke="#e0f2fe" stroke-width="2.4"/>
          <path d="M27 38L59 70L53 76L21 44L27 38Z" fill="#475569" stroke="#040811" stroke-width="2.5"/>
          <path d="M31 55L42 66L22 86L11 75L31 55Z" fill="#1e293b" stroke="#040811" stroke-width="2.5"/>
          <polygon points="41,47 48,54 41,61 34,54" fill="#7dd3fc" stroke="#040811" stroke-width="1.6"/>
        </g>
      </svg>`;

    case 'rail_rifle': {
      const vertical = steps % 2 === 1;
      const vb = vertical ? '0 0 100 300' : '0 0 300 100';
      const innerTf =
        steps === 0
          ? ''
          : steps === 1
            ? 'translate(50 150) rotate(90) translate(-150 -50)'
            : steps === 2
              ? 'rotate(180 150 50)'
              : 'translate(50 150) rotate(270) translate(-150 -50)';
      return `<svg width="100%" height="100%" viewBox="${vb}" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="fp-rr-hull" x1="8" y1="20" x2="292" y2="80" gradientUnits="userSpaceOnUse">
            <stop offset="0" stop-color="#1e293b"/><stop offset="0.5" stop-color="#3b4963"/><stop offset="1" stop-color="#111827"/>
          </linearGradient>
          <linearGradient id="fp-rr-core" x1="80" y1="35" x2="285" y2="35" gradientUnits="userSpaceOnUse">
            <stop offset="0" stop-color="#4f46e5"/><stop offset="0.6" stop-color="#818cf8"/><stop offset="1" stop-color="#e0e7ff"/>
          </linearGradient>
        </defs>
        <g transform="${innerTf}">
          <!-- 贯穿三格的工业重型磁轨底座与长炮管 -->
          <path d="M12 36L28 24H126L140 19H218V29H288V44H224V51H284V63H212L198 71H112L94 82H62L72 67H18L12 58V36Z" fill="url(#fp-rr-hull)" stroke="#040811" stroke-width="3.2" stroke-linejoin="miter"/>
          <!-- 左格枪托与高压电容鼓 -->
          <rect x="22" y="34" width="38" height="24" fill="#0f172a" stroke="#64748b" stroke-width="2"/>
          <rect x="27" y="39" width="9" height="14" fill="#6366f1"/>
          <rect x="40" y="39" width="9" height="14" fill="#818cf8"/>
          <!-- 中格光学战术瞄具与散热矩阵 -->
          <rect x="86" y="13" width="52" height="11" fill="#0b1120" stroke="#94a3b8" stroke-width="2"/>
          <circle cx="94" cy="18.5" r="3" fill="#38bdf8"/>
          <rect x="104" y="16" width="28" height="4" fill="#6366f1"/>
          <rect x="82" y="33" width="110" height="6" fill="url(#fp-rr-core)"/>
          <rect x="82" y="45" width="110" height="5" fill="#4f46e5"/>
          <rect x="98" y="31" width="7" height="21" fill="#040811"/>
          <rect x="118" y="31" width="7" height="21" fill="#040811"/>
          <rect x="138" y="31" width="7" height="21" fill="#040811"/>
          <rect x="158" y="31" width="7" height="21" fill="#040811"/>
          <rect x="178" y="31" width="7" height="21" fill="#040811"/>
          <!-- 右格双联磁轨发射轨道与炽白枪口 -->
          <rect x="218" y="33" width="66" height="6" fill="url(#fp-rr-core)"/>
          <rect x="218" y="53" width="62" height="5" fill="#6366f1"/>
          <rect x="234" y="30" width="8" height="31" fill="#1e293b" stroke="#040811" stroke-width="1.5"/>
          <rect x="256" y="30" width="8" height="31" fill="#1e293b" stroke="#040811" stroke-width="1.5"/>
          <polygon points="282,42 296,46 282,50" fill="#e0e7ff"/>
          <!-- 装甲铆钉 -->
          <circle cx="68" cy="30" r="2.2" fill="#94a3b8"/>
          <circle cx="204" cy="25" r="2.2" fill="#94a3b8"/>
          <circle cx="204" cy="64" r="2.2" fill="#94a3b8"/>
        </g>
      </svg>`;
    }

    case 'aegis_buckler': {
      const horizontal = steps % 2 === 1;
      const vb = horizontal ? '0 0 200 100' : '0 0 100 200';
      const innerTf =
        steps === 0
          ? ''
          : steps === 1
            ? 'translate(100 50) rotate(90) translate(-50 -100)'
            : steps === 2
              ? 'rotate(180 50 100)'
              : 'translate(100 50) rotate(270) translate(-50 -100)';
      return `<svg width="100%" height="100%" viewBox="${vb}" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="fp-ab-metal" x1="12" y1="10" x2="88" y2="190" gradientUnits="userSpaceOnUse">
            <stop offset="0" stop-color="#64748b"/><stop offset="0.5" stop-color="#334155"/><stop offset="1" stop-color="#0f172a"/>
          </linearGradient>
        </defs>
        <g transform="${innerTf}">
          <!-- 贯穿 2×1 的重装塔盾 -->
          <path d="M50 10L86 28V122L68 176L50 190L32 176L14 122V28L50 10Z" fill="url(#fp-ab-metal)" stroke="#040811" stroke-width="3.2"/>
          <path d="M50 20L76 34V119L62 164L50 176L38 164L24 119V34L50 20Z" fill="#2c1705" stroke="#f59e0b" stroke-width="2.4"/>
          <path d="M50 28V166M26 78H74M26 116H74" stroke="#fbbf24" stroke-width="4.5"/>
          <polygon points="50,62 66,96 50,130 34,96" fill="#451a03" stroke="#fde047" stroke-width="2.4"/>
          <polygon points="50,76 58,96 50,116 42,96" fill="#fef08a"/>
          <circle cx="28" cy="40" r="2.6" fill="#cbd5e1"/><circle cx="72" cy="40" r="2.6" fill="#cbd5e1"/>
          <circle cx="32" cy="145" r="2.6" fill="#cbd5e1"/><circle cx="68" cy="145" r="2.6" fill="#cbd5e1"/>
        </g>
      </svg>`;
    }

    case 'chrono_battery': {
      const vertical = steps % 2 === 1;
      const vb = vertical ? '0 0 100 200' : '0 0 200 100';
      const innerTf =
        steps === 0
          ? ''
          : steps === 1
            ? 'translate(50 100) rotate(90) translate(-100 -50)'
            : steps === 2
              ? 'rotate(180 100 50)'
              : 'translate(50 100) rotate(270) translate(-100 -50)';
      return `<svg width="100%" height="100%" viewBox="${vb}" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g transform="${innerTf}">
          <rect x="10" y="18" width="166" height="64" rx="4" fill="#1e293b" stroke="#040811" stroke-width="3.2"/>
          <rect x="176" y="30" width="14" height="40" fill="#34d399" stroke="#040811" stroke-width="2.6"/>
          <rect x="18" y="25" width="38" height="50" fill="#064e3b" stroke="#10b981" stroke-width="1.8"/>
          <rect x="64" y="25" width="38" height="50" fill="#064e3b" stroke="#34d399" stroke-width="1.8"/>
          <rect x="110" y="25" width="58" height="50" fill="#064e3b" stroke="#10b981" stroke-width="1.8"/>
          <rect x="24" y="31" width="26" height="38" fill="#10b981"/>
          <rect x="116" y="31" width="46" height="38" fill="#10b981"/>
          <polygon points="86,27 72,51 82,51 78,73 96,47 85,47" fill="#ecfdf5" stroke="#040811" stroke-width="1.8"/>
          <line x1="18" y1="50" x2="168" y2="50" stroke="rgba(167,243,208,0.4)" stroke-width="2"/>
        </g>
      </svg>`;
    }

    case 'cryo_plate':
      return `<svg width="100%" height="100%" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="fp-cp-bg" x1="12" y1="12" x2="188" y2="188" gradientUnits="userSpaceOnUse">
            <stop offset="0" stop-color="#334155"/><stop offset="0.5" stop-color="#1e293b"/><stop offset="1" stop-color="#09131d"/>
          </linearGradient>
        </defs>
        <g transform="rotate(${rotDeg} 100 100)">
          <polygon points="34,12 166,12 188,42 188,158 158,188 42,188 12,158 12,42" fill="url(#fp-cp-bg)" stroke="#040811" stroke-width="3.6"/>
          <polygon points="44,24 156,24 176,50 176,150 150,176 50,176 24,150 24,50" fill="#0f766e" fill-opacity="0.38" stroke="#2dd4bf" stroke-width="2.4"/>
          <!-- 四角液氮冷凝管罐 -->
          <rect x="26" y="26" width="24" height="24" fill="#0d9488" stroke="#99f6e4" stroke-width="1.8"/>
          <rect x="150" y="26" width="24" height="24" fill="#0d9488" stroke="#99f6e4" stroke-width="1.8"/>
          <rect x="26" y="150" width="24" height="24" fill="#0d9488" stroke="#99f6e4" stroke-width="1.8"/>
          <rect x="150" y="150" width="24" height="24" fill="#0d9488" stroke="#99f6e4" stroke-width="1.8"/>
          <!-- 中央冰晶反应炉心 -->
          <path d="M100 32V168M32 100H168M52 52L148 148M148 52L52 148" stroke="#99f6e4" stroke-width="4"/>
          <polygon points="100,56 144,100 100,144 56,100" fill="#14b8a6" stroke="#040811" stroke-width="3"/>
          <polygon points="100,72 128,100 100,128 72,100" fill="#99f6e4"/>
          <circle cx="100" cy="100" r="14" fill="#f0fdfa" stroke="#0f766e" stroke-width="2.5"/>
        </g>
      </svg>`;

    case 'arc_launcher':
      return `<svg width="100%" height="100%" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="fp-al-hull" x1="12" y1="12" x2="188" y2="188" gradientUnits="userSpaceOnUse">
            <stop offset="0" stop-color="#3b0764"/><stop offset="0.55" stop-color="#1e1b4b"/><stop offset="1" stop-color="#0a0718"/>
          </linearGradient>
        </defs>
        <!-- 严格贴合 L 型三格 [[0,0],[1,0],[1,1]]，右上角 (0,1) 即 x>100,y<100 留白绝不越界！ -->
        <g transform="rotate(${rotDeg} 100 100)">
          <path d="M14 14H86V114H186V186H14V14Z" fill="url(#fp-al-hull)" stroke="#040811" stroke-width="3.6" stroke-linejoin="miter"/>
          <path d="M24 24H76V124H176V176H24V24Z" fill="#0f172a" stroke="#a855f7" stroke-width="2"/>
          <!-- 垂直磁感应线圈塔 -->
          <rect x="30" y="34" width="40" height="9" fill="#c084fc" stroke="#040811" stroke-width="1.5"/>
          <rect x="30" y="52" width="40" height="9" fill="#a855f7" stroke="#040811" stroke-width="1.5"/>
          <rect x="30" y="70" width="40" height="9" fill="#c084fc" stroke="#040811" stroke-width="1.5"/>
          <rect x="30" y="88" width="40" height="9" fill="#a855f7" stroke="#040811" stroke-width="1.5"/>
          <!-- 拐角重型变电核心 -->
          <circle cx="50" cy="150" r="19" fill="#581c87" stroke="#e879f9" stroke-width="2.5"/>
          <circle cx="50" cy="150" r="8" fill="#fae8ff"/>
          <!-- 水平双叉电弧发射枪管 -->
          <rect x="84" y="133" width="84" height="10" fill="#7e22ce" stroke="#e879f9" stroke-width="1.6"/>
          <rect x="84" y="157" width="84" height="10" fill="#7e22ce" stroke="#e879f9" stroke-width="1.6"/>
          <!-- L 型内部贯穿高压电弧 -->
          <polyline points="50,30 43,66 56,96 50,150 96,144 128,158 168,148" stroke="#f0abfc" stroke-width="4.5" stroke-linecap="round"/>
          <polyline points="50,30 43,66 56,96 50,150 96,144 128,158 168,148" stroke="#ffffff" stroke-width="1.8"/>
          <circle cx="170" cy="150" r="7" fill="#fdf4ff"/>
        </g>
      </svg>`;

    case 'solar_core':
      return `<svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="fp-sc-orb" cx="50%" cy="50%" r="50%">
            <stop offset="0" stop-color="#fff1f2"/><stop offset="0.5" stop-color="#f43f5e"/><stop offset="1" stop-color="#881337"/>
          </radialGradient>
        </defs>
        <g transform="rotate(${rotDeg} 50 50)">
          <polygon points="50,7 60,21 79,15 74,34 93,50 74,66 79,85 60,79 50,93 40,79 21,85 26,66 7,50 26,34 21,15 40,21" fill="#334155" stroke="#040811" stroke-width="3"/>
          <polygon points="50,18 72,30 72,70 50,82 28,70 28,30" fill="#4c0519" stroke="#fb7185" stroke-width="2.2"/>
          <circle cx="50" cy="50" r="18" fill="url(#fp-sc-orb)"/>
          <circle cx="50" cy="50" r="7" fill="#fff1f2"/>
        </g>
      </svg>`;

    case 'nano_medkit':
      return `<svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g transform="rotate(${rotDeg} 50 50)">
          <path d="M34 20V11H66V20" stroke="#64748b" stroke-width="5"/>
          <rect x="14" y="20" width="72" height="65" rx="3" fill="#1e293b" stroke="#040811" stroke-width="3.2"/>
          <rect x="20" y="26" width="60" height="53" fill="#052e16" stroke="#22c55e" stroke-width="2"/>
          <path d="M50 32V73M30 52H70" stroke="#4ade80" stroke-width="10"/>
          <path d="M50 36V69M34 52H66" stroke="#dcfce7" stroke-width="3"/>
        </g>
      </svg>`;

    default:
      return getItemSvg(itemId, 60);
  }
}

export function getPlacedItemVisualHtml(itemId, rows, cols, rotation = 0) {
  return `<div class="piece-art-wrap">${getFootprintItemSvg(itemId, rotation)}</div>`;
}

export function getRelicSvg(relicId, size = 34) {
  const attrs = `width="${size}" height="${size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"`;
  switch (relicId) {
    case 'overclock_chip':
      return `<svg ${attrs}><rect x="7" y="7" width="34" height="34" fill="#0c4a6e" stroke="#38bdf8" stroke-width="2.2"/><rect x="11" y="11" width="26" height="26" fill="#082f49" stroke="#7dd3fc" stroke-width="1"/><polygon points="26,12 16,26 23,26 20,37 32,22 25,22" fill="#e0f2fe"/></svg>`;
    case 'vampiric_coil':
      return `<svg ${attrs}><polygon points="24,5 41,15 41,33 24,43 7,33 7,15" fill="#4c0519" stroke="#fb7185" stroke-width="2.2"/><path d="M24 13C30 20 32 24 32 29C32 33.4 28.4 37 24 37C19.6 37 16 33.4 16 29C16 24 18 20 24 13Z" fill="#f43f5e"/><circle cx="24" cy="29" r="3" fill="#ffe4e6"/></svg>`;
    case 'titanium_hull':
      return `<svg ${attrs}><polygon points="24,5 42,13 38,34 24,43 10,34 6,13" fill="#451a03" stroke="#f59e0b" stroke-width="2.2"/><polygon points="24,12 34,18 32,30 24,36 16,30 14,18" fill="#b45309" stroke="#fde047" stroke-width="1.6"/></svg>`;
    case 'compound_interest':
      return `<svg ${attrs}><rect x="7" y="7" width="34" height="34" fill="#064e3b" stroke="#34d399" stroke-width="2.2"/><polyline points="13,32 21,23 26,27 35,15" stroke="#a7f3d0" stroke-width="3"/><polyline points="28,15 35,15 35,22" stroke="#a7f3d0" stroke-width="3"/></svg>`;
    case 'high_voltage':
      return `<svg ${attrs}><polygon points="24,5 42,24 24,43 6,24" fill="#3b0764" stroke="#c084fc" stroke-width="2.2"/><polygon points="26,11 16,25 23,25 21,37 33,22 26,22" fill="#f0abfc"/></svg>`;
    default:
      return `<svg ${attrs}><rect x="10" y="10" width="28" height="28" stroke="#cbd5e1" stroke-width="2"/></svg>`;
  }
}

export function renderStars(level) {
  const count = Math.max(1, Math.min(3, level || 1));
  const labels = ['', '一星', '二星', '三星'];
  const pip = `<svg width="10" height="10" viewBox="0 0 12 12" fill="#fbbf24" stroke="#451a03" stroke-width="0.9"><polygon points="6,0.6 7.7,4.2 11.6,4.7 8.7,7.4 9.5,11.3 6,9.3 2.5,11.3 3.3,7.4 0.4,4.7 4.3,4.2"/></svg>`;
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
      return `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${color}" stroke="#050811" stroke-width="0.9"/>`;
    })
    .join('');
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none">${rects}</svg>`;
}
