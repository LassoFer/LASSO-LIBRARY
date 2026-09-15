import { Settings } from 'lucide-react';

import { Card } from '../../components/card/card';
import type { Size } from '../../components/common';
import { Section } from '../../storybook/components/Section/Section';

import Button from '../../components/button/button';
import styles from './ButtonPage.module.css';

const S: Size[] = ['XS', 'S', 'M', 'L', 'XL'];

export function ButtonPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Components / Button</p>

        <h1 className={styles.title}>Button</h1>

        <p className={styles.description}>
          Acción interactiva con variantes visuales, cinco tamaños, estados de interacción e iconos.
        </p>
      </header>

      <Section title="Default" description="Configuración básica del botón.">
        <Card size="M" title="Default" subtitle="Configuración base · Tamaño medio" className={styles.card}>
          <div className={styles.cardContent}>
            <Button>Button</Button>
          </div>
        </Card>
      </Section>

      <Section title="Sizes" description="Todos los tamaños disponibles.">
        {S.map((size) => (
          <Card
            key={size}
            size={size}
            title={`Size ${size}`}
            subtitle={`Escala ${size} · Proporciones adaptadas`}
            className={styles.sizeCard}
          >
            <div className={styles.cardContent}>
              <Button size={size}>Button {size}</Button>
            </div>
          </Card>
        ))}
      </Section>

      <Section title="Variants" description="Variantes semánticas disponibles.">
        <Card size="M" title="Ghost" subtitle="Acción sutil · Bajo énfasis visual" className={styles.card}>
          <div className={styles.cardContent}>
            <Button mode="ghost">Ghost</Button>
          </div>
        </Card>

        <Card size="M" title="Danger" subtitle="Acción destructiva · Alta relevancia" className={styles.card}>
          <div className={styles.cardContent}>
            <Button mode="danger">Danger</Button>
          </div>
        </Card>

        <Card size="M" title="Success" subtitle="Acción positiva · Confirmación" className={styles.card}>
          <div className={styles.cardContent}>
            <Button mode="success">Success</Button>
          </div>
        </Card>

        <Card size="M" title="Warning" subtitle="Acción preventiva · Atención requerida" className={styles.card}>
          <div className={styles.cardContent}>
            <Button mode="warning">Warning</Button>
          </div>
        </Card>

        <Card size="M" title="Info" subtitle="Acción informativa · Contexto adicional" className={styles.card}>
          <div className={styles.cardContent}>
            <Button mode="info">Info</Button>
          </div>
        </Card>

        <Card size="M" title="Icon" subtitle="Acción abreviada · Contexto visual" className={styles.card}>
          <div className={styles.cardContent}>
            <Button mode="icon">
              <Settings />
            </Button>
          </div>
        </Card>
      </Section>

      <Section title="Icon S" description="La superficie y el icono se adaptan al tamaño del botón.">
        {S.map((size) => (
          <Card
            key={size}
            size={size}
            title={`Icon ${size}`}
            subtitle={`Icono ${size} · Área interactiva adaptada`}
            className={styles.iconSizeCard}
          >
            <div className={styles.cardContent}>
              <Button mode="icon" size={size} aria-label={`Configuración ${size}`}>
                <Settings />
              </Button>
            </div>
          </Card>
        ))}
      </Section>

      <Section title="States" description="Estados habituales del control.">
        <Card size="M" title="Disabled" subtitle="Estado no disponible · Sin interacción" className={styles.card}>
          <div className={styles.cardContent}>
            <Button disabled>Disabled</Button>
          </div>
        </Card>

        <Card
          size="M"
          title="Danger disabled"
          subtitle="Acción destructiva · Estado no disponible"
          className={styles.card}
        >
          <div className={styles.cardContent}>
            <Button mode="danger" disabled>
              Disabled
            </Button>
          </div>
        </Card>

        <Card size="M" title="Icon disabled" subtitle="Acción compacta · Estado no disponible" className={styles.card}>
          <div className={styles.cardContent}>
            <Button mode="icon" disabled aria-label="Configuración deshabilitada">
              <Settings />
            </Button>
          </div>
        </Card>
      </Section>
    </main>
  );
}
