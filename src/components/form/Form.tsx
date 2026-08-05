import { CheckBoxComponent } from '@syncfusion/ej2-react-buttons';
import { DatePickerComponent } from '@syncfusion/ej2-react-calendars';
import type { JSX } from 'react';
import {
  Controller,
  useForm,
  type ControllerFieldState,
  type ControllerRenderProps,
  type UseFormStateReturn,
} from 'react-hook-form';
import type { FormField, FormProps, FormValues } from '../../types/Form';
import { classNames } from '../../utils/common';
import Button from '../button/button';
import Input from '../input/input';
import Select from '../select/select';
import styles from './Form.module.css';
type Size = 'S' | 'M' | 'L';

export function Form<T>({
  fields,
  onSubmit,
  floatLabel,
  mode = 'onChange',
  size = 'M',
}: FormProps<T> & { size?: Size }) {
  const { control, handleSubmit } = useForm<FormValues>({
    defaultValues: fields.reduce((acc, field) => {
      acc[field.name] = field.value;
      return acc;
    }, {} as FormValues),
    mode,
  });

  const getSizeClass = () => {
    switch (size) {
      case 'S':
        return styles.sizeS;
      case 'L':
        return styles.sizeL;
      case 'M':
      default:
        return styles.sizeM;
    }
  };

  const renderController = (field: FormField) => {
    return (
      <Controller
        name={field.name}
        control={control}
        rules={field.rules}
        render={({ ...provided }) => {
          return renderField(field, provided);
        }}
      />
    );
  };

  const renderField = (
    field: FormField,
    provided: {
      field: ControllerRenderProps<FormValues, string>;
      fieldState: ControllerFieldState;
      formState: UseFormStateReturn<FormValues>;
    },
  ): JSX.Element => {
    const error = provided.fieldState.error;

    return (
      <>
        {(() => {
          switch (field.type) {
            case 'text':
            case 'email':
            case 'password':
            case 'textarea':
            case 'number':
              return (
                <Input
                  value={(provided.field.value as string) ?? ''}
                  placeholder={field.label}
                  type={field.type === 'textarea' ? 'text' : field.type}
                  onChange={(e) => provided.field.onChange(e)}
                  floatLabelType={floatLabel}
                  size={size}
                  icon={field.icon}
                />
              );

            case 'dropdown':
              return (
                <Select
                  dataSource={field.dataSource}
                  value={provided.field.value}
                  onChange={(e) => provided.field.onChange(e.value)}
                />
              );

            case 'date':
              return (
                <DatePickerComponent
                  className={getSizeClass()}
                  value={(provided.field.value as Date) ?? new Date()}
                  floatLabelType={floatLabel}
                  change={(e) => provided.field.onChange(e.value)}
                />
              );

            case 'checkbox':
              return (
                <CheckBoxComponent
                  className={getSizeClass()}
                  label={field.label}
                  checked={(provided.field.value as boolean) ?? false}
                  change={(e) => provided.field.onChange(e.checked)}
                />
              );

            default:
              return <></>;
          }
        })()}

        {error && <small style={{ color: 'red', fontWeight: 400 }}>{error.message}</small>}
      </>
    );
  };

  return (
    <form
      onSubmit={handleSubmit((e: FormValues) => onSubmit(e as T))}
      className={classNames([styles.formContainer, getSizeClass()])} // opcional global
    >
      {fields.map((field) => (
        <div key={field.name} className={classNames([styles.formInput, styles[`size${size}`]])} style={{ flex: 1 }}>
          {field.type !== 'checkbox' && !floatLabel && (
            <label className={classNames([styles.formLabel, styles[`size${size}`]])}>{field.label}</label>
          )}
          {renderController(field)}
        </div>
      ))}

      <Button type="submit" size={'L'}>
        Acceder
      </Button>
    </form>
  );
}
