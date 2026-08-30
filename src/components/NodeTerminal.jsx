import React from 'react';

export default function NodeTerminal({ node, globalNumber, selected, connected, onClick, top = 0 }) {
  return (
    <button
      type="button"
      className={`node-terminal node-output ${selected ? 'node-selected' : ''} ${connected ? 'node-connected' : ''}`}
      style={{ top }}
      title={`Ponto ${node.polarity || ''}${globalNumber} • ${connected ? 'Conectado' : 'Sem conexão'} • clique para conectar`}
      onClick={(event) => {
        event.stopPropagation();
        onClick(node);
      }}
    >
      <span className="node-badge">
        {node.polarity ? `${node.polarity}${globalNumber}` : globalNumber}
      </span>
      <span className={`node-dot left ${connected ? 'connected' : ''}`} />
      <span className="node-port-ring left" />
      <span className={`node-dot right ${connected ? 'connected' : ''}`} />
      <span className="node-port-ring right" />
    </button>
  );
}
