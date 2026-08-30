import React, { useMemo, useRef } from 'react';
import { buildSubRegionNodes } from '../model/electricalModel';

const SUB_WIDTH = 140;
const SUB_GAP = 30;
const SUB_HEIGHT = 160;
const CANVAS_PADDING = 40;

export default function MultiHeliceDetail({
  groupId,
  subs,
  globalNumbers,
  globalBranches,
  connections,
  onClose,
}) {
  const containerRef = useRef(null);

  const groupName = useMemo(() => {
    if (!subs || subs.length === 0) return 'HÉLICE MÚLTIPLA';
    const first = subs[0];
    const prefix = first.name ? first.name.replace(/\s*\d+$/, '').trim() : 'HÉLICE';
    return `${prefix} (${subs.length} HÉLICES)`;
  }, [subs]);

  // Identifica conexões internas do grupo
  const groupSubIds = useMemo(() => new Set(subs.map((s) => s.id)), [subs]);
  const internalConnections = useMemo(() => {
    return connections.filter(
      (c) => groupSubIds.has(c.fromSubRegionId) && groupSubIds.has(c.toSubRegionId)
    );
  }, [connections, groupSubIds]);

  const totalWidth = CANVAS_PADDING * 2 + subs.length * SUB_WIDTH + (subs.length - 1) * SUB_GAP;
  const canvasHeight = 240;

  // Mapa de posições dos nós para desenhar as conexões SVG
  const nodePositionMap = useMemo(() => {
    const map = new Map();
    subs.forEach((sub, i) => {
      const x = CANVAS_PADDING + i * (SUB_WIDTH + SUB_GAP);
      const subNodes = buildSubRegionNodes(sub);
      // subNodes[0] é o inferior (-), subNodes[1] é o superior (+)
      const bottomNode = subNodes[0];
      const topNode = subNodes[1];

      if (bottomNode) {
        map.set(bottomNode.id, {
          x: x + SUB_WIDTH / 2,
          y: 155, // posição inferior
          leftX: x + 10,
          rightX: x + SUB_WIDTH - 10,
        });
      }
      if (topNode) {
        map.set(topNode.id, {
          x: x + SUB_WIDTH / 2,
          y: 75, // posição superior
          leftX: x + 10,
          rightX: x + SUB_WIDTH - 10,
        });
      }
    });
    return map;
  }, [subs]);

  return (
    <div className="detail-overlay" onClick={onClose}>
      <section
        className="detail-modal"
        style={{ width: '92vw', maxWidth: '1100px', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="detail-header">
          <div>
            <span className="eyebrow" style={{ color: 'var(--green)' }}>DETALHES DA HÉLICE MÚLTIPLA</span>
            <h2>{groupName}</h2>
          </div>

          <div className="detail-header-info">
            <span className="branch-chip" style={{ borderColor: 'rgba(89, 227, 145, 0.35)', color: 'var(--green)' }}>
              {subs.length} HÉLICES EM SÉRIE
            </span>
            <button className="icon-btn" onClick={onClose} aria-label="Fechar">
              ×
            </button>
          </div>
        </div>

        <div style={{ padding: '16px 24px 8px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px', lineHeight: '1.5' }}>
            Visualização completa da cadeia de hélices. A disposição segue a ordem alternada dos extremos para o centro 
            (<strong>1, N, 2, N-1, 3, N-2...</strong>) com conexões automáticas entre o polo <strong>(−)</strong> e o polo <strong>(+)</strong> subsequente.
          </p>
        </div>

        {/* Visualizador gráfico com scroll horizontal */}
        <div
          ref={containerRef}
          style={{
            flex: 1,
            overflowX: 'auto',
            overflowY: 'hidden',
            padding: '20px 0',
            position: 'relative',
            background: '#070a0d',
          }}
        >
          <div style={{ width: Math.max(totalWidth, 600), height: canvasHeight, position: 'relative' }}>
            {/* Camada SVG de conexões internas */}
            <svg
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: Math.max(totalWidth, 600),
                height: canvasHeight,
                pointerEvents: 'none',
              }}
            >
              {internalConnections.map((conn) => {
                const pFrom = nodePositionMap.get(conn.from);
                const pTo = nodePositionMap.get(conn.to);
                if (!pFrom || !pTo) return null;

                const startX = pFrom.rightX;
                const startY = pFrom.y;
                const endX = pTo.leftX;
                const endY = pTo.y;

                const dx = Math.max(30, Math.abs(endX - startX) * 0.4);
                const path = `M ${startX} ${startY} C ${startX + dx} ${startY}, ${endX - dx} ${endY}, ${endX} ${endY}`;

                return (
                  <g key={conn.id}>
                    <path
                      d={path}
                      stroke="var(--cyan)"
                      strokeWidth="2"
                      fill="none"
                      strokeDasharray="4 2"
                      opacity="0.85"
                    />
                    <circle cx={startX} cy={startY} r="4" fill="var(--cyan)" />
                    <circle cx={endX} cy={endY} r="4" fill="var(--cyan)" />
                  </g>
                );
              })}
            </svg>

            {/* Sub-regiões individuais renderizadas em linha */}
            {subs.map((sub, index) => {
              const x = CANVAS_PADDING + index * (SUB_WIDTH + SUB_GAP);
              const subNodes = buildSubRegionNodes(sub);
              const bottomNode = subNodes[0];
              const topNode = subNodes[1];
              const startBranch = globalBranches.get(sub.id) || (index + 1);

              return (
                <div
                  key={sub.id}
                  style={{
                    position: 'absolute',
                    left: x,
                    top: 20,
                    width: SUB_WIDTH,
                    height: SUB_HEIGHT,
                    background: '#0e141b',
                    border: '1px solid #25313d',
                    borderRadius: '8px',
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ textAlign: 'center', borderBottom: '1px solid #1a232c', paddingBottom: '4px' }}>
                    <span style={{ fontSize: '9px', color: 'var(--green)', display: 'block', fontWeight: 700 }}>
                      POSIÇÃO {index + 1}
                    </span>
                    <strong style={{ fontSize: '11px', color: '#edf2f7' }}>{sub.name}</strong>
                  </div>

                  {/* Nó Superior (+) */}
                  {topNode && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: '#131b24',
                        padding: '4px 6px',
                        borderRadius: '6px',
                        border: '1px solid #273746',
                      }}
                    >
                      <span style={{ fontSize: '10px', color: 'var(--cyan)', fontWeight: 700 }}>
                        {topNode.polarity || '+'}{globalNumbers.get(topNode.id) ?? topNode.number}
                      </span>
                      <span style={{ fontSize: '8px', color: '#687887' }}>Nó Superior</span>
                    </div>
                  )}

                  {/* Rama */}
                  <div style={{ textAlign: 'center' }}>
                    <span
                      style={{
                        fontSize: '9px',
                        color: '#94a3b8',
                        background: '#18222d',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        border: '1px solid rgba(69,214,255,0.15)',
                        fontFamily: 'monospace',
                        fontWeight: 700,
                      }}
                    >
                      R{startBranch}
                    </span>
                  </div>

                  {/* Nó Inferior (-) */}
                  {bottomNode && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: '#131b24',
                        padding: '4px 6px',
                        borderRadius: '6px',
                        border: '1px solid #273746',
                      }}
                    >
                      <span style={{ fontSize: '10px', color: 'var(--cyan)', fontWeight: 700 }}>
                        {bottomNode.polarity || '-'}{globalNumbers.get(bottomNode.id) ?? bottomNode.number}
                      </span>
                      <span style={{ fontSize: '8px', color: '#687887' }}>Nó Inferior</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Tabela resumo da sequência de conexões internas */}
        <div
          style={{
            maxHeight: '160px',
            overflowY: 'auto',
            padding: '12px 24px',
            background: '#0a0e13',
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '8px' }}>
            SEQUÊNCIA DAS {internalConnections.length} LIGAÇÕES INTERNAS:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '8px' }}>
            {internalConnections.map((conn, i) => {
              const fromNum = globalNumbers.get(conn.from);
              const toNum = globalNumbers.get(conn.to);
              return (
                <div
                  key={conn.id || i}
                  style={{
                    background: '#111720',
                    border: '1px solid #202b38',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ color: '#687887' }}>Passo {i + 1}:</span>
                  <span>
                    <strong style={{ color: '#edf2f7' }}>Ponto {fromNum}</strong>
                    <span style={{ color: 'var(--cyan)', margin: '0 6px' }}>➜</span>
                    <strong style={{ color: '#edf2f7' }}>Ponto {toNum}</strong>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="detail-footer">
          <span>{subs.length} sub-regiões internas</span>
          <span style={{ color: 'var(--green)' }}>{internalConnections.length} conexões internas</span>
          <span>2 nós externos expostos</span>
        </div>
      </section>
    </div>
  );
}

