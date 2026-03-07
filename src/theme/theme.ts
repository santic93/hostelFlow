import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    primary: { main: "#7C3A2D" },
    secondary: { main: "#1F3B37" },
    background: {
      default: "#F6F1EA",
      paper: "#FFFDF9",
    },
    text: {
      primary: "#161311",
      secondary: "rgba(22,19,17,0.72)",
    },
    divider: "rgba(22,19,17,0.10)",
  },
  shape: { borderRadius: 18 },
  typography: {
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
    h1: {
      fontFamily: "Playfair Display, serif",
      fontWeight: 600,
      lineHeight: 0.98,
      fontSize: "clamp(2.7rem, 7vw, 5.6rem)",
      letterSpacing: -1.2,
    },
    h2: {
      fontFamily: "Playfair Display, serif",
      fontWeight: 600,
      lineHeight: 1.04,
      fontSize: "clamp(2rem, 5vw, 3.6rem)",
      letterSpacing: -0.8,
    },
    h5: {
      fontWeight: 800,
      letterSpacing: -0.3,
    },
    body1: {
      lineHeight: 1.7,
    },
    button: {
      textTransform: "none",
      fontWeight: 800,
      letterSpacing: -0.1,
    },
  },
  components: {
    MuiContainer: {
      defaultProps: { maxWidth: "lg" },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background:
            "radial-gradient(circle at top left, rgba(124,58,45,0.05), transparent 28%), radial-gradient(circle at top right, rgba(31,59,55,0.05), transparent 24%), #F6F1EA",
        },
        "::selection": {
          backgroundColor: "rgba(124,58,45,0.18)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          paddingInline: 18,
          minHeight: 44,
        },
        contained: {
          boxShadow: "none",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 20,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 22,
          border: "1px solid rgba(22,19,17,0.08)",
          boxShadow: "0 16px 40px rgba(22,19,17,0.04)",
          backgroundImage: "none",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          fontWeight: 800,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
  },
});