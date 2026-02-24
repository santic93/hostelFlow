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

const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/selina" replace /> },
  {

    path: "/",
    element: <MainLayout />,
    children: [
      // 🌍 Web pública por slug
      { path: ":hostelSlug", element: <HomePage /> },
      { path: ":hostelSlug/rooms", element: <RoomsPage /> },
      { path: ":hostelSlug/rooms/:id", element: <RoomDetailPage /> },
      { path: ":hostelSlug/booking/:roomId", element: <BookingPage /> },

      // 🔐 Admin
      {
        path: "admin",
        element: (
          <ProtectedRoute>
            <AdminPage />
          </ProtectedRoute>
        ),
      },

      { path: "login", element: <LoginPage /> },
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