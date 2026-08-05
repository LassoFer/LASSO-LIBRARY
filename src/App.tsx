import { Calendar, Hash, Lock, Mail, MapPin, Search, User } from 'lucide-react';
import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import './App.css';
import { Card } from './components/card/card';
import type { Size } from './components/common';
import Input from './components/input/input';

interface UserOption {
  id: number;
  name: string;
  email: string;
}

interface CityOption {
  id: number;
  name: string;
  country: string;
}

interface SectionProps {
  title: string;
  description: ReactNode;
  children: ReactNode;
}

interface PreviewCardProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  size?: Size;
  width?: number;
  overflowVisible?: boolean;
}

const sizes: Size[] = ['XS', 'S', 'M', 'L', 'XL'];

const sectionStyle: CSSProperties = {
  marginBottom: '48px',
};

const sectionHeaderStyle: CSSProperties = {
  marginBottom: '20px',
};

const descriptionStyle: CSSProperties = {
  maxWidth: '760px',
  margin: 0,
  color: 'var(--color-grey-heavy)',
  fontSize: '13px',
  lineHeight: 1.5,
};

const cardsStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  flexWrap: 'wrap',
  alignItems: 'flex-start',
  gap: '20px',
};

const previewStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  gap: '10px',
  boxSizing: 'border-box',
  width: '100%',
  minWidth: '240px',
  padding: '20px',
};

const labelStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  color: 'CanvasText',
  fontSize: '12px',
  fontWeight: 500,
};

const helperStyle: CSSProperties = {
  margin: 0,
  color: 'var(--color-grey-heavy)',
  fontSize: '11px',
  lineHeight: 1.4,
};

const errorStyle: CSSProperties = {
  margin: 0,
  color: 'var(--color-error)',
  fontSize: '11px',
  lineHeight: 1.4,
};

const codeStyle: CSSProperties = {
  marginInline: '4px',
  padding: '1px 4px',
  border: 'var(--border-default)',
  borderRadius: '3px',
  fontFamily: 'monospace',
  fontSize: '0.9em',
};

function Section({ title, description, children }: SectionProps) {
  return (
    <section style={sectionStyle}>
      <header style={sectionHeaderStyle}>
        <h2 style={{ margin: '0 0 4px' }}>{title}</h2>
        <p style={descriptionStyle}>{description}</p>
      </header>

      <div style={cardsStyle}>{children}</div>
    </section>
  );
}

function PreviewCard({
  title,
  subtitle,
  children,
  size = 'M',
  width = 300,
  overflowVisible = false,
}: PreviewCardProps) {
  return (
    <Card
      size={size}
      title={title}
      subtitle={subtitle}
      style={{
        width,
        overflow: overflowVisible ? 'visible' : undefined,
      }}
      contentStyle={{
        overflow: overflowVisible ? 'visible' : undefined,
      }}
    >
      <div
        style={{
          ...previewStyle,
          overflow: overflowVisible ? 'visible' : undefined,
        }}
      >
        {children}
      </div>
    </Card>
  );
}

