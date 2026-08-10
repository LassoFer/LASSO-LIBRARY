import type { LucideIcon } from 'lucide-react';
import { Loader2, Search } from 'lucide-react';
import {
  forwardRef,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
  type TextareaHTMLAttributes,
} from 'react';

import { classNames } from '../../utils/common';
import Button from '../button/button';
import type { Size } from '../common';

import styles from './input.module.css';

type Value = string | number;

type InputType = 'text' | 'email' | 'password' | 'number' | 'textarea' | 'date';

type NativeInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type' | 'size'>;

export interface InputProps<InputOption = unknown, TValue extends Value = string> extends NativeInputProps {
  value: TValue;
  onChange: (value: TValue) => void;

  type?: InputType;
  icon?: LucideIcon;
  size?: Size;
  rows?: number;

  search?: boolean;
  searchLoading?: boolean;
  onSearch?: (value: TValue) => void;

  options?: InputOption[];
  getOptionLabel?: (option: InputOption) => ReactNode;
  getOptionValue?: (option: InputOption) => TValue;
  onOptionSelect?: (option: InputOption) => void;
  emptyOptionsText?: string;
}

const iconSizeByInputSize: Record<Size, number> = {
  XS: 10,
  S: 12,
  M: 14,
  L: 16,
  XL: 18,
};

function InputComponent<InputOption = unknown, TValue extends Value = string>(
  props: InputProps<InputOption, TValue>,
  forwardedRef: Ref<HTMLInputElement | HTMLTextAreaElement>,
) {
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

  // useEffect(() => {
  //   const activeElement = document.activeElement;

  //   if (activeElement && wrapperRef.current?.contains(activeElement) && hasOptionsConfiguration) {
  //     setShowOptions(true);
  //   }
  // }, [options, hasOptionsConfiguration]);

  /* ==========================================================================
     Wrapper
     ========================================================================== */

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

  /* ==========================================================================
     Search
     ========================================================================== */

  const handleSearch = () => {
    if (disabled || readOnly || searchLoading) {
      return;
    }

    onSearch?.(value);
  };

  /* ==========================================================================
     Options
     ========================================================================== */

  const resolveOptionLabel = (option: InputOption): ReactNode => {
    if (getOptionLabel) {
      return getOptionLabel(option);
    }

    return String(option ?? '');
  };

  const resolveOptionValue = (option: InputOption): TValue => {
    if (getOptionValue) {
      return getOptionValue(option);
    }

    if (typeof option === 'string' || typeof option === 'number') {
      return option as unknown as TValue;
    }

    const label = resolveOptionLabel(option);

    if (typeof label === 'string' || typeof label === 'number') {
      return label as unknown as TValue;
    }

    return '' as unknown as TValue;
  };

  const handleOptionClick = (option: InputOption) => {
    if (disabled || readOnly) {
      return;
    }

    const nextValue = resolveOptionValue(option);

    onChange(nextValue);
    onOptionSelect?.(option);

    setShowOptions(false);
  };

  /* ==========================================================================
     Change
     ========================================================================== */

  const handleChange = (event: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLTextAreaElement>) => {
    const rawValue = event.target.value;

    if (type === 'number') {
      if (rawValue === '') {
        onChange('' as TValue);
        return;
      }

      const parsedValue = Number(rawValue);

      onChange((Number.isNaN(parsedValue) ? '' : parsedValue) as TValue);

      return;
    }

    onChange(rawValue as TValue);
  };

  /* ==========================================================================
     Keyboard
     ========================================================================== */

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

  /* ==========================================================================
     Focus
     ========================================================================== */

  const handleFocus = (event: FocusEvent<HTMLInputElement> | FocusEvent<HTMLTextAreaElement>) => {
    if (hasOptionsConfiguration) {
      setShowOptions(true);
    }

    onFocus?.(event as FocusEvent<HTMLInputElement>);
  };

  const handleBlur = (event: FocusEvent<HTMLInputElement> | FocusEvent<HTMLTextAreaElement>) => {
    onBlur?.(event as FocusEvent<HTMLInputElement>);
  };

  /* ==========================================================================
     Classes
     ========================================================================== */

  const controlClassName = classNames([styles.input, styles[`size${size}`], isTextarea && styles.textarea, className]);

  /* ==========================================================================
     Shared props
     ========================================================================== */

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

  /* ==========================================================================
     Render
     ========================================================================== */

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
          ref={forwardedRef as Ref<HTMLTextAreaElement>}
          {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)}
          {...commonProps}
          rows={rows}
        />
      ) : (
        <input ref={forwardedRef as Ref<HTMLInputElement>} {...rest} {...commonProps} type={type} />
      )}

      {search && (
        <Button
          type="button"
          mode="icon"
          size={size}
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
                  key={`${String(optionValue)}-${index}`}
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
}

/* ==========================================================================
   Generic forwardRef
   ========================================================================== */

const Input = forwardRef(InputComponent) as <InputOption = unknown, TValue extends Value = string>(
  props: InputProps<InputOption, TValue> & {
    ref?: Ref<HTMLInputElement | HTMLTextAreaElement>;
  },
) => ReactElement;

export default Input;
