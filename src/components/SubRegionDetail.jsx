import React, { useMemo } from 'react';
import { buildSubRegionNodes, getVisibleNodes, isCenterNode, MAX_OPENINGS } from '../model/electricalModel';

const NODE_SPACING = 30;
const TOP_PADDING = 28;
const BOTTOM_PADDING = 28;

export default function SubRegionDetail({
  subRegion,
  globalNumbers,
  globalBranches,
  connections,
  onToggleOpening,
  onToggleAllOpenings,
  onToggleNodeVisibility,
  onShowAllNodes,
  onClose,
}) {
  const nodes = useMemo(() => buildSubRegionNodes(subRegion), [subRegion]);

  const visibleNodeIds = useMemo(() => {
    const vNodes = getVisibleNodes(subRegion, connections);
    return new Set(vNodes.map((n) => n.id));
  }, [subRegion, connections]);

  const allNodesVisible = visibleNodeIds.size === nodes.length;
  const allOpeningsOpen =
    subRegion.branches > 1 && (subRegion.openings || []).length >= subRegion.branches - 1;

  const essentialNodeIds = useMemo(() => {
    const essential = new Set();
    const allNodes = buildSubRegionNodes(subRegion);
    if (allNodes.length > 0) essential.add(allNodes[0].id);
    if (allNodes.length > 1) essential.add(allNodes[allNodes.length - 1].id);
    allNodes.forEach((n) => {
      if (n.role === 'lower-opening' || n.role === 'upper-opening') essential.add(n.id);
    });
    return essential;
  }, [subRegion]);

  const DETAIL_OPENING_GAP = 28;

  const nodeOffsets = useMemo(() => {
    const offsets = [];
    let current = 0;
    for (let i = 0; i < nodes.length; i++) {
      if (i > 0) {
        const prev = nodes[i - 1];
        const curr = nodes[i];
        const isOpeningBreak =
          prev.role === 'lower-opening' &&
          curr.role === 'upper-opening' &&
          prev.position === curr.position;
        current += NODE_SPACING + (isOpeningBreak ? DETAIL_OPENING_GAP : 0);
      }
      offsets.push(current);
    }
    return offsets;
  }, [nodes]);

  const totalSpan = nodeOffsets.length > 0 ? nodeOffsets[nodeOffsets.length - 1] : 0;
  const bodyHeight = TOP_PADDING + totalSpan + BOTTOM_PADDING;
  const bottom = bodyHeight - BOTTOM_PADDING;
  const positions = nodeOffsets.map((off) => bottom - off);

  const startBranch = globalBranches?.get(subRegion.id) || 1;

  const branchRows = useMemo(() => {
    return Array.from({ length: subRegion.branches }, (_, i) => {
      const branch = i + 1;
      const globalBranch = startBranch + i;
      const lowerCandidates = nodes.filter((n) => n.position === branch - 1);
      const upperCandidates = nodes.filter((n) => n.position === branch);
      if (lowerCandidates.length === 0 || upperCandidates.length === 0) return null;

      // O nó inferior da rama é o último candidato da posição anterior (upper-opening se houver abertura)
      const lowerNode = lowerCandidates[lowerCandidates.length - 1];
      // O nó superior da rama é o primeiro candidato da posição atual (lower-opening se houver abertura)
      const upperNode = upperCandidates[0];

      const lowerIndex = nodes.findIndex((node) => node.id === lowerNode.id);
      const upperIndex = nodes.findIndex((node) => node.id === upperNode.id);
      if (lowerIndex < 0 || upperIndex < 0) return null;

      const y1 = positions[lowerIndex];
      const y2 = positions[upperIndex];
      return { branch, globalBranch, y: (y1 + y2) / 2 };
    }).filter(Boolean);
  }, [subRegion.branches, startBranch, nodes, positions]);

  const openingPositions = Array.from(
    { length: Math.max(0, subRegion.branches - 1) },
    (_, i) => i + 1
  );

  return (
    <div className="detail-overlay" onClick={onClose}>
      <section className="detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="detail-header">
          <div>
            <span className="eyebrow">DETALHES DA SUB-REGIÃO</span>
            <h2>{subRegion.name}</h2>
          </div>

          <div className="detail-header-info">
            {onToggleAllOpenings && subRegion.branches > 1 && (
              <button
                type="button"
                className={`icon-btn ${allOpeningsOpen ? 'icon-btn--active' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: allOpeningsOpen ? 'var(--amber)' : '#94a3b8',
                  borderColor: allOpeningsOpen ? 'rgba(251, 191, 36, 0.4)' : undefined,
                  background: allOpeningsOpen ? 'rgba(251, 191, 36, 0.12)' : undefined,
                }}
                onClick={() => onToggleAllOpenings(subRegion.id, !allOpeningsOpen)}
                title={
                  allOpeningsOpen
                    ? 'Fechar todas as aberturas entre nós (restaurar conexões)'
                    : 'Abrir todas as conexões entre nós (separar todas as ramas)'
                }
                aria-label={
                  allOpeningsOpen
                    ? 'Fechar todas as aberturas'
                    : 'Abrir todas as conexões'
                }
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="6" cy="6" r="3" />
                  <circle cx="6" cy="18" r="3" />
                  <line x1="20" y1="4" x2="8.12" y2="15.88" />
                  <line x1="14.47" y1="14.48" x2="20" y2="20" />
                  <line x1="8.12" y1="8.12" x2="12" y2="12" />
                </svg>
              </button>
            )}

            {onShowAllNodes && (
              <button
                type="button"
                className={`icon-btn ${allNodesVisible ? 'icon-btn--active' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: allNodesVisible ? 'var(--cyan)' : '#94a3b8',
                  borderColor: allNodesVisible ? 'rgba(69, 214, 255, 0.4)' : undefined,
                  background: allNodesVisible ? 'rgba(69, 214, 255, 0.12)' : undefined,
                }}
                onClick={() => onShowAllNodes(subRegion.id, !allNodesVisible)}
                title={
                  allNodesVisible
                    ? 'Ocultar pontos não essenciais na tela principal'
                    : 'Exibir todos os pontos na tela principal'
                }
                aria-label={
                  allNodesVisible
                    ? 'Ocultar pontos intermediários'
                    : 'Exibir todos os pontos'
                }
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  {allNodesVisible ? (
                    <>
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </>
                  ) : (
                    <>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </>
                  )}
                </svg>
              </button>
            )}

            <span className="branch-chip">{subRegion.branches} RAMAS</span>
            <button className="icon-btn" onClick={onClose} aria-label="Fechar">
              ×
            </button>
          </div>
        </div>

        <div className="detail-body">
          <div
            className="detail-formation"
            style={{ height: bodyHeight, position: 'relative' }}
          >
            <div className="detail-structure-line" />

            <div className="detail-branch-column" aria-hidden="true">
              {branchRows.map(({ branch, globalBranch, y }) => (
                <span key={branch} style={{ top: y - 9 }}>
                  R{globalBranch}
                </span>
              ))}
            </div>

            {nodes.map((node, index) => {
              const isEssential = essentialNodeIds.has(node.id);
              const isVisible = visibleNodeIds.has(node.id);
              const isCenter = isCenterNode(node, subRegion);
              const globalNum = globalNumbers.get(node.id) ?? node.number;

              return (
                <div
                  key={node.id}
                  className={`detail-node-row ${isVisible ? 'detail-node-visible' : ''} ${isCenter ? 'detail-node-center' : ''}`}
                  style={{ top: positions[index] }}
                >
                  <label
                    className="detail-visibility-toggle"
                    title={
                      isEssential
                        ? 'Ponto estrutural (extremidade ou abertura)'
                        : isVisible
                          ? 'Clique para ocultar este ponto (conexões associadas serão desfeitas)'
                          : 'Clique para exibir este ponto na tela principal'
                    }
                  >
                    <input
                      type="checkbox"
                      checked={isVisible}
                      disabled={isEssential}
                      onChange={() =>
                        onToggleNodeVisibility(subRegion.id, node.id)
                      }
                    />
                    <span className="detail-checkmark" />
                  </label>

                  <span className={`detail-dot left ${isCenter ? 'center-dot' : ''}`} />

                  <span className={`detail-node-badge ${isCenter ? 'badge-center' : ''}`}>
                    {node.polarity
                      ? `${node.polarity}${globalNum}`
                      : globalNum}
                    {isCenter && <span className="center-tag" title="Nó Central">● Centro</span>}
                  </span>

                  <span className={`detail-dot right ${isCenter ? 'center-dot' : ''}`} />
                </div>
              );
            })}

            {openingPositions.map((position) => {
              const isOpen = subRegion.openings.includes(position);

              const nodesAtPosition = nodes.filter(
                (node) => node.position === position
              );

              if (nodesAtPosition.length === 0) return null;

              let y;
              if (isOpen && nodesAtPosition.length >= 2) {
                const lowerIdx = nodes.findIndex((n) => n.id === nodesAtPosition[0].id);
                const upperIdx = nodes.findIndex((n) => n.id === nodesAtPosition[1].id);
                y = (positions[lowerIdx] + positions[upperIdx]) / 2;
              } else {
                const idx = nodes.findIndex((n) => n.id === nodesAtPosition[0]?.id);
                y = idx >= 0 ? positions[idx] : null;
              }

              if (y == null) return null;

              // Converte a posição local para o número global da rama
              const globalBranch = startBranch + position - 1;

              return (
                <button
                  type="button"
                  key={position}
                  className={`detail-opening-marker ${isOpen ? 'opening-active' : ''
                    }`}
                  style={{ top: y - 11 }}
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggleOpening(subRegion.id, position);
                  }}
                  title={
                    isOpen
                      ? `Fechar abertura entre ramas ${globalBranch} e ${globalBranch + 1}`
                      : `Abrir conexão entre ramas ${globalBranch} e ${globalBranch + 1
                      }`
                  }
                >
                  <span />
                </button>
              );
            })}
          </div>
        </div>

        <div className="detail-footer">
          <span>{nodes.length} nós totais</span>
          <span className="detail-visible-count">
            {visibleNodeIds.size} visíveis
          </span>
          <span>
            ✂ {subRegion.openings.length}/{MAX_OPENINGS} cortes
          </span>
        </div>
      </section>
    </div>
  );
}
