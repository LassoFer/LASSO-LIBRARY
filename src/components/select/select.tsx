import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from 'react';

import { ChevronDown, ChevronRight } from 'lucide-react';
import { classNames } from '../../utils/common';
import type { Size } from '../common';
import Input from '../input/input';
import styles from './select.module.css';

type Mode = 'default' | 'search' | 'tree' | 'multi';

interface Option {
  value: string | number;
  label: string;
  extra?: unknown;
}

export interface SelectProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'onChange' | 'onFocus' | 'onKeyDown' | 'onClick' | 'defaultValue'
> {
  className?: string;
  style?: CSSProperties;
  size?: Size;
  mode?: Mode | Mode[];
  options: Option[];

  value?: string | number | Array<string | number>;

  defaultValue?: string | number | Array<string | number>;

  placeholder?: string;

  onChange?: (value: string | number | Array<string | number> | undefined) => void;

  onFocus?: () => void;
  disabled?: boolean;
}

interface PopupPosition {
  top: number;
  left: number;
  width: number;
  placement: 'top' | 'bottom';
}

export default function Select({
  className,
  style,
  size = 'M',
  mode = 'default',
  options,
  value,
  defaultValue,
  placeholder = 'Select...',
  onChange,
  onFocus,
  disabled = false,
  ...rest
}: SelectProps) {
  const selectRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const modes = useMemo(() => (Array.isArray(mode) ? mode : [mode]), [mode]);

  const isSearch = modes.includes('search');
  const isMulti = modes.includes('multi');
  const isTree = modes.includes('tree');

  const isControlled = value !== undefined;

  const [focusByMouse, setFocusByMouse] = useState<boolean>(false);
  const [internalValue, setInternalValue] = useState<string | number | Array<string | number> | undefined>(
    defaultValue,
  );

  const selectedValue = isControlled ? value : internalValue;

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [popupPosition, setPopupPosition] = useState<PopupPosition | null>(null);

  const selectedValues = useMemo(() => {
    if (Array.isArray(selectedValue)) {
      return selectedValue;
    }

    if (selectedValue !== undefined && selectedValue !== null) {
      return [selectedValue];
    }

    return [];
  }, [selectedValue]);

  /**
   * Normalizes the selected value.
   */
  const updateValue = useCallback(
    (nextValue: string | number | Array<string | number> | undefined) => {
      if (!isControlled) {
        setInternalValue(nextValue);
      }

      onChange?.(nextValue);
    },
    [isControlled, onChange],
  );

  /**
   * Calculates the popup position.
   *
   * The popup is positioned using fixed coordinates so it is not affected
   * by overflow:hidden / overflow:auto parents.
   */
  const calculatePopupPosition = useCallback(() => {
    if (!selectRef.current) {
      return;
    }

    const rect = selectRef.current.getBoundingClientRect();

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const margin = 3;
    const estimatedHeight = Math.min(popupRef.current?.offsetHeight || 300, viewportHeight - margin);

    const popupWidth = Math.max(rect.width, popupRef.current?.offsetWidth || rect.width);

    /**
     * Prefer opening below the select.
     */
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    const placement = spaceBelow >= estimatedHeight || spaceBelow >= spaceAbove ? 'bottom' : 'top';

    let top = placement === 'bottom' ? rect.bottom + margin : rect.top - estimatedHeight - margin;

    /**
     * Prevent the popup from going outside vertically.
     */
    top = Math.max(margin, Math.min(top, viewportHeight - estimatedHeight - margin));

    /**
     * Align with the left edge by default.
     */
    let left = rect.left;

    /**
     * Prevent horizontal overflow.
     */
    if (left + popupWidth > viewportWidth - margin) {
      left = viewportWidth - popupWidth - margin;
    }

    left = Math.max(margin, left);

    setPopupPosition({
      top,
      left,
      width: popupWidth,
      placement,
    });
  }, []);

  /**
   * Calculate position after the popup has been rendered.
   */
  useLayoutEffect(() => {
    if (!open) return;

    calculatePopupPosition();
  }, [open, options.length, calculatePopupPosition]);

  /**
   * Close the popup when the viewport changes.
   */
  useEffect(() => {
    if (!open) {
      return;
    }

    const handleResize = () => {
      setOpen(false);
    };

    const handleScroll = (event: Event) => {
      const target = event.target;
      const isInsidePopup = target instanceof Node && popupRef.current?.contains(target);
      const isInsideSelect = target instanceof Node && selectRef.current?.contains(target);
      if (isInsidePopup || isInsideSelect) {
        return;
      }
      setOpen(false);
    };

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (!selectRef.current?.contains(target) && !popupRef.current?.contains(target)) {
        setOpen(false);
        setSearch('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', handleResize);
    document.addEventListener('scroll', handleScroll, true);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('scroll', handleScroll, true);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const filteredOptions = useMemo(() => {
    if (!isSearch || !search.trim()) return options;

    const query = search.toLowerCase();

    return options.filter((option) => option.label.toLowerCase().includes(query));
  }, [options, search, isSearch]);

  const selectedOption = useMemo(() => {
    return options.find((option) => option.value === selectedValues[0]);
  }, [options, selectedValues]);

  const displayValue = useMemo(() => {
    if (isMulti) {
      if (!selectedValues.length) {
        return placeholder;
      }

      const selectedOptions = options.filter((option) => selectedValues.includes(option.value));

      return selectedOptions.map((option) => option.label).join(', ');
    }

    return selectedOption?.label || placeholder;
  }, [isMulti, options, placeholder, selectedOption, selectedValues]);

  const isSelected = (option: Option) => selectedValues.includes(option.value);

  const handleOptionClick = (option: Option) => {
    if (disabled) {
      return;
    }

    if (isMulti) {
      const exists = selectedValues.includes(option.value);

      const nextValues = exists
        ? selectedValues.filter((value) => value !== option.value)
        : [...selectedValues, option.value];

      updateValue(nextValues);
      return;
    }

    updateValue(option.value);

    setOpen(false);
    setSearch('');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) {
      return;
    }

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();

        if (!open) {
          setOpen(true);
        }

        break;

      case 'Escape':
        setOpen(false);
        setSearch('');
        break;

      case 'ArrowDown':
        event.preventDefault();

        if (!open) {
          setOpen(true);
        }

        break;

      case 'Tab':
        if (open) setOpen(false);
    }
  };

  const renderOption = (option: Option) => {
    const selected = isSelected(option);

    return (
      <div
        key={option.value}
        className={classNames([styles.option, selected ? styles.optionSelected : ''])}
        role="option"
        aria-selected={selected}
        onClick={() => handleOptionClick(option)}
        onKeyDown={handleKeyDown}
      >
        {isMulti && <span className={classNames([styles.checkbox, selected ? styles.checkboxChecked : ''])}></span>}

        {isTree && (
          <span className={styles.treeIcon}>
            <ChevronRight></ChevronRight>
          </span>
        )}

        <span className={styles.optionLabel}>{option.label}</span>
      </div>
    );
  };

  const renderPopup = () => {
    if (!open) {
      return null;
    }

    return (
      <div
        ref={popupRef}
        className={classNames([styles.popup, styles[`${size}`]])}
        style={{
          top: popupPosition?.top,
          left: popupPosition?.left,
          minWidth: popupPosition?.width,
          maxHeight: `calc(100vh - ${(popupPosition?.top || 0) + 16}px)`,
        }}
        role="listbox"
        aria-multiselectable={isMulti}
      >
        {isSearch && (
          <div className={styles.searchContainer}>
            <Input
              ref={searchRef}
              value={search}
              onChange={(value) => setSearch(value)}
              size={size}
              placeholder="Search..."
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  setOpen(false);
                }
              }}
            />
          </div>
        )}

        <div className={styles.options}>
          {filteredOptions.length > 0 ? (
            filteredOptions.map(renderOption)
          ) : (
            <div className={styles.empty}>No options found</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <div
        ref={selectRef}
        className={classNames([
          styles.Select,
          styles[`${size}`],
          disabled ? styles.disabled : '',
          open ? styles.open : '',
          className || '',
          focusByMouse ? styles.focusByMouse : '',
        ])}
        style={style}
        tabIndex={disabled ? -1 : 0}
        role="combobox"
        aria-expanded={open}
        aria-disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setOpen((current) => !current);
            onFocus?.();
          }
        }}
        onFocus={onFocus}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          setFocusByMouse(false);
        }}
        onMouseDown={() => setFocusByMouse(true)}
        {...rest}
      >
        <span className={classNames([styles.value, !selectedValues.length ? styles.placeholder : ''])}>
          {displayValue}
        </span>

        <span className={classNames([styles.arrowContainer, styles[size]])}>
          <ChevronDown size="100%" className={classNames([styles.arrow, open ? styles.arrowOpen : ''])} />
        </span>
      </div>

      {/* {createPortal(renderPopup(), document.body)} */}

      {renderPopup()}
    </>
  );
}
