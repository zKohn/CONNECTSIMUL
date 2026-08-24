export const MAX_OPENINGS = 20;
export const MIN_BRANCHES = 1;

export function clampBranches(value) {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n)) return MIN_BRANCHES;
  return Math.max(MIN_BRANCHES, n);
}

/*
  Cada sub-região possui R ramas e R+1 nós.
  Uma abertura entre as ramas k e k+1 divide a sub-região na posição k+1 em dois nós. A numeração exibida é reconstruída de baixo para cima.
*/

export function buildSubRegionNodes(subRegion) {
  const branches = clampBranches(subRegion.branches);
  const openings = [...new Set(subRegion.openings || [])]
    .map(Number)
    .filter((p) => Number.isInteger(p) && p >= 1 && p < branches)
    .sort((a, b) => a - b);

  const nodes = [];
  let number = 1;

  for (let position = 0; position <= branches; position += 1) {
    const openingAt = position > 0 && position < branches && openings.includes(position);

    if (openingAt) {
      nodes.push(makeNode(subRegion, number++, position, 'lower-opening', true, false));
      nodes.push(makeNode(subRegion, number++, position, 'upper-opening', true, true));
    } else {
      const isBottom = position === 0;
      const isTop = position === branches;
      const polarity = isBottom
        ? subRegion.topPolarity === '+' ? '-' : '+'
        : isTop
          ? subRegion.topPolarity
          : null;

      nodes.push(makeNode(subRegion, number++, position, 'normal', false, false, polarity));
    }
  }

  return nodes;
}

function makeNode(subRegion, number, position, role, isOutput, upperOpening = false, polarity = null) {
  let effectivePolarity = polarity;

  if (role === 'lower-opening') effectivePolarity = '-';
  if (role === 'upper-opening') effectivePolarity = '+';

  return {
    id: `${subRegion.id}:node:${position}:${role}`,
    subRegionId: subRegion.id,
    number,
    position,
    role,
    isOutput: true,
    polarity: effectivePolarity,
    upperOpening,
    label: effectivePolarity ? `${effectivePolarity}${number}` : `${number}`,
  };
}

export function getNodeByNumber(subRegion, number) {
  return buildSubRegionNodes(subRegion).find((node) => node.number === number) || null;
}

export function getOutputNodes(subRegion) {
  return buildSubRegionNodes(subRegion).filter((node) => node.isOutput);
}

export function getVisibleNodes(subRegion, connections = []) {
  const allNodes = buildSubRegionNodes(subRegion);

  const connectedNodeIds = new Set();
  for (const conn of connections) {
    if (conn.fromSubRegionId === subRegion.id) connectedNodeIds.add(conn.from);
    if (conn.toSubRegionId === subRegion.id) connectedNodeIds.add(conn.to);
  }

  const explicitlyVisible = new Set(subRegion.visibleNodes || []);

  return allNodes.filter((node, index) => {
    if (index === 0 || index === allNodes.length - 1) return true;
    if (node.role === 'lower-opening' || node.role === 'upper-opening') return true;
    if (connectedNodeIds.has(node.id)) return true;
    if (explicitlyVisible.has(node.id)) return true;
    return false;
  });
}

export function getNodeCount(subRegion) {
  return buildSubRegionNodes(subRegion).length;
}

export function getBranchSegments(subRegion) {
  const nodes = buildSubRegionNodes(subRegion);
  const branches = clampBranches(subRegion.branches);
  const segments = [];

  for (let branch = 1; branch <= branches; branch += 1) {
    const lowerCandidates = nodes.filter((n) => n.position === branch - 1);
    const upperCandidates = nodes.filter((n) => n.position === branch);

    const lower = lowerCandidates[lowerCandidates.length - 1];
    const upper = upperCandidates[0];

    if (lower && upper) {
      segments.push({
        id: `${subRegion.id}:branch:${branch}`,
        branch,
        from: lower.id,
        to: upper.id,
      });
    }
  }

  return segments;
}

export function createSubRegion({ id, name, x = 180, y = 120, branches = 4, topPolarity = '+' } = {}) {
  return {
    id: id || `sub-${crypto.randomUUID()}`,
    name: name || 'SUB 01',
    x,
    y,
    branches: clampBranches(branches),
    topPolarity: topPolarity === '-' ? '-' : '+',
    openings: [],
    visibleNodes: [],
  };
}

export function toggleOpening(subRegion, position) {
  const p = Number(position);
  if (!Number.isInteger(p) || p < 1 || p >= clampBranches(subRegion.branches)) {
    return subRegion;
  }

  const hasOpening = subRegion.openings.includes(p);

  if (hasOpening) {
    return {
      ...subRegion,
      openings: subRegion.openings.filter((opening) => opening !== p),
    };
  }

  if (subRegion.openings.length >= MAX_OPENINGS) {
    return subRegion;
  }

  return {
    ...subRegion,
    openings: [...subRegion.openings, p].sort((a, b) => a - b),
  };
}

export function resizeBranches(subRegion, branches) {
  const nextBranches = clampBranches(branches);
  return {
    ...subRegion,
    branches: nextBranches,
    openings: subRegion.openings.filter((p) => p < nextBranches),
  };
}

export function nodeDisplayNumber(nodeId, subRegions) {
  for (const sub of subRegions) {
    const node = buildSubRegionNodes(sub).find((n) => n.id === nodeId);
    if (node) return node.number;
  }
  return null;
}
