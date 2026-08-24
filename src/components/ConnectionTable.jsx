import React from 'react';

export default function ConnectionTable({ rows, onClose }) {
  const maxColumns = Math.max(1, ...rows.map((row) => row.points.length));

  return (
    <div className="table-overlay">
      <section className="table-modal">
        <div className="table-header">
          <div>
            <span className="eyebrow">MAPA DE POTENCIAIS</span>
            <h2>Conexões elétricas</h2>
          </div>
          <button className="icon-btn" onClick={onClose}>×</button>
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
