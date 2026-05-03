import { useRef, useState, useEffect } from 'react';
import type React from 'react';

/**
 * Robust Notion-style drag-and-drop reordering.
 *
 * Root cause of previous failures:
 *   1. Stale closures — draggingId from React state was captured at render time,
 *      so the drop handler saw the pre-drag (null) value.
 *   2. SVG pointer-events — the GripVertical icon inside the handle span was
 *      intercepting mousedown, preventing drag start.
 *
 * Fixes applied:
 *   • draggingIdRef (useRef) — always current, never stale, no re-render overhead
 *   • itemsRef (useRef) — avoids stale items array inside drop handler
 *   • dataTransfer fallback — use getData() as secondary source of truth
 *   • transparent drag image — prevents browser from rendering SVG as ghost
 *   • CSS: .card-drag-handle svg { pointer-events: none } (add to App.css)
 */
export function useDraggableList<T extends { id: string }>(
  items: T[],
  onReorder: (items: T[]) => void,
) {
  // ── Refs (no stale closures) ──────────────────────────────────────────────
  const draggingIdRef = useRef<string | null>(null);
  const itemsRef      = useRef<T[]>(items);
  useEffect(() => { itemsRef.current = items; }, [items]);

  // ── UI state (for CSS classes only) ──────────────────────────────────────
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dropPos,    setDropPos]    = useState<'top' | 'bottom'>('bottom');

  // ── Reset helper ──────────────────────────────────────────────────────────
  const reset = () => {
    draggingIdRef.current = null;
    setDraggingId(null);
    setDragOverId(null);
  };

  // ── Drag source: HANDLE only ──────────────────────────────────────────────

  const handleDragStart = (id: string) => (e: React.DragEvent) => {
    draggingIdRef.current = id;
    setDraggingId(id);
    e.dataTransfer.effectAllowed = 'move';
    // Store id in two formats for maximum browser compatibility
    e.dataTransfer.setData('text/plain', id);
    try { e.dataTransfer.setData('application/x-item-id', id); } catch { /* Safari */ }

    // Replace default browser ghost (which renders the whole element)
    // with an invisible 1×1 element so we don't see a drag image
    const ghost = document.createElement('span');
    ghost.style.cssText = 'position:fixed;top:-999px;left:-999px;opacity:0;width:1px;height:1px';
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    requestAnimationFrame(() => document.body.removeChild(ghost));
  };

  const handleDragEnd = () => reset();

  // ── Drop target: CARD ────────────────────────────────────────────────────

  const handleDragOver = (id: string) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const fromId = draggingIdRef.current;
    if (!fromId || fromId === id) return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const pos: 'top' | 'bottom' = e.clientY < rect.top + rect.height / 2 ? 'top' : 'bottom';

    // Avoid redundant state updates during rapid mousemove
    if (dragOverId !== id || dropPos !== pos) {
      setDragOverId(id);
      setDropPos(pos);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const related = e.relatedTarget as Node | null;
    if (!(e.currentTarget as HTMLElement).contains(related)) {
      setDragOverId(null);
    }
  };

  const handleDrop = (id: string) => (e: React.DragEvent) => {
    e.preventDefault();

    // Read from ref first (most reliable), then dataTransfer fallback
    const fromId =
      draggingIdRef.current ||
      (() => { try { return e.dataTransfer.getData('application/x-item-id'); } catch { return ''; } })() ||
      e.dataTransfer.getData('text/plain');

    if (!fromId || fromId === id) { reset(); return; }

    // Use itemsRef so we always operate on the latest array
    const current = itemsRef.current;
    const fromIdx = current.findIndex(i => i.id === fromId);
    if (fromIdx === -1) { reset(); return; }

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
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

  const isBeingDragged    = (id: string) => id === draggingId;
  const getDropIndicator  = (id: string): 'top' | 'bottom' | null =>
    dragOverId === id && draggingId !== id ? dropPos : null;

  return { getCardProps, getHandleProps, isBeingDragged, getDropIndicator };
}
