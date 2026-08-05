import type { LucideIcon } from 'lucide-react';
import { Loader2, Search } from 'lucide-react';
import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type Dispatch,
  type FocusEvent,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  type SetStateAction,
  type TextareaHTMLAttributes,
} from 'react';
import { classNames } from '../../utils/common';
import Button from '../button/button';
import type { Size } from '../common';
import styles from './input.module.css';

type Value = string | number;

type InputType = 'text' | 'email' | 'password' | 'number' | 'textarea' | 'date';

type NativeInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type' | 'size'>;

interface InputProps<Option = unknown> extends NativeInputProps {
  value: Value;
  onChange: (value: Value) => void | Dispatch<SetStateAction<unknown>>;

  type?: InputType;
  icon?: LucideIcon;
  size?: Size;
  rows?: number;

  search?: boolean;
  searchLoading?: boolean;
  onSearch?: (value: Value) => void;

  options?: Option[];
  getOptionLabel?: (option: Option) => ReactNode;
  getOptionValue?: (option: Option) => Value;
  onOptionSelect?: (option: Option) => void;
  emptyOptionsText?: string;
}

const iconSizeByInputSize: Record<Size, number> = {
  XS: 10,
  S: 12,
  M: 14,
  L: 16,
  XL: 18,
};

const searchButtonSizeByInputSize: Record<Size, Size> = {
  XS: 'XS',
  S: 'XS',
  M: 'S',
  L: 'M',
  XL: 'L',
};

