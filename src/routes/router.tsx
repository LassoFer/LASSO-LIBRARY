import { MousePointerClick, PanelLeft, TextCursorInput } from 'lucide-react';
import { useState } from 'react';
import { Navigate, Outlet, createBrowserRouter, useLocation, useNavigate } from 'react-router-dom';

import type { SidebarMenuItem, SidebarMode } from '../components/sidebarmenu/SidebarMenu';
import SidebarMenu from '../components/sidebarmenu/SidebarMenu';

import { ButtonPage } from '../pages/ButtonPage/ButtonPage';
import { InputPage } from '../pages/InputPage/InputPage';
import { SidebarPage } from '../pages/SidebarPage/SidebarPage';

/* ==========================================================================
   Sidebar items
   ========================================================================== */

const sidebarItems: SidebarMenuItem[] = [
  {
    id: 'input',
    text: 'Input',
    url: '/input',
    icon: TextCursorInput,
  },
  {
    id: 'button',
    text: 'Button',
    url: '/button',
    icon: MousePointerClick,
  },
  {
    id: 'sidebar',
    text: 'SidebarMenu',
    url: '/sidebar',
    icon: PanelLeft,
  },
];

/* ==========================================================================
   Layout
   ========================================================================== */

function ComponentsLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState<SidebarMode>('expanded');

  return (
    <SidebarMenu
      items={sidebarItems}
      size="L"
      mode={mode}
      position="left"
      currentPath={location.pathname}
      onModeChange={setMode}
      onNavigate={(url) => navigate(url)}
      ariaLabel="Componentes"
      brand={'Lasso Library'}
    >
      <Outlet />
    </SidebarMenu>
  );
}

/* ==========================================================================
   Router
   ========================================================================== */

export const router = createBrowserRouter([
  {
    path: '/',
    element: <ComponentsLayout />,
    children: [
      {
        index: true,
        element: <Navigate replace to="/input" />,
      },
      {
        path: 'input',
        element: <InputPage />,
      },
      {
        path: 'button',
        element: <ButtonPage />,
      },
      {
        path: 'sidebar',
        element: <SidebarPage />,
      },
    ],
  },
]);
