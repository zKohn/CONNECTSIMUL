import React, { useRef } from 'react';

export const EARTH_WIDTH = 48;
export const EARTH_HEIGHT = 48;

export function getEarthPortPoint(earth) {
  if (!earth) return null;
  const rot = ((earth.rotation || 0) % 360 + 360) % 360;
  // Base do triângulo fica em (24, 10) quando rotação é 0° (dx = 0, dy = -14)
  // Direção normal apontando para fora da base: para cima (0, -1)
  let dx = 0;
  let dy = -14;
  let dirX = 0;
  let dirY = -1;

  if (rot === 90) {
    dx = 14;
    dy = 0;
    dirX = 1;
    dirY = 0;
  } else if (rot === 180) {
    dx = 0;
    dy = 14;
    dirX = 0;
    dirY = 1;
  } else if (rot === 270) {
    dx = -14;
    dy = 0;
    dirX = -1;
    dirY = 0;
  }

  const px = earth.x + 24 + dx;
  const py = earth.y + 24 + dy;

  return {
    isSingle: true,
    ports: [{ x: px, y: py, dirX, dirY, dir: dirX || 1 }],
    leftX: px,
    rightX: px,
    y: py,
  };
}

export default function EarthBlock({
  earth,
  selectedNodeId,
  isSelected,
  isConnected,
  connectedNodeLabel,
  onSelectNode,
  onSelect,
  onUpdatePosition,
  onCommitPosition,
}) {
  const isDragging = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });

  if (!earth) return null;

  const terminalNode = {
    id: `earth-${earth.id}-terminal`,
    subRegionId: earth.id,
    isOutput: true,
    polarity: '⏚',
    number: 0,
    label: 'Terra (0 kV)',
  };

  const isTerminalSelected = selectedNodeId === terminalNode.id;
  const rotation = earth.rotation || 0;

  const handlePointerDown = (e) => {
    isDragging.current = false;
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    const startX = e.clientX;
    const startY = e.clientY;
    const initX = earth.x;
    const initY = earth.y;

    const move = (ev) => {
      const dist = Math.hypot(ev.clientX - dragStartPos.current.x, ev.clientY - dragStartPos.current.y);
      if (dist > 3) isDragging.current = true;
      onUpdatePosition(earth.id, Math.max(20, initX + ev.clientX - startX), Math.max(60, initY + ev.clientY - startY));
    };

    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      if (isDragging.current) {
        if (onCommitPosition) onCommitPosition();
      } else {
        if (onSelect) onSelect(earth.id);
      }
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  return (
    <div
      className={`triangular-pin triangular-pin--earth ${isSelected ? 'triangular-pin--selected' : ''}`}
      style={{
        left: earth.x,
        top: earth.y,
        width: EARTH_WIDTH,
        height: EARTH_HEIGHT,
        position: 'absolute',
        transform: `rotate(${rotation}deg)`,
        transformOrigin: '24px 24px',
      }}
      onPointerDown={handlePointerDown}
      title={`Ponto de Terra (0 kV) • Pressione [R] para girar • ${isConnected ? `Conectado a ${connectedNodeLabel}` : 'Clique para ver propriedades'}`}
    >
      <svg viewBox="0 0 48 48" className="pin-symbol-svg" aria-hidden="true">
        {/* Triângulo de referência de terra apontando para baixo estilo Multisim */}
        <polygon
          points="6,10 42,10 24,42"
          fill="rgba(89, 227, 145, 0.16)"
          stroke="var(--green)"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        {/* Linhas internas do símbolo de terra */}
        <line x1="14" y1="18" x2="34" y2="18" stroke="var(--green)" strokeWidth="2" strokeLinecap="round" />
        <line x1="18" y1="24" x2="30" y2="24" stroke="var(--green)" strokeWidth="2" strokeLinecap="round" />
        <line x1="21" y1="30" x2="27" y2="30" stroke="var(--green)" strokeWidth="2" strokeLinecap="round" />
      </svg>

      {/* Terminal de conexão único na parte maior (base) do triângulo */}
      <button
        type="button"
        className={`pin-port-terminal ${isTerminalSelected ? 'pin-port--selected' : ''} ${isConnected ? 'pin-port--connected' : ''}`}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onSelectNode(terminalNode);
        }}
        title="Conectar Ponto de Terra (0 kV)"
      >
        <span className={`node-dot ${isConnected ? 'connected' : ''}`} />
        <span className="node-port-ring" />
      </button>
    </div>
  );
}
