import { ThemeOptions } from '@mui/material/styles';

export const darkTheme: ThemeOptions = {
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9', // Un azul más claro para el modo oscuro
    },
    secondary: {
      main: '#f48fb1', // Un rosa más claro
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b0bec5',
    },
  },
};
