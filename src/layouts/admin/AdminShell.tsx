import { Outlet, useNavigate, useParams, Link as RouterLink, useLocation } from "react-router-dom";
import { useMemo, useState } from "react";
import {
  AppBar, Toolbar, Typography, Box, Button, Drawer, List, ListItemButton, ListItemIcon,
  ListItemText, IconButton, Container, useMediaQuery
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import BookIcon from "@mui/icons-material/Book";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import PublicIcon from "@mui/icons-material/Public";
import { signOut } from "firebase/auth";
import { auth } from "../../services/firebase";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";


type MenuKey = "dashboard" | "reservations" | "rooms";

export default function AdminShell() {
  const { t } = useTranslation();

  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width:900px)");
  const drawerWidth = open ? 240 : 76;

  const navigate = useNavigate();
  const { hostelSlug } = useParams<{ hostelSlug: string }>();
  const { user } = useAuth();
  const location = useLocation();

  const menu = useMemo(
    () =>
      [
        { key: "dashboard" as const, icon: <DashboardIcon />, to: "" },
        { key: "reservations" as const, icon: <BookIcon />, to: "reservations" },
        { key: "rooms" as const, icon: <MeetingRoomIcon />, to: "rooms" },
      ] as const,
    []
  );

  const labelFor = (key: MenuKey) => {
    if (key === "dashboard") return t("admin.shell.menu.dashboard");
    if (key === "reservations") return t("admin.shell.menu.reservations");
    return t("admin.shell.menu.rooms");
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/", { replace: true });
  };

  const handleViewSite = () => {
    if (!hostelSlug) return;
    navigate(`/${hostelSlug}`);
  };

  const DrawerContent = (
    <List sx={{ pt: 1 }}>
      {menu.map((item) => {
        const fullPath = `/${hostelSlug}/admin${item.to ? `/${item.to}` : ""}`;
        const selected = location.pathname === fullPath;

        return (
          <ListItemButton
            key={item.key}
            component={RouterLink}
            to={item.to} // rutas hijas: "", "rooms", "reservations"
            selected={selected}
            onClick={() => setMobileOpen(false)}
            sx={{
              mx: 1,
              borderRadius: 2,
              "&.Mui-selected": { backgroundColor: "rgba(115, 2, 2, 0.10)" },
              "&.Mui-selected:hover": { backgroundColor: "rgba(115, 2, 2, 0.16)" },
            }}
          >
            <ListItemIcon sx={{ minWidth: 42 }}>{item.icon}</ListItemIcon>
            {(open || isMobile) && <ListItemText primary={labelFor(item.key)} />}
          </ListItemButton>
        );
      })}
    </List>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
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
            {t("admin.shell.brand")}
          </Typography>

          <Box sx={{ flexGrow: 1 }} />

          <Button
            onClick={handleViewSite}
            startIcon={<PublicIcon />}
            variant="outlined"
            sx={{ mr: 2 }}
            disabled={!hostelSlug}
          >
            {t("admin.shell.viewSite")}
          </Button>

          <Typography sx={{ color: "text.secondary", mr: 2, display: { xs: "none", md: "block" } }}>
            {user?.email ?? ""}
          </Typography>

          <Button onClick={handleLogout} startIcon={<LogoutIcon />} variant="contained">
            {t("admin.shell.logout")}
          </Button>
        </Toolbar>
      </AppBar>

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
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              overflowX: "hidden",
              boxSizing: "border-box",
              borderRight: "1px solid #eee",
              pt: 8,
              transition: "width 0.25s",
            },
            transition: "width 0.25s",
          }}
        >
          {DrawerContent}
        </Drawer>
      )}

      <Box component="main" sx={{ flexGrow: 1, pt: 10 }}>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
}