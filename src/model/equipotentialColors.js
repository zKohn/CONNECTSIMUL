/**
 * Módulo para cálculo matemático de cores de redes equipotenciais.
 *
 * Provê uma paleta rica de 48 cores curadas de altíssimo contraste e tons variados
 * (elétricas, pastéis de alto brilho, profundas e vibrantes) projetadas especificamente
 * para temas escuros e para grandes circuitos (12+ elementos com dezenas de conexões).
 *
 * Para mais de 48 redes elétricas simultâneas, emprega geração matemática determinística
 * com saltos harmônicos e oscilação de tom, garantindo diversidade ilimitada.
 *
 * ZONAS PROTEGIDAS (NUNCA USADAS EM CONEXÕES DE NÓS):
 * - Terra: faixa de Verde (~108° a 168°) -> permanece exclusivamente var(--green)
 * - Tensão: faixa de Âmbar/Amarelo (~32° a 64°) -> permanece exclusivamente var(--amber)
 */

function createUnionFind(items = []) {
  const parent = new Map();
  for (const item of items) parent.set(item, item);

  function find(item) {
    if (!parent.has(item)) parent.set(item, item);
    let root = item;
    while (parent.get(root) !== root) {
      root = parent.get(root);
    }
    // Compressão de caminho
    let curr = item;
    while (curr !== root) {
      const next = parent.get(curr);
      parent.set(curr, root);
      curr = next;
    }
    return root;
  }

  function union(a, b) {
    const rootA = find(a);
    const rootB = find(b);
    if (rootA !== rootB) {
      parent.set(rootB, rootA);
    }
  }

  return { find, union };
}

