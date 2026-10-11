import React from 'react';

export default function Toolbar({
  onAddSubRegion,
  onOpenMultiHeliceModal,
  onOpenBatchModal,
  onAddVoltageSource,
  onAddEarth,
  onDeleteConnection,
  onDeleteSingleConnection,
  onClearSelection,
  onExport,
  onSaveJson,
  onImportJson,
  connectionMode,
  selectedNode,
  selectedConnectionId,
  onOpenConnectionTable,
  onOpenVoltageTable,
  onOpenMainPointsTable,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onToggleSidebar,
  isSidebarOpen,
  nodeNumberingDirection = 'bottom-to-top',
  onToggleNodeNumberingDirection,
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
          <span className="brand-subtitle">
            <span>Tornando a conexão entre nós</span>
            <span>muito mais fácil!</span>
          </span>
        </div>
      </div>

      <div className="toolbar-actions">
        {/* Grupo: Criar */}
        <div className="toolbar-group" title="Criação de elementos do circuito">
          <span className="toolbar-group-label">Criar</span>
          <button className="btn btn-primary" onClick={onAddSubRegion} title="Adicionar uma sub-região padrão">
            <span className="btn-multiline"><span>Sub-</span><span>regiões</span></span>
          </button>
          <button className="btn btn-accent" onClick={onOpenMultiHeliceModal} title="Adicionar sequência de sub-regiões de 1 rama e 2 nós">
            <span className="btn-multiline"><span>Hélice</span><span>Múltipla</span></span>
          </button>
          <button
            className="btn"
            onClick={onOpenBatchModal}
            style={{ borderColor: 'rgba(69, 214, 255, 0.4)', background: 'rgba(69, 214, 255, 0.08)', color: 'var(--cyan)' }}
            title="Abrir tabela para geração rápida de várias subs em sequência"
          >
            <span style={{ display: 'inline-flex', verticalAlign: '-2px', marginRight: '3px' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </span>
            <span className="btn-multiline"><span>Geração</span><span>rápida</span></span>
          </button>
          <button
            className="btn"
            onClick={onAddVoltageSource}
            style={{ borderColor: 'rgba(255, 200, 87, 0.4)', background: 'rgba(255, 200, 87, 0.08)', color: 'var(--amber)' }}
            title="Adicionar / posicionar Bloco de Fonte de Tensão (kV)"
          >
            <span className="btn-multiline"><span>⚡</span><span>Fonte</span></span>
          </button>
          <button
            className="btn"
            onClick={onAddEarth}
            style={{ borderColor: 'rgba(89, 227, 145, 0.4)', background: 'rgba(89, 227, 145, 0.08)', color: 'var(--green)' }}
            title="Adicionar Bloco de Terra / Referência (0 kV)"
          >
            <span className="btn-multiline"><span>⏚</span><span>Terra</span></span>
          </button>
        </div>

        <div className="toolbar-divider" />

        {/* Grupo: Conexões e Tabelas */}
        <div className="toolbar-group" title="Operações de conexão e tabelas">
          <span className="toolbar-group-label">
            <span>Conexões</span>
            <span>/ Tabelas</span>
          </span>
          <button
            className="btn"
            onClick={onClearSelection}
            disabled={!selectedNode && !selectedConnectionId}
            title={selectedConnectionId ? 'Desmarcar conexão selecionada' : 'Limpar ponto selecionado'}
          >
            Limpar
          </button>
          <button
            className="btn"
            onClick={() => {
              if (selectedConnectionId && onDeleteSingleConnection) {
                onDeleteSingleConnection(selectedConnectionId);
              } else if (onDeleteConnection) {
                onDeleteConnection();
              }
            }}
            disabled={!selectedNode && !selectedConnectionId}
            title={selectedConnectionId ? 'Remover conexão selecionada (Delete)' : 'Remover conexões do ponto selecionado'}
          >
            Desconectar
          </button>
          <button className="btn" onClick={onOpenConnectionTable} title="Ver mapa de potenciais e copiar conexões elétricas">
            <span className="btn-multiline"><span>📊</span><span>Conexões</span></span>
          </button>
          <button
            className="btn"
            onClick={onOpenVoltageTable}
            title="Ver tabela de nós com aplicação de tensão e aterramentos"
            style={{ borderColor: 'rgba(255, 200, 87, 0.4)', background: 'rgba(255, 200, 87, 0.08)', color: 'var(--amber)' }}
          >
            <span className="btn-multiline"><span>📊</span><span>Tensão</span></span>
          </button>
          <button
            className="btn"
            onClick={onOpenMainPointsTable}
            title="Ver tabela de relações entre pares de pontos principais (N1 × N2)"
            style={{ borderColor: 'rgba(69, 214, 255, 0.4)', background: 'rgba(69, 214, 255, 0.08)', color: 'var(--cyan)' }}
          >
            <span className="btn-multiline"><span>📊 Pontos</span><span>Principais</span></span>
          </button>
          <button
            className={`btn ${nodeNumberingDirection === 'top-to-bottom' ? 'btn-numbering-active' : ''}`}
            onClick={onToggleNodeNumberingDirection}
            title={
              nodeNumberingDirection === 'top-to-bottom'
                ? 'Ordem atual: De cima para baixo (clique para alternar para de baixo para cima)'
                : 'Ordem atual: De baixo para cima (clique para alternar para de cima para baixo)'
            }
          >
            <span className="btn-multiline">
              <span>{nodeNumberingDirection === 'top-to-bottom' ? '⬇️' : '⬆️'} Ordem</span>
              <span>Numeração</span>
            </span>
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
            <span className="btn-multiline"><span>↩</span><span>Desfazer</span></span>
          </button>
          <button
            className="btn btn-ghost"
            onClick={onRedo}
            disabled={!canRedo}
            title="Refazer (Ctrl+Y)"
          >
            <span className="btn-multiline"><span>↪</span><span>Refazer</span></span>
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
            <span className="btn-multiline"><span>💾</span><span>Salvar</span></span>
          </button>
          <button
            className="btn"
            onClick={() => fileInputRef.current?.click()}
            title="Importar arquivo JSON de conexões do computador para o software"
            style={{ borderColor: 'rgba(255, 200, 87, 0.35)', color: 'var(--amber)' }}
          >
            <span className="btn-multiline"><span>📂</span><span>Abrir</span></span>
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

      <div className="topbar-right">
        <div className={`connection-status ${connectionMode || selectedConnectionId ? 'active' : ''}`}>
          <span className="status-dot" />
          {connectionMode
            ? 'Selecione outro ponto de saída'
            : selectedConnectionId
              ? 'Conexão selecionada • Pressione Delete para remover'
              : 'Pronto'}
        </div>

        {onToggleSidebar && (
          <button
            type="button"
            className={`sidebar-toggle-btn ${!isSidebarOpen ? 'sidebar-collapsed' : ''}`}
            onClick={onToggleSidebar}
            title={isSidebarOpen ? 'Recolher painel de propriedades' : 'Expandir painel de propriedades'}
            aria-label={isSidebarOpen ? 'Recolher painel de propriedades' : 'Expandir painel de propriedades'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        )}
      </div>
    </header>
  );
}
