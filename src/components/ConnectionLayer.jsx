import React, { useMemo } from 'react';
import { getSubRegionPortPoint } from './SubRegion';
import { getMultiHelicePortPoint, getMultiHeliceExternalNodes } from './MultiHeliceGroup';
import { getVoltageSourcePortPoint } from './VoltageSourceBlock';
import { getEarthPortPoint } from './EarthBlock';
import { buildEquipotentialNetMap, classifyConnections } from '../model/equipotentialColors';

export default function ConnectionLayer({
  subRegions,
  connections,
  width,
  height,
  voltageSource,
  earths = [],
  selectedConnectionId,
  onSelectConnection,
}) {
  const subMap = useMemo(() => new Map(subRegions.map((sub) => [sub.id, sub])), [subRegions]);
  const earthMap = useMemo(() => new Map(earths.map((e) => [e.id, e])), [earths]);
  
  const groupSubsMap = useMemo(() => {
    const map = new Map();
    for (const sub of subRegions) {
      if (sub.groupId) {
        if (!map.has(sub.groupId)) map.set(sub.groupId, []);
        map.get(sub.groupId).push(sub);
      }
    }
    return map;
  }, [subRegions]);

  const getPort = (subRegionId, nodeNumber, nodeId = null) => {
    if (subRegionId === 'voltage-source') {
      return getVoltageSourcePortPoint(voltageSource);
    }
    if (earthMap.has(subRegionId)) {
      return getEarthPortPoint(earthMap.get(subRegionId));
    }
    const sub = subMap.get(subRegionId);
    if (!sub) return null;
    return sub.groupId
      ? getMultiHelicePortPoint(groupSubsMap.get(sub.groupId), nodeNumber, connections, nodeId)
      : getSubRegionPortPoint(sub, nodeNumber, connections, nodeId);
  };

  const getEdgeOffset = (subRegionId) => {
    if (!subRegionId) return 27;
    if (subRegionId === 'voltage-source') return 6;
    if (typeof subRegionId === 'string' && subRegionId.startsWith('earth')) return 6;
    const sub = subMap.get(subRegionId);
    if (sub && sub.groupId) return 37;
    return 27;
  };

  const connectionTypesMap = useMemo(() => {
    return classifyConnections(connections);
  }, [connections]);

  const netColorMap = useMemo(() => {
    return buildEquipotentialNetMap(connections, connectionTypesMap);
  }, [connections, connectionTypesMap]);

  const computedConnections = useMemo(() => {
    const rawItems = [];

    for (const connection of connections) {
      const fromSub = subMap.get(connection.fromSubRegionId);
      const toSub = subMap.get(connection.toSubRegionId);

      const isSameGroup = Boolean(
        fromSub &&
        toSub &&
        fromSub.groupId &&
        toSub.groupId &&
        fromSub.groupId === toSub.groupId
      );

      if (isSameGroup) {
        const groupSubs = groupSubsMap.get(fromSub.groupId);
        const extNodes = groupSubs ? getMultiHeliceExternalNodes(groupSubs, connections) : [];
        const extNodeIds = new Set(extNodes.map((n) => n.id));
        const isExternalMultiHeliceLoop = extNodeIds.has(connection.from) && extNodeIds.has(connection.to);

        if (!isExternalMultiHeliceLoop) {
          // Conexão interna da cadeia em série da hélice múltipla: não desenha no workspace
          continue;
        }
      }

      const a = getPort(connection.fromSubRegionId, connection.fromNumber, connection.from);
      const b = getPort(connection.toSubRegionId, connection.toNumber, connection.to);

      if (!a || !b) continue;

      const isSelected = selectedConnectionId === connection.id;
      const type = connectionTypesMap.get(connection.id) || 'node';
      const pathClass = type === 'earth' ? 'connection-path--earth' : type === 'voltage' ? 'connection-path--voltage' : 'connection-path';
      const glowClass = type === 'earth' ? 'connection-path-glow--earth' : type === 'voltage' ? 'connection-path-glow--voltage' : 'connection-path-glow';
      const endpointClass = type === 'earth' ? 'connection-endpoint--earth' : type === 'voltage' ? 'connection-endpoint--voltage' : 'connection-endpoint';

      const netInfo = type === 'node' ? netColorMap.get(connection.id) : null;
      const groupStyle =
        type === 'earth'
          ? {
              '--conn-color': 'var(--green)',
              '--conn-glow': 'rgba(0, 230, 118, 0.22)',
              '--conn-glow-selected': 'rgba(0, 230, 118, 0.65)',
            }
          : type === 'voltage'
          ? {
              '--conn-color': 'var(--amber)',
              '--conn-glow': 'rgba(255, 200, 87, 0.22)',
              '--conn-glow-selected': 'rgba(255, 200, 87, 0.65)',
            }
          : netInfo
          ? {
              '--conn-color': netInfo.stroke,
              '--conn-glow': netInfo.glow,
              '--conn-glow-selected': netInfo.glowSelected,
            }
          : undefined;

      const isSameSub = connection.fromSubRegionId === connection.toSubRegionId || isSameGroup;

      const portsA = a.ports || [
        { x: a.leftX, y: a.y, dirX: -1, dirY: 0, dir: -1 },
        { x: a.rightX, y: a.y, dirX: 1, dirY: 0, dir: 1 }
      ];
      const portsB = b.ports || [
        { x: b.leftX, y: b.y, dirX: -1, dirY: 0, dir: -1 },
        { x: b.rightX, y: b.y, dirX: 1, dirY: 0, dir: 1 }
      ];

      const centerXA = (a.leftX + a.rightX) / 2;
      const centerXB = (b.leftX + b.rightX) / 2;

      let minScore = Infinity;
      let finalPA = null;
      let finalPB = null;

      for (const pA of portsA) {
        for (const pB of portsB) {
          const dist = Math.hypot(pB.x - pA.x, pB.y - pA.y);
          
          let penalty = 0;
          if (!isSameSub) {
            // Prioriza estritamente os lados voltados um para o outro quando têm opção de saída horizontal
            if (centerXB > centerXA + 20) {
              if (portsA.length > 1 && pA.dirX !== 1) penalty += 50000;
              if (portsB.length > 1 && pB.dirX !== -1) penalty += 50000;
            } else if (centerXB < centerXA - 20) {
              if (portsA.length > 1 && pA.dirX !== -1) penalty += 50000;
              if (portsB.length > 1 && pB.dirX !== 1) penalty += 50000;
            } else {
              // Alinhados verticalmente: sub-regiões devem usar o mesmo lado
              if (portsA.length > 1 && portsB.length > 1 && pA.dirX !== pB.dirX) penalty += 20000;
            }
          } else {
            // Mesma sub-região: devem usar o mesmo lado para contornar por fora
            if (pA.dir !== pB.dir) penalty += 50000;
          }

          const score = dist + penalty;
          if (score < minScore) {
            minScore = score;
            finalPA = pA;
            finalPB = pB;
          }
        }
      }

      if (!finalPA || !finalPB) continue;

      const offsetA = getEdgeOffset(connection.fromSubRegionId);
      const offsetB = getEdgeOffset(connection.toSubRegionId);

      const dirAX = finalPA.dirX ?? finalPA.dir ?? 0;
      const dirAY = finalPA.dirY ?? 0;
      const dirBX = finalPB.dirX ?? finalPB.dir ?? 0;
      const dirBY = finalPB.dirY ?? 0;

      // Ponto na borda exterior de cada estrutura (onde o fio sai para o espaço livre)
      const borderAX = finalPA.x + dirAX * offsetA;
      const borderAY = finalPA.y + dirAY * offsetA;
      const borderBX = finalPB.x + dirBX * offsetB;
      const borderBY = finalPB.y + dirBY * offsetB;

      rawItems.push({
        connection,
        isSelected,
        type,
        pathClass,
        glowClass,
        endpointClass,
        netInfo,
        groupStyle,
        isSameSub,
        finalPA,
        finalPB,
        dirAX,
        dirAY,
        dirBX,
        dirBY,
        borderAX,
        borderAY,
        borderBX,
        borderBY,
        subKey: fromSub ? (fromSub.groupId || fromSub.id) : connection.fromSubRegionId,
        yMin: Math.min(finalPA.y, finalPB.y),
        yMax: Math.max(finalPA.y, finalPB.y),
        span: Math.abs(finalPB.y - finalPA.y),
      });
    }

    // Calcula níveis de aninhamento (rank) para conexões na mesma sub-região e mesmo lado
    const sameSubGroups = new Map();
    for (const item of rawItems) {
      if (!item.isSameSub) continue;
      const key = `${item.subKey}_${item.dirAX}`;
      if (!sameSubGroups.has(key)) sameSubGroups.set(key, []);
      sameSubGroups.get(key).push(item);
    }

    const sameSubRankMap = new Map();
    for (const group of sameSubGroups.values()) {
      const sorted = [...group].sort((a, b) => a.span - b.span || a.yMin - b.yMin);
      for (let i = 0; i < sorted.length; i++) {
        const cA = sorted[i];
        let rank = 0;
        for (let j = 0; j < i; j++) {
          const cB = sorted[j];
          if (Math.max(cA.yMin, cB.yMin) < Math.min(cA.yMax, cB.yMax)) {
            rank = Math.max(rank, (sameSubRankMap.get(cB.connection.id) ?? 0) + 1);
          }
        }
        sameSubRankMap.set(cA.connection.id, rank);
      }
    }

    const list = [];
    for (const item of rawItems) {
      const dist = Math.hypot(item.borderBX - item.borderAX, item.borderBY - item.borderAY);
      const rank = sameSubRankMap.get(item.connection.id) ?? 0;
      const baseDist = Math.max(46, Math.min(75, item.span * 0.18));
      const curveDist = item.isSameSub
        ? baseDist + rank * 44
        : Math.max(40, Math.min(220, dist * 0.45));

      const c1x = item.borderAX + item.dirAX * curveDist;
      const c1y = item.borderAY + item.dirAY * curveDist;
      const c2x = item.borderBX + item.dirBX * curveDist;
      const c2y = item.borderBY + item.dirBY * curveDist;

      // Curva pelo espaço livre (entre as bordas externas)
      const curvePath = `M ${item.borderAX} ${item.borderAY} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${item.borderBX} ${item.borderBY}`;

      // Segmentos de passagem dentro da estrutura (da borda ao terminal de conexão)
      const leadPathA = `M ${item.borderAX} ${item.borderAY} L ${item.finalPA.x} ${item.finalPA.y}`;
      const leadPathB = `M ${item.borderBX} ${item.borderBY} L ${item.finalPB.x} ${item.finalPB.y}`;

      // Ponto médio exato da curva cúbica de Bézier (t = 0.5)
      const midX = 0.125 * item.borderAX + 0.375 * c1x + 0.375 * c2x + 0.125 * item.borderBX;
      const midY = 0.125 * item.borderAY + 0.375 * c1y + 0.375 * c2y + 0.125 * item.borderBY;

      let badgeLabel = '';
      let badgeWidth = 20;
      let badgeBgColor = '#090e14';
      let badgeBorderColor = 'var(--cyan)';
      let badgeTextColor = '#ffffff';
      let badgeRectClass = '';
      let badgeTextClass = '';

      if (item.type === 'earth') {
        badgeLabel = '⏚';
        badgeWidth = 20;
        badgeBgColor = 'var(--green)';
        badgeBorderColor = 'rgba(0, 0, 0, 0.4)';
        badgeTextColor = '#05140b';
        badgeRectClass = 'connection-badge-rect--earth';
        badgeTextClass = 'connection-badge-text--earth';
      } else if (item.type === 'voltage') {
        badgeLabel = '⚡';
        badgeWidth = 20;
        badgeBgColor = 'var(--amber)';
        badgeBorderColor = 'rgba(0, 0, 0, 0.4)';
        badgeTextColor = '#0a0600';
        badgeRectClass = 'connection-badge-rect--voltage';
        badgeTextClass = 'connection-badge-text--voltage';
      } else if (item.netInfo) {
        badgeLabel = `${item.netInfo.netIndex + 1}`;
        const len = badgeLabel.length;
        badgeWidth = len >= 4 ? 35 : len >= 3 ? 29 : len >= 2 ? 23 : 18;
        badgeBgColor = item.netInfo.stroke;
        badgeTextColor = item.netInfo.textColor;
        badgeBorderColor = item.netInfo.isLightColor ? 'rgba(0, 0, 0, 0.35)' : 'rgba(255, 255, 255, 0.35)';
      }

      list.push({
        id: item.connection.id,
        isSelected: item.isSelected,
        pathClass: item.pathClass,
        glowClass: item.glowClass,
        endpointClass: item.endpointClass,
        groupStyle: item.groupStyle,
        finalPA: item.finalPA,
        finalPB: item.finalPB,
        curvePath,
        leadPathA,
        leadPathB,
        midX,
        midY,
        badgeLabel,
        badgeWidth,
        badgeBgColor,
        badgeBorderColor,
        badgeTextColor,
        badgeRectClass,
        badgeTextClass,
        badgeIsBolt: item.type === 'voltage',
      });
    }

    return list;
  }, [connections, subMap, earthMap, groupSubsMap, selectedConnectionId, voltageSource, netColorMap, connectionTypesMap]);

  const svgStyle = width && height ? { width, height, minWidth: width } : undefined;

  return (
    <>
      {/* Camada traseira (z-index: 1): a curva livre passa por trás de qualquer estrutura no meio do caminho */}
      <svg className="connection-layer connection-layer--back" style={svgStyle}>
        <defs>
          <filter id="connectionGlowBack">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {computedConnections.map((item) => (
          <g
            key={`curve-${item.id}`}
            className={`connection-group ${item.isSelected ? 'connection-group--selected' : ''}`}
            style={item.groupStyle}
            onClick={(e) => {
              e.stopPropagation();
              onSelectConnection?.(item.id);
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
          >
            {/* Hit area invisível com 24px de espessura para facilitar o clique */}
            <path
              d={item.curvePath}
              className="connection-hitarea"
            />
            {/* Casing escuro subjacente para separar visualmente conexões que se cruzam */}
            <path
              d={item.curvePath}
              className="connection-casing"
            />
            <path
              d={item.curvePath}
              className={`${item.glowClass} ${item.isSelected ? 'connection-path-glow--selected' : ''}`}
              filter="url(#connectionGlowBack)"
            />
            <path
              d={item.curvePath}
              className={`${item.pathClass} ${item.isSelected ? 'connection-path--selected' : ''}`}
            />
          </g>
        ))}
      </svg>

      {/* Camada frontal (z-index: 6): passa exclusivamente pela parte da sub-região que leva ao ponto de conexão */}
      <svg className="connection-layer connection-layer--front" style={svgStyle}>
        <defs>
          <filter id="connectionGlowFront">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {computedConnections.map((item) => (
          <g
            key={`leads-${item.id}`}
            className={`connection-group ${item.isSelected ? 'connection-group--selected' : ''}`}
            style={item.groupStyle}
            onClick={(e) => {
              e.stopPropagation();
              onSelectConnection?.(item.id);
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
          >
            {/* Lead A: borda até terminal na estrutura de origem */}
            <path
              d={item.leadPathA}
              className="connection-hitarea"
            />
            <path
              d={item.leadPathA}
              className="connection-casing"
            />
            <path
              d={item.leadPathA}
              className={`${item.glowClass} ${item.isSelected ? 'connection-path-glow--selected' : ''}`}
              filter="url(#connectionGlowFront)"
            />
            <path
              d={item.leadPathA}
              className={`${item.pathClass} ${item.isSelected ? 'connection-path--selected' : ''}`}
            />
            {/* Lead B: borda até terminal na estrutura de destino */}
            <path
              d={item.leadPathB}
              className="connection-hitarea"
            />
            <path
              d={item.leadPathB}
              className="connection-casing"
            />
            <path
              d={item.leadPathB}
              className={`${item.glowClass} ${item.isSelected ? 'connection-path-glow--selected' : ''}`}
              filter="url(#connectionGlowFront)"
            />
            <path
              d={item.leadPathB}
              className={`${item.pathClass} ${item.isSelected ? 'connection-path--selected' : ''}`}
            />
            {/* Círculos nos pontos de conexão */}
            <circle cx={item.finalPA.x} cy={item.finalPA.y} r={item.isSelected ? 6 : 5} className={`${item.endpointClass} ${item.isSelected ? 'connection-endpoint--selected' : ''}`} />
            <circle cx={item.finalPB.x} cy={item.finalPB.y} r={item.isSelected ? 6 : 5} className={`${item.endpointClass} ${item.isSelected ? 'connection-endpoint--selected' : ''}`} />

            {/* Tag / Badge de Identificação da Rede no ponto médio da curva (sempre ativa) */}
            {Boolean(item.badgeLabel) && (
              <g
                className="connection-badge-group"
                transform={`translate(${item.midX}, ${item.midY})`}
              >
                <g className="connection-badge-inner">
                  <rect
                    x={-item.badgeWidth / 2}
                    y={-9}
                    width={item.badgeWidth}
                    height={18}
                    rx={4}
                    className={`connection-badge-rect ${item.badgeRectClass} ${item.isSelected ? 'connection-badge-rect--selected' : ''}`}
                    style={
                      item.isSelected
                        ? undefined
                        : { fill: item.badgeBgColor, stroke: item.badgeBorderColor }
                    }
                  />
                  {item.badgeIsBolt ? (
                    <path
                      d="M 0.6 -5.2 L -3.2 0.3 L -0.2 0.3 L -1.2 5.3 L 3.2 -0.3 L 0.2 -0.3 Z"
                      className={`connection-badge-bolt ${item.isSelected ? 'connection-badge-bolt--selected' : ''}`}
                    />
                  ) : (
                    <text
                      x={0}
                      y={3.5}
                      textAnchor="middle"
                      className={`connection-badge-text ${item.badgeTextClass} ${item.isSelected ? 'connection-badge-text--selected' : ''}`}
                      style={
                        item.isSelected
                          ? undefined
                          : { fill: item.badgeTextColor }
                      }
                    >
                      {item.badgeLabel}
                    </text>
                  )}
                </g>
              </g>
            )}
          </g>
        ))}
      </svg>
    </>
  );
}
