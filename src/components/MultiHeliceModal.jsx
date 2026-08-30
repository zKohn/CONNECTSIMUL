import React, { useState } from 'react';

export default function MultiHeliceModal({ onClose, onCreate }) {
  const [count, setCount] = useState(8);
  const [prefix, setPrefix] = useState('HÉLICE');
  const [topPolarity, setTopPolarity] = useState('+');

  function handleSubmit(e) {
    e.preventDefault();
    const num = Math.max(1, Math.min(64, Number(count) || 8));
    onCreate(num, prefix.trim() || 'HÉLICE', topPolarity);
    onClose();
  }

  return (
    <div className="table-overlay">
      <section className="table-modal multi-helice-modal" style={{ maxWidth: '460px' }}>
        <div className="table-header">
          <div>
            <span className="eyebrow">NOVA SUB-REGIÃO</span>
            <h2>Hélice Múltipla</h2>
          </div>
          <button className="icon-btn" onClick={onClose} type="button">×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px 24px' }}>
          <p style={{ color: '#8793a1', fontSize: '12px', marginTop: 0, marginBottom: '20px', lineHeight: '1.5' }}>
            Cria uma sequência horizontal na ordem <strong>1, N, 2, N-1, 3, N-2...</strong> e conecta automaticamente o ponto <strong>(−)</strong> de cada hélice ao ponto <strong>(+)</strong> da seguinte.
          </p>

          <label className="field">
            <span>Quantidade de hélices (sub-regiões)</span>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="number"
                min="1"
                max="64"
                value={count}
                onChange={(e) => setCount(Math.max(1, Math.min(64, parseInt(e.target.value, 10) || 1)))}
                style={{ width: '80px', textAlign: 'center' }}
                required
              />
              <input
                type="range"
                min="1"
                max="32"
                value={Math.min(32, count)}
                onChange={(e) => setCount(parseInt(e.target.value, 10))}
                style={{ flex: 1, accentColor: 'var(--cyan)' }}
              />
            </div>
          </label>

          <label className="field">
            <span>Prefixo do nome</span>
            <input
              type="text"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              placeholder="ex: HÉLICE ou SUB"
            />
          </label>

          <div className="field">
            <span>Polaridade superior</span>
            <div className="segmented">
              <button
                type="button"
                className={topPolarity === '+' ? 'selected' : ''}
                onClick={() => setTopPolarity('+')}
              >
                + Superior
              </button>
              <button
                type="button"
                className={topPolarity === '-' ? 'selected' : ''}
                onClick={() => setTopPolarity('-')}
              >
                − Superior
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button type="button" className="btn" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              ＋ Criar {count} {count === 1 ? 'Hélice' : 'Hélices'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
