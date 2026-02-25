import { AppBar, Box, Button, Container, Toolbar, Typography } from "@mui/material";
import { Link as RouterLink, Outlet, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";



export const MainLayout = () => {
  const { user, role, hostelSlug } = useAuth();
  const { hostelSlug: slugFromUrl } = useParams<{ hostelSlug: string }>();

  // ✅ nunca return null: esto es layout público del tenant
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
              to={`/${slugFromUrl}`} // ✅ home del tenant
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
                ROOMS
              </Button>

              {/* Si todavía no tenés contact, dejalo al home */}
              <Button component={RouterLink} to={`/${slugFromUrl}`} style={{ color: "#ab003c" }}>
                CONTACT
              </Button>

              {/* booking se hace desde una room -> llevamos a rooms */}
              <Button
                variant="contained"
                component={RouterLink}
                to={`/${slugFromUrl}/rooms`}
                sx={{ ml: 2, px: 3 }}
              >
                BOOK YOUR STAY
              </Button>

              {/* ✅ Admin solo si realmente es admin */}
              {user && role === "admin" && hostelSlug && (
                <Button component={RouterLink} to={`/${hostelSlug}/admin`}>
                  Admin / {hostelSlug}
                </Button>
              )}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      <Container maxWidth="lg">
        <Box py={8}>
          <Outlet />
        </Box>
      </Container>
    </>
  );
};