import { useState, useRef, useCallback } from 'react';

/**
 * Hook otimizado para modais, tabelas e abas de detalhes arrastáveis.
 * Durante o arraste, ativa estado de transparência para visualizar
 * o circuito e componentes posicionados atrás da janela aberta.
 */
export function useDraggableModal({ onClose } = {}) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const modalRef = useRef(null);

  const dragRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
    pointerId: null,
    hasMoved: false,
    bounds: null,
  });

  const hasDraggedRecentlyRef = useRef(false);

  const handlePointerDown = useCallback((e) => {
    // Apenas botão principal (esquerdo) ou toque
    if (e.button !== undefined && e.button !== 0) return;

    // Não arrastar ao clicar em botões, inputs, selects, links ou controles interativos
    const target = e.target;
    if (target.closest('button, input, select, textarea, a, [data-no-drag]')) {
      return;
    }

    e.preventDefault();

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Fallback gracioso
    }

    // Calcula limites da tela UMA ÚNICA VEZ no início do arraste (evita reflow a 60fps)
    let bounds = null;
    if (modalRef.current) {
      const rect = modalRef.current.getBoundingClientRect();
      const origLeft = rect.left - position.x;
      const origTop = rect.top - position.y;
      bounds = {
        minX: -origLeft - (rect.width - 120),
        maxX: window.innerWidth - origLeft - 120,
        minY: -origTop + 8,
        maxY: window.innerHeight - origTop - 50,
      };
    }

    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y,
      pointerId: e.pointerId,
      hasMoved: false,
      bounds,
    };

    setIsDragging(true);
  }, [position]);

  const handlePointerMove = useCallback((e) => {
    if (!dragRef.current.active) return;

    const deltaX = e.clientX - dragRef.current.startX;
    const deltaY = e.clientY - dragRef.current.startY;

    if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
      dragRef.current.hasMoved = true;
    }

    let nextX = dragRef.current.initialX + deltaX;
    let nextY = dragRef.current.initialY + deltaY;

    const bounds = dragRef.current.bounds;
    if (bounds) {
      nextX = Math.max(bounds.minX, Math.min(bounds.maxX, nextX));
      nextY = Math.max(bounds.minY, Math.min(bounds.maxY, nextY));
    }

    setPosition({ x: nextX, y: nextY });
  }, []);

  const handlePointerUp = useCallback((e) => {
    if (!dragRef.current.active) return;

    if (dragRef.current.hasMoved) {
      hasDraggedRecentlyRef.current = true;
      setTimeout(() => {
        hasDraggedRecentlyRef.current = false;
      }, 120);
    }

    dragRef.current.active = false;
    setIsDragging(false);

    try {
      if (dragRef.current.pointerId !== null && e.currentTarget.hasPointerCapture(dragRef.current.pointerId)) {
        e.currentTarget.releasePointerCapture(dragRef.current.pointerId);
      }
    } catch {
      // Ignorar
    }
  }, []);

  const handleDoubleClick = useCallback((e) => {
    if (e.target.closest('button, input, select, textarea, a')) return;
    setPosition({ x: 0, y: 0 });
  }, []);

  const resetPosition = useCallback(() => {
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleOverlayClick = useCallback((e) => {
    if (hasDraggedRecentlyRef.current) return;
    if (e.target === e.currentTarget && onClose) {
      onClose();
    }
  }, [onClose]);

  return {
    position,
    isDragging,
    modalRef,
    resetPosition,
    handleOverlayClick,
    headerProps: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerUp,
      onDoubleClick: handleDoubleClick,
      title: 'Arraste para mover • Clique duplo para recentralizar',
    },
    modalProps: {
      ref: modalRef,
      className: `draggable-modal ${isDragging ? 'modal-dragging' : ''}`,
      style: {
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        transition: isDragging ? 'none' : 'opacity 0.2s ease, transform 0.12s ease-out',
      },
    },
    overlayClassName: isDragging ? 'overlay-dragging' : '',
  };
}
