// routes/router.tsx

import { Navigate, createBrowserRouter } from 'react-router-dom';
import { ButtonPage } from '../pages/ButtonPage/ButtonPage';
import { InputPage } from '../pages/InputPage/InputPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate replace to="/input" />,
  },
  {
    path: '/input',
    element: <InputPage />,
  },
  {
    path: '/button',
    element: <ButtonPage />,
  },
]);
