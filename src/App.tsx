import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { theme } from "./theme/theme";
import { RoomDetailPage } from "./pages/rooms/RoomDetailPage";
import { RoomsPage } from "./pages/rooms/RoomsPage";
import AdminPage from "./pages/admin/AdminPage";
import LoginPage from "./pages/login/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRedirect from "./pages/admin/AdminRedirect";
import RootRedirect from "./routes/RootRedirect";
import RegisterPage from "./pages/register/RegisterPage";
import { HomePage } from "./pages/home/HomePage";
import { BookingPage } from "./pages/booking/BookingPage";
import { MainLayout } from "./layouts/main/MainLayout";

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