function App() {
  /* ==========================================================================
     Basic values
     ========================================================================== */

  const [defaultValue, setDefaultValue] = useState('');
  const [sizeValues, setSizeValues] = useState<Record<Size, string>>({
    XS: '',
    S: '',
    M: '',
    L: '',
    XL: '',
  });

  /* ==========================================================================
     Type values
     ========================================================================== */

  const [textValue, setTextValue] = useState('');
  const [emailValue, setEmailValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [numberValue, setNumberValue] = useState<string | number>('');
  const [dateValue, setDateValue] = useState('');
  const [textareaValue, setTextareaValue] = useState('');

  /* ==========================================================================
     Icon values
     ========================================================================== */

  const [userValue, setUserValue] = useState('');
  const [iconEmailValue, setIconEmailValue] = useState('');
  const [locationValue, setLocationValue] = useState('');

  /* ==========================================================================
     Search values
     ========================================================================== */

  const [searchValue, setSearchValue] = useState('');
  const [searchBySize, setSearchBySize] = useState<Record<Size, string>>({
    XS: '',
    S: '',
    M: '',
    L: '',
    XL: '',
  });
  const [loadingSearchValue, setLoadingSearchValue] = useState('');
  const [lastSearch, setLastSearch] = useState<string | number>('');

  /* ==========================================================================
     Options
     ========================================================================== */

  const [selectedUserValue, setSelectedUserValue] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);

  const [selectedCityValue, setSelectedCityValue] = useState('');
  const [selectedCity, setSelectedCity] = useState<CityOption | null>(null);

  const [primitiveOptionValue, setPrimitiveOptionValue] = useState('');
  const [emptyOptionValue, setEmptyOptionValue] = useState('');

  /* ==========================================================================
     Validation and events
     ========================================================================== */

  const [requiredValue, setRequiredValue] = useState('');
  const [validationEmail, setValidationEmail] = useState('');
  const [eventValue, setEventValue] = useState('');
  const [eventMessage, setEventMessage] = useState('Sin eventos');

  const userOptions: UserOption[] = [
    {
      id: 1,
      name: 'Ana García',
      email: 'ana.garcia@example.com',
    },
    {
      id: 2,
      name: 'Carlos López',
      email: 'carlos.lopez@example.com',
    },
    {
      id: 3,
      name: 'Marta Sánchez',
      email: 'marta.sanchez@example.com',
    },
  ];

  const cityOptions: CityOption[] = [
    {
      id: 1,
      name: 'Madrid',
      country: 'España',
    },
    {
      id: 2,
      name: 'Barcelona',
      country: 'España',
    },
    {
      id: 3,
      name: 'Lisboa',
      country: 'Portugal',
    },
    {
      id: 4,
      name: 'París',
      country: 'Francia',
    },
  ];

  const filteredUsers = useMemo(() => {
    const normalizedValue = selectedUserValue.trim().toLowerCase();

    if (!normalizedValue) {
      return userOptions;
    }

    return userOptions.filter((option) => {
      return (
        option.name.toLowerCase().includes(normalizedValue) || option.email.toLowerCase().includes(normalizedValue)
      );
    });
  }, [selectedUserValue]);

  const filteredCities = useMemo(() => {
    const normalizedValue = selectedCityValue.trim().toLowerCase();

    if (!normalizedValue) {
      return cityOptions;
    }

    return cityOptions.filter((option) => {
      return (
        option.name.toLowerCase().includes(normalizedValue) || option.country.toLowerCase().includes(normalizedValue)
      );
    });
  }, [selectedCityValue]);

  const emailIsInvalid = validationEmail.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(validationEmail);

  const updateSizeValue = (size: Size, value: string | number) => {
    setSizeValues((currentValues) => ({
      ...currentValues,
      [size]: String(value),
    }));
  };

  const updateSearchSizeValue = (size: Size, value: string | number) => {
    setSearchBySize((currentValues) => ({
      ...currentValues,
      [size]: String(value),
    }));
  };

  const renderInput = () => {
    return (
      <main
        style={{
          boxSizing: 'border-box',
          width: '100%',
          minHeight: '100%',
          padding: '24px',
          overflow: 'auto',
        }}
      >
        <header style={{ marginBottom: '40px' }}>
          <p
            style={{
              margin: '0 0 6px',
              color: 'var(--color-grey-heavy)',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Components / Form controls
          </p>

          <h1 style={{ margin: '0 0 10px' }}>Input</h1>

          <p style={descriptionStyle}>
            Campo controlado para capturar texto, números, fechas, descripciones, búsquedas y selecciones. Admite cinco
            tamaños, iconos de Lucide, estados interactivos y resultados desplegables.
          </p>
        </header>

        {/* ==================================================================
            DEFAULT
        ================================================================== */}

        <Section title="Default" description="Configuración básica con tipo texto y tamaño medio.">
          <PreviewCard title="Default" subtitle='type="text" · size="M"'>
            <label style={labelStyle}>
              Nombre
              <Input value={defaultValue} onChange={setDefaultValue} placeholder="Escribe un valor" />
            </label>

            <p style={helperStyle}>Valor actual: {defaultValue || '—'}</p>
          </PreviewCard>
        </Section>

        {/* ==================================================================
            SIZES
        ================================================================== */}

        <Section
          title="Sizes"
          description="Todos los tamaños disponibles. El campo, el texto, los iconos y los controles laterales se adaptan conjuntamente."
        >
          {sizes.map((size) => (
            <PreviewCard key={size} size={size} title={`Size ${size}`} subtitle={`size="${size}"`} width={280}>
              <label style={labelStyle}>
                Campo {size}
                <Input
                  size={size}
                  value={sizeValues[size]}
                  onChange={(value) => updateSizeValue(size, value)}
                  placeholder={`Input ${size}`}
                />
              </label>

              <p style={helperStyle}>Valor: {sizeValues[size] || '—'}</p>
            </PreviewCard>
          ))}
        </Section>

        {/* ==================================================================
            TYPES
        ================================================================== */}

        <Section
          title="Types"
          description={
            <>
              Variaciones soportadas por la propiedad
              <code style={codeStyle}>type</code>.
            </>
          }
        >
          <PreviewCard title="Text" subtitle='type="text"'>
            <label style={labelStyle}>
              Nombre completo
              <Input
                type="text"
                value={textValue}
                onChange={setTextValue}
                placeholder="Nombre completo"
                autoComplete="name"
              />
            </label>
          </PreviewCard>

          <PreviewCard title="Email" subtitle='type="email"'>
            <label style={labelStyle}>
              Correo electrónico
              <Input
                type="email"
                value={emailValue}
                onChange={setEmailValue}
                placeholder="correo@example.com"
                autoComplete="email"
              />
            </label>
          </PreviewCard>

          <PreviewCard title="Password" subtitle='type="password"'>
            <label style={labelStyle}>
              Contraseña
              <Input
                type="password"
                value={passwordValue}
                onChange={setPasswordValue}
                placeholder="Contraseña"
                autoComplete="current-password"
              />
            </label>
          </PreviewCard>

          <PreviewCard title="Number" subtitle='type="number"'>
            <label style={labelStyle}>
              Cantidad
              <Input
                type="number"
                value={numberValue}
                onChange={setNumberValue}
                placeholder="0"
                min={0}
                max={100}
                step={1}
              />
            </label>

            <p style={helperStyle}>Valor numérico: {String(numberValue) || '—'}</p>
          </PreviewCard>

          <PreviewCard title="Date" subtitle='type="date"'>
            <label style={labelStyle}>
              Fecha
              <Input type="date" value={dateValue} onChange={setDateValue} />
            </label>
          </PreviewCard>

          <PreviewCard title="Textarea" subtitle='type="textarea" · rows={4}'>
            <label style={labelStyle}>
              Descripción
              <Input
                type="textarea"
                rows={4}
                value={textareaValue}
                onChange={setTextareaValue}
                placeholder="Escribe una descripción"
                maxLength={240}
              />
            </label>

            <p style={helperStyle}>{textareaValue.length}/240 caracteres</p>
          </PreviewCard>
        </Section>

        {/* ==================================================================
            ICONS
        ================================================================== */}

        <Section
          title="Icons"
          description="Los iconos se colocan a la izquierda y ajustan automáticamente su tamaño y espaciado."
        >
          <PreviewCard size="S" title="User" subtitle='icon={User} · size="S"'>
            <Input size="S" icon={User} value={userValue} onChange={setUserValue} placeholder="Usuario" />
          </PreviewCard>

          <PreviewCard title="Email" subtitle='icon={Mail} · type="email"'>
            <Input
              icon={Mail}
              type="email"
              value={iconEmailValue}
              onChange={setIconEmailValue}
              placeholder="Correo electrónico"
            />
          </PreviewCard>

          <PreviewCard size="L" title="Password" subtitle='icon={Lock} · size="L"'>
            <Input
              size="L"
              icon={Lock}
              type="password"
              value={passwordValue}
              onChange={setPasswordValue}
              placeholder="Contraseña"
            />
          </PreviewCard>

          <PreviewCard title="Number" subtitle='icon={Hash} · type="number"'>
            <Input icon={Hash} type="number" value={numberValue} onChange={setNumberValue} placeholder="Cantidad" />
          </PreviewCard>

          <PreviewCard title="Date" subtitle='icon={Calendar} · type="date"'>
            <Input icon={Calendar} type="date" value={dateValue} onChange={setDateValue} />
          </PreviewCard>

          <PreviewCard size="XL" title="Location" subtitle='icon={MapPin} · size="XL"'>
            <Input size="XL" icon={MapPin} value={locationValue} onChange={setLocationValue} placeholder="Ubicación" />
          </PreviewCard>
        </Section>

        {/* ==================================================================
            SEARCH BY SIZE
        ================================================================== */}

        <Section
          title="Search sizes"
          description="La acción de búsqueda y su icono se adaptan a cada tamaño. La búsqueda puede ejecutarse con el botón o con Enter."
        >
          {sizes.map((size) => (
            <PreviewCard
              key={size}
              size={size}
              title={`Search ${size}`}
              subtitle={`search · size="${size}"`}
              width={290}
            >
              <Input
                size={size}
                search
                value={searchBySize[size]}
                onChange={(value) => {
                  updateSearchSizeValue(size, value);
                }}
                onSearch={(value) => {
                  setLastSearch(`${size}: ${value}`);
                }}
                placeholder={`Buscar en tamaño ${size}`}
              />
            </PreviewCard>
          ))}
        </Section>

        {/* ==================================================================
            SEARCH STATES
        ================================================================== */}

        <Section title="Search states" description="Estados habituales de la acción de búsqueda.">
          <PreviewCard title="Search" subtitle="search · onSearch">
            <Input
              icon={Search}
              search
              value={searchValue}
              onChange={setSearchValue}
              onSearch={setLastSearch}
              placeholder="Buscar..."
            />

            <p style={helperStyle}>Última búsqueda: {String(lastSearch) || '—'}</p>
          </PreviewCard>

          <PreviewCard title="Loading" subtitle="search · searchLoading">
            <Input
              search
              searchLoading
              value={loadingSearchValue}
              onChange={setLoadingSearchValue}
              placeholder="Buscando..."
            />
          </PreviewCard>

          <PreviewCard title="Disabled" subtitle="search · disabled">
            <Input search disabled value="No disponible" onChange={() => undefined} />
          </PreviewCard>

          <PreviewCard title="Read only" subtitle="search · readOnly">
            <Input search readOnly value="Consulta bloqueada" onChange={() => undefined} />
          </PreviewCard>
        </Section>

        {/* ==================================================================
            OPTIONS
        ================================================================== */}

        <Section
          title="Options"
          description="Resultados desplegables con valores primitivos, objetos personalizados, filtrado y estado vacío."
        >
          <PreviewCard size="L" title="User options" subtitle="options · object values" width={360} overflowVisible>
            <Input<UserOption>
              icon={User}
              search
              value={selectedUserValue}
              onChange={(value) => {
                setSelectedUserValue(String(value));
                setSelectedUser(null);
              }}
              onSearch={setLastSearch}
              options={filteredUsers}
              getOptionLabel={(option) => (
                <span>
                  <strong>{option.name}</strong>

                  <span
                    style={{
                      display: 'block',
                      marginTop: '2px',
                      color: 'var(--color-grey-heavy)',
                      fontSize: '11px',
                    }}
                  >
                    {option.email}
                  </span>
                </span>
              )}
              getOptionValue={(option) => option.name}
              onOptionSelect={(option) => {
                setSelectedUser(option);
              }}
              emptyOptionsText="No se han encontrado usuarios"
              placeholder="Buscar un usuario"
            />

            <p style={helperStyle}>Seleccionado: {selectedUser?.name ?? '—'}</p>
          </PreviewCard>

          <PreviewCard size="L" title="City options" subtitle="options · custom rendering" width={340} overflowVisible>
            <Input<CityOption>
              icon={MapPin}
              search
              value={selectedCityValue}
              onChange={(value) => {
                setSelectedCityValue(String(value));
                setSelectedCity(null);
              }}
              options={filteredCities}
              getOptionLabel={(option) => (
                <span>
                  <strong>{option.name}</strong>

                  <span
                    style={{
                      display: 'block',
                      marginTop: '2px',
                      color: 'var(--color-grey-heavy)',
                      fontSize: '11px',
                    }}
                  >
                    {option.country}
                  </span>
                </span>
              )}
              getOptionValue={(option) => option.name}
              onOptionSelect={setSelectedCity}
              emptyOptionsText="No se han encontrado ciudades"
              placeholder="Buscar una ciudad"
            />

            <p style={helperStyle}>Seleccionada: {selectedCity?.name ?? '—'}</p>
          </PreviewCard>

          <PreviewCard title="Primitive options" subtitle="options={string[]}" overflowVisible>
            <Input
              search
              value={primitiveOptionValue}
              onChange={setPrimitiveOptionValue}
              options={['Desarrollo', 'Diseño', 'Producto', 'Soporte']}
              placeholder="Selecciona un departamento"
            />

            <p style={helperStyle}>Valor: {primitiveOptionValue || '—'}</p>
          </PreviewCard>

          <PreviewCard title="Empty options" subtitle="emptyOptionsText" overflowVisible>
            <Input
              search
              value={emptyOptionValue}
              onChange={setEmptyOptionValue}
              options={[]}
              emptyOptionsText="No hay resultados disponibles"
              placeholder="Buscar resultados"
            />
          </PreviewCard>
        </Section>

        {/* ==================================================================
            VALIDATION
        ================================================================== */}

        <Section
          title="Validation"
          description="Ejemplos de restricciones nativas y mensajes de validación controlados externamente."
        >
          <PreviewCard title="Required" subtitle="required">
            <label style={labelStyle}>
              Nombre obligatorio
              <Input
                required
                value={requiredValue}
                onChange={setRequiredValue}
                placeholder="Introduce tu nombre"
                aria-invalid={!requiredValue}
              />
            </label>

            {!requiredValue && <p style={errorStyle}>Este campo es obligatorio.</p>}
          </PreviewCard>

          <PreviewCard title="Email validation" subtitle='type="email" · aria-invalid'>
            <label style={labelStyle}>
              Correo electrónico
              <Input
                type="email"
                value={validationEmail}
                onChange={setValidationEmail}
                placeholder="correo@example.com"
                aria-invalid={emailIsInvalid}
              />
            </label>

            {emailIsInvalid ? (
              <p style={errorStyle}>Introduce una dirección de correo válida.</p>
            ) : (
              <p style={helperStyle}>Ejemplo: usuario@dominio.com</p>
            )}
          </PreviewCard>

          <PreviewCard title="Number limits" subtitle="min · max · step">
            <Input
              type="number"
              value={numberValue}
              onChange={setNumberValue}
              min={0}
              max={100}
              step={5}
              placeholder="0–100"
            />

            <p style={helperStyle}>Rango permitido: 0–100, en pasos de 5.</p>
          </PreviewCard>

          <PreviewCard title="Maximum length" subtitle="maxLength={20}">
            <Input value={textValue} onChange={setTextValue} maxLength={20} placeholder="Máximo 20 caracteres" />

            <p style={helperStyle}>{textValue.length}/20 caracteres</p>
          </PreviewCard>
        </Section>

        {/* ==================================================================
            STATES
        ================================================================== */}

        <Section title="States" description="Estados habituales del control.">
          <PreviewCard title="Empty" subtitle="value empty">
            <Input value="" onChange={() => undefined} placeholder="Campo vacío" />
          </PreviewCard>

          <PreviewCard title="With value" subtitle="controlled value">
            <Input value="Contenido de ejemplo" onChange={() => undefined} />
          </PreviewCard>

          <PreviewCard title="Read only" subtitle="readOnly">
            <Input value="Valor no editable" onChange={() => undefined} readOnly />
          </PreviewCard>

          <PreviewCard title="Disabled" subtitle="disabled">
            <Input value="Campo deshabilitado" onChange={() => undefined} disabled />
          </PreviewCard>

          <PreviewCard title="Disabled empty" subtitle="disabled · placeholder">
            <Input value="" onChange={() => undefined} disabled placeholder="Campo deshabilitado" />
          </PreviewCard>

          <PreviewCard title="Textarea disabled" subtitle='type="textarea" · disabled'>
            <Input type="textarea" value="Descripción no editable" onChange={() => undefined} disabled />
          </PreviewCard>
        </Section>

        {/* ==================================================================
            EVENTS
        ================================================================== */}

        <Section title="Events" description="Demostración de eventos nativos conservados por el componente.">
          <PreviewCard title="Focus and keyboard" subtitle="onFocus · onBlur · onKeyDown" width={340}>
            <Input
              value={eventValue}
              onChange={(value) => {
                setEventValue(String(value));
                setEventMessage(`Cambio: ${value}`);
              }}
              onFocus={() => {
                setEventMessage('Input enfocado');
              }}
              onBlur={() => {
                setEventMessage('Input sin foco');
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  setEventMessage('Tecla Enter pulsada');
                }

                if (event.key === 'Escape') {
                  setEventMessage('Tecla Escape pulsada');
                }
              }}
              placeholder="Interactúa con el campo"
            />

            <p aria-live="polite" style={helperStyle}>
              Evento: {eventMessage}
            </p>
          </PreviewCard>

          <PreviewCard title="Search event" subtitle="onSearch · Enter" width={340}>
            <Input
              search
              value={searchValue}
              onChange={setSearchValue}
              onSearch={(value) => {
                setEventMessage(`Búsqueda ejecutada: ${value}`);
              }}
              placeholder="Pulsa Enter o el icono"
            />

            <p aria-live="polite" style={helperStyle}>
              {eventMessage}
            </p>
          </PreviewCard>
        </Section>
      </main>
    );
  };

  return <div className="app">{renderInput()}</div>;
}

export default App;
