import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { MainLayout } from "./layouts/main/MainLayout";
import TenantGuard from "./layouts/tenant/TenantGuard";
import AdminShell from "./layouts/admin/AdminShell";
import AppErrorPage from "../features/AppErrorPage";
import RootRedirect from "../routes/RootLanding";
import LoginPage from "../features/login/LoginPage";
import RegisterPage from "../features/register/RegisterPage";
import AdminRedirect from "../features/admin/AdminRedirect";
import ForgotPasswordPage from "../features/ForgotPassword";
import ResetPasswordPage from "../features/ResetPasswordPage";
import { HomePage } from "../features/home/pages/HomePage";
import { RoomsPage } from "../features/rooms/pages/RoomsPage";
import { RoomDetailPage } from "../features/rooms/pages/RoomDetailPage";
import { BookingPage } from "../features/booking/BookingPage";
import { TermsPage } from "../features/terms/TermsPage";
import { PrivacyPage } from "../features/privacyPage/PrivacyPage";
import ProtectedRoute from "../components/ProtectedRoute";
import DashboardSection from "../features/admin/sections/DashboardSection";
import RoomsSection from "../features/admin/sections/RoomsSection";
import ReservationsSection from "../features/admin/sections/ReservationSecition";
import { theme } from "../theme/theme";
import DateI18nProvider from "../features/providers/DateI18nProvider";
import MembersSection from "../features/admin/sections/MembersSection";
import EmailLogsSection from "../features/admin/sections/EmailLogSection";
import { ErrorBoundary } from "@sentry/react";
import { AuthProvider } from "./providers/AuthContext";

// ✅ NUEVO
import SuperAdminInvitesPage from "../features/superadmin/SuperAdminInvitesPage";
import SuperAdminRoute from "../components/SuperAdminRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    errorElement: <AppErrorPage />,
    children: [
      { index: true, element: <RootRedirect /> },
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
      { path: "admin", element: <AdminRedirect /> },

      // ✅ SUPERADMIN (GLOBAL)
    {
  path: "superadmin/invites",
  element: (
    <SuperAdminRoute>
      <SuperAdminInvitesPage />
    </SuperAdminRoute>
  ),
},

      { path: "forgot-password", element: <ForgotPasswordPage /> },
      { path: "reset-password", element: <ResetPasswordPage /> },

      {
        path: ":hostelSlug",
        element: <TenantGuard />,
        children: [
          {
            element: <MainLayout />,
            children: [
              { index: true, element: <HomePage /> },
              { path: "rooms", element: <RoomsPage /> },
              { path: "rooms/:id", element: <RoomDetailPage /> },
              { path: "booking/:roomId", element: <BookingPage /> },
              { path: "terms", element: <TermsPage /> },
              { path: "privacy", element: <PrivacyPage /> },

              {
                path: "admin",
                element: (
                  <ProtectedRoute>
                    <AdminShell />
                  </ProtectedRoute>
                ),
                children: [
                  { index: true, element: <DashboardSection /> },
                  { path: "rooms", element: <RoomsSection /> },
                  { path: "reservations", element: <ReservationsSection /> },
                  { path: "members", element: <MembersSection /> },
                  { path: "emails", element: <EmailLogsSection /> },
                ],
              },
            ],
          },
        ],
      },

      { path: "*", element: <AppErrorPage /> },
    ],
  },
]);

function App() {
  return (
    <ErrorBoundary fallback={<div style={{ padding: 16 }}>Algo salió mal.</div>}>
      <AuthProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <DateI18nProvider>
            <RouterProvider router={router} />
          </DateI18nProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;