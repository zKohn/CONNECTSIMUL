import React from 'react';

export default function Toolbar({
  onAddSubRegion,
  onOpenMultiHeliceModal,
  onOpenBatchModal,
  onDeleteConnection,
  onClearSelection,
  onExport,
  onSaveJson,
  onImportJson,
  connectionMode,
  selectedNode,
  onOpenTable,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}) {
  const fileInputRef = React.useRef(null);

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    onImportJson(file);
    e.target.value = '';
  }

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
        {/* Grupo: Criar */}
        <div className="toolbar-group" title="Criação de sub-regiões">
          <span className="toolbar-group-label">Criar</span>
          <button className="btn btn-primary" onClick={onAddSubRegion} title="Adicionar uma sub-região padrão">
            <span>＋</span> Sub-região
          </button>
          <button className="btn btn-accent" onClick={onOpenMultiHeliceModal} title="Adicionar sequência de sub-regiões de 1 rama e 2 nós">
            <span>＋</span> Hélice Múltipla
          </button>
          <button
            className="btn"
            onClick={onOpenBatchModal}
            style={{ borderColor: 'rgba(69, 214, 255, 0.4)', background: 'rgba(69, 214, 255, 0.08)', color: 'var(--cyan)' }}
            title="Abrir tabela para geração rápida de várias subs em sequência"
          >
            <span>📋</span> Lote
          </button>
        </div>

        <div className="toolbar-divider" />

        {/* Grupo: Histórico */}
        <div className="toolbar-group" title="Histórico de ações">
          <span className="toolbar-group-label">Histórico</span>
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
        </div>

        <div className="toolbar-divider" />

        {/* Grupo: Conexões */}
        <div className="toolbar-group" title="Operações de conexão">
          <span className="toolbar-group-label">Conexões</span>
          <button className="btn" onClick={onClearSelection} disabled={!selectedNode} title="Limpar ponto selecionado">
            Limpar
          </button>
          <button className="btn" onClick={onDeleteConnection} disabled={!selectedNode} title="Remover conexões do ponto selecionado">
            Desconectar
          </button>
          <button className="btn" onClick={onOpenTable} title="Ver mapa de potenciais e copiar conexões elétricas">
            <span>📊</span> Tabela
          </button>
        </div>

        <div className="toolbar-divider" />

        {/* Grupo: Projeto */}
        <div className="toolbar-group" title="Arquivo do projeto (JSON)">
          <span className="toolbar-group-label">Projeto</span>
          <button
            className="btn"
            onClick={onSaveJson}
            title="Salvar projeto completo (sub-regiões e conexões) em arquivo JSON no computador"
            style={{ borderColor: 'rgba(89, 227, 145, 0.35)', color: 'var(--green)' }}
          >
            <span>💾</span> Salvar
          </button>
          <button
            className="btn"
            onClick={() => fileInputRef.current?.click()}
            title="Importar arquivo JSON de conexões do computador para o software"
            style={{ borderColor: 'rgba(255, 200, 87, 0.35)', color: 'var(--amber)' }}
          >
            <span>📂</span> Abrir
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>

      <div className={`connection-status ${connectionMode ? 'active' : ''}`}>
        <span className="status-dot" />
        {connectionMode ? 'Selecione outro ponto de saída' : 'Pronto'}
      </div>
    </header>
  );
}
