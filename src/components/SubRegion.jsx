import React, { useMemo } from 'react';
import { buildSubRegionNodes, getVisibleNodes } from '../model/electricalModel';
import NodeTerminal from './NodeTerminal';

const WIDTH = 220;
const HEADER_HEIGHT = 56;
const FOOTER_HEIGHT = 28;
const TOP_PADDING = 24;
const BOTTOM_PADDING = 24;
const NODE_SPACING = 28;
const MIN_BODY_HEIGHT = 80;

export function getSubRegionHeight(subRegion, connections = []) {
  const count = getVisibleNodes(subRegion, connections).length;
  const nodeSpan = Math.max(0, count - 1) * NODE_SPACING;
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

  const count = visibleNodes.length;
  const nodeSpan = Math.max(0, count - 1) * NODE_SPACING;
  const bodyHeight = Math.max(MIN_BODY_HEIGHT, TOP_PADDING + nodeSpan + BOTTOM_PADDING);
  const bottom = bodyHeight - BOTTOM_PADDING;
  return HEADER_HEIGHT + (bottom - visibleIndex * NODE_SPACING);
}

export function getSubRegionPortPoint(subRegion, nodeNumber, connections = []) {
  const y = getSubRegionNodeY(subRegion, nodeNumber, connections);
  if (y == null) return null;
  const scrollAdjustedY = subRegion.y + y;
  return {
    leftX: subRegion.x + 12,
    rightX: subRegion.x + 200,
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
}) {
  const allNodes = useMemo(() => buildSubRegionNodes(subRegion), [subRegion]);
  const visibleNodes = useMemo(
    () => getVisibleNodes(subRegion, connections),
    [subRegion, connections]
  );
  const height = getSubRegionHeight(subRegion, connections);
  const nodeCount = visibleNodes.length;

  const nodeSpan = Math.max(0, nodeCount - 1) * NODE_SPACING;
  const bodyHeight = Math.max(MIN_BODY_HEIGHT, TOP_PADDING + nodeSpan + BOTTOM_PADDING);

  const bottom = bodyHeight - BOTTOM_PADDING;
  const positions = visibleNodes.map((_, index) => bottom - index * NODE_SPACING);

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
          <button
            className="detail-btn"
            title="Abrir detalhes"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetail(subRegion.id);
            }}
          >
            ⊕
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
