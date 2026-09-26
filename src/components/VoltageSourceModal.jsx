import React, { useState, useEffect } from 'react';


export default function VoltageSourceModal({ isOpen, onClose, onSave, nodes }) {
  const [selectedNode, setSelectedNode] = useState('');
  const [voltage, setVoltage] = useState('');
  const [grounded, setGrounded] = useState([]);

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
    <div className="modal-backdrop">
      <div className="modal-content">
        <h2>Configurar Fonte de Tensão</h2>
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
