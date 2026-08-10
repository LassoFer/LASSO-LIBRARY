'use client';

import * as React from 'react';
import { classNames } from '../../utils/common';
import type { Size } from '../common';
import styles from './card.module.css';

interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: string | React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  loading?: boolean;
  icon?: React.ReactNode;
  headerStyle?: React.CSSProperties;
  titleStyle?: React.CSSProperties;
  contentStyle?: React.CSSProperties;
  iconSize?: number;
  size?: Size;
  resizable?: boolean;
  contentClassName?: string;
}

const sizeClassMap: Record<Size, string> = {
  XS: styles.XS,
  S: styles.S,
  M: styles.M,
  L: styles.L,
  XL: styles.XL,
};

const iconSizeMap: Record<Size, number> = {
  XS: 11,
  S: 14,
  M: 17,
  L: 20,
  XL: 23,
};

export function Card({
  title,
  subtitle,
  actions,
  className,
  children,
  style,
  loading = false,
  icon,
  headerStyle = {},
  titleStyle = {},
  contentStyle = {},
  iconSize,
  size = 'M',
  resizable = false,
  contentClassName,
  ...rest
}: CardProps) {
  const resolvedIconSize = iconSize ?? iconSizeMap[size];

  return (
    <div
      className={classNames([styles.cardCustom, sizeClassMap[size], resizable && styles.resizable, className])}
      {...rest}
      style={{
        position: 'relative',
        ...style,
      }}
    >
      {(icon || title || subtitle || actions) && (
        <div className={styles.cardHeader} style={headerStyle}>
          {icon && (
            <div
              className={styles.cardIcon}
              style={{
                width: `${resolvedIconSize}px`,
                height: `${resolvedIconSize}px`,
              }}
            >
              {icon}
            </div>
          )}

          {(title || subtitle) && (
            <div className={styles.cardText}>
              {title && (
                <div className={styles.cardTitle} style={titleStyle}>
                  {title}
                </div>
              )}

              {subtitle ? <div className={styles.cardSubtitle}>{subtitle}</div> : null}
            </div>
          )}

          {actions ? <div className={styles.cardActions}>{actions}</div> : null}
        </div>
      )}

      <div className={classNames([styles.cardContent, contentClassName])} style={contentStyle}>
        {children}
      </div>

      {/* <Loader show={loading} /> */}

      {resizable && <span className={styles.resizeHandle} aria-hidden="true" />}
    </div>
  );
}
