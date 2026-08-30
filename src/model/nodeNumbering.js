import { buildSubRegionNodes } from './electricalModel';

function centerOf(subRegion) {
  return {
    x: subRegion.x,
    y: subRegion.y,
  };
}

/*
  Ordem de numeração:
  A numeração dos pontos é GLOBAL. Ou seja, cada nó ou rama é único(a)  
  1) As sub-regiões são ordenadas da esquerda para a direita;
  2) Dentro de cada sub-região, os nós são numerados de baixo para cima.
  O número exibido de cada ponto deve ser reconstruído quando a estrutura muda.
*/
export function sortSubRegions(subRegions) {
  const groups = new Map();
  const items = [];

  for (const sub of subRegions) {
    if (sub.groupId) {
      if (!groups.has(sub.groupId)) {
        groups.set(sub.groupId, []);
      }
      groups.get(sub.groupId).push(sub);
    } else {
      items.push({
        type: 'single',
        minX: sub.x,
        minY: sub.y,
        sub,
      });
    }
  }

  for (const [groupId, subs] of groups.entries()) {
    const minX = Math.min(...subs.map((s) => s.x));
    const minY = Math.min(...subs.map((s) => s.y));
    // Ordena as subs da hélice internamente pela ordem estática de nascimento (heliceIndex: 1, 2, 3...)
    const sortedSubs = [...subs].sort((a, b) => (a.heliceIndex || 0) - (b.heliceIndex || 0));
    items.push({
      type: 'group',
      groupId,
      minX,
      minY,
      subs: sortedSubs,
    });
  }

  // Ordena os grupos e sub-regiões avulsas pela posição horizontal no canvas
  items.sort((a, b) => {
    if (a.minX !== b.minX) return a.minX - b.minX;
    if (a.minY !== b.minY) return a.minY - b.minY;
    return 0;
  });

  const result = [];
  for (const item of items) {
    if (item.type === 'single') {
      result.push(item.sub);
    } else {
      result.push(...item.subs);
    }
  }

  return result;
}

export function buildGlobalNodeOrder(subRegions) {
  const orderedSubs = sortSubRegions(subRegions);
  const result = [];

  for (const sub of orderedSubs) {
    const nodes = buildSubRegionNodes(sub).sort((a, b) => a.number - b.number);
    result.push(...nodes);
  }

  return result;
}

export function buildGlobalNumberMap(subRegions) {
  const map = new Map();
  buildGlobalNodeOrder(subRegions).forEach((node, index) => {
    map.set(node.id, index + 1);
  });
  return map;
}

export function buildGlobalBranchMap(subRegions) {
  const orderedSubs = sortSubRegions(subRegions);
  const map = new Map();
  let currentBranch = 1;
  for (const sub of orderedSubs) {
    map.set(sub.id, currentBranch);
    currentBranch += sub.branches;
  }
  return map;
}
