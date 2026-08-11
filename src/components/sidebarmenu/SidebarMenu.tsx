import { PanelLeftClose, PanelRightClose, type LucideIcon } from 'lucide-react';
import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

import Button from '../button/button';
import type { Size } from '../common';

import styles from './SidebarMenu.module.css';

export type SidebarMode = 'collapsed' | 'expanded';

export type SidebarPosition = 'left' | 'right';

export type SidebarMenuItem = {
  id: string;
  text: string;

  url?: string;
  icon?: LucideIcon;

  disabled?: boolean;
  children?: SidebarMenuItem[];

  onClick?: (item: SidebarMenuItem) => void;
};

export type SidebarMenuProps = {
  items: SidebarMenuItem[];

  size?: Size;

  mode?: SidebarMode;
  defaultMode?: SidebarMode;

  onModeChange?: (mode: SidebarMode) => void;

  position?: SidebarPosition;

  currentPath?: string;

  onNavigate?: (url: string, item: SidebarMenuItem) => void;

  isItemActive?: (item: SidebarMenuItem, currentPath: string) => boolean;

  brand?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;

  ariaLabel?: string;

  className?: string;
};

function isRouteMatch(pathname: string, target?: string) {
  if (!target) {
    return false;
  }

  if (pathname === target) {
    return true;
  }

  const normalizedTarget = target.endsWith('/') ? target.slice(0, -1) : target;

  return pathname.startsWith(`${normalizedTarget}/`);
}

function defaultIsItemActive(item: SidebarMenuItem, currentPath: string): boolean {
  if (item.url && isRouteMatch(currentPath, item.url)) {
    return true;
  }

  return item.children?.some((child) => defaultIsItemActive(child, currentPath)) ?? false;
}

export default function SidebarMenu({
  items,

  size = 'M',

  mode,
  defaultMode = 'collapsed',
  onModeChange,

  position = 'left',

  currentPath = '',
  onNavigate,
  isItemActive,

  brand,
  footer,
  children,

  ariaLabel = 'Navegación principal',

  className,
}: SidebarMenuProps) {
  const [internalMode, setInternalMode] = useState<SidebarMode>(defaultMode);

  const [expandedWidth, setExpandedWidth] = useState<number | null>(null);

  const measureRef = useRef<HTMLDivElement>(null);

  const currentMode = mode ?? internalMode;
  const isCollapsed = currentMode === 'collapsed';

  const resolveActive = isItemActive ?? defaultIsItemActive;

  /* ==========================================================================
     Width
     ========================================================================== */

  useLayoutEffect(() => {
    const element = measureRef.current;

    if (!element) {
      return;
    }

    const updateWidth = () => {
      const width = Math.ceil(element.scrollWidth);

      setExpandedWidth((current) => (current === width ? current : width));
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [items, size]);

  /* ==========================================================================
     Mode
     ========================================================================== */

  const toggleMode = () => {
    const nextMode: SidebarMode = isCollapsed ? 'expanded' : 'collapsed';

    if (mode === undefined) {
      setInternalMode(nextMode);
    }

    onModeChange?.(nextMode);
  };

  /* ==========================================================================
     Item
     ========================================================================== */

  const handleItemClick = (item: SidebarMenuItem) => {
    if (item.disabled) {
      return;
    }

    if (item.onClick) {
      item.onClick(item);
      return;
    }

    if (item.url) {
      onNavigate?.(item.url, item);
    }
  };

  /* ==========================================================================
     Menu
     ========================================================================== */

  const renderMenu = (nodes: SidebarMenuItem[], depth = 0): ReactNode =>
    nodes.map((item) => {
      const Icon = item.icon;
      const active = resolveActive(item, currentPath);

      return (
        <div key={item.id} className={styles.sidebarItemGroup}>
          <Button
            type="button"
            mode="ghost"
            size={size}
            className={styles.sidebarItem}
            data-active={active}
            data-depth={depth}
            disabled={item.disabled}
            aria-current={active ? 'page' : undefined}
            aria-label={isCollapsed ? item.text : undefined}
            tooltip={isCollapsed ? item.text : undefined}
            onClick={() => handleItemClick(item)}
          >
            <span className={styles.sidebarItemContent}>
              {Icon ? (
                <span className={styles.sidebarItemIcon}>
                  <Icon aria-hidden="true" />
                </span>
              ) : null}

              {!isCollapsed ? <span className={styles.sidebarItemText}>{item.text}</span> : null}
            </span>
          </Button>

          {!isCollapsed && item.children?.length ? (
            <div className={styles.sidebarSubmenu}>{renderMenu(item.children, depth + 1)}</div>
          ) : null}
        </div>
      );
    });

  /* ==========================================================================
     Width measurement
     ========================================================================== */

  const renderMeasureItems = (nodes: SidebarMenuItem[], depth = 0): ReactNode =>
    nodes.map((item) => {
      const Icon = item.icon;

      return (
        <div key={item.id}>
          <div className={styles.sidebarWidthMeasureItem} data-depth={depth}>
            {Icon ? (
              <span className={styles.sidebarItemIcon}>
                <Icon aria-hidden="true" />
              </span>
            ) : null}

            <span className={styles.sidebarWidthMeasureText}>{item.text}</span>
          </div>

          {item.children?.length ? renderMeasureItems(item.children, depth + 1) : null}
        </div>
      );
    });

  /* ==========================================================================
     Render
     ========================================================================== */

  const classNameRoot = [styles.sidebarMenu, styles[`${size}`], className].filter(Boolean).join(' ');

  const style =
    expandedWidth === null
      ? undefined
      : ({
          '--sidebar-expanded-width': `${expandedWidth}px`,
        } as CSSProperties);

  const ToggleIcon =
    position === 'right'
      ? isCollapsed
        ? PanelLeftClose
        : PanelRightClose
      : isCollapsed
        ? PanelRightClose
        : PanelLeftClose;

  return (
    <div className={classNameRoot} data-mode={currentMode} data-position={position} style={style}>
      <div ref={measureRef} className={styles.sidebarWidthMeasure} aria-hidden="true">
        {renderMeasureItems(items)}
      </div>

      <aside className={styles.sidebarShell} aria-label={ariaLabel}>
        <div className={styles.sidebarShellTop}>
          <div className={styles.sidebarHeader}>
            {!isCollapsed ? <div className={styles.sidebarBrand}>{brand}</div> : null}

            <Button
              type="button"
              mode="icon"
              size={size}
              className={styles.sidebarModeToggle}
              onClick={toggleMode}
              aria-label={isCollapsed ? 'Expandir menú' : 'Plegar menú'}
              tooltip={isCollapsed ? 'Expandir menú' : 'Plegar menú'}
            >
              <ToggleIcon aria-hidden="true" />
            </Button>
          </div>

          <div className={styles.separator} />

          <nav className={styles.sidebarNav}>{renderMenu(items)}</nav>
        </div>

        {footer ? <div className={styles.sidebarShellBottom}>{footer}</div> : null}
      </aside>

      <main className={styles.sidebarContent}>{children}</main>
    </div>
  );
}
