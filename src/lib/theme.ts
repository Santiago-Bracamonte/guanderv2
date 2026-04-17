import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#3D52D5',
      light: '#6474DD',
      dark: '#2B3A9B',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#43D696',
      light: '#7DE5B8',
      dark: '#2DB87E',
      contrastText: '#1a1b3c',
    },
    background: {
      default: '#f8f9fd',
      paper: '#ffffff',
    },
    text: {
      primary: '#1a1b3c',
      secondary: '#5a6280',
    },
  },
  typography: {
    fontFamily: 'var(--font-geist-sans), Arial, Helvetica, sans-serif',
    h1: { fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.1 },
    h2: { fontWeight: 800, letterSpacing: '-0.015em' },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 700 },
  },
  shape: { borderRadius: 16 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '50px',
          textTransform: 'none',
          fontWeight: 700,
          paddingLeft: '24px',
          paddingRight: '24px',
        },
        sizeLarge: {
          paddingTop: '12px',
          paddingBottom: '12px',
          fontSize: '0.8125rem',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '20px',
          boxShadow: '0 2px 16px rgba(61,82,213,0.07)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '50px',
          fontWeight: 700,
          fontSize: '0.7rem',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: '50px' },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { borderRadius: '20px' },
      },
    },
  },
});

export default theme;
