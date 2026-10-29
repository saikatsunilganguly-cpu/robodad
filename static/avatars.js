// RoboDad's avatars: one robot dad per decade, each with three little "idle moves".
// Every avatar is drawn on the same 64x64 grid so they can swap freely.
// Parts that only appear during a move carry opacity="0" and class "mv";
// the page's CSS animates them when the svg gets a "do-<move>" class.
(() => {
  const INK = "var(--ink)";
  const neck = `<rect x="27.5" y="44" width="9" height="6.5" fill="var(--metal)" stroke="${INK}" stroke-width="2"/>`;
  const head = `<rect x="12" y="16" width="40" height="30" rx="11" fill="var(--metal)" stroke="${INK}" stroke-width="2.4"/>
    <rect x="8" y="26" width="5" height="9" rx="2.5" fill="${INK}"/><rect x="51" y="26" width="5" height="9" rx="2.5" fill="${INK}"/>`;
  const smile = `<path class="mouth" d="M25.5 39.5 Q32 43 38.5 39.5" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`;
  const eyes = `<g class="eye eye-l"><circle cx="23" cy="30" r="3.2" fill="${INK}"/><circle cx="24.1" cy="28.9" r="1" fill="#fff"/></g>
    <g class="eye eye-r"><circle cx="41" cy="30" r="3.2" fill="${INK}"/><circle cx="42.1" cy="28.9" r="1" fill="#fff"/></g>`;
  const torso = (fill) => `<path d="M3 64 C5 55 12 50.5 21 49.5 L32 51 L43 49.5 C52 50.5 59 55 61 64 Z" fill="${fill}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`;
  const spark = (x, y, s = 1) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 -3.6 L1 -1 L3.6 0 L1 1 L0 3.6 L-1 1 L-3.6 0 L-1 -1Z" fill="#fff" stroke="#F2B533" stroke-width=".6"/>`;

  const AVATARS = {
    fifties: {
      name: "Diner Dad", era: "1950s", moves: ["collar", "shine", "comb"],
      svg: `<g class="body">
        <path d="M3 64 C5 55 12 50.5 21 49.5 L32 52 L43 49.5 C52 50.5 59 55 61 64 Z" fill="var(--jacket)" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
        <path d="M23 49.5 L41 49.5 L32 63 Z" fill="#fff" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>
        <path d="M23 49.5 L29 53 L26 57 Z M41 49.5 L35 53 L38 57 Z" fill="#fff" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>
        <path d="M21 49.5 L26.5 57.5 L29.5 64 L20 64 L15 54 Z M43 49.5 L37.5 57.5 L34.5 64 L44 64 L49 54 Z" fill="var(--jacket2)" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>
      </g>${neck}
      <g class="hd">${head}
        <path d="M14 25 C12.5 17 15 10.5 21 7.5 C24 2.5 31 0.8 37 3 C43 2.2 49.5 6 50.5 13.5 L50 27 C49 22.5 46 20 41 20 C37.5 20 35 20.8 32 23 C29 20.8 26.5 20 23 20 C18 20 15 22.5 14 27 Z" fill="var(--hair)" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
        <path class="hair-shine" d="M20.5 12 C25 7.5 32 6 38.5 8 C43 9.2 46.5 11.5 48.5 15 M23.5 16 C29.5 12.5 38 12.5 46 16.5 M25 7 C29 4.8 33.5 4.5 37 5.5" fill="none" stroke="#fff" stroke-width="1.3" stroke-linecap="round" opacity=".4"/>
        <path d="M16 26.5 H30 Q30.5 34 23 34 Q16 34 16 26.5Z M48 26.5 H34 Q33.5 34 41 34 Q48 34 48 26.5Z" fill="var(--lens)"/>
        <path d="M30 27.5 H34" stroke="var(--lens)" stroke-width="2"/>
        <path class="glint" d="M19 28.5 L23 28.5 M37 28.5 L41 28.5" stroke="#fff" stroke-width="1.5" stroke-linecap="round" opacity=".75"/>
        ${smile}
        <g class="mv mv-spark" opacity="0">${spark(45.5, 26, 1.1)}</g>
        <g class="mv mv-comb" opacity="0"><rect x="0" y="0" width="13" height="3.2" rx="1.2" fill="#D7263D" stroke="${INK}" stroke-width="1"/>
          <path d="M1.6 3.2v2.4M3.8 3.2v2.4M6 3.2v2.4M8.2 3.2v2.4M10.4 3.2v2.4" stroke="#D7263D" stroke-width="1.1"/></g>
      </g>
      <g class="mv mv-collar" opacity="0"><path d="M22.5 51 L12.5 37.5 L20.5 40.5 L27.5 47.5 Z M41.5 51 L51.5 37.5 L43.5 40.5 L36.5 47.5 Z" fill="var(--jacket2)" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M14.5 39.5 L21 42 M49.5 39.5 L43 42" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".55"/></g>`,
    },
    modern: {
      name: "Modern Dad", era: "Today", moves: ["wave", "wink", "sip"],
      svg: `<g class="body">${torso("#3D7CB8")}
        <path d="M24 49.2 L32 53.5 L27.5 57.5 L22 51 Z M40 49.2 L32 53.5 L36.5 57.5 L42 51 Z" fill="#5B97D1" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/>
        <path d="M32 53.5 V61.5" stroke="${INK}" stroke-width="1.3"/><circle cx="32" cy="56.3" r=".95" fill="#fff"/><circle cx="32" cy="59.3" r=".95" fill="#fff"/>
      </g>${neck}
      <g class="hd">${head}
        <path d="M14 26.5 C12.5 18 17.5 11 26 10 C31 7.8 40 8.2 45 11.2 C49.5 14 51.2 19.5 50 26.5 C48.5 22 45.5 19.6 40.5 19.6 L26 19.6 C20 19.6 15.5 22 14 26.5Z" fill="#6B4A32" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
        <path d="M25 11.5 C29 15 36 16.4 45 15.5" fill="none" stroke="#fff" stroke-width="1.2" opacity=".35" stroke-linecap="round"/>
        ${eyes}${smile}
      </g>
      <g class="mv mv-mug" opacity="0"><path d="M35 36 h10 v8 a3 3 0 0 1 -3 3 h-4 a3 3 0 0 1 -3 -3z" fill="#fff" stroke="${INK}" stroke-width="1.6"/>
        <path d="M45 38 h1.5 a2.2 2.2 0 0 1 0 4.4 H45" fill="none" stroke="${INK}" stroke-width="1.6"/><rect x="37" y="39.5" width="6" height="2" fill="#D7263D"/>
        <path d="M38 33.5 c-1 -1.2 1 -2 0 -3.4 M41.5 33.5 c-1 -1.2 1 -2 0 -3.4" stroke="#8796A5" stroke-width="1.1" fill="none" stroke-linecap="round"/></g>
      <g class="mv mv-hand" opacity="0"><rect x="51.5" y="49" width="7" height="17" rx="2" fill="#3D7CB8" stroke="${INK}" stroke-width="1.6"/>
        <rect x="50.5" y="40" width="9" height="10.5" rx="3.5" fill="var(--metal)" stroke="${INK}" stroke-width="1.8"/>
        <path d="M52.6 40.5 v-3 M55 40.2 v-4 M57.4 40.5 v-3" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M52.6 40.5 v-3 M55 40.2 v-4 M57.4 40.5 v-3" stroke="var(--metal)" stroke-width="1.2" stroke-linecap="round"/></g>`,
    },
    eighties: {
      name: "Arcade Dad", era: "1980s", moves: ["bob", "shades", "oneup"],
      svg: `<g class="body">${torso("#22B8CF")}
        <path d="M7 61 L20 52.5 L21.5 55.5 L9 63.5 Z M57 61 L44 52.5 L42.5 55.5 L55 63.5 Z" fill="#FF3EA5"/>
        <path d="M32 52 V64" stroke="${INK}" stroke-width="1.6"/>
      </g>${neck}
      <path d="M22.5 47.5 L41.5 47.5 L42.5 52 L32 53.5 L21.5 52Z" fill="#7048E8" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>
      <g class="hd">${head}
        <path d="M10.5 29 C7 18 12 8.5 21.5 6 C27.5 1.5 37.5 1.2 43.5 5.2 C52.5 7.5 57.5 17 53.5 29 C51 22.5 47 19.6 41 19.6 L23 19.6 C17 19.6 13 22.5 10.5 29Z" fill="#8A5A2B" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
        <path d="M18 12 C22 9 27 8 31 9.5 M33 9.5 C37 8 42 9 46 12 M15 18 C18 14 23 13 27 14 M37 14 C41 13 46 14 49 18" stroke="#fff" opacity=".3" stroke-width="1.2" fill="none" stroke-linecap="round"/>
        <path d="M12.5 21.5 C14 18 18 16.5 23 16.5 L41 16.5 C46 16.5 50 18 51.5 21.5 L51.5 24.5 L12.5 24.5Z" fill="#FF3EA5" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>
        <path d="M13.5 22.8 H50.5" stroke="#fff" stroke-width="1" opacity=".7"/>
        <path d="M9.5 27 C8 1.5 56 1.5 54.5 27" fill="none" stroke="#3A3A44" stroke-width="2.2"/>
        <rect x="5.5" y="24.5" width="7" height="11" rx="3.5" fill="#FF8C1A" stroke="${INK}" stroke-width="1.6"/>
        <rect x="51.5" y="24.5" width="7" height="11" rx="3.5" fill="#FF8C1A" stroke="${INK}" stroke-width="1.6"/>
        ${eyes}${smile}
        <g class="mv mv-shades" opacity="0"><path d="M15.5 26 H30.5 L29.5 32.5 Q23 35 17 32.5Z M48.5 26 H33.5 L34.5 32.5 Q41 35 47 32.5Z" fill="#111" stroke="#111" stroke-width="1"/>
          <path d="M30.5 27.5 H33.5" stroke="#111" stroke-width="2"/><path d="M18 28 L22 28 M36 28 L40 28" stroke="#FF3EA5" stroke-width="1.2" stroke-linecap="round"/></g>
      </g>
      <g class="mv mv-notes" opacity="0"><path d="M50 14 v-7 l5 -1.5 v6.5" fill="none" stroke="#FF3EA5" stroke-width="1.6"/>
        <circle cx="48.8" cy="14" r="1.8" fill="#FF3EA5"/><circle cx="53.8" cy="12.5" r="1.8" fill="#FF3EA5"/></g>
      <text class="mv mv-1up" opacity="0" x="32" y="11" text-anchor="middle" font-family="Nunito, sans-serif" font-size="10" font-weight="900" fill="#FFE600" stroke="#111" stroke-width="1" paint-order="stroke">1UP</text>`,
    },
    nineties: {
      name: "Video Store Dad", era: "1990s", moves: ["capflip", "pager", "wink"],
      svg: `<g class="body">${torso("#B23A3A")}
        <path d="M8 57 H56 M5 61.5 H59 M14 52 V64 M50 52 V64 M22 50 V64 M42 50 V64" stroke="#5E1515" stroke-width="1.6" opacity=".75"/>
        <path d="M23.5 49.5 L40.5 49.5 L37 64 L27 64Z" fill="#A7B1BA" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>
        <path d="M23 49.5 L28.5 55.5 L25.5 58.5 L20.5 51Z M41 49.5 L35.5 55.5 L38.5 58.5 L43.5 51Z" fill="#8E2C2C" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>
        <g class="pager"><rect x="44" y="56" width="8.5" height="6" rx="1.2" fill="#26262B" stroke="${INK}" stroke-width="1.2"/>
          <rect class="pager-scr" x="45.3" y="57.2" width="5.9" height="2.4" rx=".4" fill="#9CDB6A"/></g>
      </g>${neck}
      <g class="hd">${head}
        <path d="M13.5 23 C13.5 27 14.5 30 16.5 32 L20 22Z M50.5 23 C50.5 27 49.5 30 47.5 32 L44 22Z" fill="#4A3426" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>
        <g class="cap"><path d="M12.5 23.5 C12.5 11 21 6 32 6 C43 6 51.5 11 51.5 23.5 Z" fill="#2B59C3" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
          <path d="M22 8.5 C26 15 27 19 26.5 23.5 M42 8.5 C38 15 37 19 37.5 23.5" stroke="#1E3F8F" stroke-width="1.1" fill="none"/>
          <path d="M26.5 23.5 Q32 17.5 37.5 23.5" fill="var(--metal)" stroke="${INK}" stroke-width="1.6"/>
          <circle cx="32" cy="6.8" r="1.6" fill="#1E3F8F" stroke="${INK}" stroke-width="1"/></g>
        ${eyes}${smile}
      </g>
      <g class="mv mv-buzz" opacity="0"><path d="M42 57 l-2 -1 M42 60.5 l-2 1 M54.5 57 l2 -1 M54.5 60.5 l2 1" stroke="${INK}" stroke-width="1.2" stroke-linecap="round"/></g>`,
    },
    y2k: {
      name: "Trucker Hat Dad", era: "2000s", moves: ["tipcap", "bob", "peace"],
      svg: `<g class="body">${torso("#3B3F46")}
        <path d="M33.5 52.5 L28.5 58.5 H32 L30.5 63.5 L36 56.8 H32.4Z" fill="#FF8C1A" stroke="${INK}" stroke-width=".8" stroke-linejoin="round"/>
      </g>${neck}
      <g class="hd">${head}
        <path d="M13.5 26 L13.5 31 L16 31 L16 25Z M50.5 26 L50.5 31 L48 31 L48 25Z" fill="#6B4A32"/>
        <g class="tcap"><path d="M13 23 C13 11 21 6 32 6 C43 6 51 11 51 23Z" fill="#2B2B30" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
          <path d="M16 13 l2 2 M16 17 l2 2 M46 13 l2 2 M46 17 l2 2 M18 10 l2 2 M44 10 l2 2" stroke="#8A8F98" stroke-width="1"/>
          <path d="M20.5 22.5 C20.5 12.5 25.5 7.5 32 7.5 C38.5 7.5 43.5 12.5 43.5 22.5Z" fill="#fff" stroke="${INK}" stroke-width="1.6"/>
          <circle cx="32" cy="15.5" r="3.6" fill="#FF8C1A" stroke="${INK}" stroke-width="1"/><path d="M30.2 15.5 h3.6 M32 13.7 v3.6" stroke="#fff" stroke-width="1"/>
          <path d="M9 24 C16 19 48 19 55 24 C48 27 16 27 9 24Z" fill="#E8572A" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/></g>
        ${eyes}${smile}
        <circle cx="10.5" cy="32" r="1.8" fill="#fff" stroke="${INK}" stroke-width=".8"/><circle cx="53.5" cy="32" r="1.8" fill="#fff" stroke="${INK}" stroke-width=".8"/>
        <path d="M10.5 33.8 C11 42 14 46 17 48 M53.5 33.8 C53 42 50 46 47 48" fill="none" stroke="#fff" stroke-width="1.3"/>
      </g>
      <g class="mv mv-notes" opacity="0"><path d="M50 14 v-7 l5 -1.5 v6.5" fill="none" stroke="#FF8C1A" stroke-width="1.6"/>
        <circle cx="48.8" cy="14" r="1.8" fill="#FF8C1A"/><circle cx="53.8" cy="12.5" r="1.8" fill="#FF8C1A"/></g>
      <g class="mv mv-peace" opacity="0"><rect x="51.5" y="49" width="7" height="17" rx="2" fill="#3B3F46" stroke="${INK}" stroke-width="1.6"/>
        <rect x="50" y="41.5" width="10" height="8.5" rx="3.2" fill="var(--metal)" stroke="${INK}" stroke-width="1.8"/>
        <path d="M53 43 L51 35.5 M57 43 L59.5 35.5" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"/><path d="M53 43 L51 35.5 M57 43 L59.5 35.5" stroke="var(--metal)" stroke-width="1.6" stroke-linecap="round"/></g>`,
    },
    skater: {
      name: "Skater Dad", era: "Late '90s", moves: ["beanie", "ollie", "fistbump"],
      svg: `<g class="body">${torso("#7D8793")}
        <path d="M32 54 V64" stroke="#C9D3DC" stroke-width="1.4"/><path d="M28 53.5 v6.5 M36 53.5 v6.5" stroke="#fff" stroke-width="1.3" stroke-linecap="round"/>
      </g>${neck}
      <path d="M18.5 50.5 C22 55.5 42 55.5 45.5 50.5 L43.5 48 C40 52 24 52 20.5 48Z" fill="#646E7A" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>
      <g class="hd">${head}
        <path d="M13 24 C12 28 13 31 15 33 L17 24Z M51 24 C52 28 51 31 49 33 L47 24Z" fill="#6B4A32" stroke="${INK}" stroke-width="1.2"/>
        ${eyes}${smile}
        <g class="beanie"><path d="M12.5 21 C11 9 20 3.5 32 3.5 C44 3.5 53 9 51.5 21Z" fill="#C23B3B" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
          <path d="M22 6 C24 12 25 16 25 20 M32 4 V20 M42 6 C40 12 39 16 39 20" stroke="#9E2B2B" stroke-width="1.2" fill="none"/>
          <rect x="11" y="19" width="42" height="6.5" rx="3" fill="#9E2B2B" stroke="${INK}" stroke-width="1.8"/>
          <path d="M15 20 v4.5 M19 20 v4.5 M23 20 v4.5 M27 20 v4.5 M31 20 v4.5 M35 20 v4.5 M39 20 v4.5 M43 20 v4.5 M47 20 v4.5" stroke="#7A1F1F" stroke-width="1"/></g>
      </g>
      <g class="mv mv-board" opacity="0"><path d="M8 53 C9 54.8 11 56 14 56 H50 C53 56 55 54.8 56 53" fill="none" stroke="#E8572A" stroke-width="3" stroke-linecap="round"/>
        <path d="M13 54.6 H51" stroke="#1C1C1C" stroke-width="1"/><rect x="16" y="57.2" width="5" height="1.8" fill="#9AA5AE"/><rect x="43" y="57.2" width="5" height="1.8" fill="#9AA5AE"/>
        <g class="wheel"><circle cx="18.5" cy="60.5" r="2.4" fill="#F6E7A8" stroke="${INK}" stroke-width="1.1"/><path d="M18.5 58.5 v4" stroke="${INK}" stroke-width=".8"/></g>
        <g class="wheel"><circle cx="45.5" cy="60.5" r="2.4" fill="#F6E7A8" stroke="${INK}" stroke-width="1.1"/><path d="M45.5 58.5 v4" stroke="${INK}" stroke-width=".8"/></g></g>
      <g class="mv mv-fist" opacity="0"><rect x="24" y="44" width="16" height="13" rx="5" fill="var(--metal)" stroke="${INK}" stroke-width="2"/>
        <path d="M28 44.5 v5 M32 44.5 v5 M36 44.5 v5" stroke="${INK}" stroke-width="1.4"/>
        <path d="M20 47 l-3 -1.5 M20 51 l-3 1.5 M44 47 l3 -1.5 M44 51 l3 1.5" stroke="${INK}" stroke-width="1.3" stroke-linecap="round"/></g>`,
    },
    gamer: {
      name: "Gamer Dad", era: "Mid-2000s", moves: ["gg", "mash", "victory"],
      svg: `<g class="body">${torso("#22262E")}<path d="M8 59 H56" stroke="#39FF88" stroke-width="2.2"/></g>${neck}
      <g class="hd">${head}
        <path d="M14 25 C12.5 16 18 10 25 9.5 C28 7 37 7 41 9.5 C47 10.5 51.5 16 50 25 C47 20.5 43 19 38 19.5 L26 19.5 C21 19 16.5 20.5 14 25Z" fill="#3A2A1E" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
        <path d="M8.5 27 C7 4 57 4 55.5 27" fill="none" stroke="#2A2E36" stroke-width="3"/>
        <rect x="4.5" y="23.5" width="9" height="13" rx="4" fill="#2A2E36" stroke="${INK}" stroke-width="1.6"/><rect x="50.5" y="23.5" width="9" height="13" rx="4" fill="#2A2E36" stroke="${INK}" stroke-width="1.6"/>
        <path class="cup-led" d="M7 30 h4 M53 30 h4" stroke="#39FF88" stroke-width="1.6" stroke-linecap="round"/>
        ${eyes}${smile}
        <g class="mic"><path d="M10 35.5 C11 42 17 44.5 23 43" fill="none" stroke="#2A2E36" stroke-width="2.2" stroke-linecap="round"/><circle cx="24" cy="42.8" r="2" fill="#2A2E36" stroke="#39FF88" stroke-width="1"/></g>
      </g>
      <text class="mv mv-gg" opacity="0" x="46" y="13" text-anchor="middle" font-family="Nunito, sans-serif" font-size="10" font-weight="900" fill="#39FF88" stroke="#111" stroke-width="1" paint-order="stroke">GG!</text>
      <g class="mv mv-pad" opacity="0"><path d="M18 51 C14 51 11 55 12 59 C13 62.5 17 62.5 19.5 60 L22 57.5 H42 L44.5 60 C47 62.5 51 62.5 52 59 C53 55 50 51 46 51Z" fill="#3A3F4A" stroke="${INK}" stroke-width="1.6"/>
        <path d="M20 54.5 v4 M18 56.5 h4" stroke="#C9D3DC" stroke-width="1.4"/>
        <circle class="pad-btn" cx="44" cy="55" r="1.3" fill="#39FF88"/><circle class="pad-btn b2" cx="46.6" cy="57.2" r="1.3" fill="#FF5E7E"/><circle cx="41.6" cy="57.2" r="1.3" fill="#38B6FF"/><circle cx="44" cy="59.4" r="1.3" fill="#F2B533"/></g>
      <g class="mv mv-vic" opacity="0"><rect x="51.5" y="47" width="7" height="19" rx="2" fill="#22262E" stroke="${INK}" stroke-width="1.6"/>
        <rect x="49.5" y="38" width="11" height="10" rx="3.5" fill="var(--metal)" stroke="${INK}" stroke-width="1.8"/>
        <path d="M52.5 38.5 v3.5 M55 38.5 v3.5 M57.5 38.5 v3.5" stroke="${INK}" stroke-width="1.2"/></g>
      <g class="mv mv-sparks" opacity="0">${spark(47, 31)}${spark(61, 35, .8)}${spark(52, 27, .6)}</g>`,
    },
    bucket: {
      name: "Bucket Hat Dad", era: "Early 2000s", moves: ["hattip", "dad", "nod"],
      svg: `<g class="body">${torso("#F2B533")}<path d="M22 49.8 L32 56 L42 49.8" fill="none" stroke="#1B2A3A" stroke-width="2.2"/>
        <text class="num" x="32" y="63.5" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="900" font-size="8" fill="#1B2A3A">04</text>
        <text class="mv mv-dad" opacity="0" x="32" y="63" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="900" font-size="6.5" fill="#C2410C">#1 DAD</text>
      </g>${neck}
      <g class="hd">${head}
        <path d="M14 24 C13.5 28 14 31 15.5 33 L18 24Z M50 24 C50.5 28 50 31 48.5 33 L46 24Z" fill="#3A2A1E"/>
        <g class="bucket"><path d="M15 20 C15 10 22 5.5 32 5.5 C42 5.5 49 10 49 20Z" fill="#4E7FB8" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
          <path d="M16 15 H48" stroke="#3B6696" stroke-width="1.2"/>
          <path d="M8 24 C14 18.5 50 18.5 56 24 L53.5 27.5 C46 23.5 18 23.5 10.5 27.5Z" fill="#5B8EC8" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/></g>
        ${eyes}${smile}
      </g>`,
    },
  };
  const LOOK_AVATAR = { classic: "modern", arcade: "eighties", vhs: "nineties", y2k: "y2k", diner: "fifties", skate: "skater", gamer: "gamer", summer: "bucket" };

  function installSymbols(sprite){
    for (const [k, a] of Object.entries(AVATARS)) {
      if (document.getElementById("av-" + k)) continue;
      const sym = document.createElementNS("http://www.w3.org/2000/svg", "symbol");
      sym.id = "av-" + k; sym.setAttribute("viewBox", "0 0 64 64"); sym.innerHTML = a.svg; sprite.appendChild(sym);
    }
  }
  window.RoboAvatars = { AVATARS, LOOK_AVATAR, installSymbols };
})();
