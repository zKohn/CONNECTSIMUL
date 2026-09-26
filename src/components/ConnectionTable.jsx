import React, { useState } from 'react';

export default function ConnectionTable({ rows, onClose }) {
  const maxColumns = Math.max(1, ...rows.map((row) => row.points.length));
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    if (rows.length === 0) return;

    // Gera formato tabular separado por TAB (ideal para colar no Excel/planilhas)
    const header = ['Linha', ...Array.from({ length: maxColumns }, (_, i) => `N${i + 1}`)];
    const lines = [
      header.join('\t'),
      ...rows.map((row, index) => [index + 1, ...row.points].join('\t')),
    ];
    const textToCopy = lines.join('\n');

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => fallbackCopy(textToCopy));
    } else {
      fallbackCopy(textToCopy);
    }
  }

  function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
    document.body.removeChild(textarea);
  }

  return (
    <div className="table-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <section className="table-modal">
        <div className="table-header">
          <div>
            <span className="eyebrow">MAPA DE POTENCIAIS</span>
            <h2>Conexões elétricas</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              className="btn btn-primary"
              onClick={handleCopy}
              title="Copiar dados da tabela para a área de transferência (compatível com Excel e planilhas)"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px' }}
            >
              <span>{copied ? '✓' : '📋'}</span>
              <span>{copied ? 'Copiado!' : 'Copiar para a área de transferência'}</span>
            </button>
            <button className="icon-btn" onClick={onClose} aria-label="Fechar">×</button>
          </div>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Linha</th>
                {Array.from({ length: maxColumns }, (_, i) => (
                  <th key={i}>N{i + 1}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.id}>
                  <td className="potential-cell">{index + 1}</td>
                  {Array.from({ length: maxColumns }, (_, i) => (
                    <td key={i}>{row.points[i] ?? ''}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <span>{rows.length} linhas identificadas</span>
          <span>Um ponto pertence a apenas uma linha de conexão.</span>
        </div>
      </section>
    </div>
  );
}
