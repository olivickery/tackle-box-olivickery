'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;
const DOUBLE_TAP_MS = 280;
const SWIPE_CLOSE_PX = 110;

type Point = { x: number; y: number };
type View = { scale: number; x: number; y: number };

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const mid = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

/**
 * Full-screen image viewer with its own pinch / pan / double-tap zoom.
 * The page viewport stays locked (no global pinch) so the iOS input-zoom fix
 * in layout.tsx is preserved; zoom happens only inside this overlay.
 */
export default function ZoomLightbox({ src, onClose }: { src: string; onClose: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const [view, setView] = useState<View>({ scale: 1, x: 0, y: 0 });
  const [animate, setAnimate] = useState(false);
  const [dragDown, setDragDown] = useState(0);

  // Gesture bookkeeping lives in refs so pointer handlers never read stale state.
  const viewRef = useRef(view);
  useEffect(() => {
    viewRef.current = view;
  }, [view]);
  const pointers = useRef(new Map<number, Point>());
  const gesture = useRef<{
    startView: View;
    startPoint: Point; // single-finger start, or pinch midpoint
    startDist: number; // pinch only
    moved: boolean;
  } | null>(null);
  const lastTap = useRef<{ t: number; p: Point } | null>(null);

  /** Pointer position relative to the centre of the container. */
  const toLocal = (clientX: number, clientY: number): Point => {
    const r = containerRef.current!.getBoundingClientRect();
    return { x: clientX - (r.left + r.width / 2), y: clientY - (r.top + r.height / 2) };
  };

  /** Keep the zoomed image covering the viewport instead of drifting off it. */
  const clampView = useCallback((v: View): View => {
    const img = imgRef.current;
    const box = containerRef.current;
    if (!img || !box) return v;
    const maxX = Math.max(0, (img.offsetWidth * v.scale - box.clientWidth) / 2);
    const maxY = Math.max(0, (img.offsetHeight * v.scale - box.clientHeight) / 2);
    return { scale: v.scale, x: clamp(v.x, -maxX, maxX), y: clamp(v.y, -maxY, maxY) };
  }, []);

  /** Zoom to `scale` keeping the image point under `anchor` fixed on screen. */
  const zoomAt = useCallback(
    (from: View, scale: number, anchorStart: Point, anchorNow: Point = anchorStart): View => {
      const s = clamp(scale, MIN_SCALE, MAX_SCALE);
      const qx = (anchorStart.x - from.x) / from.scale;
      const qy = (anchorStart.y - from.y) / from.scale;
      return clampView({ scale: s, x: anchorNow.x - qx * s, y: anchorNow.y - qy * s });
    },
    [clampView]
  );

  const reset = () => {
    setAnimate(true);
    setView({ scale: 1, x: 0, y: 0 });
  };

  // Escape to close, lock background scroll while open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  // Trackpad pinch / ctrl+wheel / mouse wheel zoom on desktop (needs non-passive listener).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setAnimate(false);
      const p = toLocal(e.clientX, e.clientY);
      const factor = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.002));
      setView((v) => zoomAt(v, v.scale * factor, p));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoomAt]);

  const beginGesture = () => {
    const pts = [...pointers.current.values()];
    const v = viewRef.current;
    gesture.current =
      pts.length >= 2
        ? { startView: v, startPoint: mid(pts[0], pts[1]), startDist: dist(pts[0], pts[1]), moved: true }
        : { startView: v, startPoint: pts[0], startDist: 0, moved: false };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    try {
      containerRef.current?.setPointerCapture(e.pointerId);
    } catch {
      // Capture is a nicety (keeps drags alive outside the element); never let it block the gesture.
    }
    pointers.current.set(e.pointerId, toLocal(e.clientX, e.clientY));
    setAnimate(false);
    beginGesture();
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId) || !gesture.current) return;
    pointers.current.set(e.pointerId, toLocal(e.clientX, e.clientY));
    const pts = [...pointers.current.values()];
    const g = gesture.current;

    if (pts.length >= 2 && g.startDist > 0) {
      const m = mid(pts[0], pts[1]);
      setView(zoomAt(g.startView, g.startView.scale * (dist(pts[0], pts[1]) / g.startDist), g.startPoint, m));
      return;
    }

    const dx = pts[0].x - g.startPoint.x;
    const dy = pts[0].y - g.startPoint.y;
    if (Math.hypot(dx, dy) > 6) g.moved = true;

    if (g.startView.scale > 1.01) {
      setView(clampView({ ...g.startView, x: g.startView.x + dx, y: g.startView.y + dy }));
    } else {
      // Not zoomed: a downward drag previews swipe-to-close.
      setDragDown(Math.max(0, dy));
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    const p = pointers.current.get(e.pointerId)!;
    pointers.current.delete(e.pointerId);
    const g = gesture.current;

    if (pointers.current.size > 0) {
      // One finger lifted mid-pinch: continue as a pan from here.
      beginGesture();
      return;
    }
    gesture.current = null;

    if (dragDown > SWIPE_CLOSE_PX) {
      onClose();
      return;
    }
    if (dragDown > 0) {
      setAnimate(true);
      setDragDown(0);
    }

    if (viewRef.current.scale < 1.02 && viewRef.current.scale !== 1) reset();

    // Tap handling: double-tap toggles zoom; single tap on backdrop closes.
    if (g && !g.moved) {
      const now = Date.now();
      const prev = lastTap.current;
      if (prev && now - prev.t < DOUBLE_TAP_MS && dist(prev.p, p) < 30) {
        lastTap.current = null;
        setAnimate(true);
        setView((v) => (v.scale > 1.01 ? { scale: 1, x: 0, y: 0 } : zoomAt(v, DOUBLE_TAP_SCALE, p)));
        return;
      }
      lastTap.current = { t: now, p };
      const onImage = (e.target as HTMLElement) === imgRef.current;
      if (!onImage && viewRef.current.scale <= 1.01) {
        const tapAt = now;
        setTimeout(() => {
          // Only close if this tap wasn't the first half of a double-tap.
          if (lastTap.current?.t === tapAt) onClose();
        }, DOUBLE_TAP_MS);
      }
    }
  };

  const backdropOpacity = Math.max(0.35, 0.9 - dragDown / 400);

  return (
    <div
      ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className="fixed inset-0 z-50 backdrop-blur-md flex items-center justify-center overflow-hidden select-none"
      style={{ touchAction: 'none', backgroundColor: `rgb(2 6 23 / ${backdropOpacity})` }}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2.5 rounded-full bg-slate-900/80 text-slate-200 border border-slate-700/80 hover:bg-slate-800 hover:text-white transition z-50 shadow-xl"
        title="Close Zoom"
      >
        <X className="w-6 h-6" />
      </button>

      <img
        ref={imgRef}
        src={src}
        alt="Zoomed detail view"
        draggable={false}
        className="max-w-[calc(100vw-2rem)] max-h-[90vh] object-contain rounded-xl shadow-2xl will-change-transform"
        style={{
          transform: `translate3d(${view.x}px, ${view.y + dragDown}px, 0) scale(${view.scale})`,
          transition: animate ? 'transform 220ms ease-out' : 'none',
          cursor: view.scale > 1.01 ? 'grab' : 'zoom-in',
        }}
        onTransitionEnd={() => setAnimate(false)}
      />

      {view.scale > 1.01 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/80 text-[11px] font-mono text-slate-300 pointer-events-none">
          {view.scale.toFixed(1)}×
        </div>
      )}
    </div>
  );
}
