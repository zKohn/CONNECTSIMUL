import React from 'react';

export default function Toolbar({
  onAddSubRegion,
  onDeleteConnection,
  onClearSelection,
  onExport,
  connectionMode,
  selectedNode,
  onOpenTable,
}) {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark">⚡</div>
        <div>
          <h1>CONNECTSIMUL</h1>
          <span>Tornando as conexões entre "nós" muito mais fácil!</span>
        </div>
      </div>

      <div className="toolbar-actions">
        <button className="btn btn-primary" onClick={onAddSubRegion}>
          <span>＋</span> Sub-região
        </button>
        <button className="btn" onClick={onClearSelection} disabled={!selectedNode}>
          Limpar seleção
        </button>
        <button className="btn" onClick={onDeleteConnection} disabled={!selectedNode}>
          Desconectar
        </button>
        <button className="btn" onClick={onOpenTable}>
          Tabela
        </button>
        <button className="btn btn-accent" onClick={onExport}>
          Exportar CSV
        </button>
      </div>

      <div className={`connection-status ${connectionMode ? 'active' : ''}`}>
        <span className="status-dot" />
        {connectionMode ? 'Selecione outro ponto de saída' : 'Pronto'}
      </div>
    </header>
  );
}
