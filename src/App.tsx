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
import { AdminLayout } from "./layouts/admin/AdminLayout";
import AdminDashboardPage from "./pages/admin/AdminBoardPage";
import AdminReservationsPage from "./pages/admin/AdminReservationsPage";
import AdminRoomsPage from "./pages/admin/AdminRoomPage";
import TenantGuard from "./layouts/tenant/TenantGuard";
import DateI18nProvider from "./providers/DateI18nProvider";

const router = createBrowserRouter([
  {
    path: "/:hostelSlug",
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
                <AdminLayout />
              </ProtectedRoute>
            ),
            children: [
              { index: true, element: <AdminDashboardPage /> },
              { path: "reservations", element: <AdminReservationsPage /> },
              { path: "rooms", element: <AdminRoomsPage /> },
            ],
          },
        ],
      },
    ],
  }
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