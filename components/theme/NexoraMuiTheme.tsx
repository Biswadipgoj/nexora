'use client';

import React from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';

/**
 * Material UI bridged onto the Nexora luminous light luxury system.
 *
 * MUI resolves palette colours through its own manipulators (alpha, lighten,
 * darken), which cannot read CSS custom properties, so the literals below are
 * mirrored from styles/nexora-tokens.css.
 */
const nexoraLightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2563EB', // --nx-blue
      light: '#60A5FA',
      dark: '#1D4ED8',
      contrastText: '#FFFFFF', // --nx-on-accent
    },
    secondary: {
      main: '#7C3AED', // --nx-violet
      light: '#A78BFA',
      dark: '#5B21B6',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F8FAFC', // --nx-bg
      paper: '#FFFFFF', // --nx-surface
    },
    text: {
      primary: '#0F172A', // --nx-text
      secondary: '#334155', // --nx-text-2
      disabled: '#64748B', // --nx-text-3
    },
    divider: 'rgba(15, 23, 42, 0.08)', // --nx-border
    error: { main: '#E11D48', contrastText: '#FFFFFF' }, // --nx-red
    warning: { main: '#D97706', contrastText: '#FFFFFF' }, // --nx-amber
    info: { main: '#0891B2', contrastText: '#FFFFFF' }, // --nx-cyan
    success: { main: '#059669', contrastText: '#FFFFFF' }, // --nx-green
  },
  shape: {
    borderRadius: 12, // --nx-radius-card
  },
  typography: {
    fontFamily: 'var(--nx-font-sans)',
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundImage: 'linear-gradient(145deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.99))',
          border: '1px solid rgba(15, 23, 42, 0.12)',
          borderRadius: 16,
          backdropFilter: 'blur(20px) saturate(140%)',
          boxShadow: '0 18px 50px rgba(15, 23, 42, 0.12), 0 32px 80px rgba(15, 23, 42, 0.16)',
          color: '#0F172A',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundImage: 'linear-gradient(145deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.99))',
          borderLeft: '1px solid rgba(15, 23, 42, 0.08)',
          boxShadow: '-18px 0 50px rgba(15, 23, 42, 0.10)',
          color: '#0F172A',
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundImage: 'linear-gradient(145deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.99))',
          border: '1px solid rgba(15, 23, 42, 0.12)',
          borderRadius: 12,
          backdropFilter: 'blur(20px)',
          boxShadow: '0 18px 50px rgba(15, 23, 42, 0.10)',
          color: '#0F172A',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#0F172A',
          border: '1px solid rgba(255, 255, 255, 0.10)',
          color: '#FFFFFF',
          fontSize: '0.75rem',
          fontWeight: 500,
          borderRadius: 8,
        },
        arrow: { color: '#0F172A' },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          borderRadius: 8,
          '& fieldset': { borderColor: 'rgba(15, 23, 42, 0.12)' },
          '&:hover fieldset': { borderColor: 'rgba(15, 23, 42, 0.24)' },
          '&.Mui-focused fieldset': { borderColor: '#2563EB', borderWidth: 1.5 },
        },
        input: {
          color: '#0F172A',
          '&::placeholder': { color: '#64748B', opacity: 1 },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: '#64748B',
          '&.Mui-focused': { color: '#2563EB' },
        },
      },
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: { marginLeft: 2, fontSize: '0.75rem' },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 8, fontSize: '0.8125rem' },
        colorError: {
          '&.MuiAlert-standard': {
            backgroundColor: 'rgba(225, 29, 72, 0.10)',
            border: '1px solid rgba(225, 29, 72, 0.25)',
            color: '#E11D48',
          },
        },
        colorSuccess: {
          '&.MuiAlert-standard': {
            backgroundColor: 'rgba(5, 150, 105, 0.10)',
            border: '1px solid rgba(5, 150, 105, 0.25)',
            color: '#059669',
          },
        },
        colorInfo: {
          '&.MuiAlert-standard': {
            backgroundColor: 'rgba(8, 145, 178, 0.10)',
            border: '1px solid rgba(8, 145, 178, 0.25)',
            color: '#0891B2',
          },
        },
      },
    },
    MuiButtonBase: {
      styleOverrides: {
        root: {
          '&.Mui-focusVisible': {
            outline: 'none',
            boxShadow: '0 0 0 2px #F8FAFC, 0 0 0 4px #2563EB',
          },
        },
      },
    },
  },
});

export function NexoraMuiTheme({ children }: { children: React.ReactNode }) {
  return <MuiThemeProvider theme={nexoraLightTheme}>{children}</MuiThemeProvider>;
}
