import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { theme } from "./theme/theme";
import { RoomDetailPage } from "./pages/rooms/RoomDetailPage";
import { RoomsPage } from "./pages/rooms/RoomsPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { HomePage } from "./pages/home/HomePage";
import { BookingPage } from "./pages/booking/BookingPage";
import { MainLayout } from "./layouts/main/MainLayout";
import { TermsPage } from "./pages/terms/TermsPage";
import { PrivacyPage } from "./pages/privacyPage/PrivacyPage";
import TenantGuard from "./layouts/tenant/TenantGuard";
import DateI18nProvider from "./providers/DateI18nProvider";
import AppErrorPage from "./pages/AppErrorPage";
import RootRedirect from "./routes/RootLanding";
import LoginPage from "./pages/login/LoginPage";
import RegisterPage from "./pages/register/RegisterPage";
import AdminRedirect from "./pages/admin/AdminRedirect";
import AdminPage from "./pages/admin/AdminPage";
export const router = createBrowserRouter([
  {
    path: "/",
    errorElement: <AppErrorPage />,
    children: [
      // ✅ GLOBAL
      { index: true, element: <RootRedirect /> },
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
      { path: "admin", element: <AdminRedirect /> },

      // ✅ TENANT
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
                    <AdminPage />
                  </ProtectedRoute>
                ),
              },
            ],
          },
        ],
      },

      // ✅ 404 catch-all
      { path: "*", element: <AppErrorPage /> },
    ],
  },
]);
function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <DateI18nProvider>
        <RouterProvider router={router} />
      </DateI18nProvider>
    </ThemeProvider>
  );
}

export default App;