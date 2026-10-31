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
import CheckEmailPage from './pages/auth/CheckEmailPage.tsx';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage.tsx';
import LoginPage from './pages/auth/LoginPage.tsx';
import RegisterPage from './pages/auth/RegisterPage.tsx';
import ResetPasswordPage from './pages/auth/ResetPasswordPage.tsx';
import CollectionListPage from './pages/CollectionListPage.tsx';
import CollectionPage from './pages/CollectionPage.tsx';
import HomePage from './pages/HomePage.tsx';
import InvitePage from './pages/InvitePage.tsx';
import NotFoundPage from './pages/NotFoundPage.tsx';
import ChangeEmailPage from './pages/settings/ChangeEmailPage.tsx';
import ElevateDemoPage from './pages/settings/ElevateDemoPage.tsx';
import SettingsPage from './pages/settings/SettingsPage.tsx';
import UpdateProfilePage from './pages/settings/UpdateProfilePage.tsx';
import VerifyEmailLinkPage from './pages/verification/VerifyEmailLinkPage.tsx';
import { AuthProvider } from './providers/AuthContextProvider.tsx';

const router = createBrowserRouter([
  {
    Component: RootLayout,
    hydrateFallbackElement: <div />,
    children: [
      {
        path: '/invite/:token',
        element: <InvitePage />,
      },
      {
        // reachable both logged in and out, so it sits outside GuestLayout
        path: '/reset-password',
        element: <ResetPasswordPage />,
      },
      {
        // Email links must work for guests and authenticated users.
        path: '/verify',
        element: <VerifyEmailLinkPage />,
      },
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
            path: '/login',
            element: <LoginPage />,
          },
          {
            path: '/forgot-password',
            element: <ForgotPasswordPage />,
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
        path: '/collections/:collectionId',
        element: <CollectionPage />,
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
        element: <ForgotPasswordPage />,
      },
      {
        path: '/settings/elevate-demo',
        element: <ElevateDemoPage />,
      },
      {
        path: '/settings/verify',
        element: <VerifyEmailLinkPage />,
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
    MuiDialog: {
      styleOverrides: {
        paper: ({ theme }) => ({
          background: theme.palette.background.paper,
          opacity: 1,
        }),
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
