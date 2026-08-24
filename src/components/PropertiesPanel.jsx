import React from 'react';
import { MAX_OPENINGS, resizeBranches } from '../model/electricalModel';

export default function PropertiesPanel({ subRegion, onChange, onClose, onDelete }) {
  if (!subRegion) {
    return (
      <aside className="properties-panel empty-panel">
        <div className="panel-icon">⌁</div>
        <h2>Nenhuma sub-região selecionada</h2>
        <p>Selecione um retângulo para editar ramas, polaridade e demais propriedades.</p>
      </aside>
    );
  }

  return (
    <aside className="properties-panel">
      <div className="panel-title-row">
        <div>
          <span className="eyebrow">PROPRIEDADES</span>
          <h2>{subRegion.name}</h2>
        </div>
        <button className="icon-btn" onClick={onClose} aria-label="Fechar">×</button>
      </div>

      <label className="field">
        <span>Nome</span>
        <input
          value={subRegion.name}
          onChange={(e) => onChange({ ...subRegion, name: e.target.value })}
        />
      </label>

      <label className="field">
        <span>Quantidade de ramas</span>
        <input
          type="number"
          min="1"
          value={subRegion.branches}
          onChange={(e) => onChange(resizeBranches(subRegion, e.target.value))}
        />
      </label>

      <div className="field">
        <span>Polaridade superior</span>
        <div className="segmented">
          <button
            className={subRegion.topPolarity === '+' ? 'selected' : ''}
            onClick={() => onChange({ ...subRegion, topPolarity: '+' })}
          >
            + Superior
          </button>
          <button
            className={subRegion.topPolarity === '-' ? 'selected' : ''}
            onClick={() => onChange({ ...subRegion, topPolarity: '-' })}
          >
            − Superior
          </button>
        </div>
      </div>

      <div className="property-card">
        <div>
          <strong>{subRegion.openings.length}</strong>
          <span>aberturas</span>
        </div>
        <div>
          <strong>{MAX_OPENINGS}</strong>
          <span>máximo</span>
        </div>
      </div>

      <p className="hint">
        Clique em um marcador entre duas ramas para abrir ou fechar a conexão.
        Cada abertura cria dois nós independentes.
      </p>

      <button className="btn btn-danger" style={{ width: '100%', marginTop: '20px' }} onClick={onDelete}>
        Deletar Sub-região
      </button>
    </aside>
  );
}
