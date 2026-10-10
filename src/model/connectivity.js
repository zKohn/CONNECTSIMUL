import { buildGlobalNodeOrder, buildGlobalNumberMap } from './nodeNumbering';
import { buildSubRegionNodes, getMultiHeliceExternalNodes } from './electricalModel';

export function createUnionFind(items) {
  const parent = new Map();
  const rank = new Map();

  items.forEach((item) => {
    parent.set(item, item);
    rank.set(item, 0);
  });

  function find(item) {
    if (!parent.has(item)) return null;
    let root = item;

    while (parent.get(root) !== root) {
      root = parent.get(root);
    }

    while (parent.get(item) !== item) {
      const next = parent.get(item);
      parent.set(item, root);
      item = next;
    }

    return root;
  }

  function union(a, b) {
    const rootA = find(a);
    const rootB = find(b);

    if (!rootA || !rootB || rootA === rootB) return;

    const rankA = rank.get(rootA);
    const rankB = rank.get(rootB);

    if (rankA < rankB) {
      parent.set(rootA, rootB);
    } else if (rankA > rankB) {
      parent.set(rootB, rootA);
    } else {
      parent.set(rootB, rootA);
      rank.set(rootA, rankA + 1);
    }
  }

  function groups() {
    const grouped = new Map();

    for (const item of parent.keys()) {
      const root = find(item);
      if (!grouped.has(root)) grouped.set(root, []);
      grouped.get(root).push(item);
    }

    return [...grouped.values()];
  }

  return { find, union, groups };
}

export function getElectricalGroups(subRegions, externalConnections, numberingDirection = 'bottom-to-top') {
  const allNodes = buildGlobalNodeOrder(subRegions, numberingDirection);
  const subNodeIdSet = new Set(allNodes.map((node) => node.id));

  const allIds = new Set(subNodeIdSet);
  for (const connection of externalConnections) {
    allIds.add(connection.from);
    allIds.add(connection.to);
  }

  const uf = createUnionFind(Array.from(allIds));
  for (const connection of externalConnections) {
    uf.union(connection.from, connection.to);
  }

  const allGroups = uf.groups();

  const isEarth = (id) =>
    typeof id === 'string' && (id.startsWith('earth') || id.includes('earth'));

  const groundedSubNodeIds = [];
  const ungroundedConnectedGroups = [];

  for (const group of allGroups) {
    const hasEarth = group.some(isEarth);
    const subNodesInGroup = group.filter((id) => subNodeIdSet.has(id));

    if (hasEarth) {
      // Qualquer nó de sub-região conectado ao terra (direta ou indiretamente) é aterrado
      groundedSubNodeIds.push(...subNodesInGroup);
    } else {
      // Apenas grupos sem ligação com o terra e com mais de 1 ponto constam na tabela comum
      if (subNodesInGroup.length > 1) {
        ungroundedConnectedGroups.push(subNodesInGroup);
      }
    }
  }

  groundedSubNodeIds.sort((a, b) => {
    const ai = allNodes.findIndex((n) => n.id === a);
    const bi = allNodes.findIndex((n) => n.id === b);
    return ai - bi;
  });

  const sortedUngroundedGroups = ungroundedConnectedGroups
    .map((group) =>
      group.sort((a, b) => {
        const ai = allNodes.findIndex((n) => n.id === a);
        const bi = allNodes.findIndex((n) => n.id === b);
        return ai - bi;
      })
    );

  // Separação em duas categorias verticais:
  // 1) Conexões fechadas (hélices múltiplas) - topo da tabela
  // 2) Conexões desenhadas pelo usuário - parte inferior da tabela
  const closedHeliceGroups = [];
  const userDrawnGroups = [];

  for (const group of sortedUngroundedGroups) {
    if (isClosedMultiHeliceGroup(group, subRegions, externalConnections)) {
      closedHeliceGroups.push(group);
    } else {
      userDrawnGroups.push(group);
    }
  }

  const sortByFirstNode = (a, b) => {
    const ai = allNodes.findIndex((n) => n.id === a[0]);
    const bi = allNodes.findIndex((n) => n.id === b[0]);
    return ai - bi;
  };

  closedHeliceGroups.sort(sortByFirstNode);
  userDrawnGroups.sort(sortByFirstNode);

  const finalOrderedGroups = [...closedHeliceGroups, ...userDrawnGroups];

  return {
    groundedSubNodeIds,
    ungroundedConnectedGroups: finalOrderedGroups,
  };
}

