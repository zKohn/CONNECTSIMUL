import React, { useMemo } from 'react';
import { buildSubRegionNodes, getVisibleNodes, isCenterNode } from '../model/electricalModel';
import NodeTerminal from './NodeTerminal';

const WIDTH = 180;
const HEADER_HEIGHT = 56;
const FOOTER_HEIGHT = 28;
const TOP_PADDING = 24;
const BOTTOM_PADDING = 24;
const NODE_SPACING = 28;
const OPENING_GAP = 24;
const MIN_BODY_HEIGHT = 80;

export function calculateVisibleNodeOffsets(visibleNodes) {
  const offsets = [];
  let currentOffset = 0;

  for (let i = 0; i < visibleNodes.length; i++) {
    if (i > 0) {
      const prev = visibleNodes[i - 1];
      const curr = visibleNodes[i];
      const isOpeningBreak =
        prev.role === 'lower-opening' &&
        curr.role === 'upper-opening' &&
        prev.position === curr.position;

      currentOffset += NODE_SPACING + (isOpeningBreak ? OPENING_GAP : 0);
    }
    offsets.push(currentOffset);
  }

  return offsets;
}

export function getSubRegionHeight(subRegion, connections = []) {
  const visibleNodes = getVisibleNodes(subRegion, connections);
  const offsets = calculateVisibleNodeOffsets(visibleNodes);
  const nodeSpan = offsets.length > 0 ? offsets[offsets.length - 1] : 0;
  const bodyHeight = Math.max(MIN_BODY_HEIGHT, TOP_PADDING + nodeSpan + BOTTOM_PADDING);
  return HEADER_HEIGHT + bodyHeight + FOOTER_HEIGHT;
}

export function getSubRegionNodeY(subRegion, nodeNumber, connections = []) {
  const visibleNodes = getVisibleNodes(subRegion, connections);
  const allNodes = buildSubRegionNodes(subRegion);
  const targetNode = allNodes.find((node) => node.number === nodeNumber);
  if (!targetNode) return null;

  const visibleIndex = visibleNodes.findIndex((node) => node.id === targetNode.id);
  if (visibleIndex < 0) return null;

  const offsets = calculateVisibleNodeOffsets(visibleNodes);
  const nodeSpan = offsets.length > 0 ? offsets[offsets.length - 1] : 0;
  const bodyHeight = Math.max(MIN_BODY_HEIGHT, TOP_PADDING + nodeSpan + BOTTOM_PADDING);
  const bottom = bodyHeight - BOTTOM_PADDING;
  return HEADER_HEIGHT + (bottom - offsets[visibleIndex]);
}

export function getSubRegionPortPoint(subRegion, nodeNumber, connections = []) {
  const y = getSubRegionNodeY(subRegion, nodeNumber, connections);
  if (y == null) return null;
  const scrollAdjustedY = subRegion.y + y;
  return {
    leftX: subRegion.x + 27,
    rightX: subRegion.x + WIDTH - 27,
    y: scrollAdjustedY
  };
}

export default function SubRegion({
  subRegion,
  selectedNodeId,
  globalNumbers,
  connections,
  onSelectNode,
  onUpdatePosition,
  onCommitPosition,
  onSelectSubRegion,
  onOpenDetail,
  onShowAllNodes,
}) {
  const allNodes = useMemo(() => buildSubRegionNodes(subRegion), [subRegion]);
  const visibleNodes = useMemo(
    () => getVisibleNodes(subRegion, connections),
    [subRegion, connections]
  );
  const height = getSubRegionHeight(subRegion, connections);
  const offsets = useMemo(() => calculateVisibleNodeOffsets(visibleNodes), [visibleNodes]);
  const nodeSpan = offsets.length > 0 ? offsets[offsets.length - 1] : 0;
  const bodyHeight = Math.max(MIN_BODY_HEIGHT, TOP_PADDING + nodeSpan + BOTTOM_PADDING);

  const bottom = bodyHeight - BOTTOM_PADDING;
  const positions = offsets.map((off) => bottom - off);

  const connectedNodeIds = useMemo(() => {
    const set = new Set();
    for (const conn of (connections || [])) {
      if (conn.fromSubRegionId === subRegion.id) set.add(conn.from);
      if (conn.toSubRegionId === subRegion.id) set.add(conn.to);
    }
    return set;
  }, [connections, subRegion.id]);

  return (
    <section
      className="subregion"
      style={{ left: subRegion.x, top: subRegion.y, width: WIDTH, height }}
      onMouseDown={() => onSelectSubRegion(subRegion.id)}
      onDragStart={(e) => e.preventDefault()}
      onPointerDown={(event) => {
        if (event.target.closest('button')) return;
        const startX = event.clientX;
        const startY = event.clientY;
        const initialX = subRegion.x;
        const initialY = subRegion.y;
        const move = (e) => onUpdatePosition(subRegion.id, initialX + e.clientX - startX, initialY + e.clientY - startY);
        const up = () => {
          window.removeEventListener('pointermove', move);
          window.removeEventListener('pointerup', up);
          if (onCommitPosition) onCommitPosition();
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
      }}
    >
      <div className="subregion-glow" />
      <div className="subregion-header">
        <div>
          <span className="eyebrow">SUB-REGIÃO</span>
          <strong>{subRegion.name}</strong>
        </div>
        <div className="subregion-header-actions">
          {onShowAllNodes && (
            <button
              type="button"
              className="detail-btn"
              title={visibleNodes.length === allNodes.length ? 'Ocultar pontos intermediários' : 'Mostrar todos os pontos na tela'}
              onClick={(e) => {
                e.stopPropagation();
                onShowAllNodes(subRegion.id, !(visibleNodes.length === allNodes.length));
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {visibleNodes.length === allNodes.length ? (
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
          <button
            type="button"
            className="detail-btn"
            title="Abrir detalhes"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetail(subRegion.id);
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
          <span className="branch-chip">{subRegion.branches} RAMAS</span>
        </div>
      </div>

      <div
        className="subregion-body"
        style={{
          height: bodyHeight,
          position: 'relative'
        }}
      >
        {visibleNodes.map((node, index) => (
          <NodeTerminal
            key={node.id}
            node={node}
            globalNumber={globalNumbers.get(node.id) ?? node.number}
            selected={selectedNodeId === node.id}
            connected={connectedNodeIds.has(node.id)}
            onClick={onSelectNode}
            top={positions[index]}
          />
        ))}
      </div>

      <div className="subregion-footer">
        <span>{visibleNodes.length}/{allNodes.length} nós</span>
        <span>✂ {subRegion.openings.length} cortes</span>
      </div>
    </section>
  );
}

export { WIDTH as SUBREGION_WIDTH };