// 48 cores e tons distintos cuidadosamente balanceados para tema escuro
const CURATED_NET_PALETTE = [
  // 1-8: Âncoras primárias vibrantes
  { h: 195, s: 95, l: 58, name: 'Cyan Clássico' },       // #0fe3ff
  { h: 330, s: 90, l: 62, name: 'Hot Magenta' },          // #f43f8e
  { h: 218, s: 92, l: 62, name: 'Royal Azure' },          // #3b82f6
  { h: 84,  s: 85, l: 54, name: 'Neon Lime' },            // #9be12a
  { h: 260, s: 92, l: 66, name: 'Electric Violet' },      // #8b5cf6
  { h: 22,  s: 96, l: 56, name: 'Warm Tangerine' },       // #f97316
  { h: 348, s: 92, l: 62, name: 'Ruby Coral' },           // #f43f5e
  { h: 174, s: 88, l: 48, name: 'Aquamarine Mint' },      // #14b8a6

  // 9-16: Tons pastel luminosos e gelo (alta luminosidade para forte diferenciação)
  { h: 198, s: 95, l: 76, name: 'Ice Cyan' },             // #7dd3fc
  { h: 325, s: 88, l: 78, name: 'Rose Candy' },           // #f472b6
  { h: 245, s: 80, l: 78, name: 'Periwinkle Light' },     // #a5b4fc
  { h: 88,  s: 82, l: 74, name: 'Chartreuse Ice' },       // #d9f99d
  { h: 275, s: 85, l: 78, name: 'Lavender Mist' },        // #d8b4fe
  { h: 28,  s: 94, l: 74, name: 'Peach Glow' },           // #fdba74
  { h: 355, s: 92, l: 80, name: 'Pastel Salmon' },        // #fda4af
  { h: 170, s: 80, l: 76, name: 'Pale Seafoam' },         // #99f6e4

  // 17-24: Tons profundos, aveludados e neons escuros
  { h: 288, s: 95, l: 56, name: 'Vivid Orchid' },         // #c026d3
  { h: 206, s: 96, l: 45, name: 'Deep Sea Blue' },        // #0284c7
  { h: 340, s: 96, l: 50, name: 'Crimson Cerise' },       // #e11d48
  { h: 78,  s: 90, l: 46, name: 'Acid Green-Gold' },      // #65a30d
  { h: 235, s: 88, l: 52, name: 'Indigo Night' },         // #4338ca
  { h: 14,  s: 95, l: 52, name: 'Flame Red-Orange' },     // #ea580c
  { h: 305, s: 92, l: 64, name: 'Fuchsia Neon' },         // #e879f9
  { h: 182, s: 90, l: 42, name: 'Dark Teal' },            // #0f766e

  // 25-32: Contrastes elétricos luminosos
  { h: 212, s: 96, l: 84, name: 'Powder Sky' },           // #bae6fd
  { h: 268, s: 96, l: 58, name: 'Purple Velvet' },        // #9333ea
  { h: 318, s: 90, l: 86, name: 'Blush Cotton' },         // #fbcfe8
  { h: 96,  s: 85, l: 62, name: 'Bright Apple' },         // #a3e635
  { h: 226, s: 95, l: 45, name: 'Ultramarine Dark' },     // #1d4ed8
  { h: 6,   s: 92, l: 64, name: 'Coral Sunrise' },        // #f87171
  { h: 188, s: 95, l: 68, name: 'Electric Turquoise' },   // #38bdf8
  { h: 252, s: 90, l: 88, name: 'Ghost Violet' },         // #ede9fe

  // 33-40: Tons metálicos e transições quente/frio
  { h: 215, s: 35, l: 88, name: 'Platinum Silver' },      // #e2e8f0
  { h: 335, s: 85, l: 42, name: 'Dark Wine Berry' },      // #9d174d
  { h: 240, s: 75, l: 68, name: 'Soft Iris' },            // #818cf8
  { h: 72,  s: 88, l: 58, name: 'Citron Lime' },          // #a3e635
  { h: 298, s: 80, l: 44, name: 'Deep Plum' },            // #701a75
  { h: 18,  s: 96, l: 64, name: 'Bright Apricot' },       // #fb923c
  { h: 352, s: 88, l: 46, name: 'Dark Coral' },           // #be123c
  { h: 178, s: 85, l: 60, name: 'Cyan Jade' },            // #2dd4bf

  // 41-48: Micro-variações harmônicas distintas
  { h: 222, s: 85, l: 72, name: 'Cornflower Blue' },      // #60a5fa
  { h: 280, s: 90, l: 72, name: 'Lilac Blossom' },        // #c084fc
  { h: 344, s: 90, l: 74, name: 'Pink Guava' },           // #fb7185
  { h: 80,  s: 85, l: 70, name: 'Light Chartreuse' },     // #bef264
  { h: 202, s: 88, l: 52, name: 'Oceanic Blue' },         // #0284c7
  { h: 264, s: 80, l: 50, name: 'Dark Lavender' },        // #6d28d9
  { h: 312, s: 85, l: 54, name: 'Cyclamen' },             // #c026d3
  { h: 8,   s: 90, l: 50, name: 'Rust Orange' }           // #c2410c
];

/**
 * Converte HSL para valores RGB [r, g, b] (0-255).
 */
export function hslToRgb(h, s, l) {
  const sNorm = s / 100;
  const lNorm = l / 100;
  const k = (n) => (n + h / 30) % 12;
  const a = sNorm * Math.min(lNorm, 1 - lNorm);
  const f = (n) => lNorm - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}

/**
 * Calcula a luminância relativa perceptível conforme a especificação WCAG 2.1.
 */
