import { BoxSelect, MousePointerClick, PanelLeft, TextCursorInput } from 'lucide-react';
import { Navigate, Outlet, createBrowserRouter, useLocation, useNavigate } from 'react-router-dom';

import type { SidebarMenuItem } from '../components/sidebarmenu/SidebarMenu';
import SidebarMenu from '../components/sidebarmenu/SidebarMenu';

import { ButtonPage } from '../pages/ButtonPage/ButtonPage';
import { InputPage } from '../pages/InputPage/InputPage';
import SelectPage from '../pages/SelectPage/SelectPage';
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
    id: 'select',
    text: 'Select',
    url: '/select',
    icon: BoxSelect,
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

  return (
    <SidebarMenu
      items={sidebarItems}
      size="L"
      position="left"
      currentPath={location.pathname}
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
        path: 'select',
        element: <SelectPage />,
      },
      {
        path: 'sidebar',
        element: <SidebarPage />,
      },
    ],
  },
]);
