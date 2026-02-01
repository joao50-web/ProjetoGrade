import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#0B3A4A'
    },
    secondary: {
      main: '#D6A44C'
    },
    background: {
      default: '#EAF2F6',
      paper: '#FFFFFF'
    },
    text: {
      primary: '#1E2A32'
    }
  },
  typography: {
    fontFamily: 'Inter, Roboto, Arial, sans-serif',
    h5: {
      fontWeight: 600
    }
  },
  shape: {
    borderRadius: 8
  }
});

export default theme;
