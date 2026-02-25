import React, { useMemo, useState } from "react";
import {
  AppBar,
  Box,
  Button,
  Container,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import BookIcon from "@mui/icons-material/Book";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import LogoutIcon from "@mui/icons-material/Logout";
import PublicIcon from "@mui/icons-material/Public";
import MenuIcon from "@mui/icons-material/Menu";
import { signOut } from "firebase/auth";
import { NavLink, Outlet, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { auth } from "../../services/firebase";


export const AdminLayout = () => {
  const [open, setOpen] = useState(false); // hover desktop
  const [mobileOpen, setMobileOpen] = useState(false); // drawer mobile

  const isMobile = useMediaQuery("(max-width:900px)");
  const drawerWidth = open ? 240 : 76;

  const navigate = useNavigate();
  const { hostelSlug } = useParams<{ hostelSlug: string }>();
  const { user } = useAuth();

  const menu = useMemo(
    () => [
      { to: "", label: "Dashboard", icon: <DashboardIcon /> },           // index
      { to: "reservations", label: "Reservations", icon: <BookIcon /> },
      { to: "rooms", label: "Rooms", icon: <MeetingRoomIcon /> },
    ],
    []
  );

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login", { replace: true });
  };

  const handleViewSite = () => {
    if (!hostelSlug) return;
    navigate(`/${hostelSlug}`);
  };

  const DrawerContent = (
    <List sx={{ pt: 1 }}>
      {menu.map((item) => (
        <ListItemButton
          key={item.label}
          component={NavLink}
          to={item.to}
          end={item.to === ""} // para que "Dashboard" solo sea active en /admin (no en /admin/rooms)
          onClick={() => setMobileOpen(false)}
          sx={{
            mx: 1,
            borderRadius: 2,
            "&.active": { backgroundColor: "rgba(115, 2, 2, 0.10)" },
            "&.active:hover": { backgroundColor: "rgba(115, 2, 2, 0.16)" },
          }}
        >
          <ListItemIcon sx={{ minWidth: 42 }}>{item.icon}</ListItemIcon>
          {(open || isMobile) && <ListItemText primary={item.label} />}
        </ListItemButton>
      ))}
    </List>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* TOP BAR */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          backgroundColor: "white",
          borderBottom: "1px solid #eee",
          color: "black",
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton edge="start" onClick={() => setMobileOpen(true)} sx={{ mr: 1 }}>
              <MenuIcon />
            </IconButton>
          )}

          <Typography sx={{ fontWeight: 800, letterSpacing: 1 }}>
            REDSTAYS
          </Typography>

          <Box sx={{ flexGrow: 1 }} />

          <Button
            onClick={handleViewSite}
            startIcon={<PublicIcon />}
            variant="outlined"
            sx={{ mr: 2 }}
            disabled={!hostelSlug}
          >
            Ver sitio
          </Button>

          <Typography sx={{ color: "text.secondary", mr: 2, display: { xs: "none", md: "block" } }}>
            {user?.email ?? ""}
          </Typography>

          <Button onClick={handleLogout} startIcon={<LogoutIcon />} variant="contained">
            Salir
          </Button>
        </Toolbar>
      </AppBar>

      {/* SIDEBAR */}
      {isMobile ? (
        <Drawer
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          variant="temporary"
          ModalProps={{ keepMounted: true }}
          PaperProps={{ sx: { width: 260 } }}
        >
          {DrawerContent}
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            transition: "width 0.25s",
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              overflowX: "hidden",
              transition: "width 0.25s",
              boxSizing: "border-box",
              borderRight: "1px solid #eee",
              pt: 8,
            },
          }}
        >
          {DrawerContent}
        </Drawer>
      )}

      {/* CONTENT */}
      <Box component="main" sx={{ flexGrow: 1, pt: 10 }}>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
};