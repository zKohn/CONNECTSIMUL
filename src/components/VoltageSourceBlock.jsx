import React, { useRef } from 'react';

export const VOLTAGE_SOURCE_WIDTH = 48;
export const VOLTAGE_SOURCE_HEIGHT = 48;

export function getVoltageSourcePortPoint(source) {
  if (!source) return null;
  const rot = ((source.rotation || 0) % 360 + 360) % 360;
  // Base do triângulo fica em (24, 38) quando rotação é 0° (dx = 0, dy = 14)
  // Direção normal apontando para fora da base: para baixo (0, 1)
  let dx = 0;
  let dy = 14;
  let dirX = 0;
  let dirY = 1;

  if (rot === 90) {
    dx = -14;
    dy = 0;
    dirX = -1;
    dirY = 0;
  } else if (rot === 180) {
    dx = 0;
    dy = -14;
    dirX = 0;
    dirY = -1;
  } else if (rot === 270) {
    dx = 14;
    dy = 0;
    dirX = 1;
    dirY = 0;
  }

  const px = source.x + 24 + dx;
  const py = source.y + 24 + dy;

  return {
    isSingle: true,
    ports: [{ x: px, y: py, dirX, dirY, dir: dirX || 1 }],
    leftX: px,
    rightX: px,
    y: py,
  };
}

export default function VoltageSourceBlock({
  source,
  voltageValue,
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

  if (!source || source.enabled === false) return null;

  const terminalNode = {
    id: 'voltage-source-terminal',
    subRegionId: 'voltage-source',
    isOutput: true,
    polarity: 'V',
    number: 0,
    label: 'Fonte (kV)',
  };

  const isTerminalSelected = selectedNodeId === terminalNode.id;
  const rotation = source.rotation || 0;

  const handlePointerDown = (e) => {
    isDragging.current = false;
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    const startX = e.clientX;
    const startY = e.clientY;
    const initX = source.x;
    const initY = source.y;

    const move = (ev) => {
      const dist = Math.hypot(ev.clientX - dragStartPos.current.x, ev.clientY - dragStartPos.current.y);
      if (dist > 3) isDragging.current = true;
      onUpdatePosition(Math.max(20, initX + ev.clientX - startX), Math.max(60, initY + ev.clientY - startY));
    };

    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      if (isDragging.current) {
        if (onCommitPosition) onCommitPosition();
      } else {
        if (onSelect) onSelect('voltage-source');
      }
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const normalizedRot = ((rotation % 360) + 360) % 360;

  return (
    <div
      className={`triangular-pin triangular-pin--voltage ${isSelected ? 'triangular-pin--selected' : ''}`}
      style={{
        left: source.x,
        top: source.y,
        width: VOLTAGE_SOURCE_WIDTH,
        height: VOLTAGE_SOURCE_HEIGHT,
        position: 'absolute',
      }}
      onPointerDown={handlePointerDown}
      onDragStart={(e) => e.preventDefault()}
      title={`Fonte de Tensão (${voltageValue || '0'} kV) • Pressione [R] para girar • ${isConnected ? `Conectado a ${connectedNodeLabel}` : 'Clique para ver propriedades'}`}
    >
      <div
        className="pin-rotator"
        style={{
          width: '100%',
          height: '100%',
          transform: `rotate(${rotation}deg)`,
          transformOrigin: '24px 24px',
          position: 'relative',
        }}
      >
        <svg viewBox="0 0 48 48" className="pin-symbol-svg" aria-hidden="true">
          {/* Triângulo apontando para cima estilo Multisim probe */}
          <polygon
            points="24,6 42,38 6,38"
            fill="rgba(255, 200, 87, 0.16)"
            stroke="var(--amber)"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          {/* Raio/símbolo elétrico sutil no centro */}
          <path
            d="M25 15 L19 26 L24 26 L23 33 L29 23 L24 23 Z"
            fill="var(--amber)"
            opacity="0.9"
          />
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
          title={`Conectar Fonte de Tensão (${voltageValue || '0'} kV)`}
        >
          <span className={`node-dot ${isConnected ? 'connected' : ''}`} />
          <span className="node-port-ring" />
        </button>
      </div>

      {/* Rótulo com o valor de tensão visível na tela inicial */}
      <div className={`pin-voltage-badge rot-${normalizedRot}`}>
        {voltageValue || '0'} kV
      </div>
    </div>
  );
}
