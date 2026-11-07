import '@fontsource/saira/400.css';
import '@fontsource/saira/700.css';

import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { StrictMode } from 'react';
import { lazy,Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";

import AnimatedLogo from './components/AnimatedLogo.tsx';
import AppLayout from './layouts/AppLayout.tsx';
import GuestLayout from './layouts/GuestLayout.tsx';
import RootLayout from './layouts/RootLayout.tsx';
import homeLoader from './loaders/homeLoader.ts';
import CollectionListPage from './pages/CollectionListPage.tsx';
import CollectionPage from './pages/CollectionPage.tsx';
import HomePage from './pages/HomePage.tsx';
import InvitePage from './pages/InvitePage.tsx';
import NotFoundPage from './pages/NotFoundPage.tsx';
import { AuthProvider } from './providers/AuthContextProvider.tsx';

// auth routes loaded when needed
const CheckEmailPage = lazy(() => import('./pages/auth/CheckEmailPage.tsx'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage.tsx'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage.tsx'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage.tsx'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage.tsx'));
const VerifyEmailLinkPage = lazy(() => import('./pages/verification/VerifyEmailLinkPage.tsx'));

// settings routes loaded when needed
const ChangeEmailPage = lazy(() => import('./pages/settings/ChangeEmailPage.tsx'));
const ElevateDemoPage = lazy(() => import('./pages/settings/ElevateDemoPage.tsx'));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage.tsx'));
const UpdateProfilePage = lazy(() => import('./pages/settings/UpdateProfilePage.tsx'));

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
        <Suspense
          fallback={
            <Box
              sx={{
                minHeight: '100dvh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AnimatedLogo />
            </Box>
          }
        >
          <RouterProvider router={router} />
        </Suspense>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>
)
