import { BarChart3, Home, LayoutDashboard, Package, Settings, Users } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { Card } from '../../components/card/card';
import type { Size } from '../../components/common';
import type { SidebarMenuItem, SidebarMode, SidebarPosition } from '../../components/sidebarmenu/SidebarMenu';
import SidebarMenu from '../../components/sidebarmenu/SidebarMenu';

import { Section } from '../../storybook/components/Section/Section';
import styles from './SidebarPage.module.css';

const S: Size[] = ['XS', 'S', 'M', 'L', 'XL'];

const positions: SidebarPosition[] = ['left', 'right'];

/* ==========================================================================
   Data
   ========================================================================== */

const menuItems: SidebarMenuItem[] = [
  {
    id: 'dashboard',
    text: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    id: 'home',
    text: 'Inicio',
    url: '/home',
    icon: Home,
  },
  {
    id: 'analytics',
    text: 'Analytics',
    url: '/analytics',
    icon: BarChart3,
  },
  {
    id: 'products',
    text: 'Productos',
    url: '/products',
    icon: Package,
  },
  {
    id: 'users',
    text: 'Usuarios',
    url: '/users',
    icon: Users,
  },
  {
    id: 'settings',
    text: 'Configuración',
    url: '/settings',
    icon: Settings,
  },
];

const childrenItems: SidebarMenuItem[] = [
  {
    id: 'dashboard',
    text: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    id: 'management',
    text: 'Gestión',
    icon: Package,
    children: [
      {
        id: 'products',
        text: 'Productos',
        url: '/management/products',
        icon: Package,
      },
      {
        id: 'users',
        text: 'Usuarios',
        url: '/management/users',
        icon: Users,
      },
    ],
  },
  {
    id: 'reports',
    text: 'Informes',
    icon: BarChart3,
    children: [
      {
        id: 'analytics',
        text: 'Analytics',
        url: '/reports/analytics',
        icon: BarChart3,
      },
      {
        id: 'settings',
        text: 'Configuración',
        url: '/reports/settings',
        icon: Settings,
      },
    ],
  },
];

/* ==========================================================================
   Preview
   ========================================================================== */

type MenuPreviewProps = {
  items?: SidebarMenuItem[];
  size?: Size;
  defaultMode?: SidebarMode;
  position?: SidebarPosition;
  initialPath?: string;
  brand?: ReactNode;
  showOnHover?: boolean;
};

function MenuPreview({
  items = menuItems,
  size = 'M',
  defaultMode = 'expanded',
  position = 'left',
  initialPath = '/dashboard',
  brand,
  showOnHover,
}: MenuPreviewProps) {
  const [currentPath, setCurrentPath] = useState(initialPath);

  return (
    <div className={styles.preview}>
      <SidebarMenu
        items={items}
        size={size}
        position={position}
        currentPath={currentPath}
        onNavigate={(url) => setCurrentPath(url)}
        brand={brand}
        defaultMode={defaultMode}
        showOnHover={showOnHover}
      >
        <div className={styles.previewContent}>
          <span className={styles.previewLabel}>Ruta activa</span>

          <code className={styles.previewValue}>{currentPath}</code>

          <span className={styles.previewLabel}>Modo</span>
        </div>
      </SidebarMenu>
    </div>
  );
}

/* ==========================================================================
   Page
   ========================================================================== */

export function SidebarPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Components / SidebarMenu</p>

        <h1 className={styles.title}>SidebarMenu</h1>

        <p className={styles.description}>
          Navegación adaptable con distintos tamaños, orientaciones y niveles de jerarquía.
        </p>
      </header>

      {/* ==================================================================
          Default
      ================================================================== */}

      <Section title="Default" description="Configuración principal con cambio interactivo entre expanded y collapsed.">
        <Card
          size="L"
          title="Default"
          subtitle="Navegación estándar · Modo interactivo"
          className={styles.mainCard}
          contentClassName={styles.cardContent}
        >
          <MenuPreview />
        </Card>
      </Section>

      {/* ==================================================================
          S
      ================================================================== */}

      <Section title="Sizes" description="Escalas disponibles para diferentes niveles de densidad.">
        {S.map((size) => (
          <Card
            key={size}
            size={size}
            title={`Size ${size}`}
            subtitle={`Escala ${size} · Proporciones adaptadas`}
            className={styles.sizeCard}
            contentClassName={styles.cardContent}
          >
            <MenuPreview size={size} defaultMode="expanded" />
          </Card>
        ))}
      </Section>

      {/* ==================================================================
          Children
      ================================================================== */}

      <Section title="Children" description="Agrupación jerárquica mediante elementos secundarios.">
        <Card
          size="M"
          title="Nested"
          subtitle="Jerarquía · Elementos secundarios"
          className={styles.mainCard}
          contentClassName={styles.cardContent}
        >
          <MenuPreview items={childrenItems} initialPath="/management/products" />
        </Card>
      </Section>

      {/* ==================================================================
          Positions
      ================================================================== */}

      <Section title="Positions" description="Ubicaciones disponibles dentro del área de navegación.">
        {positions.map((position) => (
          <Card
            key={position}
            size="M"
            title={position}
            subtitle={`Posición ${position} · Modo interactivo`}
            className={styles.positionCard}
            contentClassName={styles.cardContent}
          >
            <MenuPreview position={position} defaultMode="expanded" />
          </Card>
        ))}
      </Section>

      {/* ==================================================================
          hover
      ================================================================== */}

      <Section title="On Hover" description="Interaccion on hover activa">
        {positions.map((position) => (
          <Card
            key={position}
            size="M"
            title={position}
            subtitle={`Posición ${position} on hover · Modo interactivo`}
            className={styles.positionCard}
            contentClassName={styles.cardContent}
          >
            <MenuPreview position={position} defaultMode="collapsed" showOnHover={true} />
          </Card>
        ))}
      </Section>
    </main>
  );
}
