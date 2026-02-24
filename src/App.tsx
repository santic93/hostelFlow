import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { theme } from "./theme/theme";
import { MainLayout } from "./layouts/MainLayout";
import { HomePage } from "./features/home/HomePage";

import { RoomDetailPage } from "./features/rooms/RoomDetailPage";
import { RoomsPage } from "./features/rooms/RoomsPage";
import { BookingPage } from "./features/booking/BookingPage";
import AdminPage from "./features/admin/AdminPage";
import LoginPage from "./features/login/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRedirect from "./features/admin/AdminRedirect";
import RegisterPage from "./pages/RegisterPage";
import RootRedirect from "./routes/RootRedirect";

const router = createBrowserRouter([
  // ✅ root público (sin tenant)
  { path: "/", element: <RootRedirect /> },
  { path: "/register", element: <RegisterPage /> },

  // ✅ compat /admin global
  { path: "/admin", element: <AdminRedirect /> },

  // ✅ tenant site (todo lo que depende de :hostelSlug)
  {
    path: "/:hostelSlug",
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "rooms", element: <RoomsPage /> },
      { path: "rooms/:id", element: <RoomDetailPage /> },
      { path: "booking/:roomId", element: <BookingPage /> },

      { path: "login", element: <LoginPage /> },

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
]);

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}

export default App;