import '@fontsource/saira/400.css';
import '@fontsource/saira/700.css';

import CssBaseline from '@mui/material/CssBaseline';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";

import AppLayout from './layouts/AppLayout.tsx';
import GuestLayout from './layouts/GuestLayout.tsx';
import RootLayout from './layouts/RootLayout.tsx';
import homeLoader from './loaders/homeLoader.ts';
import ChangeEmailPage from './pages/ChangeEmailPage.tsx';
import CheckEmailPage from './pages/CheckEmailPage.tsx';
import CollectionListPage from './pages/CollectionListPage.tsx';
import ElevateDemoPage from './pages/ElevateDemoPage.tsx';
import HomePage from './pages/HomePage.tsx';
import LoginPage from './pages/LoginPage.tsx';
import NotFoundPage from './pages/NotFoundPage.tsx';
import RegisterPage from './pages/RegisterPage.tsx';
import ResetPasswordPage from './pages/ResetPasswordPage.tsx';
import SettingsPage from './pages/SettingsPage.tsx';
import UpdateProfilePage from './pages/UpdateProfilePage.tsx';
import VerifiedPage from './pages/VerifiedPage.tsx';
import VerifiedProtectedPage from './pages/VerifiedProtectedPage.tsx';
import { AuthProvider } from './providers/AuthContextProvider.tsx';

const router = createBrowserRouter([
  {
    Component: RootLayout,
    hydrateFallbackElement: <div />,
    children: [
      {
        Component: GuestLayout,
        hydrateFallbackElement: <div />,
        children: [
          {
            path: '/',
            element: <HomePage />,
            loader: homeLoader,
          },
          {
            path: '/register',
            element: <RegisterPage />,
          },
          {
            path: '/check-email',
            element: <CheckEmailPage />,
          },
          {
            path: '/verify',
            element: <VerifiedPage />,
          },
          {
            path: '/login',
            element: <LoginPage />,
          },
        ],
      },
      {
        path: '*',
        element: <NotFoundPage />,
      }
    ]
  },
  {
    Component: AppLayout,
    children: [
      {
        path: '/collections',
        element: <CollectionListPage />,
      },
      {
        path: '/settings',
        element: <SettingsPage />,
      },
      {
        path: '/settings/update-profile',
        element: <UpdateProfilePage />,
      },
      {
        path: '/settings/change-email',
        element: <ChangeEmailPage />,
      },
      {
        path: '/settings/reset-password',
        element: <ResetPasswordPage />, 
      },
      {
        path: '/settings/elevate-demo',
        element: <ElevateDemoPage />,
      },
      {
        path: '/settings/verify',
        element: <VerifiedProtectedPage />,
      },
    ],
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
      paper: 'radial-gradient(circle at 50% 0%, #5B6248 0%, #43473A 50%, #242426 100%)',
    },
  },
  typography: {
    fontFamily: 'Saira, Arial, sans-serif',
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: 'radial-gradient(circle at 50% 0%, #5B6248 0%, #43473A 50%, #242426 100%)',
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
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
