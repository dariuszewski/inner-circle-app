import '@fontsource/saira/400.css';
import '@fontsource/saira/700.css';

import CssBaseline from '@mui/material/CssBaseline';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";

import RootLayout from './layouts/RootLayout.tsx';
import homeLoader from './loaders/homeLoader.ts';
import HomePage from './pages/HomePage.tsx';
import NotFoundPage from './pages/NotFoundPage.tsx';

const router = createBrowserRouter([
  {
    Component: RootLayout,
    hydrateFallbackElement: <div />,
    children: [
      {
        path: '/', 
        element: <HomePage />,
        loader: homeLoader,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      }
    ]
  }
]);

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#F9D589',
      light: '#FFE8A8',
      dark: '#C9A64F',
      contrastText: '#24352F',
    },
    background: {
      default: '#242424',
      paper: 'linear-gradient(to bottom, #5b4d90 0%, #1B8065 50%, #0B5C44 100%)',
    },
  },
  typography: {
    fontFamily: 'Saira, Arial, sans-serif',
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
    MuiAlert: {
      styleOverrides: {
        message: {
          color: '#FFFFFF',
        },
        icon: {
          color: '#FFFFFF',
        },
        action: {
          color: '#FFFFFF',
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
