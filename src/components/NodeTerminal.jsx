import React from 'react';

export default function NodeTerminal({ node, globalNumber, selected, connected, isCenter, onClick, top = 0 }) {
  return (
    <button
      type="button"
      className={`node-terminal node-output ${selected ? 'node-selected' : ''} ${connected ? 'node-connected' : ''} ${isCenter ? 'node-center' : ''}`}
      style={{ top }}
      title={`Ponto ${node.polarity || ''}${globalNumber}${isCenter ? ' (Nó Central)' : ''} • ${connected ? 'Conectado' : 'Sem conexão'} • clique para conectar`}
      onClick={(event) => {
        event.stopPropagation();
        onClick(node);
      }}
    >
      <span className={`node-badge ${isCenter ? 'badge-center' : ''}`}>
        {node.polarity ? `${node.polarity}${globalNumber}` : globalNumber}
        {isCenter && <span className="center-tag" title="Nó Central">●</span>}
      </span>
      <span className={`node-dot left ${connected ? 'connected' : ''} ${isCenter ? 'center-dot' : ''}`} />
      <span className="node-port-ring left" />
      <span className={`node-dot right ${connected ? 'connected' : ''} ${isCenter ? 'center-dot' : ''}`} />
      <span className="node-port-ring right" />
    </button>
  );
}