export function isClosedMultiHeliceGroup(group, subRegions, externalConnections) {
  if (!group || group.length === 0) return false;

  const subMap = new Map(subRegions.map((s) => [s.id, s]));
  const allSubNodes = subRegions.flatMap((s) => buildSubRegionNodes(s));
  const nodeSubMap = new Map(allSubNodes.map((n) => [n.id, subMap.get(n.subRegionId)]));

  // Todos os nós deste grupo devem pertencer a sub-regiões do mesmo groupId
  const firstSub = nodeSubMap.get(group[0]);
  if (!firstSub || !firstSub.groupId) return false;
  const targetGroupId = firstSub.groupId;

  const allInSameGroup = group.every((nodeId) => {
    const sub = nodeSubMap.get(nodeId);
    return sub && sub.groupId === targetGroupId;
  });
  if (!allInSameGroup) return false;

  // Encontra as conexões que unem os nós deste grupo
  const groupNodeSet = new Set(group);
  const connectionsInGroup = externalConnections.filter(
    (c) => groupNodeSet.has(c.from) && groupNodeSet.has(c.to)
  );

  if (connectionsInGroup.length === 0) return false;

  // Verifica se todas as conexões do grupo são conexões internas da cadeia da hélice múltipla
  const groupSubs = subRegions.filter((s) => s.groupId === targetGroupId);
  const extNodes = getMultiHeliceExternalNodes(groupSubs, externalConnections);
  const extNodeIds = new Set(extNodes.map((n) => n.id));

  return connectionsInGroup.every((c) => {
    const fromSub = subMap.get(c.fromSubRegionId);
    const toSub = subMap.get(c.toSubRegionId);
    const isSameGroupSubs = fromSub && toSub && fromSub.groupId === targetGroupId && toSub.groupId === targetGroupId;
    const isExternalLoop = extNodeIds.has(c.from) && extNodeIds.has(c.to);
    return isSameGroupSubs && !isExternalLoop;
  });
}

export function buildConnectivity(subRegions, externalConnections, numberingDirection = 'bottom-to-top') {
  const { ungroundedConnectedGroups } = getElectricalGroups(subRegions, externalConnections, numberingDirection);
  return ungroundedConnectedGroups;
}

export function validateConnectivity(subRegions, externalConnections, numberingDirection = 'bottom-to-top') {
  const nodeIds = new Set(buildGlobalNodeOrder(subRegions, numberingDirection).map((node) => node.id));
  const seen = new Set();
  const errors = [];

  const isSpecialTerminal = (id) =>
    id === 'voltage-source-terminal' ||
    (typeof id === 'string' && id.startsWith('earth-'));

  for (const connection of externalConnections) {
    const fromValid = nodeIds.has(connection.from) || isSpecialTerminal(connection.from);
    const toValid = nodeIds.has(connection.to) || isSpecialTerminal(connection.to);
    if (!fromValid || !toValid) {
      errors.push(`Conexão inválida: ${connection.from} → ${connection.to}.`);
    }

    if (connection.from === connection.to) {
      errors.push(`Um ponto não pode ser conectado a ele mesmo: ${connection.from}.`);
    }
  }

  for (const connection of externalConnections) {
    const key = [connection.from, connection.to].sort().join('|');
    if (seen.has(key)) {
      errors.push(`Conexão duplicada: ${connection.from} ↔ ${connection.to}.`);
    }
    seen.add(key);
  }

  return errors;
}

export function buildTableRows(subRegions, externalConnections, numberingDirection = 'bottom-to-top') {
  const globalNumberMap = buildGlobalNumberMap(subRegions, numberingDirection);
  const groups = buildConnectivity(subRegions, externalConnections, numberingDirection);

  return groups.map((group, index) => {
    const points = group
      .map((nodeId) => globalNumberMap.get(nodeId))
      .filter((n) => n != null)
      .sort((a, b) => a - b);

    return {
      id: `potential-row-${index + 1}`,
      points,
    };
  });
}

export function exportRowsToCsv(rows) {
  const maxColumns = Math.max(0, ...rows.map((row) => row.points.length));
  const header = ['Linha', ...Array.from({ length: maxColumns }, (_, i) => `N${i + 1}`)];

  const lines = [
    header.join(';'),
    ...rows.map((row, index) => [index + 1, ...row.points].join(';')),
  ];

  return `\uFEFF${lines.join('\r\n')}`;
}
