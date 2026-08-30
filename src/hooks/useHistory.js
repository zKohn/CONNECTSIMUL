import { useRef, useState, useCallback, useEffect } from 'react';

const MAX_HISTORY = 60;

/**
 * useHistory – gerencia undo/redo para um estado composto { subRegions, connections }.
 *
 * API:
 *   state              – estado atual
 *   setState(next)     – atualiza o estado E salva snapshot (ação instantânea)
 *   setStateNoHistory  – atualiza o estado SEM salvar snapshot (uso: movimentação contínua)
 *   commit()           – salva manualmente o snapshot atual no histórico (uso: ao soltar o drag)
 *   undo()             – desfaz a última ação
 *   redo()             – refaz a última ação desfeita
 *   canUndo            – boolean
 *   canRedo            – boolean
 */
export function useHistory(initialState) {
  const [present, setPresent] = useState(initialState);
  const past = useRef([]);
  const future = useRef([]);
  const presentRef = useRef(present);
  presentRef.current = present;

  // Flags de UI forçadas a re-render quando mudam
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const syncFlags = useCallback(() => {
    setCanUndo(past.current.length > 0);
    setCanRedo(future.current.length > 0);
  }, []);

  /** Atualiza o estado E registra o estado ANTERIOR no histórico */
  const setState = useCallback((nextOrUpdater) => {
    setPresent((prev) => {
      const next = typeof nextOrUpdater === 'function' ? nextOrUpdater(prev) : nextOrUpdater;
      past.current = [...past.current.slice(-MAX_HISTORY + 1), prev];
      future.current = [];
      return next;
    });
    // Sync flags on next tick
    setTimeout(syncFlags, 0);
  }, [syncFlags]);

  /** Atualiza o estado SEM registrar no histórico (para arrastar em tempo real) */
  const setStateNoHistory = useCallback((nextOrUpdater) => {
    setPresent((prev) => {
      return typeof nextOrUpdater === 'function' ? nextOrUpdater(prev) : nextOrUpdater;
    });
  }, []);

  /** Salva manualmente um snapshot (chamar ao soltar o drag) */
  const commit = useCallback(() => {
    past.current = [...past.current.slice(-MAX_HISTORY + 1), presentRef.current];
    future.current = [];
    syncFlags();
  }, [syncFlags]);

  const undo = useCallback(() => {
    if (past.current.length === 0) return;
    const previous = past.current[past.current.length - 1];
    past.current = past.current.slice(0, -1);
    future.current = [presentRef.current, ...future.current.slice(0, MAX_HISTORY - 1)];
    setPresent(previous);
    setTimeout(syncFlags, 0);
  }, [syncFlags]);

  const redo = useCallback(() => {
    if (future.current.length === 0) return;
    const next = future.current[0];
    future.current = future.current.slice(1);
    past.current = [...past.current.slice(-MAX_HISTORY + 1), presentRef.current];
    setPresent(next);
    setTimeout(syncFlags, 0);
  }, [syncFlags]);

  return { state: present, setState, setStateNoHistory, commit, undo, redo, canUndo, canRedo };
}

