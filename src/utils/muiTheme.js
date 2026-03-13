import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#9b3150",
    },
    secondary: {
      main: "#181318",
    },
    background: {
      default: "#f7f1ea",
      paper: "#ffffff",
    },
    text: {
      primary: "#1d171c",
      secondary: "#5e5860",
    },
  },
  typography: {
    fontFamily: '"Manrope", "Segoe UI", sans-serif',
    h1: {
      fontWeight: 700,
      letterSpacing: "-0.06em",
      lineHeight: 0.96,
    },
    h2: {
      fontWeight: 700,
      letterSpacing: "-0.05em",
      lineHeight: 1,
    },
    h3: {
      fontWeight: 700,
      letterSpacing: "-0.03em",
    },
    button: {
      textTransform: "none",
      fontWeight: 700,
    },
  },
  shape: {
    borderRadius: 18,
  },
});

export default theme;
