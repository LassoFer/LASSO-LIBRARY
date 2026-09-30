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
        <Card
          size="M"
          title="Country selection"
          subtitle="Selección única · Opciones básicas"
          className={styles.card}
          contentClassName={styles.cardContent}
        >
          <div>
            <Select options={countries} placeholder="Selecciona un país" />
          </div>
        </Card>
      </Section>

      {/* DEFAULT VALUE */}

      <Section title="Default value" description="Select con una opción seleccionada inicialmente.">
        <Card
          size="M"
          title="Preselected country"
          subtitle="Selección inicial · Valor por defecto"
          className={styles.card}
          contentClassName={styles.cardContent}
        >
          <div>
            <Select options={countries} defaultValue="spain" placeholder="Selecciona un país" />
          </div>
        </Card>
      </Section>

      {/* CONTROLLED */}

      <Section title="Controlled" description="Select controlado mediante value y onChange.">
        <Card
          size="M"
          title="Controlled selection"
          subtitle="Selección controlada · Estado externo"
          className={styles.card}
          contentClassName={styles.cardContent}
        >
          <div>
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
          </div>
        </Card>
      </Section>

      {/* SEARCH */}

      <Section title="Search" description="Select con búsqueda de opciones.">
        <Card
          size="M"
          title="Country search"
          subtitle="Selección única · Búsqueda de opciones"
          className={styles.card}
          contentClassName={styles.cardContent}
        >
          <div>
            <Select mode="search" options={countries} placeholder="Busca un país" />
          </div>
        </Card>
      </Section>

      {/* MULTI */}

      <Section title="Multi" description="Permite seleccionar varias opciones.">
        <Card
          size="M"
          title="User selection"
          subtitle="Selección múltiple · Varias opciones"
          className={styles.card}
          contentClassName={styles.cardContent}
        >
          <div>
            <Select mode="multi" options={users} defaultValue={[1, 3]} placeholder="Selecciona usuarios" />
          </div>
        </Card>
      </Section>

      {/* SEARCH + MULTI */}

      <Section title="Search + Multi" description="Combinación de búsqueda y selección múltiple.">
        <Card
          size="M"
          title="User search"
          subtitle="Selección múltiple · Búsqueda de usuarios"
          className={styles.card}
          contentClassName={styles.cardContent}
        >
          <div>
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
          </div>
        </Card>
      </Section>

      {/* TREE */}

      <Section title="Tree" description="Select preparado para representar opciones jerárquicas.">
        <Card
          size="M"
          title="Project selection"
          subtitle="Selección jerárquica · Proyectos"
          className={styles.card}
          contentClassName={styles.cardContent}
        >
          <div>
            <Select mode="tree" options={projectOptions} placeholder="Selecciona un proyecto" />
          </div>
        </Card>
      </Section>

      {/* SEARCH + TREE */}

      <Section title="Search + Tree" description="Árbol de opciones con búsqueda.">
        <Card
          size="M"
          title="Project search"
          subtitle="Selección jerárquica · Búsqueda de proyectos"
          className={styles.card}
          contentClassName={styles.cardContent}
        >
          <div>
            <Select mode={['search', 'tree']} options={projectOptions} placeholder="Busca un proyecto" />
          </div>
        </Card>
      </Section>

      {/* TREE + MULTI */}

      <Section title="Tree + Multi" description="Árbol de opciones con selección múltiple.">
        <Card
          size="M"
          title="Project selection"
          subtitle="Selección jerárquica · Selección múltiple"
          className={styles.card}
          contentClassName={styles.cardContent}
        >
          <div>
            <Select mode={['tree', 'multi']} options={projectOptions} placeholder="Selecciona proyectos" />
          </div>
        </Card>
      </Section>

      {/* ALL MODES */}

      <Section title="Search + Tree + Multi" description="Combinación de todos los modos disponibles.">
        <Card
          size="M"
          title="Advanced project selection"
          subtitle="Búsqueda · Jerarquía · Selección múltiple"
          className={styles.card}
          contentClassName={styles.cardContent}
        >
          <div>
            <Select mode={['search', 'tree', 'multi']} options={projectOptions} placeholder="Selecciona proyectos" />
          </div>
        </Card>
      </Section>

      {/* DISABLED */}

      <Section title="Disabled" description="Select deshabilitado.">
        <Card
          size="M"
          title="Disabled select"
          subtitle="Estado deshabilitado · Valor seleccionado"
          className={styles.card}
          contentClassName={styles.cardContent}
        >
          <div>
            <Select options={countries} defaultValue="spain" disabled />
          </div>
        </Card>
      </Section>

      {/* SIZES */}

      <Section
        title="Sizes"
        description="El componente está disponible en los diferentes tamaños del sistema de diseño."
      >
        <Card
          size="M"
          title="Select sizes"
          subtitle="XS · S · M · L · XL"
          className={styles.card}
          contentClassName={styles.cardContent}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Select size="XS" options={countries} placeholder="Extra Small" />
            <Select size="S" options={countries} placeholder="Small" />
            <Select size="M" options={countries} placeholder="Medium" />
            <Select size="L" options={countries} placeholder="Large" />
            <Select size="XL" options={countries} placeholder="Extra Large" />
          </div>
        </Card>
      </Section>
    </main>
  );
}
