import React, { useMemo } from 'react';
import { getSubRegionPortPoint } from './SubRegion';
import { getMultiHelicePortPoint } from './MultiHeliceGroup';
import { getVoltageSourcePortPoint } from './VoltageSourceBlock';
import { getEarthPortPoint } from './EarthBlock';

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

  const getPort = (subRegionId, nodeNumber) => {
    if (subRegionId === 'voltage-source') {
      return getVoltageSourcePortPoint(voltageSource);
    }
    if (earthMap.has(subRegionId)) {
      return getEarthPortPoint(earthMap.get(subRegionId));
    }
    const sub = subMap.get(subRegionId);
    if (!sub) return null;
    return sub.groupId
      ? getMultiHelicePortPoint(groupSubsMap.get(sub.groupId), nodeNumber, connections)
      : getSubRegionPortPoint(sub, nodeNumber, connections);
  };

  const getEdgeOffset = (subRegionId) => {
    if (!subRegionId) return 27;
    if (subRegionId === 'voltage-source') return 6;
    if (typeof subRegionId === 'string' && subRegionId.startsWith('earth')) return 6;
    const sub = subMap.get(subRegionId);
    if (sub && sub.groupId) return 37;
    return 27;
  };

  const getConnectionType = (fromSubRegionId, toSubRegionId) => {
    const isEarth = (id) => typeof id === 'string' && (id.startsWith('earth') || id.includes('earth'));
    const isVoltage = (id) => id === 'voltage-source';
    if (isEarth(fromSubRegionId) || isEarth(toSubRegionId)) return 'earth';
    if (isVoltage(fromSubRegionId) || isVoltage(toSubRegionId)) return 'voltage';
    return 'node';
  };

  const computedConnections = useMemo(() => {
    const list = [];

    for (const connection of connections) {
      const fromSub = subMap.get(connection.fromSubRegionId);
      const toSub = subMap.get(connection.toSubRegionId);

      // Conexão interna de hélice múltipla:
      if (fromSub && toSub && fromSub.groupId && toSub.groupId && fromSub.groupId === toSub.groupId) {
        continue;
      }

      const a = getPort(connection.fromSubRegionId, connection.fromNumber);
      const b = getPort(connection.toSubRegionId, connection.toNumber);

      if (!a || !b) continue;

      const isSelected = selectedConnectionId === connection.id;
      const type = getConnectionType(connection.fromSubRegionId, connection.toSubRegionId);
      const pathClass = type === 'earth' ? 'connection-path--earth' : type === 'voltage' ? 'connection-path--voltage' : 'connection-path';
      const glowClass = type === 'earth' ? 'connection-path-glow--earth' : type === 'voltage' ? 'connection-path-glow--voltage' : 'connection-path-glow';
      const endpointClass = type === 'earth' ? 'connection-endpoint--earth' : type === 'voltage' ? 'connection-endpoint--voltage' : 'connection-endpoint';

      const isSameSub = connection.fromSubRegionId === connection.toSubRegionId;

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

      const dist = Math.hypot(borderBX - borderAX, borderBY - borderAY);
      const curveDist = isSameSub
        ? Math.max(55, Math.abs(finalPB.y - finalPA.y) * 0.4)
        : Math.max(40, Math.min(220, dist * 0.45));

      const c1x = borderAX + dirAX * curveDist;
      const c1y = borderAY + dirAY * curveDist;
      const c2x = borderBX + dirBX * curveDist;
      const c2y = borderBY + dirBY * curveDist;

      // Curva pelo espaço livre (entre as bordas externas)
      const curvePath = `M ${borderAX} ${borderAY} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${borderBX} ${borderBY}`;

      // Segmentos de passagem dentro da estrutura (da borda ao terminal de conexão)
      const leadPathA = `M ${borderAX} ${borderAY} L ${finalPA.x} ${finalPA.y}`;
      const leadPathB = `M ${borderBX} ${borderBY} L ${finalPB.x} ${finalPB.y}`;

      list.push({
        id: connection.id,
        isSelected,
        pathClass,
        glowClass,
        endpointClass,
        finalPA,
        finalPB,
        curvePath,
        leadPathA,
        leadPathB,
      });
    }

    return list;
  }, [connections, subMap, earthMap, groupSubsMap, selectedConnectionId, voltageSource]);

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
          </g>
        ))}
      </svg>
    </>
  );
}
