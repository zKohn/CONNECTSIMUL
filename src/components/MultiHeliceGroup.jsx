import React, { useMemo } from 'react';
import { buildSubRegionNodes } from '../model/electricalModel';
import NodeTerminal from './NodeTerminal';

const WIDTH = 220;
const HEADER_HEIGHT = 56;
const FOOTER_HEIGHT = 28;
const TOP_PADDING = 24;
const BOTTOM_PADDING = 24;
const NODE_SPACING = 36;
const MIN_BODY_HEIGHT = 90;

export function getMultiHeliceGroupHeight() {
  const bodyHeight = TOP_PADDING + NODE_SPACING + BOTTOM_PADDING;
  return HEADER_HEIGHT + bodyHeight + FOOTER_HEIGHT;
}

export function getMultiHeliceExternalNodes(subs, connections = []) {
  if (!subs || subs.length === 0) return [];
  const groupSubIds = new Set(subs.map((s) => s.id));
  const internalConnNodeIds = new Set();

  for (const conn of connections) {
    if (groupSubIds.has(conn.fromSubRegionId) && groupSubIds.has(conn.toSubRegionId)) {
      internalConnNodeIds.add(conn.from);
      internalConnNodeIds.add(conn.to);
    }
  }

  const externalNodes = [];
  for (const sub of subs) {
    const nodes = buildSubRegionNodes(sub);
    for (const node of nodes) {
      if (!internalConnNodeIds.has(node.id)) {
        externalNodes.push(node);
      }
    }
  }

  // Ordena para que o nó (-) fique embaixo e (+) em cima
  externalNodes.sort((a, b) => (a.polarity === '-' ? -1 : 1));
  return externalNodes;
}

export function getMultiHelicePortPoint(groupSubs, nodeNumber, connections = []) {
  const externalNodes = getMultiHeliceExternalNodes(groupSubs, connections);
  const targetIndex = externalNodes.findIndex((n) => n.number === nodeNumber);
  if (targetIndex < 0) return null;

  const firstSub = groupSubs[0];
  const bodyHeight = TOP_PADDING + NODE_SPACING + BOTTOM_PADDING;
  const bottom = bodyHeight - BOTTOM_PADDING;
  const y = HEADER_HEIGHT + (bottom - targetIndex * NODE_SPACING);

  return {
    leftX: firstSub.x + 12,
    rightX: firstSub.x + 200,
    y: firstSub.y + y,
  };
}

export default function MultiHeliceGroup({
  groupId,
  subs,
  selectedNodeId,
  globalNumbers,
  connections,
  onSelectNode,
  onUpdatePosition,
  onCommitPosition,
  onSelectGroup,
  onOpenDetail,
}) {
  const firstSub = subs[0];
  const externalNodes = useMemo(
    () => getMultiHeliceExternalNodes(subs, connections),
    [subs, connections]
  );

  const height = getMultiHeliceGroupHeight();
  const bodyHeight = TOP_PADDING + NODE_SPACING + BOTTOM_PADDING;
  const bottom = bodyHeight - BOTTOM_PADDING;
  const positions = externalNodes.map((_, index) => bottom - index * NODE_SPACING);

  const connectedNodeIds = useMemo(() => {
    const set = new Set();
    const subIds = new Set(subs.map((s) => s.id));
    for (const conn of connections || []) {
      // Conexões externas com outras subs
      if (subIds.has(conn.fromSubRegionId) && !subIds.has(conn.toSubRegionId)) {
        set.add(conn.from);
      }
      if (subIds.has(conn.toSubRegionId) && !subIds.has(conn.fromSubRegionId)) {
        set.add(conn.to);
      }
    }
    return set;
  }, [connections, subs]);

  const groupName = useMemo(() => {
    if (!firstSub) return 'HÉLICE MÚLTIPLA';
    const prefix = firstSub.name ? firstSub.name.replace(/\s*\d+$/, '').trim() : 'HÉLICE';
    return `${prefix} (${subs.length}x)`;
  }, [firstSub, subs.length]);

  return (
    <section
      className="subregion multi-helice-group-block"
      style={{ left: firstSub.x, top: firstSub.y, width: WIDTH, height }}
      onMouseDown={() => onSelectGroup(groupId)}
      onPointerDown={(event) => {
        if (event.target.closest('button')) return;
        const startX = event.clientX;
        const startY = event.clientY;
        const initialX = firstSub.x;
        const initialY = firstSub.y;
        const move = (e) =>
          onUpdatePosition(groupId, initialX + e.clientX - startX, initialY + e.clientY - startY);
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
          <span className="eyebrow" style={{ color: 'var(--green)' }}>HÉLICE MÚLTIPLA</span>
          <strong>{groupName}</strong>
        </div>
        <div className="subregion-header-actions">
          <button
            className="detail-btn"
            title="Abrir detalhes da hélice múltipla"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetail(groupId);
            }}
          >
            ⊕
          </button>
          <span className="branch-chip" style={{ borderColor: 'rgba(89, 227, 145, 0.35)', color: 'var(--green)' }}>
            {subs.length} HÉLICES
          </span>
        </div>
      </div>

      <div
        className="subregion-body"
        style={{
          height: bodyHeight,
          position: 'relative',
        }}
      >
        <div className="branch-column" aria-hidden="true">
          <span style={{ top: (positions[0] + positions[positions.length - 1]) / 2, color: 'var(--green)', borderColor: 'rgba(89, 227, 145, 0.25)' }}>
            {subs.length} RAMAS
          </span>
        </div>

        {externalNodes.map((node, index) => (
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
        <span>2 nós externos</span>
        <span style={{ color: 'var(--green)' }}>{subs.length} em série</span>
      </div>
    </section>
  );
}

export { WIDTH as MULTI_HELICE_WIDTH };

