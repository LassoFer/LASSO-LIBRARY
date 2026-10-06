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
import { createPortal } from 'react-dom';
import { classNames } from '../../utils/common';
import Button from '../button/button';
import type { Size } from '../common';
import Input from '../input/input';
import styles from './select.module.css';

type Mode = 'default' | 'search' | 'tree' | 'multi';

interface Option {
  value: string | number;
  label: string;
  children?: Option[];
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
  const [focusedOptionIndex, setFocusedOptionIndex] = useState(-1);
  const optionRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [popupPosition, setPopupPosition] = useState<PopupPosition | null>(null);
  const [expandedValues, setExpandedValues] = useState<Set<string | number>>(new Set());

  const hasChildren = (option: Option) => {
    return Boolean(option.children?.length);
  };
  const isSelected = (option: Option) => selectedValues.includes(option.value);

  const selectedValues = useMemo(() => {
    if (Array.isArray(selectedValue)) {
      return selectedValue;
    }

    if (selectedValue !== undefined && selectedValue !== null) {
      return [selectedValue];
    }

    return [];
  }, [selectedValue]);

  const filteredOptions = useMemo(() => {
    if (!isSearch || !search.trim()) return options;

    const query = search.toLowerCase();

    const filterTree = (items: Option[]): Option[] => {
      return items.reduce<Option[]>((result, option) => {
        const matches = option.label.toLowerCase().includes(query);

        const filteredChildren = option.children ? filterTree(option.children) : [];

        if (matches || filteredChildren.length > 0) {
          result.push({
            ...option,
            children: filteredChildren,
          });
        }

        return result;
      }, []);
    };

    return filterTree(options);
  }, [options, search, isSearch]);

  const findOptions = useCallback((options: Option[], values: Array<string | number>): Option[] => {
    const result: Option[] = [];

    const visit = (items: Option[]) => {
      for (const option of items) {
        if (values.includes(option.value)) {
          result.push(option);
        }

        if (option.children?.length) {
          visit(option.children);
        }
      }
    };

    visit(options);

    return result;
  }, []);

  const displayValue = useMemo(() => {
    if (!selectedValues.length) return placeholder;
    const selectedOptions = findOptions(options, selectedValues);

    if (isMulti || isTree) return selectedOptions.map((option) => option.label).join(', ');

    return selectedOptions[0]?.label || placeholder;
  }, [isMulti, options, placeholder, selectedValues]);

  const updateValue = useCallback(
    (nextValue: string | number | Array<string | number> | undefined) => {
      if (!isControlled) {
        setInternalValue(nextValue);
      }

      onChange?.(nextValue);
    },
    [isControlled, onChange],
  );

  useLayoutEffect(() => {
    if (!open) return;

    calculatePopupPosition();
  }, [open, options.length]);

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
        setFocusedOptionIndex(-1);
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

  const focusOption = useCallback(
    (index: number) => {
      if (!filteredOptions.length) {
        setFocusedOptionIndex(-1);
        return;
      }

      const nextIndex = Math.max(0, Math.min(index, filteredOptions.length - 1));

      setFocusedOptionIndex(nextIndex);

      requestAnimationFrame(() => {
        optionRefs.current[nextIndex]?.scrollIntoView({
          block: 'nearest',
        });
      });
    },
    [filteredOptions.length],
  );

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

  const checkChildrens = (children: Option[], allChilds: (string | number)[]) => {
    children.forEach((c: Option) => {
      allChilds.push(c.value);
      if (c.children && c.children?.length > 0) checkChildrens(c.children, allChilds);
    });
  };

  const checkParents = (option: Option, children: Option[], allParents: (string | number)[], selection: boolean) => {
    if (children.find((c) => c.value === option.value)) return true;

    for (let i = 0; i < children.length; i++) {
      const opt = children[i];
      if (opt.children && opt.children.length > 0) {
        const isChild = checkParents(option, opt.children, allParents, selection);

        if (isChild && !selection) {
          allParents.push(opt.value);
          return true;
        } else if (isChild && selection) {
          let n = 0;
          opt.children.forEach((o) => {
            if (selectedValues.includes(o.value)) n++;
          });

          if (n === opt.children.length - 1) {
            allParents.push(opt.value);
            return true;
          }
        }
      }
    }
  };

