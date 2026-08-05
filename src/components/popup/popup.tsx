import { X } from 'lucide-react';
import {
  type CSSProperties,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import Button from '../button/button';
import styles from './popup.module.css';

interface PopupPosition {
  x: number;
  y: number;
}

interface PopupSize {
  width: number;
  height: number;
}

interface PopupLayout extends PopupPosition, PopupSize {}

interface PopupProps {
  open: boolean;
  children: ReactNode;
  title?: ReactNode;
  draggable?: boolean;
  resizable?: boolean;
  initialSize?: PopupSize;
  minWidth?: number;
  minHeight?: number;
  className?: string;
  style?: CSSProperties;
  onClose?: () => void;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getViewportSize() {
  return {
    width: typeof window === 'undefined' ? 0 : window.innerWidth,
    height: typeof window === 'undefined' ? 0 : window.innerHeight,
  };
}

function getInitialLayout(size: PopupSize, minWidth: number, minHeight: number): PopupLayout {
  if (typeof window === 'undefined') {
    return {
      x: 0,
      y: 0,
      width: size.width,
      height: size.height,
    };
  }

  const viewport = getViewportSize();

  const width = clamp(size.width, minWidth, Math.max(minWidth, viewport.width - 16));
  const height = clamp(size.height, minHeight, Math.max(minHeight, viewport.height - 16));

  return {
    width,
    height,
    x: Math.max(0, (viewport.width - width) / 2),
    y: Math.max(0, (viewport.height - height) / 2),
  };
}

export default function Popup({
  open,
  children,
  title,
  draggable = true,
  resizable = true,
  initialSize = { width: 420, height: 280 },
  minWidth = 260,
  minHeight = 160,
  className,
  style,
  onClose,
}: PopupProps) {
  const popupRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);

  const layoutRef = useRef<PopupLayout>(getInitialLayout(initialSize, minWidth, minHeight));

  const [layout, setLayout] = useState<PopupLayout>(() => layoutRef.current);

  const interactionRef = useRef<
    | {
        type: 'drag';
        pointerId: number;
        startPointerX: number;
        startPointerY: number;
        startX: number;
        startY: number;
      }
    | {
        type: 'resize';
        pointerId: number;
        startPointerX: number;
        startPointerY: number;
        startWidth: number;
        startHeight: number;
        startX: number;
        startY: number;
      }
    | null
  >(null);

  const applyLayout = (nextLayout: PopupLayout) => {
    layoutRef.current = nextLayout;

    if (frameRef.current !== null) return;

    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = null;

      const popup = popupRef.current;
      if (!popup) return;

      popup.style.setProperty('--popup-x', `${layoutRef.current.x}px`);
      popup.style.setProperty('--popup-y', `${layoutRef.current.y}px`);
      popup.style.setProperty('--popup-width', `${layoutRef.current.width}px`);
      popup.style.setProperty('--popup-height', `${layoutRef.current.height}px`);
    });
  };

  const resetBodyInteractionStyles = () => {
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    document.body.style.touchAction = '';
  };

  useEffect(() => {
    if (!open) return;

    const nextLayout = getInitialLayout(initialSize, minWidth, minHeight);

    layoutRef.current = nextLayout;
    setLayout(nextLayout);
  }, [open, initialSize.width, initialSize.height, minWidth, minHeight]);

  useEffect(() => {
    if (!open) return;

    const handlePointerMove = (event: PointerEvent) => {
      const interaction = interactionRef.current;
      if (!interaction || interaction.pointerId !== event.pointerId) return;

      event.preventDefault();

      const viewport = getViewportSize();
      const current = layoutRef.current;

      if (interaction.type === 'drag') {
        const nextX = interaction.startX + event.clientX - interaction.startPointerX;
        const nextY = interaction.startY + event.clientY - interaction.startPointerY;

        applyLayout({
          ...current,
          x: clamp(nextX, 0, Math.max(0, viewport.width - current.width)),
          y: clamp(nextY, 0, Math.max(0, viewport.height - current.height)),
        });

        return;
      }

      const nextWidth = interaction.startWidth + event.clientX - interaction.startPointerX;
      const nextHeight = interaction.startHeight + event.clientY - interaction.startPointerY;

      applyLayout({
        ...current,
        width: clamp(nextWidth, minWidth, Math.max(minWidth, viewport.width - interaction.startX)),
        height: clamp(nextHeight, minHeight, Math.max(minHeight, viewport.height - interaction.startY)),
      });
    };

    const handlePointerEnd = (event: PointerEvent) => {
      const interaction = interactionRef.current;
      if (!interaction || interaction.pointerId !== event.pointerId) return;

      interactionRef.current = null;
      resetBodyInteractionStyles();

      setLayout(layoutRef.current);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', handlePointerEnd);
    window.addEventListener('pointercancel', handlePointerEnd);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerEnd);
      window.removeEventListener('pointercancel', handlePointerEnd);

      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }

      resetBodyInteractionStyles();
    };
  }, [open, minWidth, minHeight]);

  if (!open) return null;

  const handleDragStart = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggable) return;

    const target = event.target as HTMLElement;

    if (target.closest("button, input, textarea, select, [data-no-drag='true']")) {
      return;
    }

    event.preventDefault();

    interactionRef.current = {
      type: 'drag',
      pointerId: event.pointerId,
      startPointerX: event.clientX,
      startPointerY: event.clientY,
      startX: layoutRef.current.x,
      startY: layoutRef.current.y,
    };

    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'grabbing';
    document.body.style.touchAction = 'none';
  };

  const handleResizeStart = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!resizable) return;

    event.preventDefault();
    event.stopPropagation();

    interactionRef.current = {
      type: 'resize',
      pointerId: event.pointerId,
      startPointerX: event.clientX,
      startPointerY: event.clientY,
      startWidth: layoutRef.current.width,
      startHeight: layoutRef.current.height,
      startX: layoutRef.current.x,
      startY: layoutRef.current.y,
    };

    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'nwse-resize';
    document.body.style.touchAction = 'none';
  };

  return (
    <div className={styles.layer}>
      <div className={styles.backdrop} onClick={onClose} />

      <div
        ref={popupRef}
        className={[styles.popup, className].filter(Boolean).join(' ')}
        style={
          {
            '--popup-x': `${layout.x}px`,
            '--popup-y': `${layout.y}px`,
            '--popup-width': `${layout.width}px`,
            '--popup-height': `${layout.height}px`,
            ...style,
          } as CSSProperties
        }
      >
        <div className={styles.header} onPointerDown={handleDragStart} data-draggable={draggable}>
          {title && <div className={styles.title}>{title}</div>}

          {onClose && (
            <Button
              type="button"
              variant="ghost"
              size="S"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                onClose();
              }}
              aria-label="Cerrar popup"
            >
              <X size={16} />
            </Button>
          )}
        </div>

        <div className={styles.content}>{children}</div>

        {resizable && <div className={styles.resizeHandle} onPointerDown={handleResizeStart} />}
      </div>
    </div>
  );
}
