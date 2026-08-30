import React from 'react';

export default function Toolbar({
  onAddSubRegion,
  onOpenMultiHeliceModal,
  onDeleteConnection,
  onClearSelection,
  onExport,
  connectionMode,
  selectedNode,
  onOpenTable,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
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
        <button className="btn btn-primary" onClick={onAddSubRegion} title="Adicionar uma sub-região padrão">
          <span>＋</span> Sub-região
        </button>
        <button className="btn btn-accent" onClick={onOpenMultiHeliceModal} title="Adicionar sequência de sub-regiões de 1 rama e 2 nós">
          <span>＋</span> Hélice Múltipla
        </button>

        <div className="toolbar-divider" />

        <button
          className="btn btn-ghost"
          onClick={onUndo}
          disabled={!canUndo}
          title="Desfazer (Ctrl+Z)"
        >
          ↩ Desfazer
        </button>
        <button
          className="btn btn-ghost"
          onClick={onRedo}
          disabled={!canRedo}
          title="Refazer (Ctrl+Y)"
        >
          ↪ Refazer
        </button>

        <div className="toolbar-divider" />

        <button className="btn" onClick={onClearSelection} disabled={!selectedNode}>
          Limpar seleção
        </button>
        <button className="btn" onClick={onDeleteConnection} disabled={!selectedNode}>
          Desconectar
        </button>
        <button className="btn" onClick={onOpenTable}>
          Tabela
        </button>
        <button className="btn" onClick={onExport}>
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
