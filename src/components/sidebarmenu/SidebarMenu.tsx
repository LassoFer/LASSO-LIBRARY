import { ChevronLeft, ChevronRight, type LucideIcon } from 'lucide-react';
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

import Button from '../button/button';
import type { Size } from '../common';

import { classNames } from '../../utils/common';
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

  defaultMode?: SidebarMode;

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

const collapsedWidths: Record<Size, number> = {
  XS: 29,
  S: 40,
  M: 51,
  L: 60,
  XL: 72,
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

  defaultMode = 'expanded',

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
  const [originalWidth, setOriginalWidth] = useState<number | null>(null);
  const [expandedWidth, setExpandedWidth] = useState<number | null>(null);

  const measureRef = useRef<HTMLDivElement>(null);

  const isCollapsed = internalMode === 'collapsed';

  const resolveActive = isItemActive ?? defaultIsItemActive;

  /* ==========================================================================
     Width
     ========================================================================== */

  useLayoutEffect(() => {
    const element = measureRef.current;

    if (!element) {
      return;
    }
    const width = Math.ceil(element.scrollWidth);
    setOriginalWidth((current) => (current === width ? current : width + 1));
  }, [items, size]);

  /* ==========================================================================
     Mode
     ========================================================================== */

  const toggleMode = () => {
    const nextMode: SidebarMode = isCollapsed ? 'expanded' : 'collapsed';
    setInternalMode(nextMode);
    setExpandedWidth(nextMode === 'expanded' ? originalWidth : collapsedWidths[size]);
  };

  /* ==========================================================================
     Item
     ========================================================================== */

  const handleItemClick = (item: SidebarMenuItem) => {
    if (item.disabled) return;

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
            tooltip={isCollapsed ? item.text : undefined}
            onClick={() => handleItemClick(item)}
          >
            <span className={styles.sidebarItemContent}>
              {Icon ? (
                <span className={styles.sidebarItemIcon}>
                  <Icon aria-hidden="true" />
                </span>
              ) : null}

              {!isCollapsed && (
                <span className={classNames([styles.sidebarItemText, styles.itemCollapsed])}>{item.text}</span>
              )}
            </span>
          </Button>

          {!isCollapsed && item.children?.length ? (
            <div className={classNames([styles.sidebarSubmenu, styles.itemCollapsed])}>
              {renderMenu(item.children, depth + 1)}
            </div>
          ) : null}
        </div>
      );
    });

  /* ==========================================================================
     Render
     ========================================================================== */

  const ToggleIcon =
    position === 'right' ? (isCollapsed ? ChevronLeft : ChevronRight) : isCollapsed ? ChevronRight : ChevronLeft;

  return (
    <div
      className={classNames([styles.sidebarMenu, styles[`${size}`], className])}
      data-mode={internalMode}
      data-position={position}
    >
      <div
        ref={measureRef}
        className={styles.sidebarShell}
        aria-label={ariaLabel}
        style={{ width: `${expandedWidth ?? originalWidth}px` }}
        // onMouseEnter={ontoggle}
      >
        <div className={styles.sidebarShellTop}>
          <div className={styles.sidebarHeader} style={{ gap: isCollapsed ? '0px' : '' }}>
            <div className={styles.sidebarBrand} style={{ flex: isCollapsed ? '0' : '' }}>
              {brand}
            </div>
            <Button type="button" size={size} className={styles.sidebarModeToggle} onClick={toggleMode}>
              <ToggleIcon aria-hidden="true" />
            </Button>
          </div>
          <div className={styles.separator}></div>
          <nav className={styles.sidebarNav}>{renderMenu(items)}</nav>
        </div>

        {footer ? <div className={styles.sidebarShellBottom}>{footer}</div> : null}
      </div>

      <main className={styles.sidebarContent}>{children}</main>
    </div>
  );
}
