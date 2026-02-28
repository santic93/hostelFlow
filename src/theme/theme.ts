import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    primary: { main: "#730202" },
    background: { default: "#F4F1EE" },
    text: { primary: "#111", secondary: "rgba(17,17,17,0.68)" },
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
    h1: {
      fontFamily: "Playfair Display, serif",
      fontWeight: 500,
      lineHeight: 1.05,
      fontSize: "clamp(2.25rem, 6vw, 4.6rem)", // ✅ responsive
      letterSpacing: -0.6,
    },
    h2: {
      fontFamily: "Playfair Display, serif",
      fontWeight: 500,
      lineHeight: 1.1,
      fontSize: "clamp(1.6rem, 4vw, 2.8rem)",
      letterSpacing: -0.4,
    },
    h5: { fontWeight: 800, letterSpacing: -0.2 },
    button: { textTransform: "none", fontWeight: 700 },
  },
  components: {
    MuiContainer: {
      defaultProps: { maxWidth: "lg" },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 999 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { borderRadius: 16 },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 18,
          border: "1px solid rgba(0,0,0,0.08)",
          boxShadow: "none",
        },
      },
    },
  },
});