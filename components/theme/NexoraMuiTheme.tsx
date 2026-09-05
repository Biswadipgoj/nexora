'use client';

import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Deeply customized Light Theme for Nexora (Linear & Stripe-grade precision)
const nexoraLightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#4F46E5', // Electric Indigo
      light: '#6366F1',
      dark: '#4338CA',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#7C3AED', // Vivid Violet
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
    h1: {
      fontFamily: ['Outfit', 'Inter', 'sans-serif'].join(','),
      fontWeight: 700,
      letterSpacing: '-0.02em',
      color: '#0F172A',
    },
    h2: {
      fontFamily: ['Outfit', 'Inter', 'sans-serif'].join(','),
      fontWeight: 700,
      letterSpacing: '-0.015em',
      color: '#0F172A',
    },
    h3: {
      fontFamily: ['Outfit', 'Inter', 'sans-serif'].join(','),
      fontWeight: 600,
      letterSpacing: '-0.01em',
      color: '#0F172A',
    },
    h4: {
      fontFamily: ['Outfit', 'Inter', 'sans-serif'].join(','),
      fontWeight: 600,
      color: '#0F172A',
    },
    button: {
      fontFamily: ['Inter', 'sans-serif'].join(','),
      fontWeight: 600,
      textTransform: 'none',
      letterSpacing: '0.01em',
    },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          fontSize: '0.875rem',
          fontWeight: 600,
          transition: 'all 150ms cubic-bezier(0.16, 1, 0.3, 1)',
          '&:active': {
            transform: 'scale(0.98)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
          color: '#FFFFFF',
          boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)',
          '&:hover': {
            background: 'linear-gradient(135deg, #4338CA 0%, #6D28D9 100%)',
            boxShadow: '0 6px 20px rgba(79, 70, 229, 0.45)',
          },
        },
        outlined: {
          borderColor: 'rgba(99, 102, 241, 0.25)',
          color: '#4F46E5',
          backgroundColor: '#FFFFFF',
          '&:hover': {
            backgroundColor: '#EEF2FF',
            borderColor: '#4F46E5',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          border: '1px solid rgba(99, 102, 241, 0.12)',
          borderRadius: 14,
          boxShadow: '0 4px 14px -2px rgba(99, 102, 241, 0.08), 0 2px 4px -2px rgba(16, 24, 40, 0.04)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          fontSize: '0.75rem',
          borderRadius: 9999,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#0F172A',
          color: '#FFFFFF',
          fontSize: '0.6875rem',
          fontWeight: 500,
          borderRadius: 6,
          padding: '4px 8px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        },
      },
    },
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

export function NexoraMuiTheme({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={nexoraLightTheme}>
      {children}
    </ThemeProvider>
  );
}
