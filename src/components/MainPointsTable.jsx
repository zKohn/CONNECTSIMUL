import React, { useState, useMemo } from 'react';

/**
 * Converte uma string com números, listas ou intervalos em um array de números inteiros positivos ordenados.
 * Suporta formatos como: "1, 2, 3, 4", "1 2 3 4", "1-4", "1; 2; 3; 4".
 */
export function parsePointsInput(input) {
  if (!input) return [];
  const points = new Set();
  const tokens = String(input).split(/[,;\s]+/);
  for (const token of tokens) {
    const trimmed = token.trim();
    if (!trimmed) continue;
    const rangeMatch = trimmed.match(/^(\d+)(?:-|\.\.)(\d+)$/);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);
      const [min, max] = start <= end ? [start, end] : [end, start];
      const safeMax = Math.min(max, min + 1000);
      for (let i = min; i <= safeMax; i++) {
        if (i > 0) points.add(i);
      }
    } else {
      const num = parseInt(trimmed, 10);
      if (!isNaN(num) && num > 0) {
        points.add(num);
      }
    }
  }
  return Array.from(points).sort((a, b) => a - b);
}

/**
 * Gera todas as combinações de 2 pontos (N1, N2) a partir de uma lista de pontos.
 * Sendo N1 < N2, no formato canônico combinatório:
 * 1-2, 1-3, 1-4, 2-3, 2-4, 3-4...
 */
export function generatePointCombinations(points) {
  const sorted = Array.from(new Set(points.map(Number)))
    .filter((n) => Number.isInteger(n) && n > 0)
    .sort((a, b) => a - b);

  const rows = [];
  let index = 1;
  for (let i = 0; i < sorted.length - 1; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      rows.push({
        index: index++,
        n1: sorted[i],
        n2: sorted[j],
      });
    }
  }
  return rows;
}

