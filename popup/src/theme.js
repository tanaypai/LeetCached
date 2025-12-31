import { createTheme } from '@mui/material/styles';

// Tokyo Night Color Palette
const tokyoNight = {
  bg: '#1a1b26',
  bgDark: '#16161e',
  surface: '#24283b',
  surfaceHover: '#292e42',
  primary: '#7aa2f7',
  primaryHover: '#89b4fa',
  secondary: '#bb9af7',
  text: '#c0caf5',
  textMuted: '#9aa5ce',
  textDim: '#565f89',
  border: '#414868',
  green: '#9ece6a',
  cyan: '#7dcfff',
  orange: '#ff9e64',
  red: '#f7768e',
  yellow: '#e0af68',
  gold: '#efab4e',
};

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: tokyoNight.primary,
      light: tokyoNight.primaryHover,
    },
    secondary: {
      main: tokyoNight.secondary,
    },
    background: {
      default: tokyoNight.bg,
      paper: tokyoNight.surface,
    },
    text: {
      primary: tokyoNight.text,
      secondary: tokyoNight.textMuted,
      disabled: tokyoNight.textDim,
    },
    error: {
      main: tokyoNight.red,
    },
    warning: {
      main: tokyoNight.orange,
    },
    success: {
      main: tokyoNight.green,
    },
    info: {
      main: tokyoNight.cyan,
    },
    divider: tokyoNight.border,
  },
  typography: {
    fontFamily: '"JetBrains Mono", monospace',
    fontSize: 12,
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
    button: { textTransform: 'none' },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          width: 750,
          height: 580,
          maxHeight: 580,
          overflow: 'hidden',
          backgroundColor: tokyoNight.bg,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 600,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: `1px solid ${tokyoNight.border}`,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: 40,
          fontSize: 11,
          fontWeight: 500,
        },
      },
    },
  },
});

export { tokyoNight };
export default theme;
