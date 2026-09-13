import CssBaseline from '@mui/material/CssBaseline';
import { createTheme, ThemeProvider } from '@mui/material/styles';
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
    hydrateFallbackElement: <div />,
    children: [
      {
        path: '/', 
        element: <HomePage />,
        loader: homeLoader,
      }
    ]
  }
]);

const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#242424',
      paper: 'linear-gradient(to bottom, #5b4d90 0%, #1B8065 50%, #0B5C44 100%)',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: 'linear-gradient(to bottom, #4DB89A 0%, #1B8065 50%, #0B5C44 100%)',
          backgroundAttachment: 'fixed',
          minHeight: '100vh',
        },
        pre: {
          color: '#000000',
        },
      },
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  </StrictMode>,
)
