import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { theme } from "./theme/theme";
import { MainLayout } from "./layouts/MainLayout";
import { HomePage } from "./features/home/HomePage";

import { RoomDetailPage } from "./features/rooms/RoomDetailPage";
import { RoomsPage } from "./features/rooms/RoomsPage";
import { BookingPage } from "./features/booking/BookingPage";
import AdminPage from "./features/admin/AdminPage";


const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },

      { path: "rooms", element: <RoomsPage /> },

      { path: "rooms/:id", element: <RoomDetailPage /> },

      { path: "booking", element: <BookingPage /> },
        { path: "admin", element: <AdminPage /> },
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