import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#8a1f43",
    },
    secondary: {
      main: "#131118",
    },
    background: {
      default: "#f8f5f1",
      paper: "#ffffff",
    },
    text: {
      primary: "#17141a",
      secondary: "#5d5761",
    },
  },
  typography: {
    fontFamily: '"Source Sans 3", "Segoe UI", sans-serif',
    h1: {
      fontWeight: 500,
      letterSpacing: "-0.045em",
    },
    h2: {
      fontWeight: 500,
      letterSpacing: "-0.035em",
    },
    h3: {
      fontWeight: 600,
      letterSpacing: "-0.02em",
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 14,
  },
});

export default theme;
