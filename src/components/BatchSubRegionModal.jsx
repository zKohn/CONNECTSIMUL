import React, { useState } from 'react';

export default function BatchSubRegionModal({ onClose, onCreateBatch }) {
  const [rows, setRows] = useState([
    { id: 1, type: 'sub', count: 4, topPolarity: '+', name: '' },
    { id: 2, type: 'sub', count: 4, topPolarity: '+', name: '' },
    { id: 3, type: 'sub', count: 4, topPolarity: '+', name: '' },
  ]);

  function updateRow(id, field, value) {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  }

  function addRow() {
    setRows((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        type: 'sub',
        count: 4,
        topPolarity: '+',
        name: '',
      },
    ]);
  }

  function removeRow(id) {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  function duplicateRow(id) {
    const target = rows.find((r) => r.id === id);
    if (!target) return;
    const newRow = {
      ...target,
      id: Date.now() + Math.random(),
    };
    const index = rows.findIndex((r) => r.id === id);
    const updated = [...rows];
    updated.splice(index + 1, 0, newRow);
    setRows(updated);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (rows.length === 0) return;
    onCreateBatch(rows);
    onClose();
  }

  return (
    <div className="table-overlay">
      <section className="table-modal" style={{ maxWidth: '780px', width: '95vw' }}>
        <div className="table-header">
          <div>
            <span className="eyebrow" style={{ color: 'var(--cyan)' }}>GERAÇÃO EM LOTE</span>
            <h2>Tabela de Criação Rápida de Subs</h2>
          </div>
          <button className="icon-btn" onClick={onClose} type="button">×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div style={{ padding: '14px 20px 8px', borderBottom: '1px solid var(--border)', background: '#0a0d12' }}>
            <p style={{ margin: 0, color: '#8793a1', fontSize: '12px', lineHeight: '1.5' }}>
              Configure sequencialmente as sub-regiões desejadas. Você pode definir se cada item é uma <strong>Sub Padrão</strong> (com N ramas) ou uma <strong>Hélice Múltipla</strong> (sequência em série de N hélices), além da polaridade superior e nome personalizado.
            </p>
          </div>

          <div className="table-scroll" style={{ padding: '16px 20px', maxHeight: '52vh', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 6px' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#7f8ea0', fontSize: '11px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '6px 8px', width: '38px', textAlign: 'center' }}>#</th>
                  <th style={{ padding: '6px 8px', width: '150px' }}>Tipo</th>
                  <th style={{ padding: '6px 8px', width: '110px' }}>Qtd (Ramas/Hélices)</th>
                  <th style={{ padding: '6px 8px', width: '150px' }}>Polaridade Superior</th>
                  <th style={{ padding: '6px 8px' }}>Nome (Opcional)</th>
                  <th style={{ padding: '6px 8px', width: '70px', textAlign: 'center' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr
                    key={row.id}
                    style={{
                      background: '#11161d',
                      borderRadius: '6px',
                    }}
                  >
                    <td style={{ padding: '8px', textAlign: 'center', color: '#687887', fontWeight: 600, fontSize: '12px' }}>
                      {idx + 1}
                    </td>
                    <td style={{ padding: '8px' }}>
                      <select
                        value={row.type}
                        onChange={(e) => updateRow(row.id, 'type', e.target.value)}
                        style={{
                          width: '100%',
                          background: '#171d25',
                          border: '1px solid #252d37',
                          borderRadius: '6px',
                          color: '#edf2f7',
                          padding: '6px 8px',
                          fontSize: '12px',
                        }}
                      >
                        <option value="sub">Sub Padrão</option>
                        <option value="helice">Hélice Múltipla</option>
                      </select>
                    </td>
                    <td style={{ padding: '8px' }}>
                      <input
                        type="number"
                        min="1"
                        max="64"
                        value={row.count}
                        onChange={(e) =>
                          updateRow(row.id, 'count', Math.max(1, Math.min(64, parseInt(e.target.value, 10) || 1)))
                        }
                        style={{
                          width: '100%',
                          background: '#171d25',
                          border: '1px solid #252d37',
                          borderRadius: '6px',
                          color: '#edf2f7',
                          padding: '6px 8px',
                          fontSize: '12px',
                          textAlign: 'center',
                        }}
                        required
                      />
                    </td>
                    <td style={{ padding: '8px' }}>
                      <div className="segmented" style={{ margin: 0, padding: '2px', background: '#171d25' }}>
                        <button
                          type="button"
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                          className={row.topPolarity === '+' ? 'selected' : ''}
                          onClick={() => updateRow(row.id, 'topPolarity', '+')}
                        >
                          + Sup
                        </button>
                        <button
                          type="button"
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                          className={row.topPolarity === '-' ? 'selected' : ''}
                          onClick={() => updateRow(row.id, 'topPolarity', '-')}
                        >
                          − Sup
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '8px' }}>
                      <input
                        type="text"
                        placeholder={row.type === 'helice' ? 'ex: HÉLICE' : `SUB ${String(idx + 1).padStart(2, '0')}`}
                        value={row.name}
                        onChange={(e) => updateRow(row.id, 'name', e.target.value)}
                        style={{
                          width: '100%',
                          background: '#171d25',
                          border: '1px solid #252d37',
                          borderRadius: '6px',
                          color: '#edf2f7',
                          padding: '6px 8px',
                          fontSize: '12px',
                        }}
                      />
                    </td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        <button
                          type="button"
                          title="Duplicar linha"
                          onClick={() => duplicateRow(row.id)}
                          style={{
                            background: 'rgba(69, 214, 255, 0.08)',
                            border: '1px solid rgba(69, 214, 255, 0.2)',
                            color: 'var(--cyan)',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            padding: '3px 6px',
                            fontSize: '11px',
                          }}
                        >
                          ⧉
                        </button>
                        <button
                          type="button"
                          title="Remover linha"
                          disabled={rows.length <= 1}
                          onClick={() => removeRow(row.id)}
                          style={{
                            background: 'rgba(255, 100, 124, 0.08)',
                            border: '1px solid rgba(255, 100, 124, 0.2)',
                            color: 'var(--danger)',
                            borderRadius: '4px',
                            cursor: rows.length <= 1 ? 'not-allowed' : 'pointer',
                            opacity: rows.length <= 1 ? 0.3 : 1,
                            padding: '3px 6px',
                            fontSize: '11px',
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ marginTop: '12px' }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={addRow}
                style={{ width: '100%', borderStyle: 'dashed', padding: '8px' }}
              >
                ＋ Adicionar linha
              </button>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 20px',
              borderTop: '1px solid var(--border)',
              background: '#0a0d12',
            }}
          >
            <span style={{ fontSize: '12px', color: '#7f8ea0' }}>
              Total: <strong>{rows.length}</strong> {rows.length === 1 ? 'configuração' : 'configurações'}
            </span>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" className="btn" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                ⚡ Gerar Todas as Subs ({rows.length})
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}