  const updateTreeSelection = (option: Option, isMulti: boolean) => {
    const allChilds: (string | number)[] = [option.value];
    const allParents: (string | number)[] = [option.value];
    const isSelection = !selectedValues.includes(option.value);

    const findOption = (opt: Option, children: Option[]) => {
      for (let i = 0; i < children.length; i++) {
        const o = children[i];
        if (opt.value === o.value) return o;
        if (o.children && o.children.length > 0) return findOption(opt, o.children);
      }
    };

    const foundOption = findOption(option, options);
    if (option.children && option.children.length > 0 && foundOption && foundOption.children)
      checkChildrens(foundOption.children, allChilds);

    checkParents(option, options, allParents, isSelection);

    if (isMulti)
      isSelection
        ? updateValue([...new Set([...allParents, ...allChilds, ...selectedValues])])
        : updateValue(selectedValues.filter((s) => ![...allParents, ...allChilds].includes(s)));
    else isSelection ? updateValue(allChilds) : updateValue([]);
  };

  const handleOptionClick = (option: Option) => {
    if (disabled) return;

    if (isTree) {
      updateTreeSelection(option, isMulti);
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
    setFocusedOptionIndex(-1);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) {
      return;
    }

    switch (event.key) {
      case 'Enter':
      case ' ': {
        event.preventDefault();

        if (!open) {
          setOpen(true);

          const selectedIndex = filteredOptions.findIndex((option) => selectedValues.includes(option.value));

          setFocusedOptionIndex(selectedIndex >= 0 ? selectedIndex : 0);
          return;
        }

        if (focusedOptionIndex >= 0 && focusedOptionIndex < filteredOptions.length) {
          handleOptionClick(filteredOptions[focusedOptionIndex]);
        }

        break;
      }

      case 'Escape':
        if (open) {
          event.preventDefault();
          setOpen(false);
          setSearch('');
          setFocusedOptionIndex(-1);
        }
        break;

      case 'ArrowDown': {
        event.preventDefault();

        if (!open) {
          setOpen(true);

          const selectedIndex = filteredOptions.findIndex((option) => selectedValues.includes(option.value));

          setFocusedOptionIndex(selectedIndex >= 0 ? selectedIndex : 0);
          return;
        }

        focusOption(focusedOptionIndex + 1);
        break;
      }

      case 'ArrowUp': {
        event.preventDefault();

        if (!open) {
          setOpen(true);

          const selectedIndex = filteredOptions.findIndex((option) => selectedValues.includes(option.value));

          setFocusedOptionIndex(selectedIndex >= 0 ? selectedIndex : 0);
          return;
        }

        focusOption(focusedOptionIndex <= 0 ? 0 : focusedOptionIndex - 1);
        break;
      }

      case 'Home':
        if (open) {
          event.preventDefault();
          focusOption(0);
        }
        break;

      case 'End':
        if (open) {
          event.preventDefault();
          focusOption(filteredOptions.length - 1);
        }
        break;

      case 'Tab':
        if (open) {
          setOpen(false);
          setFocusedOptionIndex(-1);
        }
        break;
    }
  };

  const toggleExpanded = (value: string | number) => {
    setExpandedValues((current) => {
      const next = new Set(current);

      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }

      return next;
    });
  };

  const renderOption = (option: Option, index: number, level = 0) => {
    const selected = isSelected(option);
    const focused = focusedOptionIndex === index;
    const hasChildOptions = hasChildren(option);
    const expanded = expandedValues.has(option.value);

    return (
      <div key={option.value}>
        <div
          ref={(element) => {
            optionRefs.current[index] = element;
          }}
          className={classNames([
            styles.option,
            selected ? styles.optionSelected : '',
            focused ? styles.optionFocused : '',
          ])}
          role="option"
          aria-selected={selected}
          onClick={() => {
            handleOptionClick(option);
          }}
        >
          {isTree && hasChildOptions && (
            <Button
              className={styles.treeArrowContainer}
              size={size}
              tabIndex={-1}
              mode="icon"
              onClick={(event) => {
                event.stopPropagation();
                toggleExpanded(option.value);
              }}
            >
              <ChevronRight className={classNames([styles.treeArrow, expanded ? styles.treeArrowOpen : ''])} />
            </Button>
          )}

          {isMulti && <span className={classNames([styles.checkbox, selected ? styles.checkboxChecked : ''])} />}

          <span className={styles.optionLabel}>{option.label}</span>
        </div>

        {isTree && expanded && (
          <div
            style={{
              paddingLeft: 20,
            }}
          >
            {option.children?.map((child) => renderOption(child, index, level + 1))}
          </div>
        )}
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
            filteredOptions.map((option, index) => renderOption(option, index))
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

        <Button size={size} mode="icon" className={styles.arrowContainer} tabIndex={-1}>
          <ChevronDown className={classNames([styles.arrow, open ? styles.arrowOpen : ''])} />
        </Button>
      </div>

      {createPortal(renderPopup(), document.body)}
    </>
  );
}
