import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { classNames } from '../../utils/common';
import type { Size } from '../common';
import styles from './button.module.css';

type ButtonVariant = 'solid' | 'ghost' | 'danger' | 'success' | 'warning' | 'info' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  size?: Size;
  mode?: ButtonVariant;
  className?: string;
  tooltip?: string;
}

export default function Button({
  children = 'Enviar',
  size = 'M',
  mode = 'solid',
  className,
  tooltip,
  ...rest
}: ButtonProps) {
  const sizeClass = {
    XS: styles.XS,
    S: styles.S,
    M: styles.M,
    L: styles.L,
    XL: styles.XL,
  }[size];

  const variantClass = {
    solid: styles.variantSolid,
    ghost: styles.variantGhost,
    danger: styles.variantDanger,
    success: styles.variantSuccess,
    warning: styles.variantWarning,
    info: styles.variantInfo,
    icon: styles.variantIcon,
  }[mode];

  const buttonClassName = classNames([styles.button, sizeClass, variantClass, className]);

  const content = tooltip ? <span className={styles.tooltipContent}>{children}</span> : children;

  return (
    <button className={buttonClassName} {...rest}>
      {content}
    </button>
  );
}
