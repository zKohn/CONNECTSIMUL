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
  onSelectSubRegion,
  onOpenDetail,
}) {
  const globalNumbers = useMemo(() => buildGlobalNumberMap(subRegions), [subRegions]);

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
    <main className="workspace">
      <div className="workspace-grid" />

      <div className="workspace-hint">
        <span className="hint-key">ARRASTE</span> sub-regiões para organizar
        <span className="hint-separator">•</span>
        <span className="hint-key">⊕</span> abrir detalhes
        <span className="hint-separator">•</span>
        <span className="hint-key">CONECTE</span> dois terminais
      </div>

      <ConnectionLayer
        subRegions={subRegions}
        connections={connections}
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
