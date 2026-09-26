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
  validateConnectivity,
  getElectricalGroups,
} from './model/connectivity';


import VoltageTable from './components/VoltageTable';
import VoltageSourceModal from './components/VoltageSourceModal';
import SubRegionDetail from './components/SubRegionDetail';
import MultiHeliceModal from './components/MultiHeliceModal';
import MultiHeliceDetail from './components/MultiHeliceDetail';
import BatchSubRegionModal from './components/BatchSubRegionModal';
import { useHistory } from './hooks/useHistory';

function makeInitialState() {
  return {
    subRegions: [
      createSubRegion({
        id: 'sub-1',
        name: 'SUB 01',
        x: 80,
        y: 100,
        branches: 8,
        topPolarity: '+',
      }),
      createSubRegion({
        id: 'sub-2',
        name: 'SUB 02',
        x: 340,
        y: 100,
        branches: 42,
        topPolarity: '+',
      }),
    ],
    connections: [],
    voltageConfig: {
      appliedNodeId: null,
      voltageValue: '13.8',
      groundedNodeIds: [],
      source: {
        id: 'voltage-source',
        x: 80,
        y: 360,
        enabled: true,
      },
      earths: [
        {
          id: 'earth-1',
          x: 80,
          y: 490,
        },
      ],
    },
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

  const { subRegions, connections, voltageConfig } = state;

  const [selectedSubRegionId, setSelectedSubRegionId] = useState(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState(null);
  const [showVoltageModal, setShowVoltageModal] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showConnectionTable, setShowConnectionTable] = useState(false);
  const [showVoltageTable, setShowVoltageTable] = useState(false);
  const [showMultiHeliceModal, setShowMultiHeliceModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [notice, setNotice] = useState(null);
  const [detailSubRegionId, setDetailSubRegionId] = useState(null);
  const [detailMultiHeliceGroupId, setDetailMultiHeliceGroupId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const globalNumbers = useMemo(
    () => buildGlobalNumberMap(subRegions),
    [subRegions]
  );

  const globalBranches = useMemo(
    () => buildGlobalBranchMap(subRegions),
    [subRegions]
  );

  const { groundedSubNodeIds } = useMemo(
    () => getElectricalGroups(subRegions, connections),
    [subRegions, connections]
  );

  const rows = useMemo(
    () => buildTableRows(subRegions, connections),
    [subRegions, connections]
  );

  const allNodes = useMemo(() => subRegions.flatMap((s) => buildSubRegionNodes(s)), [subRegions]);
  const nodeMap = useMemo(() => new Map(allNodes.map((n) => [n.id, n])), [allNodes]);

  const formatNodeLabel = useCallback((nodeId) => {
    if (!nodeId) return '';
    const node = nodeMap.get(nodeId);
    if (!node) return nodeId;
    const gNum = globalNumbers.get(nodeId) ?? node.number;
    return `${node.polarity || ''}${gNum}`;
  }, [nodeMap, globalNumbers]);

  const vsConnection = useMemo(() => {
    return connections.find(
      (c) => c.fromSubRegionId === 'voltage-source' || c.toSubRegionId === 'voltage-source'
    );
  }, [connections]);

  const vsConnectedNodeId = vsConnection
    ? (vsConnection.fromSubRegionId === 'voltage-source' ? vsConnection.to : vsConnection.from)
    : null;

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

  const selectedSubRegion = useMemo(() => {
    if (!selectedSubRegionId) return null;
    if (selectedSubRegionId === 'voltage-source') {
      return {
        id: 'voltage-source',
        type: 'voltage-source',
        name: 'Fonte de Tensão',
        voltageValue: voltageConfig?.voltageValue,
        rotation: voltageConfig?.source?.rotation || 0,
        isConnected: Boolean(vsConnectedNodeId),
        connectedNodeLabel: formatNodeLabel(vsConnectedNodeId),
      };
    }
    if (selectedSubRegionId.startsWith('earth')) {
      const earth = (voltageConfig?.earths || []).find((e) => e.id === selectedSubRegionId);
      const connNodeId = earthConnectionMap.get(selectedSubRegionId);
      return {
        id: selectedSubRegionId,
        type: 'earth',
        name: 'Ponto de Terra (0 kV)',
        rotation: earth?.rotation || 0,
        earth,
        isConnected: Boolean(connNodeId),
        connectedNodeLabel: formatNodeLabel(connNodeId),
      };
    }
    if (selectedSubRegionId.startsWith('helice-group')) {
      const groupSubs = subRegions.filter((s) => s.groupId === selectedSubRegionId);
      if (groupSubs.length === 0) return null;
      const first = groupSubs[0];
      return {
        id: selectedSubRegionId,
        name: first.name ? `${first.name.replace(/\s*\d+$/, '').trim()} (${groupSubs.length}x)` : 'HÉLICE MÚLTIPLA',
        isGroup: true,
        branches: groupSubs.length,
        openings: [],
        topPolarity: first.topPolarity,
        groupSubs,
      };
    }
    return subRegions.find((s) => s.id === selectedSubRegionId) || null;
  }, [subRegions, selectedSubRegionId, voltageConfig, vsConnectedNodeId, earthConnectionMap, formatNodeLabel]);

  function handleDeleteSelected(idToDelete) {
    const id = idToDelete || selectedSubRegionId;
    if (!id) return;
    if (id === 'voltage-source') {
      deleteVoltageSource();
      setSelectedSubRegionId(null);
    } else if (typeof id === 'string' && id.startsWith('earth')) {
      deleteEarth(id);
      setSelectedSubRegionId(null);
    } else {
      deleteSubRegion(id);
    }
  }

  const rotateSelectedPin = React.useCallback(() => {
    if (!selectedSubRegionId) return;
    if (selectedSubRegionId === 'voltage-source') {
      setState((prev) => ({
        ...prev,
        voltageConfig: {
          ...prev.voltageConfig,
          source: {
            ...(prev.voltageConfig?.source || { id: 'voltage-source', x: 80, y: 390 }),
            rotation: (((prev.voltageConfig?.source?.rotation || 0) + 90) % 360),
          },
        },
      }));
      commit();
      setNotice('Fonte de tensão rotacionada (90°).');
    } else if (typeof selectedSubRegionId === 'string' && selectedSubRegionId.startsWith('earth')) {
      setState((prev) => ({
        ...prev,
        voltageConfig: {
          ...prev.voltageConfig,
          earths: (prev.voltageConfig?.earths || []).map((e) =>
            e.id === selectedSubRegionId
              ? { ...e, rotation: (((e.rotation || 0) + 90) % 360) }
              : e
          ),
        },
      }));
      commit();
      setNotice('Ponto de terra rotacionado (90°).');
    }
  }, [selectedSubRegionId, setState, commit, setNotice]);

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
      // Rotate selected pin: 'r' or 'R'
      if ((e.key === 'r' || e.key === 'R') && selectedSubRegionId) {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
          if (selectedSubRegionId === 'voltage-source' || selectedSubRegionId.startsWith('earth')) {
            e.preventDefault();
            rotateSelectedPin();
            return;
          }
        }
      }
      // Delete connection
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedConnectionId) {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          deleteSingleConnection(selectedConnectionId);
          return;
        }
      }
      // Delete selected sub-region, voltage source, or earth pin
      if (e.key === 'Delete' && selectedSubRegionId) {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
          handleDeleteSelected(selectedSubRegionId);
          return;
        }
      }
      // Escape: limpar seleções (mesmo sentido de clicar em LIMPAR)
      if (e.key === 'Escape') {
        e.preventDefault();
        if (document.activeElement && typeof document.activeElement.blur === 'function') {
          document.activeElement.blur();
        }
        setSelectedNode(null);
        setSelectedConnectionId(null);
        setSelectedSubRegionId(null);
        setNotice(null);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedSubRegionId, selectedConnectionId, undo, redo, deleteSingleConnection, deleteSubRegion, deleteVoltageSource, deleteEarth, rotateSelectedPin]);

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
          x: startX,
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
      const fromNode =
        currentNodes.find((n) => n.polarity === '-') ||
        (currentSub.topPolarity === '-' ? currentNodes[currentNodes.length - 1] : currentNodes[0]);
      const toNode =
        nextNodes.find((n) => n.polarity === '+') ||
        (nextSub.topPolarity === '-' ? nextNodes[0] : nextNodes[nextNodes.length - 1]);
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
      ...prev,
      subRegions: [...prev.subRegions, ...newSubs],
      connections: [...prev.connections, ...newConnections],
    }));
    setSelectedNode(null);
    setNotice(`${num} sub-regiões hélice criadas. Apenas os 2 nós externos estão expostos na tela principal.`);
  }

  function addBatchSubRegions(batchRows) {
    if (!batchRows || batchRows.length === 0) return;

    let currentX = subRegions.length > 0
      ? Math.max(...subRegions.map((s) => s.x)) + 260
      : 80;
    const fixedY = 100;

    const allNewSubs = [];
    const allNewConnections = [];
    let standardSubCounter = subRegions.filter((s) => !s.groupId).length + 1;

    batchRows.forEach((item, itemIdx) => {
      const topPolarity = item.topPolarity === '-' ? '-' : '+';
      const count = Math.max(1, Math.min(64, Number(item.count) || 4));

      if (item.type === 'helice') {
        const prefix = (item.name || '').trim() || 'HÉLICE';
        const heliceOrder = [];
        let left = 1;
        let right = count;
        while (left <= right) {
          heliceOrder.push(left);
          if (left !== right) heliceOrder.push(right);
          left++;
          right--;
        }

        const groupId = `helice-group-${Date.now()}-${itemIdx}`;
        const groupSubs = [];

        for (let i = 0; i < heliceOrder.length; i++) {
          const heliceNum = heliceOrder[i];
          groupSubs.push(
            createSubRegion({
              id: `sub-helice-${Date.now()}-${itemIdx}-${i}-${heliceNum}`,
              name: `${prefix} ${String(heliceNum).padStart(2, '0')}`,
              x: currentX,
              y: fixedY,
              branches: 1,
              topPolarity,
              groupId,
              heliceIndex: heliceNum,
            })
          );
        }

        for (let i = 0; i < groupSubs.length - 1; i++) {
          const curSub = groupSubs[i];
          const nxtSub = groupSubs[i + 1];
          const curNodes = buildSubRegionNodes(curSub);
          const nxtNodes = buildSubRegionNodes(nxtSub);
          const fromNode =
            curNodes.find((n) => n.polarity === '-') ||
            (curSub.topPolarity === '-' ? curNodes[curNodes.length - 1] : curNodes[0]);
          const toNode =
            nxtNodes.find((n) => n.polarity === '+') ||
            (nxtSub.topPolarity === '-' ? nxtNodes[0] : nxtNodes[nxtNodes.length - 1]);
          if (fromNode && toNode) {
            allNewConnections.push({
              id: `connection-${Date.now()}-${itemIdx}-${i}`,
              from: fromNode.id,
              to: toNode.id,
              fromSubRegionId: curSub.id,
              toSubRegionId: nxtSub.id,
              fromNumber: fromNode.number,
              toNumber: toNode.number,
            });
          }
        }

        allNewSubs.push(...groupSubs);
        currentX += 260;
      } else {
        // Sub-região normal
        const defaultName = `SUB ${String(standardSubCounter++).padStart(2, '0')}`;
        const name = (item.name || '').trim() || defaultName;

        const sub = createSubRegion({
          id: `sub-${Date.now()}-${itemIdx}`,
          name,
          x: currentX,
          y: fixedY,
          branches: count,
          topPolarity,
        });

        allNewSubs.push(sub);
        currentX += 260;
      }
    });

    setState((prev) => ({
      ...prev,
      subRegions: [...prev.subRegions, ...allNewSubs],
      connections: [...prev.connections, ...allNewConnections],
    }));
    setSelectedNode(null);
    setNotice(`${batchRows.length} sub-regiões geradas com sucesso a partir da tabela.`);
  }

  function updateSubRegion(nextSub) {
    if (nextSub.isGroup) {
      // Atualiza nome de todas as subs do grupo
      setState((prev) => ({
        ...prev,
        subRegions: prev.subRegions.map((sub) => {
          if (sub.groupId === nextSub.id) {
            return { ...sub, name: `${nextSub.name} ${sub.heliceIndex || ''}`.trim() };
          }
          return sub;
        }),
      }));
      return;
    }

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
      subRegions: prev.subRegions.map((sub) => {
        if (sub.id === id || sub.groupId === id) {
          return { ...sub, x: Math.max(30, x), y: Math.max(80, y) };
        }
        return sub;
      }),
    }));
  }

  /** Chamado ao soltar o drag — salva snapshot */
  function commitPosition() {
    commit();
  }

  function deriveVoltageNodesFromConnections(conns) {
    let appliedNodeId = null;
    const vsConn = conns.find(
      (c) => c.fromSubRegionId === 'voltage-source' || c.toSubRegionId === 'voltage-source'
    );
    if (vsConn) {
      appliedNodeId = vsConn.fromSubRegionId === 'voltage-source' ? vsConn.to : vsConn.from;
    }

    const { groundedSubNodeIds: grounded } = getElectricalGroups(subRegions, conns);

    return { appliedNodeId, groundedNodeIds: grounded };
  }

  function addVoltageSource() {
    setState((prev) => {
      if (prev.voltageConfig?.source && prev.voltageConfig.source.enabled !== false) {
        setNotice('A fonte de tensão já está posicionada no workspace.');
        return prev;
      }
      setNotice('Fonte de tensão adicionada ao workspace.');
      return {
        ...prev,
        voltageConfig: {
          ...prev.voltageConfig,
          source: {
            id: 'voltage-source',
            x: 80,
            y: 360,
            enabled: true,
          },
        },
      };
    });
    commit();
  }

  function deleteVoltageSource() {
    setState((prev) => {
      const remainingConnections = prev.connections.filter(
        (c) => c.fromSubRegionId !== 'voltage-source' && c.toSubRegionId !== 'voltage-source'
      );
      const { appliedNodeId, groundedNodeIds } = deriveVoltageNodesFromConnections(remainingConnections);
      return {
        ...prev,
        connections: remainingConnections,
        voltageConfig: {
          ...prev.voltageConfig,
          appliedNodeId,
          groundedNodeIds,
          source: null,
        },
      };
    });
    commit();
    setNotice('Fonte de tensão removida.');
  }

  function updateVoltageSourcePosition(x, y) {
    setStateNoHistory((prev) => ({
      ...prev,
      voltageConfig: {
        ...prev.voltageConfig,
        source: {
          ...(prev.voltageConfig.source || { id: 'voltage-source' }),
          x,
          y,
          enabled: true,
        },
      },
    }));
  }

  function commitVoltagePosition() {
    commit();
  }

  function updateVoltageValue(value) {
    setState((prev) => ({
      ...prev,
      voltageConfig: {
        ...prev.voltageConfig,
        voltageValue: value,
      },
    }));
  }

  function addEarth() {
    const newId = `earth-${Date.now()}`;
    setState((prev) => {
      const currentEarths = prev.voltageConfig?.earths || [];
      const newEarth = {
        id: newId,
        x: 80,
        y: 490 + currentEarths.length * 85,
      };
      return {
        ...prev,
        voltageConfig: {
          ...prev.voltageConfig,
          earths: [...currentEarths, newEarth],
        },
      };
    });
    commit();
    setNotice('Bloco de terra (referência) adicionado ao workspace.');
  }

  function deleteEarth(earthId) {
    setState((prev) => {
      const remainingEarths = (prev.voltageConfig?.earths || []).filter((e) => e.id !== earthId);
      const remainingConnections = prev.connections.filter(
        (c) => c.fromSubRegionId !== earthId && c.toSubRegionId !== earthId
      );
      const { appliedNodeId, groundedNodeIds } = deriveVoltageNodesFromConnections(remainingConnections);
      return {
        ...prev,
        connections: remainingConnections,
        voltageConfig: {
          ...prev.voltageConfig,
          appliedNodeId,
          groundedNodeIds,
          earths: remainingEarths,
        },
      };
    });
    commit();
    setNotice('Bloco de terra removido.');
  }

  function updateEarthPosition(id, x, y) {
    setStateNoHistory((prev) => ({
      ...prev,
      voltageConfig: {
        ...prev.voltageConfig,
        earths: (prev.voltageConfig.earths || []).map((e) =>
          e.id === id ? { ...e, x, y } : e
        ),
      },
    }));
  }

  function commitEarthPosition() {
    commit();
  }

  function deleteSubRegion(id) {
    const isGroup = id && id.startsWith('helice-group');
    const targetSubIds = new Set(
      subRegions
        .filter((s) => (isGroup ? s.groupId === id : s.id === id))
        .map((s) => s.id)
    );

    setState((prev) => {
      const remainingConnections = prev.connections.filter(
        (conn) => !targetSubIds.has(conn.fromSubRegionId) && !targetSubIds.has(conn.toSubRegionId)
      );
      const { appliedNodeId, groundedNodeIds } = deriveVoltageNodesFromConnections(remainingConnections);

      return {
        ...prev,
        subRegions: prev.subRegions.filter((sub) => !targetSubIds.has(sub.id)),
        connections: remainingConnections,
        voltageConfig: {
          ...prev.voltageConfig,
          appliedNodeId,
          groundedNodeIds,
        },
      };
    });
    if (selectedSubRegionId === id) setSelectedSubRegionId(null);
  }

  function selectConnection(connectionId) {
    setSelectedConnectionId(connectionId);
    if (connectionId) {
      setSelectedNode(null);
      setSelectedSubRegionId(null);
    }
  }

  function deleteSingleConnection(connId) {
    const targetId = connId || selectedConnectionId;
    if (!targetId) return;

    setState((prev) => {
      const remainingConnections = prev.connections.filter((c) => c.id !== targetId);
      const { appliedNodeId, groundedNodeIds } = deriveVoltageNodesFromConnections(remainingConnections);
      return {
        ...prev,
        connections: remainingConnections,
        voltageConfig: {
          ...prev.voltageConfig,
          appliedNodeId,
          groundedNodeIds,
        },
      };
    });

    setSelectedConnectionId(null);
    setNotice('Conexão removida.');
  }

  function selectNode(node) {
    if (!node.isOutput) return;
    setSelectedConnectionId(null);

    if (!selectedNode) {
      setSelectedNode(node);
      const gNum = globalNumbers.get(node.id) ?? node.number;
      const nodeName = node.polarity ? `${node.polarity}${gNum}` : (node.label || node.id);
      setNotice(`Ponto ${nodeName} selecionado. Escolha outro ponto para conectar.`);
      return;
    }

    if (selectedNode.id === node.id) {
      setSelectedNode(null);
      setNotice(null);
      return;
    }

    const isSpecialId = (id) =>
      id === 'voltage-source' || (typeof id === 'string' && id.startsWith('earth'));

    const fromIsSpecial = isSpecialId(selectedNode.subRegionId);
    const toIsSpecial = isSpecialId(node.subRegionId);

    const fromSub = fromIsSpecial
      ? { id: selectedNode.subRegionId }
      : subRegions.find((sub) => sub.id === selectedNode.subRegionId);
    const toSub = toIsSpecial
      ? { id: node.subRegionId }
      : subRegions.find((sub) => sub.id === node.subRegionId);

    if (!fromSub || !toSub) return;

    // Conexão entre o mesmo bloco especial não é permitida
    if (fromIsSpecial && toIsSpecial && selectedNode.subRegionId === node.subRegionId) {
      setSelectedNode(null);
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

    const newConnections = [...connections, connection];
    const { appliedNodeId, groundedNodeIds } = deriveVoltageNodesFromConnections(newConnections);

    setState((prev) => ({
      ...prev,
      connections: newConnections,
      voltageConfig: {
        ...prev.voltageConfig,
        appliedNodeId: appliedNodeId ?? prev.voltageConfig.appliedNodeId,
        groundedNodeIds: groundedNodeIds.length > 0 ? groundedNodeIds : prev.voltageConfig.groundedNodeIds,
      },
    }));
    setSelectedNode(null);

    if (fromIsSpecial || toIsSpecial) {
      if (selectedNode.subRegionId === 'voltage-source' || node.subRegionId === 'voltage-source') {
        setNotice('Tensão conectada ao ponto com sucesso.');
      } else {
        setNotice('Ponto aterrado (referência 0 kV) com sucesso.');
      }
    } else {
      setNotice('Conexão criada.');
    }
  }

  function deleteConnectionsForSelectedNode() {
    if (!selectedNode) return;
    const remainingConnections = connections.filter(
      (c) => c.from !== selectedNode.id && c.to !== selectedNode.id
    );
    const { appliedNodeId, groundedNodeIds } = deriveVoltageNodesFromConnections(remainingConnections);

    setState((prev) => ({
      ...prev,
      connections: remainingConnections,
      voltageConfig: {
        ...prev.voltageConfig,
        appliedNodeId,
        groundedNodeIds,
      },
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
  const detailMultiHeliceSubs = useMemo(() => {
    if (!detailMultiHeliceGroupId) return [];
    return subRegions.filter((s) => s.groupId === detailMultiHeliceGroupId);
  }, [subRegions, detailMultiHeliceGroupId]);

  function saveProjectJson() {
    const projectData = {
      app: 'CONNECTSIMUL',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      subRegions,
      connections,
      voltageConfig: {
        ...voltageConfig,
        groundedNodeIds: groundedSubNodeIds,
      },
    };

    const jsonString = JSON.stringify(projectData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `connectsimul_projeto_${Date.now()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice('Arquivo JSON do projeto salvo no computador com sucesso.');
  }

  function importProjectJson(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const data = JSON.parse(content);

        let newSubs = [];
        let newConns = [];
        let newVoltageConfig = {
          appliedNodeId: null,
          voltageValue: '13.8',
          groundedNodeIds: [],
          source: { id: 'voltage-source', x: 80, y: 360, enabled: true },
          earths: [{ id: 'earth-1', x: 80, y: 490 }],
        };

        if (Array.isArray(data.subRegions)) {
          newSubs = data.subRegions;
          newConns = Array.isArray(data.connections) ? data.connections : [];
          if (data.voltageConfig) {
            newVoltageConfig = {
              ...newVoltageConfig,
              ...data.voltageConfig,
              source: data.voltageConfig.source || newVoltageConfig.source,
              earths: Array.isArray(data.voltageConfig.earths) ? data.voltageConfig.earths : newVoltageConfig.earths,
            };
          }
        } else if (Array.isArray(data)) {
          newSubs = data;
        } else {
          throw new Error('Formato JSON inválido: subRegions não encontrado.');
        }

        setState({
          subRegions: newSubs,
          connections: newConns,
          voltageConfig: newVoltageConfig,
        });

        setSelectedNode(null);
        setSelectedSubRegionId(null);
        setNotice(`Projeto importado com sucesso: ${newSubs.length} sub-regiões, ${newConns.length} conexões.`);
      } catch (err) {
        console.error(err);
        setNotice(`Erro ao importar arquivo JSON: ${err.message || 'Arquivo corrompido ou formato incompatível.'}`);
      }
    };
    reader.readAsText(file);
  }

  function saveVoltageConfig({ appliedNodeId, voltageValue, groundedNodeIds }) {
    setState((prev) => ({
      ...prev,
      voltageConfig: {
        ...prev.voltageConfig,
        appliedNodeId,
        voltageValue,
        groundedNodeIds,
      },
    }));
    commit();
    setNotice('Configuração de tensão salva com sucesso.');
  }

  return (
    <div className="app-shell">
      <Toolbar
        onAddSubRegion={addSubRegion}
        onOpenMultiHeliceModal={() => setShowMultiHeliceModal(true)}
        onOpenBatchModal={() => setShowBatchModal(true)}
        onAddVoltageSource={addVoltageSource}
        onAddEarth={addEarth}
        onDeleteConnection={deleteConnectionsForSelectedNode}
        onDeleteSingleConnection={deleteSingleConnection}
        onClearSelection={() => {
          setSelectedNode(null);
          setSelectedConnectionId(null);
          setSelectedSubRegionId(null);
          setNotice(null);
        }}
        onSaveJson={saveProjectJson}
        onImportJson={importProjectJson}
        connectionMode={Boolean(selectedNode)}
        selectedNode={selectedNode}
        selectedConnectionId={selectedConnectionId}
        onOpenConnectionTable={() => setShowConnectionTable(true)}
        onOpenVoltageTable={() => setShowVoltageTable(true)}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        isSidebarOpen={isSidebarOpen}
      />

      <div className="app-main">
        <Workspace
          subRegions={subRegions}
          connections={connections}
          selectedNode={selectedNode}
          selectedSubRegionId={selectedSubRegionId}
          selectedConnectionId={selectedConnectionId}
          onSelectNode={selectNode}
          onSelectConnection={selectConnection}
          onUpdatePosition={updatePosition}
          onCommitPosition={commitPosition}
          onSelectSubRegion={(id) => {
            setSelectedSubRegionId(id);
            if (id) {
              setSelectedConnectionId(null);
              setIsSidebarOpen(true);
            }
          }}
          onOpenDetail={setDetailSubRegionId}
          onOpenMultiHeliceDetail={setDetailMultiHeliceGroupId}
          voltageConfig={voltageConfig}
          onUpdateVoltageSourcePosition={updateVoltageSourcePosition}
          onCommitVoltagePosition={commitVoltagePosition}
          onUpdateVoltageValue={updateVoltageValue}
          onDeleteVoltageSource={deleteVoltageSource}
          onUpdateEarthPosition={updateEarthPosition}
          onCommitEarthPosition={commitEarthPosition}
          onDeleteEarth={deleteEarth}
        />
        <VoltageSourceModal
          isOpen={showVoltageModal}
          onClose={() => setShowVoltageModal(false)}
          onSave={saveVoltageConfig}
          nodes={allNodes}
        />

        {/* Painel lateral com transição suave (ease 0.2s) */}
        <div className={`properties-panel-wrapper ${!isSidebarOpen ? 'collapsed' : ''}`}>
          <PropertiesPanel
            subRegion={selectedSubRegion}
            onChange={updateSubRegion}
            onClose={() => setSelectedSubRegionId(null)}
            onDelete={() => handleDeleteSelected(selectedSubRegionId)}
            onOpenGroupDetail={setDetailMultiHeliceGroupId}
            onUpdateVoltageValue={updateVoltageValue}
            onRotate={rotateSelectedPin}
          />
        </div>
      </div>

      {notice && (
        <div className="toast">
          <span className="toast-icon">●</span>
          {notice}
          <button type="button" onClick={() => setNotice(null)}>×</button>
        </div>
      )}

      {showConnectionTable && (
        <ConnectionTable
          rows={rows}
          onClose={() => setShowConnectionTable(false)}
        />
      )}

      {showVoltageTable && (
        <VoltageTable
          config={{
            ...voltageConfig,
            groundedNodeIds: groundedSubNodeIds,
          }}
          globalNumbers={globalNumbers}
          nodes={allNodes}
          onClose={() => setShowVoltageTable(false)}
        />
      )}

      {showMultiHeliceModal && (
        <MultiHeliceModal
          onClose={() => setShowMultiHeliceModal(false)}
          onCreate={addMultiHeliceSubRegion}
        />
      )}

      {showBatchModal && (
        <BatchSubRegionModal
          onClose={() => setShowBatchModal(false)}
          onCreateBatch={addBatchSubRegions}
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

      {detailMultiHeliceGroupId && detailMultiHeliceSubs.length > 0 && (
        <MultiHeliceDetail
          groupId={detailMultiHeliceGroupId}
          subs={detailMultiHeliceSubs}
          globalNumbers={globalNumbers}
          globalBranches={globalBranches}
          connections={connections}
          onClose={() => setDetailMultiHeliceGroupId(null)}
        />
      )}
    </div>
  );
}

