import { useMemo, useState } from "react";
import {
  AppBar,
  Box,
  Button,
  Container,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Toolbar,
  Typography,
  Stack,
  Divider,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { Link as RouterLink, Outlet, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import LanguageSwitcher from "../../components/LanguageSwitcher";
import { useTranslation } from "react-i18next";

export const MainLayout = () => {
  const { user, role, hostelSlug } = useAuth();
  const { hostelSlug: slugFromUrl } = useParams<{ hostelSlug: string }>();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  if (!slugFromUrl) return null;

  const base = `/${slugFromUrl}`;

  const links = useMemo(
    () => [
      { label: t("nav.rooms"), to: `${base}/rooms` },
      { label: t("nav.contact"), to: `${base}#contact` },
      { label: t("nav.book"), to: `${base}#book` },
    ],
    [t, base]
  );

  const adminLink =
    user && role === "admin" && hostelSlug
      ? { label: `${t("nav.admin")} / ${hostelSlug}`, to: `${base}/admin` }
      : null;

  return (
    <Box sx={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backdropFilter: "blur(10px)",
          backgroundColor: "rgba(18,18,18,0.75)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ minHeight: 64, gap: 1 }}>
            {/* Mobile: menu */}
            <IconButton
              onClick={() => setOpen(true)}
              sx={{ display: { xs: "inline-flex", sm: "none" } }}
              color="inherit"
              aria-label="menu"
            >
              <MenuIcon />
            </IconButton>

            <Typography
              component={RouterLink}
              to={base}
              sx={{
                textDecoration: "none",
                color: "inherit",
                fontWeight: 800,
                letterSpacing: 1,
                mr: 1,
                flexGrow: { xs: 1, sm: 0 },
              }}
            >
              HOSTLY
            </Typography>

            {/* Desktop: links */}
            <Stack
              direction="row"
              spacing={1}
              sx={{ display: { xs: "none", sm: "flex" }, ml: 1 }}
            >
              {links.map((l) => (
                <Button
                  key={l.to}
                  component={RouterLink}
                  to={l.to}
                  color="inherit"
                  sx={{
                    textTransform: "none",
                    borderRadius: 999,
                    px: 1.5,
                    opacity: 0.95,
                  }}
                >
                  {l.label}
                </Button>
              ))}
              {adminLink && (
                <Button
                  component={RouterLink}
                  to={adminLink.to}
                  color="inherit"
                  sx={{ textTransform: "none", borderRadius: 999, px: 1.5 }}
                >
                  {adminLink.label}
                </Button>
              )}
            </Stack>

            <Box sx={{ flexGrow: 1 }} />

            <LanguageSwitcher />
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile drawer */}
      <Drawer
        anchor="left"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: {
            width: 300,
            backgroundColor: "#0f0f10",
            color: "white",
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography sx={{ fontWeight: 900, letterSpacing: 1 }}>HOSTLY</Typography>
          <Typography sx={{ opacity: 0.7, mt: 0.5, fontSize: 13 }}>
            {slugFromUrl}
          </Typography>
        </Box>
        <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />
        <List>
          {links.map((l) => (
            <ListItemButton
              key={l.to}
              component={RouterLink}
              to={l.to}
              onClick={() => setOpen(false)}
            >
              <ListItemText primary={l.label} />
            </ListItemButton>
          ))}
          {adminLink && (
            <ListItemButton
              component={RouterLink}
              to={adminLink.to}
              onClick={() => setOpen(false)}
            >
              <ListItemText primary={adminLink.label} />
            </ListItemButton>
          )}
        </List>
        <Box sx={{ mt: "auto", p: 2, opacity: 0.7, fontSize: 12 }}>
          © {new Date().getFullYear()} HOSTLY. {t("footer.rights")}
        </Box>
      </Drawer>

      {/* Content */}
      <Box component="main" sx={{ flex: 1, overflowX: "hidden" }}>
        <Outlet />
      </Box>

      {/* Footer (simple + mobile friendly) */}
      <Box
        component="footer"
        sx={{
          borderTop: "1px solid rgba(0,0,0,0.08)",
          background: "rgba(255,255,255,0.7)",
        }}
      >
        <Container maxWidth="lg" sx={{ py: 2 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
          >
            <Typography sx={{ fontSize: 13, opacity: 0.8 }}>
              © {new Date().getFullYear()} HOSTLY. {t("footer.rights")}
            </Typography>

            <Stack direction="row" spacing={2} sx={{ fontSize: 13 }}>
              <Typography component={RouterLink} to={`${base}/terms`} sx={{ textDecoration: "none" }}>
                {t("footer.terms")}
              </Typography>
              <Typography component={RouterLink} to={`${base}/privacy`} sx={{ textDecoration: "none" }}>
                {t("footer.privacy")}
              </Typography>
            </Stack>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
};