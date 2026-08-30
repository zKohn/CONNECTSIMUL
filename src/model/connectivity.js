import { buildGlobalNodeOrder, buildGlobalNumberMap } from './nodeNumbering';

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

export function buildConnectivity(subRegions, externalConnections) {
  const allNodes = buildGlobalNodeOrder(subRegions);
  const uf = createUnionFind(allNodes.map((node) => node.id));

  // O usuário quer que APENAS as conexões físicas feitas por ele apareçam na tabela
  // Por isso, ignoramos a continuidade interna (ramas) da sub-região.
  for (const connection of externalConnections) {
    uf.union(connection.from, connection.to);
  }

  const groups = uf.groups();

  // Filtrar apenas grupos que possuem mais de 1 ponto (ou seja, que de fato estão conectados)
  const connectedGroups = groups.filter(group => group.length > 1);

  return connectedGroups
    .map((group) => group.sort((a, b) => {
      const ai = allNodes.findIndex((n) => n.id === a);
      const bi = allNodes.findIndex((n) => n.id === b);
      return ai - bi;
    }))
    .sort((a, b) => {
      const ai = allNodes.findIndex((n) => n.id === a[0]);
      const bi = allNodes.findIndex((n) => n.id === b[0]);
      return ai - bi;
    });
}

export function validateConnectivity(subRegions, externalConnections) {
  const nodeIds = new Set(buildGlobalNodeOrder(subRegions).map((node) => node.id));
  const seen = new Set();
  const errors = [];

  for (const connection of externalConnections) {
    if (!nodeIds.has(connection.from) || !nodeIds.has(connection.to)) {
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

export function buildTableRows(subRegions, externalConnections) {
  const globalNumberMap = buildGlobalNumberMap(subRegions);

  return externalConnections.map((conn, index) => {
    const fromNum = globalNumberMap.get(conn.from);
    const toNum = globalNumberMap.get(conn.to);

    return {
      id: conn.id || `connection-row-${index + 1}`,
      points: [fromNum, toNum].filter((n) => n != null),
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
