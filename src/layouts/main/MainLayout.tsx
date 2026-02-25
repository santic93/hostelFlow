import { AppBar, Box, Button, Container, Toolbar, Typography } from "@mui/material";
import { Link as RouterLink, Outlet, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import LanguageSwitcher from "../../components/LanguageSwitcher";



import { useTranslation } from "react-i18next";

export const MainLayout = () => {
  const { user, role, hostelSlug } = useAuth();
  const { hostelSlug: slugFromUrl } = useParams<{ hostelSlug: string }>();
  const { t } = useTranslation();

  if (!slugFromUrl) return <Outlet />;

  return (
    <>
      <AppBar
        position="static"
        elevation={0}
        sx={{ backgroundColor: "transparent", borderBottom: "1px solid #D6CEC9" }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ py: 2 }}>
            <Typography
              component={RouterLink}
              to={`/${slugFromUrl}`}
              sx={{
                textDecoration: "none",
                color: "#730202",
                fontFamily: "Playfair Display",
                fontSize: "1.8rem",
                flexGrow: 1,
              }}
            >
              REDSTAYS
            </Typography>

            <Box sx={{ display: "flex", gap: 4, alignItems: "center" }}>
              <Button component={RouterLink} to={`/${slugFromUrl}/rooms`} style={{ color: "#ab003c" }}>
                {t("nav.rooms")}
              </Button>

              <Button component={RouterLink} to={`/${slugFromUrl}`} style={{ color: "#ab003c" }}>
                {t("nav.contact")}
              </Button>

              <Button
                variant="contained"
                component={RouterLink}
                to={`/${slugFromUrl}/rooms`}
                sx={{ ml: 2, px: 3 }}
              >
                {t("nav.book")}
              </Button>

              {user && role === "admin" && hostelSlug && (
                <Button component={RouterLink} to={`/${hostelSlug}/admin`}>
                  {t("nav.admin")} / {hostelSlug}
                </Button>
              )}

              <LanguageSwitcher />
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      <Container maxWidth="lg">
        <Box py={8}>
          <Outlet />

          <Box component="footer" sx={{ borderTop: "1px solid #D6CEC9", py: 4, mt: 8 }}>
            <Container
              maxWidth="lg"
              sx={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}
            >
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                © {new Date().getFullYear()} REDSTAYS. {t("footer.rights")}
              </Typography>

              <Box sx={{ display: "flex", gap: 2 }}>
                <Button component={RouterLink} to={`/${slugFromUrl}/terms`} size="small">
                  {t("footer.terms")}
                </Button>
                <Button component={RouterLink} to={`/${slugFromUrl}/privacy`} size="small">
                  {t("footer.privacy")}
                </Button>
              </Box>
            </Container>
          </Box>
        </Box>
      </Container>
    </>
  );
};