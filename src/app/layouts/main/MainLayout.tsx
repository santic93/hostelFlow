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
import { NavLink, Outlet, useParams } from "react-router-dom";
import LanguageSwitcher from "../../../components/LanguageSwitcher";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../providers/AuthContext";

type NavItem = {
  label: string;
  to: string;
  variant?: "text" | "contained" | "outlined";
};

export const MainLayout = () => {
  const { user, hostelSlug, canAccessAdmin } = useAuth();
  const { hostelSlug: slugFromUrl } = useParams<{ hostelSlug: string }>();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  if (!slugFromUrl) return null;

  const base = `/${slugFromUrl}`;
  const closeDrawer = () => setOpen(false);

  const links = useMemo<NavItem[]>(
    () => [
      { label: t("nav.rooms"), to: `${base}/rooms`, variant: "text" },
    ],
    [t, base]
  );

  const adminLink: NavItem | null =
    user && canAccessAdmin && hostelSlug
      ? { label: t("nav.admin"), to: `${base}/admin`, variant: "outlined" }
      : null;

  return (
    <Box sx={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          backdropFilter: "blur(14px)",
          backgroundColor: "rgba(20,17,15,0.72)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          color: "white",
        }}
      >
        <Container>
          <Toolbar disableGutters sx={{ minHeight: 72, gap: 1, px: { xs: 1, sm: 0 } }}>
            <IconButton
              onClick={() => setOpen(true)}
              sx={{ display: { xs: "inline-flex", sm: "none" }, color: "inherit" }}
              aria-label="menu"
            >
              <MenuIcon />
            </IconButton>

            <Typography
              component={NavLink}
              to={base}
              onClick={closeDrawer}
              sx={{
                textDecoration: "none",
                color: "inherit",
                fontWeight: 900,
                letterSpacing: 1.5,
                mr: 1,
                flexGrow: { xs: 1, sm: 0 },
                fontSize: 14,
              }}
            >
              HOSTLY
            </Typography>

            <Stack
              direction="row"
              spacing={1}
              sx={{
                display: { xs: "none", sm: "flex" },
                ml: 1,
                alignItems: "center",
              }}
            >
              {links.map((l) => (
                <Button
                  key={l.to + l.label}
                  component={NavLink}
                  to={l.to}
                  end={l.to === base}
                  variant={l.variant ?? "text"}
                  sx={{
                    color: "white",
                    px: 1.4,
                    borderRadius: 999,
                    textTransform: "none",
                    fontWeight: 800,
                    opacity: 0.92,
                    "&.active": {
                      backgroundColor: "rgba(255,255,255,0.10)",
                    },
                  }}
                >
                  {l.label}
                </Button>
              ))}

              {adminLink && (
                <Button
                  component={NavLink}
                  to={adminLink.to}
                  variant="outlined"
                  sx={{
                    px: 1.5,
                    borderRadius: 999,
                    textTransform: "none",
                    fontWeight: 800,
                    borderColor: "rgba(255,255,255,0.30)",
                    color: "white",
                    "&:hover": { borderColor: "rgba(255,255,255,0.55)" },
                    "&.active": { backgroundColor: "rgba(255,255,255,0.10)" },
                  }}
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

      <Toolbar sx={{ minHeight: "72px !important" }} />

      <Drawer
        anchor="left"
        open={open}
        onClose={closeDrawer}
        PaperProps={{
          sx: {
            width: 300,
            background:
              "linear-gradient(180deg, #171310 0%, #1E1814 100%)",
            color: "white",
          },
        }}
      >
        <Box sx={{ p: 2.25 }}>
          <Typography sx={{ fontWeight: 900, letterSpacing: 1.5 }}>HOSTLY</Typography>
          <Typography sx={{ opacity: 0.72, mt: 0.5, fontSize: 13 }}>{slugFromUrl}</Typography>
        </Box>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

        <List sx={{ py: 0.75 }}>
          {links.map((l) => (
            <ListItemButton
              key={l.to + l.label}
              component={NavLink}
              to={l.to}
              onClick={closeDrawer}
              sx={{
                borderRadius: 2.5,
                mx: 1,
                my: 0.5,
                "&.active": { backgroundColor: "rgba(255,255,255,0.10)" },
              }}
            >
              <ListItemText
                primary={l.label}
                primaryTypographyProps={{ fontWeight: 800 }}
              />
            </ListItemButton>
          ))}

          {adminLink && (
            <>
              <Divider sx={{ my: 1.2, borderColor: "rgba(255,255,255,0.08)" }} />
              <ListItemButton
                component={NavLink}
                to={adminLink.to}
                onClick={closeDrawer}
                sx={{
                  borderRadius: 2.5,
                  mx: 1,
                  my: 0.5,
                  "&.active": { backgroundColor: "rgba(255,255,255,0.10)" },
                }}
              >
                <ListItemText
                  primary={adminLink.label}
                  primaryTypographyProps={{ fontWeight: 800 }}
                />
              </ListItemButton>
            </>
          )}
        </List>
      </Drawer>

      <Box component="main" sx={{ flex: 1, overflowX: "hidden" }}>
        <Outlet />
      </Box>

      <Box
        component="footer"
        sx={{
          borderTop: "1px solid rgba(22,19,17,0.08)",
          background: "rgba(255,253,249,0.82)",
          backdropFilter: "blur(8px)",
        }}
      >
        <Container sx={{ py: 2.5 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
          >
            <Typography sx={{ fontSize: 13, opacity: 0.8 }}>
              © {new Date().getFullYear()} HOSTLY.
            </Typography>

            <Stack direction="row" spacing={2} sx={{ fontSize: 13 }}>
              <Typography component={NavLink} to={`${base}/terms`} style={{ textDecoration: "none" }}>
                {t("footer.terms")}
              </Typography>
              <Typography component={NavLink} to={`${base}/privacy`} style={{ textDecoration: "none" }}>
                {t("footer.privacy")}
              </Typography>
            </Stack>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
};