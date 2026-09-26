import React, { useMemo } from 'react';
import SubRegion from './SubRegion';
import MultiHeliceGroup, { getMultiHeliceExternalNodes } from './MultiHeliceGroup';
import ConnectionLayer from './ConnectionLayer';
import VoltageSourceBlock from './VoltageSourceBlock';
import EarthBlock from './EarthBlock';
import { buildSubRegionNodes } from '../model/electricalModel';
import { buildGlobalNumberMap } from '../model/nodeNumbering';

export default function Workspace({
  subRegions,
  connections,
  selectedNode,
  selectedSubRegionId,
  selectedConnectionId,
  onSelectNode,
  onSelectConnection,
  onUpdatePosition,
  onCommitPosition,
  onSelectSubRegion,
  onOpenDetail,
  onOpenMultiHeliceDetail,
  voltageConfig,
  onUpdateVoltageSourcePosition,
  onCommitVoltagePosition,
  onUpdateVoltageValue,
  onDeleteVoltageSource,
  onUpdateEarthPosition,
  onCommitEarthPosition,
  onDeleteEarth,
}) {
  const workspaceRef = React.useRef(null);
  const globalNumbers = useMemo(() => buildGlobalNumberMap(subRegions), [subRegions]);

  const allSubNodes = useMemo(() => subRegions.flatMap((s) => buildSubRegionNodes(s)), [subRegions]);
  const nodeMap = useMemo(() => new Map(allSubNodes.map((n) => [n.id, n])), [allSubNodes]);

  const formatNodeLabel = (nodeId) => {
    if (!nodeId) return '';
    const node = nodeMap.get(nodeId);
    if (!node) return nodeId;
    const gNum = globalNumbers.get(nodeId) ?? node.number;
    return `${node.polarity || ''}${gNum}`;
  };

  const { singles, groups } = useMemo(() => {
    const singleList = [];
    const groupMap = new Map();

    for (const sub of subRegions) {
      if (sub.groupId) {
        if (!groupMap.has(sub.groupId)) {
          groupMap.set(sub.groupId, []);
        }
        groupMap.get(sub.groupId).push(sub);
      } else {
        singleList.push(sub);
      }
    }

    return { singles: singleList, groups: Array.from(groupMap.entries()) };
  }, [subRegions]);

  const canvasWidth = useMemo(() => {
    const subMaxX = Math.max(0, ...subRegions.map((s) => s.x + 350));
    const vsMaxX = voltageConfig?.source ? voltageConfig.source.x + 300 : 0;
    const earthMaxX = Math.max(0, ...(voltageConfig?.earths || []).map((e) => e.x + 200));
    const maxX = Math.max(subMaxX, vsMaxX, earthMaxX);
    return Math.max(2600, maxX + 800);
  }, [subRegions, voltageConfig]);

  const canvasHeight = useMemo(() => {
    const subMaxY = Math.max(0, ...subRegions.map((s) => s.y + 700));
    const vsMaxY = voltageConfig?.source ? voltageConfig.source.y + 300 : 0;
    const earthMaxY = Math.max(0, ...(voltageConfig?.earths || []).map((e) => e.y + 200));
    const maxY = Math.max(subMaxY, vsMaxY, earthMaxY);
    return Math.max(1000, maxY + 400);
  }, [subRegions, voltageConfig]);

  const isPanningRef = React.useRef(false);
  const panStartRef = React.useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  const handleWheel = (e) => {
    // Roda do mouse: rolagem apenas na vertical
    e.preventDefault();
    if (workspaceRef.current) {
      const delta = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaY;
      workspaceRef.current.scrollTop += delta;
    }
  };

  const handlePointerDownWorkspace = (e) => {
    // Se o elemento clicado faz parte de uma conexão clicável, não inicia pan
    if (e.target.closest && e.target.closest('.connection-group')) return;

    // Só inicia pan se clicou no fundo do workspace (não em blocos/botões/terminais)
    const isBackground =
      e.target === workspaceRef.current ||
      e.target.classList.contains('workspace-grid') ||
      e.target.classList.contains('connection-layer');
    if (!isBackground) return;

    let hasMoved = false;
    isPanningRef.current = true;
    const ws = workspaceRef.current;
    panStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: ws.scrollLeft,
      scrollTop: ws.scrollTop,
    };
    ws.style.cursor = 'grabbing';
    e.preventDefault();

    const onMove = (ev) => {
      if (!isPanningRef.current) return;
      const dx = ev.clientX - panStartRef.current.x;
      const dy = ev.clientY - panStartRef.current.y;
      if (Math.hypot(dx, dy) > 4) {
        hasMoved = true;
      }
      ws.scrollLeft = panStartRef.current.scrollLeft - dx;
      ws.scrollTop = panStartRef.current.scrollTop - dy;
    };

    const onUp = () => {
      isPanningRef.current = false;
      ws.style.cursor = '';
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      // Se apenas clicou no fundo sem arrastar, desseleciona conexão e sub-região
      if (!hasMoved) {
        onSelectConnection?.(null);
        onSelectSubRegion?.(null);
      }
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const outputNodes = useMemo(() => {
    const result = [];
    for (const sub of singles) {
      for (const node of buildSubRegionNodes(sub)) {
        if (node.isOutput) {
          result.push({ ...node, subRegionName: sub.name });
        }
      }
    }
    for (const [, subs] of groups) {
      const ext = getMultiHeliceExternalNodes(subs, connections);
      result.push(...ext);
    }
    return result;
  }, [singles, groups, connections]);

  // Checar conexões da fonte de tensão
  const vsConnection = useMemo(() => {
    return connections.find(
      (c) => c.fromSubRegionId === 'voltage-source' || c.toSubRegionId === 'voltage-source'
    );
  }, [connections]);

  const vsConnectedNodeId = vsConnection
    ? (vsConnection.fromSubRegionId === 'voltage-source' ? vsConnection.to : vsConnection.from)
    : null;

  // Checar conexões de cada bloco de terra
  const earthConnectionMap = useMemo(() => {
    const map = new Map();
    for (const c of connections) {
      if (c.fromSubRegionId && c.fromSubRegionId.startsWith('earth')) {
        map.set(c.fromSubRegionId, c.to);
      } else if (c.toSubRegionId && c.toSubRegionId.startsWith('earth')) {
        map.set(c.toSubRegionId, c.from);
      }
    }
    return map;
  }, [connections]);

  return (
    <main
      className="workspace"
      ref={workspaceRef}
      onWheel={handleWheel}
      onPointerDown={handlePointerDownWorkspace}
    >
      <div className="workspace-grid" style={{ width: canvasWidth, minWidth: canvasWidth, height: canvasHeight }} />

      <div className="workspace-hint">
        <span className="hint-key">ARRASTE A TELA</span> para navegar
        <span className="hint-separator">•</span>
        <span className="hint-key">⊕</span> abrir detalhes
        <span className="hint-separator">•</span>
        <span className="hint-key">CONECTE</span> terminais
        <span className="hint-separator">•</span>
        <span className="hint-key">R</span> girar pino
        <span className="hint-separator">•</span>
        <span className="hint-key">DEL</span> apagar
      </div>

      <ConnectionLayer
        subRegions={subRegions}
        connections={connections}
        width={canvasWidth}
        height={canvasHeight}
        voltageSource={voltageConfig?.source}
        earths={voltageConfig?.earths || []}
        selectedConnectionId={selectedConnectionId}
        onSelectConnection={onSelectConnection}
      />

      {singles.map((sub) => (
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

      {groups.map(([groupId, subs]) => (
        <MultiHeliceGroup
          key={groupId}
          groupId={groupId}
          subs={subs}
          globalNumbers={globalNumbers}
          connections={connections}
          selectedNodeId={selectedNode?.id}
          onSelectNode={onSelectNode}
          onUpdatePosition={onUpdatePosition}
          onCommitPosition={onCommitPosition}
          onSelectGroup={onSelectSubRegion}
          onOpenDetail={onOpenMultiHeliceDetail}
        />
      ))}

      {/* Ponto/Pino Fonte de Tensão */}
      {voltageConfig?.source && (
        <VoltageSourceBlock
          source={voltageConfig.source}
          voltageValue={voltageConfig.voltageValue}
          selectedNodeId={selectedNode?.id}
          isSelected={selectedSubRegionId === 'voltage-source'}
          isConnected={Boolean(vsConnectedNodeId)}
          connectedNodeLabel={formatNodeLabel(vsConnectedNodeId)}
          onSelectNode={onSelectNode}
          onSelect={onSelectSubRegion}
          onUpdatePosition={onUpdateVoltageSourcePosition}
          onCommitPosition={onCommitVoltagePosition}
        />
      )}

      {/* Ponto/Pino de Terra (Ground Reference) */}
      {(voltageConfig?.earths || []).map((earth) => {
        const connectedNodeId = earthConnectionMap.get(earth.id);
        return (
          <EarthBlock
            key={earth.id}
            earth={earth}
            selectedNodeId={selectedNode?.id}
            isSelected={selectedSubRegionId === earth.id}
            isConnected={Boolean(connectedNodeId)}
            connectedNodeLabel={formatNodeLabel(connectedNodeId)}
            onSelectNode={onSelectNode}
            onSelect={onSelectSubRegion}
            onUpdatePosition={onUpdateEarthPosition}
            onCommitPosition={onCommitEarthPosition}
          />
        );
      })}

      {subRegions.length === 0 && !voltageConfig?.source && (!voltageConfig?.earths || voltageConfig.earths.length === 0) && (
        <div className="empty-workspace">
          <div className="empty-orbit">⚡</div>
          <h2>Comece criando uma sub-região</h2>
          <p>Defina as ramas e depois abra os pontos onde deseja criar saídas.</p>
        </div>
      )}

      <div className="node-legend">
        <span><i className="legend-dot output" /> Ponto conectável</span>
        <span><i className="legend-line" /> Conexão</span>
        <span><span style={{ color: 'var(--amber)', marginRight: 4 }}>⚡</span> Fonte (kV)</span>
        <span><span style={{ color: 'var(--green)', marginRight: 4 }}>⏚</span> Terra</span>
      </div>

      <div className="output-count">
        {outputNodes.length} pontos conectáveis
      </div>
    </main>
  );
}
