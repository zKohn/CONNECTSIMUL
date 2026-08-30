import React from 'react';
import { MAX_OPENINGS, resizeBranches } from '../model/electricalModel';

export default function PropertiesPanel({ subRegion, onChange, onClose, onDelete, onOpenGroupDetail }) {
  if (!subRegion) {
    return (
      <aside className="properties-panel empty-panel">
        <div className="panel-icon">⌁</div>
        <h2>Nenhuma sub-região selecionada</h2>
        <p>Selecione um retângulo para editar ramas, polaridade e demais propriedades.</p>
      </aside>
    );
  }

  if (subRegion.isGroup) {
    return (
      <aside className="properties-panel">
        <div className="panel-title-row">
          <div>
            <span className="eyebrow" style={{ color: 'var(--green)' }}>HÉLICE MÚLTIPLA</span>
            <h2>{subRegion.name}</h2>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Fechar">×</button>
        </div>

        <div className="property-card" style={{ marginTop: '16px' }}>
          <div>
            <strong style={{ color: 'var(--green)' }}>{subRegion.branches}</strong>
            <span>hélices em série</span>
          </div>
          <div>
            <strong>2</strong>
            <span>nós externos</span>
          </div>
        </div>

        <p className="hint">
          As conexões internas entre as {subRegion.branches} hélices foram geradas automaticamente na sequência (1, N, 2, N-1...). Apenas os 2 nós externos ficam visíveis na tela principal.
        </p>

        {onOpenGroupDetail && (
          <button
            className="btn btn-accent"
            style={{ width: '100%', marginTop: '12px' }}
            onClick={() => onOpenGroupDetail(subRegion.id)}
          >
            ⊕ Ver Detalhes da Cadeia
          </button>
        )}

        <button
          className="btn btn-danger"
          style={{ width: '100%', marginTop: '20px' }}
          onClick={onDelete}
        >
          Deletar Hélice Múltipla
        </button>
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
          <strong>✂ {subRegion.openings.length}</strong>
          <span>cortes / aberturas</span>
        </div>
        <div>
          <strong>{MAX_OPENINGS}</strong>
          <span>máximo</span>
        </div>
      </div>

      <p className="hint">
        ✂ Clique em um marcador entre duas ramas para realizar um corte ou fechar a conexão.
        Cada corte cria dois nós independentes.
      </p>

      <button className="btn btn-danger" style={{ width: '100%', marginTop: '20px' }} onClick={onDelete}>
        Deletar Sub-região
      </button>
    </aside>
  );
}
