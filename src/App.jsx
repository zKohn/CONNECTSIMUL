import React, { useMemo, useState, useCallback } from 'react';
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
import MultiHeliceModal from './components/MultiHeliceModal';
import { useHistory } from './hooks/useHistory';

function makeInitialState() {
  return {
    subRegions: [
      createSubRegion({
        id: 'sub-1',
        name: 'SUB 01',
        x: 80,
        y: 100,
        branches: 4,
        topPolarity: '+',
      }),
      createSubRegion({
        id: 'sub-2',
        name: 'SUB 02',
        x: 340,
        y: 100,
        branches: 5,
        topPolarity: '-',
      }),
    ],
    connections: [],
  };
}

export default function App() {
  const {
    state,
    setState,
    setStateNoHistory,
    commit,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useHistory(makeInitialState());

  const { subRegions, connections } = state;

  const [selectedSubRegionId, setSelectedSubRegionId] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showTable, setShowTable] = useState(false);
  const [showMultiHeliceModal, setShowMultiHeliceModal] = useState(false);
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

  // ── Keyboard shortcuts ──────────────────────────────────────────────────────
  React.useEffect(() => {
    function handleKeyDown(e) {
      // Undo: Ctrl+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        e.preventDefault();
        undo();
        return;
      }
      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        e.preventDefault();
        redo();
        return;
      }
      // Delete sub-region
      if (e.key === 'Delete' && selectedSubRegionId) {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
          deleteSubRegion(selectedSubRegionId);
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedSubRegionId, undo, redo]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  function addSubRegion() {
    const index = subRegions.length + 1;
    const startX = subRegions.length > 0
      ? Math.max(...subRegions.map((s) => s.x)) + 260
      : 80;

    const sub = createSubRegion({
      id: `sub-${Date.now()}`,
      name: `SUB ${String(index).padStart(2, '0')}`,
      x: startX,
      y: 100,
      branches: 4,
      topPolarity: '+',
    });

    setState((prev) => ({ ...prev, subRegions: [...prev.subRegions, sub] }));
    setSelectedSubRegionId(sub.id);
    setSelectedNode(null);
  }

  function addMultiHeliceSubRegion(count, prefix = 'HÉLICE', topPolarity = '+') {
    const num = Math.max(1, Math.min(64, Number(count) || 8));
    const startX = subRegions.length > 0
      ? Math.max(...subRegions.map((s) => s.x)) + 260
      : 80;
    const fixedY = 100;

    const heliceOrder = [];
    let left = 1;
    let right = num;
    while (left <= right) {
      heliceOrder.push(left);
      if (left !== right) heliceOrder.push(right);
      left++;
      right--;
    }

    const groupId = `helice-group-${Date.now()}`;

    const newSubs = [];
    for (let i = 0; i < heliceOrder.length; i++) {
      const heliceNum = heliceOrder[i];
      newSubs.push(
        createSubRegion({
          id: `sub-helice-${Date.now()}-${i}-${heliceNum}`,
          name: `${prefix} ${String(heliceNum).padStart(2, '0')}`,
          x: startX + i * 250,
          y: fixedY,
          branches: 1,
          topPolarity: topPolarity,
          groupId,
          heliceIndex: heliceNum,
        })
      );
    }

    const newConnections = [];
    for (let i = 0; i < newSubs.length - 1; i++) {
      const currentSub = newSubs[i];
      const nextSub = newSubs[i + 1];
      const currentNodes = buildSubRegionNodes(currentSub);
      const nextNodes = buildSubRegionNodes(nextSub);
      const fromNode = currentNodes.find((n) => n.polarity === '-' || n.position === 0);
      const toNode = nextNodes.find((n) => n.polarity === '+' || n.position === 1);
      if (fromNode && toNode) {
        newConnections.push({
          id: `connection-${Date.now()}-${i}`,
          from: fromNode.id,
          to: toNode.id,
          fromSubRegionId: currentSub.id,
          toSubRegionId: nextSub.id,
          fromNumber: fromNode.number,
          toNumber: toNode.number,
        });
      }
    }

    setState((prev) => ({
      subRegions: [...prev.subRegions, ...newSubs],
      connections: [...prev.connections, ...newConnections],
    }));
    setSelectedNode(null);
    setNotice(`${num} sub-regiões hélice criadas na sequência 1, N, 2, N-1... com ligações automáticas (-) → (+).`);
  }

  function updateSubRegion(nextSub) {
    const validNodeIds = new Set(buildSubRegionNodes(nextSub).map((node) => node.id));
    const cleanedSub = {
      ...nextSub,
      visibleNodes: (nextSub.visibleNodes || []).filter((id) => validNodeIds.has(id)),
    };

    setState((prev) => ({
      subRegions: prev.subRegions.map((sub) => sub.id === cleanedSub.id ? cleanedSub : sub),
      connections: prev.connections
        .filter((c) => validNodeIds.has(c.from) || c.fromSubRegionId !== cleanedSub.id)
        .filter((c) => validNodeIds.has(c.to) || c.toSubRegionId !== cleanedSub.id),
    }));
  }

  /** Chamado enquanto arrasta — sem registrar no histórico */
  function updatePosition(id, x, y) {
    setStateNoHistory((prev) => ({
      ...prev,
      subRegions: prev.subRegions.map((sub) =>
        sub.id === id ? { ...sub, x: Math.max(30, x), y: Math.max(80, y) } : sub
      ),
    }));
  }

  /** Chamado ao soltar o drag — salva snapshot */
  function commitPosition() {
    commit();
  }

  function deleteSubRegion(id) {
    setState((prev) => ({
      subRegions: prev.subRegions.filter((sub) => sub.id !== id),
      connections: prev.connections.filter(
        (conn) => conn.fromSubRegionId !== id && conn.toSubRegionId !== id
      ),
    }));
    if (selectedSubRegionId === id) setSelectedSubRegionId(null);
  }

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

    setState((prev) => ({ ...prev, connections: [...prev.connections, connection] }));
    setSelectedNode(null);
    setNotice('Conexão criada.');
  }

  function deleteConnectionsForSelectedNode() {
    if (!selectedNode) return;
    setState((prev) => ({
      ...prev,
      connections: prev.connections.filter(
        (c) => c.from !== selectedNode.id && c.to !== selectedNode.id
      ),
    }));
    setSelectedNode(null);
    setNotice('Conexões do ponto removidas.');
  }

  function toggleSubOpening(subId, position) {
    setState((prev) => ({
      ...prev,
      subRegions: prev.subRegions.map((sub) =>
        sub.id === subId ? toggleOpening(sub, position) : sub
      ),
    }));
    setSelectedNode(null);
    setNotice(`Abertura entre ramas ${position} e ${position + 1} atualizada.`);
  }

  function toggleNodeVisibility(subId, nodeId) {
    setState((prev) => ({
      ...prev,
      subRegions: prev.subRegions.map((sub) => {
        if (sub.id !== subId) return sub;
        const visibleNodes = sub.visibleNodes || [];
        const has = visibleNodes.includes(nodeId);
        return {
          ...sub,
          visibleNodes: has
            ? visibleNodes.filter((id) => id !== nodeId)
            : [...visibleNodes, nodeId],
        };
      }),
    }));
  }

  const detailSubRegion = subRegions.find((s) => s.id === detailSubRegionId) || null;

  function exportCsv() {
    const errors = validateConnectivity(subRegions, connections);
    if (errors.length) { setNotice(errors[0]); return; }
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
        onOpenMultiHeliceModal={() => setShowMultiHeliceModal(true)}
        onDeleteConnection={deleteConnectionsForSelectedNode}
        onClearSelection={() => { setSelectedNode(null); setNotice(null); }}
        onExport={exportCsv}
        connectionMode={Boolean(selectedNode)}
        selectedNode={selectedNode}
        onOpenTable={() => setShowTable(true)}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />

      <div className="app-main">
        <Workspace
          subRegions={subRegions}
          connections={connections}
          selectedNode={selectedNode}
          selectedSubRegionId={selectedSubRegionId}
          onSelectNode={selectNode}
          onUpdatePosition={updatePosition}
          onCommitPosition={commitPosition}
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

      {showMultiHeliceModal && (
        <MultiHeliceModal
          onClose={() => setShowMultiHeliceModal(false)}
          onCreate={addMultiHeliceSubRegion}
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

