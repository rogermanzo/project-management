import { ThemeOptions } from '@mui/material/styles';

export const lightTheme: ThemeOptions = {
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2', // Un azul estándar para el modo claro
    },
    secondary: {
      main: '#dc004e', // Un rosa para acentos
    },
    background: {
      default: '#f4f6f8',
      paper: '#ffffff',
    },
    text: {
      primary: '#121212',
      secondary: '#546e7a',
    },
  },
};
