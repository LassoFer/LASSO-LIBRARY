import { useState } from 'react';

import { Card } from '../../components/card/card';
import Select from '../../components/select/select';
import { Section } from '../../storybook/components/Section/Section';
import styles from './SelectPage.module.css';

const countries = [
  { value: 'spain', label: 'España' },
  { value: 'france', label: 'Francia' },
  { value: 'italy', label: 'Italia' },
  { value: 'germany', label: 'Alemania' },
  { value: 'portugal', label: 'Portugal' },
  { value: 'uk', label: 'Reino Unido' },
];

const users = [
  { value: 1, label: 'Gonzalo' },
  { value: 2, label: 'Ana' },
  { value: 3, label: 'Carlos' },
  { value: 4, label: 'Laura' },
  { value: 5, label: 'Miguel' },
];

const projectOptions = [
  { value: 'project-1', label: 'Proyecto BIM 01' },
  { value: 'project-2', label: 'Proyecto BIM 02' },
  { value: 'project-3', label: 'Proyecto BIM 03' },
  { value: 'project-4', label: 'Proyecto BIM 04' },
];

export default function SelectPage() {
  const [selectedCountry, setSelectedCountry] = useState<string | number>('spain');
  const [selectedUsers, setSelectedUsers] = useState<Array<string | number>>([1, 3]);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Components / Select</p>

        <h1 className={styles.title}>Select</h1>

        <p className={styles.description}>
          Componente select con diferentes modos de selección, búsqueda y selección múltiple.
        </p>
      </header>

      {/* DEFAULT */}

      <Section title="Default" description="Select básico para seleccionar una única opción.">
        <Card>
          <Select options={countries} placeholder="Selecciona un país" />
        </Card>
      </Section>

      {/* DEFAULT VALUE */}

      <Section title="Default value" description="Select con una opción seleccionada inicialmente.">
        <Card>
          <Select options={countries} defaultValue="spain" placeholder="Selecciona un país" />
        </Card>
      </Section>

      {/* CONTROLLED */}

      <Section title="Controlled" description="Select controlado mediante value y onChange.">
        <Card>
          <Select
            options={countries}
            value={selectedCountry}
            onChange={(value) => {
              if (typeof value === 'string' || typeof value === 'number') {
                setSelectedCountry(value);
              }
            }}
          />

          <p>
            Valor seleccionado: <strong>{selectedCountry}</strong>
          </p>
        </Card>
      </Section>

      {/* SEARCH */}

      <Section title="Search" description="Select con búsqueda de opciones.">
        <Card>
          <Select mode="search" options={countries} placeholder="Busca un país" />
        </Card>
      </Section>

      {/* MULTI */}

      <Section title="Multi" description="Permite seleccionar varias opciones.">
        <Card>
          <Select mode="multi" options={users} defaultValue={[1, 3]} placeholder="Selecciona usuarios" />
        </Card>
      </Section>

      {/* SEARCH + MULTI */}

      <Section title="Search + Multi" description="Combinación de búsqueda y selección múltiple.">
        <Card>
          <Select
            mode={['search', 'multi']}
            options={users}
            value={selectedUsers}
            onChange={(value) => {
              if (Array.isArray(value)) {
                setSelectedUsers(value);
              }
            }}
            placeholder="Selecciona usuarios"
          />
        </Card>
      </Section>

      {/* TREE */}

      <Section title="Tree" description="Select preparado para representar opciones jerárquicas.">
        <Card>
          <Select mode="tree" options={projectOptions} placeholder="Selecciona un proyecto" />
        </Card>
      </Section>

      {/* SEARCH + TREE */}

      <Section title="Search + Tree" description="Árbol de opciones con búsqueda.">
        <Card>
          <Select mode={['search', 'tree']} options={projectOptions} placeholder="Busca un proyecto" />
        </Card>
      </Section>

      {/* TREE + MULTI */}

      <Section title="Tree + Multi" description="Árbol de opciones con selección múltiple.">
        <Card>
          <Select mode={['tree', 'multi']} options={projectOptions} placeholder="Selecciona proyectos" />
        </Card>
      </Section>

      {/* ALL MODES */}

      <Section title="Search + Tree + Multi" description="Combinación de todos los modos disponibles.">
        <Card>
          <Select mode={['search', 'tree', 'multi']} options={projectOptions} placeholder="Selecciona proyectos" />
        </Card>
      </Section>

      {/* DISABLED */}

      <Section title="Disabled" description="Select deshabilitado.">
        <Card>
          <Select options={countries} defaultValue="spain" disabled />
        </Card>
      </Section>

      {/* SIZES */}

      <Section
        title="Sizes"
        description="El componente está disponible en los diferentes tamaños del sistema de diseño."
      >
        <Card>
          <div className={styles.examples}>
            <Select size="S" options={countries} placeholder="Small" />

            <Select size="M" options={countries} placeholder="Medium" />

            <Select size="L" options={countries} placeholder="Large" />
          </div>
        </Card>
      </Section>
    </main>
  );
}
