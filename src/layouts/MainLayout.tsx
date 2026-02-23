import { Outlet, Link as RouterLink, useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
} from "@mui/material";
import { useAuth } from "../context/AuthContext";

export const MainLayout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  return (
    <>
      <AppBar
        position="static"
        elevation={0}
        sx={{
          backgroundColor: "transparent",
          borderBottom: "1px solid #D6CEC9",
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ py: 2 }}>
            <Typography
              component={RouterLink}
              to="/"
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
              <Button component={RouterLink} to="/rooms" style={{color:"#ab003c"}}>
             
                ROOMS
              </Button>

              
              <Button component={RouterLink} to="/contact" style={{color:"#ab003c"}}>
                CONTACT
              </Button>

              <Button
                variant="contained"
                component={RouterLink}
                to="/booking"
                sx={{
                  ml: 2,
                  px: 3,
                }}
              >
                BOOK YOUR STAY
              </Button>
              {user && (
  <Button onClick={() => navigate("/admin")}>
    Admin
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