import React, { useMemo } from 'react';
import SubRegion from './SubRegion';
import ConnectionLayer from './ConnectionLayer';
import { buildSubRegionNodes } from '../model/electricalModel';
import { buildGlobalNumberMap } from '../model/nodeNumbering';

export default function Workspace({
  subRegions,
  connections,
  selectedNode,
  selectedSubRegionId,
  onSelectNode,
  onUpdatePosition,
  onCommitPosition,
  onSelectSubRegion,
  onOpenDetail,
}) {
  const workspaceRef = React.useRef(null);
  const globalNumbers = useMemo(() => buildGlobalNumberMap(subRegions), [subRegions]);

  const canvasWidth = useMemo(() => {
    const maxX = Math.max(0, ...subRegions.map((s) => s.x + 350));
    return Math.max(2600, maxX + 800);
  }, [subRegions]);

  const canvasHeight = useMemo(() => {
    const maxY = Math.max(0, ...subRegions.map((s) => s.y + 700));
    return Math.max(1000, maxY + 400);
  }, [subRegions]);

  const handleWheel = (e) => {
    // Permite rolar horizontalmente com a roda do mouse quando não estiver segurando shift
    if (workspaceRef.current && e.deltaY && !e.shiftKey) {
      workspaceRef.current.scrollLeft += e.deltaY * 0.85;
    }
  };

  const outputNodes = useMemo(() => {
    const result = [];
    for (const sub of subRegions) {
      for (const node of buildSubRegionNodes(sub)) {
        if (node.isOutput) {
          result.push({ ...node, subRegionName: sub.name });
        }
      }
    }
    return result;
  }, [subRegions]);

  return (
    <main className="workspace" ref={workspaceRef} onWheel={handleWheel}>
      <div className="workspace-grid" style={{ width: canvasWidth, minWidth: canvasWidth, height: canvasHeight }} />

      <div className="workspace-hint">
        <span className="hint-key">ARRASTE</span> sub-regiões para organizar
        <span className="hint-separator">•</span>
        <span className="hint-key">⊕</span> abrir detalhes
        <span className="hint-separator">•</span>
        <span className="hint-key">CONECTE</span> dois terminais
        <span className="hint-separator">•</span>
        <span className="hint-key">SCROLL</span> navegue na horizontal
      </div>

      <ConnectionLayer
        subRegions={subRegions}
        connections={connections}
        width={canvasWidth}
        height={canvasHeight}
      />

      {subRegions.map((sub) => (
        <SubRegion
          key={sub.id}
          subRegion={sub}
          globalNumbers={globalNumbers}
          connections={connections}
          selectedNodeId={selectedNode?.id}
          onSelectNode={onSelectNode}
          onUpdatePosition={onUpdatePosition}
          onCommitPosition={onCommitPosition}
          onSelectSubRegion={onSelectSubRegion}
          onOpenDetail={onOpenDetail}
        />
      ))}

      {subRegions.length === 0 && (
        <div className="empty-workspace">
          <div className="empty-orbit">⚡</div>
          <h2>Comece criando uma sub-região</h2>
          <p>Defina as ramas e depois abra os pontos onde deseja criar saídas.</p>
        </div>
      )}

      <div className="node-legend">
        <span><i className="legend-dot output" /> Ponto conectável</span>
        <span><i className="legend-line" /> Conexão</span>
      </div>

      <div className="output-count">
        {outputNodes.length} pontos conectáveis
      </div>
    </main>
  );
}
