import React, { useState, useEffect } from 'react';
import { useDraggableModal } from '../hooks/useDraggableModal';

export default function VoltageSourceModal({ isOpen, onClose, onSave, nodes }) {
  const [selectedNode, setSelectedNode] = useState('');
  const [voltage, setVoltage] = useState('');
  const [grounded, setGrounded] = useState([]);
  const { headerProps, modalProps, overlayClassName, handleOverlayClick } = useDraggableModal({ onClose });

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setSelectedNode('');
      setVoltage('');
      setGrounded([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleGrounded = (id) => {
    setGrounded((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedNode) return;
    onSave({ appliedNodeId: selectedNode, voltageValue: voltage, groundedNodeIds: grounded });
    onClose();
  };

  return (
    <div className={`modal-backdrop ${overlayClassName}`} onClick={handleOverlayClick}>
      <div className={`modal-content ${modalProps.className}`} ref={modalProps.ref} style={modalProps.style}>
        <div className="draggable-header" {...headerProps} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', cursor: 'grab' }}>
          <h2 style={{ margin: 0 }}>Configurar Fonte de Tensão</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Fechar" style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '18px', cursor: 'pointer' }}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="voltage-form">
          <label>
            Nó Aplicado:
            <select
              value={selectedNode}
              onChange={(e) => setSelectedNode(e.target.value)}
              required
            >
              <option value="" disabled>Selecione um nó</option>
              {nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.label || n.id}
                </option>
              ))}
            </select>
          </label>
          <label>
            Valor da Tensão (kV):
            <input
              type="number"
              step="any"
              value={voltage}
              onChange={(e) => setVoltage(e.target.value)}
              required
            />
          </label>
          <fieldset className="grounded-set">
            <legend>Pontos Aterrados</legend>
            {nodes.map((n) => (
              <label key={n.id} className="grounded-checkbox">
                <input
                  type="checkbox"
                  checked={grounded.includes(n.id)}
                  onChange={() => toggleGrounded(n.id)}
                />
                {n.label || n.id}
              </label>
            ))}
          </fieldset>
          <div className="modal-actions">
            <button type="submit">Salvar</button>
            <button type="button" onClick={onClose}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
