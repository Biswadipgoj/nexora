'use client';

import React from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';

// Prismatic Aurora Material UI Theme (Anti-Flat, Non-Dark, Non-White, Colorful 3D Crystal)
const nexoraPrismaticTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2563EB',
      light: '#3B82F6',
      dark: '#1D4ED8',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#4F46E5',
      light: '#6366F1',
      dark: '#4338CA',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#DBE4F2',
      paper: 'rgba(255, 255, 255, 0.88)',
    },
    text: {
      primary: '#0F172A',
      secondary: '#1E293B',
      disabled: '#64748B',
    },
    divider: 'rgba(20, 15, 60, 0.1)',
    error: {
      main: '#DC2626',
      light: '#EF4444',
      dark: '#B91C1C',
    },
    warning: {
      main: '#D97706',
      light: '#FBBF24',
      dark: '#B45309',
    },
    info: {
      main: '#0284C7',
      light: '#38BDF8',
      dark: '#0369A1',
    },
    success: {
      main: '#059669',
      light: '#34D399',
      dark: '#047857',
    },
  },
  typography: {
    fontFamily: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'].join(','),
  },
  components: {
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: 'rgba(255, 255, 255, 0.92)',
          border: '1px solid rgba(255, 255, 255, 0.9)',
          borderRadius: 20,
          backdropFilter: 'blur(28px) saturate(220%)',
          boxShadow: '0 24px 60px rgba(20, 15, 60, 0.25), inset 0 1.5px 0 #ffffff',
          color: '#0F172A',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: 'rgba(255, 255, 255, 0.92)',
          borderLeft: '1px solid rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(28px) saturate(220%)',
          boxShadow: '-12px 0 36px rgba(20, 15, 60, 0.2), inset 0 1.5px 0 #ffffff',
          color: '#0F172A',
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: 'rgba(255, 255, 255, 0.92)',
          border: '1px solid rgba(255, 255, 255, 0.9)',
          borderRadius: 12,
          backdropFilter: 'blur(24px)',
          boxShadow: '0 12px 32px rgba(20, 15, 60, 0.2), inset 0 1px 0 #ffffff',
          color: '#0F172A',
        },
      },
    },
  },
});

export function NexoraMuiTheme({ children }: { children: React.ReactNode }) {
  return (
    <MuiThemeProvider theme={nexoraPrismaticTheme}>
      {children}
    </MuiThemeProvider>
  );
}
