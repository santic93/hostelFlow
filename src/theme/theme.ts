import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    primary: {
      main: "#730202",
    },
    background: {
      default: "#F4F1EE",
    },
  },
typography: {
  fontFamily: "Inter, sans-serif",
  h1: {
    fontFamily: "Playfair Display, serif",
    fontWeight: 500,
    fontSize: "4.5rem",
    lineHeight: 1.1,
  },
  h2: {
    fontFamily: "Playfair Display, serif",
    fontWeight: 500,
  },
}
});