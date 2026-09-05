'use client';

import React from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import { useTheme } from './ThemeProvider';

// Deeply customized Light Theme for Nexora (Linear & Stripe-grade precision)
const nexoraLightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#4F46E5',
      light: '#6366F1',
      dark: '#4338CA',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#7C3AED',
      light: '#8B5CF6',
      dark: '#6D28D9',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F8FAFC',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#0F172A',
      secondary: '#475467',
      disabled: '#94A3B8',
    },
    divider: '#E2E8F0',
    error: {
      main: '#EF4444',
      light: '#FEE2E2',
      dark: '#DC2626',
    },
    warning: {
      main: '#F59E0B',
      light: '#FEF3C7',
      dark: '#D97706',
    },
    info: {
      main: '#0EA5E9',
      light: '#E0F2FE',
      dark: '#0284C7',
    },
    success: {
      main: '#10B981',
      light: '#D1FAE5',
      dark: '#059669',
    },
  },
  typography: {
    fontFamily: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'].join(','),
  },
  components: {
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: 16,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#FFFFFF',
          borderLeft: '1px solid #E5E7EB',
          boxShadow: '-4px 0 16px rgba(0, 0, 0, 0.04)',
        },
      },
    },
  },
});

// Sleek Dark Theme for Nexora (Obsidian, Glass, Linear/Raycast vibe)
const nexoraDarkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#6366F1',
      light: '#818CF8',
      dark: '#4F46E5',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#8B5CF6',
      light: '#A78BFA',
      dark: '#7C3AED',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#090D16',
      paper: '#111726',
    },
    text: {
      primary: '#F8FAFC',
      secondary: '#94A3B8',
      disabled: '#64748B',
    },
    divider: 'rgba(255, 255, 255, 0.08)',
    error: {
      main: '#EF4444',
      light: 'rgba(239, 68, 68, 0.2)',
      dark: '#DC2626',
    },
    warning: {
      main: '#F59E0B',
      light: 'rgba(245, 158, 11, 0.2)',
      dark: '#D97706',
    },
    info: {
      main: '#0EA5E9',
      light: 'rgba(14, 165, 233, 0.2)',
      dark: '#0284C7',
    },
    success: {
      main: '#10B981',
      light: 'rgba(16, 185, 129, 0.2)',
      dark: '#059669',
    },
  },
  typography: {
    fontFamily: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'].join(','),
  },
  components: {
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: '#111726',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 16,
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.08)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#111726',
          borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '-12px 0 32px rgba(0, 0, 0, 0.5)',
        },
      },
    },
  },
});

export function NexoraMuiTheme({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const muiTheme = theme === 'light' ? nexoraLightTheme : nexoraDarkTheme;

  return (
    <MuiThemeProvider theme={muiTheme}>
      {children}
    </MuiThemeProvider>
  );
}
