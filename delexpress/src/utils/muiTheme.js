import { createTheme } from "@mui/material/styles";

const headingFont = '"Plus Jakarta Sans", "Segoe UI", sans-serif';
const bodyFont = '"Poppins", "Segoe UI", sans-serif';

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
    fontFamily: bodyFont,
    h1: {
      fontFamily: headingFont,
      fontWeight: 800,
      letterSpacing: "-0.065em",
      lineHeight: 0.94,
    },
    h2: {
      fontFamily: headingFont,
      fontWeight: 800,
      letterSpacing: "-0.055em",
      lineHeight: 0.98,
    },
    h3: {
      fontFamily: headingFont,
      fontWeight: 800,
      letterSpacing: "-0.035em",
      lineHeight: 1.05,
    },
    h4: {
      fontFamily: headingFont,
      fontWeight: 700,
    },
    button: {
      textTransform: "none",
      fontWeight: 700,
      fontFamily: bodyFont,
    },
  },
  shape: {
    borderRadius: 18,
  },
});

export default theme;
