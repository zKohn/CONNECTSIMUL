import React, { useMemo } from 'react';
import { buildSubRegionNodes, getVisibleNodes, MAX_OPENINGS } from '../model/electricalModel';

const NODE_SPACING = 30;
const TOP_PADDING = 28;
const BOTTOM_PADDING = 28;

export default function SubRegionDetail({
  subRegion,
  globalNumbers,
  globalBranches,
  connections,
  onToggleOpening,
  onToggleNodeVisibility,
  onClose,
}) {
  const nodes = useMemo(() => buildSubRegionNodes(subRegion), [subRegion]);

  const visibleNodeIds = useMemo(() => {
    const vNodes = getVisibleNodes(subRegion, connections);
    return new Set(vNodes.map((n) => n.id));
  }, [subRegion, connections]);

  const essentialNodeIds = useMemo(() => {
    const essential = new Set();
    const allNodes = buildSubRegionNodes(subRegion);
    if (allNodes.length > 0) essential.add(allNodes[0].id);
    if (allNodes.length > 1) essential.add(allNodes[allNodes.length - 1].id);
    allNodes.forEach((n) => {
      if (n.role === 'lower-opening' || n.role === 'upper-opening') essential.add(n.id);
    });
    for (const conn of connections) {
      if (conn.fromSubRegionId === subRegion.id) essential.add(conn.from);
      if (conn.toSubRegionId === subRegion.id) essential.add(conn.to);
    }
    return essential;
  }, [subRegion, connections]);

  const nodeSpan = Math.max(0, nodes.length - 1) * NODE_SPACING;
  const bodyHeight = TOP_PADDING + nodeSpan + BOTTOM_PADDING;
  const bottom = bodyHeight - BOTTOM_PADDING;
  const positions = nodes.map((_, index) => bottom - index * NODE_SPACING);

  const endpointAt = (position, side) => {
    const atPosition = nodes.filter((node) => node.position === position);
    if (atPosition.length === 0) return null;
    if (atPosition.length === 1) return atPosition[0];
    return side === 'lower'
      ? atPosition.find((node) => node.role === 'lower-opening')
      : atPosition.find((node) => node.role === 'upper-opening');
  };

  const startBranch = globalBranches?.get(subRegion.id) || 1;

  const branchRows = Array.from({ length: subRegion.branches }, (_, i) => {
    const branch = i + 1;
    const globalBranch = startBranch + i;
    const lowerNode = endpointAt(branch - 1, 'lower');
    const upperNode = endpointAt(branch, 'upper');
    if (!lowerNode || !upperNode) return null;
    const lowerIndex = nodes.findIndex((node) => node.id === lowerNode.id);
    const upperIndex = nodes.findIndex((node) => node.id === upperNode.id);
    const y1 = bottom - lowerIndex * NODE_SPACING;
    const y2 = bottom - upperIndex * NODE_SPACING;
    return { branch, globalBranch, y: (y1 + y2) / 2 };
  }).filter(Boolean);

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
              const globalNum = globalNumbers.get(node.id) ?? node.number;

              return (
                <div
                  key={node.id}
                  className={`detail-node-row ${isVisible ? 'detail-node-visible' : ''
                    }`}
                  style={{ top: positions[index] }}
                >
                  <label
                    className="detail-visibility-toggle"
                    title={
                      isEssential
                        ? 'Ponto essencial (sempre visível)'
                        : 'Alternar visibilidade na tela principal'
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

                  <span className="detail-dot left" />

                  <span className="detail-node-badge">
                    {node.polarity
                      ? `${node.polarity}${globalNum}`
                      : globalNum}
                  </span>

                  <span className="detail-dot right" />
                </div>
              );
            })}

            {openingPositions.map((position) => {
              const isOpen = subRegion.openings.includes(position);

              const nodesAtPosition = nodes.filter(
                (node) => node.position === position
              );

              const index = nodes.findIndex(
                (node) => node.id === nodesAtPosition[0]?.id
              );

              const y =
                index >= 0
                  ? bottom - index * NODE_SPACING
                  : null;

              if (y == null) return null;

              // Converte a posição local para o número global da rama
              const globalBranch = startBranch + position - 1;

              return (
                <button
                  type="button"
                  key={position}
                  className={`detail-opening-marker ${isOpen ? 'opening-active' : ''
                    }`}
                  style={{ top: y - 13 }}
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggleOpening(subRegion.id, position);
                  }}
                  title={
                    isOpen
                      ? `Fechar abertura entre ramas ${globalBranch} e ${globalBranch + 1
                      }`
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
