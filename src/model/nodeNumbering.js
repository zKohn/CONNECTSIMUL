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
  return [...subRegions].sort((a, b) => {
    if (a.x !== b.x) return a.x - b.x;
    if (a.y !== b.y) return b.y - a.y;
    return a.id.localeCompare(b.id);
  });
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
