import { Navigate, Outlet } from "react-router";

import { useAuth } from "../providers/useAuth";

export default function GuestLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (user) {
    return <Navigate to="/collections" replace />;
  }

  return <Outlet />;
}
