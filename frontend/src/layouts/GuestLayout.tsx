import { Navigate, Outlet, useLocation } from "react-router";

import { useAuth } from "../providers/useAuth";

export default function GuestLayout() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return null;
  }

  if (user) {
    const returnTo = new URLSearchParams(location.search).get('returnTo');
    const destination = returnTo?.startsWith('/invite/')
      ? returnTo
      : '/collections';
    return <Navigate to={destination} replace />;
  }

  return <Outlet />;
}