export function getWcagLuminance(r, g, b) {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

/**
 * Retorna '#060a0f' (escuro) para fundos com cores mais claras,
 * e '#ffffff' (claro) para fundos com cores mais escuras/intensas.
 */
export function getTagTextColor(h, s, l) {
  const [r, g, b] = hslToRgb(h, s, l);
  const lum = getWcagLuminance(r, g, b);
  return lum > 0.38 ? '#060a0f' : '#ffffff';
}

/**
 * Retorna a paleta e estilos para um dado índice de rede equipotencial.
 * Suporta um catálogo de 48 cores curadas e geração matemática contínua para redes > 48.
 */
export function getEquipotentialNetColor(netIndex) {
  if (netIndex < CURATED_NET_PALETTE.length) {
    const entry = CURATED_NET_PALETTE[netIndex];
    const textColor = getTagTextColor(entry.h, entry.s, entry.l);
    return {
      netIndex,
      hue: entry.h,
      saturation: entry.s,
      lightness: entry.l,
      name: entry.name,
      stroke: `hsl(${entry.h}, ${entry.s}%, ${entry.l}%)`,
      glow: `hsla(${entry.h}, ${entry.s}%, ${entry.l}%, 0.18)`,
      glowSelected: `hsla(${entry.h}, ${entry.s}%, ${entry.l}%, 0.55)`,
      textColor,
      isLightColor: textColor === '#060a0f',
    };
  }

  // Para mais de 48 redes, gera novas variações usando saltos angulares e variação de tom
  const cycle = Math.floor(netIndex / CURATED_NET_PALETTE.length);
  const baseEntry = CURATED_NET_PALETTE[netIndex % CURATED_NET_PALETTE.length];

  const hueShift = (cycle * 19) % 40;
  let newHue = (baseEntry.h + hueShift) % 360;

  // Garante estritamente que não colida com Terra (108-168) e Tensão (32-64)
  if (newHue >= 108 && newHue <= 168) newHue = (newHue + 62) % 360;
  if (newHue >= 32 && newHue <= 64) newHue = (newHue + 34) % 360;

  const newL = Math.min(88, Math.max(38, baseEntry.l + (cycle % 2 === 0 ? 8 : -8)));
  const newS = Math.min(98, Math.max(70, baseEntry.s));
  const roundedHue = Math.round(newHue);
  const textColor = getTagTextColor(roundedHue, newS, newL);

  return {
    netIndex,
    hue: roundedHue,
    saturation: newS,
    lightness: newL,
    name: `Rede ${netIndex + 1}`,
    stroke: `hsl(${roundedHue}, ${newS}%, ${newL}%)`,
    glow: `hsla(${roundedHue}, ${newS}%, ${newL}%, 0.18)`,
    glowSelected: `hsla(${roundedHue}, ${newS}%, ${newL}%, 0.55)`,
    textColor,
    isLightColor: textColor === '#060a0f',
  };
}

/**
 * Classifica todas as conexões em:
 * 1. 'voltage': conectada diretamente ou indiretamente à fonte de tensão (Prioridade 1)
 * 2. 'earth': conectada diretamente ou indiretamente à terra (Prioridade 2)
 * 3. 'node': outras conexões (Prioridade 3)
 *
 * @param {Array} connections - Lista de conexões no circuito
 * @returns {Map<string, 'voltage' | 'earth' | 'node'>} Mapa de connectionId -> tipo de conexão
 */
export function classifyConnections(connections = []) {
  const isVoltageConnection = (conn) =>
    conn.fromSubRegionId === 'voltage-source' ||
    conn.toSubRegionId === 'voltage-source' ||
    conn.from === 'voltage-source-terminal' ||
    conn.to === 'voltage-source-terminal';

  const isEarthConnection = (conn) =>
    (typeof conn.fromSubRegionId === 'string' && (conn.fromSubRegionId.startsWith('earth') || conn.fromSubRegionId.includes('earth'))) ||
    (typeof conn.toSubRegionId === 'string' && (conn.toSubRegionId.startsWith('earth') || conn.toSubRegionId.includes('earth'))) ||
    (typeof conn.from === 'string' && conn.from.startsWith('earth')) ||
    (typeof conn.to === 'string' && conn.to.startsWith('earth'));

  const uf = createUnionFind();

  for (const c of connections) {
    if (c && c.from && c.to) {
      uf.union(c.from, c.to);
    }
  }

  // Identifica quais componentes conectados (raízes) possuem fonte de tensão ou terra
  const voltageRoots = new Set();
  const earthRoots = new Set();

  for (const c of connections) {
    if (!c) continue;
    if (isVoltageConnection(c)) {
      if (c.from) voltageRoots.add(uf.find(c.from));
      if (c.to) voltageRoots.add(uf.find(c.to));
    }
    if (isEarthConnection(c)) {
      if (c.from) earthRoots.add(uf.find(c.from));
      if (c.to) earthRoots.add(uf.find(c.to));
    }
  }

  // Atribui o tipo para cada conexão respeitando estritamente a prioridade:
  // 1. Fonte de tensão
  // 2. Fonte de terra
  // 3. Outras conexões
  const classificationMap = new Map();

  for (const c of connections) {
    if (!c) continue;
    const root = c.from ? uf.find(c.from) : (c.to ? uf.find(c.to) : null);
    if (root && voltageRoots.has(root)) {
      classificationMap.set(c.id, 'voltage');
    } else if (root && earthRoots.has(root)) {
      classificationMap.set(c.id, 'earth');
    } else {
      classificationMap.set(c.id, 'node');
    }
  }

  return classificationMap;
}

/**
 * Detecta se existe conexão direta ou indireta (curto-circuito) entre
 * a fonte de tensão e qualquer bloco de terra.
 *
 * @param {Array} connections - Lista de conexões no circuito
 * @returns {boolean} Verdadeiro se houver curto-circuito entre fonte e terra
 */
export function hasVoltageEarthShortCircuit(connections = []) {
  const isVoltageConnection = (conn) =>
    conn.fromSubRegionId === 'voltage-source' ||
    conn.toSubRegionId === 'voltage-source' ||
    conn.from === 'voltage-source-terminal' ||
    conn.to === 'voltage-source-terminal';

  const isEarthConnection = (conn) =>
    (typeof conn.fromSubRegionId === 'string' && (conn.fromSubRegionId.startsWith('earth') || conn.fromSubRegionId.includes('earth'))) ||
    (typeof conn.toSubRegionId === 'string' && (conn.toSubRegionId.startsWith('earth') || conn.toSubRegionId.includes('earth'))) ||
    (typeof conn.from === 'string' && conn.from.startsWith('earth')) ||
    (typeof conn.to === 'string' && conn.to.startsWith('earth'));

  const uf = createUnionFind();

  for (const c of connections) {
    if (c && c.from && c.to) {
      uf.union(c.from, c.to);
    }
  }

  const voltageRoots = new Set();
  const earthRoots = new Set();

  for (const c of connections) {
    if (!c) continue;
    if (isVoltageConnection(c)) {
      if (c.from) voltageRoots.add(uf.find(c.from));
      if (c.to) voltageRoots.add(uf.find(c.to));
    }
    if (isEarthConnection(c)) {
      if (c.from) earthRoots.add(uf.find(c.from));
      if (c.to) earthRoots.add(uf.find(c.to));
    }
  }

  for (const vr of voltageRoots) {
    if (earthRoots.has(vr)) {
      return true;
    }
  }

  return false;
}

/**
 * Analisa as conexões do simulador e calcula o mapa de redes equipotenciais.
 * Conexões que pertencem a redes de Tensão ou Terra (diretas ou indiretas)
 * NÃO entram no cálculo e mantêm suas cores e tags exclusivas.
 *
 * @param {Array} connections - Lista de conexões no circuito
 * @param {Map<string, string>} [classificationMap] - Mapa pré-calculado de tipos de conexão
 * @returns {Map<string, Object>} Mapa de connectionId -> dados da cor da rede
 */
export function buildEquipotentialNetMap(connections = [], classificationMap = null) {
  const classMap = classificationMap || classifyConnections(connections);

  const nodeConnections = connections.filter((c) => classMap.get(c.id) === 'node');

  const uf = createUnionFind();
  for (const c of nodeConnections) {
    if (c && c.from && c.to) {
      uf.union(c.from, c.to);
    }
  }

  // Agrupa os nós e mapeia cada raiz para um índice de rede determinístico
  const groupIndexMap = new Map();
  let nextNetIndex = 0;

  const netColorMap = new Map();

  for (const c of nodeConnections) {
    const root = uf.find(c.from);
    if (!groupIndexMap.has(root)) {
      groupIndexMap.set(root, nextNetIndex++);
    }
    const netIndex = groupIndexMap.get(root);
    const colorInfo = getEquipotentialNetColor(netIndex);
    netColorMap.set(c.id, colorInfo);
  }

  return netColorMap;
}
