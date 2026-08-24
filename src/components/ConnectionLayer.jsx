import React from 'react';
import { getSubRegionPortPoint } from './SubRegion';

export default function ConnectionLayer({ subRegions, connections }) {
  const subMap = new Map(subRegions.map((sub) => [sub.id, sub]));
  return (
    <svg className="connection-layer" aria-hidden="true">
      <defs>
        <filter id="connectionGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {connections.map((connection) => {
        const fromSub = subMap.get(connection.fromSubRegionId);
        const toSub = subMap.get(connection.toSubRegionId);
        if (!fromSub || !toSub) return null;
        const a = getSubRegionPortPoint(fromSub, connection.fromNumber, connections);
        const b = getSubRegionPortPoint(toSub, connection.toNumber, connections);
        if (!a || !b) return null;

        const portsA = [
          { x: a.leftX, y: a.y, dir: -1 },
          { x: a.rightX, y: a.y, dir: 1 }
        ];
        const portsB = [
          { x: b.leftX, y: b.y, dir: -1 },
          { x: b.rightX, y: b.y, dir: 1 }
        ];

        let bestPath = null;
        let minScore = Infinity;
        let finalPA = null;
        let finalPB = null;

        for (const pA of portsA) {
          for (const pB of portsB) {
            const dist = Math.hypot(pB.x - pA.x, pB.y - pA.y);
            
            let penalty = 0;
            if (pA.dir === 1 && pB.x < pA.x) penalty += 500;
            if (pA.dir === -1 && pB.x > pA.x) penalty += 500;
            
            if (pB.dir === 1 && pA.x < pB.x) penalty += 500;
            if (pB.dir === -1 && pA.x > pB.x) penalty += 500;

            const score = dist + penalty;
            
            if (score < minScore) {
              minScore = score;
              
              const dx = Math.max(50, Math.abs(pB.x - pA.x) * 0.5, Math.abs(pB.y - pA.y) * 0.3);
              const c1 = pA.x + pA.dir * dx;
              const c2 = pB.x + pB.dir * dx;
              bestPath = `M ${pA.x} ${pA.y} C ${c1} ${pA.y}, ${c2} ${pB.y}, ${pB.x} ${pB.y}`;
              finalPA = pA;
              finalPB = pB;
            }
          }
        }

        return (
          <g key={connection.id}>
            <path d={bestPath} className="connection-path-glow" filter="url(#connectionGlow)" />
            <path d={bestPath} className="connection-path" />
            <circle cx={finalPA.x} cy={finalPA.y} r="5" className="connection-endpoint" />
            <circle cx={finalPB.x} cy={finalPB.y} r="5" className="connection-endpoint" />
          </g>
        );
      })}
    </svg>
  );
}