export default function MainPointsTable({
  points = [1, 2, 3, 4],
  availableNumbers = [],
  onUpdatePoints,
  onClose,
}) {
  const [copied, setCopied] = useState(false);
  const [inputVal, setInputVal] = useState(() => (points && points.length > 0 ? points.join(' ') : '1 2 3 4'));

  // Conjunto de pontos ativos
  const activePoints = useMemo(() => {
    return Array.from(new Set(points.map(Number)))
      .filter((n) => Number.isInteger(n) && n > 0)
      .sort((a, b) => a - b);
  }, [points]);

  // Combinações geradas (N1 x N2)
  const rows = useMemo(() => generatePointCombinations(activePoints), [activePoints]);

  const activePointsSet = useMemo(() => new Set(activePoints), [activePoints]);

  function applyInput(textToApply) {
    const parsed = parsePointsInput(textToApply !== undefined ? textToApply : inputVal);
    onUpdatePoints(parsed);
    setInputVal(parsed.join(' '));
  }

  function handleInputKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      applyInput();
    }
  }

  function togglePoint(pointNum) {
    let next;
    if (activePointsSet.has(pointNum)) {
      next = activePoints.filter((p) => p !== pointNum);
    } else {
      next = [...activePoints, pointNum].sort((a, b) => a - b);
    }
    onUpdatePoints(next);
    setInputVal(next.join(' '));
  }

  function handleSelectAllAvailable() {
    if (availableNumbers && availableNumbers.length > 0) {
      const next = Array.from(new Set(availableNumbers)).sort((a, b) => a - b);
      onUpdatePoints(next);
      setInputVal(next.join(' '));
    }
  }

  function handleClear() {
    onUpdatePoints([]);
    setInputVal('');
  }

  function handleLoadExample() {
    const example = [1, 2, 3, 4];
    onUpdatePoints(example);
    setInputVal(example.join(' '));
  }

  function handleCopy() {
    if (rows.length === 0) return;

    const headers = ['ÍNDICE', 'N1', 'N2'];
    const lines = [
      headers.join('\t'),
      ...rows.map((row) => [row.index, row.n1, row.n2].join('\t')),
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
      <section className="table-modal main-points-modal" style={{ maxWidth: '640px' }}>
        <div className="table-header">
          <div>
            <span className="eyebrow" style={{ color: 'var(--cyan)' }}>RELAÇÕES ENTRE PONTOS</span>
            <h2>Pontos Principais (N1 × N2)</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              className="btn btn-primary"
              onClick={handleCopy}
              disabled={rows.length === 0}
              title="Copiar tabela para a área de transferência (compatível com Excel e planilhas)"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px' }}
            >
              <span>{copied ? '✓' : '📋'}</span>
              <span>{copied ? 'Copiado!' : 'Copiar'}</span>
            </button>
            <button className="icon-btn" onClick={onClose} aria-label="Fechar">×</button>
          </div>
        </div>

        {/* Painel de seleção de pontos */}
        <div className="main-points-panel">
          <div className="main-points-input-row">
            <label className="field" style={{ flex: 1, margin: 0 }}>
              <span style={{ fontSize: '11px', color: '#8b98a5' }}>
                Digite os pontos principais (separados por espaço simples, ex: 1 2 3 4):
              </span>
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <input
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  onBlur={() => applyInput()}
                  onKeyDown={handleInputKeyDown}
                  placeholder="ex: 1 2 3 4"
                  style={{ flex: 1, padding: '7px 10px', fontSize: '12px' }}
                />
                <button
                  type="button"
                  className="btn"
                  onClick={() => applyInput()}
                  title="Aplicar pontos digitados"
                  style={{ padding: '0 14px', fontSize: '11px', background: 'rgba(69, 214, 255, 0.1)', borderColor: 'var(--cyan)', color: 'var(--cyan)' }}
                >
                  Aplicar
                </button>
              </div>
            </label>
          </div>

          {/* Atalhos rápidos */}
          <div className="main-points-shortcuts">
            <span style={{ fontSize: '10px', color: '#687580', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Ações Rápidas:
            </span>
            <button
              type="button"
              className="shortcut-chip"
              onClick={handleLoadExample}
              title="Carregar pontos 1, 2, 3 e 4 do exemplo"
            >
              Exemplo (1 a 4)
            </button>
            {availableNumbers && availableNumbers.length > 0 && (
              <button
                type="button"
                className="shortcut-chip"
                onClick={handleSelectAllAvailable}
                title="Selecionar todos os pontos existentes no circuito"
              >
                Todos do circuito ({availableNumbers.length})
              </button>
            )}
            <button
              type="button"
              className="shortcut-chip shortcut-chip--danger"
              onClick={handleClear}
              title="Limpar seleção"
            >
              Limpar
            </button>
          </div>

          {/* Seletor rápido de pontos existentes no circuito em formato de chips */}
          {availableNumbers && availableNumbers.length > 0 && (
            <div className="main-points-available">
              <span style={{ fontSize: '10px', color: '#687580', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Pontos do Circuito (clique para alternar):
              </span>
              <div className="points-chip-list">
                {availableNumbers.map((p) => {
                  const isSelected = activePointsSet.has(p);
                  return (
                    <button
                      key={p}
                      type="button"
                      className={`point-toggle-chip ${isSelected ? 'point-toggle-chip--active' : ''}`}
                      onClick={() => togglePoint(p)}
                      title={`Ponto ${p} - ${isSelected ? 'remover' : 'adicionar'}`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Tabela de combinações (ÍNDICE, N1, N2) */}
        <div className="table-scroll" style={{ maxHeight: '380px' }}>
          {rows.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th style={{ width: '80px', textAlign: 'center' }}>ÍNDICE</th>
                  <th style={{ textAlign: 'center', color: 'var(--cyan)' }}>N1</th>
                  <th style={{ textAlign: 'center', color: 'var(--cyan)' }}>N2</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.index}>
                    <td className="potential-cell" style={{ textAlign: 'center', fontWeight: 'bold' }}>
                      {row.index}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '12px' }}>
                      {row.n1}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '12px' }}>
                      {row.n2}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '36px 20px', textAlign: 'center', color: '#687580', fontSize: '12px' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>📊</div>
              <strong style={{ color: '#8b98a5', display: 'block', marginBottom: '4px' }}>
                Nenhuma combinação para exibir
              </strong>
              <span>
                Selecione pelo menos <strong>2 pontos principais</strong> acima para gerar a tabela de relações entre os pontos (N1 × N2).
              </span>
            </div>
          )}
        </div>

        <div className="table-footer">
          <span>
            {rows.length} {rows.length === 1 ? 'relação' : 'relações'} geradas a partir de {activePoints.length} {activePoints.length === 1 ? 'ponto' : 'pontos'} selecionados
          </span>
          <span>Todas as combinações de 2 pontos (N1 &lt; N2)</span>
        </div>
      </section>
    </div>
  );
}