const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>((props, forwardedRef) => {
  const {
    value,
    onChange,
    type = 'text',
    placeholder,
    disabled,
    readOnly,
    icon: Icon,
    size = 'M',
    rows = 4,

    search = false,
    searchLoading = false,
    onSearch,

    options,
    getOptionLabel,
    getOptionValue,
    onOptionSelect,
    emptyOptionsText,

    onFocus,
    onBlur,
    onKeyDown,
    className,
    style,

    ...rest
  } = props;

  const optionsId = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [showOptions, setShowOptions] = useState(false);

  const isTextarea = type === 'textarea';
  const hasOptions = Boolean(options?.length);
  const hasOptionsConfiguration = Array.isArray(options);

  const shouldShowOptions = hasOptionsConfiguration && Boolean(hasOptions || emptyOptionsText) && showOptions;

  const iconSize = iconSizeByInputSize[size];
  const searchButtonSize = searchButtonSizeByInputSize[size];

  useEffect(() => {
    const activeElement = document.activeElement;

    if (activeElement && wrapperRef.current?.contains(activeElement) && hasOptionsConfiguration) {
      setShowOptions(true);
    }
  }, [options, hasOptionsConfiguration]);

  const handleWrapperFocus = () => {
    if (hasOptionsConfiguration) {
      setShowOptions(true);
    }
  };

  const handleWrapperBlur = (event: FocusEvent<HTMLDivElement>) => {
    const nextFocusedElement = event.relatedTarget;

    if (nextFocusedElement instanceof Node && event.currentTarget.contains(nextFocusedElement)) {
      return;
    }

    setShowOptions(false);
  };

  const handleSearch = () => {
    if (disabled || readOnly || searchLoading) {
      return;
    }

    onSearch?.(value);
  };

  const resolveOptionLabel = (option: Option): ReactNode => {
    if (getOptionLabel) {
      return getOptionLabel(option);
    }

    return String(option ?? '');
  };

  const resolveOptionValue = (option: Option): Value => {
    if (getOptionValue) {
      return getOptionValue(option);
    }

    if (typeof option === 'string' || typeof option === 'number') {
      return option;
    }

    const label = resolveOptionLabel(option);

    if (typeof label === 'string' || typeof label === 'number') {
      return label;
    }

    return '';
  };

  const handleOptionClick = (option: Option) => {
    if (disabled || readOnly) {
      return;
    }

    const nextValue = resolveOptionValue(option);

    onChange(nextValue);
    onOptionSelect?.(option);
    setShowOptions(false);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLTextAreaElement>) => {
    const rawValue = event.target.value;

    if (type === 'number') {
      if (rawValue === '') {
        onChange('');
        return;
      }

      const parsedValue = Number(rawValue);
      onChange(Number.isNaN(parsedValue) ? '' : parsedValue);
      return;
    }

    onChange(rawValue);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement> | KeyboardEvent<HTMLTextAreaElement>) => {
    onKeyDown?.(event as KeyboardEvent<HTMLInputElement>);

    if (event.defaultPrevented) {
      return;
    }

    if (event.key === 'Escape') {
      setShowOptions(false);
      return;
    }

    if (search && !isTextarea && event.key === 'Enter' && !disabled && !readOnly && !searchLoading) {
      onSearch?.(value);
    }
  };

  const handleFocus = (event: FocusEvent<HTMLInputElement> | FocusEvent<HTMLTextAreaElement>) => {
    if (hasOptionsConfiguration) {
      setShowOptions(true);
    }

    onFocus?.(event as FocusEvent<HTMLInputElement>);
  };

  const handleBlur = (event: FocusEvent<HTMLInputElement> | FocusEvent<HTMLTextAreaElement>) => {
    onBlur?.(event as FocusEvent<HTMLInputElement>);
  };

  const controlClassName = classNames([styles.input, styles[`size${size}`], isTextarea && styles.textarea, className]);

  const commonProps = {
    value: value?.toString() ?? '',
    placeholder,
    disabled,
    readOnly,
    className: controlClassName,
    style,
    onChange: handleChange,
    onKeyDown: handleKeyDown,
    onFocus: handleFocus,
    onBlur: handleBlur,
    'aria-expanded': hasOptionsConfiguration ? shouldShowOptions : undefined,
    'aria-controls': hasOptionsConfiguration ? optionsId : undefined,
    'aria-autocomplete': hasOptionsConfiguration ? ('list' as const) : undefined,
  };

  return (
    <div
      ref={wrapperRef}
      className={classNames([
        styles.wrapper,
        styles[`size${size}`],
        Icon && styles.hasIcon,
        search && styles.hasSearch,
        disabled && styles.disabled,
      ])}
      onFocus={handleWrapperFocus}
      onBlur={handleWrapperBlur}
    >
      {Icon && (
        <span className={styles.icon} aria-hidden="true">
          <Icon size={iconSize} />
        </span>
      )}

      {isTextarea ? (
        <textarea
          ref={forwardedRef as React.ForwardedRef<HTMLTextAreaElement>}
          {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)}
          {...commonProps}
          rows={rows}
        />
      ) : (
        <input ref={forwardedRef as React.ForwardedRef<HTMLInputElement>} {...rest} {...commonProps} type={type} />
      )}

      {search && (
        <Button
          type="button"
          mode="icon"
          size={searchButtonSize}
          className={styles.searchButton}
          onMouseDown={(event) => {
            event.preventDefault();
          }}
          onClick={handleSearch}
          disabled={disabled || readOnly || searchLoading}
          aria-label={searchLoading ? 'Buscando' : 'Buscar'}
          aria-busy={searchLoading}
        >
          {searchLoading ? (
            <Loader2 className={styles.loaderIcon} size={iconSize} aria-hidden="true" />
          ) : (
            <Search size={iconSize} aria-hidden="true" />
          )}
        </Button>
      )}

      {shouldShowOptions && search && (
        <div id={optionsId} className={styles.options} role="listbox">
          {hasOptions ? (
            options?.map((option, index) => {
              const optionValue = resolveOptionValue(option);

              return (
                <button
                  key={`${optionValue}-${index}`}
                  type="button"
                  role="option"
                  aria-selected={optionValue === value}
                  className={styles.option}
                  onMouseDown={(event) => {
                    event.preventDefault();
                  }}
                  onClick={() => handleOptionClick(option)}
                  disabled={disabled || readOnly}
                >
                  {resolveOptionLabel(option)}
                </button>
              );
            })
          ) : (
            <div className={styles.emptyOptions} role="status">
              {emptyOptionsText}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
