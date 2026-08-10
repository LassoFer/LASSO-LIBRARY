import { Calendar, Hash, Lock, Mail, MapPin, Search, User } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Card } from '../../components/card/card';
import type { Size } from '../../components/common';
import Input from '../../components/input/input';

import { Section } from '../../storybook/components/Section/Section';
import styles from './InputPage.module.css';

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

const sizes: Size[] = ['XS', 'S', 'M', 'L', 'XL'];

export function InputPage() {
  /* ==========================================================================
     Default
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
     Types
     ========================================================================== */

  const [textValue, setTextValue] = useState('');
  const [emailValue, setEmailValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [numberValue, setNumberValue] = useState<string | number>('');
  const [dateValue, setDateValue] = useState('');
  const [textareaValue, setTextareaValue] = useState('');

  /* ==========================================================================
     Icons
     ========================================================================== */

  const [userValue, setUserValue] = useState('');
  const [iconEmailValue, setIconEmailValue] = useState('');
  const [locationValue, setLocationValue] = useState('');

  /* ==========================================================================
     Search
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
     Events
     ========================================================================== */

  const [eventValue, setEventValue] = useState('');
  const [eventMessage, setEventMessage] = useState('Sin eventos');

  /* ==========================================================================
     Data
     ========================================================================== */

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

  /* ==========================================================================
     Derived values
     ========================================================================== */

  const filteredUsers = useMemo(() => {
    const value = selectedUserValue.trim().toLowerCase();

    if (!value) {
      return userOptions;
    }

    return userOptions.filter(
      (option) => option.name.toLowerCase().includes(value) || option.email.toLowerCase().includes(value),
    );
  }, [selectedUserValue]);

  const filteredCities = useMemo(() => {
    const value = selectedCityValue.trim().toLowerCase();

    if (!value) {
      return cityOptions;
    }

    return cityOptions.filter(
      (option) => option.name.toLowerCase().includes(value) || option.country.toLowerCase().includes(value),
    );
  }, [selectedCityValue]);

  /* ==========================================================================
     Handlers
     ========================================================================== */

  const updateSizeValue = (size: Size, value: string | number) => {
    setSizeValues((current) => ({
      ...current,
      [size]: String(value),
    }));
  };

  const updateSearchSizeValue = (size: Size, value: string | number) => {
    setSearchBySize((current) => ({
      ...current,
      [size]: String(value),
    }));
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Components / Input</p>

        <h1 className={styles.title}>Input</h1>

        <p className={styles.description}>
          Componente de entrada adaptable con distintos tamaños, formatos, iconos, búsqueda, selección de opciones y
          estados de interacción.
        </p>
      </header>

      {/* ==================================================================
          Default
      ================================================================== */}

      <Section title="Default" description="Configuración esencial del componente.">
        <Card size="M" title="Default" subtitle="Entrada estándar · Tamaño medio" className={styles.card}>
          <div className={styles.cardContent}>
            <Input value={defaultValue} onChange={setDefaultValue} placeholder="Escribe un valor" />
          </div>
        </Card>
      </Section>

      {/* ==================================================================
          Sizes
      ================================================================== */}

      <Section title="Sizes" description="Escalas disponibles para diferentes niveles de densidad.">
        {sizes.map((size) => (
          <Card
            key={size}
            size={size}
            title={`Size ${size}`}
            subtitle={`Escala ${size} · Proporciones adaptadas`}
            className={styles.sizeCard}
          >
            <div className={styles.cardContent}>
              <Input
                size={size}
                value={sizeValues[size]}
                onChange={(value) => updateSizeValue(size, value)}
                placeholder={`Input ${size}`}
              />
            </div>
          </Card>
        ))}
      </Section>

      {/* ==================================================================
          Types
      ================================================================== */}

      <Section
        title="Types"
        description={
          <>
            Formatos disponibles mediante la propiedad <code className={styles.code}>type</code>.
          </>
        }
      >
        <Card size="M" title="Text" subtitle="Texto libre · Entrada convencional" className={styles.card}>
          <div className={styles.cardContent}>
            <Input type="text" value={textValue} onChange={setTextValue} placeholder="Texto" />
          </div>
        </Card>

        <Card size="M" title="Email" subtitle="Dirección electrónica · Formato específico" className={styles.card}>
          <div className={styles.cardContent}>
            <Input type="email" value={emailValue} onChange={setEmailValue} placeholder="correo@example.com" />
          </div>
        </Card>

        <Card size="M" title="Password" subtitle="Contenido protegido · Visualización oculta" className={styles.card}>
          <div className={styles.cardContent}>
            <Input type="password" value={passwordValue} onChange={setPasswordValue} placeholder="Contraseña" />
          </div>
        </Card>

        <Card size="M" title="Number" subtitle="Valor numérico · Entrada especializada" className={styles.card}>
          <div className={styles.cardContent}>
            <Input type="number" value={numberValue} onChange={setNumberValue} placeholder="0" />
          </div>
        </Card>

        <Card size="M" title="Date" subtitle="Fecha · Selección temporal" className={styles.card}>
          <div className={styles.cardContent}>
            <Input type="date" value={dateValue} onChange={setDateValue} />
          </div>
        </Card>

        <Card size="M" title="Textarea" subtitle="Contenido extenso · Entrada multilínea" className={styles.card}>
          <div className={styles.cardContent}>
            <Input
              type="textarea"
              rows={4}
              value={textareaValue}
              onChange={setTextareaValue}
              placeholder="Escribe un texto"
            />
          </div>
        </Card>
      </Section>

      {/* ==================================================================
          Icons
      ================================================================== */}

      <Section title="Icons" description="Iconos contextuales para reforzar visualmente el propósito de la entrada.">
        <Card size="M" title="User" subtitle="Identidad · Referencia de usuario" className={styles.card}>
          <div className={styles.cardContent}>
            <Input icon={User} value={userValue} onChange={setUserValue} placeholder="Usuario" />
          </div>
        </Card>

        <Card size="M" title="Email" subtitle="Contacto · Dirección electrónica" className={styles.card}>
          <div className={styles.cardContent}>
            <Input
              icon={Mail}
              type="email"
              value={iconEmailValue}
              onChange={setIconEmailValue}
              placeholder="Correo electrónico"
            />
          </div>
        </Card>

        <Card size="M" title="Password" subtitle="Seguridad · Contenido protegido" className={styles.card}>
          <div className={styles.cardContent}>
            <Input
              icon={Lock}
              type="password"
              value={passwordValue}
              onChange={setPasswordValue}
              placeholder="Contraseña"
            />
          </div>
        </Card>

        <Card size="M" title="Number" subtitle="Cantidad · Valor numérico" className={styles.card}>
          <div className={styles.cardContent}>
            <Input icon={Hash} type="number" value={numberValue} onChange={setNumberValue} />
          </div>
        </Card>

        <Card size="M" title="Date" subtitle="Calendario · Selección temporal" className={styles.card}>
          <div className={styles.cardContent}>
            <Input icon={Calendar} type="date" value={dateValue} onChange={setDateValue} />
          </div>
        </Card>

        <Card size="M" title="Location" subtitle="Ubicación · Referencia geográfica" className={styles.card}>
          <div className={styles.cardContent}>
            <Input icon={MapPin} value={locationValue} onChange={setLocationValue} placeholder="Ubicación" />
          </div>
        </Card>
      </Section>

      {/* ==================================================================
          Search sizes
      ================================================================== */}

      <Section title="Search sizes" description="Variaciones de búsqueda disponibles en todas las escalas.">
        {sizes.map((size) => (
          <Card
            key={size}
            size={size}
            title={`Search ${size}`}
            subtitle={`Búsqueda ${size} · Escala adaptada`}
            className={styles.searchSizeCard}
          >
            <div className={styles.cardContent}>
              <Input
                size={size}
                search
                value={searchBySize[size]}
                onChange={(value) => updateSearchSizeValue(size, value)}
                onSearch={(value) => setLastSearch(`${size}: ${value}`)}
                placeholder={`Buscar ${size}`}
              />
            </div>
          </Card>
        ))}
      </Section>

      {/* ==================================================================
          Search states
      ================================================================== */}

      <Section title="Search states" description="Estados disponibles durante una interacción de búsqueda.">
        <Card size="M" title="Search" subtitle="Búsqueda activa · Acción disponible" className={styles.card}>
          <div className={styles.cardContent}>
            <Input
              icon={Search}
              search
              value={searchValue}
              onChange={setSearchValue}
              onSearch={setLastSearch}
              placeholder="Buscar..."
            />
          </div>
        </Card>

        <Card size="M" title="Loading" subtitle="Consulta en curso · Espera de resultados" className={styles.card}>
          <div className={styles.cardContent}>
            <Input
              search
              searchLoading
              value={loadingSearchValue}
              onChange={setLoadingSearchValue}
              placeholder="Buscando..."
            />
          </div>
        </Card>

        <Card size="M" title="Disabled" subtitle="Búsqueda no disponible · Sin interacción" className={styles.card}>
          <div className={styles.cardContent}>
            <Input search disabled value="No disponible" onChange={() => undefined} />
          </div>
        </Card>

        <Card size="M" title="Read only" subtitle="Contenido visible · Edición restringida" className={styles.card}>
          <div className={styles.cardContent}>
            <Input search readOnly value="Consulta bloqueada" onChange={() => undefined} />
          </div>
        </Card>
      </Section>

      {/* ==================================================================
          Options
      ================================================================== */}

      <Section title="Options" description="Resultados contextuales con filtrado y selección.">
        <Card
          size="M"
          title="Users"
          subtitle="Resultados personalizados · Selección de usuario"
          className={`${styles.card} ${styles.userOptionsCard} ${styles.overflowVisible}`}
          contentClassName={styles.overflowVisible}
        >
          <div className={`${styles.cardContent} ${styles.overflowVisible}`}>
            <Input<UserOption>
              icon={User}
              search
              value={selectedUserValue}
              onChange={(value) => {
                setSelectedUserValue(String(value));
                setSelectedUser(null);
              }}
              options={filteredUsers}
              getOptionLabel={(option) => (
                <span className={styles.optionContent}>
                  <strong>{option.name}</strong>

                  <span className={styles.optionSecondary}>{option.email}</span>
                </span>
              )}
              getOptionValue={(option) => option.name}
              onOptionSelect={setSelectedUser}
              placeholder="Buscar usuario"
            />
          </div>
        </Card>

        <Card
          size="M"
          title="Cities"
          subtitle="Resultados personalizados · Selección geográfica"
          className={`${styles.card} ${styles.cityOptionsCard} ${styles.overflowVisible}`}
          contentClassName={styles.overflowVisible}
        >
          <div className={`${styles.cardContent} ${styles.overflowVisible}`}>
            <Input<CityOption>
              icon={MapPin}
              search
              value={selectedCityValue}
              onChange={(value) => {
                setSelectedCityValue(String(value));
                setSelectedCity(null);
              }}
              options={filteredCities}
              getOptionLabel={(option) => option.name}
              getOptionValue={(option) => option.name}
              onOptionSelect={setSelectedCity}
              placeholder="Buscar ciudad"
            />
          </div>
        </Card>

        <Card
          size="M"
          title="Primitive options"
          subtitle="Opciones simples · Selección directa"
          className={`${styles.card} ${styles.overflowVisible}`}
          contentClassName={styles.overflowVisible}
        >
          <div className={`${styles.cardContent} ${styles.overflowVisible}`}>
            <Input
              search
              value={primitiveOptionValue}
              onChange={setPrimitiveOptionValue}
              options={['Desarrollo', 'Diseño', 'Producto', 'Soporte']}
              placeholder="Selecciona una opción"
            />
          </div>
        </Card>

        <Card
          size="M"
          title="Empty options"
          subtitle="Sin coincidencias · Estado vacío"
          className={`${styles.card} ${styles.overflowVisible}`}
          contentClassName={styles.overflowVisible}
        >
          <div className={`${styles.cardContent} ${styles.overflowVisible}`}>
            <Input
              search
              value={emptyOptionValue}
              onChange={setEmptyOptionValue}
              options={[]}
              emptyOptionsText="No hay resultados disponibles"
              placeholder="Buscar"
            />
          </div>
        </Card>
      </Section>

      {/* ==================================================================
          States
      ================================================================== */}

      <Section title="States" description="Estados principales de disponibilidad y edición.">
        <Card size="M" title="Empty" subtitle="Sin contenido · Disponible para entrada" className={styles.card}>
          <div className={styles.cardContent}>
            <Input value="" onChange={() => undefined} placeholder="Campo vacío" />
          </div>
        </Card>

        <Card size="M" title="Value" subtitle="Contenido definido · Valor controlado" className={styles.card}>
          <div className={styles.cardContent}>
            <Input value="Contenido de ejemplo" onChange={() => undefined} />
          </div>
        </Card>

        <Card size="M" title="Read only" subtitle="Contenido visible · Edición restringida" className={styles.card}>
          <div className={styles.cardContent}>
            <Input value="Valor no editable" onChange={() => undefined} readOnly />
          </div>
        </Card>

        <Card size="M" title="Disabled" subtitle="Estado no disponible · Sin interacción" className={styles.card}>
          <div className={styles.cardContent}>
            <Input value="Campo deshabilitado" onChange={() => undefined} disabled />
          </div>
        </Card>
      </Section>

      {/* ==================================================================
          Events
      ================================================================== */}

      <Section title="Events" description="Respuesta del componente ante foco, teclado y cambios de valor.">
        <Card
          size="M"
          title="Focus and keyboard"
          subtitle="Interacción avanzada · Foco y teclado"
          className={`${styles.card} ${styles.eventCard}`}
        >
          <div className={styles.cardContent}>
            <Input
              value={eventValue}
              onChange={(value) => {
                setEventValue(String(value));
                setEventMessage(`Cambio: ${value}`);
              }}
              onFocus={() => setEventMessage('Input enfocado')}
              onBlur={() => setEventMessage('Input sin foco')}
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

            <p aria-live="polite" className={styles.helper}>
              Evento: {eventMessage}
            </p>
          </div>
        </Card>
      </Section>
    </main>
  );
}
