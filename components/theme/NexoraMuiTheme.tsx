'use client';

import React from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';

/**
 * Material UI bridged onto the Nexora obsidian system.
 *
 * MUI resolves palette colours through its own manipulators (alpha, lighten,
 * darken), which cannot read CSS custom properties, so the literals below are
 * mirrored from styles/nexora-tokens.css. When a token changes there, change
 * it here too — the token name is noted against each value.
 */
const nexoraDarkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#6EA8FF', // --nx-blue
      light: '#8FBEFF',
      dark: '#4A8BEE',
      contrastText: '#06111F', // --nx-on-accent
    },
    secondary: {
      main: '#9B8CFF', // --nx-violet
      light: '#B4A8FF',
      dark: '#7F6FEB',
      contrastText: '#06111F',
    },
    background: {
      default: '#080B12', // --nx-bg
      paper: '#121A27', // --nx-surface
    },
    text: {
      primary: '#F4F7FB', // --nx-text
      secondary: '#B9C5D6', // --nx-text-2
      disabled: '#7E8DA3', // --nx-text-3
    },
    divider: 'rgba(174, 205, 255, 0.14)', // --nx-border
    error: { main: '#FF7185', contrastText: '#06111F' }, // --nx-red
    warning: { main: '#F1B86A', contrastText: '#06111F' }, // --nx-amber
    info: { main: '#46D7E8', contrastText: '#06111F' }, // --nx-cyan
    success: { main: '#57D39A', contrastText: '#06111F' }, // --nx-green
  },
  shape: {
    borderRadius: 12, // --nx-radius-card
  },
  typography: {
    fontFamily: 'var(--nx-font-sans)',
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    // Section 4.2 — backdrop-filter is reserved for short-lived overlays.
    // Dialogs, drawers and menus qualify; persistent cards do not.
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundImage: 'linear-gradient(145deg, rgba(29, 43, 64, 0.98), rgba(18, 26, 39, 0.99))',
          border: '1px solid rgba(174, 205, 255, 0.28)',
          borderRadius: 16,
          backdropFilter: 'blur(20px) saturate(140%)',
          boxShadow: '0 18px 50px rgba(0, 0, 0, 0.28), 0 32px 80px rgba(0, 0, 0, 0.42)',
          color: '#F4F7FB',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundImage: 'linear-gradient(145deg, rgba(23, 34, 53, 0.98), rgba(13, 19, 30, 0.99))',
          borderLeft: '1px solid rgba(174, 205, 255, 0.14)',
          boxShadow: '-18px 0 50px rgba(0, 0, 0, 0.36)',
          color: '#F4F7FB',
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundImage: 'linear-gradient(145deg, rgba(29, 43, 64, 0.98), rgba(18, 26, 39, 0.99))',
          border: '1px solid rgba(174, 205, 255, 0.28)',
          borderRadius: 12,
          backdropFilter: 'blur(20px)',
          boxShadow: '0 18px 50px rgba(0, 0, 0, 0.28)',
          color: '#F4F7FB',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#1D2B40', // --nx-surface-3
          border: '1px solid rgba(174, 205, 255, 0.28)',
          color: '#F4F7FB',
          fontSize: '0.75rem',
          fontWeight: 500,
          borderRadius: 8,
        },
        arrow: { color: '#1D2B40' },
      },
    },
    // Text fields, styled once here so every form surface matches (section 3.5).
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: '#0E131D', // --nx-bg-raised
          borderRadius: 8, // --nx-radius-control
          '& fieldset': { borderColor: 'rgba(174, 205, 255, 0.14)' },
          '&:hover fieldset': { borderColor: 'rgba(174, 205, 255, 0.28)' },
          '&.Mui-focused fieldset': { borderColor: '#6EA8FF', borderWidth: 1.5 },
        },
        input: {
          color: '#F4F7FB',
          '&::placeholder': { color: '#7E8DA3', opacity: 1 },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: '#7E8DA3',
          '&.Mui-focused': { color: '#6EA8FF' },
        },
      },
    },
    MuiFormHelperText: {
      styleOverrides: {
        // Section 6.2 — inline validation appears below the field.
        root: { marginLeft: 2, fontSize: '0.75rem' },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 8, fontSize: '0.8125rem' },
        colorError: {
          '&.MuiAlert-standard': {
            backgroundColor: 'rgba(255, 113, 133, 0.14)', // --nx-red-soft
            border: '1px solid rgba(255, 113, 133, 0.34)',
            color: '#FF7185',
          },
        },
        colorSuccess: {
          '&.MuiAlert-standard': {
            backgroundColor: 'rgba(87, 211, 154, 0.14)',
            border: '1px solid rgba(87, 211, 154, 0.34)',
            color: '#57D39A',
          },
        },
        colorInfo: {
          '&.MuiAlert-standard': {
            backgroundColor: 'rgba(70, 215, 232, 0.14)',
            border: '1px solid rgba(70, 215, 232, 0.34)',
            color: '#46D7E8',
          },
        },
      },
    },
    // Section 9 — every primary control needs a visible focus ring.
    MuiButtonBase: {
      styleOverrides: {
        root: {
          '&.Mui-focusVisible': {
            outline: 'none',
            boxShadow: '0 0 0 2px #080B12, 0 0 0 4px #6EA8FF',
          },
        },
      },
    },
  },
});

export function NexoraMuiTheme({ children }: { children: React.ReactNode }) {
  return <MuiThemeProvider theme={nexoraDarkTheme}>{children}</MuiThemeProvider>;
}
