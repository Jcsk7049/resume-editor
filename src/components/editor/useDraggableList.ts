import { useRef, useState, useEffect } from 'react';
import type React from 'react';

/**
 * HTML5 DnD — 關鍵修復：
 *
 * 根本原因：onDragOver 每 ~50ms 觸發一次，每次 setDragOverId/setDropPos
 * 都會讓 React 重新渲染整個列表。React reconciler 可能在拖曳途中重建
 * DOM element，瀏覽器因此失去對「被拖曳物件」的追蹤，整個 drag 取消。
 *
 * 解法：拖曳過程中完全不更新 React state。
 * - drop 指示線 → 直接操作 CSS class（不觸發 React render）
 * - draggingId  → useRef（不觸發 React render）
 * - items ref   → useEffect 同步，drop 時永遠讀到最新陣列
 * - 唯一的 setState：setDraggingId，僅在 dragStart 後用
 *   requestAnimationFrame 延遲執行，避免干擾 drag 啟動
 */
export function useDraggableList<T extends { id: string }>(
  items: T[],
  onReorder: (items: T[]) => void,
) {
  const draggingIdRef = useRef<string | null>(null);
  const itemsRef      = useRef<T[]>(items);
  useEffect(() => { itemsRef.current = items; }, [items]);

  // 僅用於 is-dragging CSS class；拖曳期間不頻繁更新
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // ── 工具：直接清除所有 drop 指示 CSS class ───────────────────────────────
  const clearDropIndicators = () => {
    document.querySelectorAll<HTMLElement>('.card-item').forEach(el => {
      el.classList.remove('drop-top', 'drop-bottom');
    });
  };

  const reset = () => {
    clearDropIndicators();
    draggingIdRef.current = null;
    setDraggingId(null);
  };

  // ── Handle：拖曳來源 ──────────────────────────────────────────────────────

  const handleDragStart = (id: string) => (e: React.DragEvent) => {
    draggingIdRef.current = id;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);

    // 透明 drag ghost — 避免瀏覽器截取 SVG 作為拖曳圖像
    const ghost = document.createElement('span');
    ghost.style.cssText = 'position:fixed;top:-9999px;width:1px;height:1px;opacity:0';
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    requestAnimationFrame(() => {
      document.body.removeChild(ghost);
      // 延遲設 state 避免在 drag 初始幀觸發 re-render
      setDraggingId(id);
    });
  };

  const handleDragEnd = () => reset();

  // ── Card：放置目標 ────────────────────────────────────────────────────────

  const handleDragOver = (id: string) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (!draggingIdRef.current || draggingIdRef.current === id) return;

    const card = e.currentTarget as HTMLElement;
    const rect  = card.getBoundingClientRect();
    const isTop = e.clientY < rect.top + rect.height / 2;

    // ★ 直接操作 DOM class，完全不呼叫 setState → 不觸發 React re-render
    clearDropIndicators();
    card.classList.add(isTop ? 'drop-top' : 'drop-bottom');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const related = e.relatedTarget as Node | null;
    if (!(e.currentTarget as HTMLElement).contains(related)) {
      (e.currentTarget as HTMLElement).classList.remove('drop-top', 'drop-bottom');
    }
  };

  const handleDrop = (id: string) => (e: React.DragEvent) => {
    e.preventDefault();

    const fromId =
      draggingIdRef.current ||
      e.dataTransfer.getData('text/plain');

    if (!fromId || fromId === id) { reset(); return; }

    const current  = itemsRef.current;
    const fromIdx  = current.findIndex(i => i.id === fromId);
    if (fromIdx === -1) { reset(); return; }

    const rect      = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const dropAfter = e.clientY >= rect.top + rect.height / 2;

    const next = [...current];
    const [moved] = next.splice(fromIdx, 1);
    const newToIdx = next.findIndex(i => i.id === id);
    next.splice(dropAfter ? newToIdx + 1 : newToIdx, 0, moved);

    onReorder(next);
    reset();
  };

  // ── Public API ────────────────────────────────────────────────────────────

  const getCardProps = (item: T) => ({
    onDragOver:  handleDragOver(item.id),
    onDragLeave: handleDragLeave,
    onDrop:      handleDrop(item.id),
  });

  const getHandleProps = (item: T) => ({
    draggable:   true as const,
    onDragStart: handleDragStart(item.id),
    onDragEnd:   handleDragEnd,
  });

  const isBeingDragged   = (id: string) => id === draggingId;
  // drop 指示現在完全由 CSS class 控制，不需回傳 indicator
  const getDropIndicator = (_id: string): 'top' | 'bottom' | null => null;

  return { getCardProps, getHandleProps, isBeingDragged, getDropIndicator };
}
