'use client';

import React from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';

/**
 * Material UI bridged onto the Nexora tokens.
 *
 * MUI is used only for behaviour-heavy primitives — dialogs, drawers, menus,
 * popovers and tooltips (focus trapping, portals, scroll locking). Their
 * surfaces are painted with CSS variables so they follow the light and dark
 * token sets without MUI knowing which theme is active. Palette literals below
 * only feed MUI's internal colour maths and mirror the light tokens.
 */
const surfacePaper = {
  backgroundColor: 'var(--nx-surface)',
  backgroundImage: 'none',
  color: 'var(--nx-ink)',
  border: '1px solid var(--nx-line)',
};

const nexoraTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#26375F', contrastText: '#F7F8FB' },
    secondary: { main: '#4B4E46', contrastText: '#FFFFFF' },
    error: { main: '#B23A2E' },
    warning: { main: '#8E560C' },
    success: { main: '#286C49' },
    info: { main: '#4A5F9A' },
    background: { default: '#F2F2EE', paper: '#FFFFFF' },
    text: { primary: '#1B1C19', secondary: '#4B4E46', disabled: '#6A6D64' },
    divider: '#E2E2DB',
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: 'var(--nx-font-sans)',
    button: { textTransform: 'none', fontWeight: 500 },
  },
  components: {
    MuiBackdrop: {
      styleOverrides: {
        root: {
          backgroundColor: 'var(--nx-scrim)',
          '&.MuiBackdrop-invisible': { backgroundColor: 'transparent' },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          ...surfacePaper,
          borderRadius: 14,
          boxShadow: 'var(--nx-shadow-3)',
          margin: 16,
          width: 'calc(100% - 32px)',
          overflow: 'hidden',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          ...surfacePaper,
          border: 'none',
          borderLeft: '1px solid var(--nx-line)',
          boxShadow: 'var(--nx-shadow-3)',
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: { ...surfacePaper, borderRadius: 12, boxShadow: 'var(--nx-shadow-2)' },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: { ...surfacePaper, borderRadius: 10, boxShadow: 'var(--nx-shadow-2)', minWidth: 180 },
        list: { padding: 4 },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: '0.8125rem',
          borderRadius: 6,
          minHeight: 34,
          gap: 8,
          color: 'var(--nx-ink)',
          '&:hover': { backgroundColor: 'var(--nx-surface-3)' },
          '&.Mui-focusVisible': { backgroundColor: 'var(--nx-surface-3)' },
          '&.Mui-selected, &.Mui-selected:hover': { backgroundColor: 'var(--nx-accent-soft)' },
        },
      },
    },
    MuiTooltip: {
      defaultProps: { enterDelay: 400, arrow: false },
      styleOverrides: {
        tooltip: {
          backgroundColor: 'var(--nx-ink)',
          color: 'var(--nx-canvas)',
          fontSize: '0.75rem',
          fontWeight: 500,
          borderRadius: 6,
          padding: '5px 8px',
        },
      },
    },
    MuiButtonBase: {
      defaultProps: { disableRipple: true },
      styleOverrides: {
        root: {
          '&.Mui-focusVisible': { outline: 'none', boxShadow: 'var(--nx-focus-ring)' },
        },
      },
    },
    MuiCircularProgress: {
      defaultProps: { color: 'inherit' },
    },
  },
});

export function NexoraMuiTheme({ children }: { children: React.ReactNode }) {
  return <MuiThemeProvider theme={nexoraTheme}>{children}</MuiThemeProvider>;
}
