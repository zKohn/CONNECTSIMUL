import React from 'react';

export default function NodeTerminal({ node, globalNumber, selected, onClick, top = 0 }) {
  return (
    <button
      type="button"
      className={`node-terminal node-output ${selected ? 'node-selected' : ''}`}
      style={{ top }}
      title={`Ponto ${node.polarity || ''}${globalNumber} • clique para conectar`}
      onClick={(event) => {
        event.stopPropagation();
        onClick(node);
      }}
    >
      <span className="node-badge">
        {node.polarity ? `${node.polarity}${globalNumber}` : globalNumber}
      </span>
      <span className="node-dot left" />
      <span className="node-port-ring left" />
      <span className="node-dot right" />
      <span className="node-port-ring right" />
    </button>
  );
}
