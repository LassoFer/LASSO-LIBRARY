import React from 'react';
import { classNames } from '../../utils/common';
import styles from './RadioGroup.module.css';

export type RadioGroupSize = 'S' | 'M' | 'L';
export type RadioGroupDirection = 'horizontal' | 'vertical';
export type RadioGroupVariant = 'default' | 'buttonGroup' | 'cards' | 'pills' | 'segmented' | 'soft';
export type RadioGroupSelectionMode = 'single' | 'multiple';

export type RadioOption<T extends string | number = string> = {
  label: React.ReactNode;
  value: T;
  description?: React.ReactNode;
  disabled?: boolean;
  icon?: React.ReactNode;
  color?: string;
};

export interface RadioGroupProps<T extends string | number = string> {
  name?: string;
  options: RadioOption<T>[];

  value?: T | T[];
  defaultValue?: T[];

  onChange?: (value: T | T[], option: RadioOption<T>) => void;

  size?: RadioGroupSize;
  direction?: RadioGroupDirection;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
  optionClassName?: string;
  ariaLabel?: string;
  renderOption?: (option: RadioOption<T>, state: { checked: boolean; disabled: boolean }) => React.ReactNode;
  variant?: RadioGroupVariant;

  selectionMode?: RadioGroupSelectionMode;

  clearOnSelectValues?: T[];
}

export function RadioGroup<T extends string | number = string>({
  name,
  options,
  value,
  defaultValue,
  onChange,
  size = 'M',
  direction = 'horizontal',
  variant = 'default',
  disabled = false,
  fullWidth = false,
  className = '',
  optionClassName = '',
  ariaLabel,
  renderOption,
  selectionMode = 'single',
  clearOnSelectValues = [],
}: RadioGroupProps<T>) {
  const generatedName = React.useId();
  const radioName = name ?? generatedName;

  const isControlled = value !== undefined;

  const [internalValue, setInternalValue] = React.useState<T | T[] | undefined>(
    defaultValue ?? (selectionMode === 'multiple' ? [] : undefined),
  );

  const selectedValue = isControlled ? value : internalValue;

  const isChecked = (optionValue: T) => {
    if (selectionMode === 'multiple') {
      return Array.isArray(selectedValue) && selectedValue.includes(optionValue);
    }

    return selectedValue === optionValue;
  };

  const handleChange = (option: RadioOption<T>) => {
    if (disabled || option.disabled) return;

    let nextValue: T | T[];

    if (selectionMode === 'multiple') {
      const currentValue = Array.isArray(selectedValue) ? selectedValue : [];
      const isClearOption = clearOnSelectValues.includes(option.value);

      if (isClearOption) {
        nextValue = [option.value];
      } else {
        nextValue = currentValue.includes(option.value)
          ? currentValue.filter((value) => value !== option.value)
          : [...currentValue.filter((value) => !clearOnSelectValues.includes(value)), option.value];
      }
    } else {
      nextValue = option.value;
    }

    if (!isControlled) {
      setInternalValue(nextValue);
    }

    onChange?.(nextValue, option);
  };

  const rootClassName = classNames([
    styles.radioGroup,
    styles[`size${size}`],
    styles[direction],
    styles[`variant${variant[0].toUpperCase()}${variant.slice(1)}`],
    selectionMode === 'multiple' ? styles.multiple : '',
    fullWidth ? styles.fullWidth : '',
    disabled ? styles.disabled : '',
    className,
  ]);

  return (
    <div className={rootClassName} role={selectionMode === 'multiple' ? 'group' : 'radiogroup'} aria-label={ariaLabel}>
      {options.map((option) => {
        const checked = isChecked(option.value);
        const optionDisabled = disabled || option.disabled;

        const itemClassName = [
          styles.radioItem,
          checked ? styles.checked : '',
          optionDisabled ? styles.optionDisabled : '',
          optionClassName,
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <label
            key={String(option.value)}
            className={itemClassName}
            style={
              option.color
                ? ({
                    '--radio-option-color': option.color,
                  } as React.CSSProperties)
                : undefined
            }
          >
            <input
              className={styles.input}
              type={selectionMode === 'multiple' ? 'checkbox' : 'radio'}
              name={selectionMode === 'multiple' ? undefined : radioName}
              value={String(option.value)}
              checked={checked}
              disabled={optionDisabled}
              onChange={() => handleChange(option)}
            />

            <span className={styles.control} aria-hidden="true">
              <span className={styles.dot} />
            </span>

            <span className={styles.content}>
              {renderOption ? (
                renderOption(option, { checked, disabled: optionDisabled })
              ) : (
                <>
                  <span className={styles.mainLine}>
                    {option.icon && <span className={styles.icon}>{option.icon}</span>}
                    <span className={styles.label}>{option.label}</span>
                  </span>

                  {option.description && <span className={styles.description}>{option.description}</span>}
                </>
              )}
            </span>
          </label>
        );
      })}
    </div>
  );
}
