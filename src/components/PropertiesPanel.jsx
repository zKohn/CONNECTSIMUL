import React from 'react';
import { MAX_OPENINGS, resizeBranches } from '../model/electricalModel';

export default function PropertiesPanel({
  subRegion,
  onChange,
  onClose,
  onDelete,
  onOpenGroupDetail,
  onUpdateVoltageValue,
  onRotate,
}) {
  if (!subRegion) {
    return (
      <aside className="properties-panel empty-panel">
        <div className="panel-icon">⌁</div>
        <h2>Nenhum elemento selecionado</h2>
        <p>Selecione uma sub-região ou um pino (fonte / terra) para editar suas propriedades.</p>
      </aside>
    );
  }

  if (subRegion.type === 'voltage-source') {
    return (
      <aside className="properties-panel">
        <div className="panel-title-row">
          <div>
            <span className="eyebrow" style={{ color: 'var(--amber)' }}>FONTE DE TENSÃO</span>
            <h2>{subRegion.voltageValue || '0'} kV</h2>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Fechar">×</button>
        </div>

        <label className="field" style={{ marginTop: '16px' }}>
          <span>Nível de tensão aplicada (kV)</span>
          <input
            type="number"
            step="any"
            className="no-spinner-input"
            value={subRegion.voltageValue ?? ''}
            onChange={(e) => onUpdateVoltageValue ? onUpdateVoltageValue(e.target.value) : onChange({ ...subRegion, voltageValue: e.target.value })}
            placeholder="Ex: 110"
          />
        </label>

        <div className="property-card" style={{ marginTop: '12px' }}>
          <div>
            <strong style={{ color: 'var(--amber)' }}>{subRegion.isConnected ? 'Conectada' : 'Livre'}</strong>
            <span>status</span>
          </div>
          <div>
            <strong>{subRegion.connectedNodeLabel || '—'}</strong>
            <span>ponto conectado</span>
          </div>
        </div>

        <p className="hint">
          {subRegion.isConnected
            ? `Tensão de ${subRegion.voltageValue || '0'} kV aplicada ao ponto ${subRegion.connectedNodeLabel}.`
            : 'Clique no terminal do pino de fonte e depois no terminal de uma sub-região para conectá-los.'}
        </p>

        <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
          {onRotate && (
            <button
              type="button"
              className="btn btn-secondary"
              style={{ flex: 1 }}
              onClick={onRotate}
              title="Girar pino 90 graus (tecla R)"
            >
              ⟳ Girar (R)
            </button>
          )}
          <button
            type="button"
            className="btn btn-danger"
            style={{ flex: 1 }}
            onClick={onDelete}
          >
            Deletar
          </button>
        </div>
      </aside>
    );
  }

  if (subRegion.type === 'earth') {
    return (
      <aside className="properties-panel">
        <div className="panel-title-row">
          <div>
            <span className="eyebrow" style={{ color: 'var(--green)' }}>TERRA / REFERÊNCIA</span>
            <h2>0.0 kV (Terra)</h2>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Fechar">×</button>
        </div>

        <div className="property-card" style={{ marginTop: '16px' }}>
          <div>
            <strong style={{ color: 'var(--green)' }}>{subRegion.isConnected ? 'Aterrado' : 'Livre'}</strong>
            <span>status</span>
          </div>
          <div>
            <strong>{subRegion.connectedNodeLabel || '—'}</strong>
            <span>ponto aterrado</span>
          </div>
        </div>

        <p className="hint">
          {subRegion.isConnected
            ? `Ponto ${subRegion.connectedNodeLabel} definido como referência de potencial zero (0 kV).`
            : 'Clique no terminal do pino de terra e depois em um nó de sub-região para aterrá-lo.'}
        </p>

        <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
          {onRotate && (
            <button
              type="button"
              className="btn btn-secondary"
              style={{ flex: 1 }}
              onClick={onRotate}
              title="Girar pino 90 graus (tecla R)"
            >
              ⟳ Girar (R)
            </button>
          )}
          <button
            type="button"
            className="btn btn-danger"
            style={{ flex: 1 }}
            onClick={onDelete}
          >
            Deletar
          </button>
        </div>
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
          max="1000"
          value={subRegion.branches ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            if (val === '') {
              onChange(resizeBranches(subRegion, ''));
            } else {
              const parsed = parseInt(val, 10);
              if (!isNaN(parsed)) {
                onChange(resizeBranches(subRegion, Math.max(1, Math.min(1000, parsed))));
              }
            }
          }}
          onBlur={() => {
            if (!subRegion.branches || subRegion.branches < 1) {
              onChange(resizeBranches(subRegion, 1));
            }
          }}
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
          <strong>{Math.max(0, subRegion.branches - 1)}</strong>
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
