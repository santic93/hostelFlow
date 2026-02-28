import { Outlet, useNavigate, useParams, useLocation } from "react-router-dom";
import { useMemo, useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Container,
  useMediaQuery,
  Divider,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import BookIcon from "@mui/icons-material/Book";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import PublicIcon from "@mui/icons-material/Public";
import GroupIcon from "@mui/icons-material/Group"; // ✅ NEW
import { signOut } from "firebase/auth";
import { auth } from "../../../services/firebase";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../providers/AuthContext";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
type MenuKey = "dashboard" | "reservations" | "rooms" | "members" | "emails";

export default function AdminShell() {
  const { t } = useTranslation();
  const [desktopOpen, setDesktopOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width:900px)");

  const drawerWidth = desktopOpen ? 240 : 76;

  const navigate = useNavigate();
  const { hostelSlug } = useParams<{ hostelSlug: string }>();
  const { user } = useAuth();
  const location = useLocation();

  const menu = useMemo(
    () => [
      { key: "dashboard" as const, icon: <DashboardIcon />, to: "" },
      { key: "reservations" as const, icon: <BookIcon />, to: "reservations" },
      { key: "rooms" as const, icon: <MeetingRoomIcon />, to: "rooms" },
      { key: "members" as const, icon: <GroupIcon />, to: "members" }, // ✅ NEW
      { key: "emails" as const, icon: <MailOutlineIcon />, to: "emails" },
    ],
    []
  );

  const labelFor = (key: MenuKey) => {
    if (key === "dashboard") return t("admin.shell.menu.dashboard");
    if (key === "reservations") return t("admin.shell.menu.reservations");
    if (key === "rooms") return t("admin.shell.menu.rooms");
    if (key === "emails") return "Email Logs";
    return t("admin.shell.menu.members", "Members");
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/", { replace: true });
  };

  const handleViewSite = () => {
    if (!hostelSlug) return;
    navigate(`/${hostelSlug}`);
  };

  const goTo = (to: string) => {
    if (!hostelSlug) return;
    navigate(`/${hostelSlug}/admin${to ? `/${to}` : ""}`);
    setMobileOpen(false);
  };

  const DrawerContent = (
    <Box sx={{ pt: 1 }}>
      <List>
        {menu.map((item) => {
          const fullPath = `/${hostelSlug}/admin${item.to ? `/${item.to}` : ""}`;
          const selected = location.pathname === fullPath;

          return (
            <ListItemButton
              key={item.key}
              selected={selected}
              onClick={() => goTo(item.to)}
              sx={{
                mx: 1,
                borderRadius: 2,
                "&.Mui-selected": { backgroundColor: "rgba(115, 2, 2, 0.10)" },
                "&.Mui-selected:hover": { backgroundColor: "rgba(115, 2, 2, 0.16)" },
              }}
              onMouseEnter={() => !isMobile && setDesktopOpen(true)}
            >
              <ListItemIcon sx={{ minWidth: 44 }}>{item.icon}</ListItemIcon>
              {(desktopOpen || isMobile) && <ListItemText primary={labelFor(item.key)} />}
            </ListItemButton>
          );
        })}
      </List>

      <Divider sx={{ my: 1 }} />

      <List>
        <ListItemButton onClick={handleViewSite} sx={{ mx: 1, borderRadius: 2 }}>
          <ListItemIcon sx={{ minWidth: 44 }}>
            <PublicIcon />
          </ListItemIcon>
          {(desktopOpen || isMobile) && <ListItemText primary={t("admin.shell.viewSite")} />}
        </ListItemButton>

        <ListItemButton onClick={handleLogout} sx={{ mx: 1, borderRadius: 2 }}>
          <ListItemIcon sx={{ minWidth: 44 }}>
            <LogoutIcon />
          </ListItemIcon>
          {(desktopOpen || isMobile) && <ListItemText primary={t("admin.shell.logout")} />}
        </ListItemButton>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100dvh", backgroundColor: "background.default" }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          borderBottom: "1px solid rgba(0,0,0,0.08)",
          backgroundColor: "rgba(255,255,255,0.75)",
          backdropFilter: "blur(10px)",
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ minHeight: 64, px: { xs: 1, sm: 0 }, gap: 1 }}>
            {isMobile && (
              <IconButton onClick={() => setMobileOpen(true)} sx={{ mr: 1 }}>
                <MenuIcon />
              </IconButton>
            )}

            <Typography sx={{ fontWeight: 900, letterSpacing: 0.4 }}>
              {t("admin.shell.brand")}
            </Typography>

            <Box sx={{ flexGrow: 1 }} />

            <Box sx={{ display: { xs: "none", sm: "flex" }, gap: 1, alignItems: "center" }}>
              <Typography sx={{ fontSize: 13, opacity: 0.8 }}>{user?.email ?? ""}</Typography>
              <Button variant="outlined" onClick={handleViewSite} disabled={!hostelSlug}>
                {t("admin.shell.viewSite")}
              </Button>
              <Button variant="contained" onClick={handleLogout}>
                {t("admin.shell.logout")}
              </Button>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Spacer */}
      <Toolbar />

      {/* Drawer */}
      {isMobile ? (
        <Drawer
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          variant="temporary"
          ModalProps={{ keepMounted: true }}
          PaperProps={{ sx: { width: 280 } }}
        >
          <Toolbar />
          {DrawerContent}
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          onMouseEnter={() => setDesktopOpen(true)}
          onMouseLeave={() => setDesktopOpen(false)}
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              overflowX: "hidden",
              boxSizing: "border-box",
              borderRight: "1px solid rgba(0,0,0,0.08)",
              transition: "width 0.25s",
            },
          }}
        >
          <Toolbar />
          {DrawerContent}
        </Drawer>
      )}

      {/* Content */}
      <Box component="main" sx={{ flex: 1, width: "100%", overflowX: "hidden" }}>
        <Container sx={{ py: { xs: 2, sm: 3 } }}>
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
}