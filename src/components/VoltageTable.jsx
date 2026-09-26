import React, { useState } from 'react';

export default function VoltageTable({ config, globalNumbers, nodes = [], onClose }) {
  const { appliedNodeId, voltageValue, groundedNodeIds = [] } = config || {};
  const [copied, setCopied] = useState(false);

  const formatNode = (nodeId) => {
    if (!nodeId) return '—';
    if (globalNumbers && globalNumbers.has(nodeId)) {
      const gNum = globalNumbers.get(nodeId);
      return String(gNum).replace(/^[+\-]/, '');
    }
    const foundNode = nodes.find((n) => n.id === nodeId);
    if (foundNode) {
      const num = foundNode.number ?? foundNode.id;
      return String(num).replace(/^[+\-]/, '');
    }
    return String(nodeId).replace(/^[+\-]/, '');
  };

  const appliedNode = formatNode(appliedNodeId);
  const voltage = voltageValue !== '' && voltageValue != null ? String(voltageValue).replace(/\s*kV/i, '').trim() : '—';
  const groundedDisplayList = groundedNodeIds.map(formatNode);

  function handleCopy() {
    const headers = [
      'Ponto Aplicado',
      'Valor da Tensão (kV)',
      ...(groundedDisplayList.length > 0
        ? groundedDisplayList.map((_, i) => `Ponto Aterrado ${i + 1}`)
        : ['Ponto Aterrado']),
    ];
    const values = [
      appliedNode,
      voltage,
      ...(groundedDisplayList.length > 0 ? groundedDisplayList : ['—']),
    ];
    const text = headers.join('\t') + '\n' + values.join('\t');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); })
        .catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
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
            <span className="eyebrow">CONFIGURAÇÃO DE TENSÃO</span>
            <h2>Fonte de Tensão e Referência (Terra)</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              className="btn btn-primary"
              onClick={handleCopy}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px' }}
              title="Copiar dados para a área de transferência"
            >
              <span>{copied ? '✓' : '📋'}</span>
              <span>{copied ? 'Copiado!' : 'Copiar'}</span>
            </button>
            <button className="icon-btn" onClick={onClose} aria-label="Fechar">×</button>
          </div>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Ponto Aplicado</th>
                <th>Valor da Tensão (kV)</th>
                {groundedDisplayList.length > 0 ? (
                  groundedDisplayList.map((_, i) => <th key={i}>Ponto Aterrado {i + 1}</th>)
                ) : (
                  <th>Ponto Aterrado</th>
                )}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="potential-cell" style={{ fontWeight: 600 }}>{appliedNode}</td>
                <td style={{ color: 'var(--amber)', fontWeight: 600 }}>{voltage}</td>
                {groundedDisplayList.length > 0 ? (
                  groundedDisplayList.map((nodeName, i) => (
                    <td key={i} style={{ color: 'var(--green)', fontWeight: 600 }}>{nodeName}</td>
                  ))
                ) : (
                  <td style={{ color: 'var(--muted)' }}>—</td>
                )}
              </tr>
            </tbody>
          </table>
        </div>
        <div className="table-footer">
          <span>{appliedNodeId ? '1 nó com tensão aplicada' : 'Nenhuma tensão conectada'}</span>
          <span>{groundedNodeIds.length} nó(s) aterrado(s)</span>
        </div>
      </section>
    </div>
  );
}
