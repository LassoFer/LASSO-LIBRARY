// storybook/components/Section.tsx

import type { ReactNode } from 'react';

import styles from './Section.module.css';

interface SectionProps {
  title: string;
  description: ReactNode;
  children: ReactNode;
}

export function Section({ title, description, children }: SectionProps) {
  return (
    <section className={styles.section}>
      <header className={styles.header}>
        <h2 className={styles.title}>{title}</h2>

        <div className={styles.description}>{description}</div>
      </header>

      <div className={styles.content}>{children}</div>
    </section>
  );
}
