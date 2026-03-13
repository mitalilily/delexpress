import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#8a1f43",
      dark: "#61142f",
      light: "#b74a6f",
    },
    secondary: {
      main: "#151218",
    },
    background: {
      default: "#f6f2ec",
      paper: "#ffffff",
    },
    text: {
      primary: "#171419",
      secondary: "#5f5862",
    },
  },
  typography: {
    fontFamily: '"IBM Plex Sans", "Segoe UI", sans-serif',
    h1: {
      fontWeight: 700,
      letterSpacing: "-0.045em",
    },
    h2: {
      fontWeight: 700,
      letterSpacing: "-0.035em",
    },
    h3: {
      fontWeight: 600,
      letterSpacing: "-0.02em",
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
      letterSpacing: "-0.01em",
    },
  },
  shape: {
    borderRadius: 18,
  },
});

export default theme;
