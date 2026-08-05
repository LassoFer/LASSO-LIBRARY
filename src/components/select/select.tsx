import type { CSSProperties } from 'react';
import { classNames } from '../../utils/common';
import type { Size } from '../common';
import styles from './select.module.css';

type mode = 'default' | 'search' | 'tree' | 'multi';

interface option {
  value: string | number;
  label: string;
  extra: unknown;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  className?: string;
  style?: CSSProperties;
  size?: Size;
  mode: mode;
  options: option[];
  onChange?: (value: any) => void;
  onFocus?: () => void;
  disabled?: boolean;
}

export default function Select(props: SelectProps) {
  const renderOption = (option: option) => {
    return <div></div>;
  };

  const renderPopup = () => {
    return <div></div>;
  };
  return <div className={classNames([styles.Select])}></div>;
}
