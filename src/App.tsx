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
  { path: "/", element: <RootRedirect /> },
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { path: ":hostelSlug", element: <HomePage /> },
      { path: ":hostelSlug/rooms", element: <RoomsPage /> },
      { path: ":hostelSlug/rooms/:id", element: <RoomDetailPage /> },
      { path: ":hostelSlug/booking/:roomId", element: <BookingPage /> },
      { path: "register", element: <RegisterPage /> },
      // auth tenant
      { path: ":hostelSlug/login", element: <LoginPage /> },

      // admin tenant
      {
        path: ":hostelSlug/admin",
        element: (
          <ProtectedRoute>
            <AdminPage />
          </ProtectedRoute>
        ),
      },

      // compat
      { path: "admin", element: <AdminRedirect /> },
      { path: "login", element: <Navigate to="/selina/login" replace /> },
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