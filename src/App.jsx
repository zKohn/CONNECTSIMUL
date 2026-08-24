import React, { useMemo, useState } from 'react';
import Toolbar from './components/Toolbar';
import Workspace from './components/Workspace';
import PropertiesPanel from './components/PropertiesPanel';
import ConnectionTable from './components/ConnectionTable';
import {
  createSubRegion,
  toggleOpening,
  buildSubRegionNodes,
} from './model/electricalModel';
import { buildGlobalNumberMap, buildGlobalBranchMap } from './model/nodeNumbering';
import {
  buildTableRows,
  exportRowsToCsv,
  validateConnectivity,
} from './model/connectivity';
import SubRegionDetail from './components/SubRegionDetail';

function initialSubRegions() {
  return [
    createSubRegion({
      id: 'sub-1',
      name: 'SUB 01',
      x: 220,
      y: 150,
      branches: 4,
      topPolarity: '+',
    }),
    createSubRegion({
      id: 'sub-2',
      name: 'SUB 02',
      x: 650,
      y: 250,
      branches: 5,
      topPolarity: '-',
    }),
  ];
}

export default function App() {
  const [subRegions, setSubRegions] = useState(initialSubRegions);
  const [connections, setConnections] = useState([]);
  const [selectedSubRegionId, setSelectedSubRegionId] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showTable, setShowTable] = useState(false);
  const [notice, setNotice] = useState(null);
  const [detailSubRegionId, setDetailSubRegionId] = useState(null);

  const globalNumbers = useMemo(
    () => buildGlobalNumberMap(subRegions),
    [subRegions]
  );

  const globalBranches = useMemo(
    () => buildGlobalBranchMap(subRegions),
    [subRegions]
  );

  const rows = useMemo(
    () => buildTableRows(subRegions, connections),
    [subRegions, connections]
  );

  const selectedSubRegion = subRegions.find((s) => s.id === selectedSubRegionId) || null;

  function addSubRegion() {
    const index = subRegions.length + 1;
    const offset = subRegions.length % 4;

    const sub = createSubRegion({
      id: `sub-${Date.now()}`,
      name: `SUB ${String(index).padStart(2, '0')}`,
      x: 160 + offset * 300,
      y: 140 + Math.floor(subRegions.length / 4) * 420,
      branches: 4,
      topPolarity: '+',
    });

    setSubRegions((current) => [...current, sub]);
    setSelectedSubRegionId(sub.id);
    setSelectedNode(null);
  }

  function updateSubRegion(nextSub) {
    const validNodeIds = new Set(buildSubRegionNodes(nextSub).map((node) => node.id));
    const cleanedSub = {
      ...nextSub,
      visibleNodes: (nextSub.visibleNodes || []).filter((id) => validNodeIds.has(id)),
    };

    setSubRegions((current) =>
      current.map((sub) => sub.id === cleanedSub.id ? cleanedSub : sub)
    );

    setConnections((current) =>
      current.filter((connection) => validNodeIds.has(connection.from) || connection.fromSubRegionId !== cleanedSub.id)
        .filter((connection) => validNodeIds.has(connection.to) || connection.toSubRegionId !== cleanedSub.id)
    );
  }

  function updatePosition(id, x, y) {
    setSubRegions((current) =>
      current.map((sub) =>
        sub.id === id
          ? { ...sub, x: Math.max(30, x), y: Math.max(80, y) }
          : sub
      )
    );
  }

  function deleteSubRegion(id) {
    setSubRegions((current) => current.filter((sub) => sub.id !== id));
    setConnections((current) =>
      current.filter(
        (conn) => conn.fromSubRegionId !== id && conn.toSubRegionId !== id
      )
    );
    if (selectedSubRegionId === id) {
      setSelectedSubRegionId(null);
    }
  }

  React.useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Delete' && selectedSubRegionId) {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
          deleteSubRegion(selectedSubRegionId);
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedSubRegionId]);

  function selectNode(node) {
    if (!node.isOutput) return;

    if (!selectedNode) {
      setSelectedNode(node);
      setNotice(`Ponto ${node.polarity || ''}${globalNumbers.get(node.id)} selecionado. Escolha outro ponto de saída.`);
      return;
    }

    if (selectedNode.id === node.id) {
      setSelectedNode(null);
      setNotice(null);
      return;
    }

    const fromSub = subRegions.find((sub) => sub.id === selectedNode.subRegionId);
    const toSub = subRegions.find((sub) => sub.id === node.subRegionId);

    if (!fromSub || !toSub) return;

    if (fromSub.id === toSub.id) {
      setNotice('A conexão externa deve ligar pontos de sub-regiões diferentes.');
      return;
    }

    const alreadyConnected = connections.some((connection) => {
      return (
        (connection.from === selectedNode.id && connection.to === node.id) ||
        (connection.from === node.id && connection.to === selectedNode.id)
      );
    });

    if (alreadyConnected) {
      setNotice('Esses dois pontos já estão conectados.');
      setSelectedNode(null);
      return;
    }

    const connection = {
      id: `connection-${Date.now()}`,
      from: selectedNode.id,
      to: node.id,
      fromSubRegionId: selectedNode.subRegionId,
      toSubRegionId: node.subRegionId,
      fromNumber: selectedNode.number,
      toNumber: node.number,
    };

    setConnections((current) => [...current, connection]);
    setSelectedNode(null);
    setNotice('Conexão criada.');
  }

  function deleteConnectionsForSelectedNode() {
    if (!selectedNode) return;

    setConnections((current) =>
      current.filter(
        (connection) =>
          connection.from !== selectedNode.id &&
          connection.to !== selectedNode.id
      )
    );

    setSelectedNode(null);
    setNotice('Conexões do ponto removidas.');
  }

  function toggleSubOpening(subId, position) {
    setSubRegions((current) =>
      current.map((sub) =>
        sub.id === subId ? toggleOpening(sub, position) : sub
      )
    );

    setSelectedNode(null);
    setNotice(`Abertura entre ramas ${position} e ${position + 1} atualizada.`);
  }

  function toggleNodeVisibility(subId, nodeId) {
    setSubRegions((current) =>
      current.map((sub) => {
        if (sub.id !== subId) return sub;
        const visibleNodes = sub.visibleNodes || [];
        const has = visibleNodes.includes(nodeId);
        return {
          ...sub,
          visibleNodes: has
            ? visibleNodes.filter((id) => id !== nodeId)
            : [...visibleNodes, nodeId],
        };
      })
    );
  }

  const detailSubRegion = subRegions.find((s) => s.id === detailSubRegionId) || null;

  function exportCsv() {
    const errors = validateConnectivity(subRegions, connections);

    if (errors.length) {
      setNotice(errors[0]);
      return;
    }

    const csv = exportRowsToCsv(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = 'conexoes_eletricas.csv';
    anchor.click();

    URL.revokeObjectURL(url);
    setNotice('CSV exportado com sucesso.');
  }

  return (
    <div className="app-shell">
      <Toolbar
        onAddSubRegion={addSubRegion}
        onDeleteConnection={deleteConnectionsForSelectedNode}
        onClearSelection={() => {
          setSelectedNode(null);
          setNotice(null);
        }}
        onExport={exportCsv}
        connectionMode={Boolean(selectedNode)}
        selectedNode={selectedNode}
        onOpenTable={() => setShowTable(true)}
      />

      <div className="app-main">
        <Workspace
          subRegions={subRegions}
          connections={connections}
          selectedNode={selectedNode}
          selectedSubRegionId={selectedSubRegionId}
          onSelectNode={selectNode}
          onUpdatePosition={updatePosition}
          onSelectSubRegion={setSelectedSubRegionId}
          onOpenDetail={setDetailSubRegionId}
        />

        <PropertiesPanel
          subRegion={selectedSubRegion}
          onChange={updateSubRegion}
          onClose={() => setSelectedSubRegionId(null)}
          onDelete={() => deleteSubRegion(selectedSubRegionId)}
        />
      </div>

      {notice && (
        <div className="toast">
          <span className="toast-icon">●</span>
          {notice}
          <button type="button" onClick={() => setNotice(null)}>×</button>
        </div>
      )}

      {showTable && (
        <ConnectionTable
          rows={rows}
          onClose={() => setShowTable(false)}
        />
      )}

      {detailSubRegion && (
        <SubRegionDetail
          subRegion={detailSubRegion}
          globalNumbers={globalNumbers}
          globalBranches={globalBranches}
          connections={connections}
          onToggleOpening={toggleSubOpening}
          onToggleNodeVisibility={toggleNodeVisibility}
          onClose={() => setDetailSubRegionId(null)}
        />
      )}
    </div>
  );
}
