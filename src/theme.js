import { createTheme } from '@mui/material/styles';

const myTheme = createTheme({
  colors: {
    primary: "#2563eb",   // blue
    secondary: "#10b981", // green
    background: {
      default: "#f5f7fb",
    },
  },
  typography: {
    families: {
      sansSerif: "Inter, Arial, sans-serif",
    },
  },
});

export default myTheme;
