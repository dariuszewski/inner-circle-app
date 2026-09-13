import CssBaseline from '@mui/material/CssBaseline';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";

import RootLayout from './layouts/RootLayout.tsx';
import homeLoader from './loaders/homeLoader.ts';
import HomePage from './pages/HomePage.tsx';

const router = createBrowserRouter([
  {
    Component: RootLayout,
    children: [
      {
        path: '/', 
        element: <HomePage />,
        loader: homeLoader,
      }
    ]
  }
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CssBaseline />
    <RouterProvider router={router} />
  </StrictMode>,
)
