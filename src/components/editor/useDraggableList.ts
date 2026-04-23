import { useState } from 'react';
import type React from 'react';

/**
 * Notion-style drag-and-drop reordering.
 *
 * Split into two prop sets so ONLY the handle is draggable —
 * the card itself is the drop target. This means:
 *   • Text in inputs/textareas remains selectable (no conflict with draggable)
 *   • The handle never disappears mid-drag (no is-dragging opacity on the source card)
 *
 * Usage:
 *   const { getCardProps, getHandleProps, isBeingDragged, getDropIndicator } =
 *     useDraggableList(items, onReorder);
 *
 *   <div {...getCardProps(item)} className={isBeingDragged(item.id) ? 'is-dragging' : ''}>
 *     <span {...getHandleProps(item)} className="card-drag-handle">⠿</span>
 *     …fields…
 *   </div>
 */
export function useDraggableList<T extends { id: string }>(
  items: T[],
  onReorder: (items: T[]) => void,
) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dropPos,    setDropPos]    = useState<'top' | 'bottom'>('bottom');

  // ── drag source (handle only) ────────────────────────────────────────────────

  const handleDragStart = (id: string) => (e: React.DragEvent) => {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id); // Firefox requirement
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverId(null);
  };

  // ── drop target (card) ───────────────────────────────────────────────────────

  const handleDragOver = (id: string) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const pos: 'top' | 'bottom' = e.clientY < rect.top + rect.height / 2 ? 'top' : 'bottom';
    setDragOverId(id);
    setDropPos(pos);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear when truly leaving the card (not moving into a child element)
    const related = e.relatedTarget as Node | null;
    if (!(e.currentTarget as HTMLElement).contains(related)) {
      setDragOverId(null);
    }
  };

  const handleDrop = (id: string) => (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggingId || draggingId === id) {
      setDraggingId(null);
      setDragOverId(null);
      return;
    }

    const fromIdx = items.findIndex(i => i.id === draggingId);
    if (fromIdx === -1) { setDraggingId(null); setDragOverId(null); return; }

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const dropAfter = e.clientY >= rect.top + rect.height / 2;

    const next = [...items];
    const [moved] = next.splice(fromIdx, 1);
    const newToIdx = next.findIndex(i => i.id === id);
    next.splice(dropAfter ? newToIdx + 1 : newToIdx, 0, moved);

    onReorder(next);
    setDraggingId(null);
    setDragOverId(null);
  };

  // ── public API ───────────────────────────────────────────────────────────────

  /** Spread onto the CARD div (drop target, NOT draggable). */
  const getCardProps = (item: T) => ({
    onDragOver:  handleDragOver(item.id),
    onDragLeave: handleDragLeave,
    onDrop:      handleDrop(item.id),
  });

  /** Spread onto the HANDLE element (drag source). */
  const getHandleProps = (item: T) => ({
    draggable: true as const,
    onDragStart: handleDragStart(item.id),
    onDragEnd:   handleDragEnd,
  });

  /** True while this card is being dragged (show ghost styling). */
  const isBeingDragged = (id: string) => id === draggingId;

  /**
   * 'top' | 'bottom' when another card is dragged over this one.
   * Use to render the drop-indicator line. Null otherwise.
   */
  const getDropIndicator = (id: string): 'top' | 'bottom' | null =>
    dragOverId === id && draggingId !== id ? dropPos : null;

  return { getCardProps, getHandleProps, isBeingDragged, getDropIndicator };
}
